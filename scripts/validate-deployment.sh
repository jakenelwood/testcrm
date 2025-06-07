#!/bin/bash

# 🔍 Validate TwinCiGo CRM Deployment
# Comprehensive validation and troubleshooting script
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

# Check Docker installation on all nodes
check_docker_installation() {
    log "🐳 Checking Docker installation on all nodes..."
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        log "Checking Docker on $node ($ip)..."
        
        if ssh root@"$ip" "docker --version && docker compose version && docker-compose version" >/dev/null 2>&1; then
            success "Docker is properly installed on $node"
        else
            error "Docker installation issues on $node"
            
            # Show detailed status
            ssh root@"$ip" "
                echo 'Docker version:'
                docker --version || echo 'Docker not found'
                echo 'Docker Compose plugin:'
                docker compose version || echo 'Docker Compose plugin not found'
                echo 'Docker Compose standalone:'
                docker-compose version || echo 'Docker Compose standalone not found'
            "
        fi
    done
}

# Check deployment files
check_deployment_files() {
    log "📁 Checking deployment files on all nodes..."
    
    for node in "${!NODES[@]}"; do
        ip="${NODES[$node]}"
        log "Checking files on $node ($ip)..."
        
        ssh root@"$ip" "
            if [ -d /opt/twincigo-crm ]; then
                echo 'Deployment directory exists'
                cd /opt/twincigo-crm
                
                echo 'Files present:'
                ls -la
                
                echo 'Docker Compose file:'
                if [ -f docker-compose.yml ]; then
                    echo 'docker-compose.yml exists'
                else
                    echo 'docker-compose.yml MISSING'
                fi
                
                echo 'Environment file:'
                if [ -f .env ]; then
                    echo '.env exists'
                else
                    echo '.env MISSING'
                fi
                
                echo 'Schema file:'
                if [ -f schema.sql ]; then
                    echo 'schema.sql exists'
                else
                    echo 'schema.sql MISSING'
                fi
            else
                echo 'Deployment directory /opt/twincigo-crm does NOT exist'
            fi
        "
    done
}

# Check running containers
check_running_containers() {
    log "🔍 Checking running containers..."
    
    local primary_ip="${NODES[ubuntu-8gb-hil-1]}"
    
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm 2>/dev/null || cd /
        
        echo 'Docker containers status:'
        docker ps -a
        
        echo ''
        echo 'Docker Compose services (if available):'
        if [ -f docker-compose.yml ]; then
            docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null || echo 'Could not get compose status'
        else
            echo 'No docker-compose.yml found'
        fi
    "
}

# Check network connectivity
check_network_connectivity() {
    log "🌐 Checking network connectivity..."
    
    local primary_ip="${NODES[ubuntu-8gb-hil-1]}"
    
    # Check if services are listening on expected ports
    local ports=(2379 5000 5001 7000 3000 3001 4000 5002 8080 9999 8008 8009 8010)
    local services=("etcd" "HAProxy-Primary" "HAProxy-Replica" "HAProxy-Stats" "Supabase-REST" "Supabase-Studio" "Supabase-Realtime" "Supabase-Storage" "Supabase-Meta" "Supabase-Auth" "Patroni-1" "Patroni-2" "Patroni-3")
    
    for i in "${!ports[@]}"; do
        local port="${ports[$i]}"
        local service="${services[$i]}"
        
        if ssh root@"$primary_ip" "netstat -tuln | grep :$port" >/dev/null 2>&1; then
            success "$service (port $port) is listening"
        else
            warning "$service (port $port) is NOT listening"
        fi
    done
}

# Check service health endpoints
check_service_health() {
    log "🏥 Checking service health endpoints..."
    
    local primary_ip="${NODES[ubuntu-8gb-hil-1]}"
    
    # etcd health
    if ssh root@"$primary_ip" "curl -s http://localhost:2379/health" >/dev/null 2>&1; then
        success "etcd health check passed"
    else
        error "etcd health check failed"
    fi
    
    # Patroni health
    for port in 8008 8009 8010; do
        if ssh root@"$primary_ip" "curl -s http://localhost:$port/health" >/dev/null 2>&1; then
            success "Patroni node $port health check passed"
        else
            warning "Patroni node $port health check failed"
        fi
    done
    
    # HAProxy stats
    if ssh root@"$primary_ip" "curl -s http://localhost:7000/stats" >/dev/null 2>&1; then
        success "HAProxy stats accessible"
    else
        error "HAProxy stats not accessible"
    fi
    
    # Supabase services
    local supabase_endpoints=(
        "3000:Supabase REST API"
        "9999:Supabase Auth"
        "4000:Supabase Realtime"
        "5002:Supabase Storage"
        "8080:Supabase Meta"
        "3001:Supabase Studio"
    )
    
    for endpoint in "${supabase_endpoints[@]}"; do
        local port="${endpoint%%:*}"
        local name="${endpoint##*:}"
        
        if ssh root@"$primary_ip" "curl -s http://localhost:$port" >/dev/null 2>&1; then
            success "$name is responding"
        else
            warning "$name is not responding"
        fi
    done
}

# Show detailed logs for troubleshooting
show_service_logs() {
    log "📋 Showing recent service logs for troubleshooting..."
    
    local primary_ip="${NODES[ubuntu-8gb-hil-1]}"
    
    ssh root@"$primary_ip" "
        cd /opt/twincigo-crm 2>/dev/null || cd /
        
        echo '=== Recent Docker logs ==='
        docker logs --tail=20 gardenos-etcd-dev 2>/dev/null || echo 'etcd logs not available'
        echo ''
        docker logs --tail=20 gardenos-postgres-1-dev 2>/dev/null || echo 'postgres-1 logs not available'
        echo ''
        docker logs --tail=20 gardenos-haproxy-dev 2>/dev/null || echo 'haproxy logs not available'
        echo ''
        docker logs --tail=20 gardenos-auth-dev 2>/dev/null || echo 'auth logs not available'
    "
}

# Generate troubleshooting report
generate_troubleshooting_report() {
    log "📊 Generating troubleshooting report..."
    
    local report_file="deployment_validation_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "TwinCiGo CRM Deployment Validation Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo ""
        
        echo "Node Configuration:"
        for node in "${!NODES[@]}"; do
            echo "  $node: ${NODES[$node]}"
        done
        echo ""
        
        echo "Validation Results:"
        echo "- Docker Installation: Run check_docker_installation()"
        echo "- Deployment Files: Run check_deployment_files()"
        echo "- Running Containers: Run check_running_containers()"
        echo "- Network Connectivity: Run check_network_connectivity()"
        echo "- Service Health: Run check_service_health()"
        echo ""
        
        echo "Next Steps:"
        echo "1. Fix any Docker installation issues"
        echo "2. Ensure all deployment files are present"
        echo "3. Start services using the fixed deployment script"
        echo "4. Monitor logs for any errors"
        echo "5. Test connectivity from localhost:3000"
        
    } > "$report_file"
    
    success "Troubleshooting report saved to $report_file"
}

# Main execution
main() {
    log "🔍 Starting TwinCiGo CRM Deployment Validation"
    
    echo ""
    echo "This script will validate the current deployment state and identify issues."
    echo ""
    
    # Run all checks
    check_docker_installation
    echo ""
    
    check_deployment_files
    echo ""
    
    check_running_containers
    echo ""
    
    check_network_connectivity
    echo ""
    
    check_service_health
    echo ""
    
    show_service_logs
    echo ""
    
    generate_troubleshooting_report
    
    success "🎉 Deployment validation complete!"
    
    log "📝 Recommendations:"
    log "  1. Review any errors or warnings above"
    log "  2. Run ./scripts/fix-docker-compose-issue.sh to fix Docker Compose issues"
    log "  3. Check service logs for detailed error information"
    log "  4. Ensure all required ports are open and accessible"
}

main "$@"
