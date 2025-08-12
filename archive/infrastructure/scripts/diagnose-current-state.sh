#!/bin/bash

# 🔍 Diagnose Current State - TwinCiGo CRM
# Focused diagnostic to understand what's working and what's not
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

# Check what's actually running
check_running_containers() {
    log "🐳 PART 1: What containers are actually running?"
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== DOCKER CONTAINER STATUS ==="
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose ps"
    
    echo ""
    echo "=== ALL DOCKER CONTAINERS ==="
    ssh root@"$primary_ip" "docker ps -a"
    
    echo ""
    echo "=== DOCKER NETWORKS ==="
    ssh root@"$primary_ip" "docker network ls"
}

# Check what ports are actually listening
check_listening_ports() {
    log "🔌 PART 2: What ports are actually listening?"
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== LISTENING PORTS ==="
    ssh root@"$primary_ip" "netstat -tuln | grep LISTEN | sort"
    
    echo ""
    echo "=== SPECIFIC SERVICE PORTS ==="
    local ports=(2379 5000 7000 8008 8009 8010 3000 3001)
    for port in "${ports[@]}"; do
        if ssh root@"$primary_ip" "netstat -tuln | grep :$port" >/dev/null 2>&1; then
            success "Port $port: LISTENING"
        else
            error "Port $port: NOT LISTENING"
        fi
    done
}

# Check etcd in detail
check_etcd_details() {
    log "🗄️  PART 3: etcd detailed status"
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== ETCD CONTAINER STATUS ==="
    ssh root@"$primary_ip" "docker logs gardenos-etcd-dev --tail=10"
    
    echo ""
    echo "=== ETCD HEALTH ==="
    ssh root@"$primary_ip" "curl -s http://localhost:2379/health" || echo "etcd health check failed"
    
    echo ""
    echo "=== ETCD VERSION ==="
    ssh root@"$primary_ip" "curl -s http://localhost:2379/version" || echo "etcd version check failed"
    
    echo ""
    echo "=== ETCD MEMBERS ==="
    ssh root@"$primary_ip" "curl -s http://localhost:2379/v2/members" || echo "etcd members check failed"
    
    echo ""
    echo "=== ETCD KEYS (what's stored) ==="
    ssh root@"$primary_ip" "curl -s http://localhost:2379/v2/keys/?recursive=true" || echo "etcd keys check failed"
}

# Check Patroni containers in detail
check_patroni_details() {
    log "🐘 PART 4: Patroni detailed status"
    
    local primary_ip="5.78.103.224"
    
    for i in 1 2 3; do
        echo ""
        echo "=== POSTGRES-$i CONTAINER LOGS ==="
        ssh root@"$primary_ip" "docker logs gardenos-postgres-$i-dev --tail=15"
        
        echo ""
        echo "=== POSTGRES-$i ENVIRONMENT ==="
        ssh root@"$primary_ip" "docker inspect gardenos-postgres-$i-dev | grep -A 50 '\"Env\"'"
        
        echo ""
        echo "=== POSTGRES-$i NETWORK ==="
        ssh root@"$primary_ip" "docker inspect gardenos-postgres-$i-dev | grep -A 10 '\"Networks\"'"
    done
}

# Check container connectivity
check_container_connectivity() {
    log "🌐 PART 5: Container-to-container connectivity"
    
    local primary_ip="5.78.103.224"
    
    echo ""
    echo "=== CAN POSTGRES-1 REACH ETCD? ==="
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose exec postgres-1 ping -c 2 etcd" || echo "Ping failed"
    
    echo ""
    echo "=== CAN POSTGRES-1 CURL ETCD? ==="
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose exec postgres-1 curl -s http://etcd:2379/health" || echo "Curl failed"
    
    echo ""
    echo "=== POSTGRES-1 DNS RESOLUTION ==="
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose exec postgres-1 nslookup etcd" || echo "DNS lookup failed"
    
    echo ""
    echo "=== POSTGRES-1 NETWORK INTERFACES ==="
    ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker compose exec postgres-1 ip addr show" || echo "Network interfaces check failed"
}

# Main execution
main() {
    log "🔍 Starting Current State Diagnosis"
    
    echo "This will give us the facts about what's actually running and working."
    echo ""
    
    # Run diagnostics in order
    check_running_containers
    echo ""
    
    check_listening_ports
    echo ""
    
    check_etcd_details
    echo ""
    
    check_patroni_details
    echo ""
    
    check_container_connectivity
    
    success "🎉 Current state diagnosis complete!"
    
    log "📝 Next: Review the output above to identify the root cause"
}

main "$@"
