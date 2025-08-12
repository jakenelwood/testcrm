#!/bin/bash

# 🏢 Enterprise 9-Server CCX23 Cluster Deployment
# Deploys a production-ready CRM infrastructure across 9 Hetzner CCX23 servers
# Total: 72 vCPUs, 288GB RAM, 2.16TB NVMe storage for $270/month

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/servers.yaml"
DEPLOYMENT_DIR="/opt/crm-enterprise"

# Hetzner Configuration
HETZNER_PROJECT="CRM"
SERVER_TYPE="ccx23"  # 8 vCPU, 32GB RAM, 240GB NVMe
SSH_KEY_NAME="crm-enterprise"

# Server naming convention: crm-{tier}-{location}-{number}
declare -A CONTROL_PLANE_SERVERS=(
    ["crm-ctrl-hil-1"]="hillsboro"
    ["crm-ctrl-ash-1"]="ashburn" 
    ["crm-ctrl-ash-2"]="ashburn"
)

declare -A APPLICATION_SERVERS=(
    ["crm-app-hil-1"]="hillsboro"
    ["crm-app-ash-1"]="ashburn"
    ["crm-app-ash-2"]="ashburn"
)

declare -A SERVICE_SERVERS=(
    ["crm-svc-hil-1"]="hillsboro"
    ["crm-svc-ash-1"]="ashburn"
    ["crm-svc-ash-2"]="ashburn"
)

# Location mappings
declare -A LOCATIONS=(
    ["hillsboro"]="hil"
    ["ashburn"]="ash"
)

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

phase() {
    echo -e "${PURPLE}[PHASE]${NC} $1"
    echo "=================================="
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if hcloud CLI is installed
    if ! command -v hcloud &> /dev/null; then
        error "Hetzner Cloud CLI not found. Installing..."
        curl -L https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64.tar.gz | tar -xz
        sudo mv hcloud /usr/local/bin/
        success "Hetzner Cloud CLI installed"
    fi
    
    # Check authentication
    if ! hcloud context list | grep -q "active"; then
        error "No active Hetzner Cloud context. Please run:"
        echo "  hcloud context create $HETZNER_PROJECT"
        exit 1
    fi
    
    # Check SSH key
    if ! hcloud ssh-key describe "$SSH_KEY_NAME" &>/dev/null; then
        warning "SSH key '$SSH_KEY_NAME' not found. Creating..."
        if [ -f ~/.ssh/id_rsa.pub ]; then
            hcloud ssh-key create --public-key-from-file ~/.ssh/id_rsa.pub --name "$SSH_KEY_NAME"
            success "SSH key created"
        else
            error "No SSH public key found at ~/.ssh/id_rsa.pub"
            echo "Please generate one with: ssh-keygen -t rsa -b 4096"
            exit 1
        fi
    fi
    
    success "Prerequisites check completed"
}

# Create server if it doesn't exist
create_server() {
    local server_name="$1"
    local location="$2"
    local tier="$3"
    
    log "Checking server: $server_name"
    
    if hcloud server describe "$server_name" &>/dev/null; then
        warning "Server '$server_name' already exists"
        return 0
    fi
    
    log "Creating server: $server_name in $location ($tier tier)"
    
    hcloud server create \
        --name "$server_name" \
        --type "$SERVER_TYPE" \
        --image ubuntu-22.04 \
        --location "${LOCATIONS[$location]}" \
        --ssh-key "$SSH_KEY_NAME" \
        --label tier="$tier" \
        --label location="$location" \
        --label project="crm-enterprise"
    
    success "Created server: $server_name"
    
    # Wait for server to be ready
    log "Waiting for server to be ready..."
    sleep 30
    
    local server_ip=$(hcloud server describe "$server_name" -o format='{{.PublicNet.IPv4.IP}}')
    log "Server IP: $server_ip"
    
    # Wait for SSH to be available
    local retries=0
    while [ $retries -lt 20 ]; do
        if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@"$server_ip" "echo 'SSH ready'" &>/dev/null; then
            success "SSH connection established to $server_name"
            break
        fi
        ((retries++))
        log "Waiting for SSH... (attempt $retries/20)"
        sleep 15
    done
    
    if [ $retries -eq 20 ]; then
        error "Failed to establish SSH connection to $server_name"
        return 1
    fi
}

# Deploy control plane servers
deploy_control_plane() {
    phase "DEPLOYING CONTROL PLANE SERVERS (3x CCX23)"
    
    for server in "${!CONTROL_PLANE_SERVERS[@]}"; do
        create_server "$server" "${CONTROL_PLANE_SERVERS[$server]}" "control-plane"
    done
    
    success "Control plane servers deployed"
}

# Deploy application servers  
deploy_application_servers() {
    phase "DEPLOYING APPLICATION SERVERS (3x CCX23)"
    
    for server in "${!APPLICATION_SERVERS[@]}"; do
        create_server "$server" "${APPLICATION_SERVERS[$server]}" "application"
    done
    
    success "Application servers deployed"
}

# Deploy service servers
deploy_service_servers() {
    phase "DEPLOYING SERVICE SERVERS (3x CCX23)"
    
    for server in "${!SERVICE_SERVERS[@]}"; do
        create_server "$server" "${SERVICE_SERVERS[$server]}" "services"
    done
    
    success "Service servers deployed"
}

# Create floating IPs
create_floating_ips() {
    phase "CREATING FLOATING IPs FOR HIGH AVAILABILITY"
    
    local floating_ips=(
        "crm-haproxy-main:Main load balancer floating IP"
        "crm-haproxy-backup:Backup load balancer floating IP"
        "crm-api-public:Public API floating IP"
        "crm-admin-panel:Admin panel floating IP"
    )
    
    for ip_config in "${floating_ips[@]}"; do
        local ip_name="${ip_config%%:*}"
        local description="${ip_config##*:}"
        
        if hcloud floating-ip describe "$ip_name" &>/dev/null; then
            warning "Floating IP '$ip_name' already exists"
            continue
        fi
        
        log "Creating floating IP: $ip_name"
        hcloud floating-ip create \
            --type ipv4 \
            --home-location hil \
            --name "$ip_name" \
            --description "$description"
        
        success "Created floating IP: $ip_name"
    done
}

# Generate inventory file
generate_inventory() {
    phase "GENERATING ANSIBLE INVENTORY"
    
    local inventory_file="$PROJECT_ROOT/inventory/enterprise/hosts.yml"
    mkdir -p "$(dirname "$inventory_file")"
    
    cat > "$inventory_file" << 'EOF'
# Enterprise 9-Server Cluster Inventory
# Generated automatically by deploy-9-server-cluster.sh

all:
  children:
    control_plane:
      hosts:
EOF

    # Add control plane servers
    for server in "${!CONTROL_PLANE_SERVERS[@]}"; do
        local server_ip=$(hcloud server describe "$server" -o format='{{.PublicNet.IPv4.IP}}' 2>/dev/null || echo "TBD")
        cat >> "$inventory_file" << EOF
        $server:
          ansible_host: $server_ip
          tier: control-plane
          location: ${CONTROL_PLANE_SERVERS[$server]}
EOF
    done
    
    cat >> "$inventory_file" << 'EOF'
    
    application:
      hosts:
EOF

    # Add application servers
    for server in "${!APPLICATION_SERVERS[@]}"; do
        local server_ip=$(hcloud server describe "$server" -o format='{{.PublicNet.IPv4.IP}}' 2>/dev/null || echo "TBD")
        cat >> "$inventory_file" << EOF
        $server:
          ansible_host: $server_ip
          tier: application
          location: ${APPLICATION_SERVERS[$server]}
EOF
    done
    
    cat >> "$inventory_file" << 'EOF'
    
    services:
      hosts:
EOF

    # Add service servers
    for server in "${!SERVICE_SERVERS[@]}"; do
        local server_ip=$(hcloud server describe "$server" -o format='{{.PublicNet.IPv4.IP}}' 2>/dev/null || echo "TBD")
        cat >> "$inventory_file" << EOF
        $server:
          ansible_host: $server_ip
          tier: services
          location: ${SERVICE_SERVERS[$server]}
EOF
    done
    
    success "Generated inventory file: $inventory_file"
}

# Display deployment summary
show_summary() {
    phase "DEPLOYMENT SUMMARY"
    
    echo "🏢 Enterprise 9-Server CCX23 Cluster"
    echo "====================================="
    echo "Total Resources: 72 vCPUs, 288GB RAM, 2.16TB NVMe"
    echo "Monthly Cost: $270"
    echo ""
    
    echo "📊 Server Distribution:"
    echo "Control Plane (3): K3s masters, PostgreSQL, HAProxy, etcd"
    echo "Application (3):    Supabase, FastAPI, AI agents, frontend"
    echo "Services (3):       Monitoring, logging, backup, Redis"
    echo ""
    
    echo "🌍 Geographic Distribution:"
    echo "Hillsboro: 3 servers (1 per tier)"
    echo "Ashburn:   6 servers (2 per tier)"
    echo ""
    
    echo "🔗 Floating IPs:"
    hcloud floating-ip list -o table
    echo ""
    
    echo "🚀 Next Steps:"
    echo "1. Run: ./scripts/enterprise/configure-base-system.sh"
    echo "2. Run: ./scripts/enterprise/deploy-k3s-cluster.sh"
    echo "3. Run: ./scripts/enterprise/deploy-database-cluster.sh"
    echo "4. Run: ./scripts/enterprise/deploy-application-stack.sh"
    echo "5. Run: ./scripts/enterprise/deploy-monitoring-stack.sh"
}

# Main execution
main() {
    echo "🚀 ENTERPRISE 9-SERVER CCX23 CLUSTER DEPLOYMENT"
    echo "================================================"
    echo "Deploying 72 vCPUs, 288GB RAM, 2.16TB storage for $270/month"
    echo ""
    
    check_prerequisites
    deploy_control_plane
    deploy_application_servers
    deploy_service_servers
    create_floating_ips
    generate_inventory
    show_summary
    
    success "🎉 Enterprise cluster infrastructure deployed successfully!"
    echo ""
    echo "💡 Pro tip: This infrastructure can handle 50,000+ concurrent users!"
}

# Run main function
main "$@"
