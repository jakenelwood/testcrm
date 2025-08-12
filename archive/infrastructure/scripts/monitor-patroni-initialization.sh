#!/bin/bash

# 🔍 Real-time Patroni Initialization Monitor
# Monitors Patroni cluster initialization in real-time
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

# Monitor Patroni logs in real-time
monitor_patroni_logs() {
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== REAL-TIME PATRONI LOGS ==="
    echo "Monitoring postgres-1 initialization..."
    echo ""
    
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker logs gardenos-postgres-1-dev --tail=20 --follow" &
    local log_pid=$!
    
    # Monitor for 30 seconds, then check status
    sleep 30
    kill $log_pid 2>/dev/null || true
}

# Check etcd v3 API interaction
check_etcd_v3_interaction() {
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== ETCD V3 API INTERACTION ==="
    
    # Check if Patroni is writing to etcd v3
    log "Checking etcd v3 keys..."
    ssh root@"$primary_ip" "
        echo 'etcd v3 keys (should show Patroni data):'
        docker exec gardenos-etcd-dev etcdctl get --prefix /db/ || echo 'No keys found yet'
        
        echo ''
        echo 'etcd v3 cluster status:'
        docker exec gardenos-etcd-dev etcdctl endpoint status || echo 'Status check failed'
    "
}

# Check Patroni health endpoints
check_patroni_health() {
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== PATRONI HEALTH CHECK ==="
    
    for port in 8008 8009 8010; do
        if ssh root@"$primary_ip" "curl -s http://localhost:$port/health" >/dev/null 2>&1; then
            success "Patroni node $port: RESPONDING"
            
            # Get detailed status
            ssh root@"$primary_ip" "
                echo 'Node $port status:'
                curl -s http://localhost:$port/patroni || echo 'Detailed status not available'
            "
        else
            warning "Patroni node $port: NOT RESPONDING YET"
        fi
    done
}

# Check container status
check_container_status() {
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== CONTAINER STATUS ==="
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose ps"
}

# Main monitoring loop
main() {
    log "🔍 Starting Real-time Patroni Initialization Monitor"
    
    echo ""
    echo "This will monitor the Patroni initialization process in real-time."
    echo "The primary node typically takes 60-90 seconds to fully initialize."
    echo ""
    
    # Phase 1: Monitor logs
    monitor_patroni_logs
    
    # Phase 2: Check etcd interaction
    check_etcd_v3_interaction
    
    # Phase 3: Check health endpoints
    check_patroni_health
    
    # Phase 4: Check container status
    check_container_status
    
    echo ""
    log "📊 Monitoring complete - check results above"
    log "💡 If Patroni is still initializing, this is normal for HA clusters"
}

main "$@"
