#!/bin/bash

# 📊 TwinCiGo CRM Cluster Status Monitor
# Provides comprehensive status of the 3-node cluster
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

# Check node connectivity
check_node_connectivity() {
    local node=$1
    local ip=$2
    
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@"$ip" "echo 'ok'" >/dev/null 2>&1; then
        success "$node ($ip) - SSH accessible"
        return 0
    else
        error "$node ($ip) - SSH not accessible"
        return 1
    fi
}

# Check Docker status on node
check_docker_status() {
    local node=$1
    local ip=$2
    
    if ssh root@"$ip" "systemctl is-active docker" >/dev/null 2>&1; then
        success "$node - Docker running"
    else
        error "$node - Docker not running"
    fi
}

# Check container status
check_containers() {
    local node=$1
    local ip=$2
    
    log "Container status on $node:"
    ssh root@"$ip" "cd /opt/twincigo-crm && docker-compose ps" 2>/dev/null || warning "$node - No containers found"
}

# Check Patroni cluster status
check_patroni_cluster() {
    log "Checking Patroni cluster status..."
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        log "Patroni status on $node:"
        
        # Check if Patroni is running
        if ssh root@"$ip" "curl -s http://localhost:8008/cluster" 2>/dev/null; then
            success "$node - Patroni responding"
        else
            warning "$node - Patroni not responding"
        fi
    done
}

# Check HAProxy status
check_haproxy() {
    local primary_ip="${NODES[west-1]}"
    
    log "Checking HAProxy load balancer..."
    
    if ssh root@"$primary_ip" "curl -s http://localhost:7000/stats" >/dev/null 2>&1; then
        success "HAProxy stats accessible at http://$primary_ip:7000/stats"
    else
        warning "HAProxy stats not accessible"
    fi
    
    # Check backend status
    log "HAProxy backend status:"
    ssh root@"$primary_ip" "curl -s http://localhost:7000/stats | grep postgres || echo 'No postgres backends found'" 2>/dev/null
}

# Check database connectivity
check_database() {
    local primary_ip="${NODES[west-1]}"
    
    log "Testing database connectivity..."
    
    if ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker-compose exec -T postgres-1 pg_isready -U postgres" >/dev/null 2>&1; then
        success "PostgreSQL cluster accessible"
        
        # Check database schema
        log "Checking database schema..."
        local table_count=$(ssh root@"$primary_ip" "cd /opt/twincigo-crm && docker-compose exec -T postgres-1 psql -U postgres -d crm -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\"" 2>/dev/null | tr -d ' ')
        
        if [[ "$table_count" -gt 0 ]]; then
            success "Database schema applied ($table_count tables)"
        else
            warning "Database schema not applied or empty"
        fi
    else
        error "PostgreSQL cluster not accessible"
    fi
}

# Check Supabase services
check_supabase() {
    local primary_ip="${NODES[west-1]}"
    
    log "Checking Supabase services..."
    
    # Check Supabase dashboard
    if ssh root@"$primary_ip" "curl -s http://localhost:3000/health" >/dev/null 2>&1; then
        success "Supabase dashboard accessible at http://$primary_ip:3000"
    else
        warning "Supabase dashboard not accessible"
    fi
    
    # Check Supabase REST API
    if ssh root@"$primary_ip" "curl -s http://localhost:3001/health" >/dev/null 2>&1; then
        success "Supabase REST API accessible"
    else
        warning "Supabase REST API not accessible"
    fi
}

# Check FastAPI backend
check_fastapi() {
    local backend_ip="${NODES[east-1]}"
    
    log "Checking FastAPI backend..."
    
    if ssh root@"$backend_ip" "curl -s http://localhost:8000/health" >/dev/null 2>&1; then
        success "FastAPI backend accessible at http://$backend_ip:8000"
    else
        warning "FastAPI backend not accessible"
    fi
}

# Resource usage summary
check_resources() {
    log "Resource usage summary:"
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        log "Resources on $node:"
        
        # CPU and memory
        ssh root@"$ip" "echo 'CPU: '$(top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1)'% | Memory: '$(free | grep Mem | awk '{printf \"%.1f%%\", \$3/\$2 * 100.0}')" 2>/dev/null || warning "$node - Resource check failed"
        
        # Disk usage
        ssh root@"$ip" "df -h / | tail -1 | awk '{print \"Disk: \" \$5 \" used\"}'" 2>/dev/null || warning "$node - Disk check failed"
        
        # Docker stats
        ssh root@"$ip" "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' | head -5" 2>/dev/null || warning "$node - Docker stats failed"
        echo
    done
}

# Main status check
main() {
    log "🔍 TwinCiGo CRM Cluster Status Check"
    echo "=================================================="
    
    # Node connectivity
    log "📡 Checking node connectivity..."
    for node in "${!NODES[@]}"; do
        check_node_connectivity "$node" "${NODES[$node]}"
        check_docker_status "$node" "${NODES[$node]}"
    done
    echo
    
    # Container status
    log "🐳 Checking container status..."
    for node in "${!NODES[@]}"; do
        check_containers "$node" "${NODES[$node]}"
        echo
    done
    
    # Database cluster
    log "🗄️  Checking database cluster..."
    check_patroni_cluster
    check_haproxy
    check_database
    echo
    
    # Application services
    log "🚀 Checking application services..."
    check_supabase
    check_fastapi
    echo
    
    # Resource usage
    log "📊 Checking resource usage..."
    check_resources
    
    success "Cluster status check complete!"
    
    log "📋 Quick Access URLs:"
    log "  Database: ${NODES[west-1]}:5000"
    log "  Supabase: http://${NODES[west-1]}:3000"
    log "  FastAPI: http://${NODES[east-1]}:8000"
    log "  HAProxy: http://${NODES[west-1]}:7000/stats"
}

main "$@"
