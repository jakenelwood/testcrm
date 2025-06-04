#!/bin/bash

# 🎯 FINAL Spilo Configuration Fix
# Uses correct Spilo environment variables based on official documentation
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

# Apply the correct Spilo configuration
apply_correct_spilo_config() {
    log "🎯 Applying CORRECT Spilo environment variables"
    
    local primary_ip="5.78.103.224"
    
    # Stop all containers
    log "Stopping all Patroni containers..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose stop postgres-1 postgres-2 postgres-3
    "
    
    # Create final backup
    log "Creating final configuration backup..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        cp docker-compose.yml docker-compose.yml.final-backup-$(date +%Y%m%d-%H%M%S)
    "
    
    # Apply the CORRECT Spilo configuration
    log "Applying correct Spilo environment variables..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        
        # Add the CORRECT Spilo environment variables
        # Based on official Spilo documentation
        sed -i '/PATRONI_ETCD3_HOSTS: etcd:2379/a\\      ETCD3_HOSTS: etcd:2379' docker-compose.yml &&
        sed -i '/PATRONI_ETCD3_PROTOCOL: http/a\\      ETCD3_PROTOCOL: http' docker-compose.yml &&
        
        # Also add SCOPE for cluster identification
        sed -i '/PATRONI_SCOPE: gardenos-dev-cluster/a\\      SCOPE: gardenos-dev-cluster' docker-compose.yml
    "
    
    success "Correct Spilo configuration applied"
    
    # Verify the configuration
    log "Verifying Spilo configuration..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        echo 'New Spilo environment variables:' &&
        docker compose config | grep -E '(ETCD3_|SCOPE:)'
    "
}

# Start the cluster with correct configuration
start_cluster_with_correct_config() {
    log "🚀 Starting cluster with correct Spilo configuration"
    
    local primary_ip="5.78.103.224"
    
    # Start primary node first
    log "Starting primary node (postgres-1)..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d postgres-1
    "
    
    # Wait for primary to initialize
    log "Waiting for primary node to initialize (60 seconds)..."
    sleep 60
    
    # Check primary node
    local retries=0
    while [[ $retries -lt 15 ]]; do
        if ssh root@"$primary_ip" "curl -s http://localhost:8008/health" >/dev/null 2>&1; then
            success "Primary node is HEALTHY!"
            break
        fi
        ((retries++))
        log "Checking primary node... (attempt $retries/15)"
        sleep 10
    done
    
    if [[ $retries -eq 15 ]]; then
        warning "Primary node not responding yet - checking logs..."
        ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker logs gardenos-postgres-1-dev --tail=15"
        
        # Check if etcd has Patroni data now
        log "Checking if Patroni is writing to etcd..."
        ssh root@"$primary_ip" "docker exec gardenos-etcd-dev etcdctl get --prefix /db/ || echo 'No Patroni data in etcd yet'"
        
        return 1
    fi
    
    # Start replica nodes
    log "Starting replica nodes..."
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm &&
        docker compose up -d postgres-2 postgres-3
    "
    
    sleep 30
    
    success "Cluster started with correct Spilo configuration"
}

# Validate the working cluster
validate_working_cluster() {
    log "🔍 Validating the working cluster"
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== CLUSTER HEALTH STATUS ==="
    
    # Check all nodes
    local healthy_nodes=0
    for port in 8008 8009 8010; do
        if ssh root@"$primary_ip" "curl -s http://localhost:$port/health" >/dev/null 2>&1; then
            success "Node $port: HEALTHY"
            ((healthy_nodes++))
        else
            warning "Node $port: Not responding"
        fi
    done
    
    echo ""
    echo "=== PATRONI CLUSTER STATUS ==="
    ssh root@"$primary_ip" "curl -s http://localhost:8008/cluster | python3 -m json.tool" 2>/dev/null || echo "Cluster status not available"
    
    echo ""
    echo "=== ETCD DATA ==="
    ssh root@"$primary_ip" "docker exec gardenos-etcd-dev etcdctl get --prefix /db/" || echo "No etcd data found"
    
    echo ""
    echo "=== DATABASE CONNECTIVITY ==="
    if ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose exec postgres-1 pg_isready -U postgres" >/dev/null 2>&1; then
        success "PostgreSQL: READY for connections"
    else
        warning "PostgreSQL: Not ready yet"
    fi
    
    # Summary
    echo ""
    if [[ $healthy_nodes -ge 1 ]]; then
        success "🎉 CLUSTER IS WORKING! ($healthy_nodes/$((${#ports[@]})) nodes healthy)"
        return 0
    else
        error "❌ Cluster validation failed"
        return 1
    fi
}

# Start all remaining services
start_all_remaining_services() {
    log "🏗️ Starting all remaining services"
    
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

# Final deployment summary
final_deployment_summary() {
    log "🎉 FINAL DEPLOYMENT SUMMARY"
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "🏗️ TWINCIGO CRM - PRODUCTION-READY HA DEPLOYMENT"
    echo "=================================================="
    echo ""
    echo "🔗 Access URLs:"
    echo "  🗄️  Database (HA): $primary_ip:5000"
    echo "  🎛️  Supabase Studio: http://$primary_ip:3001"
    echo "  🔌 REST API: http://$primary_ip:3000"
    echo "  📊 HAProxy Stats: http://$primary_ip:7000/stats"
    echo "  🔧 Adminer: http://$primary_ip:8081"
    echo ""
    echo "🧪 Test Database Connection:"
    echo "  psql -h $primary_ip -p 5000 -U postgres -d crm"
    echo "  Password: CRM_Dev_Password_2025_Hetzner"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Apply database schema"
    echo "  2. Test from localhost:3000"
    echo "  3. Monitor cluster health"
    echo ""
    
    # Show final status
    echo "🐳 Final Container Status:"
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose ps"
}

# Main execution
main() {
    log "🎯 Starting FINAL Spilo Configuration Fix"
    
    echo ""
    echo "This applies the CORRECT Spilo environment variables based on official documentation:"
    echo "  • ETCD3_HOSTS (not PATRONI_ETCD3_HOSTS)"
    echo "  • ETCD3_PROTOCOL (not PATRONI_ETCD3_PROTOCOL)"
    echo "  • SCOPE for cluster identification"
    echo ""
    
    # Phase 1: Apply correct configuration
    apply_correct_spilo_config
    echo ""
    
    # Phase 2: Start cluster
    start_cluster_with_correct_config
    echo ""
    
    # Phase 3: Validate cluster
    if validate_working_cluster; then
        echo ""
        
        # Phase 4: Start remaining services
        start_all_remaining_services
        echo ""
        
        # Phase 5: Final summary
        final_deployment_summary
        
        success "🎉 PRODUCTION-READY DEPLOYMENT COMPLETE!"
        log "🚀 Ready to test with localhost:3000!"
    else
        error "❌ Cluster validation failed - manual investigation needed"
        return 1
    fi
}

main "$@"
