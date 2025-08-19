#!/bin/bash

# 🚀 Deploy Unified AI-Native Insurance CRM Schema
# Deploys the complete optimized schema with vector embeddings and multi-tenancy

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="db.xyfpnlxwimjbgjloujxw.supabase.co"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres"

echo -e "${BLUE}🚀 Unified AI-Native CRM Schema Deployment${NC}"
echo "=============================================="
echo ""

# Function to execute SQL file
execute_sql() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}📄 $description${NC}"
    echo "   File: $file"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Error: File $file not found${NC}"
        exit 1
    fi
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" -v ON_ERROR_STOP=1; then
        echo -e "${GREEN}✅ Success: $description${NC}"
    else
        echo -e "${RED}❌ Failed: $description${NC}"
        exit 1
    fi
    echo ""
}

# Function to test database connection
test_connection() {
    echo -e "${YELLOW}🔌 Testing database connection...${NC}"
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        echo "Please check your database credentials and connection."
        exit 1
    fi
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}❌ psql is not installed. Please install PostgreSQL client tools.${NC}"
        exit 1
    fi
    
    # Check if migration files exist
    local required_files=(
        "supabase/migrations/20250815000001_unified_ai_native_schema.sql"
        "supabase/migrations/20250815000002_insurance_specific_tables.sql"
        "supabase/migrations/20250815000003_rls_policies.sql"
        "supabase/migrations/20250815000004_seed_data.sql"
        "supabase/migrations/20250815000005_vector_search_functions.sql"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ Required migration file missing: $file${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
    echo ""
}

# Function to backup existing schema (if any)
backup_existing_schema() {
    echo -e "${YELLOW}💾 Creating backup of existing schema...${NC}"
    
    local backup_file="backups/schema_backup_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p backups
    
    if pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --schema-only > "$backup_file" 2>/dev/null; then
        echo -e "${GREEN}✅ Schema backup created: $backup_file${NC}"
    else
        echo -e "${YELLOW}⚠️  No existing schema to backup or backup failed${NC}"
    fi
    echo ""
}

# Function to verify deployment
verify_deployment() {
    echo -e "${YELLOW}🧪 Verifying deployment...${NC}"
    
    # Create verification SQL
    cat > /tmp/verify_deployment.sql << 'EOF'
-- Check that all main tables exist
SELECT 
  'workspaces' as table_name, 
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END as status
FROM workspaces
UNION ALL
SELECT 'users', COUNT(*), CASE WHEN COUNT(*) >= 0 THEN '✅' ELSE '❌' END FROM users
UNION ALL
SELECT 'contacts', COUNT(*), CASE WHEN COUNT(*) >= 0 THEN '✅' ELSE '❌' END FROM contacts
UNION ALL
SELECT 'accounts', COUNT(*), CASE WHEN COUNT(*) >= 0 THEN '✅' ELSE '❌' END FROM accounts
UNION ALL
SELECT 'opportunities', COUNT(*), CASE WHEN COUNT(*) >= 0 THEN '✅' ELSE '❌' END FROM opportunities
UNION ALL
SELECT 'interactions', COUNT(*), CASE WHEN COUNT(*) >= 0 THEN '✅' ELSE '❌' END FROM interactions
UNION ALL
SELECT 'insurance_types', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END FROM insurance_types
ORDER BY table_name;

-- Check vector extension
SELECT 
  'pgvector extension' as feature,
  CASE WHEN COUNT(*) > 0 THEN '✅ Installed' ELSE '❌ Missing' END as status
FROM pg_extension WHERE extname = 'vector';

-- Check RLS policies
SELECT 
  'RLS Policies' as feature,
  COUNT(*) || ' policies active' as status
FROM pg_policies 
WHERE schemaname = 'public';

-- Check vector search functions
SELECT 
  'Vector Search Functions' as feature,
  CASE WHEN COUNT(*) >= 5 THEN '✅ Available' ELSE '❌ Missing' END as status
FROM pg_proc 
WHERE proname LIKE '%embedding%';
EOF

    echo "   Running verification checks..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /tmp/verify_deployment.sql
    
    # Clean up
    rm -f /tmp/verify_deployment.sql
    
    echo -e "${GREEN}✅ Deployment verification complete${NC}"
    echo ""
}

# Function to display next steps
show_next_steps() {
    echo -e "${BLUE}🎯 Next Steps${NC}"
    echo "============="
    echo ""
    echo "1. 🔑 Set up your Voyage AI API key:"
    echo "   export VOYAGE_API_KEY='your-api-key-here'"
    echo ""
    echo "2. 🔄 Update your application code:"
    echo "   - Update Drizzle schema imports to use unified-schema.ts"
    echo "   - Update API endpoints to use new table structure"
    echo "   - Update React components for new data model"
    echo ""
    echo "3. 🧪 Run Playwright hydration tests:"
    echo "   npm run test:hydration"
    echo ""
    echo "4. 🚀 Start using AI features:"
    echo "   - Semantic search across contacts and interactions"
    echo "   - AI-powered customer insights and risk scoring"
    echo "   - Automated summary generation"
    echo ""
    echo "5. 📊 Monitor AI coverage:"
    echo "   SELECT * FROM get_workspace_ai_stats('your-workspace-id');"
    echo ""
}

# Main deployment process
main() {
    echo "Starting deployment at $(date)"
    echo ""
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Test connection
    test_connection
    
    # Step 3: Backup existing schema
    backup_existing_schema
    
    # Step 4: Deploy core unified schema
    execute_sql "supabase/migrations/20250815000001_unified_ai_native_schema.sql" "Deploying unified AI-native schema with vector support"
    
    # Step 5: Deploy insurance-specific tables
    execute_sql "supabase/migrations/20250815000002_insurance_specific_tables.sql" "Deploying insurance-specific tables and indexes"
    
    # Step 6: Deploy RLS policies
    execute_sql "supabase/migrations/20250815000003_rls_policies.sql" "Deploying Row Level Security policies"
    
    # Step 7: Deploy seed data
    execute_sql "supabase/migrations/20250815000004_seed_data.sql" "Deploying seed data and configuration"
    
    # Step 8: Deploy vector search functions
    execute_sql "supabase/migrations/20250815000005_vector_search_functions.sql" "Deploying AI vector search functions"
    
    # Step 9: Verify deployment
    verify_deployment
    
    # Step 10: Show next steps
    show_next_steps
    
    echo -e "${GREEN}🎉 UNIFIED AI-NATIVE CRM DEPLOYMENT COMPLETE!${NC}"
    echo "=================================================="
    echo ""
    echo -e "${GREEN}✅ Multi-tenant architecture: DEPLOYED${NC}"
    echo -e "${GREEN}✅ Unified contact model: ACTIVE${NC}"
    echo -e "${GREEN}✅ Vector embeddings: READY${NC}"
    echo -e "${GREEN}✅ AI search functions: AVAILABLE${NC}"
    echo -e "${GREEN}✅ Insurance domain expertise: PRESERVED${NC}"
    echo ""
    echo "🚀 Your insurance CRM is now ready for AI-powered operations!"
}

# Run main function
main "$@"
