#!/bin/bash

# 🔍 PostgreSQL K3s Debugging Script
# Comprehensive debugging for PostgreSQL deployment issues
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Source common utilities
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

# Check cluster health
check_cluster_health() {
    section "Cluster Health Check"
    
    info "Checking K3s nodes..."
    kubectl get nodes -o wide
    echo
    
    info "Checking system pods..."
    kubectl get pods -n kube-system
    echo
    
    info "Checking storage classes..."
    kubectl get storageclass
    echo
    
    info "Checking etcd health..."
    for host in "${ETCD_SERVERS[@]}"; do
        echo -n "etcd $host: "
        if curl -s "http://$host:$ETCD_PORT/health" | grep -q '"health":"true"'; then
            echo -e "${GREEN}HEALTHY${NC}"
        else
            echo -e "${RED}UNHEALTHY${NC}"
        fi
    done
    echo
}

# Check PostgreSQL namespace and resources
check_postgres_resources() {
    section "PostgreSQL Resources Check"
    
    info "Checking namespace..."
    kubectl get namespace postgres-cluster || echo "Namespace not found"
    echo
    
    info "Checking ConfigMaps..."
    kubectl get configmap -n postgres-cluster || echo "No ConfigMaps found"
    echo
    
    info "Checking Secrets..."
    kubectl get secret -n postgres-cluster || echo "No Secrets found"
    echo
    
    info "Checking StatefulSet..."
    kubectl get statefulset -n postgres-cluster || echo "No StatefulSets found"
    echo
    
    info "Checking Services..."
    kubectl get svc -n postgres-cluster || echo "No Services found"
    echo
}

# Check PostgreSQL pods and storage
check_postgres_pods() {
    section "PostgreSQL Pods and Storage Check"
    
    info "Checking pods..."
    kubectl get pods -n "$POSTGRES_NAMESPACE" -o wide || echo "No pods found"
    echo

    info "Checking PVCs..."
    kubectl get pvc -n "$POSTGRES_NAMESPACE" || echo "No PVCs found"
    echo
    
    info "Checking PVs..."
    kubectl get pv | grep postgres || echo "No PostgreSQL PVs found"
    echo
    
    # Describe problematic pods
    local pods
    pods=$(kubectl get pods -n postgres-cluster --no-headers 2>/dev/null | awk '{print $1}' || echo "")
    
    for pod in $pods; do
        local status
        status=$(kubectl get pod "$pod" -n postgres-cluster --no-headers | awk '{print $3}')
        
        if [[ "$status" != "Running" ]]; then
            info "Describing problematic pod: $pod (Status: $status)"
            kubectl describe pod "$pod" -n postgres-cluster
            echo
            
            info "Pod events for $pod:"
            kubectl get events -n postgres-cluster --field-selector involvedObject.name="$pod" --sort-by='.lastTimestamp'
            echo
        fi
    done
}

# Check PVC binding issues
check_pvc_issues() {
    section "PVC Binding Issues Check"
    
    local pvcs
    pvcs=$(kubectl get pvc -n postgres-cluster --no-headers 2>/dev/null | awk '{print $1}' || echo "")
    
    for pvc in $pvcs; do
        local status
        status=$(kubectl get pvc "$pvc" -n postgres-cluster --no-headers | awk '{print $2}')
        
        if [[ "$status" != "Bound" ]]; then
            info "Describing problematic PVC: $pvc (Status: $status)"
            kubectl describe pvc "$pvc" -n postgres-cluster
            echo
        fi
    done
}

# Check node labels and taints
check_node_scheduling() {
    section "Node Scheduling Check"
    
    info "Checking node labels..."
    kubectl get nodes --show-labels
    echo
    
    info "Checking node taints..."
    kubectl describe nodes | grep -A 5 "Taints:"
    echo
    
    info "Checking if nodes have required labels..."
    local nodes_with_tier
    nodes_with_tier=$(kubectl get nodes -l node.gardenos.io/tier=hybrid --no-headers | wc -l)
    
    if [[ "$nodes_with_tier" -eq 0 ]]; then
        warn "No nodes found with label 'node.gardenos.io/tier=hybrid'"
        info "Available node labels:"
        kubectl get nodes --show-labels | grep -o 'node\.gardenos\.io/[^,]*' || echo "No gardenos labels found"
    else
        info "Found $nodes_with_tier nodes with required tier label"
    fi
    echo
}

# Check storage provisioner
check_storage_provisioner() {
    section "Storage Provisioner Check"
    
    info "Checking local-path-provisioner..."
    kubectl get pods -n local-path-storage || echo "local-path-storage namespace not found"
    echo
    
    info "Checking storage classes..."
    kubectl get storageclass -o wide
    echo
    
    info "Checking default storage class..."
    kubectl get storageclass -o jsonpath='{.items[?(@.metadata.annotations.storageclass\.kubernetes\.io/is-default-class=="true")].metadata.name}' || echo "No default storage class"
    echo
}

# Show logs for debugging
show_debug_logs() {
    section "Debug Logs"
    
    # Show local-path-provisioner logs if available
    local provisioner_pod
    provisioner_pod=$(kubectl get pods -n local-path-storage --no-headers 2>/dev/null | awk '{print $1}' | head -1 || echo "")
    
    if [[ -n "$provisioner_pod" ]]; then
        info "local-path-provisioner logs (last 20 lines):"
        kubectl logs -n local-path-storage "$provisioner_pod" --tail=20
        echo
    fi
    
    # Show PostgreSQL pod logs if available
    local postgres_pods
    postgres_pods=$(kubectl get pods -n postgres-cluster --no-headers 2>/dev/null | awk '{print $1}' || echo "")
    
    for pod in $postgres_pods; do
        info "PostgreSQL pod logs for $pod (last 20 lines):"
        kubectl logs -n postgres-cluster "$pod" --tail=20 || echo "No logs available"
        echo
    done
}

# Generate remediation suggestions
generate_remediation() {
    section "Remediation Suggestions"
    
    # Check if storage class exists
    if ! kubectl get storageclass local-path &>/dev/null; then
        error "Missing local-path storage class"
        echo "Remediation: Install local-path-provisioner:"
        echo "  kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.30/deploy/local-path-storage.yaml"
        echo
    fi
    
    # Check if nodes have required labels
    local nodes_with_tier
    nodes_with_tier=$(kubectl get nodes -l node.gardenos.io/tier=hybrid --no-headers | wc -l)
    
    if [[ "$nodes_with_tier" -eq 0 ]]; then
        error "No nodes with required label 'node.gardenos.io/tier=hybrid'"
        echo "Remediation: Label nodes with tier:"
        kubectl get nodes --no-headers | awk '{print $1}' | while read -r node; do
            echo "  kubectl label node $node node.gardenos.io/tier=hybrid"
        done
        echo
    fi
    
    # Check for pending PVCs
    local pending_pvcs
    pending_pvcs=$(kubectl get pvc -n "$POSTGRES_NAMESPACE" --no-headers 2>/dev/null | grep Pending | wc -l || echo "0")
    
    if [[ "$pending_pvcs" -gt 0 ]]; then
        error "Found $pending_pvcs pending PVCs"
        echo "Remediation: Delete and recreate StatefulSet to use correct storage class:"
        echo "  kubectl delete statefulset postgres -n postgres-cluster"
        echo "  kubectl delete pvc --all -n postgres-cluster"
        echo "  kubectl apply -f k8s/postgres/statefulset.yaml"
        echo
    fi
}

# Main execution
main() {
    print_header "PostgreSQL K3s Debugging Tool" "Comprehensive debugging for PostgreSQL deployment issues"
    
    check_cluster_health
    check_postgres_resources
    check_postgres_pods
    check_pvc_issues
    check_node_scheduling
    check_storage_provisioner
    show_debug_logs
    generate_remediation
    
    log "Debugging complete. Review the output above for issues and remediation steps."
}

# Run main function
main "$@"
