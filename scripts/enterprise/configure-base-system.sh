#!/bin/bash

# 🔧 Enterprise Base System Configuration
# Configures all 9 servers with security, performance, and monitoring basics

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
INVENTORY_FILE="$PROJECT_ROOT/inventory/enterprise/hosts.yml"

# Get all server IPs
get_server_ips() {
    hcloud server list -o format='{{.Name}} {{.PublicNet.IPv4.IP}}' | grep "^crm-"
}

# Logging functions
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
phase() { echo -e "${PURPLE}[PHASE]${NC} $1"; echo "=================================="; }

# Execute command on all servers
run_on_all_servers() {
    local command="$1"
    local description="$2"
    
    log "$description"
    
    while read -r server_name server_ip; do
        if [ -n "$server_ip" ] && [ "$server_ip" != "TBD" ]; then
            log "Executing on $server_name ($server_ip): $command"
            ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@"$server_ip" "$command" || {
                warning "Failed to execute on $server_name"
                continue
            }
        fi
    done < <(get_server_ips)
}

# Execute command on specific server tier
run_on_tier() {
    local tier="$1"
    local command="$2"
    local description="$3"
    
    log "$description (tier: $tier)"
    
    while read -r server_name server_ip; do
        if [[ "$server_name" == *"$tier"* ]] && [ -n "$server_ip" ] && [ "$server_ip" != "TBD" ]; then
            log "Executing on $server_name ($server_ip): $command"
            ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@"$server_ip" "$command" || {
                warning "Failed to execute on $server_name"
                continue
            }
        fi
    done < <(get_server_ips)
}

# Copy file to all servers
copy_to_all_servers() {
    local local_file="$1"
    local remote_path="$2"
    local description="$3"
    
    log "$description"
    
    while read -r server_name server_ip; do
        if [ -n "$server_ip" ] && [ "$server_ip" != "TBD" ]; then
            log "Copying to $server_name ($server_ip): $local_file -> $remote_path"
            scp -o StrictHostKeyChecking=no "$local_file" root@"$server_ip":"$remote_path" || {
                warning "Failed to copy to $server_name"
                continue
            }
        fi
    done < <(get_server_ips)
}

# Update all systems
update_systems() {
    phase "UPDATING ALL SYSTEMS"
    
    run_on_all_servers "apt update && apt upgrade -y" "Updating package repositories and upgrading systems"
    success "All systems updated"
}

# Install essential packages
install_essential_packages() {
    phase "INSTALLING ESSENTIAL PACKAGES"
    
    local packages=(
        "curl"
        "wget" 
        "git"
        "htop"
        "iotop"
        "netstat-tools"
        "unzip"
        "jq"
        "vim"
        "tmux"
        "fail2ban"
        "ufw"
        "ntp"
        "rsync"
        "lsof"
        "tcpdump"
        "iftop"
        "dstat"
        "tree"
        "ncdu"
    )
    
    local package_list=$(IFS=' '; echo "${packages[*]}")
    run_on_all_servers "apt install -y $package_list" "Installing essential packages"
    success "Essential packages installed"
}

# Configure security settings
configure_security() {
    phase "CONFIGURING SECURITY SETTINGS"
    
    # Configure UFW firewall
    log "Configuring UFW firewall..."
    run_on_all_servers "ufw --force reset" "Resetting UFW firewall"
    run_on_all_servers "ufw default deny incoming" "Setting default deny incoming"
    run_on_all_servers "ufw default allow outgoing" "Setting default allow outgoing"
    run_on_all_servers "ufw allow ssh" "Allowing SSH"
    run_on_all_servers "ufw allow 80/tcp" "Allowing HTTP"
    run_on_all_servers "ufw allow 443/tcp" "Allowing HTTPS"
    run_on_all_servers "ufw allow 6443/tcp" "Allowing K3s API"
    run_on_all_servers "ufw allow 2379:2380/tcp" "Allowing etcd"
    run_on_all_servers "ufw allow 10250/tcp" "Allowing kubelet"
    run_on_all_servers "ufw --force enable" "Enabling UFW firewall"
    
    # Configure fail2ban
    log "Configuring fail2ban..."
    run_on_all_servers "systemctl enable fail2ban && systemctl start fail2ban" "Starting fail2ban"
    
    # Disable root password login
    log "Securing SSH configuration..."
    run_on_all_servers "sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config" "Disabling password authentication"
    run_on_all_servers "sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config" "Securing root login"
    run_on_all_servers "systemctl reload sshd" "Reloading SSH configuration"
    
    success "Security settings configured"
}

# Configure performance settings
configure_performance() {
    phase "CONFIGURING PERFORMANCE SETTINGS"
    
    # Create performance tuning script
    cat > /tmp/performance-tuning.sh << 'EOF'
#!/bin/bash

# Kernel parameters for high performance
cat >> /etc/sysctl.conf << 'SYSCTL'

# Network performance tuning
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr

# File system performance
fs.file-max = 2097152
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# Security
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
SYSCTL

# Apply settings
sysctl -p

# Configure limits
cat >> /etc/security/limits.conf << 'LIMITS'
* soft nofile 1048576
* hard nofile 1048576
* soft nproc 1048576
* hard nproc 1048576
root soft nofile 1048576
root hard nofile 1048576
root soft nproc 1048576
root hard nproc 1048576
LIMITS

# Configure systemd limits
mkdir -p /etc/systemd/system.conf.d
cat > /etc/systemd/system.conf.d/limits.conf << 'SYSTEMD'
[Manager]
DefaultLimitNOFILE=1048576
DefaultLimitNPROC=1048576
SYSTEMD

echo "Performance tuning applied"
EOF

    copy_to_all_servers "/tmp/performance-tuning.sh" "/tmp/performance-tuning.sh" "Copying performance tuning script"
    run_on_all_servers "chmod +x /tmp/performance-tuning.sh && /tmp/performance-tuning.sh" "Applying performance tuning"
    
    success "Performance settings configured"
}

# Install Docker
install_docker() {
    phase "INSTALLING DOCKER ON ALL SERVERS"
    
    # Create Docker installation script
    cat > /tmp/install-docker.sh << 'EOF'
#!/bin/bash

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Configure Docker daemon
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'DOCKER'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "exec-opts": ["native.cgroupdriver=systemd"],
  "live-restore": true,
  "userland-proxy": false,
  "experimental": false
}
DOCKER

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "Docker installation completed"
EOF

    copy_to_all_servers "/tmp/install-docker.sh" "/tmp/install-docker.sh" "Copying Docker installation script"
    run_on_all_servers "chmod +x /tmp/install-docker.sh && /tmp/install-docker.sh" "Installing Docker"
    
    success "Docker installed on all servers"
}

# Configure NTP
configure_ntp() {
    phase "CONFIGURING TIME SYNCHRONIZATION"
    
    run_on_all_servers "timedatectl set-timezone UTC" "Setting timezone to UTC"
    run_on_all_servers "systemctl enable ntp && systemctl start ntp" "Starting NTP service"
    
    success "Time synchronization configured"
}

# Create monitoring user
create_monitoring_user() {
    phase "CREATING MONITORING USER"
    
    run_on_all_servers "useradd -r -s /bin/false prometheus || true" "Creating prometheus user"
    run_on_all_servers "mkdir -p /var/lib/prometheus /etc/prometheus" "Creating prometheus directories"
    run_on_all_servers "chown prometheus:prometheus /var/lib/prometheus /etc/prometheus" "Setting prometheus permissions"
    
    success "Monitoring user created"
}

# Install node exporter for monitoring
install_node_exporter() {
    phase "INSTALLING NODE EXPORTER FOR MONITORING"
    
    cat > /tmp/install-node-exporter.sh << 'EOF'
#!/bin/bash

# Download and install node exporter
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
cp node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
chown prometheus:prometheus /usr/local/bin/node_exporter

# Create systemd service
cat > /etc/systemd/system/node_exporter.service << 'SERVICE'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
SERVICE

# Start and enable service
systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter

echo "Node exporter installed and started"
EOF

    copy_to_all_servers "/tmp/install-node-exporter.sh" "/tmp/install-node-exporter.sh" "Copying node exporter installation script"
    run_on_all_servers "chmod +x /tmp/install-node-exporter.sh && /tmp/install-node-exporter.sh" "Installing node exporter"
    run_on_all_servers "ufw allow 9100/tcp" "Opening node exporter port"
    
    success "Node exporter installed on all servers"
}

# Display configuration summary
show_summary() {
    phase "CONFIGURATION SUMMARY"
    
    echo "🔧 Base System Configuration Complete"
    echo "====================================="
    echo ""
    echo "✅ Security:"
    echo "  - UFW firewall configured"
    echo "  - fail2ban enabled"
    echo "  - SSH hardened"
    echo ""
    echo "✅ Performance:"
    echo "  - Kernel parameters optimized"
    echo "  - File limits increased"
    echo "  - Network tuning applied"
    echo ""
    echo "✅ Software:"
    echo "  - Docker installed"
    echo "  - Essential packages installed"
    echo "  - Node exporter for monitoring"
    echo ""
    echo "✅ System:"
    echo "  - NTP synchronized"
    echo "  - Monitoring user created"
    echo "  - All systems updated"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Run: ./scripts/enterprise/deploy-k3s-cluster.sh"
    echo "2. Run: ./scripts/enterprise/deploy-database-cluster.sh"
    echo "3. Run: ./scripts/enterprise/deploy-haproxy-ha.sh"
}

# Main execution
main() {
    echo "🔧 ENTERPRISE BASE SYSTEM CONFIGURATION"
    echo "========================================"
    echo "Configuring all 9 CCX23 servers for production use"
    echo ""
    
    if [ ! -f "$INVENTORY_FILE" ]; then
        error "Inventory file not found: $INVENTORY_FILE"
        echo "Please run deploy-9-server-cluster.sh first"
        exit 1
    fi
    
    update_systems
    install_essential_packages
    configure_security
    configure_performance
    install_docker
    configure_ntp
    create_monitoring_user
    install_node_exporter
    show_summary
    
    success "🎉 Base system configuration completed successfully!"
    echo ""
    echo "💡 All 9 servers are now hardened and ready for service deployment!"
}

# Run main function
main "$@"
