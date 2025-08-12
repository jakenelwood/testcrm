#!/bin/bash

# 🗄️ Supabase Database Initialization Script
# Sets up Supabase auth schema + TwinCiGo CRM schema in K3s PostgreSQL cluster
# Part of the GardenOS high-availability CRM stack

set -euo pipefail

# Source common utilities
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

# Configuration
POSTGRES_POD="postgres-0"
POSTGRES_DB="postgres"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
CRM_SCHEMA_FILE="$PROJECT_ROOT/database/schema/twincigo_crm_complete_schema.sql"

# Supabase required roles and schemas
SUPABASE_ROLES=(
    "anon"
    "authenticated" 
    "service_role"
    "supabase_auth_admin"
    "supabase_storage_admin"
    "supabase_realtime_admin"
)

# Main execution
main() {
    print_header "Supabase Database Initialization" "Setting up Supabase auth + CRM schema in PostgreSQL cluster"
    
    # Prerequisites
    check_kubectl
    check_postgres_cluster
    check_schema_file
    
    # Initialize Supabase
    section "Creating Supabase Roles and Schemas"
    create_supabase_roles
    create_supabase_schemas
    
    # Apply CRM schema
    section "Applying TwinCiGo CRM Schema"
    apply_crm_schema
    
    # Configure permissions
    section "Configuring Permissions"
    configure_permissions
    
    # Verify setup
    section "Verifying Database Setup"
    verify_setup
    
    print_footer "Supabase Database Initialization"
    success "Database successfully initialized with Supabase + CRM schema!"
}

# Check if PostgreSQL cluster is ready
check_postgres_cluster() {
    log "Checking PostgreSQL cluster status..."
    
    if ! kubectl get pod "$POSTGRES_POD" -n "$POSTGRES_NAMESPACE" &>/dev/null; then
        error "PostgreSQL pod $POSTGRES_POD not found" exit
    fi
    
    local pod_status
    pod_status=$(get_pod_status "$POSTGRES_NAMESPACE" "$POSTGRES_POD")
    
    if [[ "$pod_status" != "Running" ]]; then
        error "PostgreSQL pod is not running (status: $pod_status)" exit
    fi
    
    # Test database connection
    if ! kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" &>/dev/null; then
        error "Cannot connect to PostgreSQL database" exit
    fi
    
    success "PostgreSQL cluster is ready"
}

# Check if CRM schema file exists
check_schema_file() {
    log "Checking CRM schema file..."
    
    if [[ ! -f "$CRM_SCHEMA_FILE" ]]; then
        error "CRM schema file not found: $CRM_SCHEMA_FILE" exit
    fi
    
    success "CRM schema file found: $CRM_SCHEMA_FILE"
}

# Create Supabase required roles
create_supabase_roles() {
    log "Creating Supabase roles..."
    
    for role in "${SUPABASE_ROLES[@]}"; do
        info "Creating role: $role"
        
        kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
            DO \$\$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$role') THEN
                    CREATE ROLE $role;
                    RAISE NOTICE 'Role $role created';
                ELSE
                    RAISE NOTICE 'Role $role already exists';
                END IF;
            END
            \$\$;
        " || warn "Failed to create role: $role"
    done
    
    # Configure role permissions
    kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        -- Configure anon role (public access)
        GRANT USAGE ON SCHEMA public TO anon;
        
        -- Configure authenticated role (logged-in users)
        GRANT USAGE ON SCHEMA public TO authenticated;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
        
        -- Configure service_role (full access for Supabase services)
        GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO service_role;
        GRANT ALL ON SCHEMA public TO service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
        
        -- Set default privileges
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated, service_role;
    " || warn "Failed to configure role permissions"
    
    success "Supabase roles created and configured"
}

# Create Supabase required schemas
create_supabase_schemas() {
    log "Creating Supabase schemas..."
    
    kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        -- Create auth schema for Supabase Auth
        CREATE SCHEMA IF NOT EXISTS auth;
        GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, service_role;
        
        -- Create storage schema for Supabase Storage
        CREATE SCHEMA IF NOT EXISTS storage;
        GRANT USAGE ON SCHEMA storage TO supabase_storage_admin, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA storage TO supabase_storage_admin, service_role;
        
        -- Create realtime schema for Supabase Realtime
        CREATE SCHEMA IF NOT EXISTS realtime;
        GRANT USAGE ON SCHEMA realtime TO supabase_realtime_admin, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA realtime TO supabase_realtime_admin, service_role;
        
        -- Enable Row Level Security by default
        ALTER DATABASE $POSTGRES_DB SET row_security = on;
    " || error "Failed to create Supabase schemas" exit
    
    success "Supabase schemas created"
}

# Apply CRM schema
apply_crm_schema() {
    log "Applying TwinCiGo CRM schema..."
    
    # Copy schema file to PostgreSQL pod
    kubectl cp "$CRM_SCHEMA_FILE" "$POSTGRES_NAMESPACE/$POSTGRES_POD:/tmp/crm_schema.sql"
    
    # Apply the schema
    kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/crm_schema.sql || error "Failed to apply CRM schema" exit
    
    # Clean up
    kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- rm -f /tmp/crm_schema.sql
    
    success "CRM schema applied successfully"
}

# Configure permissions for CRM tables
configure_permissions() {
    log "Configuring CRM table permissions..."
    
    kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        -- Grant permissions on all CRM tables
        GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
        
        -- Enable RLS on sensitive tables
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
        ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
        
        -- Create basic RLS policies (can be customized later)
        CREATE POLICY \"Users can view own data\" ON users FOR ALL USING (auth.uid() = id);
        CREATE POLICY \"Authenticated users can view clients\" ON clients FOR SELECT USING (auth.role() = 'authenticated');
        CREATE POLICY \"Authenticated users can view leads\" ON leads FOR SELECT USING (auth.role() = 'authenticated');
        CREATE POLICY \"Authenticated users can view communications\" ON communications FOR SELECT USING (auth.role() = 'authenticated');
    " || warn "Some permission configurations may have failed"
    
    success "Permissions configured"
}

# Verify the setup
verify_setup() {
    log "Verifying database setup..."
    
    # Check roles
    local roles_count
    roles_count=$(kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role');" | tr -d ' ')
    
    if [[ "$roles_count" -ge 3 ]]; then
        success "Supabase roles verified"
    else
        warn "Some Supabase roles may be missing"
    fi
    
    # Check schemas
    local schemas_count
    schemas_count=$(kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name IN ('auth', 'storage', 'realtime');" | tr -d ' ')
    
    if [[ "$schemas_count" -ge 3 ]]; then
        success "Supabase schemas verified"
    else
        warn "Some Supabase schemas may be missing"
    fi
    
    # Check CRM tables
    local tables_count
    tables_count=$(kubectl exec -n "$POSTGRES_NAMESPACE" "$POSTGRES_POD" -- psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'clients', 'leads');" | tr -d ' ')
    
    if [[ "$tables_count" -ge 3 ]]; then
        success "CRM tables verified"
    else
        error "CRM tables missing or incomplete" exit
    fi
    
    info "Database verification complete"
}

# Execute main function
main "$@"
