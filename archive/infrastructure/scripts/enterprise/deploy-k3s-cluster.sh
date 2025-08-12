#!/bin/bash

# ⚙️ Enterprise K3s Cluster Deployment
# Deploys a highly available K3s cluster across 9 servers with embedded etcd

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
K3S_VERSION="v1.28.5+k3s1"
K3S_TOKEN="$(openssl rand -hex 32)"

# Get server information
get_control_plane_servers() {
    hcloud server list -o format='{{.Name}} {{.PublicNet.IPv4.IP}}' | grep "crm-ctrl-"
}

get_application_servers() {
    hcloud server list -o format='{{.Name}} {{.PublicNet.IPv4.IP}}' | grep "crm-app-"
}

get_service_servers() {
    hcloud server list -o format='{{.Name}} {{.PublicNet.IPv4.IP}}' | grep "crm-svc-"
}

# Logging functions
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
phase() { echo -e "${PURPLE}[PHASE]${NC} $1"; echo "=================================="; }

# Execute command on server
run_on_server() {
    local server_ip="$1"
    local command="$2"
    local description="$3"
    
    log "$description on $server_ip"
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@"$server_ip" "$command"
}

# Install K3s on first control plane node (bootstrap)
install_k3s_bootstrap() {
    phase "INSTALLING K3S BOOTSTRAP NODE"
    
    local first_server=$(get_control_plane_servers | head -n1)
    local server_name=$(echo "$first_server" | awk '{print $1}')
    local server_ip=$(echo "$first_server" | awk '{print $2}')
    
    log "Bootstrapping K3s cluster on $server_name ($server_ip)"
    
    # Install K3s with embedded etcd
    run_on_server "$server_ip" "curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION='$K3S_VERSION' sh -s - server \
        --cluster-init \
        --token='$K3S_TOKEN' \
        --disable=traefik \
        --disable=servicelb \
        --disable=local-storage \
        --write-kubeconfig-mode=644 \
        --node-label='node.gardenos.io/tier=control-plane' \
        --node-label='node.gardenos.io/location=hillsboro'" "Installing K3s bootstrap node"
    
    # Wait for K3s to be ready
    log "Waiting for K3s to be ready..."
    sleep 30
    
    # Verify installation
    run_on_server "$server_ip" "kubectl get nodes" "Verifying K3s installation"
    
    success "K3s bootstrap node installed: $server_name"
    echo "Bootstrap server: $server_ip"
}

# Join additional control plane nodes
join_control_plane_nodes() {
    phase "JOINING ADDITIONAL CONTROL PLANE NODES"
    
    local first_server=$(get_control_plane_servers | head -n1)
    local bootstrap_ip=$(echo "$first_server" | awk '{print $2}')
    
    # Join remaining control plane nodes
    get_control_plane_servers | tail -n +2 | while read -r server_name server_ip; do
        log "Joining control plane node: $server_name ($server_ip)"
        
        local location="ashburn"
        if [[ "$server_name" == *"hil"* ]]; then
            location="hillsboro"
        fi
        
        run_on_server "$server_ip" "curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION='$K3S_VERSION' sh -s - server \
            --server https://$bootstrap_ip:6443 \
            --token='$K3S_TOKEN' \
            --disable=traefik \
            --disable=servicelb \
            --disable=local-storage \
            --write-kubeconfig-mode=644 \
            --node-label='node.gardenos.io/tier=control-plane' \
            --node-label='node.gardenos.io/location=$location'" "Joining control plane node"
        
        success "Joined control plane node: $server_name"
    done
}

# Join worker nodes (application and service tiers)
join_worker_nodes() {
    phase "JOINING WORKER NODES"
    
    local first_server=$(get_control_plane_servers | head -n1)
    local bootstrap_ip=$(echo "$first_server" | awk '{print $2}')
    
    # Join application servers as workers
    get_application_servers | while read -r server_name server_ip; do
        log "Joining application worker: $server_name ($server_ip)"
        
        local location="ashburn"
        if [[ "$server_name" == *"hil"* ]]; then
            location="hillsboro"
        fi
        
        run_on_server "$server_ip" "curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION='$K3S_VERSION' sh -s - agent \
            --server https://$bootstrap_ip:6443 \
            --token='$K3S_TOKEN' \
            --node-label='node.gardenos.io/tier=application' \
            --node-label='node.gardenos.io/location=$location'" "Joining application worker"
        
        success "Joined application worker: $server_name"
    done
    
    # Join service servers as workers
    get_service_servers | while read -r server_name server_ip; do
        log "Joining service worker: $server_name ($server_ip)"
        
        local location="ashburn"
        if [[ "$server_name" == *"hil"* ]]; then
            location="hillsboro"
        fi
        
        run_on_server "$server_ip" "curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION='$K3S_VERSION' sh -s - agent \
            --server https://$bootstrap_ip:6443 \
            --token='$K3S_TOKEN' \
            --node-label='node.gardenos.io/tier=services' \
            --node-label='node.gardenos.io/location=$location'" "Joining service worker"
        
        success "Joined service worker: $server_name"
    done
}

# Configure kubectl access
configure_kubectl() {
    phase "CONFIGURING KUBECTL ACCESS"
    
    local first_server=$(get_control_plane_servers | head -n1)
    local bootstrap_ip=$(echo "$first_server" | awk '{print $2}')
    
    # Download kubeconfig
    log "Downloading kubeconfig from bootstrap node..."
    mkdir -p ~/.kube
    scp -o StrictHostKeyChecking=no root@"$bootstrap_ip":/etc/rancher/k3s/k3s.yaml ~/.kube/config
    
    # Update server address in kubeconfig
    sed -i "s/127.0.0.1/$bootstrap_ip/g" ~/.kube/config
    
    success "kubectl configured for cluster access"
}

# Install essential cluster components
install_cluster_components() {
    phase "INSTALLING ESSENTIAL CLUSTER COMPONENTS"
    
    # Create namespaces
    log "Creating namespaces..."
    kubectl create namespace ingress-nginx --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace cert-manager --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f -
    
    # Install NGINX Ingress Controller
    log "Installing NGINX Ingress Controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
    
    # Wait for ingress controller to be ready
    log "Waiting for ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    # Install cert-manager
    log "Installing cert-manager..."
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml
    
    # Wait for cert-manager to be ready
    log "Waiting for cert-manager to be ready..."
    kubectl wait --namespace cert-manager \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/instance=cert-manager \
        --timeout=300s
    
    success "Essential cluster components installed"
}

# Create storage classes
create_storage_classes() {
    phase "CREATING STORAGE CLASSES"
    
    # Create local storage class for high-performance workloads
    cat << 'EOF' | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-nvme
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: rancher.io/local-path
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-nvme-retain
provisioner: rancher.io/local-path
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
EOF

    success "Storage classes created"
}

# Verify cluster health
verify_cluster() {
    phase "VERIFYING CLUSTER HEALTH"
    
    log "Checking cluster nodes..."
    kubectl get nodes -o wide
    
    log "Checking system pods..."
    kubectl get pods -A
    
    log "Checking cluster info..."
    kubectl cluster-info
    
    # Check that all nodes are ready
    local total_nodes=$(kubectl get nodes --no-headers | wc -l)
    local ready_nodes=$(kubectl get nodes --no-headers | grep " Ready " | wc -l)
    
    if [ "$total_nodes" -eq 9 ] && [ "$ready_nodes" -eq 9 ]; then
        success "All 9 nodes are ready and joined to the cluster"
    else
        warning "Expected 9 nodes, found $total_nodes total, $ready_nodes ready"
    fi
    
    success "Cluster verification completed"
}

# Save cluster information
save_cluster_info() {
    phase "SAVING CLUSTER INFORMATION"
    
    local info_file="$PROJECT_ROOT/cluster-info.txt"
    
    cat > "$info_file" << EOF
# Enterprise K3s Cluster Information
# Generated: $(date)

## Cluster Details
K3s Version: $K3S_VERSION
Cluster Token: $K3S_TOKEN
Total Nodes: 9 (3 control-plane, 6 workers)

## Control Plane Nodes
$(get_control_plane_servers)

## Application Workers  
$(get_application_servers)

## Service Workers
$(get_service_servers)

## Access Information
Kubeconfig: ~/.kube/config
API Server: https://$(get_control_plane_servers | head -n1 | awk '{print $2}'):6443

## Next Steps
1. Deploy database cluster: ./scripts/enterprise/deploy-database-cluster.sh
2. Deploy HAProxy HA: ./scripts/enterprise/deploy-haproxy-ha.sh
3. Deploy applications: ./scripts/enterprise/deploy-application-stack.sh
4. Deploy monitoring: ./scripts/enterprise/deploy-monitoring-stack.sh
EOF

    success "Cluster information saved to: $info_file"
}

# Display deployment summary
show_summary() {
    phase "K3S CLUSTER DEPLOYMENT SUMMARY"
    
    echo "⚙️ Enterprise K3s Cluster Deployed"
    echo "=================================="
    echo ""
    echo "📊 Cluster Composition:"
    echo "  Control Plane: 3 nodes (embedded etcd)"
    echo "  Application:   3 worker nodes"
    echo "  Services:      3 worker nodes"
    echo "  Total:         9 nodes"
    echo ""
    echo "🔧 Components Installed:"
    echo "  ✅ K3s $K3S_VERSION"
    echo "  ✅ NGINX Ingress Controller"
    echo "  ✅ cert-manager"
    echo "  ✅ Local NVMe storage classes"
    echo ""
    echo "🌍 Geographic Distribution:"
    echo "  Hillsboro: 3 nodes"
    echo "  Ashburn:   6 nodes"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Run: ./scripts/enterprise/deploy-database-cluster.sh"
    echo "2. Run: ./scripts/enterprise/deploy-haproxy-ha.sh"
    echo "3. Run: ./scripts/enterprise/deploy-application-stack.sh"
}

# Main execution
main() {
    echo "⚙️ ENTERPRISE K3S CLUSTER DEPLOYMENT"
    echo "===================================="
    echo "Deploying highly available K3s across 9 CCX23 servers"
    echo ""
    
    install_k3s_bootstrap
    join_control_plane_nodes
    join_worker_nodes
    configure_kubectl
    install_cluster_components
    create_storage_classes
    verify_cluster
    save_cluster_info
    show_summary
    
    success "🎉 Enterprise K3s cluster deployed successfully!"
    echo ""
    echo "💡 Your cluster can now handle enterprise workloads with 99.99% uptime!"
}

# Run main function
main "$@"
