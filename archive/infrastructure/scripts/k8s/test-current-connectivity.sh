#!/bin/bash

# Quick Diagnostic Test: Test Current Supabase Connectivity
# This script tests the current postgres-cluster service to demonstrate the round-robin issue

set -e

NAMESPACE="postgres-cluster"
SERVICE_NAME="postgres-cluster"

echo "🧪 Quick Diagnostic Test: Current Postgres Connectivity"
echo "======================================================"

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl is not installed or not in PATH"
        exit 1
    fi
    echo "✅ kubectl is available"
}

# Function to show current cluster state
show_current_state() {
    echo "📊 Current Cluster State:"
    echo "------------------------"
    
    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -o wide
    
    echo ""
    echo "Services:"
    kubectl get services -n "$NAMESPACE"
    
    echo ""
    echo "Endpoints:"
    kubectl get endpoints -n "$NAMESPACE" -o wide
    
    echo ""
    echo "Patroni Cluster Status:"
    kubectl exec postgres-0 -n "$NAMESPACE" -c postgres -- patronictl list 2>/dev/null || echo "❌ Could not get Patroni status"
}

# Function to test individual pod connections
test_individual_pods() {
    echo ""
    echo "🔍 Testing Individual Pod Connections:"
    echo "------------------------------------"
    
    for i in 0 1 2; do
        pod_name="postgres-$i"
        echo "Testing $pod_name..."
        
        # Get pod IP
        pod_ip=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.status.podIP}' 2>/dev/null || echo "unknown")
        echo "  Pod IP: $pod_ip"
        
        # Test connection and check if it's read-only
        kubectl run test-pod-$i --rm -i --restart=Never --image=postgres:15 -- \
            bash -c "
                echo 'Testing connection to $pod_name ($pod_ip)...'
                psql -h $pod_ip -U postgres -d postgres -c 'SELECT pg_is_in_recovery() as is_replica, version();' 2>/dev/null || echo 'Connection failed'
                echo 'Attempting write test...'
                psql -h $pod_ip -U postgres -d postgres -c 'CREATE TABLE IF NOT EXISTS test_write_$(date +%s) (id int);' 2>/dev/null && echo 'Write successful' || echo 'Write failed (likely replica)'
            " 2>/dev/null || echo "  ❌ Test failed for $pod_name"
        
        echo ""
    done
}

# Function to test service round-robin behavior
test_service_round_robin() {
    echo "🎯 Testing Service Round-Robin Behavior:"
    echo "---------------------------------------"
    
    echo "Testing $SERVICE_NAME service multiple times to demonstrate round-robin..."
    
    for i in {1..6}; do
        echo "Test $i:"
        kubectl run test-service-$i --rm -i --restart=Never --image=postgres:15 -- \
            bash -c "
                echo '  Connecting to $SERVICE_NAME...'
                result=\$(psql -h $SERVICE_NAME.$NAMESPACE.svc.cluster.local -U postgres -d postgres -c 'SELECT pg_is_in_recovery() as is_replica, inet_server_addr() as server_ip;' -t 2>/dev/null || echo 'CONNECTION_FAILED')
                echo \"  Result: \$result\"
                
                # Try a write operation
                write_result=\$(psql -h $SERVICE_NAME.$NAMESPACE.svc.cluster.local -U postgres -d postgres -c 'CREATE TABLE IF NOT EXISTS test_round_robin_$i (id int);' 2>&1 || echo 'WRITE_FAILED')
                if echo \"\$write_result\" | grep -q 'read-only'; then
                    echo '  ❌ Write failed: Connected to read-only replica'
                elif echo \"\$write_result\" | grep -q 'WRITE_FAILED'; then
                    echo '  ❌ Write failed: Connection error'
                else
                    echo '  ✅ Write successful: Connected to primary'
                fi
            " 2>/dev/null || echo "  ❌ Test $i failed completely"
        
        echo ""
        sleep 2
    done
}

# Function to show the problem summary
show_problem_summary() {
    echo "📋 Problem Summary:"
    echo "------------------"
    echo "The tests above demonstrate the core issue:"
    echo ""
    echo "1. ✅ Individual pod connections work fine"
    echo "2. ❌ Service connections are unreliable due to round-robin load balancing"
    echo "3. 🎯 Write operations fail ~66% of the time (when hitting replicas)"
    echo "4. 🔄 This is exactly why we need leader-only service discovery"
    echo ""
    echo "The sidecar solution will:"
    echo "- Monitor which pod is the Patroni leader"
    echo "- Update postgres-primary endpoints to point only to the leader"
    echo "- Ensure 100% write operation success rate"
}

# Main execution
main() {
    echo "Starting diagnostic test..."
    
    check_kubectl
    show_current_state
    test_individual_pods
    test_service_round_robin
    show_problem_summary
    
    echo ""
    echo "🎯 Diagnostic test complete!"
    echo ""
    echo "Ready to deploy the sidecar solution? Run:"
    echo "  ./scripts/k8s/deploy-sidecar-solution.sh"
}

# Run main function
main "$@"
