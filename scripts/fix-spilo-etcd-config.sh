#!/bin/bash

# 🔧 Fix Spilo etcd Configuration
# Fixes the Spilo etcd connection using correct environment variables
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

# Fix Spilo etcd configuration
fix_spilo_etcd_config() {
    log "🔧 Fixing Spilo etcd configuration with correct environment variables..."
    
    local primary_ip="5.78.103.224"
    
    # Stop the containers
    log "Stopping Patroni containers..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose stop postgres-1 postgres-2 postgres-3
    "
    
    # Update the docker-compose.yml to use Spilo-specific environment variables
    log "Updating Spilo configuration..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        
        # Create backup
        cp docker-compose.yml docker-compose.yml.spilo-backup &&
        
        # Add ETCD_HOST environment variable to all postgres services
        # This is the key fix - Spilo uses ETCD_HOST, not PATRONI_ETCD_HOSTS
        sed -i '/PATRONI_ETCD_HOSTS: etcd:2379/a\\      ETCD_HOST: etcd:2379' docker-compose.yml
    "
    
    success "Spilo configuration updated with ETCD_HOST"
    
    # Start the containers with new configuration
    log "Starting Patroni containers with Spilo-compatible configuration..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d postgres-1
    "
    
    # Wait for the first container to start
    sleep 45
    
    # Check if the first Patroni node is working
    log "Checking first Patroni node..."
    local retries=0
    while [[ $retries -lt 15 ]]; do
        if ssh root@"$primary_ip" "curl -s http://localhost:8008/health" >/dev/null 2>&1; then
            success "First Patroni node is healthy!"
            break
        fi
        ((retries++))
        log "Waiting for first Patroni node... (attempt $retries/15)"
        sleep 20
    done
    
    if [[ $retries -eq 15 ]]; then
        warning "First Patroni node still not responding, checking logs..."
        ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker logs gardenos-postgres-1-dev --tail=15"
        return 1
    fi
    
    # Start the remaining nodes
    log "Starting remaining Patroni nodes..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d postgres-2 postgres-3
    "
    
    sleep 30
    
    # Check cluster status
    log "Checking cluster status..."
    ssh root@"$primary_ip" "curl -s http://localhost:8008/cluster" || true
    
    success "Patroni cluster is running with Spilo configuration!"
}

# Start all remaining services
start_all_services() {
    log "🚀 Starting all remaining services..."
    
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

# Comprehensive final health check
comprehensive_health_check() {
    log "🏥 Performing comprehensive health check..."
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "🔗 Critical Services Status:"
    
    # Check etcd
    if ssh root@"$primary_ip" "curl -s http://localhost:2379/health" >/dev/null 2>&1; then
        success "etcd: Healthy ✅"
    else
        error "etcd: Not responding ❌"
    fi
    
    # Check all Patroni nodes
    for port in 8008 8009 8010; do
        if ssh root@"$primary_ip" "curl -s http://localhost:$port/health" >/dev/null 2>&1; then
            success "Patroni node $port: Healthy ✅"
        else
            warning "Patroni node $port: Not responding ⚠️"
        fi
    done
    
    # Check HAProxy
    if ssh root@"$primary_ip" "curl -s http://localhost:7000/stats" >/dev/null 2>&1; then
        success "HAProxy: Healthy ✅"
    else
        warning "HAProxy: Not responding ⚠️"
    fi
    
    # Check database connectivity through HAProxy
    if ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose exec postgres-1 pg_isready -U postgres" >/dev/null 2>&1; then
        success "PostgreSQL: Ready for connections ✅"
    else
        warning "PostgreSQL: Not ready ⚠️"
    fi
    
    # Check Supabase services
    local supabase_services=(
        "3000:Supabase REST API"
        "9999:Supabase Auth"
        "4000:Supabase Realtime"
        "5002:Supabase Storage"
        "8080:Supabase Meta"
        "3001:Supabase Studio"
    )
    
    echo ""
    echo "🔗 Supabase Services Status:"
    for service in "${supabase_services[@]}"; do
        local port="${service%%:*}"
        local name="${service##*:}"
        
        if ssh root@"$primary_ip" "curl -s http://localhost:$port" >/dev/null 2>&1; then
            success "$name: Responding ✅"
        else
            warning "$name: Not responding ⚠️"
        fi
    done
    
    echo ""
    echo "🐳 All Container Status:"
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose ps"
    
    echo ""
    echo "🔗 Access URLs:"
    echo "  🗄️  Database (HAProxy): $primary_ip:5000"
    echo "  🎛️  Supabase Studio: http://$primary_ip:3001"
    echo "  🔌 Supabase REST API: http://$primary_ip:3000"
    echo "  📊 HAProxy Stats: http://$primary_ip:7000/stats"
    echo "  🔧 Adminer: http://$primary_ip:8081"
    echo "  📈 Redis Commander: http://$primary_ip:8082"
    
    echo ""
    echo "🧪 Test Database Connection:"
    echo "  From localhost: psql -h $primary_ip -p 5000 -U postgres -d crm"
    echo "  Password: CRM_Dev_Password_2025_Hetzner"
}

# Main execution
main() {
    log "🔧 Starting Spilo etcd Configuration Fix"
    
    # Phase 1: Fix Spilo configuration
    fix_spilo_etcd_config
    
    # Phase 2: Start all services
    start_all_services
    
    # Phase 3: Comprehensive health check
    comprehensive_health_check
    
    success "🎉 Spilo etcd configuration fix complete!"
    
    log "📝 Next Steps:"
    log "  1. Test database connectivity from localhost:3000"
    log "  2. Apply database schema: docker compose exec -T postgres-1 psql -U postgres -d crm < schema.sql"
    log "  3. Verify all services are accessible"
    log "  4. Monitor logs for any issues"
}

main "$@"
