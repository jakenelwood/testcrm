#!/bin/bash

# 🧩 K3s Agent Join Script for GardenOS
# This script joins worker nodes to the K3s cluster
# Part of the GardenOS high-availability CRM stack on Hetzner

set -euo pipefail

# Configuration - can be overridden by environment variables
K3S_URL="${K3S_URL:-}"
K3S_TOKEN="${K3S_TOKEN:-}"
NODE_NAME="${NODE_NAME:-$(hostname)}"
NODE_ROLE="${NODE_ROLE:-worker}"
NODE_TIER="${NODE_TIER:-application}"

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
    echo "Join a K3s worker node to existing cluster"
    echo
    echo "Options:"
    echo "  -u, --url URL          K3s server URL (e.g., https://10.0.1.10:6443)"
    echo "  -t, --token TOKEN      K3s cluster token"
    echo "  -n, --node-name NAME   Node name (default: hostname)"
    echo "  -r, --role ROLE        Node role (default: worker)"
    echo "  --tier TIER            Node tier (default: application)"
    echo "  -h, --help             Show this help message"
    echo
    echo "Environment Variables:"
    echo "  K3S_URL                K3s server URL"
    echo "  K3S_TOKEN              K3s cluster token"
    echo "  NODE_NAME              Node name"
    echo "  NODE_ROLE              Node role (worker, ai, database, etc.)"
    echo "  NODE_TIER              Node tier (application, system, etc.)"
    echo
    echo "Predefined Node Roles:"
    echo "  worker                 General application workloads"
    echo "  ai                     AI/ML workloads (LangGraph agents)"
    echo "  database               Database-related workloads"
    echo "  ingress                Ingress controllers and load balancers"
    echo "  monitoring             Monitoring and observability tools"
    echo
    echo "Example:"
    echo "  $0 --url https://10.0.1.10:6443 --token mytoken123 --role ai"
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
            -r|--role)
                NODE_ROLE="$2"
                shift 2
                ;;
            --tier)
                NODE_TIER="$2"
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
    log "NODE_ROLE: $NODE_ROLE"
    log "NODE_TIER: $NODE_TIER"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
       error "This script must be run as root"
    fi
}

# Generate node labels and taints based on role
generate_node_config() {
    local labels="node.gardenos.io/role=${NODE_ROLE},node.gardenos.io/tier=${NODE_TIER}"
    local taints=""
    
    case "$NODE_ROLE" in
        ai)
            labels="${labels},node.gardenos.io/workload=ai,node.gardenos.io/gpu=false"
            taints="node.gardenos.io/ai:NoSchedule"
            ;;
        database)
            labels="${labels},node.gardenos.io/workload=database,node.gardenos.io/storage=local"
            taints="node.gardenos.io/database:NoSchedule"
            ;;
        ingress)
            labels="${labels},node.gardenos.io/workload=ingress,node.gardenos.io/public=true"
            ;;
        monitoring)
            labels="${labels},node.gardenos.io/workload=monitoring"
            ;;
        worker)
            labels="${labels},node.gardenos.io/workload=general"
            ;;
    esac
    
    echo "LABELS=${labels}"
    echo "TAINTS=${taints}"
}

# Install K3s agent node
install_k3s_agent() {
    log "Installing K3s worker node..."
    
    # Generate node configuration
    eval "$(generate_node_config)"
    
    # Create K3s configuration directory
    mkdir -p /etc/rancher/k3s
    
    # Generate K3s configuration for agent
    cat > /etc/rancher/k3s/config.yaml << EOF
# K3s Agent Configuration for GardenOS
# Worker node configuration
token: "${K3S_TOKEN}"
server: "${K3S_URL}"
node-name: "${NODE_NAME}"

# Node labels for workload scheduling
node-label:
$(echo "$LABELS" | tr ',' '\n' | sed 's/^/  - "/' | sed 's/$/"/')

# Node taints (if any)
EOF

    # Add taints if they exist
    if [[ -n "$TAINTS" ]]; then
        echo "node-taint:" >> /etc/rancher/k3s/config.yaml
        echo "$TAINTS" | tr ',' '\n' | sed 's/^/  - "/' | sed 's/$/"/' >> /etc/rancher/k3s/config.yaml
    fi

    # Add logging configuration
    cat >> /etc/rancher/k3s/config.yaml << EOF

# Logging
log: "/var/log/k3s.log"
alsologtostderr: true
EOF

    # Download and install K3s
    log "Downloading K3s installer..."
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="agent" sh -s -
    
    # Wait for K3s to be ready
    log "Waiting for K3s agent to join cluster..."
    timeout=300
    while ! systemctl is-active --quiet k3s-agent && [[ $timeout -gt 0 ]]; do
        sleep 5
        ((timeout-=5))
        echo -n "."
    done
    echo
    
    if [[ $timeout -le 0 ]]; then
        error "K3s agent failed to start within 5 minutes"
    fi
    
    log "K3s worker node joined successfully!"
}

# Display join information
show_join_info() {
    log "K3s Worker Node Join Complete!"
    echo
    echo -e "${BLUE}=== Node Information ===${NC}"
    echo "Node Name: ${NODE_NAME}"
    echo "Node Role: ${NODE_ROLE}"
    echo "Node Tier: ${NODE_TIER}"
    echo "Cluster URL: ${K3S_URL}"
    echo "External IP: $(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
    echo
    echo -e "${BLUE}=== Node Configuration ===${NC}"
    eval "$(generate_node_config)"
    echo "Labels: ${LABELS}"
    if [[ -n "$TAINTS" ]]; then
        echo "Taints: ${TAINTS}"
    else
        echo "Taints: None"
    fi
    echo
    echo -e "${GREEN}Worker node joined successfully!${NC}"
    echo
    echo -e "${BLUE}=== Next Steps ===${NC}"
    echo "1. Verify node status from control plane:"
    echo "   kubectl get nodes -o wide"
    echo
    echo "2. Check node labels:"
    echo "   kubectl get nodes --show-labels"
    echo
    echo "3. Deploy workloads with node selectors:"
    echo "   nodeSelector:"
    echo "     node.gardenos.io/role: ${NODE_ROLE}"
}

# Main execution
main() {
    log "Starting K3s Worker Node Join for GardenOS"
    
    parse_args "$@"
    check_root
    validate_params
    install_k3s_agent
    show_join_info
}

# Run main function
main "$@"
