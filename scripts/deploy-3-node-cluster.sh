#!/bin/bash

# 🚀 TwinCiGo CRM 3-Node Cluster Deployment Script
# Deploys complete HA PostgreSQL cluster with Supabase and FastAPI
# Author: TwinCiGo CRM Team
# Last Updated: June 4, 2025

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Node configuration
declare -A NODES=(
    ["ubuntu-8gb-hil-1"]="5.78.103.224"
    ["ubuntu-8gb-ash-1"]="5.161.110.205"
    ["ubuntu-8gb-ash-2"]="178.156.186.10"
)

# Service distribution
WEST_1_SERVICES="etcd postgres-1 haproxy supabase-auth supabase-rest supabase-realtime"
EAST_1_SERVICES="etcd postgres-2 fastapi-backend"
EAST_2_SERVICES="etcd postgres-3 monitoring"

# Deployment settings
DEPLOYMENT_DIR="/opt/twincigo-crm"
SCHEMA_FILE="database/schema/twincigo_crm_complete_schema.sql"
DOCKER_COMPOSE_FILE="deployment/docker-compose.yml"
ENV_FILE="deployment/.env.development"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

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
    exit 1
}

# Check if SSH key exists
check_ssh_key() {
    if [[ ! -f ~/.ssh/id_ed25519 ]]; then
        error "SSH key ~/.ssh/id_ed25519 not found. Please ensure SSH access is configured."
    fi
}

# Test SSH connectivity to all nodes
test_connectivity() {
    log "Testing SSH connectivity to all nodes..."
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$ip" "echo 'Connected to $node'" >/dev/null 2>&1; then
            success "Connected to $node ($ip)"
        else
            error "Cannot connect to $node ($ip). Please check SSH access."
        fi
    done
}

# Copy files to a specific node
copy_files_to_node() {
    local node=$1
    local ip=$2
    
    log "Copying deployment files to $node ($ip)..."
    
    # Create deployment directory
    ssh root@"$ip" "mkdir -p $DEPLOYMENT_DIR"
    
    # Copy essential files
    scp -o StrictHostKeyChecking=no "$DOCKER_COMPOSE_FILE" root@"$ip":"$DEPLOYMENT_DIR/"
    scp -o StrictHostKeyChecking=no "$ENV_FILE" root@"$ip":"$DEPLOYMENT_DIR/.env"
    scp -o StrictHostKeyChecking=no "$SCHEMA_FILE" root@"$ip":"$DEPLOYMENT_DIR/schema.sql"
    
    # Copy scripts
    ssh root@"$ip" "mkdir -p $DEPLOYMENT_DIR/scripts"
    scp -o StrictHostKeyChecking=no scripts/monitor-cluster-health.sh root@"$ip":"$DEPLOYMENT_DIR/scripts/"
    scp -o StrictHostKeyChecking=no scripts/cluster-status.sh root@"$ip":"$DEPLOYMENT_DIR/scripts/"
    
    success "Files copied to $node"
}

# Install Docker on a node if not present
install_docker() {
    local node=$1
    local ip=$2
    
    log "Checking Docker installation on $node..."
    
    if ssh root@"$ip" "command -v docker >/dev/null 2>&1"; then
        success "Docker already installed on $node"
    else
        log "Installing Docker on $node..."
        ssh root@"$ip" "
            apt-get update &&
            apt-get install -y ca-certificates curl gnupg lsb-release &&
            mkdir -p /etc/apt/keyrings &&
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg &&
            echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable\" | tee /etc/apt/sources.list.d/docker.list > /dev/null &&
            apt-get update &&
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin &&
            systemctl enable docker &&
            systemctl start docker
        "
        success "Docker installed on $node"
    fi
}

# Deploy services to a specific node
deploy_to_node() {
    local node=$1
    local ip=$2
    local services=$3
    
    log "Deploying services to $node: $services"
    
    # Update node-specific environment variables
    ssh root@"$ip" "
        cd $DEPLOYMENT_DIR &&
        sed -i 's/NODE_NAME=.*/NODE_NAME=$node/' .env &&
        sed -i 's/NODE_IP=.*/NODE_IP=$ip/' .env
    "
    
    # Start services sequentially
    for service in $services; do
        log "Starting $service on $node..."
        ssh root@"$ip" "
            cd $DEPLOYMENT_DIR &&
            docker-compose up -d $service &&
            sleep 5
        "
        
        # Verify service started
        if ssh root@"$ip" "cd $DEPLOYMENT_DIR && docker-compose ps $service | grep -q 'Up'"; then
            success "$service started on $node"
        else
            warning "$service may have issues on $node - check logs"
        fi
    done
}

# Apply database schema
apply_schema() {
    local primary_ip="${NODES[ubuntu-8gb-hil-1]}"
    
    log "Waiting for PostgreSQL cluster to be ready..."
    sleep 30
    
    log "Applying database schema..."
    
    # Wait for Patroni leader to be ready
    local retries=0
    while [[ $retries -lt 10 ]]; do
        if ssh root@"$primary_ip" "cd $DEPLOYMENT_DIR && docker-compose exec postgres-1 pg_isready -U postgres"; then
            break
        fi
        ((retries++))
        log "Waiting for PostgreSQL... (attempt $retries/10)"
        sleep 10
    done
    
    if [[ $retries -eq 10 ]]; then
        error "PostgreSQL cluster failed to start"
    fi
    
    # Apply schema
    ssh root@"$primary_ip" "
        cd $DEPLOYMENT_DIR &&
        docker-compose exec -T postgres-1 psql -U postgres -d crm < schema.sql
    "
    
    success "Database schema applied successfully"
}

# Verify cluster health
verify_cluster() {
    log "Verifying cluster health..."
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        log "Checking $node ($ip)..."
        
        # Check Docker containers
        ssh root@"$ip" "cd $DEPLOYMENT_DIR && docker-compose ps"
        
        # Check Patroni status (if postgres service exists)
        if ssh root@"$ip" "cd $DEPLOYMENT_DIR && docker-compose ps | grep -q postgres"; then
            ssh root@"$ip" "curl -s http://localhost:8008/health || echo 'Patroni not ready yet'"
        fi
    done
    
    # Check HAProxy stats
    local primary_ip="${NODES[ubuntu-8gb-hil-1]}"
    log "Checking HAProxy load balancer..."
    ssh root@"$primary_ip" "curl -s http://localhost:7000/stats || echo 'HAProxy not ready yet'"
    
    success "Cluster verification complete"
}

# =============================================================================
# MAIN DEPLOYMENT PROCESS
# =============================================================================

main() {
    log "🚀 Starting TwinCiGo CRM 3-Node Cluster Deployment"
    
    # Pre-flight checks
    check_ssh_key
    test_connectivity
    
    # Phase 1: Prepare all nodes
    log "📦 Phase 1: Preparing nodes..."
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        install_docker "$node" "$ip"
        copy_files_to_node "$node" "$ip"
    done
    
    # Phase 2: Deploy etcd cluster first
    log "🔧 Phase 2: Deploying etcd cluster..."
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        ssh root@"$ip" "cd $DEPLOYMENT_DIR && docker-compose up -d etcd"
        sleep 5
    done
    
    # Phase 3: Deploy PostgreSQL cluster
    log "🗄️  Phase 3: Deploying PostgreSQL cluster..."
    deploy_to_node "ubuntu-8gb-hil-1" "${NODES[ubuntu-8gb-hil-1]}" "postgres-1"
    sleep 10
    deploy_to_node "ubuntu-8gb-ash-1" "${NODES[ubuntu-8gb-ash-1]}" "postgres-2"
    sleep 10
    deploy_to_node "ubuntu-8gb-ash-2" "${NODES[ubuntu-8gb-ash-2]}" "postgres-3"
    sleep 10
    
    # Phase 4: Deploy HAProxy
    log "⚖️  Phase 4: Deploying load balancer..."
    deploy_to_node "ubuntu-8gb-hil-1" "${NODES[ubuntu-8gb-hil-1]}" "haproxy"
    
    # Phase 5: Apply database schema
    log "📋 Phase 5: Applying database schema..."
    apply_schema
    
    # Phase 6: Deploy application services
    log "🚀 Phase 6: Deploying application services..."
    deploy_to_node "ubuntu-8gb-hil-1" "${NODES[ubuntu-8gb-hil-1]}" "supabase-auth supabase-rest supabase-realtime"
    deploy_to_node "ubuntu-8gb-ash-1" "${NODES[ubuntu-8gb-ash-1]}" "fastapi-backend"
    deploy_to_node "ubuntu-8gb-ash-2" "${NODES[ubuntu-8gb-ash-2]}" "monitoring"
    
    # Phase 7: Verify deployment
    log "✅ Phase 7: Verifying deployment..."
    verify_cluster
    
    success "🎉 TwinCiGo CRM 3-Node Cluster Deployment Complete!"
    
    log "📊 Cluster Access Information:"
    log "  Database (HAProxy): ${NODES[ubuntu-8gb-hil-1]}:5000"
    log "  Supabase Dashboard: ${NODES[ubuntu-8gb-hil-1]}:3000"
    log "  FastAPI Backend: ${NODES[ubuntu-8gb-ash-1]}:8000"
    log "  HAProxy Stats: ${NODES[ubuntu-8gb-hil-1]}:7000/stats"
    log "  Monitoring: ${NODES[ubuntu-8gb-ash-2]}:3001"
}

# Run main function
main "$@"
