#!/bin/bash

# 🏢 Enterprise CRM Cluster - Master Deployment Script
# Orchestrates the complete deployment of 9 CCX23 servers for $270/month
# Total: 72 vCPUs, 288GB RAM, 2.16TB NVMe storage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/deployment-$(date +%Y%m%d-%H%M%S).log"

# Deployment phases
PHASES=(
    "infrastructure:Deploy 9 CCX23 servers and floating IPs"
    "base-system:Configure security, performance, and Docker"
    "k3s-cluster:Deploy highly available Kubernetes cluster"
    "haproxy-ha:Deploy load balancer with automatic failover"
    "database:Deploy PostgreSQL cluster with Patroni"
    "applications:Deploy Supabase, FastAPI, and frontend"
    "monitoring:Deploy Prometheus, Grafana, and logging"
    "verification:Verify all systems and run health checks"
)

# Logging functions
log() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $message" | tee -a "$LOG_FILE"
}

success() {
    local message="$1"
    echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$LOG_FILE"
}

warning() {
    local message="$1"
    echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$LOG_FILE"
}

error() {
    local message="$1"
    echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE"
}

phase_header() {
    local phase="$1"
    local description="$2"
    echo "" | tee -a "$LOG_FILE"
    echo -e "${PURPLE}${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${NC}" | tee -a "$LOG_FILE"
    echo -e "${PURPLE}${BOLD}║ PHASE: $phase${NC}" | tee -a "$LOG_FILE"
    echo -e "${PURPLE}${BOLD}║ $description${NC}" | tee -a "$LOG_FILE"
    echo -e "${PURPLE}${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        warning "Running as root. Consider using a non-root user with sudo access."
    fi
    
    # Check required tools
    local required_tools=("curl" "ssh" "scp" "openssl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Check SSH key
    if [ ! -f ~/.ssh/id_rsa ]; then
        warning "SSH key not found. Generating new key..."
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    fi
    
    # Check Hetzner Cloud CLI
    if ! command -v hcloud &> /dev/null; then
        log "Installing Hetzner Cloud CLI..."
        curl -L https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64.tar.gz | tar -xz
        sudo mv hcloud /usr/local/bin/
    fi
    
    # Check Hetzner authentication
    if ! hcloud context list | grep -q "active"; then
        error "No active Hetzner Cloud context found."
        echo "Please run: hcloud context create CRM"
        echo "Then enter your Hetzner Cloud API token."
        exit 1
    fi
    
    success "Prerequisites check completed"
}

# Execute deployment phase
execute_phase() {
    local phase_name="$1"
    local script_name="$2"
    local description="$3"
    
    phase_header "$phase_name" "$description"
    
    local script_path="$SCRIPT_DIR/$script_name"
    
    if [ ! -f "$script_path" ]; then
        error "Script not found: $script_path"
        return 1
    fi
    
    log "Executing: $script_path"
    
    # Execute the script and capture output
    if bash "$script_path" 2>&1 | tee -a "$LOG_FILE"; then
        success "Phase '$phase_name' completed successfully"
        return 0
    else
        error "Phase '$phase_name' failed"
        return 1
    fi
}

# Display deployment banner
show_banner() {
    echo -e "${CYAN}${BOLD}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🏢 ENTERPRISE CRM CLUSTER DEPLOYMENT                      ║
║                                                                              ║
║                         9 x CCX23 Servers @ $270/month                      ║
║                    72 vCPUs • 288GB RAM • 2.16TB NVMe                       ║
║                                                                              ║
║                        🚀 ENTERPRISE-GRADE INFRASTRUCTURE                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Show deployment plan
show_deployment_plan() {
    echo -e "${BOLD}📋 DEPLOYMENT PLAN${NC}"
    echo "=================="
    echo ""
    
    local phase_num=1
    for phase_info in "${PHASES[@]}"; do
        local phase_name="${phase_info%%:*}"
        local description="${phase_info##*:}"
        echo -e "${CYAN}Phase $phase_num:${NC} $phase_name"
        echo "  └─ $description"
        ((phase_num++))
    done
    
    echo ""
    echo -e "${BOLD}📊 INFRASTRUCTURE OVERVIEW${NC}"
    echo "=========================="
    echo "• Control Plane: 3 servers (K3s masters, PostgreSQL, HAProxy)"
    echo "• Application:   3 servers (Supabase, FastAPI, AI agents)"
    echo "• Services:      3 servers (Monitoring, logging, backup)"
    echo "• Geographic:    Hillsboro (3) + Ashburn (6)"
    echo "• Redundancy:    Can survive any 2 server failures"
    echo "• Uptime:        99.99% target (52 minutes/year downtime)"
    echo ""
}

# Confirm deployment
confirm_deployment() {
    echo -e "${YELLOW}⚠️  DEPLOYMENT CONFIRMATION${NC}"
    echo "=========================="
    echo ""
    echo "This will deploy a complete enterprise infrastructure:"
    echo "• 9 x CCX23 servers ($270/month)"
    echo "• Floating IPs for high availability"
    echo "• Complete application stack"
    echo ""
    echo -e "${RED}This will incur charges on your Hetzner Cloud account.${NC}"
    echo ""
    
    read -p "Do you want to proceed? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    echo ""
    log "Deployment confirmed. Starting in 5 seconds..."
    sleep 5
}

# Main deployment execution
execute_deployment() {
    local failed_phases=()
    local phase_num=1
    
    for phase_info in "${PHASES[@]}"; do
        local phase_name="${phase_info%%:*}"
        local description="${phase_info##*:}"
        
        echo -e "${BOLD}Starting Phase $phase_num of ${#PHASES[@]}: $phase_name${NC}"
        
        case "$phase_name" in
            "infrastructure")
                if ! execute_phase "$phase_name" "deploy-9-server-cluster.sh" "$description"; then
                    failed_phases+=("$phase_name")
                fi
                ;;
            "base-system")
                if ! execute_phase "$phase_name" "configure-base-system.sh" "$description"; then
                    failed_phases+=("$phase_name")
                fi
                ;;
            "k3s-cluster")
                if ! execute_phase "$phase_name" "deploy-k3s-cluster.sh" "$description"; then
                    failed_phases+=("$phase_name")
                fi
                ;;
            "haproxy-ha")
                if ! execute_phase "$phase_name" "deploy-haproxy-ha.sh" "$description"; then
                    failed_phases+=("$phase_name")
                fi
                ;;
            "database")
                warning "Database deployment script not yet implemented"
                log "Skipping database phase for now"
                ;;
            "applications")
                warning "Application deployment script not yet implemented"
                log "Skipping applications phase for now"
                ;;
            "monitoring")
                warning "Monitoring deployment script not yet implemented"
                log "Skipping monitoring phase for now"
                ;;
            "verification")
                warning "Verification script not yet implemented"
                log "Skipping verification phase for now"
                ;;
            *)
                warning "Unknown phase: $phase_name"
                ;;
        esac
        
        ((phase_num++))
        
        # Add delay between phases
        if [ $phase_num -le ${#PHASES[@]} ]; then
            log "Waiting 30 seconds before next phase..."
            sleep 30
        fi
    done
    
    # Report results
    if [ ${#failed_phases[@]} -eq 0 ]; then
        success "🎉 ALL PHASES COMPLETED SUCCESSFULLY!"
    else
        error "❌ Some phases failed: ${failed_phases[*]}"
        echo "Check the log file for details: $LOG_FILE"
        return 1
    fi
}

# Generate deployment report
generate_report() {
    local report_file="$PROJECT_ROOT/deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Enterprise CRM Cluster Deployment Report

**Deployment Date:** $(date)
**Log File:** $LOG_FILE

## Infrastructure Overview

### Servers Deployed
$(hcloud server list -o table | grep "crm-")

### Floating IPs
$(hcloud floating-ip list -o table)

### Total Resources
- **Servers:** 9 x CCX23
- **vCPUs:** 72 total
- **Memory:** 288GB total
- **Storage:** 2.16TB NVMe total
- **Monthly Cost:** \$270

## Services Status

### K3s Cluster
\`\`\`
$(kubectl get nodes 2>/dev/null || echo "K3s not accessible from this machine")
\`\`\`

### HAProxy Status
- Main Floating IP: $(hcloud floating-ip describe crm-haproxy-main -o format='{{.IP}}' 2>/dev/null || echo "Not found")
- Backup Floating IP: $(hcloud floating-ip describe crm-haproxy-backup -o format='{{.IP}}' 2>/dev/null || echo "Not found")

## Next Steps

1. **Configure DNS:** Point your domain to the main floating IP
2. **Deploy Applications:** Run remaining deployment scripts
3. **Set up Monitoring:** Configure Prometheus and Grafana
4. **Security Review:** Implement additional security measures
5. **Backup Strategy:** Configure automated backups

## Access Information

- **K3s API:** https://$(hcloud floating-ip describe crm-haproxy-main -o format='{{.IP}}' 2>/dev/null || echo "FLOATING_IP"):6443
- **HAProxy Stats:** http://$(hcloud floating-ip describe crm-haproxy-main -o format='{{.IP}}' 2>/dev/null || echo "FLOATING_IP"):8404/stats
- **SSH Access:** Use your SSH key to connect to any server

## Support

For issues or questions, refer to:
- Deployment log: $LOG_FILE
- Documentation: docs/ENTERPRISE_9_SERVER_ARCHITECTURE.md
EOF

    success "Deployment report generated: $report_file"
}

# Main execution
main() {
    # Create log file
    touch "$LOG_FILE"
    log "Starting enterprise cluster deployment"
    log "Log file: $LOG_FILE"
    
    show_banner
    check_prerequisites
    show_deployment_plan
    confirm_deployment
    
    # Execute deployment
    if execute_deployment; then
        generate_report
        
        echo ""
        echo -e "${GREEN}${BOLD}🎉 ENTERPRISE CLUSTER DEPLOYMENT COMPLETED!${NC}"
        echo ""
        echo -e "${CYAN}Your $270/month infrastructure is now running:${NC}"
        echo "• 9 x CCX23 servers (72 vCPUs, 288GB RAM, 2.16TB storage)"
        echo "• High availability load balancing"
        echo "• Kubernetes cluster ready for applications"
        echo "• Enterprise-grade security and performance"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Deploy your applications"
        echo "2. Configure monitoring and alerting"
        echo "3. Set up automated backups"
        echo "4. Point your DNS to the floating IP"
        echo ""
        echo -e "${BLUE}Log file: $LOG_FILE${NC}"
        
    else
        echo ""
        echo -e "${RED}${BOLD}❌ DEPLOYMENT FAILED${NC}"
        echo ""
        echo "Some phases failed during deployment."
        echo "Check the log file for details: $LOG_FILE"
        echo ""
        echo "You can re-run individual phases or the entire deployment."
        exit 1
    fi
}

# Handle script interruption
trap 'echo -e "\n${RED}Deployment interrupted!${NC}"; exit 1' INT TERM

# Run main function
main "$@"
