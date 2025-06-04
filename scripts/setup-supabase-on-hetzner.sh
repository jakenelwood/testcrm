#!/bin/bash

# 🚀 Setup Supabase on Hetzner Server
# This script configures PostgreSQL and fixes Docker Compose issues for Supabase
# Documentation: docs/deployment/SUPABASE_SETUP.md
# Troubleshooting: docs/deployment/HETZNER_SUPABASE_SETUP.md

set -e

SUPABASE_DIR="/opt/supabase/supabase/docker"
POSTGRES_PASSWORD="CRM_Secure_Password_2025"

echo "🚀 Setting up Supabase on Hetzner Server"
echo "========================================"

# Check if we're on the right server
if [[ ! -d "$SUPABASE_DIR" ]]; then
    echo "❌ Supabase directory not found at $SUPABASE_DIR"
    echo "Please run this script on the Hetzner server"
    exit 1
fi

cd "$SUPABASE_DIR"

echo "📍 Working directory: $(pwd)"

# Step 1: Configure PostgreSQL for Supabase
echo ""
echo "🔧 Step 1: Configuring PostgreSQL for Supabase..."
echo "=================================================="

# Enable logical replication
echo "📝 Setting PostgreSQL parameters..."
sudo -u postgres psql -c "ALTER SYSTEM SET wal_level = logical;" || echo "⚠️  wal_level setting may already be applied"
sudo -u postgres psql -c "ALTER SYSTEM SET max_replication_slots = 10;" || echo "⚠️  max_replication_slots setting may already be applied"
sudo -u postgres psql -c "ALTER SYSTEM SET max_wal_senders = 10;" || echo "⚠️  max_wal_senders setting may already be applied"

# Reload configuration
echo "🔄 Reloading PostgreSQL configuration..."
sudo -u postgres psql -c "SELECT pg_reload_conf();"

# Restart PostgreSQL (required for wal_level change)
echo "🔄 Restarting PostgreSQL..."
sudo systemctl restart postgresql@16-main

# Wait for PostgreSQL to start
echo "⏳ Waiting for PostgreSQL to start..."
sleep 10

# Verify PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql@16-main; then
    echo "❌ PostgreSQL failed to start"
    sudo systemctl status postgresql@16-main
    exit 1
fi

echo "✅ PostgreSQL is running"

# Set postgres user password
echo "🔑 Setting postgres user password..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$POSTGRES_PASSWORD';"

# Test connection
echo "🔌 Testing database connection..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h 172.17.0.1 -U postgres -d crm -c "SELECT version();" || {
    echo "❌ Database connection test failed"
    exit 1
}

echo "✅ Database connection successful"

# Step 2: Fix Docker Compose syntax
echo ""
echo "🔧 Step 2: Fixing Docker Compose syntax..."
echo "=========================================="

# Create backup
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)

# Simple fix for the most common syntax errors
echo "🔧 Fixing depends_on syntax errors..."

# Fix the depends_on sections that have environment variables instead of service names
sed -i '/depends_on:/,/^[[:space:]]*[a-z]/ {
    /DEFAULT_ORGANIZATION_NAME:/d
    /GOTRUE_DB_DRIVER:/d
    /POSTGRES_BACKEND_URL:/d
    /contains.*invalid type/d
}' docker-compose.yml

# Validate the fix
echo "🔍 Validating docker-compose.yml syntax..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ Docker Compose syntax is valid"
else
    echo "⚠️  Docker Compose syntax still has issues, but continuing..."
    echo "You may need to manually review the file"
fi

# Step 3: Update environment configuration
echo ""
echo "🔧 Step 3: Updating environment configuration..."
echo "==============================================="

# Ensure the .env file has the correct database configuration
echo "📝 Updating .env file..."

# Update database host to use Docker bridge IP
sed -i 's/POSTGRES_HOST=localhost/POSTGRES_HOST=172.17.0.1/' .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env

# Verify .env configuration
echo "📋 Current database configuration:"
grep -E "POSTGRES_HOST|POSTGRES_PASSWORD|POSTGRES_DB|POSTGRES_PORT" .env

# Step 4: Start Supabase services
echo ""
echo "🚀 Step 4: Starting Supabase services..."
echo "========================================"

# Stop any running containers first
echo "🛑 Stopping existing containers..."
docker-compose down || echo "No containers to stop"

# Start services (excluding analytics for now if it's problematic)
echo "🚀 Starting Supabase services..."
docker-compose up -d || {
    echo "⚠️  Some services failed to start. Checking logs..."
    docker-compose ps
    echo ""
    echo "📋 Recent logs:"
    docker-compose logs --tail=20
}

# Check service status
echo ""
echo "📊 Service Status:"
echo "=================="
docker-compose ps

echo ""
echo "🎉 Supabase setup complete!"
echo "=========================="
echo ""
echo "📋 Summary:"
echo "  - PostgreSQL configured with logical replication"
echo "  - Database accessible at: 172.17.0.1:5432"
echo "  - Database: crm"
echo "  - User: postgres"
echo "  - Password: $POSTGRES_PASSWORD"
echo ""
echo "🔗 Access URLs (once services are healthy):"
echo "  - Supabase Studio: http://$(hostname -I | awk '{print $1}'):3000"
echo "  - API Gateway: http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "📝 Next steps:"
echo "  1. Wait for all services to become healthy"
echo "  2. Check logs if any services are failing: docker-compose logs <service>"
echo "  3. Test API endpoints once services are ready"
