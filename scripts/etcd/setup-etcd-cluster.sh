#!/bin/bash

# 🔗 etcd Cluster Setup Script for GardenOS
# Sets up a 3-node etcd cluster for K3s and Patroni
# Part of the GardenOS high-availability CRM stack on Hetzner

set -euo pipefail

# Configuration
ETCD_VERSION="${ETCD_VERSION:-v3.5.21}"
ETCD_USER="etcd"
ETCD_DATA_DIR="/var/lib/etcd"
ETCD_CONFIG_DIR="/etc/etcd"

# Server configuration (update these to match your servers)
declare -A SERVERS=(
    ["ubuntu-8gb-hil-1"]="5.78.103.224"
    ["ubuntu-8gb-ash-1"]="5.161.110.205"
    ["ubuntu-8gb-ash-2"]="178.156.186.10"
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
    echo "  install-etcd          Install etcd binary on all nodes"
    echo "  setup-cluster         Set up complete 3-node etcd cluster"
    echo "  start-cluster         Start etcd cluster services"
    echo "  stop-cluster          Stop etcd cluster services"
    echo "  status-cluster        Check cluster status"
    echo "  cleanup-old           Clean up old etcd installation"
    echo
    echo "Options:"
    echo "  --node NODE           Run command on specific node (ubuntu-8gb-hil-1, ubuntu-8gb-ash-1, ubuntu-8gb-ash-2)"
    echo "  --help                Show this help message"
    echo
    echo "Examples:"
    echo "  $0 setup-cluster"
    echo "  $0 status-cluster"
    echo "  $0 install-etcd --node ubuntu-8gb-hil-1"
    echo
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    TARGET_NODE=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            install-etcd|setup-cluster|start-cluster|stop-cluster|status-cluster|cleanup-old)
                COMMAND="$1"
                shift
                ;;
            --node)
                TARGET_NODE="$2"
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
    
    # Check if we can SSH to all servers
    for node in "${!SERVERS[@]}"; do
        local ip="${SERVERS[$node]}"
        if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "root@$ip" "echo 'SSH OK'" &>/dev/null; then
            error "Cannot SSH to $node ($ip). Please ensure SSH key authentication is set up."
        fi
    done
    
    log "Prerequisites check passed"
}

# Install etcd binary on a node
install_etcd_on_node() {
    local node="$1"
    local ip="${SERVERS[$node]}"
    
    log "Installing etcd $ETCD_VERSION on $node ($ip)..."
    
    ssh "root@$ip" << EOF
        set -euo pipefail
        
        # Stop any existing etcd
        pkill etcd || true
        systemctl stop etcd || true
        
        # Create etcd user
        if ! id "$ETCD_USER" &>/dev/null; then
            useradd --system --home-dir $ETCD_DATA_DIR --shell /bin/false $ETCD_USER
        fi
        
        # Create directories
        mkdir -p $ETCD_DATA_DIR $ETCD_CONFIG_DIR /var/log/etcd
        chown -R $ETCD_USER:$ETCD_USER $ETCD_DATA_DIR /var/log/etcd
        
        # Download and install etcd
        cd /tmp
        curl -L https://github.com/etcd-io/etcd/releases/download/$ETCD_VERSION/etcd-$ETCD_VERSION-linux-amd64.tar.gz -o etcd.tar.gz
        tar xzf etcd.tar.gz
        mv etcd-$ETCD_VERSION-linux-amd64/etcd* /usr/local/bin/
        chmod +x /usr/local/bin/etcd*
        rm -rf etcd.tar.gz etcd-$ETCD_VERSION-linux-amd64
        
        # Verify installation
        /usr/local/bin/etcd --version
EOF
    
    log "etcd installed on $node"
}

# Generate etcd configuration for a node
generate_etcd_config() {
    local node="$1"
    local ip="${SERVERS[$node]}"
    
    # Build cluster string
    local cluster_string=""
    for n in "${!SERVERS[@]}"; do
        if [[ -n "$cluster_string" ]]; then
            cluster_string="${cluster_string},"
        fi
        cluster_string="${cluster_string}${n}=http://${SERVERS[$n]}:2380"
    done
    
    cat << EOF
# etcd Configuration for $node
# GardenOS 3-node etcd cluster

# Node identity
ETCD_NAME="$node"
ETCD_DATA_DIR="$ETCD_DATA_DIR"

# Network configuration
ETCD_LISTEN_PEER_URLS="http://$ip:2380"
ETCD_LISTEN_CLIENT_URLS="http://$ip:2379,http://127.0.0.1:2379"
ETCD_ADVERTISE_CLIENT_URLS="http://$ip:2379"
ETCD_INITIAL_ADVERTISE_PEER_URLS="http://$ip:2380"

# Cluster configuration
ETCD_INITIAL_CLUSTER="$cluster_string"
ETCD_INITIAL_CLUSTER_STATE="new"
ETCD_INITIAL_CLUSTER_TOKEN="gardenos-etcd-cluster"

# Logging
ETCD_LOG_LEVEL="info"
ETCD_LOG_OUTPUTS="default"

# Performance tuning
ETCD_HEARTBEAT_INTERVAL="100"
ETCD_ELECTION_TIMEOUT="1000"
ETCD_MAX_SNAPSHOTS="5"
ETCD_MAX_WALS="5"
ETCD_QUOTA_BACKEND_BYTES="8589934592"

# Security (disabled for simplicity - can be enabled later)
ETCD_CLIENT_CERT_AUTH="false"
ETCD_PEER_CERT_AUTH="false"
EOF
}

# Generate systemd service file
generate_systemd_service() {
    cat << EOF
[Unit]
Description=etcd key-value store
Documentation=https://github.com/etcd-io/etcd
After=network.target
Wants=network-online.target

[Service]
Type=notify
User=$ETCD_USER
Group=$ETCD_USER
ExecStart=/usr/local/bin/etcd
Restart=always
RestartSec=10s
LimitNOFILE=40000
TimeoutStartSec=0

# Environment file
EnvironmentFile=$ETCD_CONFIG_DIR/etcd.conf

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=etcd

[Install]
WantedBy=multi-user.target
EOF
}

# Set up etcd cluster on all nodes
setup_etcd_cluster() {
    log "Setting up etcd cluster on all nodes..."
    
    # First, install etcd on all nodes
    for node in "${!SERVERS[@]}"; do
        install_etcd_on_node "$node"
    done
    
    # Generate configurations and systemd services
    for node in "${!SERVERS[@]}"; do
        local ip="${SERVERS[$node]}"
        
        log "Configuring etcd on $node ($ip)..."
        
        # Generate and upload configuration
        generate_etcd_config "$node" > "/tmp/etcd-${node}.conf"
        scp "/tmp/etcd-${node}.conf" "root@$ip:$ETCD_CONFIG_DIR/etcd.conf"
        rm "/tmp/etcd-${node}.conf"
        
        # Generate and upload systemd service
        generate_systemd_service > "/tmp/etcd.service"
        scp "/tmp/etcd.service" "root@$ip:/etc/systemd/system/etcd.service"
        rm "/tmp/etcd.service"
        
        # Set permissions and reload systemd
        ssh "root@$ip" << EOF
            chown root:root $ETCD_CONFIG_DIR/etcd.conf /etc/systemd/system/etcd.service
            chmod 644 $ETCD_CONFIG_DIR/etcd.conf /etc/systemd/system/etcd.service
            systemctl daemon-reload
            systemctl enable etcd
EOF
    done
    
    log "etcd cluster configuration completed"
}

# Start etcd cluster
start_etcd_cluster() {
    log "Starting etcd cluster..."
    
    # Start all nodes simultaneously for initial cluster bootstrap
    for node in "${!SERVERS[@]}"; do
        local ip="${SERVERS[$node]}"
        log "Starting etcd on $node ($ip)..."
        ssh "root@$ip" "systemctl start etcd" &
    done
    
    # Wait for all background jobs to complete
    wait
    
    # Give etcd time to form cluster
    sleep 10
    
    log "etcd cluster started"
}

# Stop etcd cluster
stop_etcd_cluster() {
    log "Stopping etcd cluster..."
    
    for node in "${!SERVERS[@]}"; do
        local ip="${SERVERS[$node]}"
        log "Stopping etcd on $node ($ip)..."
        ssh "root@$ip" "systemctl stop etcd" || true
    done
    
    log "etcd cluster stopped"
}

# Check cluster status
check_cluster_status() {
    log "Checking etcd cluster status..."
    
    # Check each node
    for node in "${!SERVERS[@]}"; do
        local ip="${SERVERS[$node]}"
        echo
        echo -e "${BLUE}=== $node ($ip) ===${NC}"
        
        # Check service status
        ssh "root@$ip" "systemctl is-active etcd" || echo "Service not active"
        
        # Check etcd health
        if ssh "root@$ip" "curl -s http://localhost:2379/health" 2>/dev/null; then
            echo "✅ etcd health check passed"
        else
            echo "❌ etcd health check failed"
        fi
    done
    
    # Check cluster membership from first node
    echo
    echo -e "${BLUE}=== Cluster Membership ===${NC}"
    local first_ip="${SERVERS[ubuntu-8gb-hil-1]}"
    if ssh "root@$first_ip" "curl -s http://localhost:2379/v2/members" 2>/dev/null; then
        echo "✅ Cluster membership retrieved"
    else
        echo "❌ Failed to get cluster membership"
    fi
    
    # Check cluster health
    echo
    echo -e "${BLUE}=== Cluster Health ===${NC}"
    if ssh "root@$first_ip" "/usr/local/bin/etcdctl --endpoints=http://localhost:2379 endpoint health" 2>/dev/null; then
        echo "✅ Cluster health check passed"
    else
        echo "❌ Cluster health check failed"
    fi
}

# Clean up old etcd installation
cleanup_old_etcd() {
    log "Cleaning up old etcd installation..."
    
    for node in "${!SERVERS[@]}"; do
        local ip="${SERVERS[$node]}"
        log "Cleaning up $node ($ip)..."
        
        ssh "root@$ip" << EOF
            # Stop any running etcd
            pkill etcd || true
            systemctl stop etcd || true
            systemctl disable etcd || true
            
            # Remove old data (be careful!)
            rm -rf $ETCD_DATA_DIR/*
            
            # Remove old logs
            rm -rf /var/log/etcd/*
EOF
    done
    
    log "Cleanup completed"
}

# Main execution
main() {
    log "etcd Cluster Setup for GardenOS"
    
    parse_args "$@"
    
    case "$COMMAND" in
        install-etcd)
            if [[ -n "$TARGET_NODE" ]]; then
                if [[ -z "${SERVERS[$TARGET_NODE]:-}" ]]; then
                    error "Unknown node: $TARGET_NODE"
                fi
                install_etcd_on_node "$TARGET_NODE"
            else
                check_prerequisites
                for node in "${!SERVERS[@]}"; do
                    install_etcd_on_node "$node"
                done
            fi
            ;;
        setup-cluster)
            check_prerequisites
            cleanup_old_etcd
            setup_etcd_cluster
            ;;
        start-cluster)
            start_etcd_cluster
            ;;
        stop-cluster)
            stop_etcd_cluster
            ;;
        status-cluster)
            check_cluster_status
            ;;
        cleanup-old)
            cleanup_old_etcd
            ;;
        *)
            error "Unknown command: $COMMAND"
            ;;
    esac
}

# Run main function
main "$@"
