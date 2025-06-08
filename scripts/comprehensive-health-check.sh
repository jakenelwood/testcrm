#!/bin/bash

# 🏥 Comprehensive Server Health Check Script
# Tests all critical infrastructure components and identifies issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
HETZNER_HOST="5.78.103.224"
BACKUP_HOSTS=("5.161.110.205" "178.156.186.10")
COMPOSE_DIR="/opt/twincigo-crm"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
REPORT_DIR="docs/reporting/health_reports"
REPORT_FILE="$REPORT_DIR/health_report_${TIMESTAMP}.txt"

# Create report directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Health tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0
ISSUES=()
WARNINGS=()

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$REPORT_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "✅ $1" >> "$REPORT_FILE"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    echo "❌ $1" >> "$REPORT_FILE"
    ISSUES+=("$1")
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "⚠️  $1" >> "$REPORT_FILE"
    WARNINGS+=("$1")
    ((WARNING_CHECKS++))
    ((TOTAL_CHECKS++))
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
    echo "ℹ️  $1" >> "$REPORT_FILE"
}

header() {
    echo -e "\n${BOLD}${BLUE}$1${NC}"
    echo -e "\n$1" >> "$REPORT_FILE"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
    echo "$(printf '=%.0s' {1..50})" >> "$REPORT_FILE"
}

# Test functions
test_host_connectivity() {
    header "🌐 Host Connectivity Tests"
    
    # Primary host
    if ping -c 1 "$HETZNER_HOST" >/dev/null 2>&1; then
        success "Primary host $HETZNER_HOST is reachable"
    else
        error "Primary host $HETZNER_HOST is unreachable"
        return 1
    fi
    
    # SSH connectivity
    info "Testing SSH connection to $HETZNER_HOST..."
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$HETZNER_HOST" "echo 'SSH test successful'" >/dev/null 2>&1; then
        success "SSH connection to $HETZNER_HOST successful"
    else
        error "SSH connection to $HETZNER_HOST failed"
        # Don't return early, continue with other tests
    fi
    
    # Backup hosts
    for host in "${BACKUP_HOSTS[@]}"; do
        if ping -c 1 "$host" >/dev/null 2>&1; then
            success "Backup host $host is reachable"
        else
            warning "Backup host $host is unreachable"
        fi
    done
}

test_etcd_cluster() {
    header "🔧 etcd Cluster Health"
    
    local healthy_nodes=0
    local total_nodes=0
    
    # Test all etcd endpoints
    for host in "$HETZNER_HOST" "${BACKUP_HOSTS[@]}"; do
        ((total_nodes++))
        if curl -s "http://$host:2379/health" | grep -q '"health":"true"' 2>/dev/null; then
            success "etcd on $host is healthy"
            ((healthy_nodes++))
        else
            error "etcd on $host is unhealthy or unreachable"
        fi
    done
    
    # Cluster health assessment
    if [ $healthy_nodes -eq $total_nodes ]; then
        success "etcd cluster is fully healthy ($healthy_nodes/$total_nodes nodes)"
    elif [ $healthy_nodes -gt $((total_nodes / 2)) ]; then
        warning "etcd cluster has quorum but some nodes are down ($healthy_nodes/$total_nodes nodes)"
    else
        error "etcd cluster has lost quorum ($healthy_nodes/$total_nodes nodes)"
    fi
}

test_k3s_cluster() {
    header "☸️  K3s Cluster Health"
    
    # K3s service status
    info "Checking K3s service status..."
    if ssh -o ConnectTimeout=10 root@"$HETZNER_HOST" "systemctl is-active k3s" >/dev/null 2>&1; then
        success "K3s service is running"
    else
        error "K3s service is not running"
        # Continue with other tests even if K3s is down
    fi
    
    # Node status
    local node_output
    if node_output=$(ssh root@"$HETZNER_HOST" "k3s kubectl get nodes --no-headers" 2>/dev/null); then
        local ready_nodes=$(echo "$node_output" | grep -c "Ready" || echo "0")
        local total_nodes=$(echo "$node_output" | wc -l)
        
        if [ "$ready_nodes" -eq "$total_nodes" ] && [ "$ready_nodes" -gt 0 ]; then
            success "All K3s nodes are Ready ($ready_nodes/$total_nodes)"
        else
            warning "Some K3s nodes are not Ready ($ready_nodes/$total_nodes)"
        fi
    else
        error "Failed to get K3s node status"
    fi
    
    # Core system pods
    local core_pods
    if core_pods=$(ssh root@"$HETZNER_HOST" "k3s kubectl get pods -n kube-system --no-headers" 2>/dev/null); then
        local running_pods=$(echo "$core_pods" | grep -c "Running" || echo "0")
        local total_pods=$(echo "$core_pods" | wc -l)
        
        if [ "$running_pods" -gt 0 ]; then
            success "K3s core system pods are running ($running_pods/$total_pods)"
        else
            error "No K3s core system pods are running"
        fi
    else
        warning "Failed to get K3s system pod status"
    fi
}

test_docker_services() {
    header "🐳 Docker Services Health"
    
    # Docker service status
    info "Checking Docker service status..."
    if ssh -o ConnectTimeout=10 root@"$HETZNER_HOST" "systemctl is-active docker" >/dev/null 2>&1; then
        success "Docker service is running"
    else
        error "Docker service is not running"
        # Continue with other tests
    fi
    
    # Container status
    local container_output
    if container_output=$(ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose ps --format 'table {{.Name}}\t{{.Status}}'" 2>/dev/null); then
        local running_containers=$(echo "$container_output" | grep -c "Up" || echo "0")
        local total_containers=$(echo "$container_output" | tail -n +2 | wc -l)
        
        if [ "$running_containers" -gt 0 ]; then
            success "Docker containers are running ($running_containers/$total_containers)"
            
            # Check specific critical containers
            if echo "$container_output" | grep -q "postgres.*Up"; then
                success "PostgreSQL containers are running"
            else
                error "PostgreSQL containers are not running"
            fi
        else
            error "No Docker containers are running"
        fi
    else
        error "Failed to get Docker container status"
    fi
}

test_patroni_cluster() {
    header "🗄️  Patroni PostgreSQL Cluster"
    
    # Test Patroni API endpoints
    local leader_count=0
    local replica_count=0
    local total_members=0
    
    for port in 8008 8009 8010; do
        if cluster_info=$(curl -s "http://$HETZNER_HOST:$port/cluster" 2>/dev/null); then
            if echo "$cluster_info" | grep -q "members"; then
                success "Patroni API on port $port is responding"
                
                # Parse cluster information
                local leaders=$(echo "$cluster_info" | sed 's/,/\n/g' | grep -c '"role": "leader"')
                local replicas=$(echo "$cluster_info" | sed 's/,/\n/g' | grep -c '"role": "replica"')
                local members=$(echo "$cluster_info" | sed 's/,/\n/g' | grep -c '"name":')

                # Fallback if sed approach doesn't work
                if [ "$leaders" -eq 0 ] && [ "$replicas" -eq 0 ]; then
                    leaders=$(echo "$cluster_info" | grep -o '"role":"leader"' | wc -l)
                    replicas=$(echo "$cluster_info" | grep -o '"role":"replica"' | wc -l)
                    members=$(echo "$cluster_info" | grep -o '"name":"[^"]*"' | wc -l)
                fi
                
                leader_count=$leaders
                replica_count=$replicas
                total_members=$members
                break
            fi
        else
            warning "Patroni API on port $port is not responding"
        fi
    done
    
    # Cluster health assessment
    if [ "$leader_count" -eq 1 ] && [ "$replica_count" -ge 1 ]; then
        success "Patroni cluster is healthy (1 leader, $replica_count replicas, $total_members total)"
    elif [ "$leader_count" -eq 0 ]; then
        error "Patroni cluster has no leader"
    elif [ "$leader_count" -gt 1 ]; then
        error "Patroni cluster has multiple leaders ($leader_count)"
    else
        warning "Patroni cluster configuration may need attention (leader: $leader_count, replicas: $replica_count)"
    fi
    
    # Database connectivity
    for port in 5435 5433 5434; do
        if ssh root@"$HETZNER_HOST" "timeout 3 bash -c '</dev/tcp/localhost/$port'" >/dev/null 2>&1; then
            success "PostgreSQL is accepting connections on port $port"
        else
            warning "PostgreSQL is not accepting connections on port $port"
        fi
    done
}

test_application_services() {
    header "🚀 Application Services"
    
    # Test key application endpoints (corrected ports)
    local services=(
        "8080:HAProxy Web Frontend"
        "8404:HAProxy Stats"
        "5432:HAProxy PostgreSQL LB"
        "6443:HAProxy K3s API LB"
    )
    
    for service in "${services[@]}"; do
        local port=$(echo "$service" | cut -d: -f1)
        local name=$(echo "$service" | cut -d: -f2)
        
        if ssh root@"$HETZNER_HOST" "timeout 3 bash -c '</dev/tcp/localhost/$port'" >/dev/null 2>&1; then
            success "$name is listening on port $port"
        else
            warning "$name is not listening on port $port"
        fi
    done

    # Test K3s-based Supabase services
    info "Checking K3s-based Supabase services..."
    local k3s_services=(
        "supabase:gotrue:Supabase Auth"
        "supabase:postgrest:Supabase REST"
        "supabase:storage-api:Supabase Storage"
    )

    for service in "${k3s_services[@]}"; do
        local namespace=$(echo "$service" | cut -d: -f1)
        local svc_name=$(echo "$service" | cut -d: -f2)
        local display_name=$(echo "$service" | cut -d: -f3)

        if ssh root@"$HETZNER_HOST" "k3s kubectl get service $svc_name -n $namespace" >/dev/null 2>&1; then
            # Check if pods are running
            local running_pods=$(ssh root@"$HETZNER_HOST" "k3s kubectl get pods -n $namespace -l app=$svc_name --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l")
            if [ "$running_pods" -gt 0 ]; then
                success "$display_name is running in K3s ($running_pods pods)"
            else
                warning "$display_name service exists but no running pods"
            fi
        else
            warning "$display_name service not found in K3s"
        fi
    done
}

test_security_compliance() {
    header "🔒 Security Compliance"
    
    # Run local security validation
    if [ -f "scripts/validate-security.js" ]; then
        info "Running security validation..."
        if security_output=$(node scripts/validate-security.js 2>&1); then
            # Parse the actual output format more carefully
            local passed_count=$(echo "$security_output" | grep "✅ Passed:" | sed 's/.*✅ Passed: \([0-9]*\).*/\1/')
            local failed_count=$(echo "$security_output" | grep "❌ Failed:" | sed 's/.*❌ Failed: \([0-9]*\).*/\1/')
            local warning_count=$(echo "$security_output" | grep "⚠️  Warnings:" | sed 's/.*⚠️  Warnings: \([0-9]*\).*/\1/')

            # Validate that we got numbers
            if [[ "$passed_count" =~ ^[0-9]+$ ]] && [[ "$failed_count" =~ ^[0-9]+$ ]] && [[ "$warning_count" =~ ^[0-9]+$ ]]; then
                if [ "$failed_count" -eq 0 ] && [ "$warning_count" -eq 0 ]; then
                    success "Security compliance: $passed_count/$passed_count checks passed (100%)"
                elif [ "$failed_count" -eq 0 ]; then
                    warning "Security compliance: $passed_count passed, $warning_count warnings"
                else
                    error "Security compliance: $failed_count critical issues found"
                fi
            else
                # Fallback: check for the summary message
                if echo "$security_output" | grep -q "ALL SECURITY CHECKS PASSED"; then
                    success "Security compliance: All security checks passed (100%)"
                else
                    warning "Security validation completed but could not parse detailed results"
                fi
            fi
        else
            warning "Security validation script failed to run"
        fi
    else
        warning "Security validation script not found"
    fi
    
    # Check environment file security
    if [ -f ".env.local" ]; then
        # Check if it contains real secrets or just templates
        if grep -q "your_dev_" ".env.local" && grep -q "development_password" ".env.local"; then
            success "Local .env.local file contains safe template values"
            info "Optional: Consider server-centralized management for team workflows"
        else
            error "Local .env.local file contains real secrets (should use server-centralized management)"
        fi
    else
        success "No local .env.local file (using server-centralized management)"
    fi
}

generate_summary() {
    header "📊 Health Check Summary"
    
    local health_percentage=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    echo -e "\n${BOLD}Overall Health Score: ${health_percentage}%${NC}"
    echo -e "\nOverall Health Score: ${health_percentage}%" >> "$REPORT_FILE"
    echo -e "${GREEN}✅ Passed: $PASSED_CHECKS${NC}"
    echo "✅ Passed: $PASSED_CHECKS" >> "$REPORT_FILE"
    echo -e "${YELLOW}⚠️  Warnings: $WARNING_CHECKS${NC}"
    echo "⚠️  Warnings: $WARNING_CHECKS" >> "$REPORT_FILE"
    echo -e "${RED}❌ Failed: $FAILED_CHECKS${NC}"
    echo "❌ Failed: $FAILED_CHECKS" >> "$REPORT_FILE"
    echo -e "${BLUE}📋 Total Checks: $TOTAL_CHECKS${NC}"
    echo "📋 Total Checks: $TOTAL_CHECKS" >> "$REPORT_FILE"
    
    # Health status
    if [ $health_percentage -ge 90 ]; then
        echo -e "\n${GREEN}🎉 EXCELLENT HEALTH - Production Ready!${NC}"
        echo -e "\n🎉 EXCELLENT HEALTH - Production Ready!" >> "$REPORT_FILE"
    elif [ $health_percentage -ge 75 ]; then
        echo -e "\n${YELLOW}⚠️  GOOD HEALTH - Minor issues to address${NC}"
        echo -e "\n⚠️  GOOD HEALTH - Minor issues to address" >> "$REPORT_FILE"
    elif [ $health_percentage -ge 50 ]; then
        echo -e "\n${YELLOW}⚠️  FAIR HEALTH - Several issues need attention${NC}"
        echo -e "\n⚠️  FAIR HEALTH - Several issues need attention" >> "$REPORT_FILE"
    else
        echo -e "\n${RED}🚨 POOR HEALTH - Critical issues require immediate attention${NC}"
        echo -e "\n🚨 POOR HEALTH - Critical issues require immediate attention" >> "$REPORT_FILE"
    fi
    
    # List critical issues
    if [ ${#ISSUES[@]} -gt 0 ]; then
        echo -e "\n${RED}🚨 Critical Issues:${NC}"
        echo -e "\n🚨 Critical Issues:" >> "$REPORT_FILE"
        for issue in "${ISSUES[@]}"; do
            echo -e "${RED}  • $issue${NC}"
            echo "  • $issue" >> "$REPORT_FILE"
        done
    fi

    # List warnings
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}⚠️  Warnings:${NC}"
        echo -e "\n⚠️  Warnings:" >> "$REPORT_FILE"
        for warning in "${WARNINGS[@]}"; do
            echo -e "${YELLOW}  • $warning${NC}"
            echo "  • $warning" >> "$REPORT_FILE"
        done
    fi
    
    echo -e "\n${CYAN}📄 Full report saved to: $REPORT_FILE${NC}"
}

# Main execution
main() {
    echo -e "${BOLD}${BLUE}🏥 Comprehensive Server Health Check${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
    echo -e "${CYAN}Timestamp: $(date)${NC}"
    echo -e "${CYAN}Primary Host: $HETZNER_HOST${NC}"
    echo -e "${CYAN}Report File: $REPORT_FILE${NC}\n"
    
    # Initialize report file
    echo "Comprehensive Server Health Check Report" > "$REPORT_FILE"
    echo "Generated: $(date)" >> "$REPORT_FILE"
    echo "Primary Host: $HETZNER_HOST" >> "$REPORT_FILE"
    echo "=========================================" >> "$REPORT_FILE"
    
    # Run all tests with progress
    echo -e "${CYAN}Running comprehensive health checks...${NC}\n"

    echo -e "${CYAN}[1/7]${NC} Testing host connectivity..."
    test_host_connectivity || true

    echo -e "${CYAN}[2/7]${NC} Testing etcd cluster..."
    test_etcd_cluster || true

    echo -e "${CYAN}[3/7]${NC} Testing K3s cluster..."
    test_k3s_cluster || true

    echo -e "${CYAN}[4/7]${NC} Testing Docker services..."
    test_docker_services || true

    echo -e "${CYAN}[5/7]${NC} Testing Patroni cluster..."
    test_patroni_cluster || true

    echo -e "${CYAN}[6/7]${NC} Testing application services..."
    test_application_services || true

    echo -e "${CYAN}[7/7]${NC} Testing security compliance..."
    test_security_compliance || true
    
    # Generate summary
    generate_summary
    
    # Exit with appropriate code
    if [ $FAILED_CHECKS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"
