#!/bin/bash

# Migration Runner Script
# Purpose: Safely execute the circular dependency resolution migration
# Usage: ./run_migration.sh [--dry-run]

set -e  # Exit on any error

# Configuration
DB_HOST="db.xyfpnlxwimjbgjloujxw.supabase.co"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres"
MIGRATION_FILE="001_resolve_circular_dependency.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    print_error "Migration file $MIGRATION_FILE not found!"
    exit 1
fi

# Check for dry-run flag
DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
    DRY_RUN=true
    print_warning "DRY RUN MODE - No changes will be made to the database"
fi

print_status "Starting migration: Resolve Circular Foreign Key Dependency"
print_status "Target database: $DB_HOST:$DB_PORT/$DB_NAME"

# Verify database connection
print_status "Testing database connection..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
    print_error "Cannot connect to database. Please check your connection settings."
    exit 1
fi

print_status "Database connection successful"

# Create backup before migration
BACKUP_FILE="backup_before_migration_$(date +%Y%m%d_%H%M%S).sql"
print_status "Creating backup: $BACKUP_FILE"

if [ "$DRY_RUN" = false ]; then
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            --schema-only --no-owner --no-privileges > "$BACKUP_FILE"
    print_status "Backup created successfully"
else
    print_warning "Skipping backup creation in dry-run mode"
fi

# Execute migration
if [ "$DRY_RUN" = false ]; then
    print_status "Executing migration..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"
    print_status "Migration completed successfully!"

    # Verify the migration worked
    print_status "Verifying migration results..."

    # Check that circular constraints are gone
    CIRCULAR_CONSTRAINTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('clients', 'leads')
        AND kcu.column_name IN ('converted_from_lead_id', 'client_id');
    " | xargs)

    if [ "$CIRCULAR_CONSTRAINTS" -eq 0 ]; then
        print_status "✅ Circular foreign key constraints successfully removed"
    else
        print_error "❌ Circular constraints still exist after migration"
        exit 1
    fi

    # Check that new fields exist
    NEW_FIELDS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name IN ('converted_to_client_id', 'conversion_date', 'is_converted');
    " | xargs)

    if [ "$NEW_FIELDS" -eq 3 ]; then
        print_status "✅ New conversion tracking fields successfully added"
    else
        print_error "❌ New fields not found after migration"
        exit 1
    fi

    print_status "🎉 Migration verification completed successfully!"
    print_status "Backup saved as: $BACKUP_FILE"

else
    print_warning "DRY RUN: Would execute migration file $MIGRATION_FILE"
    print_warning "Use without --dry-run flag to execute the actual migration"
fi

print_status "Migration process completed."