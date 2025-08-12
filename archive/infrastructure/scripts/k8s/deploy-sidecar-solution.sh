#!/bin/bash

# Deploy Sidecar Solution for Patroni Service Discovery
# This script implements the sidecar pattern to work around Spilo token access issues

set -e

# Configuration
NAMESPACE="postgres-cluster"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$SCRIPT_DIR/../../k8s/postgres"

echo "🚀 Deploying Sidecar Solution for Patroni Service Discovery"
echo "=================================================="

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl is not installed or not in PATH"
        exit 1
    fi
    echo "✅ kubectl is available"
}

# Function to check cluster connectivity
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        echo "❌ Cannot connect to Kubernetes cluster"
        exit 1
    fi
    echo "✅ Connected to Kubernetes cluster"
}

# Function to backup current configuration
backup_current_state() {
    echo "📦 Creating backup of current state..."
    BACKUP_DIR="/tmp/patroni-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup current StatefulSet
    kubectl get statefulset postgres -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/statefulset-backup.yaml" 2>/dev/null || echo "No existing StatefulSet found"
    
    # Backup current Services
    kubectl get services -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/services-backup.yaml" 2>/dev/null || echo "No existing Services found"
    
    # Backup current Endpoints
    kubectl get endpoints -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/endpoints-backup.yaml" 2>/dev/null || echo "No existing Endpoints found"
    
    echo "✅ Backup created at: $BACKUP_DIR"
}

# Function to apply the new configuration
deploy_sidecar_config() {
    echo "🔧 Deploying updated configuration with sidecar..."
    
    # Apply namespace and base configuration first
    kubectl apply -f "$K8S_DIR/namespace.yaml"
    echo "✅ Applied namespace and ConfigMaps"
    
    # Apply the updated StatefulSet
    kubectl apply -f "$K8S_DIR/statefulset.yaml"
    echo "✅ Applied StatefulSet with sidecar"
    
    # Wait for rollout
    echo "⏳ Waiting for StatefulSet rollout..."
    kubectl rollout status statefulset/postgres -n "$NAMESPACE" --timeout=300s
}

# Function to verify the deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Check if pods are running
    echo "📊 Pod Status:"
    kubectl get pods -n "$NAMESPACE" -o wide
    
    # Check if sidecar containers are running
    echo "📊 Sidecar Container Status:"
    for pod in $(kubectl get pods -n "$NAMESPACE" -o name | grep postgres-); do
        pod_name=$(basename "$pod")
        echo "  $pod_name:"
        kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[*].name}' | tr ' ' '\n' | sed 's/^/    - /'
    done
    
    # Check endpoints
    echo "📊 Endpoints Status:"
    kubectl get endpoints -n "$NAMESPACE"
    
    # Check services
    echo "📊 Services Status:"
    kubectl get services -n "$NAMESPACE"
}

# Function to show sidecar logs
show_sidecar_logs() {
    echo "📋 Recent Sidecar Logs:"
    for pod in $(kubectl get pods -n "$NAMESPACE" -o name | grep postgres- | head -3); do
        pod_name=$(basename "$pod")
        echo "  === $pod_name ==="
        kubectl logs "$pod_name" -n "$NAMESPACE" -c discovery-sidecar --tail=10 2>/dev/null || echo "    No logs yet or container not ready"
    done
}

# Function to test connectivity
test_connectivity() {
    echo "🧪 Testing Service Connectivity..."
    
    # Test postgres-primary service
    echo "Testing postgres-primary service..."
    kubectl run test-connection --rm -i --tty --image=postgres:15 --restart=Never -- \
        psql -h postgres-primary.postgres-cluster.svc.cluster.local -U postgres -c "SELECT version();" 2>/dev/null || \
        echo "❌ Connection test failed (this is expected initially)"
}

# Main execution
main() {
    echo "Starting deployment process..."
    
    check_kubectl
    check_cluster
    backup_current_state
    deploy_sidecar_config
    
    echo "⏳ Waiting 30 seconds for pods to initialize..."
    sleep 30
    
    verify_deployment
    show_sidecar_logs
    
    echo ""
    echo "🎉 Sidecar solution deployment complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Monitor sidecar logs: kubectl logs -f postgres-0 -n postgres-cluster -c discovery-sidecar"
    echo "2. Check endpoint updates: kubectl get endpoints postgres-primary -n postgres-cluster -w"
    echo "3. Test Supabase connectivity once leader is established"
    echo ""
    echo "🔧 Troubleshooting Commands:"
    echo "- View all pod logs: kubectl logs postgres-0 -n postgres-cluster --all-containers"
    echo "- Check Patroni status: kubectl exec postgres-0 -n postgres-cluster -c postgres -- patronictl list"
    echo "- Monitor endpoints: watch kubectl get endpoints -n postgres-cluster"
}

# Run main function
main "$@"
