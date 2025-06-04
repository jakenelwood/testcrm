#!/bin/bash

# Script to apply pending migrations to the Supabase database

# Set environment variables
export PGHOST=db.vpwvdfrxvvuxojejnegm.supabase.co
export PGPORT=5432
export PGDATABASE=postgres
export PGUSER=postgres
# Note: Password should be provided securely, not hardcoded

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Apply the migration
echo "Applying migration: 20250610_rename_leads_clients_tables.sql"
psql -f "$SCRIPT_DIR/20250610_rename_leads_clients_tables.sql"

# Check if the migration was successful
if [ $? -eq 0 ]; then
    echo "Migration applied successfully!"
else
    echo "Error applying migration!"
    exit 1
fi

echo "All migrations completed."
