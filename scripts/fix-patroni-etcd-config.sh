#!/bin/bash

# 🔧 Fix Patroni etcd Configuration
# Fixes the Patroni etcd connection issue
# Author: TwinCiGo CRM Team

set -euo pipefail

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

# Fix Patroni etcd configuration
fix_patroni_etcd_config() {
    log "🔧 Fixing Patroni etcd configuration..."
    
    local primary_ip="5.78.103.224"
    
    # Stop the containers
    log "Stopping Patroni containers..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose stop postgres-1 postgres-2 postgres-3
    "
    
    # Update the docker-compose.yml to use PATRONI_ETCD_HOSTS instead of PATRONI_ETCD3_HOSTS
    log "Updating Patroni configuration..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        
        # Create backup
        cp docker-compose.yml docker-compose.yml.backup &&
        
        # Replace ETCD3 with ETCD in environment variables
        sed -i 's/PATRONI_ETCD3_HOSTS/PATRONI_ETCD_HOSTS/g' docker-compose.yml &&
        sed -i 's/PATRONI_ETCD3_PROTOCOL/PATRONI_ETCD_PROTOCOL/g' docker-compose.yml &&
        sed -i 's/PATRONI_ETCD3_PREFIX/PATRONI_ETCD_PREFIX/g' docker-compose.yml &&
        sed -i 's/PATRONI_ETCD3_USERNAME/PATRONI_ETCD_USERNAME/g' docker-compose.yml &&
        sed -i 's/PATRONI_ETCD3_PASSWORD/PATRONI_ETCD_PASSWORD/g' docker-compose.yml
    "
    
    success "Patroni configuration updated"
    
    # Start the containers with new configuration
    log "Starting Patroni containers with new configuration..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d postgres-1 postgres-2 postgres-3
    "
    
    # Wait for containers to start
    sleep 30
    
    # Check if Patroni is working
    log "Checking Patroni health..."
    local retries=0
    while [[ $retries -lt 10 ]]; do
        if ssh root@"$primary_ip" "curl -s http://localhost:8008/health" >/dev/null 2>&1; then
            success "Patroni is now healthy!"
            break
        fi
        ((retries++))
        log "Waiting for Patroni... (attempt $retries/10)"
        sleep 15
    done
    
    if [[ $retries -eq 10 ]]; then
        warning "Patroni still not responding, checking logs..."
        ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker logs gardenos-postgres-1-dev --tail=10"
    else
        success "Patroni cluster is healthy!"
        
        # Check cluster status
        log "Checking cluster status..."
        ssh root@"$primary_ip" "curl -s http://localhost:8008/cluster" || true
    fi
}

# Start remaining services
start_remaining_services() {
    log "🚀 Starting remaining services..."
    
    local primary_ip="5.78.103.224"
    
    # Start HAProxy
    log "Starting HAProxy..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d haproxy
    "
    
    sleep 10
    
    # Start Supabase services
    log "Starting Supabase services..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d supabase-auth supabase-rest supabase-realtime supabase-storage supabase-meta supabase-studio
    "
    
    sleep 15
    
    # Start additional services
    log "Starting additional services..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d redis adminer redis-commander
    "
    
    success "All services started"
}

# Perform final health check
final_health_check() {
    log "🏥 Performing final health check..."
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "🔗 Service Status:"
    
    # Check etcd
    if ssh root@"$primary_ip" "curl -s http://localhost:2379/health" >/dev/null 2>&1; then
        success "etcd: Healthy"
    else
        error "etcd: Not responding"
    fi
    
    # Check Patroni
    if ssh root@"$primary_ip" "curl -s http://localhost:8008/health" >/dev/null 2>&1; then
        success "Patroni: Healthy"
    else
        error "Patroni: Not responding"
    fi
    
    # Check HAProxy
    if ssh root@"$primary_ip" "curl -s http://localhost:7000/stats" >/dev/null 2>&1; then
        success "HAProxy: Healthy"
    else
        warning "HAProxy: Not responding"
    fi
    
    # Check Supabase REST
    if ssh root@"$primary_ip" "curl -s http://localhost:3000" >/dev/null 2>&1; then
        success "Supabase REST: Healthy"
    else
        warning "Supabase REST: Not responding"
    fi
    
    echo ""
    echo "🐳 Container Status:"
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose ps"
    
    echo ""
    echo "🔗 Access URLs:"
    echo "  Database (HAProxy): $primary_ip:5000"
    echo "  Supabase Studio: http://$primary_ip:3001"
    echo "  Supabase REST API: http://$primary_ip:3000"
    echo "  HAProxy Stats: http://$primary_ip:7000/stats"
    echo "  Adminer: http://$primary_ip:8081"
}

# Main execution
main() {
    log "🔧 Starting Patroni etcd Configuration Fix"
    
    # Phase 1: Fix Patroni configuration
    fix_patroni_etcd_config
    
    # Phase 2: Start remaining services
    start_remaining_services
    
    # Phase 3: Final health check
    final_health_check
    
    success "🎉 Patroni etcd configuration fix complete!"
    
    log "📝 Next Steps:"
    log "  1. Test database connectivity"
    log "  2. Apply database schema if needed"
    log "  3. Test from localhost:3000"
}

main "$@"
