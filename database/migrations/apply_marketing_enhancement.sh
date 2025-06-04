#!/bin/bash

# 📊 Apply Marketing Data Enhancement to Hetzner Database
# This script applies the comprehensive marketing analytics schema

set -e  # Exit on any error

echo "📊 Applying Marketing Data Enhancement"
echo "====================================="

# Configuration
DB_HOST="5.161.110.205"
DB_PORT="5432"
DB_NAME="crm"
DB_USER="crm_user"

echo "📋 Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "👤 User: $DB_USER"
echo ""

# Function to execute SQL with error handling
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo "🔧 $description"
    echo "   File: $sql_file"
    
    if [ ! -f "$sql_file" ]; then
        echo "❌ Error: SQL file not found: $sql_file"
        exit 1
    fi
    
    # Execute the SQL file
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ $description completed successfully"
    else
        echo "❌ Error executing $description"
        exit 1
    fi
    echo ""
}

# Function to test connection
test_connection() {
    echo "🔍 Testing database connection and verifying new tables..."
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        'campaigns' as table_name, 
        COUNT(*) as record_count,
        'Marketing campaigns' as description
    FROM campaigns
    UNION ALL
    SELECT 
        'ab_tests', 
        COUNT(*), 
        'A/B testing framework'
    FROM ab_tests
    UNION ALL
    SELECT 
        'communication_metrics', 
        COUNT(*), 
        'Channel-specific engagement metrics'
    FROM communication_metrics
    UNION ALL
    SELECT 
        'content_templates', 
        COUNT(*), 
        'Reusable content templates'
    FROM content_templates
    UNION ALL
    SELECT 
        'customer_touchpoints', 
        COUNT(*), 
        'Customer journey tracking'
    FROM customer_touchpoints
    UNION ALL
    SELECT 
        'campaign_analytics', 
        COUNT(*), 
        'Campaign performance analytics'
    FROM campaign_analytics;
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Database connection and new tables verified"
    else
        echo "❌ Error verifying database"
        exit 1
    fi
    echo ""
}

# Function to grant permissions
grant_permissions() {
    echo "🔐 Granting permissions on new tables..."
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    -- Grant permissions to application user
    GRANT ALL PRIVILEGES ON campaigns TO $DB_USER;
    GRANT ALL PRIVILEGES ON ab_tests TO $DB_USER;
    GRANT ALL PRIVILEGES ON communication_metrics TO $DB_USER;
    GRANT ALL PRIVILEGES ON content_templates TO $DB_USER;
    GRANT ALL PRIVILEGES ON customer_touchpoints TO $DB_USER;
    GRANT ALL PRIVILEGES ON campaign_analytics TO $DB_USER;
    
    -- Grant sequence permissions
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Permissions granted successfully"
    else
        echo "❌ Error granting permissions"
        exit 1
    fi
    echo ""
}

# Function to create backup
create_backup() {
    echo "💾 Creating database backup before migration..."
    
    local backup_file="crm_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup created: $backup_file"
    else
        echo "❌ Error creating backup"
        exit 1
    fi
    echo ""
}

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: DB_PASSWORD environment variable not set"
    echo "Usage: DB_PASSWORD=your_password $0"
    exit 1
fi

# Main migration process
echo "🚀 Starting marketing data enhancement migration..."
echo ""

# Step 1: Create backup
create_backup

# Step 2: Apply marketing enhancement schema
execute_sql "database/schema/marketing_data_enhancement.sql" "Applying marketing data enhancement schema"

# Step 3: Grant permissions
grant_permissions

# Step 4: Test the migration
test_connection

echo "🎉 Marketing Data Enhancement Complete!"
echo "======================================"
echo ""
echo "📊 New Marketing Features:"
echo "  ✅ Comprehensive campaign management"
echo "  ✅ A/B testing framework"
echo "  ✅ Channel-specific engagement metrics"
echo "  ✅ Content template management"
echo "  ✅ Customer journey tracking"
echo "  ✅ Multi-touch attribution"
echo "  ✅ Performance analytics"
echo ""
echo "🎯 Marketing Data Coverage:"
echo "  ✅ Email: Open rates, click rates, deliverability"
echo "  ✅ SMS: Delivery status, opt-outs, responses"
echo "  ✅ Phone: Call outcomes, duration, recordings"
echo "  ✅ Social: Engagement, reach, impressions"
echo "  ✅ In-Person: Meeting outcomes, materials"
echo "  ✅ Cross-Channel: Attribution, journey mapping"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update application code to use new tables"
echo "  2. Create marketing dashboard views"
echo "  3. Set up automated analytics calculations"
echo "  4. Configure A/B testing workflows"
echo ""
echo "📚 Documentation:"
echo "  - Marketing data coverage: docs/database/marketing-data-coverage.md"
echo "  - Schema reference: database/schema/marketing_data_enhancement.sql"
echo ""
echo "Migration completed successfully! 🎉"
