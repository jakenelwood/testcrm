#!/bin/bash

# 🔧 Fix PostgreSQL Configuration for Supabase
# This script configures PostgreSQL on Hetzner server for Supabase compatibility
# Documentation: docs/deployment/SUPABASE_SETUP.md
# Troubleshooting: docs/deployment/HETZNER_SUPABASE_SETUP.md

set -e

echo "🔧 Configuring PostgreSQL for Supabase compatibility..."

# 1. Enable logical replication and required settings
echo "📝 Setting PostgreSQL parameters for logical replication..."
sudo -u postgres psql -c "ALTER SYSTEM SET wal_level = logical;"
sudo -u postgres psql -c "ALTER SYSTEM SET max_replication_slots = 10;"
sudo -u postgres psql -c "ALTER SYSTEM SET max_wal_senders = 10;"

# 2. Reload PostgreSQL configuration
echo "🔄 Reloading PostgreSQL configuration..."
sudo -u postgres psql -c "SELECT pg_reload_conf();"

# 3. Restart PostgreSQL to apply wal_level change (requires restart)
echo "🔄 Restarting PostgreSQL to apply wal_level change..."
sudo systemctl restart postgresql@16-main

# 4. Wait for PostgreSQL to start
echo "⏳ Waiting for PostgreSQL to start..."
sleep 5

# 5. Verify the configuration
echo "✅ Verifying PostgreSQL configuration..."
sudo -u postgres psql -c "SHOW wal_level;"
sudo -u postgres psql -c "SHOW max_replication_slots;"
sudo -u postgres psql -c "SHOW max_wal_senders;"

# 6. Test connection with the expected credentials
echo "🔌 Testing database connection..."
PGPASSWORD='CRM_Secure_Password_2025' psql -h 172.17.0.1 -U postgres -d crm -c "SELECT version();" || {
    echo "❌ Connection test failed. Checking if postgres user has the right password..."

    # Set the postgres user password if needed
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'CRM_Secure_Password_2025';"

    # Test again
    PGPASSWORD='CRM_Secure_Password_2025' psql -h 172.17.0.1 -U postgres -d crm -c "SELECT version();"
}

echo "✅ PostgreSQL is now configured for Supabase!"
echo ""
echo "📋 Configuration Summary:"
echo "  - wal_level: logical"
echo "  - max_replication_slots: 10"
echo "  - max_wal_senders: 10"
echo "  - postgres user password: CRM_Secure_Password_2025"
echo "  - Database accessible at: 172.17.0.1:5432"
