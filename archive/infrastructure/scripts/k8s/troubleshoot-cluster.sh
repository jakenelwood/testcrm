#!/bin/bash

# 🔍 GardenOS Cluster Troubleshooting Script
# Comprehensive troubleshooting for K3s, PostgreSQL, and etcd issues
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Source common utilities
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  cluster               Check overall cluster health"
    echo "  postgres              Troubleshoot PostgreSQL cluster"
    echo "  etcd                  Check etcd cluster health"
    echo "  kubectl               Debug kubectl connectivity issues"
    echo "  patroni               Check Patroni leader election and DCS"
    echo "  replication           Analyze PostgreSQL replication issues"
    echo "  services              Check service discovery and endpoints"
    echo "  supabase              Analyze Supabase connectivity issues"
    echo "  all                   Run all troubleshooting checks"
    echo
    echo "Options:"
    echo "  --verbose             Show detailed output"
    echo "  --help                Show this help message"
    echo
}

# Check overall cluster health
check_cluster_health() {
    section "Cluster Health Overview"
    
    info "K3s nodes status:"
    kubectl get nodes -o wide || warn "Failed to get nodes"
    echo
    
    info "System pods status:"
    kubectl get pods -n kube-system || warn "Failed to get system pods"
    echo
    
    info "Storage classes:"
    kubectl get storageclass || warn "Failed to get storage classes"
    echo
}

# Check etcd cluster health
check_etcd_health() {
    section "etcd Cluster Health"
    
    for server in "${ETCD_SERVERS[@]}"; do
        echo -n "etcd $server:$ETCD_PORT: "
        if curl -s --connect-timeout 5 "http://$server:$ETCD_PORT/health" | grep -q '"health":"true"'; then
            echo -e "${GREEN}HEALTHY${NC}"
        else
            echo -e "${RED}UNHEALTHY${NC}"
        fi
    done
    echo
    
    info "etcd cluster members (v3 API):"
    local result
    result=$(curl -X POST "http://${ETCD_SERVERS[0]}:$ETCD_PORT/v3/cluster/member/list" \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null)

    if echo "$result" | jq -e '.members' >/dev/null 2>&1; then
        echo "$result" | jq '.members[] | {name: .name, clientURLs: .clientURLs}' 2>/dev/null
    else
        warn "Failed to get etcd members via v3 API"
    fi
    echo
}

# Debug kubectl connectivity issues
debug_kubectl() {
    section "kubectl Connectivity Debugging"
    
    info "Testing kubectl with high verbosity..."
    timeout 10 kubectl get nodes -v=8 2>&1 | head -20 || warn "kubectl command failed or timed out"
    echo
    
    info "Checking kubeconfig:"
    kubectl config current-context || warn "No current context"
    kubectl config get-clusters || warn "Failed to get clusters"
    echo
    
    info "Testing API server connectivity:"
    for server in "${ETCD_SERVERS[@]}"; do
        echo -n "API server $server:6443: "
        if timeout 5 curl -k -s "https://$server:6443/healthz" >/dev/null 2>&1; then
            echo -e "${GREEN}ACCESSIBLE${NC}"
        else
            echo -e "${RED}INACCESSIBLE${NC}"
        fi
    done
    echo
}

# Check PostgreSQL cluster status
check_postgres() {
    section "PostgreSQL Cluster Status"
    
    info "PostgreSQL namespace resources:"
    kubectl get all -n "$POSTGRES_NAMESPACE" 2>/dev/null || warn "Failed to get postgres resources"
    echo
    
    info "PostgreSQL pods detailed status:"
    kubectl get pods -n "$POSTGRES_NAMESPACE" -o wide 2>/dev/null || warn "Failed to get postgres pods"
    echo
    
    info "Persistent volumes:"
    kubectl get pvc -n "$POSTGRES_NAMESPACE" 2>/dev/null || warn "Failed to get PVCs"
    echo
    
    # Check individual pod logs if accessible
    local pods
    pods=$(kubectl get pods -n "$POSTGRES_NAMESPACE" --no-headers 2>/dev/null | awk '{print $1}' || echo "")
    
    for pod in $pods; do
        if kubectl get pod "$pod" -n "$POSTGRES_NAMESPACE" >/dev/null 2>&1; then
            info "Recent logs for $pod:"
            kubectl logs "$pod" -n "$POSTGRES_NAMESPACE" --tail=10 2>/dev/null || warn "Failed to get logs for $pod"
            echo
        fi
    done
}

# Check Patroni cluster status and leader election
check_patroni() {
    section "Patroni Cluster Analysis"
    
    # Find an accessible postgres pod
    local accessible_pod=""
    for pod in postgres-0 postgres-1 postgres-2; do
        if timeout 5 kubectl get pod "$pod" -n "$POSTGRES_NAMESPACE" >/dev/null 2>&1; then
            accessible_pod="$pod"
            break
        fi
    done
    
    if [[ -n "$accessible_pod" ]]; then
        info "Using accessible pod: $accessible_pod"
        
        info "Patroni cluster status:"
        kubectl exec "$accessible_pod" -n "$POSTGRES_NAMESPACE" -- patronictl list 2>/dev/null || warn "Failed to get Patroni status"
        echo
        
        info "Patroni configuration:"
        kubectl exec "$accessible_pod" -n "$POSTGRES_NAMESPACE" -- patronictl show-config 2>/dev/null || warn "Failed to get Patroni config"
        echo
        
        info "etcd connectivity from pod:"
        kubectl exec "$accessible_pod" -n "$POSTGRES_NAMESPACE" -- curl -s --connect-timeout 5 "http://${ETCD_SERVERS[0]}:$ETCD_PORT/health" 2>/dev/null || warn "etcd not accessible from pod"
        echo
        
    else
        warn "No accessible PostgreSQL pods found"
    fi
}

# Analyze replication issues
check_replication() {
    section "PostgreSQL Replication Analysis"

    # Find the leader pod
    local leader_pod=""
    for pod in postgres-0 postgres-1 postgres-2; do
        if kubectl exec "$pod" -n "$POSTGRES_NAMESPACE" -- patronictl list 2>/dev/null | grep -q "$pod.*Leader"; then
            leader_pod="$pod"
            break
        fi
    done

    if [[ -n "$leader_pod" ]]; then
        info "Found leader pod: $leader_pod"

        info "Replication users:"
        kubectl exec "$leader_pod" -n "$POSTGRES_NAMESPACE" -- psql -U postgres -c "SELECT usename, userepl FROM pg_user WHERE userepl = true;" 2>/dev/null || warn "Failed to query replication users"
        echo

        info "Active replication connections:"
        kubectl exec "$leader_pod" -n "$POSTGRES_NAMESPACE" -- psql -U postgres -c "SELECT * FROM pg_stat_replication;" 2>/dev/null || warn "Failed to query replication status"
        echo

        info "Current pg_hba.conf (first 20 lines):"
        kubectl exec "$leader_pod" -n "$POSTGRES_NAMESPACE" -- head -20 /var/lib/postgresql/data/pg_hba.conf 2>/dev/null || warn "Failed to read pg_hba.conf"
        echo

    else
        warn "No leader pod found or accessible"
    fi
}

# Check service discovery and endpoint configuration
check_service_discovery() {
    section "Service Discovery Analysis"

    info "PostgreSQL service endpoints:"
    kubectl get endpoints -n "$POSTGRES_NAMESPACE" -o wide 2>/dev/null || warn "Failed to get endpoints"
    echo

    info "Service selector analysis:"
    for svc in postgres-cluster postgres-primary postgres-replica postgres-external; do
        echo "Service: $svc"
        kubectl get svc "$svc" -n "$POSTGRES_NAMESPACE" -o jsonpath='{.spec.selector}' 2>/dev/null | jq '.' || echo "Service not found"
        echo
    done

    info "Pod labels analysis:"
    kubectl get pods -n "$POSTGRES_NAMESPACE" --show-labels 2>/dev/null || warn "Failed to get pod labels"
    echo

    info "Testing connectivity to each service:"
    for svc in postgres-cluster postgres-primary postgres-replica; do
        echo -n "Testing $svc: "
        if kubectl exec postgres-0 -n "$POSTGRES_NAMESPACE" -- timeout 5 pg_isready -h "$svc.$POSTGRES_NAMESPACE.svc.cluster.local" -p 5432 >/dev/null 2>&1; then
            echo -e "${GREEN}ACCESSIBLE${NC}"
        else
            echo -e "${RED}INACCESSIBLE${NC}"
        fi
    done
    echo

    info "Patroni REST API endpoints:"
    for pod in postgres-0 postgres-1 postgres-2; do
        if kubectl get pod "$pod" -n "$POSTGRES_NAMESPACE" >/dev/null 2>&1; then
            echo "Pod $pod Patroni API:"
            kubectl exec "$pod" -n "$POSTGRES_NAMESPACE" -- curl -s http://localhost:8008/cluster 2>/dev/null | jq '.' || warn "Failed to get Patroni cluster info from $pod"
            echo
        fi
    done
}

# Check Supabase service connectivity issues
check_supabase_connectivity() {
    section "Supabase Connectivity Analysis"

    info "Supabase pod status:"
    kubectl get pods -n supabase -o wide 2>/dev/null || warn "Supabase namespace not found"
    echo

    info "Supabase service endpoints:"
    kubectl get endpoints -n supabase 2>/dev/null || warn "Failed to get Supabase endpoints"
    echo

    # Test database connectivity from Supabase namespace
    info "Testing database connectivity from Supabase pods:"
    local supabase_pods
    supabase_pods=$(kubectl get pods -n supabase --no-headers 2>/dev/null | grep Running | awk '{print $1}' || echo "")

    for pod in $supabase_pods; do
        echo "Testing from $pod:"

        # Test connection to different PostgreSQL services
        for svc in postgres-cluster postgres-primary postgres-replica; do
            echo -n "  $svc: "
            if kubectl exec "$pod" -n supabase -- timeout 5 nc -z "$svc.postgres-cluster.svc.cluster.local" 5432 >/dev/null 2>&1; then
                echo -e "${GREEN}REACHABLE${NC}"
            else
                echo -e "${RED}UNREACHABLE${NC}"
            fi
        done
        echo
    done

    info "Recent logs from failing Supabase services:"
    for deployment in postgrest gotrue storage-api; do
        echo "Logs from $deployment:"
        kubectl logs -n supabase "deployment/$deployment" --tail=5 2>/dev/null || warn "Failed to get logs for $deployment"
        echo "---"
    done
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    VERBOSE="false"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            cluster|postgres|etcd|kubectl|patroni|replication|services|supabase|all)
                COMMAND="$1"
                shift
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    if [[ -z "$COMMAND" ]]; then
        usage
        exit 1
    fi
}

# Main execution
main() {
    print_header "GardenOS Cluster Troubleshooting" "Comprehensive debugging for K3s, PostgreSQL, and etcd"
    
    parse_args "$@"
    
    case "$COMMAND" in
        cluster)
            check_cluster_health
            ;;
        postgres)
            check_postgres
            ;;
        etcd)
            check_etcd_health
            ;;
        kubectl)
            debug_kubectl
            ;;
        patroni)
            check_patroni
            ;;
        replication)
            check_replication
            ;;
        services)
            check_service_discovery
            ;;
        supabase)
            check_supabase_connectivity
            ;;
        all)
            check_cluster_health
            check_etcd_health
            debug_kubectl
            check_postgres
            check_patroni
            check_replication
            check_service_discovery
            check_supabase_connectivity
            ;;
        *)
            error "Unknown command: $COMMAND"
            ;;
    esac
    
    print_footer "Troubleshooting"
}

# Run main function
main "$@"
