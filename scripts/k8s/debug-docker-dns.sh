#!/bin/bash

# 🔍 Comprehensive Docker DNS Resolution Debugging Script
# Diagnoses and fixes Docker build DNS resolution issues on Ubuntu 24.04
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Source common utilities
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Main debugging function
main() {
    print_header "Docker DNS Resolution Debugging" "Comprehensive diagnosis of Docker build DNS issues"
    
    section "Phase 1: Host System DNS Analysis"
    check_host_dns_configuration
    
    section "Phase 2: Docker Daemon Configuration"
    check_docker_daemon_config
    
    section "Phase 3: Network Connectivity Tests"
    test_network_connectivity
    
    section "Phase 4: Docker Build DNS Tests"
    test_docker_build_dns
    
    section "Phase 5: systemd-resolved Analysis"
    check_systemd_resolved
    
    section "Phase 6: Root Cause Analysis"
    analyze_root_cause
    
    print_footer "Docker DNS Resolution Debugging"
}

# Check host system DNS configuration
check_host_dns_configuration() {
    log "Analyzing host DNS configuration..."
    
    echo "=== /etc/resolv.conf ==="
    cat /etc/resolv.conf || warn "Cannot read /etc/resolv.conf"
    
    echo ""
    echo "=== /etc/resolv.conf symlink target ==="
    ls -la /etc/resolv.conf || warn "Cannot check symlink"
    
    echo ""
    echo "=== Host DNS resolution test ==="
    nslookup google.com || warn "Host DNS resolution failed"
    
    echo ""
    echo "=== Host ping test ==="
    ping -c 2 8.8.8.8 || warn "Host ping to 8.8.8.8 failed"
    
    echo ""
    echo "=== systemd-resolved status ==="
    systemctl status systemd-resolved --no-pager || warn "systemd-resolved status check failed"
}

# Check Docker daemon configuration
check_docker_daemon_config() {
    log "Analyzing Docker daemon configuration..."
    
    echo "=== Docker daemon.json ==="
    if [[ -f /etc/docker/daemon.json ]]; then
        cat /etc/docker/daemon.json
    else
        warn "No /etc/docker/daemon.json found"
    fi
    
    echo ""
    echo "=== Docker info (DNS-related) ==="
    if docker info | grep -i dns 2>/dev/null; then
        success "Docker info accessible"
    elif sudo docker info | grep -i dns 2>/dev/null; then
        warn "Docker info accessible (with sudo) - user needs docker group activation"
    else
        warn "No DNS info in docker info"
    fi

    echo ""
    echo "=== Docker version ==="
    if docker version --format '{{.Server.Version}}' 2>/dev/null; then
        success "Docker version accessible"
    elif sudo docker version --format '{{.Server.Version}}' 2>/dev/null; then
        warn "Docker version accessible (with sudo) - user needs docker group activation"
    else
        warn "Cannot get Docker version"
    fi
    
    echo ""
    echo "=== Docker daemon logs (last 20 lines) ==="
    journalctl -u docker --no-pager -n 20 || warn "Cannot read Docker daemon logs"
}

# Test network connectivity
test_network_connectivity() {
    log "Testing network connectivity..."
    
    echo "=== Test external DNS servers ==="
    for dns in "8.8.8.8" "1.1.1.1" "208.67.222.222"; do
        if ping -c 1 -W 3 "$dns" &>/dev/null; then
            success "Can reach $dns"
        else
            error "Cannot reach $dns"
        fi
    done
    
    echo ""
    echo "=== Test DNS resolution ==="
    for domain in "google.com" "pypi.org" "deb.debian.org" "archive.ubuntu.com"; do
        if nslookup "$domain" &>/dev/null; then
            success "Can resolve $domain"
        else
            error "Cannot resolve $domain"
        fi
    done
    
    echo ""
    echo "=== Network interfaces ==="
    ip addr show | grep -E "(inet |docker|br-)" || warn "Network interface check failed"
}

# Test Docker build DNS
test_docker_build_dns() {
    log "Testing Docker build DNS resolution..."
    
    echo "=== Create test Dockerfile ==="
    cat > /tmp/test-dns-dockerfile << 'EOF'
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y curl
RUN curl -s http://google.com || echo "DNS resolution failed"
EOF
    
    echo ""
    echo "=== Test Docker build with default settings ==="
    if docker build -t test-dns-default -f /tmp/test-dns-dockerfile /tmp &>/dev/null; then
        success "Docker build with default DNS: SUCCESS"
    elif sudo docker build -t test-dns-default -f /tmp/test-dns-dockerfile /tmp &>/dev/null; then
        warn "Docker build with default DNS: SUCCESS (with sudo)"
    else
        error "Docker build with default DNS: FAILED"
    fi

    echo ""
    echo "=== Test Docker build with explicit DNS ==="
    if docker build --dns=8.8.8.8 -t test-dns-explicit -f /tmp/test-dns-dockerfile /tmp &>/dev/null; then
        success "Docker build with explicit DNS: SUCCESS"
    elif sudo docker build --dns=8.8.8.8 -t test-dns-explicit -f /tmp/test-dns-dockerfile /tmp &>/dev/null; then
        warn "Docker build with explicit DNS: SUCCESS (with sudo)"
    else
        error "Docker build with explicit DNS: FAILED"
    fi

    echo ""
    echo "=== Test Docker build with host network ==="
    if docker build --network=host -t test-dns-host -f /tmp/test-dns-dockerfile /tmp &>/dev/null; then
        success "Docker build with host network: SUCCESS"
    elif sudo docker build --network=host -t test-dns-host -f /tmp/test-dns-dockerfile /tmp &>/dev/null; then
        warn "Docker build with host network: SUCCESS (with sudo)"
    else
        error "Docker build with host network: FAILED"
    fi

    # Cleanup
    docker rmi test-dns-default test-dns-explicit test-dns-host &>/dev/null || sudo docker rmi test-dns-default test-dns-explicit test-dns-host &>/dev/null || true
    rm -f /tmp/test-dns-dockerfile
}

# Check systemd-resolved
check_systemd_resolved() {
    log "Analyzing systemd-resolved configuration..."
    
    echo "=== systemd-resolved configuration ==="
    cat /etc/systemd/resolved.conf || warn "Cannot read resolved.conf"
    
    echo ""
    echo "=== systemd-resolved runtime status ==="
    systemd-resolve --status || resolvectl status || warn "Cannot get resolved status"
    
    echo ""
    echo "=== Check if 127.0.0.53 is in use ==="
    if grep -q "127.0.0.53" /etc/resolv.conf; then
        warn "systemd-resolved stub resolver (127.0.0.53) detected"
        echo "This is likely the root cause of Docker DNS issues"
    else
        success "No systemd-resolved stub resolver detected"
    fi
}

# Analyze root cause and provide recommendations
analyze_root_cause() {
    log "Performing root cause analysis..."
    
    local issues_found=0
    
    echo "=== Root Cause Analysis ==="
    
    # Check for systemd-resolved stub
    if grep -q "127.0.0.53" /etc/resolv.conf; then
        error "ISSUE 1: systemd-resolved stub resolver detected"
        echo "  - Docker containers cannot use 127.0.0.53 for DNS resolution"
        echo "  - This is the most common cause of Docker build DNS failures"
        ((issues_found++))
    fi
    
    # Check for missing daemon.json
    if [[ ! -f /etc/docker/daemon.json ]]; then
        error "ISSUE 2: No Docker daemon.json configuration"
        echo "  - Docker is using default DNS settings"
        echo "  - Need to configure explicit DNS servers"
        ((issues_found++))
    fi
    
    # Check network connectivity
    if ! ping -c 1 8.8.8.8 &>/dev/null; then
        error "ISSUE 3: No external network connectivity"
        echo "  - Cannot reach external DNS servers"
        echo "  - Check firewall and network configuration"
        ((issues_found++))
    fi
    
    echo ""
    if [[ $issues_found -eq 0 ]]; then
        success "No obvious issues detected - DNS should be working"
    else
        warn "Found $issues_found potential issues"
        echo ""
        echo "=== RECOMMENDED SOLUTIONS ==="
        echo "1. Configure Docker daemon DNS: ./scripts/k8s/debug-docker-dns.sh fix-daemon"
        echo "2. Fix systemd-resolved: ./scripts/k8s/debug-docker-dns.sh fix-resolved"
        echo "3. Apply comprehensive fix: ./scripts/k8s/debug-docker-dns.sh fix-all"
    fi
}

# Fix Docker daemon DNS configuration
fix_docker_daemon_dns() {
    log "Fixing Docker daemon DNS configuration..."

    # Backup existing daemon.json
    if [[ -f /etc/docker/daemon.json ]]; then
        sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
        success "Backed up existing daemon.json"
    fi

    # Create new daemon.json with proper DNS
    sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
    "dns": ["8.8.8.8", "1.1.1.1", "208.67.222.222"],
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

    success "Created new Docker daemon.json with DNS configuration"

    # Restart Docker daemon
    log "Restarting Docker daemon..."
    sudo systemctl restart docker
    sleep 5

    if systemctl is-active --quiet docker; then
        success "Docker daemon restarted successfully"
    else
        error "Docker daemon failed to restart"
        return 1
    fi
}

# Fix systemd-resolved configuration
fix_systemd_resolved() {
    log "Fixing systemd-resolved configuration..."

    # Backup existing resolved.conf
    sudo cp /etc/systemd/resolved.conf /etc/systemd/resolved.conf.backup
    success "Backed up existing resolved.conf"

    # Configure systemd-resolved with proper DNS
    sudo tee /etc/systemd/resolved.conf > /dev/null << 'EOF'
[Resolve]
DNS=8.8.8.8 1.1.1.1
FallbackDNS=208.67.222.222 208.67.220.220
Domains=~.
DNSSEC=no
DNSOverTLS=no
Cache=yes
DNSStubListener=no
EOF

    success "Updated systemd-resolved configuration"

    # Restart systemd-resolved
    log "Restarting systemd-resolved..."
    sudo systemctl restart systemd-resolved
    sleep 3

    # Fix /etc/resolv.conf
    log "Fixing /etc/resolv.conf..."
    sudo rm -f /etc/resolv.conf
    sudo ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf

    success "Fixed /etc/resolv.conf symlink"
}

# Apply all fixes
fix_all_issues() {
    log "Applying comprehensive DNS fixes..."

    fix_systemd_resolved
    echo ""
    fix_docker_daemon_dns
    echo ""

    log "Testing fixes..."
    sleep 5

    # Test DNS resolution
    if nslookup google.com &>/dev/null; then
        success "Host DNS resolution: WORKING"
    else
        error "Host DNS resolution: STILL FAILING"
    fi

    # Test Docker DNS
    if docker run --rm alpine nslookup google.com &>/dev/null; then
        success "Docker DNS resolution: WORKING"
    elif sudo docker run --rm alpine nslookup google.com &>/dev/null; then
        warn "Docker DNS resolution: WORKING (with sudo)"
        warn "User needs to log out and back in to activate docker group membership"
        echo "  Current groups: $(groups)"
        echo "  Docker group membership: $(getent group docker)"
        echo "  Solution: Log out and back in, or run: newgrp docker"
    else
        error "Docker DNS resolution: STILL FAILING"
    fi

    success "All fixes applied! Try building Docker images now."
}

# Handle command line arguments
case "${1:-debug}" in
    "debug")
        main
        ;;
    "fix-daemon")
        fix_docker_daemon_dns
        ;;
    "fix-resolved")
        fix_systemd_resolved
        ;;
    "fix-all")
        fix_all_issues
        ;;
    *)
        echo "Usage: $0 {debug|fix-daemon|fix-resolved|fix-all}"
        echo "  debug       - Run comprehensive DNS debugging (default)"
        echo "  fix-daemon  - Fix Docker daemon DNS configuration"
        echo "  fix-resolved - Fix systemd-resolved configuration"
        echo "  fix-all     - Apply all fixes"
        exit 1
        ;;
esac
