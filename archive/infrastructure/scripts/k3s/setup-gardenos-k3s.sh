#!/bin/bash

# 🌱 GardenOS K3s Complete Setup Script
# Orchestrates the complete K3s HA cluster setup for GardenOS CRM
# Part of the GardenOS high-availability CRM stack on Hetzner

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Server configuration (update these to match your servers)
SERVERS=(
    "5.78.103.224"   # ubuntu-8gb-hil-1
    "5.161.110.205"  # ubuntu-8gb-ash-1
    "178.156.186.10" # ubuntu-8gb-ash-2
)

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
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  bootstrap              Bootstrap first control plane node"
    echo "  join-servers          Join additional control plane nodes"
    echo "  setup-haproxy         Set up HAProxy load balancer"
    echo "  install-k9s           Install K9s monitoring tool"
    echo "  verify-cluster        Verify cluster health"
    echo "  full-setup            Run complete setup (all commands)"
    echo
    echo "Options:"
    echo "  --servers SERVER1,SERVER2,SERVER3    Comma-separated list of server IPs"
    echo "  --bootstrap-server SERVER             IP of the bootstrap server"
    echo "  --help                                Show this help message"
    echo
    echo "Examples:"
    echo "  $0 bootstrap"
    echo "  $0 join-servers"
    echo "  $0 full-setup --servers 10.0.1.10,10.0.1.11,10.0.1.12"
    echo
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    BOOTSTRAP_SERVER="${SERVERS[0]}"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            bootstrap|join-servers|setup-haproxy|install-k9s|verify-cluster|full-setup)
                COMMAND="$1"
                shift
                ;;
            --servers)
                IFS=',' read -ra SERVERS <<< "$2"
                BOOTSTRAP_SERVER="${SERVERS[0]}"
                shift 2
                ;;
            --bootstrap-server)
                BOOTSTRAP_SERVER="$2"
                shift 2
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

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if we can SSH to servers
    for server in "${SERVERS[@]}"; do
        if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "root@$server" "echo 'SSH OK'" &>/dev/null; then
            error "Cannot SSH to $server. Please ensure SSH key authentication is set up."
        fi
    done
    
    # Check if scripts exist
    local required_scripts=(
        "$SCRIPT_DIR/bootstrap-k3s-control-plane.sh"
        "$SCRIPT_DIR/join-k3s-server.sh"
        "$SCRIPT_DIR/install-k9s.sh"
    )
    
    for script in "${required_scripts[@]}"; do
        if [[ ! -f "$script" ]]; then
            error "Required script not found: $script"
        fi
    done
    
    log "Prerequisites check passed"
}

# Bootstrap first control plane node
bootstrap_control_plane() {
    log "Bootstrapping K3s control plane on $BOOTSTRAP_SERVER..."
    
    # Copy bootstrap script to server
    scp "$SCRIPT_DIR/bootstrap-k3s-control-plane.sh" "root@$BOOTSTRAP_SERVER:/tmp/"
    
    # Run bootstrap script
    ssh "root@$BOOTSTRAP_SERVER" "chmod +x /tmp/bootstrap-k3s-control-plane.sh && /tmp/bootstrap-k3s-control-plane.sh"
    
    # Get cluster token
    CLUSTER_TOKEN=$(ssh "root@$BOOTSTRAP_SERVER" "cat /etc/rancher/k3s/cluster-info.env | grep K3S_TOKEN | cut -d'=' -f2 | tr -d '\"'")
    
    if [[ -z "$CLUSTER_TOKEN" ]]; then
        error "Failed to retrieve cluster token from bootstrap server"
    fi
    
    log "Control plane bootstrapped successfully"
    log "Cluster token: $CLUSTER_TOKEN"
}

# Join additional control plane nodes
join_control_plane_nodes() {
    log "Joining additional control plane nodes..."
    
    if [[ -z "${CLUSTER_TOKEN:-}" ]]; then
        # Try to get token from bootstrap server
        CLUSTER_TOKEN=$(ssh "root@$BOOTSTRAP_SERVER" "cat /etc/rancher/k3s/cluster-info.env | grep K3S_TOKEN | cut -d'=' -f2 | tr -d '\"'" 2>/dev/null || echo "")
        
        if [[ -z "$CLUSTER_TOKEN" ]]; then
            error "Cluster token not available. Please run bootstrap first."
        fi
    fi
    
    # Join remaining servers (skip the first one which is the bootstrap server)
    for server in "${SERVERS[@]:1}"; do
        log "Joining server $server to cluster..."
        
        # Copy join script to server
        scp "$SCRIPT_DIR/join-k3s-server.sh" "root@$server:/tmp/"
        
        # Run join script
        ssh "root@$server" "chmod +x /tmp/join-k3s-server.sh && /tmp/join-k3s-server.sh --url https://$BOOTSTRAP_SERVER:6443 --token $CLUSTER_TOKEN"
    done
    
    log "All control plane nodes joined successfully"
}

# Set up HAProxy load balancer
setup_haproxy() {
    log "Setting up HAProxy load balancer on $BOOTSTRAP_SERVER..."
    
    # Copy HAProxy configuration
    scp "$PROJECT_ROOT/config/haproxy/k3s-api-lb.cfg" "root@$BOOTSTRAP_SERVER:/tmp/"
    
    # Install and configure HAProxy
    ssh "root@$BOOTSTRAP_SERVER" << 'EOF'
        # Install HAProxy
        apt update && apt install -y haproxy
        
        # Backup original config
        cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.backup
        
        # Install new config
        cp /tmp/k3s-api-lb.cfg /etc/haproxy/haproxy.cfg
        
        # Enable and start HAProxy
        systemctl enable haproxy
        systemctl restart haproxy
        
        # Check status
        systemctl status haproxy --no-pager
EOF
    
    log "HAProxy load balancer configured successfully"
}

# Install K9s locally
install_k9s_local() {
    log "Installing K9s locally..."
    
    chmod +x "$SCRIPT_DIR/install-k9s.sh"
    "$SCRIPT_DIR/install-k9s.sh"
    
    log "K9s installed successfully"
}

# Set up local kubectl access
setup_kubectl_access() {
    log "Setting up local kubectl access..."
    
    # Create .kube directory
    mkdir -p ~/.kube
    
    # Copy kubeconfig from bootstrap server
    scp "root@$BOOTSTRAP_SERVER:/etc/rancher/k3s/k3s.yaml" ~/.kube/config
    
    # Update server address to use HAProxy
    sed -i "s/127.0.0.1/$BOOTSTRAP_SERVER/g" ~/.kube/config
    
    # Set proper permissions
    chmod 600 ~/.kube/config
    
    log "kubectl access configured"
}

# Verify cluster health
verify_cluster() {
    log "Verifying cluster health..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        warn "kubectl not found. Please install kubectl to verify cluster."
        return
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to cluster. Please check your kubeconfig."
    fi
    
    # Display cluster information
    echo
    echo -e "${BLUE}=== Cluster Nodes ===${NC}"
    kubectl get nodes -o wide
    
    echo
    echo -e "${BLUE}=== System Pods ===${NC}"
    kubectl get pods -n kube-system
    
    echo
    echo -e "${BLUE}=== Cluster Info ===${NC}"
    kubectl cluster-info
    
    log "Cluster verification completed successfully"
}

# Install metrics server
install_metrics_server() {
    log "Installing metrics server..."
    
    # Check if helm is available
    if ! command -v helm &> /dev/null; then
        warn "Helm not found. Installing metrics server with kubectl..."
        kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
        
        # Patch for insecure TLS (development)
        kubectl patch deployment metrics-server -n kube-system --type='json' \
            -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
    else
        # Install with Helm
        helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
        helm repo update
        helm install metrics-server metrics-server/metrics-server \
            --namespace kube-system \
            --set args="{--kubelet-insecure-tls}"
    fi
    
    log "Metrics server installed"
}

# Full setup
full_setup() {
    log "Starting full GardenOS K3s setup..."
    
    check_prerequisites
    bootstrap_control_plane
    join_control_plane_nodes
    setup_haproxy
    setup_kubectl_access
    install_metrics_server
    install_k9s_local
    verify_cluster
    
    echo
    echo -e "${GREEN}🎉 GardenOS K3s HA Cluster Setup Complete! 🎉${NC}"
    echo
    echo -e "${BLUE}=== Next Steps ===${NC}"
    echo "1. Deploy core services (Supabase, FastAPI)"
    echo "2. Apply database schema"
    echo "3. Test application connectivity"
    echo "4. Set up monitoring and logging"
    echo
    echo -e "${BLUE}=== Useful Commands ===${NC}"
    echo "View cluster with K9s:"
    echo "  k9s"
    echo
    echo "Check cluster status:"
    echo "  kubectl get nodes"
    echo "  kubectl get pods -A"
    echo
    echo "View HAProxy stats:"
    echo "  curl http://$BOOTSTRAP_SERVER:8404/stats"
}

# Main execution
main() {
    log "GardenOS K3s Setup Script"
    
    parse_args "$@"
    
    case "$COMMAND" in
        bootstrap)
            check_prerequisites
            bootstrap_control_plane
            ;;
        join-servers)
            check_prerequisites
            join_control_plane_nodes
            ;;
        setup-haproxy)
            setup_haproxy
            ;;
        install-k9s)
            install_k9s_local
            ;;
        verify-cluster)
            verify_cluster
            ;;
        full-setup)
            full_setup
            ;;
        *)
            error "Unknown command: $COMMAND"
            ;;
    esac
}

# Run main function
main "$@"
