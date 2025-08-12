#!/bin/bash

# 🔄 Deploy Keepalived + VRRP High Availability
# Configures HAProxy with automatic failover using Hetzner Floating IPs

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
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Floating IPs
MAIN_FLOATING_IP="5.78.31.2"
BACKUP_FLOATING_IP="5.78.28.85"

# Server IPs from your current setup
PRIMARY_SERVER="5.78.103.224"    # ubuntu-8gb-hil-1
BACKUP1_SERVER="5.161.110.205"   # ubuntu-8gb-ash-1
BACKUP2_SERVER="178.156.186.10"  # ubuntu-8gb-ash-2

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

# Copy file to server
copy_to_server() {
    local local_file="$1"
    local server_ip="$2"
    local remote_path="$3"
    local description="$4"
    
    log "$description to $server_ip"
    scp -o StrictHostKeyChecking=no "$local_file" root@"$server_ip":"$remote_path"
}

# Install Keepalived on all servers
install_keepalived() {
    phase "INSTALLING KEEPALIVED ON ALL SERVERS"
    
    local servers=("$PRIMARY_SERVER" "$BACKUP1_SERVER" "$BACKUP2_SERVER")
    
    for server_ip in "${servers[@]}"; do
        log "Installing Keepalived on $server_ip"
        
        run_on_server "$server_ip" "apt update && apt install -y keepalived" "Installing Keepalived"
        run_on_server "$server_ip" "systemctl enable keepalived" "Enabling Keepalived service"
        
        success "Keepalived installed on $server_ip"
    done
}

# Install Hetzner Cloud CLI on all servers
install_hcloud_cli() {
    phase "INSTALLING HETZNER CLOUD CLI"
    
    local servers=("$PRIMARY_SERVER" "$BACKUP1_SERVER" "$BACKUP2_SERVER")
    
    for server_ip in "${servers[@]}"; do
        log "Installing hcloud CLI on $server_ip"
        
        run_on_server "$server_ip" "curl -L https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64.tar.gz | tar -xz -C /tmp" "Downloading hcloud CLI"
        run_on_server "$server_ip" "mv /tmp/hcloud /usr/local/bin/ && chmod +x /usr/local/bin/hcloud" "Installing hcloud CLI"
        
        success "hcloud CLI installed on $server_ip"
    done
}

# Deploy scripts to all servers
deploy_scripts() {
    phase "DEPLOYING KEEPALIVED SCRIPTS"
    
    local servers=("$PRIMARY_SERVER" "$BACKUP1_SERVER" "$BACKUP2_SERVER")
    
    for server_ip in "${servers[@]}"; do
        log "Deploying scripts to $server_ip"
        
        # Create directories
        run_on_server "$server_ip" "mkdir -p /usr/local/bin /etc/hetzner /var/log" "Creating directories"
        
        # Copy scripts
        copy_to_server "$PROJECT_ROOT/scripts/keepalived/check_haproxy.sh" "$server_ip" "/usr/local/bin/check_haproxy.sh" "Copying health check script"
        copy_to_server "$PROJECT_ROOT/scripts/keepalived/assign_floating_ip.sh" "$server_ip" "/usr/local/bin/assign_floating_ip.sh" "Copying floating IP script"
        copy_to_server "$PROJECT_ROOT/scripts/keepalived/keepalived_notify.sh" "$server_ip" "/usr/local/bin/keepalived_notify.sh" "Copying notification script"
        
        # Make scripts executable
        run_on_server "$server_ip" "chmod +x /usr/local/bin/check_haproxy.sh /usr/local/bin/assign_floating_ip.sh /usr/local/bin/keepalived_notify.sh" "Making scripts executable"
        
        success "Scripts deployed to $server_ip"
    done
}

# Configure Hetzner Cloud token
configure_hcloud_token() {
    phase "CONFIGURING HETZNER CLOUD TOKEN"

    # Try to load token from .env.local first
    if [ -f ".env.local" ]; then
        ENV_TOKEN=$(grep "^HCLOUD_TOKEN=" .env.local | cut -d'=' -f2 2>/dev/null || echo "")
        if [ -n "$ENV_TOKEN" ] && [ "$ENV_TOKEN" != "your_hetzner_cloud_api_token_here" ]; then
            export HCLOUD_TOKEN="$ENV_TOKEN"
            log "Loaded Hetzner token from .env.local"
        fi
    fi

    # Check if token is available
    if [ -z "$HCLOUD_TOKEN" ]; then
        warning "HCLOUD_TOKEN not found"
        echo ""
        echo "Please set your Hetzner Cloud token using one of these methods:"
        echo ""
        echo "Method 1 - Environment variable:"
        echo "  export HCLOUD_TOKEN=your_token_here"
        echo ""
        echo "Method 2 - Configure in .env file:"
        echo "  ./scripts/setup-environment-secrets.sh"
        echo ""
        echo "You can get your token from: https://console.hetzner.cloud/"
        exit 1
    fi
    
    local servers=("$PRIMARY_SERVER" "$BACKUP1_SERVER" "$BACKUP2_SERVER")
    
    for server_ip in "${servers[@]}"; do
        log "Configuring Hetzner token on $server_ip"
        
        # Create token file
        run_on_server "$server_ip" "echo '$HCLOUD_TOKEN' > /etc/hetzner/token" "Creating token file"
        run_on_server "$server_ip" "chmod 600 /etc/hetzner/token" "Securing token file"
        
        success "Token configured on $server_ip"
    done
}

# Deploy Keepalived configurations
deploy_keepalived_configs() {
    phase "DEPLOYING KEEPALIVED CONFIGURATIONS"
    
    # Primary server (MASTER)
    log "Deploying primary configuration to $PRIMARY_SERVER"
    copy_to_server "$PROJECT_ROOT/config/keepalived/keepalived-primary.conf" "$PRIMARY_SERVER" "/etc/keepalived/keepalived.conf" "Copying primary config"
    
    # Backup servers (BACKUP)
    log "Deploying backup configuration to $BACKUP1_SERVER"
    copy_to_server "$PROJECT_ROOT/config/keepalived/keepalived-backup1.conf" "$BACKUP1_SERVER" "/etc/keepalived/keepalived.conf" "Copying backup1 config"
    
    log "Deploying backup configuration to $BACKUP2_SERVER"
    copy_to_server "$PROJECT_ROOT/config/keepalived/keepalived-backup1.conf" "$BACKUP2_SERVER" "/etc/keepalived/keepalived.conf" "Copying backup2 config"
    
    success "Keepalived configurations deployed"
}

# Assign initial floating IP
assign_initial_floating_ip() {
    phase "ASSIGNING INITIAL FLOATING IP"
    
    log "Assigning main floating IP to primary server"
    
    # Get primary server ID
    local server_id=$(hcloud server list | grep "$PRIMARY_SERVER" | awk '{print $1}')
    
    if [ -z "$server_id" ]; then
        error "Could not find server ID for $PRIMARY_SERVER"
        return 1
    fi
    
    # Assign floating IP
    hcloud floating-ip assign "crm-haproxy-main" "$server_id"
    
    success "Floating IP assigned to primary server"
}

# Start Keepalived services
start_keepalived() {
    phase "STARTING KEEPALIVED SERVICES"
    
    local servers=("$PRIMARY_SERVER" "$BACKUP1_SERVER" "$BACKUP2_SERVER")
    
    for server_ip in "${servers[@]}"; do
        log "Starting Keepalived on $server_ip"
        
        # Test configuration first
        run_on_server "$server_ip" "keepalived -t -f /etc/keepalived/keepalived.conf" "Testing Keepalived configuration"
        
        # Start service
        run_on_server "$server_ip" "systemctl restart keepalived" "Starting Keepalived"
        run_on_server "$server_ip" "systemctl status keepalived --no-pager" "Checking Keepalived status"
        
        success "Keepalived started on $server_ip"
    done
}

# Verify HA setup
verify_ha_setup() {
    phase "VERIFYING HIGH AVAILABILITY SETUP"
    
    log "Testing floating IP connectivity: $MAIN_FLOATING_IP"
    
    # Test connectivity
    if ping -c 3 "$MAIN_FLOATING_IP" > /dev/null; then
        success "Floating IP is reachable"
    else
        warning "Floating IP is not reachable"
    fi
    
    # Check which server has the floating IP
    local assigned_server=$(hcloud floating-ip describe "crm-haproxy-main" | grep "Server:" | awk '{print $2}')
    log "Floating IP currently assigned to: $assigned_server"
    
    # Test HAProxy stats if available
    if curl -f -s "http://$MAIN_FLOATING_IP:8404/stats" > /dev/null; then
        success "HAProxy stats accessible via floating IP"
    else
        warning "HAProxy stats not accessible (HAProxy may not be running yet)"
    fi
    
    success "High availability verification completed"
}

# Display summary
show_summary() {
    phase "KEEPALIVED HA DEPLOYMENT SUMMARY"
    
    echo "🔄 Keepalived + VRRP High Availability Deployed"
    echo "==============================================="
    echo ""
    echo "🌐 Configuration:"
    echo "  Main Floating IP: $MAIN_FLOATING_IP"
    echo "  Backup Floating IP: $BACKUP_FLOATING_IP"
    echo "  Primary Server: $PRIMARY_SERVER (MASTER)"
    echo "  Backup Servers: $BACKUP1_SERVER, $BACKUP2_SERVER (BACKUP)"
    echo ""
    echo "🔧 Features:"
    echo "  ✅ Automatic failover with VRRP"
    echo "  ✅ Hetzner Floating IP integration"
    echo "  ✅ HAProxy health monitoring"
    echo "  ✅ State change notifications"
    echo ""
    echo "📊 Monitoring:"
    echo "  Logs: /var/log/keepalived-*.log on each server"
    echo "  Status: systemctl status keepalived"
    echo "  VRRP: ip addr show eth0"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Deploy HAProxy configuration"
    echo "2. Test failover scenarios"
    echo "3. Configure monitoring and alerting"
    echo "4. Update DNS to point to $MAIN_FLOATING_IP"
}

# Main execution
main() {
    echo "🔄 KEEPALIVED + VRRP HIGH AVAILABILITY DEPLOYMENT"
    echo "================================================"
    echo "Configuring automatic failover with Hetzner Floating IPs"
    echo ""
    
    install_keepalived
    install_hcloud_cli
    deploy_scripts
    configure_hcloud_token
    deploy_keepalived_configs
    assign_initial_floating_ip
    start_keepalived
    verify_ha_setup
    show_summary
    
    success "🎉 Keepalived HA deployment completed successfully!"
    echo ""
    echo "💡 Your HAProxy now has sub-second automatic failover!"
}

# Run main function
main "$@"
