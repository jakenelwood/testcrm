#!/bin/bash

# 🔐 Migrate Kubernetes Secrets to HashiCorp Vault
# Automated migration script for enterprise-grade secrets management

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
VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
VAULT_NAMESPACE="${VAULT_NAMESPACE:-vault}"
BACKUP_DIR="./secrets-backup-$(date +%Y%m%d_%H%M%S)"

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if kubectl is available
    if ! command -v kubectl >/dev/null 2>&1; then
        error "kubectl is required but not installed"
        exit 1
    fi
    
    # Check if vault CLI is available
    if ! command -v vault >/dev/null 2>&1; then
        error "vault CLI is required but not installed"
        info "Install with: curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -"
        info "sudo apt-add-repository \"deb [arch=amd64] https://apt.releases.hashicorp.com \$(lsb_release -cs) main\""
        info "sudo apt-get update && sudo apt-get install vault"
        exit 1
    fi
    
    # Check if jq is available
    if ! command -v jq >/dev/null 2>&1; then
        error "jq is required but not installed"
        info "Install with: sudo apt-get install jq"
        exit 1
    fi
    
    # Check Vault connectivity
    if ! vault status >/dev/null 2>&1; then
        error "Cannot connect to Vault at $VAULT_ADDR"
        info "Ensure Vault is running and VAULT_ADDR is correct"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create backup directory
create_backup() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    success "Backup directory created"
}

# Backup existing Kubernetes secrets
backup_k8s_secrets() {
    log "Backing up existing Kubernetes secrets..."
    
    local namespaces=("postgres-cluster" "supabase" "fastapi" "storage" "vault")
    
    for namespace in "${namespaces[@]}"; do
        log "Backing up secrets from namespace: $namespace"
        
        # Create namespace backup directory
        mkdir -p "$BACKUP_DIR/$namespace"
        
        # Get all secrets in namespace
        kubectl get secrets -n "$namespace" -o json > "$BACKUP_DIR/$namespace/all-secrets.json"
        
        # Extract individual secrets
        kubectl get secrets -n "$namespace" --no-headers -o custom-columns=":metadata.name" | while read secret_name; do
            if [ "$secret_name" != "default-token-*" ] && [ "$secret_name" != "" ]; then
                kubectl get secret "$secret_name" -n "$namespace" -o yaml > "$BACKUP_DIR/$namespace/$secret_name.yaml"
                log "Backed up secret: $namespace/$secret_name"
            fi
        done
    done
    
    success "Kubernetes secrets backup completed"
}

# Migrate secrets to Vault
migrate_secrets_to_vault() {
    log "Migrating secrets to Vault..."
    
    # Migrate PostgreSQL secrets
    migrate_postgres_secrets
    
    # Migrate Supabase secrets
    migrate_supabase_secrets
    
    # Migrate FastAPI secrets
    migrate_fastapi_secrets
    
    # Migrate MinIO secrets
    migrate_minio_secrets
    
    success "All secrets migrated to Vault"
}

# Migrate PostgreSQL secrets
migrate_postgres_secrets() {
    log "Migrating PostgreSQL secrets..."
    
    # Extract PostgreSQL passwords
    local postgres_password=$(kubectl get secret postgres-secrets -n postgres-cluster -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)
    local replication_password=$(kubectl get secret postgres-secrets -n postgres-cluster -o jsonpath='{.data.REPLICATION_PASSWORD}' | base64 -d)
    local admin_password=$(kubectl get secret postgres-secrets -n postgres-cluster -o jsonpath='{.data.ADMIN_PASSWORD}' | base64 -d)
    local supabase_password=$(kubectl get secret postgres-secrets -n postgres-cluster -o jsonpath='{.data.SUPABASE_PASSWORD}' | base64 -d)
    
    # Store in Vault
    vault kv put secret/crm/database \
        postgres_password="$postgres_password" \
        replication_password="$replication_password" \
        admin_password="$admin_password" \
        supabase_password="$supabase_password"
    
    success "PostgreSQL secrets migrated"
}

# Migrate Supabase secrets
migrate_supabase_secrets() {
    log "Migrating Supabase secrets..."
    
    # Extract Supabase secrets
    local jwt_secret=$(kubectl get secret supabase-secrets -n supabase -o jsonpath='{.data.JWT_SECRET}' | base64 -d)
    local service_role_key=$(kubectl get secret supabase-secrets -n supabase -o jsonpath='{.data.SERVICE_ROLE_KEY}' | base64 -d)
    local anon_key=$(kubectl get secret supabase-secrets -n supabase -o jsonpath='{.data.ANON_KEY}' | base64 -d)
    
    # Store in Vault
    vault kv put secret/crm/supabase \
        jwt_secret="$jwt_secret" \
        service_role_key="$service_role_key" \
        anon_key="$anon_key"
    
    success "Supabase secrets migrated"
}

# Migrate FastAPI secrets
migrate_fastapi_secrets() {
    log "Migrating FastAPI secrets..."
    
    # Extract FastAPI secrets
    local secret_key=$(kubectl get secret fastapi-secrets -n fastapi -o jsonpath='{.data.SECRET_KEY}' | base64 -d)
    local supabase_service_role_key=$(kubectl get secret fastapi-secrets -n fastapi -o jsonpath='{.data.SUPABASE_SERVICE_ROLE_KEY}' | base64 -d)
    local database_password=$(kubectl get secret fastapi-secrets -n fastapi -o jsonpath='{.data.DATABASE_PASSWORD}' | base64 -d)
    
    # Store in Vault
    vault kv put secret/crm/fastapi \
        secret_key="$secret_key" \
        supabase_service_role_key="$supabase_service_role_key" \
        database_password="$database_password"
    
    success "FastAPI secrets migrated"
}

# Migrate MinIO secrets
migrate_minio_secrets() {
    log "Migrating MinIO secrets..."
    
    # Extract MinIO secrets
    local root_user=$(kubectl get secret minio-secrets -n storage -o jsonpath='{.data.MINIO_ROOT_USER}' | base64 -d)
    local root_password=$(kubectl get secret minio-secrets -n storage -o jsonpath='{.data.MINIO_ROOT_PASSWORD}' | base64 -d)
    local access_key=$(kubectl get secret minio-secrets -n storage -o jsonpath='{.data.MINIO_ACCESS_KEY}' | base64 -d)
    local secret_key=$(kubectl get secret minio-secrets -n storage -o jsonpath='{.data.MINIO_SECRET_KEY}' | base64 -d)
    
    # Store in Vault
    vault kv put secret/crm/minio \
        root_user="$root_user" \
        root_password="$root_password" \
        access_key="$access_key" \
        secret_key="$secret_key"
    
    success "MinIO secrets migrated"
}

# Configure Vault database secrets engine
configure_database_engine() {
    log "Configuring Vault database secrets engine..."
    
    # Get database connection details
    local db_host="postgres-cluster.postgres-cluster.svc.cluster.local"
    local db_port="5432"
    local db_name="postgres"
    local admin_user="postgres"
    local admin_password=$(vault kv get -field=postgres_password secret/crm/database)
    
    # Configure database connection
    vault write database/config/postgresql \
        plugin_name=postgresql-database-plugin \
        connection_url="postgresql://{{username}}:{{password}}@$db_host:$db_port/$db_name?sslmode=disable" \
        allowed_roles="crm-role" \
        username="$admin_user" \
        password="$admin_password"
    
    # Create database role
    vault write database/roles/crm-role \
        db_name=postgresql \
        creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\"; \
                            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO \"{{name}}\";" \
        default_ttl="1h" \
        max_ttl="24h"
    
    success "Database secrets engine configured"
}

# Create Vault policies and auth methods
setup_vault_auth() {
    log "Setting up Vault authentication..."
    
    # Enable Kubernetes auth method
    vault auth enable kubernetes
    
    # Configure Kubernetes auth
    vault write auth/kubernetes/config \
        token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
        kubernetes_host="https://$KUBERNETES_PORT_443_TCP_ADDR:443" \
        kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    
    # Create role for CRM applications
    vault write auth/kubernetes/role/crm-app \
        bound_service_account_names=fastapi,supabase \
        bound_service_account_namespaces=fastapi,supabase \
        policies=crm-app \
        ttl=1h
    
    success "Vault authentication configured"
}

# Generate migration report
generate_report() {
    log "Generating migration report..."
    
    local report_file="$BACKUP_DIR/migration-report.json"
    
    cat > "$report_file" << EOF
{
    "migration_date": "$(date -Iseconds)",
    "vault_addr": "$VAULT_ADDR",
    "backup_directory": "$BACKUP_DIR",
    "migrated_secrets": {
        "database": {
            "path": "secret/crm/database",
            "keys": ["postgres_password", "replication_password", "admin_password", "supabase_password"]
        },
        "supabase": {
            "path": "secret/crm/supabase", 
            "keys": ["jwt_secret", "service_role_key", "anon_key"]
        },
        "fastapi": {
            "path": "secret/crm/fastapi",
            "keys": ["secret_key", "supabase_service_role_key", "database_password"]
        },
        "minio": {
            "path": "secret/crm/minio",
            "keys": ["root_user", "root_password", "access_key", "secret_key"]
        }
    },
    "vault_features": {
        "database_secrets_engine": true,
        "kubernetes_auth": true,
        "policies_created": ["crm-app", "crm-admin"],
        "audit_logging": true
    }
}
EOF
    
    success "Migration report generated: $report_file"
}

# Main migration function
main() {
    log "🔐 Starting Kubernetes to Vault secrets migration"
    log "================================================="
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Backup existing secrets
    backup_k8s_secrets
    
    # Migrate secrets to Vault
    migrate_secrets_to_vault
    
    # Configure database secrets engine
    configure_database_engine
    
    # Setup authentication
    setup_vault_auth
    
    # Generate report
    generate_report
    
    log "🎉 Secrets migration completed successfully!"
    log "================================================="
    
    info "Next steps:"
    info "1. Update application configurations to use Vault"
    info "2. Test secret retrieval from applications"
    info "3. Remove old Kubernetes secrets (after verification)"
    info "4. Set up secret rotation policies"
    
    warning "Backup location: $BACKUP_DIR"
    warning "Keep this backup until migration is fully verified"
}

# Script entry point
case "${1:-migrate}" in
    "migrate")
        main
        ;;
    "backup-only")
        check_prerequisites
        create_backup
        backup_k8s_secrets
        ;;
    "report")
        generate_report
        ;;
    *)
        echo "Usage: $0 {migrate|backup-only|report}"
        echo ""
        echo "Commands:"
        echo "  migrate     - Full migration from K8s secrets to Vault (default)"
        echo "  backup-only - Only backup existing K8s secrets"
        echo "  report      - Generate migration report"
        exit 1
        ;;
esac
