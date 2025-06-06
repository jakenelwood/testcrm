#!/bin/bash

# 🔧 Fix TwinCiGo CRM Deployment Issues
# Addresses issues found in initial deployment attempt
# Author: TwinCiGo CRM Team

set -euo pipefail

# Node configuration
declare -A NODES=(
    ["west-1"]="5.78.103.224"
    ["east-1"]="5.161.110.205" 
    ["east-2"]="178.156.186.10"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Install Docker on remaining nodes
install_docker_remaining_nodes() {
    log "🐳 Installing Docker on remaining nodes..."

    for node in west-1 east-2; do
        ip="${NODES[$node]}"
        log "Installing Docker on $node ($ip)..."

        ssh root@"$ip" "
            # Update package list
            apt-get update &&

            # Install prerequisites
            apt-get install -y ca-certificates curl gnupg lsb-release &&

            # Add Docker GPG key
            mkdir -p /etc/apt/keyrings &&
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg &&

            # Add Docker repository
            echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable\" | tee /etc/apt/sources.list.d/docker.list > /dev/null &&

            # Install Docker with compose plugin
            apt-get update &&
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin &&

            # Install standalone docker-compose for compatibility
            curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose &&
            chmod +x /usr/local/bin/docker-compose &&

            # Enable and start Docker
            systemctl enable docker &&
            systemctl start docker &&

            # Verify both commands work
            docker compose version &&
            docker-compose version
        "

        success "Docker installed on $node"
    done
}

# Copy deployment files to all nodes
copy_deployment_files() {
    log "📁 Copying deployment files to all nodes..."
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        log "Copying files to $node ($ip)..."
        
        # Create deployment directory
        ssh root@"$ip" "mkdir -p /opt/twincigo-crm/scripts"
        
        # Copy essential files
        scp -o StrictHostKeyChecking=no deployment/docker-compose.yml root@"$ip":/opt/twincigo-crm/
        scp -o StrictHostKeyChecking=no deployment/.env.development root@"$ip":/opt/twincigo-crm/.env
        scp -o StrictHostKeyChecking=no database/schema/twincigo_crm_complete_schema.sql root@"$ip":/opt/twincigo-crm/schema.sql
        
        # Copy scripts
        scp -o StrictHostKeyChecking=no scripts/monitor-cluster-health.sh root@"$ip":/opt/twincigo-crm/scripts/
        scp -o StrictHostKeyChecking=no scripts/cluster-status.sh root@"$ip":/opt/twincigo-crm/scripts/
        
        # Make scripts executable
        ssh root@"$ip" "chmod +x /opt/twincigo-crm/scripts/*.sh"
        
        success "Files copied to $node"
    done
}

# Update environment variables for each node
update_node_environment() {
    log "⚙️  Updating node-specific environment variables..."
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        log "Updating environment for $node..."
        
        ssh root@"$ip" "
            cd /opt/twincigo-crm &&
            
            # Add node-specific variables
            echo '' >> .env &&
            echo '# Node-specific configuration' >> .env &&
            echo 'NODE_NAME=$node' >> .env &&
            echo 'NODE_IP=$ip' >> .env &&
            
            # Update Patroni node name
            sed -i 's/PATRONI_NAME=.*/PATRONI_NAME=$node/' .env
        "
        
        success "Environment updated for $node"
    done
}

# Start etcd cluster
start_etcd_cluster() {
    log "🔧 Starting etcd cluster..."

    # Start etcd only on the primary node (west-1) for simplicity
    local primary_node="west-1"
    local primary_ip="${NODES[$primary_node]}"
    log "Starting etcd on $primary_node..."

    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d etcd
    "

    sleep 10
    success "etcd started on $primary_node"

    # Wait for etcd cluster to form
    log "Waiting for etcd to be ready..."
    sleep 15

    # Verify etcd cluster
    if ssh root@"$primary_ip" "curl -s http://localhost:2379/health" >/dev/null 2>&1; then
        success "etcd cluster is healthy"
    else
        error "etcd cluster failed to start properly"
        return 1
    fi
}

# Start PostgreSQL cluster with Patroni
start_postgres_cluster() {
    log "🗄️  Starting PostgreSQL cluster with Patroni..."

    # Start all PostgreSQL nodes on the primary server for development
    log "Starting Patroni cluster on west-1..."
    ssh root@"${NODES[west-1]}" "
        cd /opt/twincigo-crm &&
        docker compose up -d postgres-1 postgres-2 postgres-3
    "

    sleep 30

    # Wait for cluster formation
    log "Waiting for Patroni cluster to form..."
    sleep 30

    # Verify cluster
    local primary_ip="${NODES[west-1]}"
    if ssh root@"$primary_ip" "curl -s http://localhost:8008/cluster" >/dev/null 2>&1; then
        success "Patroni cluster is healthy"
    else
        warning "Patroni cluster may still be forming - checking individual nodes..."

        # Check each node individually
        for port in 8008 8009 8010; do
            if ssh root@"$primary_ip" "curl -s http://localhost:$port/health" >/dev/null 2>&1; then
                success "Patroni node on port $port is responding"
            else
                warning "Patroni node on port $port is not responding yet"
            fi
        done
    fi
}

# Start HAProxy load balancer
start_haproxy() {
    log "⚖️  Starting HAProxy load balancer..."

    ssh root@"${NODES[west-1]}" "
        cd /opt/twincigo-crm &&
        docker compose up -d haproxy
    "

    sleep 10

    # Verify HAProxy
    if ssh root@"${NODES[west-1]}" "curl -s http://localhost:7000/stats" >/dev/null 2>&1; then
        success "HAProxy is running"
    else
        warning "HAProxy may have issues - check logs"
    fi
}

# Apply database schema
apply_database_schema() {
    log "📋 Applying database schema..."

    local primary_ip="${NODES[west-1]}"

    # Wait for PostgreSQL to be ready
    local retries=0
    while [[ $retries -lt 15 ]]; do
        if ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose exec postgres-1 pg_isready -U postgres" >/dev/null 2>&1; then
            break
        fi
        ((retries++))
        log "Waiting for PostgreSQL... (attempt $retries/15)"
        sleep 10
    done

    if [[ $retries -eq 15 ]]; then
        error "PostgreSQL failed to become ready"
        return 1
    fi

    # Apply schema
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose exec -T postgres-1 psql -U postgres -d crm < schema.sql
    "

    success "Database schema applied successfully"
}

# Verify deployment
verify_deployment() {
    log "✅ Verifying deployment..."
    
    # Run cluster status check
    ./scripts/cluster-status.sh
    
    success "Deployment verification complete"
}

# Main execution
main() {
    log "🔧 Starting TwinCiGo CRM Deployment Fix"
    
    # Phase 1: Install Docker on remaining nodes
    install_docker_remaining_nodes
    
    # Phase 2: Copy deployment files
    copy_deployment_files
    
    # Phase 3: Update environment variables
    update_node_environment
    
    # Phase 4: Start etcd cluster
    start_etcd_cluster
    
    # Phase 5: Start PostgreSQL cluster
    start_postgres_cluster
    
    # Phase 6: Start HAProxy
    start_haproxy
    
    # Phase 7: Apply database schema
    apply_database_schema
    
    # Phase 8: Verify deployment
    verify_deployment
    
    success "🎉 TwinCiGo CRM deployment fix complete!"
    
    log "📊 Access Information:"
    log "  Database (HAProxy): ${NODES[west-1]}:5000"
    log "  Supabase Dashboard: http://${NODES[west-1]}:3000"
    log "  FastAPI Backend: http://${NODES[east-1]}:8000"
    log "  HAProxy Stats: http://${NODES[west-1]}:7000/stats"
}

main "$@"
