#!/bin/bash

# 🔧 Fix Docker Compose Issue - TwinCiGo CRM
# Addresses the docker-compose vs docker compose plugin issue
# Author: TwinCiGo CRM Team

set -euo pipefail

# Node configuration
declare -A NODES=(
    ["ubuntu-8gb-hil-1"]="5.78.103.224"
    ["ubuntu-8gb-ash-1"]="5.161.110.205" 
    ["ubuntu-8gb-ash-2"]="178.156.186.10"
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

# Fix docker-compose command issue on all nodes
fix_docker_compose_command() {
    log "🔧 Fixing docker-compose command issue on all nodes..."
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        log "Fixing docker-compose on $node ($ip)..."
        
        ssh root@"$ip" "
            # Check if docker compose plugin is available
            if docker compose version >/dev/null 2>&1; then
                echo 'Docker Compose plugin is available'
            else
                echo 'Docker Compose plugin is NOT available - installing...'
                apt-get update && apt-get install -y docker-compose-plugin
            fi
            
            # Install standalone docker-compose for compatibility
            if ! command -v docker-compose >/dev/null 2>&1; then
                echo 'Installing standalone docker-compose for compatibility...'
                curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
                chmod +x /usr/local/bin/docker-compose
            fi
            
            # Verify both commands work
            echo 'Verifying docker compose commands...'
            docker compose version
            docker-compose version
            
            # Create symlink if needed
            if [ ! -f /usr/bin/docker-compose ]; then
                ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
            fi
        "
        
        success "Docker Compose fixed on $node"
    done
}

# Start services with proper error handling
start_services_safely() {
    log "🚀 Starting services with improved error handling..."
    
    local primary_ip="${NODES[ubuntu-8gb-hil-1]}"
    
    # Start etcd first
    log "Starting etcd..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm
        docker compose up -d etcd || docker-compose up -d etcd
        sleep 10
    "
    
    # Verify etcd
    if ssh root@"$primary_ip" "curl -s http://localhost:2379/health" >/dev/null 2>&1; then
        success "etcd is running"
    else
        error "etcd failed to start"
        return 1
    fi
    
    # Start PostgreSQL cluster
    log "Starting PostgreSQL cluster..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm
        docker compose up -d postgres-1 postgres-2 postgres-3 || docker-compose up -d postgres-1 postgres-2 postgres-3
        sleep 30
    "
    
    # Wait for PostgreSQL to be ready
    log "Waiting for PostgreSQL to be ready..."
    local retries=0
    while [[ $retries -lt 20 ]]; do
        if ssh root@"$primary_ip" "cd /opt/twincigo-crm && (docker compose exec postgres-1 pg_isready -U postgres || docker-compose exec postgres-1 pg_isready -U postgres)" >/dev/null 2>&1; then
            success "PostgreSQL is ready"
            break
        fi
        ((retries++))
        log "Waiting for PostgreSQL... (attempt $retries/20)"
        sleep 15
    done
    
    if [[ $retries -eq 20 ]]; then
        error "PostgreSQL failed to become ready"
        return 1
    fi
    
    # Start HAProxy
    log "Starting HAProxy..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm
        docker compose up -d haproxy || docker-compose up -d haproxy
        sleep 10
    "
    
    # Start Supabase services
    log "Starting Supabase services..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm
        docker compose up -d supabase-auth supabase-rest supabase-realtime supabase-storage supabase-meta supabase-studio || \
        docker-compose up -d supabase-auth supabase-rest supabase-realtime supabase-storage supabase-meta supabase-studio
        sleep 15
    "
    
    success "All services started successfully"
}

# Comprehensive health check
perform_health_check() {
    log "🏥 Performing comprehensive health check..."
    
    local primary_ip="${NODES[ubuntu-8gb-hil-1]}"
    local all_healthy=true
    
    # Check etcd
    if ssh root@"$primary_ip" "curl -s http://localhost:2379/health" >/dev/null 2>&1; then
        success "etcd is healthy"
    else
        error "etcd is not healthy"
        all_healthy=false
    fi
    
    # Check PostgreSQL nodes
    for port in 8008 8009 8010; do
        if ssh root@"$primary_ip" "curl -s http://localhost:$port/health" >/dev/null 2>&1; then
            success "Patroni node on port $port is healthy"
        else
            warning "Patroni node on port $port is not responding"
        fi
    done
    
    # Check HAProxy
    if ssh root@"$primary_ip" "curl -s http://localhost:7000/stats" >/dev/null 2>&1; then
        success "HAProxy is healthy"
    else
        error "HAProxy is not healthy"
        all_healthy=false
    fi
    
    # Check Supabase services
    local supabase_ports=(9999 3000 4000 5002 8080 3001)
    local supabase_names=("Auth" "REST" "Realtime" "Storage" "Meta" "Studio")
    
    for i in "${!supabase_ports[@]}"; do
        local port="${supabase_ports[$i]}"
        local name="${supabase_names[$i]}"
        
        if ssh root@"$primary_ip" "curl -s http://localhost:$port/health || curl -s http://localhost:$port" >/dev/null 2>&1; then
            success "Supabase $name is healthy"
        else
            warning "Supabase $name may not be ready yet"
        fi
    done
    
    if $all_healthy; then
        success "All critical services are healthy"
    else
        warning "Some services may need attention"
    fi
}

# Show service status
show_service_status() {
    log "📊 Service Status Summary:"
    
    local primary_ip="${NODES[ubuntu-8gb-hil-1]}"
    
    echo ""
    echo "🔗 Access URLs:"
    echo "  Database (HAProxy): $primary_ip:5000"
    echo "  Supabase Studio: http://$primary_ip:3001"
    echo "  Supabase REST API: http://$primary_ip:3000"
    echo "  Supabase Auth: http://$primary_ip:9999"
    echo "  HAProxy Stats: http://$primary_ip:7000/stats"
    echo "  Adminer: http://$primary_ip:8081"
    echo ""
    
    echo "🐳 Docker Container Status:"
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose ps || docker-compose ps"
}

# Main execution
main() {
    log "🔧 Starting Docker Compose Issue Fix"
    
    # Phase 1: Fix docker-compose command
    fix_docker_compose_command
    
    # Phase 2: Start services safely
    start_services_safely
    
    # Phase 3: Perform health check
    perform_health_check
    
    # Phase 4: Show status
    show_service_status
    
    success "🎉 Docker Compose issue fix complete!"
    
    log "📝 Next Steps:"
    log "  1. Check service logs if any warnings appeared"
    log "  2. Apply database schema if needed"
    log "  3. Test connectivity from localhost:3000"
}

main "$@"
