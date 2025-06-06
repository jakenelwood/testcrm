#!/bin/bash

# 🧩 K3s Server Join Script for GardenOS
# This script joins additional control-plane nodes to the K3s cluster
# Part of the GardenOS high-availability CRM stack on Hetzner

set -euo pipefail

# Configuration - can be overridden by environment variables
K3S_URL="${K3S_URL:-}"
K3S_TOKEN="${K3S_TOKEN:-}"
ETCD_ENDPOINTS="${ETCD_ENDPOINTS:-http://5.78.103.224:2379,http://5.161.110.205:2379,http://178.156.186.10:2379}"
NODE_NAME="${NODE_NAME:-$(hostname)}"

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
    exit 1
}

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Join a K3s control-plane node to existing cluster"
    echo
    echo "Options:"
    echo "  -u, --url URL          K3s server URL (e.g., https://10.0.1.10:6443)"
    echo "  -t, --token TOKEN      K3s cluster token"
    echo "  -n, --node-name NAME   Node name (default: hostname)"
    echo "  -h, --help             Show this help message"
    echo
    echo "Environment Variables:"
    echo "  K3S_URL                K3s server URL"
    echo "  K3S_TOKEN              K3s cluster token"
    echo "  ETCD_ENDPOINTS         etcd cluster endpoints"
    echo "  NODE_NAME              Node name"
    echo
    echo "Example:"
    echo "  $0 --url https://10.0.1.10:6443 --token mytoken123"
    echo
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--url)
                K3S_URL="$2"
                shift 2
                ;;
            -t|--token)
                K3S_TOKEN="$2"
                shift 2
                ;;
            -n|--node-name)
                NODE_NAME="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
}

# Validate required parameters
validate_params() {
    if [[ -z "$K3S_URL" ]]; then
        error "K3S_URL is required. Use --url or set K3S_URL environment variable."
    fi
    
    if [[ -z "$K3S_TOKEN" ]]; then
        error "K3S_TOKEN is required. Use --token or set K3S_TOKEN environment variable."
    fi
    
    log "Configuration validated"
    log "K3S_URL: $K3S_URL"
    log "NODE_NAME: $NODE_NAME"
    log "ETCD_ENDPOINTS: $ETCD_ENDPOINTS"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
       error "This script must be run as root"
    fi
}

# Install K3s server node
install_k3s_server() {
    log "Installing K3s control-plane node..."
    
    # Create K3s configuration directory
    mkdir -p /etc/rancher/k3s
    
    # Generate K3s configuration for additional server
    cat > /etc/rancher/k3s/config.yaml << EOF
# K3s Server Configuration for GardenOS
# Additional control-plane node configuration
datastore-endpoint: "${ETCD_ENDPOINTS}"
token: "${K3S_TOKEN}"
server: "${K3S_URL}"
node-name: "${NODE_NAME}"

# Server configuration
cluster-init: false

# Network configuration
cluster-cidr: "10.42.0.0/16"
service-cidr: "10.43.0.0/16"
cluster-dns: "10.43.0.10"

# Security
protect-kernel-defaults: false
secrets-encryption: true

# Disable components we don't need
disable:
  - traefik
  - servicelb
  - local-storage

# Node labels for workload scheduling
node-label:
  - "node.gardenos.io/role=control-plane"
  - "node.gardenos.io/tier=system"

# Node taints (control plane nodes)
node-taint:
  - "node-role.kubernetes.io/control-plane:NoSchedule"

# Logging
log: "/var/log/k3s.log"
alsologtostderr: true
EOF

    # Download and install K3s
    log "Downloading K3s installer..."
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server" sh -s -
    
    # Wait for K3s to be ready
    log "Waiting for K3s to join cluster..."
    timeout=300
    while ! kubectl get nodes &>/dev/null && [[ $timeout -gt 0 ]]; do
        sleep 5
        ((timeout-=5))
        echo -n "."
    done
    echo
    
    if [[ $timeout -le 0 ]]; then
        error "K3s failed to join cluster within 5 minutes"
    fi
    
    log "K3s control-plane node joined successfully!"
}

# Configure kubectl access
configure_kubectl() {
    log "Configuring kubectl access..."
    
    # Copy kubeconfig to standard location
    mkdir -p ~/.kube
    cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
    chmod 600 ~/.kube/config
    
    # Update server address for external access
    EXTERNAL_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    sed -i "s/127.0.0.1/${EXTERNAL_IP}/g" ~/.kube/config
    
    log "kubectl configured"
}

# Display join information
show_join_info() {
    log "K3s Control-Plane Node Join Complete!"
    echo
    echo -e "${BLUE}=== Node Information ===${NC}"
    echo "Node Name: ${NODE_NAME}"
    echo "Cluster URL: ${K3S_URL}"
    echo "External IP: $(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
    echo
    echo -e "${BLUE}=== Cluster Status ===${NC}"
    kubectl get nodes -o wide
    echo
    echo -e "${GREEN}Control-plane node joined successfully!${NC}"
}

# Main execution
main() {
    log "Starting K3s Control-Plane Node Join for GardenOS"
    
    parse_args "$@"
    check_root
    validate_params
    install_k3s_server
    configure_kubectl
    show_join_info
}

# Run main function
main "$@"
