#!/bin/bash

# 📊 TwinCiGo CRM Cluster Health Monitor
# Continuous monitoring of cluster health with alerting
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

# Monitor cluster health continuously
monitor_cluster() {
    local interval=${1:-30}  # Default 30 seconds
    
    log "Starting continuous cluster health monitoring (interval: ${interval}s)"
    
    while true; do
        clear
        log "🔍 TwinCiGo CRM Cluster Health Check"
        echo "=================================================="
        
        # Check database cluster
        check_database_health
        
        # Check application services
        check_application_health
        
        # Check resource usage
        check_resource_health
        
        echo
        log "Next check in ${interval} seconds... (Ctrl+C to stop)"
        sleep "$interval"
    done
}

# Check database cluster health
check_database_health() {
    log "🗄️  Database Cluster Health"
    
    local healthy_nodes=0
    local total_nodes=3
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        
        # Check Patroni health
        if ssh -o ConnectTimeout=5 root@"$ip" "curl -s http://localhost:8008/health" >/dev/null 2>&1; then
            success "$node - Patroni healthy"
            ((healthy_nodes++))
        else
            error "$node - Patroni unhealthy"
        fi
    done
    
    # Overall cluster health
    if [[ $healthy_nodes -eq $total_nodes ]]; then
        success "Database cluster: All nodes healthy ($healthy_nodes/$total_nodes)"
    elif [[ $healthy_nodes -gt 1 ]]; then
        warning "Database cluster: Partial health ($healthy_nodes/$total_nodes)"
    else
        error "Database cluster: Critical - Only $healthy_nodes/$total_nodes nodes healthy"
    fi
}

# Check application services health
check_application_health() {
    log "🚀 Application Services Health"
    
    # Supabase services
    if ssh root@"${NODES[west-1]}" "curl -s http://localhost:3000/health" >/dev/null 2>&1; then
        success "Supabase dashboard healthy"
    else
        error "Supabase dashboard unhealthy"
    fi
    
    # FastAPI backend
    if ssh root@"${NODES[east-1]}" "curl -s http://localhost:8000/health" >/dev/null 2>&1; then
        success "FastAPI backend healthy"
    else
        error "FastAPI backend unhealthy"
    fi
    
    # HAProxy
    if ssh root@"${NODES[west-1]}" "curl -s http://localhost:7000/stats" >/dev/null 2>&1; then
        success "HAProxy load balancer healthy"
    else
        error "HAProxy load balancer unhealthy"
    fi
}

# Check resource usage across nodes
check_resource_health() {
    log "📊 Resource Usage Health"
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        
        # Get CPU usage
        cpu_usage=$(ssh root@"$ip" "top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1" 2>/dev/null || echo "0")
        
        # Get memory usage
        mem_usage=$(ssh root@"$ip" "free | grep Mem | awk '{printf \"%.1f\", \$3/\$2 * 100.0}'" 2>/dev/null || echo "0")
        
        # Get disk usage
        disk_usage=$(ssh root@"$ip" "df -h / | tail -1 | awk '{print \$5}' | cut -d'%' -f1" 2>/dev/null || echo "0")
        
        # Health thresholds
        if [[ $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo 0) -eq 1 ]]; then
            error "$node - High CPU usage: ${cpu_usage}%"
        elif [[ $(echo "$cpu_usage > 60" | bc -l 2>/dev/null || echo 0) -eq 1 ]]; then
            warning "$node - Moderate CPU usage: ${cpu_usage}%"
        else
            success "$node - CPU usage: ${cpu_usage}%"
        fi
        
        if [[ $(echo "$mem_usage > 80" | bc -l 2>/dev/null || echo 0) -eq 1 ]]; then
            error "$node - High memory usage: ${mem_usage}%"
        elif [[ $(echo "$mem_usage > 60" | bc -l 2>/dev/null || echo 0) -eq 1 ]]; then
            warning "$node - Moderate memory usage: ${mem_usage}%"
        else
            success "$node - Memory usage: ${mem_usage}%"
        fi
        
        if [[ $disk_usage -gt 80 ]]; then
            error "$node - High disk usage: ${disk_usage}%"
        elif [[ $disk_usage -gt 60 ]]; then
            warning "$node - Moderate disk usage: ${disk_usage}%"
        else
            success "$node - Disk usage: ${disk_usage}%"
        fi
    done
}

# Main function
main() {
    local mode=${1:-"once"}
    local interval=${2:-30}
    
    case $mode in
        "continuous"|"monitor")
            monitor_cluster "$interval"
            ;;
        "once"|*)
            log "🔍 Single Health Check"
            check_database_health
            echo
            check_application_health
            echo
            check_resource_health
            ;;
    esac
}

# Handle script arguments
if [[ $# -eq 0 ]]; then
    main "once"
else
    main "$@"
fi
