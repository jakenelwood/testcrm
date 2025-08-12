#!/bin/bash

# 🔍 GardenOS Status Check Script
# Comprehensive status monitoring for the GardenOS K3s cluster
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}$1${NC}"
}

# Check cluster health
check_cluster_health() {
    info "=== 🏥 Cluster Health ==="
    
    # Check nodes
    echo "Nodes:"
    kubectl get nodes -o wide
    echo
    
    # Check node resources
    echo "Node Resources:"
    kubectl top nodes 2>/dev/null || echo "Metrics not available"
    echo
    
    # Check system pods
    echo "System Pods:"
    kubectl get pods -n kube-system
    echo
}

# Check etcd cluster
check_etcd_cluster() {
    info "=== 🔗 etcd Cluster Status ==="
    
    local servers=("5.78.103.224" "5.161.110.205" "178.156.186.10")
    
    for server in "${servers[@]}"; do
        echo -n "etcd on $server: "
        if curl -s "http://$server:2379/health" | grep -q '"health":"true"'; then
            echo -e "${GREEN}✅ Healthy${NC}"
        else
            echo -e "${RED}❌ Unhealthy${NC}"
        fi
    done
    echo
}

# Check HAProxy status
check_haproxy() {
    info "=== 🌐 HAProxy Load Balancer ==="
    
    echo -n "HAProxy service: "
    if ssh root@5.78.103.224 "systemctl is-active haproxy" &>/dev/null; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${RED}❌ Not running${NC}"
    fi
    
    echo -n "K3s API health check: "
    if ssh root@5.78.103.224 "curl -s http://localhost:8404/stats | grep -q 'k3s-control.*UP'" &>/dev/null; then
        echo -e "${GREEN}✅ Available${NC}"
    else
        echo -e "${RED}❌ Not available${NC}"
    fi
    echo
}

# Check ingress controller
check_ingress() {
    info "=== 🚪 Ingress Controller ==="
    
    kubectl get pods -n ingress-nginx
    echo
    
    echo "Ingress Classes:"
    kubectl get ingressclass
    echo
}

# Check Supabase services
check_supabase() {
    info "=== 🔧 Supabase Services ==="
    
    if kubectl get namespace supabase &>/dev/null; then
        kubectl get pods -n supabase
        echo
        
        echo "Supabase Services:"
        kubectl get svc -n supabase
        echo
    else
        echo "Supabase namespace not found"
        echo
    fi
}

# Check FastAPI services
check_fastapi() {
    info "=== 🚀 FastAPI Services ==="
    
    if kubectl get namespace fastapi &>/dev/null; then
        kubectl get pods -n fastapi
        echo
        
        echo "FastAPI Services:"
        kubectl get svc -n fastapi
        echo
    else
        echo "FastAPI namespace not found"
        echo
    fi
}

# Check ingress routes
check_routes() {
    info "=== 🛣️ Ingress Routes ==="
    
    kubectl get ingress -A
    echo
    
    echo "Service URLs (add to /etc/hosts):"
    local node_ipv4
    node_ipv4=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    if [[ -z "$node_ipv4" ]]; then
        node_ipv4=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    fi
    echo "$node_ipv4 api.gardenos.local monitoring.gardenos.local"
    echo
}

# Check storage
check_storage() {
    info "=== 💾 Storage ==="
    
    echo "Persistent Volumes:"
    kubectl get pv
    echo
    
    echo "Persistent Volume Claims:"
    kubectl get pvc -A
    echo
}

# Check resource usage
check_resources() {
    info "=== 📊 Resource Usage ==="
    
    echo "Pod Resource Usage:"
    kubectl top pods -A 2>/dev/null || echo "Metrics not available"
    echo
    
    echo "Namespace Resource Quotas:"
    kubectl get resourcequota -A
    echo
}

# Show service endpoints
show_endpoints() {
    info "=== 🌐 Service Endpoints ==="
    
    local node_ipv4
    node_ipv4=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    if [[ -z "$node_ipv4" ]]; then
        node_ipv4=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    fi

    echo "External Access URLs:"
    echo "- HAProxy Stats: http://$node_ipv4:8404/stats"
    echo "- K3s API: https://$node_ipv4:6443"
    echo
    
    echo "Internal Service URLs (via ingress):"
    echo "- Supabase Auth: http://api.gardenos.local/auth"
    echo "- Supabase REST: http://api.gardenos.local/rest"
    echo "- Supabase Storage: http://api.gardenos.local/storage"
    echo "- FastAPI: http://api.gardenos.local/api"
    echo "- AI Agents: http://api.gardenos.local/ai"
    echo "- Monitoring: http://monitoring.gardenos.local"
    echo
    
    echo "Add to /etc/hosts:"
    echo "$node_ipv4 api.gardenos.local monitoring.gardenos.local"
    echo
}

# Show troubleshooting commands
show_troubleshooting() {
    info "=== 🔧 Troubleshooting Commands ==="
    
    echo "Useful commands:"
    echo "- Check cluster: kubectl cluster-info"
    echo "- View all pods: kubectl get pods -A"
    echo "- Check logs: kubectl logs -n NAMESPACE POD_NAME"
    echo "- Describe pod: kubectl describe pod -n NAMESPACE POD_NAME"
    echo "- Port forward: kubectl port-forward -n NAMESPACE svc/SERVICE_NAME LOCAL_PORT:REMOTE_PORT"
    echo "- Monitor with K9s: k9s"
    echo
    
    echo "Service management:"
    echo "- Restart deployment: kubectl rollout restart deployment DEPLOYMENT_NAME -n NAMESPACE"
    echo "- Scale deployment: kubectl scale deployment DEPLOYMENT_NAME --replicas=N -n NAMESPACE"
    echo "- Check rollout status: kubectl rollout status deployment DEPLOYMENT_NAME -n NAMESPACE"
    echo
    
    echo "etcd troubleshooting:"
    echo "- Check etcd health: curl http://5.78.103.224:2379/health"
    echo "- etcd member list: ssh root@5.78.103.224 '/usr/local/bin/etcdctl member list'"
    echo "- etcd cluster health: ssh root@5.78.103.224 '/usr/local/bin/etcdctl endpoint health'"
    echo
}

# Main function
main() {
    log "GardenOS Cluster Status Check"
    echo
    
    check_cluster_health
    check_etcd_cluster
    check_haproxy
    check_ingress
    check_supabase
    check_fastapi
    check_routes
    check_storage
    check_resources
    show_endpoints
    show_troubleshooting
    
    log "Status check completed"
}

# Run main function
main "$@"
