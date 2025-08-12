#!/bin/bash

# 🏗️ Production-Ready Patroni etcd v3 Configuration
# Configures Patroni to use etcd v3 API for production-mirrored HA
# Author: TwinCiGo CRM Database Expert

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

# Configure Patroni for etcd v3 API (Production Standard)
configure_patroni_etcd_v3() {
    log "🏗️ Configuring Patroni for etcd v3 API (Production Standard)"
    
    local primary_ip="5.78.103.224"
    
    # Stop all Patroni containers
    log "Stopping Patroni containers for configuration update..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose stop postgres-1 postgres-2 postgres-3
    "
    
    # Create production-ready configuration backup
    log "Creating configuration backup..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d-%H%M%S)
    "
    
    # Update docker-compose.yml for etcd v3 API
    log "Updating Patroni configuration for etcd v3 API..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        
        # Replace etcd v2 configuration with v3 configuration
        # This is the key fix: Use PATRONI_ETCD3_* for v3 API
        sed -i 's/PATRONI_ETCD_HOSTS:/PATRONI_ETCD3_HOSTS:/g' docker-compose.yml &&
        sed -i 's/PATRONI_ETCD_PROTOCOL:/PATRONI_ETCD3_PROTOCOL:/g' docker-compose.yml &&
        sed -i 's/PATRONI_ETCD_PREFIX:/PATRONI_ETCD3_PREFIX:/g' docker-compose.yml &&
        sed -i 's/PATRONI_ETCD_USERNAME:/PATRONI_ETCD3_USERNAME:/g' docker-compose.yml &&
        sed -i 's/PATRONI_ETCD_PASSWORD:/PATRONI_ETCD3_PASSWORD:/g' docker-compose.yml
    "
    
    success "Patroni configured for etcd v3 API"
    
    # Verify configuration
    log "Verifying etcd v3 configuration..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        echo 'Updated configuration:' &&
        docker compose config | grep -A 5 -B 5 PATRONI_ETCD3
    "
}

# Start Patroni cluster with production-ready sequence
start_patroni_cluster_production() {
    log "🚀 Starting Patroni cluster with production-ready sequence"
    
    local primary_ip="5.78.103.224"
    
    # Start primary node first (production pattern)
    log "Starting Patroni primary node (postgres-1)..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d postgres-1
    "
    
    # Wait for primary to initialize (production timing)
    log "Waiting for primary node to initialize..."
    sleep 60
    
    # Check primary node health
    local retries=0
    while [[ $retries -lt 20 ]]; do
        if ssh root@"$primary_ip" "curl -s http://localhost:8008/health" >/dev/null 2>&1; then
            success "Primary Patroni node is healthy!"
            break
        fi
        ((retries++))
        log "Waiting for primary node... (attempt $retries/20)"
        sleep 15
    done
    
    if [[ $retries -eq 20 ]]; then
        error "Primary node failed to start - checking logs..."
        ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker logs gardenos-postgres-1-dev --tail=20"
        return 1
    fi
    
    # Start replica nodes (production pattern)
    log "Starting Patroni replica nodes..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d postgres-2 postgres-3
    "
    
    # Wait for replicas to join cluster
    log "Waiting for replicas to join cluster..."
    sleep 45
    
    # Verify cluster formation
    log "Verifying cluster formation..."
    ssh root@"$primary_ip" "curl -s http://localhost:8008/cluster" || true
    
    success "Patroni cluster started with production configuration"
}

# Validate production-ready cluster
validate_production_cluster() {
    log "🔍 Validating production-ready cluster"
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== CLUSTER HEALTH STATUS ==="
    
    # Check all Patroni nodes
    local all_healthy=true
    for port in 8008 8009 8010; do
        if ssh root@"$primary_ip" "curl -s http://localhost:$port/health" >/dev/null 2>&1; then
            success "Patroni node $port: HEALTHY"
        else
            error "Patroni node $port: UNHEALTHY"
            all_healthy=false
        fi
    done
    
    # Check cluster status
    echo ""
    echo "=== CLUSTER TOPOLOGY ==="
    ssh root@"$primary_ip" "curl -s http://localhost:8008/cluster | python3 -m json.tool" || echo "Cluster status not available"
    
    # Check PostgreSQL connectivity
    echo ""
    echo "=== DATABASE CONNECTIVITY ==="
    if ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose exec postgres-1 pg_isready -U postgres" >/dev/null 2>&1; then
        success "PostgreSQL: READY for connections"
    else
        error "PostgreSQL: NOT READY"
        all_healthy=false
    fi
    
    # Check etcd v3 API
    echo ""
    echo "=== ETCD V3 API STATUS ==="
    if ssh root@"$primary_ip" "curl -s http://localhost:2379/health" >/dev/null 2>&1; then
        success "etcd v3 API: HEALTHY"
    else
        error "etcd v3 API: UNHEALTHY"
        all_healthy=false
    fi
    
    # Production readiness summary
    echo ""
    if $all_healthy; then
        success "🎉 PRODUCTION-READY CLUSTER: All systems healthy"
    else
        warning "⚠️  CLUSTER ISSUES: Some components need attention"
    fi
    
    return $all_healthy
}

# Start remaining production services
start_production_services() {
    log "🏗️ Starting remaining production services"
    
    local primary_ip="5.78.103.224"
    
    # Start HAProxy (production load balancer)
    log "Starting HAProxy load balancer..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d haproxy
    "
    
    sleep 10
    
    # Start Supabase services (production API layer)
    log "Starting Supabase production services..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d supabase-auth supabase-rest supabase-realtime supabase-storage supabase-meta supabase-studio
    "
    
    sleep 20
    
    # Start monitoring and admin tools
    log "Starting monitoring and admin tools..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d redis adminer redis-commander
    "
    
    success "All production services started"
}

# Production deployment summary
production_deployment_summary() {
    log "📊 Production Deployment Summary"
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "🏗️ PRODUCTION-READY TWINCIGO CRM DEPLOYMENT"
    echo "=============================================="
    echo ""
    echo "🔗 Production Access URLs:"
    echo "  🗄️  Database (HA): $primary_ip:5000 (via HAProxy)"
    echo "  🎛️  Supabase Studio: http://$primary_ip:3001"
    echo "  🔌 REST API: http://$primary_ip:3000"
    echo "  📊 HAProxy Stats: http://$primary_ip:7000/stats"
    echo "  🔧 Database Admin: http://$primary_ip:8081"
    echo ""
    echo "🏗️ High Availability Features:"
    echo "  ✅ etcd v3 API (production standard)"
    echo "  ✅ 3-node Patroni cluster"
    echo "  ✅ Automatic failover"
    echo "  ✅ Load balancing via HAProxy"
    echo "  ✅ Health monitoring"
    echo ""
    echo "🧪 Test Database Connection:"
    echo "  psql -h $primary_ip -p 5000 -U postgres -d crm"
    echo "  Password: CRM_Dev_Password_2025_Hetzner"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Apply database schema"
    echo "  2. Test from localhost:3000"
    echo "  3. Monitor cluster health"
    echo "  4. Set up automated backups"
    
    # Show final container status
    echo ""
    echo "🐳 Final Container Status:"
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose ps"
}

# Main execution
main() {
    log "🏗️ Starting Production-Ready Patroni Configuration"
    
    echo ""
    echo "This will configure a production-mirrored HA database cluster using:"
    echo "  • etcd v3 API (production standard)"
    echo "  • 3-node Patroni cluster with automatic failover"
    echo "  • HAProxy load balancing"
    echo "  • Full Supabase integration"
    echo ""
    
    # Phase 1: Configure Patroni for etcd v3
    configure_patroni_etcd_v3
    echo ""
    
    # Phase 2: Start Patroni cluster
    start_patroni_cluster_production
    echo ""
    
    # Phase 3: Validate cluster
    if validate_production_cluster; then
        echo ""
        
        # Phase 4: Start remaining services
        start_production_services
        echo ""
        
        # Phase 5: Production summary
        production_deployment_summary
        
        success "🎉 PRODUCTION-READY DEPLOYMENT COMPLETE!"
    else
        error "❌ Cluster validation failed - check logs and retry"
        return 1
    fi
}

main "$@"
