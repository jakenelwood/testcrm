#!/bin/bash

# 🚀 Complete GardenOS Deployment Script
# Deploys the entire CRM system from scratch to production K3s cluster
# No data migration needed - clean deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

success() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

# Display banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 GardenOS CRM Deployment                ║"
    echo "║                                                              ║"
    echo "║  Complete production deployment to K3s cluster              ║"
    echo "║  • High Availability PostgreSQL with Patroni                ║"
    echo "║  • Supabase Authentication & REST API                       ║"
    echo "║  • FastAPI Backend with AI Orchestration                    ║"
    echo "║  • Prometheus + Grafana Monitoring                          ║"
    echo "║  • NGINX Ingress with SSL                                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if we're on the Hetzner server or need to SSH
check_environment() {
    log "Checking deployment environment..."
    
    if command -v kubectl &> /dev/null; then
        info "kubectl found locally - deploying directly"
        DEPLOY_MODE="local"
    else
        info "kubectl not found - will deploy via SSH to Hetzner"
        DEPLOY_MODE="remote"
        
        # Check SSH connectivity
        if ! ssh -o ConnectTimeout=5 root@5.78.103.224 "echo 'SSH connection successful'" &> /dev/null; then
            error "Cannot connect to Hetzner server. Please check SSH connectivity."
        fi
        success "SSH connectivity to Hetzner confirmed"
    fi
}

# Execute command locally or remotely
execute_cmd() {
    local cmd="$1"
    local description="$2"
    
    info "$description"
    
    if [[ "$DEPLOY_MODE" == "local" ]]; then
        eval "$cmd"
    else
        ssh root@5.78.103.224 "$cmd"
    fi
}

# Phase 1: Verify Infrastructure
verify_infrastructure() {
    log "Phase 1: Verifying Infrastructure"
    
    # Check K3s cluster
    info "Checking K3s cluster status..."
    execute_cmd "kubectl get nodes" "Getting cluster nodes"
    
    # Check PostgreSQL cluster
    info "Checking PostgreSQL cluster..."
    execute_cmd "kubectl get pods -n postgres-cluster" "Getting PostgreSQL pods"
    
    # Check etcd cluster
    info "Checking etcd cluster health..."
    execute_cmd "kubectl exec -n postgres-cluster postgres-0 -- patronictl list" "Getting Patroni cluster status"
    
    success "Infrastructure verification complete"
}

# Phase 2: Deploy Core Services
deploy_core_services() {
    log "Phase 2: Deploying Core Services"
    
    # Deploy Ingress Controller
    info "Deploying NGINX Ingress Controller..."
    execute_cmd "cd /opt/crm && ./scripts/k8s/deploy-gardenos.sh deploy-ingress" "Deploying ingress"
    
    # Deploy Supabase Stack
    info "Deploying Supabase stack..."
    execute_cmd "cd /opt/crm && ./scripts/k8s/deploy-gardenos.sh deploy-supabase" "Deploying Supabase"
    
    # Deploy FastAPI Services
    info "Deploying FastAPI services..."
    execute_cmd "cd /opt/crm && ./scripts/k8s/deploy-gardenos.sh deploy-fastapi" "Deploying FastAPI"
    
    # Deploy Ingress Routes
    info "Configuring ingress routes..."
    execute_cmd "cd /opt/crm && kubectl apply -f k8s/ingress/routes.yaml" "Applying ingress routes"
    
    success "Core services deployment complete"
}

# Phase 3: Deploy Monitoring
deploy_monitoring() {
    log "Phase 3: Deploying Monitoring Stack"
    
    info "Deploying Prometheus + Grafana..."
    execute_cmd "cd /opt/crm && ./scripts/k8s/deploy-gardenos.sh deploy-monitoring" "Deploying monitoring"
    
    success "Monitoring stack deployment complete"
}

# Phase 4: Validate Deployment
validate_deployment() {
    log "Phase 4: Validating Deployment"
    
    info "Checking all services status..."
    execute_cmd "cd /opt/crm && ./scripts/k8s/deploy-gardenos.sh status" "Getting deployment status"
    
    info "Testing database connectivity..."
    execute_cmd "kubectl exec -n postgres-cluster postgres-0 -- psql -U postgres -c 'SELECT 1;'" "Testing database"
    
    success "Deployment validation complete"
}

# Phase 5: Frontend Configuration
configure_frontend() {
    log "Phase 5: Frontend Configuration"
    
    info "Frontend needs to be configured to use K3s backend"
    echo
    echo -e "${YELLOW}Next Steps for Frontend:${NC}"
    echo "1. Update frontend environment variables:"
    echo "   - Copy .env.k3s to .env.local"
    echo "   - Set NEXT_PUBLIC_API_BASE_URL=http://api.gardenos.local"
    echo
    echo "2. Add to your local /etc/hosts file:"
    echo "   5.78.103.224 api.gardenos.local monitoring.gardenos.local"
    echo
    echo "3. Start frontend development server:"
    echo "   npm run dev"
    echo
    echo "4. Test the complete application at http://localhost:3000"
    
    success "Frontend configuration instructions provided"
}

# Show final status
show_final_status() {
    log "🎉 GardenOS Deployment Complete!"
    echo
    echo -e "${CYAN}=== Access URLs ===${NC}"
    echo "• Frontend: http://localhost:3000 (after frontend setup)"
    echo "• Supabase Auth: http://api.gardenos.local/auth"
    echo "• Supabase REST: http://api.gardenos.local/rest"
    echo "• FastAPI: http://api.gardenos.local/api"
    echo "• AI Agents: http://api.gardenos.local/ai"
    echo "• Monitoring: http://monitoring.gardenos.local"
    echo
    echo -e "${CYAN}=== Architecture Deployed ===${NC}"
    echo "✅ 3-node K3s cluster with HA control plane"
    echo "✅ 3-node PostgreSQL cluster with Patroni"
    echo "✅ Supabase authentication and REST API"
    echo "✅ FastAPI backend with AI orchestration"
    echo "✅ Prometheus + Grafana monitoring"
    echo "✅ NGINX ingress with routing"
    echo
    echo -e "${GREEN}🚀 Your production-grade CRM system is now operational!${NC}"
}

# Main execution
main() {
    show_banner
    
    check_environment
    
    echo
    read -p "Ready to deploy complete GardenOS system? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    verify_infrastructure
    deploy_core_services
    deploy_monitoring
    validate_deployment
    configure_frontend
    show_final_status
}

# Run main function
main "$@"
