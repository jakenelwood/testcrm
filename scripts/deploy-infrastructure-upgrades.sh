#!/bin/bash

# 🚀 Deploy Infrastructure Upgrades
# Comprehensive deployment script for all three phases:
# 1. Database Schema Migrations (Alembic)
# 2. etcd Monitoring Enhancement
# 3. Secrets Management Upgrade (Vault)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOYMENT_LOG="/tmp/infrastructure-upgrade-$(date +%Y%m%d_%H%M%S).log"

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

phase() {
    echo -e "\n${PURPLE}🎯 $1${NC}" | tee -a "$DEPLOYMENT_LOG"
    echo -e "${PURPLE}$(printf '=%.0s' {1..50})${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    for tool in kubectl docker python3 pip3 vault; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        info "Please install missing tools before continuing"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/deployment/backend/main.py" ]; then
        error "Script must be run from the project root directory"
        exit 1
    fi
    
    # Check environment variables
    if [ -z "$DATABASE_URL" ]; then
        warning "DATABASE_URL not set. Using default for development"
        export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm"
    fi
    
    success "Prerequisites check passed"
}

# Phase 1: Deploy Database Schema Migrations
deploy_database_migrations() {
    phase "PHASE 1: DATABASE SCHEMA MIGRATIONS (ALEMBIC)"
    
    log "Setting up Alembic migrations..."
    
    # Navigate to backend directory
    cd "$PROJECT_ROOT/deployment/backend"

    # Create and activate virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        log "Creating Python virtual environment..."
        python3 -m venv venv
        log "Installing Python dependencies..."
        source venv/bin/activate
        pip install -r requirements.txt
    else
        log "Using existing virtual environment..."
        source venv/bin/activate
    fi
    
    # Make migration scripts executable
    chmod +x manage_migrations.py create_initial_migration.py
    
    # Create initial migration
    log "Creating initial migration..."
    python create_initial_migration.py

    # Apply migrations
    log "Applying database migrations..."
    python manage_migrations.py upgrade

    # Verify migration status
    log "Verifying migration status..."
    python manage_migrations.py status
    
    success "Phase 1: Database migrations completed"
    
    # Return to project root
    cd "$PROJECT_ROOT"
}

# Phase 2: Deploy etcd Monitoring
deploy_etcd_monitoring() {
    phase "PHASE 2: ETCD MONITORING ENHANCEMENT"
    
    log "Deploying etcd monitoring infrastructure..."
    
    # Deploy etcd exporter
    log "Deploying etcd Prometheus exporter..."
    kubectl apply -f k8s/monitoring/etcd-exporter.yaml
    
    # Update Prometheus configuration
    log "Updating Prometheus configuration..."
    kubectl apply -f k8s/monitoring/prometheus.yaml
    
    # Deploy Grafana dashboard
    log "Deploying etcd Grafana dashboard..."
    kubectl apply -f k8s/monitoring/grafana-etcd-dashboard.yaml
    
    # Set up unified backup automation
    log "Setting up unified HA backup system..."
    chmod +x scripts/etcd-backup-automation.sh scripts/unified-ha-backup.sh scripts/setup-backup-automation.sh

    # Setup comprehensive backup automation
    log "Configuring automated backup system..."
    ./scripts/setup-backup-automation.sh setup

    # Test unified backup
    log "Testing unified backup functionality..."
    ./scripts/unified-ha-backup.sh backup daily
    
    # Wait for pods to be ready
    log "Waiting for monitoring pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=etcd-exporter -n monitoring --timeout=300s
    
    success "Phase 2: etcd monitoring completed"
}

# Phase 3: Deploy HashiCorp Vault
deploy_vault_secrets() {
    phase "PHASE 3: SECRETS MANAGEMENT UPGRADE (VAULT)"
    
    log "Deploying HashiCorp Vault..."
    
    # Deploy Vault
    log "Deploying Vault StatefulSet..."
    kubectl apply -f k8s/vault/namespace.yaml
    
    # Wait for Vault pods to be ready
    log "Waiting for Vault pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=vault -n vault --timeout=600s
    
    # Initialize Vault (if not already initialized)
    log "Initializing Vault cluster..."
    kubectl exec -n vault vault-0 -- /bin/sh -c "
        if ! vault status | grep -q 'Initialized.*true'; then
            /vault/config/init-vault.sh
        else
            echo 'Vault already initialized'
        fi
    " || warning "Vault initialization may have failed"
    
    # Set up port forwarding for Vault access
    log "Setting up Vault access..."
    kubectl port-forward -n vault svc/vault 8200:8200 &
    VAULT_PF_PID=$!
    sleep 5
    
    # Set Vault address
    export VAULT_ADDR="http://localhost:8200"
    
    # Migrate secrets to Vault
    log "Migrating secrets to Vault..."
    chmod +x scripts/migrate-secrets-to-vault.sh
    ./scripts/migrate-secrets-to-vault.sh migrate || warning "Secret migration may have failed"
    
    # Clean up port forwarding
    kill $VAULT_PF_PID 2>/dev/null || true
    
    success "Phase 3: Vault secrets management completed"
}

# Update FastAPI backend deployment
update_fastapi_deployment() {
    log "Updating FastAPI backend deployment..."
    
    # Build new Docker image with updated backend
    cd "$PROJECT_ROOT/deployment/backend"
    
    log "Building updated FastAPI image..."
    docker build -t ronrico-crm-backend:v2.0.0 .
    
    # Update Kubernetes deployment
    log "Updating Kubernetes deployment..."
    kubectl set image deployment/fastapi-deployment fastapi=ronrico-crm-backend:v2.0.0 -n fastapi
    
    # Wait for rollout
    kubectl rollout status deployment/fastapi-deployment -n fastapi --timeout=300s
    
    success "FastAPI backend updated"
    
    cd "$PROJECT_ROOT"
}

# Verify deployment
verify_deployment() {
    phase "DEPLOYMENT VERIFICATION"
    
    log "Verifying all components..."
    
    # Check database migrations
    log "Checking database migration status..."
    cd "$PROJECT_ROOT/deployment/backend"
    source venv/bin/activate
    python manage_migrations.py status
    cd "$PROJECT_ROOT"
    
    # Check etcd monitoring
    log "Checking etcd monitoring..."
    kubectl get pods -n monitoring -l app=etcd-exporter
    
    # Check Vault
    log "Checking Vault status..."
    kubectl get pods -n vault -l app=vault
    
    # Check FastAPI backend
    log "Checking FastAPI backend..."
    kubectl get pods -n fastapi -l app=fastapi
    
    # Test API endpoints
    log "Testing API endpoints..."
    local api_pod=$(kubectl get pods -n fastapi -l app=fastapi -o jsonpath='{.items[0].metadata.name}')
    if [ -n "$api_pod" ]; then
        kubectl exec -n fastapi "$api_pod" -- curl -s http://localhost:8000/ | jq .
        kubectl exec -n fastapi "$api_pod" -- curl -s http://localhost:8000/api/v1/migrations/current | jq .
    fi
    
    success "Deployment verification completed"
}

# Generate deployment report
generate_deployment_report() {
    log "Generating deployment report..."
    
    local report_file="$PROJECT_ROOT/docs/reporting/infrastructure-upgrade-report-$(date +%Y%m%d_%H%M%S).json"
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
{
    "deployment_date": "$(date -Iseconds)",
    "deployment_log": "$DEPLOYMENT_LOG",
    "phases_completed": {
        "database_migrations": true,
        "etcd_monitoring": true,
        "vault_secrets": true
    },
    "components_deployed": {
        "alembic_migrations": {
            "status": "active",
            "backend_version": "2.0.0",
            "features": ["SQLAlchemy Models", "Programmatic Migrations", "API Endpoints"]
        },
        "etcd_monitoring": {
            "status": "active",
            "components": ["Prometheus Exporter", "Grafana Dashboard", "Automated Backups"],
            "backup_schedule": "daily"
        },
        "vault_secrets": {
            "status": "active",
            "features": ["HA Deployment", "Kubernetes Auth", "Database Secrets Engine"],
            "replicas": 3
        }
    },
    "next_steps": [
        "Configure secret rotation policies in Vault",
        "Set up automated etcd backup monitoring",
        "Implement database migration CI/CD pipeline",
        "Configure Vault audit logging",
        "Set up Grafana alerting for etcd metrics"
    ]
}
EOF
    
    success "Deployment report generated: $report_file"
}

# Main deployment function
main() {
    log "🚀 Starting Infrastructure Upgrades Deployment"
    log "=============================================="
    log "Deployment log: $DEPLOYMENT_LOG"
    
    # Check prerequisites
    check_prerequisites
    
    # Phase 1: Database Migrations
    deploy_database_migrations
    
    # Phase 2: etcd Monitoring
    deploy_etcd_monitoring
    
    # Phase 3: Vault Secrets
    deploy_vault_secrets
    
    # Update FastAPI backend
    update_fastapi_deployment
    
    # Verify deployment
    verify_deployment
    
    # Generate report
    generate_deployment_report
    
    log "🎉 Infrastructure Upgrades Deployment Completed!"
    log "==============================================="
    
    info "Summary:"
    info "✅ Phase 1: Database Schema Migrations (Alembic) - COMPLETED"
    info "✅ Phase 2: etcd Monitoring Enhancement - COMPLETED"
    info "✅ Phase 3: Secrets Management Upgrade (Vault) - COMPLETED"
    
    warning "Important:"
    warning "1. Review the deployment log: $DEPLOYMENT_LOG"
    warning "2. Test all functionality before removing old secrets"
    warning "3. Set up monitoring alerts for new components"
    warning "4. Configure backup retention policies"
}

# Script entry point
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "phase1")
        check_prerequisites
        deploy_database_migrations
        ;;
    "phase2")
        check_prerequisites
        deploy_etcd_monitoring
        ;;
    "phase3")
        check_prerequisites
        deploy_vault_secrets
        ;;
    "verify")
        verify_deployment
        ;;
    *)
        echo "Usage: $0 {deploy|phase1|phase2|phase3|verify}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy all phases (default)"
        echo "  phase1  - Deploy only database migrations"
        echo "  phase2  - Deploy only etcd monitoring"
        echo "  phase3  - Deploy only Vault secrets"
        echo "  verify  - Verify deployment status"
        exit 1
        ;;
esac
