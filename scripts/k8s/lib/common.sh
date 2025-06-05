#!/bin/bash

# 🔧 Common K3s Utilities Library
# Shared configuration, logging, and utility functions for GardenOS K3s scripts
# Part of the GardenOS high-availability CRM stack

# Prevent multiple sourcing
if [[ "${GARDENOS_COMMON_LOADED:-}" == "true" ]]; then
    return 0
fi
export GARDENOS_COMMON_LOADED=true

# ===== CONFIGURATION =====

# Server Configuration
export ETCD_SERVERS=(
    "5.78.103.224"
    "5.161.110.205" 
    "178.156.186.10"
)
export PRIMARY_SERVER="5.78.103.224"
export ETCD_PORT="2379"
export ETCD_ENDPOINTS="http://${ETCD_SERVERS[0]}:${ETCD_PORT},http://${ETCD_SERVERS[1]}:${ETCD_PORT},http://${ETCD_SERVERS[2]}:${ETCD_PORT}"

# Kubernetes Configuration
export POSTGRES_NAMESPACE="postgres-cluster"
export SUPABASE_NAMESPACE="supabase"
export FASTAPI_NAMESPACE="fastapi"
export INGRESS_NAMESPACE="ingress-nginx"

# Timeouts (seconds)
export DEFAULT_TIMEOUT=300
export POSTGRES_TIMEOUT=600
export POD_READY_TIMEOUT=120

# Paths
export SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export K8S_DIR="$PROJECT_ROOT/k8s"
export BACKUP_DIR="$PROJECT_ROOT/backups"

# ===== COLORS =====

export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export PURPLE='\033[0;35m'
export WHITE='\033[1;37m'
export NC='\033[0m' # No Color

# ===== LOGGING FUNCTIONS =====

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    if [[ "${2:-}" == "exit" ]]; then
        exit 1
    fi
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

fail() {
    echo -e "${RED}❌ $1${NC}"
}

section() {
    echo
    echo -e "${CYAN}=== $1 ===${NC}"
    echo
}

debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG] $1${NC}"
    fi
}

# ===== UTILITY FUNCTIONS =====

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check if running as root
is_root() {
    [[ $EUID -eq 0 ]]
}

# Check if kubectl is available and connected
check_kubectl() {
    if ! command_exists kubectl; then
        error "kubectl not found. Please install kubectl." exit
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Please check your kubeconfig." exit
    fi
}

# Check etcd cluster health
check_etcd_health() {
    local healthy_count=0
    local total_count=${#ETCD_SERVERS[@]}
    
    for server in "${ETCD_SERVERS[@]}"; do
        if curl -s "http://$server:$ETCD_PORT/health" | grep -q '"health":"true"'; then
            debug "etcd $server: HEALTHY"
            ((healthy_count++))
        else
            debug "etcd $server: UNHEALTHY"
        fi
    done
    
    if [[ $healthy_count -lt 2 ]]; then
        error "etcd cluster unhealthy: only $healthy_count/$total_count nodes healthy" exit
    fi
    
    debug "etcd cluster healthy: $healthy_count/$total_count nodes"
    return 0
}

# Wait for pods to be ready
wait_for_pods() {
    local namespace="$1"
    local selector="$2"
    local timeout="${3:-$POD_READY_TIMEOUT}"
    
    log "Waiting for pods in namespace $namespace (selector: $selector)..."
    
    if kubectl wait --namespace "$namespace" \
        --for=condition=ready pod \
        --selector="$selector" \
        --timeout="${timeout}s" &>/dev/null; then
        success "Pods ready in namespace $namespace"
        return 0
    else
        fail "Pods not ready in namespace $namespace after ${timeout}s"
        return 1
    fi
}

# Check if namespace exists
namespace_exists() {
    kubectl get namespace "$1" &>/dev/null
}

# Create namespace if it doesn't exist
ensure_namespace() {
    local namespace="$1"
    
    if ! namespace_exists "$namespace"; then
        log "Creating namespace: $namespace"
        kubectl create namespace "$namespace"
    else
        debug "Namespace $namespace already exists"
    fi
}

# Get pod status in namespace
get_pod_status() {
    local namespace="$1"
    local pod_name="${2:-}"
    
    if [[ -n "$pod_name" ]]; then
        kubectl get pod "$pod_name" -n "$namespace" --no-headers 2>/dev/null | awk '{print $3}'
    else
        kubectl get pods -n "$namespace" --no-headers 2>/dev/null
    fi
}

# Check if deployment is ready
deployment_ready() {
    local namespace="$1"
    local deployment="$2"
    
    local ready_replicas
    ready_replicas=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    local desired_replicas
    desired_replicas=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
    
    [[ "$ready_replicas" -eq "$desired_replicas" ]] && [[ "$ready_replicas" -gt 0 ]]
}

# Execute remote SSH command
ssh_exec() {
    local server="$1"
    local command="$2"
    local user="${3:-root}"
    
    ssh "$user@$server" "$command"
}

# Check if service is running on remote server
service_running() {
    local server="$1"
    local service="$2"
    local user="${3:-root}"
    
    ssh_exec "$server" "systemctl is-active $service" "$user" &>/dev/null
}

# Backup timestamp
backup_timestamp() {
    date +%Y%m%d-%H%M%S
}

# Create backup directory
create_backup_dir() {
    local backup_name="$1"
    local timestamp="${2:-$(backup_timestamp)}"
    local backup_path="$BACKUP_DIR/$backup_name-$timestamp"
    
    mkdir -p "$backup_path"
    echo "$backup_path"
}

# Check if storage class exists
storage_class_exists() {
    local storage_class="$1"
    kubectl get storageclass "$storage_class" &>/dev/null
}

# Get node count
get_node_count() {
    kubectl get nodes --no-headers | wc -l
}

# Check if all nodes are ready
all_nodes_ready() {
    local total_nodes
    total_nodes=$(get_node_count)
    local ready_nodes
    ready_nodes=$(kubectl get nodes --no-headers | grep -c " Ready ")
    
    [[ "$ready_nodes" -eq "$total_nodes" ]] && [[ "$total_nodes" -gt 0 ]]
}

# Print script header
print_header() {
    local script_name="$1"
    local description="$2"
    
    echo
    echo -e "${WHITE}🚀 $script_name${NC}"
    if [[ -n "$description" ]]; then
        echo -e "${BLUE}$description${NC}"
    fi
    echo
}

# Print script footer
print_footer() {
    local script_name="$1"
    echo
    log "$script_name completed successfully"
    echo
}

# Validate required environment variables
require_env() {
    local var_name="$1"
    local var_value="${!var_name:-}"
    
    if [[ -z "$var_value" ]]; then
        error "Required environment variable $var_name is not set" exit
    fi
}

# Source this file in other scripts with:
# source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"
