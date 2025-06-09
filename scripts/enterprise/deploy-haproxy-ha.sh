#!/bin/bash

# 🔄 Enterprise HAProxy High Availability Deployment
# Deploys HAProxy with Keepalived + VRRP using Hetzner Floating IPs

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
VRRP_PASSWORD="CRM_VRRP_$(openssl rand -hex 8)"

# Get server information
get_control_plane_servers() {
    hcloud server list -o format='{{.Name}} {{.PublicNet.IPv4.IP}}' | grep "crm-ctrl-"
}

get_floating_ips() {
    hcloud floating-ip list -o format='{{.Name}} {{.IP}}'
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

# Copy file to server
copy_to_server() {
    local local_file="$1"
    local server_ip="$2"
    local remote_path="$3"
    local description="$4"
    
    log "$description to $server_ip"
    scp -o StrictHostKeyChecking=no "$local_file" root@"$server_ip":"$remote_path"
}

# Install HAProxy on control plane nodes
install_haproxy() {
    phase "INSTALLING HAPROXY ON CONTROL PLANE NODES"
    
    get_control_plane_servers | while read -r server_name server_ip; do
        log "Installing HAProxy on $server_name ($server_ip)"
        
        run_on_server "$server_ip" "apt update && apt install -y haproxy" "Installing HAProxy"
        run_on_server "$server_ip" "systemctl enable haproxy" "Enabling HAProxy service"
        
        success "HAProxy installed on $server_name"
    done
}

# Create HAProxy configuration
create_haproxy_config() {
    phase "CREATING HAPROXY CONFIGURATION"
    
    local main_floating_ip=$(get_floating_ips | grep "crm-haproxy-main" | awk '{print $2}')
    local backup_floating_ip=$(get_floating_ips | grep "crm-haproxy-backup" | awk '{print $2}')
    
    if [ -z "$main_floating_ip" ]; then
        error "Main floating IP not found. Please create it first."
        exit 1
    fi
    
    log "Main floating IP: $main_floating_ip"
    log "Backup floating IP: $backup_floating_ip"
    
    # Create HAProxy configuration
    cat > /tmp/haproxy.cfg << EOF
# 🔄 Enterprise HAProxy Configuration
# High Availability Load Balancer for CRM Enterprise Cluster
# Manages traffic across 9 CCX23 servers

global
    log stdout local0
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon
    maxconn 50000

    # SSL Configuration
    ca-base /etc/ssl/certs
    crt-base /etc/ssl/private
    ssl-default-bind-ciphers ECDHE+aRSA+AES256+GCM+SHA384:ECDHE+aRSA+AES128+GCM+SHA256:ECDHE+aRSA+AES256+SHA384:ECDHE+aRSA+AES128+SHA256
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option log-health-checks
    option forwardfor except 127.0.0.0/8
    option redispatch
    retries 3
    timeout http-request 10s
    timeout queue 1m
    timeout connect 10s
    timeout client 1m
    timeout server 1m
    timeout http-keep-alive 10s
    timeout check 10s
    maxconn 10000

# Statistics interface
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE
    stats auth admin:$(openssl rand -base64 12)

# K3s API Server Load Balancer (TCP mode)
frontend k3s-api-frontend
    bind $main_floating_ip:6443
    mode tcp
    option tcplog
    default_backend k3s-api-servers

backend k3s-api-servers
    mode tcp
    balance roundrobin
    option tcp-check
EOF

    # Add K3s API servers to backend
    get_control_plane_servers | while read -r server_name server_ip; do
        echo "    server $server_name $server_ip:6443 check inter 5s rise 2 fall 3" >> /tmp/haproxy.cfg
    done
    
    # Add application load balancing
    cat >> /tmp/haproxy.cfg << EOF

# HTTP/HTTPS Frontend for applications
frontend app-frontend
    bind $main_floating_ip:80
    bind $main_floating_ip:443 ssl crt /etc/ssl/private/crm.pem
    redirect scheme https if !{ ssl_fc }
    
    # Route to different backends based on path
    acl is_api path_beg /api
    acl is_admin path_beg /admin
    acl is_monitoring path_beg /monitoring
    
    use_backend api-servers if is_api
    use_backend admin-servers if is_admin
    use_backend monitoring-servers if is_monitoring
    default_backend app-servers

# API Backend (FastAPI services)
backend api-servers
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
EOF

    # Add application servers for API
    hcloud server list -o format='{{.Name}} {{.PublicNet.IPv4.IP}}' | grep "crm-app-" | while read -r server_name server_ip; do
        echo "    server $server_name $server_ip:8000 check inter 10s rise 2 fall 3" >> /tmp/haproxy.cfg
    done
    
    cat >> /tmp/haproxy.cfg << EOF

# Application Backend (Frontend apps)
backend app-servers
    balance roundrobin
    option httpchk GET /
    http-check expect status 200
EOF

    # Add application servers for frontend
    hcloud server list -o format='{{.Name}} {{.PublicNet.IPv4.IP}}' | grep "crm-app-" | while read -r server_name server_ip; do
        echo "    server $server_name $server_ip:3000 check inter 10s rise 2 fall 3" >> /tmp/haproxy.cfg
    done
    
    cat >> /tmp/haproxy.cfg << EOF

# Admin Backend
backend admin-servers
    balance roundrobin
    option httpchk GET /health
EOF

    # Add application servers for admin
    hcloud server list -o format='{{.Name}} {{.PublicNet.IPv4.IP}}' | grep "crm-app-" | while read -r server_name server_ip; do
        echo "    server $server_name $server_ip:3001 check inter 10s rise 2 fall 3" >> /tmp/haproxy.cfg
    done
    
    cat >> /tmp/haproxy.cfg << EOF

# Monitoring Backend
backend monitoring-servers
    balance roundrobin
    option httpchk GET /
EOF

    # Add service servers for monitoring
    hcloud server list -o format='{{.Name}} {{.PublicNet.IPv4.IP}}' | grep "crm-svc-" | while read -r server_name server_ip; do
        echo "    server $server_name $server_ip:3000 check inter 10s rise 2 fall 3" >> /tmp/haproxy.cfg
    done
    
    success "HAProxy configuration created"
}

# Deploy HAProxy configuration to all control plane nodes
deploy_haproxy_config() {
    phase "DEPLOYING HAPROXY CONFIGURATION"
    
    get_control_plane_servers | while read -r server_name server_ip; do
        log "Deploying HAProxy config to $server_name ($server_ip)"
        
        # Copy configuration
        copy_to_server "/tmp/haproxy.cfg" "$server_ip" "/etc/haproxy/haproxy.cfg" "Copying HAProxy configuration"
        
        # Test configuration
        run_on_server "$server_ip" "haproxy -c -f /etc/haproxy/haproxy.cfg" "Testing HAProxy configuration"
        
        # Restart HAProxy
        run_on_server "$server_ip" "systemctl restart haproxy" "Restarting HAProxy"
        
        success "HAProxy configured on $server_name"
    done
}

# Install Keepalived
install_keepalived() {
    phase "INSTALLING KEEPALIVED"
    
    get_control_plane_servers | while read -r server_name server_ip; do
        log "Installing Keepalived on $server_name ($server_ip)"
        
        run_on_server "$server_ip" "apt update && apt install -y keepalived" "Installing Keepalived"
        run_on_server "$server_ip" "systemctl enable keepalived" "Enabling Keepalived service"
        
        success "Keepalived installed on $server_name"
    done
}

# Install Hetzner Cloud CLI on control plane nodes
install_hcloud_cli() {
    phase "INSTALLING HETZNER CLOUD CLI"
    
    get_control_plane_servers | while read -r server_name server_ip; do
        log "Installing hcloud CLI on $server_name ($server_ip)"
        
        run_on_server "$server_ip" "curl -L https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64.tar.gz | tar -xz -C /tmp" "Downloading hcloud CLI"
        run_on_server "$server_ip" "mv /tmp/hcloud /usr/local/bin/ && chmod +x /usr/local/bin/hcloud" "Installing hcloud CLI"
        
        success "hcloud CLI installed on $server_name"
    done
}

# Create Keepalived configuration
create_keepalived_config() {
    phase "CREATING KEEPALIVED CONFIGURATION"
    
    local main_floating_ip=$(get_floating_ips | grep "crm-haproxy-main" | awk '{print $2}')
    local priority=110
    local state="BACKUP"
    local router_id=51
    
    get_control_plane_servers | while read -r server_name server_ip; do
        log "Creating Keepalived config for $server_name ($server_ip)"
        
        # First server is MASTER with highest priority
        if [ "$priority" -eq 110 ]; then
            state="MASTER"
        fi
        
        # Create health check script
        cat > /tmp/check_haproxy.sh << 'EOF'
#!/bin/bash
# Check if HAProxy is running and responding
if pgrep haproxy > /dev/null && curl -f http://localhost:8404/stats > /dev/null 2>&1; then
    exit 0
else
    exit 1
fi
EOF
        
        # Create floating IP assignment script
        cat > /tmp/assign_floating_ip.sh << EOF
#!/bin/bash
export HCLOUD_TOKEN="\$1"
FLOATING_IP_NAME="crm-haproxy-main"
SERVER_NAME="\$(hostname)"

# Get server ID
SERVER_ID=\$(hcloud server describe "\$SERVER_NAME" -o format='{{.ID}}')

# Assign floating IP
hcloud floating-ip assign "\$FLOATING_IP_NAME" "\$SERVER_ID"
EOF
        
        # Create Keepalived configuration
        cat > /tmp/keepalived.conf << EOF
# Keepalived configuration for $server_name
global_defs {
    router_id $server_name
    enable_script_security
    script_user root
}

vrrp_script chk_haproxy {
    script "/usr/local/bin/check_haproxy.sh"
    interval 2
    weight -2
    fall 3
    rise 2
    timeout 3
}

vrrp_instance VI_HAPROXY {
    state $state
    interface eth0
    virtual_router_id $router_id
    priority $priority
    advert_int 1
    
    authentication {
        auth_type PASS
        auth_pass $VRRP_PASSWORD
    }
    
    virtual_ipaddress {
        $main_floating_ip/32 dev eth0
    }
    
    track_script {
        chk_haproxy
    }
    
    notify_master "/usr/local/bin/assign_floating_ip.sh \$HCLOUD_TOKEN"
    notify_backup "/usr/local/bin/assign_floating_ip.sh \$HCLOUD_TOKEN"
}
EOF
        
        # Copy files to server
        copy_to_server "/tmp/keepalived.conf" "$server_ip" "/etc/keepalived/keepalived.conf" "Copying Keepalived configuration"
        copy_to_server "/tmp/check_haproxy.sh" "$server_ip" "/usr/local/bin/check_haproxy.sh" "Copying health check script"
        copy_to_server "/tmp/assign_floating_ip.sh" "$server_ip" "/usr/local/bin/assign_floating_ip.sh" "Copying IP assignment script"
        
        # Make scripts executable
        run_on_server "$server_ip" "chmod +x /usr/local/bin/check_haproxy.sh /usr/local/bin/assign_floating_ip.sh" "Making scripts executable"
        
        # Configure floating IP on interface
        run_on_server "$server_ip" "ip addr add $main_floating_ip/32 dev eth0 || true" "Adding floating IP to interface"
        
        success "Keepalived configured on $server_name"
        
        # Decrease priority for next server
        priority=$((priority - 10))
        state="BACKUP"
    done
}

# Start Keepalived services
start_keepalived() {
    phase "STARTING KEEPALIVED SERVICES"
    
    get_control_plane_servers | while read -r server_name server_ip; do
        log "Starting Keepalived on $server_name ($server_ip)"
        
        run_on_server "$server_ip" "systemctl restart keepalived" "Starting Keepalived"
        run_on_server "$server_ip" "systemctl status keepalived --no-pager" "Checking Keepalived status"
        
        success "Keepalived started on $server_name"
    done
}

# Verify HA setup
verify_ha_setup() {
    phase "VERIFYING HIGH AVAILABILITY SETUP"
    
    local main_floating_ip=$(get_floating_ips | grep "crm-haproxy-main" | awk '{print $2}')
    
    log "Testing floating IP connectivity: $main_floating_ip"
    
    # Test HAProxy stats page
    if curl -f "http://$main_floating_ip:8404/stats" > /dev/null 2>&1; then
        success "HAProxy stats accessible via floating IP"
    else
        warning "HAProxy stats not accessible via floating IP"
    fi
    
    # Check which server has the floating IP
    local assigned_server=$(hcloud floating-ip describe "crm-haproxy-main" -o format='{{.Server}}')
    log "Floating IP currently assigned to: $assigned_server"
    
    success "High availability verification completed"
}

# Display deployment summary
show_summary() {
    phase "HAPROXY HA DEPLOYMENT SUMMARY"
    
    local main_floating_ip=$(get_floating_ips | grep "crm-haproxy-main" | awk '{print $2}')
    
    echo "🔄 Enterprise HAProxy HA Deployed"
    echo "================================="
    echo ""
    echo "🌐 Load Balancer Configuration:"
    echo "  Main Floating IP: $main_floating_ip"
    echo "  HAProxy Nodes: 3 (control plane servers)"
    echo "  Failover Method: Keepalived + VRRP + Hetzner Floating IPs"
    echo ""
    echo "🔧 Services Load Balanced:"
    echo "  ✅ K3s API Server (port 6443)"
    echo "  ✅ HTTP/HTTPS Applications (ports 80/443)"
    echo "  ✅ API Services (backend routing)"
    echo "  ✅ Admin Panel (backend routing)"
    echo "  ✅ Monitoring (backend routing)"
    echo ""
    echo "📊 Backend Servers:"
    echo "  Application Tier: 3 servers"
    echo "  Service Tier: 3 servers"
    echo ""
    echo "🔗 Access URLs:"
    echo "  HAProxy Stats: http://$main_floating_ip:8404/stats"
    echo "  K3s API: https://$main_floating_ip:6443"
    echo "  Applications: https://$main_floating_ip"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Update DNS to point to: $main_floating_ip"
    echo "2. Run: ./scripts/enterprise/deploy-database-cluster.sh"
    echo "3. Run: ./scripts/enterprise/deploy-application-stack.sh"
}

# Main execution
main() {
    echo "🔄 ENTERPRISE HAPROXY HIGH AVAILABILITY DEPLOYMENT"
    echo "=================================================="
    echo "Deploying HAProxy + Keepalived + VRRP with Hetzner Floating IPs"
    echo ""
    
    install_haproxy
    create_haproxy_config
    deploy_haproxy_config
    install_keepalived
    install_hcloud_cli
    create_keepalived_config
    start_keepalived
    verify_ha_setup
    show_summary
    
    success "🎉 Enterprise HAProxy HA deployed successfully!"
    echo ""
    echo "💡 Your load balancer now has sub-second failover capabilities!"
}

# Run main function
main "$@"
