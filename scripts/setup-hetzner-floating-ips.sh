#!/bin/bash

# 🌐 Setup Hetzner Floating IPs for HAProxy High Availability
# Creates and configures floating IPs for the CRM load balancer setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="CRM"
LOCATION="hil"  # hillsboro
FLOATING_IP_MAIN="crm-haproxy-main"
FLOATING_IP_BACKUP="crm-haproxy-backup"

# Server IPs from config/servers.yaml
PRIMARY_SERVER="5.78.103.224"    # ubuntu-8gb-hil-1
BACKUP1_SERVER="5.161.110.205"   # ubuntu-8gb-ash-1
BACKUP2_SERVER="178.156.186.10"  # ubuntu-8gb-ash-2

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if hcloud CLI is installed
check_hcloud_cli() {
    print_status "Checking for Hetzner Cloud CLI..."
    
    if ! command -v hcloud &> /dev/null; then
        print_error "Hetzner Cloud CLI not found. Please install it first:"
        echo "  curl -L https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64.tar.gz | tar -xz"
        echo "  sudo mv hcloud /usr/local/bin/"
        exit 1
    fi
    
    print_success "Hetzner Cloud CLI found"
}

# Check if we're authenticated
check_authentication() {
    print_status "Checking Hetzner Cloud authentication..."
    
    if ! hcloud context list | grep -q "active"; then
        print_error "No active Hetzner Cloud context found. Please run:"
        echo "  hcloud context create $PROJECT_NAME"
        echo "  # Enter your Hetzner Cloud API token when prompted"
        exit 1
    fi
    
    print_success "Authenticated with Hetzner Cloud"
}

# Create floating IP if it doesn't exist
create_floating_ip() {
    local ip_name="$1"
    local description="$2"
    
    print_status "Checking floating IP: $ip_name"
    
    if hcloud floating-ip describe "$ip_name" &>/dev/null; then
        print_warning "Floating IP '$ip_name' already exists"
        local existing_ip=$(hcloud floating-ip describe "$ip_name" -o format='{{.IP}}')
        echo "  IP Address: $existing_ip"
        return 0
    fi
    
    print_status "Creating floating IP: $ip_name"
    hcloud floating-ip create \
        --type ipv4 \
        --home-location "$LOCATION" \
        --name "$ip_name" \
        --description "$description"
    
    local new_ip=$(hcloud floating-ip describe "$ip_name" -o format='{{.IP}}')
    print_success "Created floating IP '$ip_name': $new_ip"
}

# Assign floating IP to primary server initially
assign_to_primary() {
    local ip_name="$1"
    
    print_status "Assigning $ip_name to primary server ($PRIMARY_SERVER)..."
    
    # Get server ID for primary server
    local server_id=$(hcloud server list -o format='{{.ID}} {{.PublicNet.IPv4.IP}}' | grep "$PRIMARY_SERVER" | awk '{print $1}')
    
    if [ -z "$server_id" ]; then
        print_error "Could not find server with IP $PRIMARY_SERVER"
        return 1
    fi
    
    # Assign floating IP
    hcloud floating-ip assign "$ip_name" "$server_id"
    print_success "Assigned $ip_name to server ID $server_id"
}

# Display configuration summary
show_summary() {
    print_status "Floating IP Configuration Summary:"
    echo "=================================="
    
    for ip_name in "$FLOATING_IP_MAIN" "$FLOATING_IP_BACKUP"; do
        if hcloud floating-ip describe "$ip_name" &>/dev/null; then
            local ip_address=$(hcloud floating-ip describe "$ip_name" -o format='{{.IP}}')
            local assigned_server=$(hcloud floating-ip describe "$ip_name" -o format='{{.Server}}')
            echo "  $ip_name: $ip_address (assigned to: $assigned_server)"
        fi
    done
    
    echo ""
    print_status "Next Steps:"
    echo "1. Update config/servers.yaml with the floating IP addresses"
    echo "2. Run the Keepalived + HAProxy deployment script"
    echo "3. Update your DNS records to point to the main floating IP"
    echo "4. Test failover scenarios"
}

# Update servers.yaml with floating IP addresses
update_servers_config() {
    print_status "Updating config/servers.yaml with floating IP addresses..."
    
    local main_ip=$(hcloud floating-ip describe "$FLOATING_IP_MAIN" -o format='{{.IP}}')
    local backup_ip=$(hcloud floating-ip describe "$FLOATING_IP_BACKUP" -o format='{{.IP}}')
    
    # Create a backup of the original file
    cp config/servers.yaml config/servers.yaml.backup
    
    # Update the floating IP addresses in the config file
    sed -i "s/haproxy_main: \"TBD\"/haproxy_main: \"$main_ip\"/" config/servers.yaml
    sed -i "s/haproxy_backup: \"TBD\"/haproxy_backup: \"$backup_ip\"/" config/servers.yaml
    
    print_success "Updated config/servers.yaml with floating IP addresses"
    echo "  Main IP: $main_ip"
    echo "  Backup IP: $backup_ip"
}

# Main execution
main() {
    echo "🌐 Setting up Hetzner Floating IPs for HAProxy HA"
    echo "================================================"
    
    check_hcloud_cli
    check_authentication
    
    # Create floating IPs
    create_floating_ip "$FLOATING_IP_MAIN" "Main load balancer floating IP for CRM"
    create_floating_ip "$FLOATING_IP_BACKUP" "Backup load balancer floating IP for CRM"
    
    # Assign main IP to primary server
    assign_to_primary "$FLOATING_IP_MAIN"
    
    # Update configuration
    update_servers_config
    
    # Show summary
    show_summary
    
    print_success "🎉 Hetzner Floating IP setup complete!"
}

# Run main function
main "$@"
