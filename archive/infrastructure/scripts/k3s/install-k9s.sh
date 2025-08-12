#!/bin/bash

# 🔍 K9s Installation Script for GardenOS
# Installs K9s terminal UI for Kubernetes cluster monitoring
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Configuration
K9S_VERSION="${K9S_VERSION:-latest}"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

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

# Detect OS and architecture
detect_platform() {
    local os arch
    
    case "$(uname -s)" in
        Linux*)
            os="Linux"
            ;;
        Darwin*)
            os="Darwin"
            ;;
        *)
            error "Unsupported operating system: $(uname -s)"
            ;;
    esac
    
    case "$(uname -m)" in
        x86_64|amd64)
            arch="amd64"
            ;;
        arm64|aarch64)
            arch="arm64"
            ;;
        armv7l)
            arch="arm"
            ;;
        *)
            error "Unsupported architecture: $(uname -m)"
            ;;
    esac
    
    echo "${os}_${arch}"
}

# Get latest version from GitHub API
get_latest_version() {
    if [[ "$K9S_VERSION" == "latest" ]]; then
        log "Fetching latest K9s version..."
        local version
        version=$(curl -s https://api.github.com/repos/derailed/k9s/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
        if [[ -z "$version" ]]; then
            error "Failed to fetch latest version"
        fi
        echo "$version"
    else
        echo "$K9S_VERSION"
    fi
}

# Download and install K9s
install_k9s() {
    local platform version download_url temp_dir
    
    platform=$(detect_platform)
    version=$(get_latest_version)
    
    log "Installing K9s $version for $platform..."
    
    # Create temporary directory
    temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT
    
    # Construct download URL
    download_url="https://github.com/derailed/k9s/releases/download/${version}/k9s_${platform}.tar.gz"
    
    log "Downloading from: $download_url"
    
    # Download and extract
    if ! curl -sL "$download_url" | tar -xz -C "$temp_dir"; then
        error "Failed to download or extract K9s"
    fi
    
    # Install binary
    if [[ ! -f "$temp_dir/k9s" ]]; then
        error "K9s binary not found in downloaded archive"
    fi
    
    log "Installing K9s to $INSTALL_DIR..."
    
    # Check if we need sudo
    if [[ -w "$INSTALL_DIR" ]]; then
        mv "$temp_dir/k9s" "$INSTALL_DIR/"
        chmod +x "$INSTALL_DIR/k9s"
    else
        sudo mv "$temp_dir/k9s" "$INSTALL_DIR/"
        sudo chmod +x "$INSTALL_DIR/k9s"
    fi
    
    log "K9s installed successfully!"
}

# Verify installation
verify_installation() {
    log "Verifying K9s installation..."
    
    if ! command -v k9s &> /dev/null; then
        error "K9s not found in PATH. Installation may have failed."
    fi
    
    local installed_version
    installed_version=$(k9s version --short 2>/dev/null | head -n1 || echo "unknown")
    
    log "K9s version: $installed_version"
    log "Installation path: $(which k9s)"
}

# Configure K9s
configure_k9s() {
    log "Configuring K9s..."
    
    # Create K9s config directory
    local config_dir="$HOME/.config/k9s"
    mkdir -p "$config_dir"
    
    # Create basic configuration
    cat > "$config_dir/config.yml" << 'EOF'
# K9s Configuration for GardenOS
k9s:
  # Refresh rate in milliseconds
  refreshRate: 2000
  
  # Max number of logs lines to display
  maxConnRetry: 5
  
  # Enable mouse support
  enableMouse: true
  
  # Headless mode (no header)
  headless: false
  
  # Logo less (no K9s logo)
  logoless: false
  
  # Crumb less (no breadcrumbs)
  crumbsless: false
  
  # Read only mode
  readOnly: false
  
  # No exit on ctrl-c
  noExitOnCtrlC: false
  
  # UI settings
  ui:
    # Enable icons
    enableMouse: true
    headless: false
    logoless: false
    crumbsless: false
    reactive: false
    noIcons: false
    
  # Skip latest revision check
  skipLatestRevCheck: false
  
  # Disable pod metrics collection
  disablePodCounting: false
  
  # Shell pod configuration
  shellPod:
    image: busybox:1.35.0
    namespace: default
    limits:
      cpu: 100m
      memory: 100Mi
EOF

    # Create skin configuration for better visibility
    cat > "$config_dir/skin.yml" << 'EOF'
# K9s Skin Configuration for GardenOS
k9s:
  body:
    fgColor: white
    bgColor: black
    logoColor: blue
  prompt:
    fgColor: white
    bgColor: black
    suggestColor: darkslategray
  info:
    fgColor: lightskyblue
    sectionColor: white
  dialog:
    fgColor: white
    bgColor: black
    buttonFgColor: black
    buttonBgColor: white
    buttonFocusFgColor: yellow
    buttonFocusBgColor: red
    labelFgColor: white
    fieldFgColor: white
  frame:
    border:
      fgColor: dodgerblue
      focusColor: lightskyblue
    menu:
      fgColor: white
      keyColor: dodgerblue
      numKeyColor: lightskyblue
    crumbs:
      fgColor: white
      bgColor: black
      activeColor: lightskyblue
    status:
      newColor: lightskyblue
      modifyColor: yellow
      addColor: green
      errorColor: red
      highlightcolor: orange
      killColor: mediumpurple
      completedColor: gray
    title:
      fgColor: white
      bgColor: black
      highlightColor: orange
      counterColor: lightskyblue
      filterColor: lightskyblue
  views:
    charts:
      bgColor: black
      defaultDialColors:
        - lightskyblue
        - red
      defaultChartColors:
        - lightskyblue
        - red
    table:
      fgColor: white
      bgColor: black
      cursorColor: lightskyblue
      markColor: darkslateblue
      header:
        fgColor: white
        bgColor: black
        sorterColor: orange
    xray:
      fgColor: white
      bgColor: black
      cursorColor: lightskyblue
      graphicColor: darkslateblue
      showIcons: false
    yaml:
      keyColor: dodgerblue
      colonColor: white
      valueColor: white
    logs:
      fgColor: white
      bgColor: black
      indicator:
        fgColor: white
        bgColor: black
EOF

    log "K9s configuration created at $config_dir"
}

# Show usage instructions
show_usage() {
    log "K9s Installation Complete!"
    echo
    echo -e "${BLUE}=== K9s Usage ===${NC}"
    echo "Launch K9s:"
    echo "  k9s"
    echo
    echo "Key shortcuts:"
    echo "  :nodes     - View cluster nodes"
    echo "  :pods      - View all pods"
    echo "  :svc       - View services"
    echo "  :deploy    - View deployments"
    echo "  :ns        - View namespaces"
    echo "  :pv        - View persistent volumes"
    echo "  :events    - View cluster events"
    echo "  q          - Quit current view"
    echo "  ?          - Help"
    echo "  /          - Filter resources"
    echo "  Ctrl+A     - Show all namespaces"
    echo
    echo -e "${BLUE}=== GardenOS Specific Views ===${NC}"
    echo "View nodes by role:"
    echo "  :nodes then / to filter by 'role=ai' or 'role=database'"
    echo
    echo "View workloads by tier:"
    echo "  :pods then / to filter by 'tier=application' or 'tier=system'"
    echo
    echo -e "${GREEN}K9s is ready for GardenOS cluster monitoring!${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        warn "kubectl not found. K9s requires kubectl to function properly."
        echo "Please install kubectl first:"
        echo "  curl -LO https://dl.k8s.io/release/\$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        echo "  sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl"
    fi
    
    # Check if kubeconfig exists
    if [[ ! -f "$HOME/.kube/config" ]]; then
        warn "Kubeconfig not found at ~/.kube/config"
        echo "Please copy your kubeconfig file:"
        echo "  scp root@your-k3s-server:/etc/rancher/k3s/k3s.yaml ~/.kube/config"
    fi
    
    # Check cluster connectivity
    if command -v kubectl &> /dev/null && [[ -f "$HOME/.kube/config" ]]; then
        if kubectl cluster-info &> /dev/null; then
            log "Kubernetes cluster connectivity verified"
        else
            warn "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        fi
    fi
}

# Main execution
main() {
    log "Starting K9s installation for GardenOS"
    
    check_prerequisites
    install_k9s
    verify_installation
    configure_k9s
    show_usage
}

# Run main function
main "$@"
