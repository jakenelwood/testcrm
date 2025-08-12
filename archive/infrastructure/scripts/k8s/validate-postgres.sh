#!/bin/bash

# 🧪 PostgreSQL K3s Validation Script
# Comprehensive validation of PostgreSQL deployment
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

section() {
    echo
    echo -e "${CYAN}=== $1 ===${NC}"
    echo
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

fail() {
    echo -e "${RED}❌ $1${NC}"
}

# Test basic cluster connectivity
test_cluster_connectivity() {
    section "Cluster Connectivity Tests"
    
    # Test kubectl connectivity
    if kubectl cluster-info &>/dev/null; then
        success "kubectl connectivity"
    else
        fail "kubectl connectivity"
        return 1
    fi
    
    # Test namespace exists
    if kubectl get namespace postgres-cluster &>/dev/null; then
        success "postgres-cluster namespace exists"
    else
        fail "postgres-cluster namespace missing"
        return 1
    fi
    
    # Test storage class
    if kubectl get storageclass local-path &>/dev/null; then
        success "local-path storage class available"
    else
        fail "local-path storage class missing"
        return 1
    fi
}

# Test PostgreSQL pods
test_postgres_pods() {
    section "PostgreSQL Pod Tests"
    
    local running_pods
    running_pods=$(kubectl get pods -n postgres-cluster --no-headers | grep Running | wc -l)
    
    if [[ "$running_pods" -gt 0 ]]; then
        success "PostgreSQL pods running ($running_pods/3)"
    else
        fail "No PostgreSQL pods running"
        return 1
    fi
    
    # Test if postgres-0 is ready
    if kubectl get pod postgres-0 -n postgres-cluster --no-headers | grep -q "1/1.*Running"; then
        success "postgres-0 is ready"
    else
        fail "postgres-0 is not ready"
        return 1
    fi
}

# Test database connectivity
test_database_connectivity() {
    section "Database Connectivity Tests"
    
    # Test internal connectivity
    if kubectl exec -n postgres-cluster postgres-0 -- psql -U postgres -c "SELECT 1;" &>/dev/null; then
        success "Internal database connectivity"
    else
        fail "Internal database connectivity"
        return 1
    fi
    
    # Test database version
    local version
    version=$(kubectl exec -n postgres-cluster postgres-0 -- psql -U postgres -t -c "SELECT version();" 2>/dev/null | head -1 | xargs)
    if [[ -n "$version" ]]; then
        success "Database version: $version"
    else
        fail "Could not retrieve database version"
        return 1
    fi
    
    # Test creating a test database
    if kubectl exec -n postgres-cluster postgres-0 -- psql -U postgres -c "CREATE DATABASE IF NOT EXISTS test_db;" &>/dev/null; then
        success "Can create databases"
    else
        fail "Cannot create databases"
        return 1
    fi
    
    # Test creating a test table
    if kubectl exec -n postgres-cluster postgres-0 -- psql -U postgres -d test_db -c "CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT);" &>/dev/null; then
        success "Can create tables"
    else
        fail "Cannot create tables"
        return 1
    fi
    
    # Test inserting data
    if kubectl exec -n postgres-cluster postgres-0 -- psql -U postgres -d test_db -c "INSERT INTO test_table (name) VALUES ('test') ON CONFLICT DO NOTHING;" &>/dev/null; then
        success "Can insert data"
    else
        fail "Cannot insert data"
        return 1
    fi
    
    # Test querying data
    local count
    count=$(kubectl exec -n postgres-cluster postgres-0 -- psql -U postgres -d test_db -t -c "SELECT COUNT(*) FROM test_table;" 2>/dev/null | xargs)
    if [[ "$count" -gt 0 ]]; then
        success "Can query data (found $count rows)"
    else
        fail "Cannot query data"
        return 1
    fi
}

# Test Patroni cluster
test_patroni_cluster() {
    section "Patroni Cluster Tests"
    
    # Test patronictl command
    if kubectl exec -n postgres-cluster postgres-0 -- patronictl list &>/dev/null; then
        success "patronictl command works"
    else
        fail "patronictl command failed"
        return 1
    fi
    
    # Check cluster status
    local cluster_info
    cluster_info=$(kubectl exec -n postgres-cluster postgres-0 -- patronictl list 2>/dev/null)
    
    if echo "$cluster_info" | grep -q "Leader.*running"; then
        success "Cluster has a running leader"
    else
        fail "No running leader found"
        return 1
    fi
    
    # Count cluster members
    local member_count
    member_count=$(echo "$cluster_info" | grep -c "postgres-" || echo "0")
    info "Cluster members found: $member_count"
    
    if [[ "$member_count" -gt 0 ]]; then
        success "Cluster has members"
    else
        fail "No cluster members found"
        return 1
    fi
}

# Test etcd connectivity
test_etcd_connectivity() {
    section "etcd Connectivity Tests"
    
    # Test etcd health from each node
    local healthy_nodes=0
    for host in 5.78.103.224 5.161.110.205 178.156.186.10; do
        if curl -s "http://$host:2379/health" | grep -q '"health":"true"'; then
            success "etcd node $host is healthy"
            ((healthy_nodes++))
        else
            fail "etcd node $host is unhealthy"
        fi
    done
    
    if [[ "$healthy_nodes" -ge 2 ]]; then
        success "etcd cluster has quorum ($healthy_nodes/3 nodes healthy)"
    else
        fail "etcd cluster lacks quorum ($healthy_nodes/3 nodes healthy)"
        return 1
    fi
}

# Test services and networking
test_services() {
    section "Service and Networking Tests"
    
    # Test cluster service
    if kubectl get service postgres-cluster -n postgres-cluster &>/dev/null; then
        success "postgres-cluster service exists"
    else
        fail "postgres-cluster service missing"
        return 1
    fi
    
    # Test external service
    if kubectl get service postgres-external -n postgres-cluster &>/dev/null; then
        success "postgres-external service exists"
    else
        fail "postgres-external service missing"
        return 1
    fi
    
    # Get external port
    local external_port
    external_port=$(kubectl get service postgres-external -n postgres-cluster -o jsonpath='{.spec.ports[0].nodePort}')
    if [[ -n "$external_port" ]]; then
        success "External access available on port $external_port"
    else
        fail "External port not configured"
        return 1
    fi
}

# Test persistent storage
test_storage() {
    section "Persistent Storage Tests"
    
    # Test PVCs
    local bound_pvcs
    bound_pvcs=$(kubectl get pvc -n postgres-cluster --no-headers | grep Bound | wc -l)
    
    if [[ "$bound_pvcs" -gt 0 ]]; then
        success "Persistent volumes bound ($bound_pvcs)"
    else
        fail "No persistent volumes bound"
        return 1
    fi
    
    # Test data persistence by checking if data directory exists
    if kubectl exec -n postgres-cluster postgres-0 -- test -d /var/lib/postgresql/data/base; then
        success "PostgreSQL data directory exists"
    else
        fail "PostgreSQL data directory missing"
        return 1
    fi
}

# Generate summary report
generate_summary() {
    section "Validation Summary"
    
    local total_tests=6
    local passed_tests=0
    
    echo "Running comprehensive validation..."
    echo
    
    if test_cluster_connectivity; then ((passed_tests++)); fi
    if test_postgres_pods; then ((passed_tests++)); fi
    if test_database_connectivity; then ((passed_tests++)); fi
    if test_patroni_cluster; then ((passed_tests++)); fi
    if test_etcd_connectivity; then ((passed_tests++)); fi
    if test_services; then ((passed_tests++)); fi
    if test_storage; then ((passed_tests++)); fi
    
    echo
    echo -e "${CYAN}=== FINAL RESULTS ===${NC}"
    echo
    
    if [[ "$passed_tests" -eq "$total_tests" ]]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! ($passed_tests/$total_tests)${NC}"
        echo -e "${GREEN}PostgreSQL cluster is fully operational!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  PARTIAL SUCCESS ($passed_tests/$total_tests tests passed)${NC}"
        echo -e "${YELLOW}Some issues need attention.${NC}"
        return 1
    fi
}

# Main execution
main() {
    log "PostgreSQL K3s Validation Tool"
    echo "This script will validate the PostgreSQL deployment"
    echo
    
    generate_summary
}

# Run main function
main "$@"
