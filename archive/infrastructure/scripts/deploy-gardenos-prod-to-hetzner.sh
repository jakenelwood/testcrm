#!/bin/bash

# 🚀 Deploy GardenOS Production to Hetzner
# Implements the recommended architecture from docs/database/supabase_patroni_strategy_roles.md

set -e  # Exit on any error

echo "🌱 GardenOS Production Deployment to Hetzner"
echo "============================================="
echo "Implementing Patroni + HAProxy + Supabase architecture"
echo ""

# Configuration
HETZNER_HOST="5.161.110.205"
HETZNER_USER="root"
DEPLOY_DIR="/opt/gardenos-prod"
BACKUP_DIR="/opt/backups"
CURRENT_DB_PASSWORD="CRM_Secure_Password_2025"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run commands on Hetzner server
run_remote() {
    ssh -o StrictHostKeyChecking=no $HETZNER_USER@$HETZNER_HOST "$1"
}

# Function to copy files to Hetzner server
copy_to_server() {
    scp -o StrictHostKeyChecking=no -r "$1" $HETZNER_USER@$HETZNER_HOST:"$2"
}

# Check if we can connect to the server
print_status "Checking connection to Hetzner server..."
if ! run_remote "echo 'Connection successful'"; then
    print_error "Cannot connect to Hetzner server. Please check your SSH configuration."
    exit 1
fi
print_success "Connected to Hetzner server"

# Step 1: Backup existing data
print_status "Step 1: Creating backup of existing database..."
echo "==============================================="

run_remote "mkdir -p $BACKUP_DIR"
BACKUP_FILE="crm_backup_$(date +%Y%m%d_%H%M%S).sql"

print_status "Backing up current database to $BACKUP_FILE..."
run_remote "PGPASSWORD='$CURRENT_DB_PASSWORD' pg_dump -h localhost -U postgres -d crm > $BACKUP_DIR/$BACKUP_FILE"

if run_remote "test -f $BACKUP_DIR/$BACKUP_FILE"; then
    print_success "Database backup created successfully"
else
    print_error "Database backup failed"
    exit 1
fi

# Step 2: Copy GardenOS production files
print_status "Step 2: Copying GardenOS production files..."
echo "============================================="

print_status "Creating deployment directory..."
run_remote "mkdir -p $DEPLOY_DIR"

print_status "Copying production configuration..."
copy_to_server "gardenos-prod/" "$DEPLOY_DIR/"

print_success "Production files copied successfully"

# Step 3: Install Docker and Docker Compose if needed
print_status "Step 3: Ensuring Docker is installed..."
echo "======================================="

run_remote "
if ! command -v docker &> /dev/null; then
    echo 'Installing Docker...'
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo 'Docker already installed'
fi

if ! command -v docker-compose &> /dev/null; then
    echo 'Installing Docker Compose...'
    curl -L \"https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo 'Docker Compose already installed'
fi
"

print_success "Docker environment ready"

# Step 4: Generate production secrets
print_status "Step 4: Generating production secrets..."
echo "======================================="

print_status "Generating secure passwords and JWT secrets..."
run_remote "
cd $DEPLOY_DIR

# Generate secure passwords
POSTGRES_PROD_PASSWORD=\$(openssl rand -base64 32)
REPLICATION_PROD_PASSWORD=\$(openssl rand -base64 32)
ADMIN_PROD_PASSWORD=\$(openssl rand -base64 32)
CRM_USER_PROD_PASSWORD=\$(openssl rand -base64 32)

# Generate JWT secrets
JWT_SECRET=\$(openssl rand -base64 64)
SECRET_KEY_BASE=\$(openssl rand -base64 96)

# Update .env.production with generated secrets
sed -i \"s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=\$POSTGRES_PROD_PASSWORD/\" .env.production
sed -i \"s/POSTGRES_REPLICATION_PASSWORD=.*/POSTGRES_REPLICATION_PASSWORD=\$REPLICATION_PROD_PASSWORD/\" .env.production
sed -i \"s/POSTGRES_ADMIN_PASSWORD=.*/POSTGRES_ADMIN_PASSWORD=\$ADMIN_PROD_PASSWORD/\" .env.production
sed -i \"s/CRM_USER_PASSWORD=.*/CRM_USER_PASSWORD=\$CRM_USER_PROD_PASSWORD/\" .env.production
sed -i \"s/JWT_SECRET=.*/JWT_SECRET=\$JWT_SECRET/\" .env.production
sed -i \"s/SECRET_KEY_BASE=.*/SECRET_KEY_BASE=\$SECRET_KEY_BASE/\" .env.production

# Update DATABASE_URL with new password
sed -i \"s|DATABASE_URL=.*|DATABASE_URL=postgres://postgres:\$POSTGRES_PROD_PASSWORD@haproxy:5000/crm|\" .env.production

echo 'Production secrets generated and configured'
"

print_success "Production secrets configured"

# Step 5: Start GardenOS production cluster
print_status "Step 5: Starting GardenOS production cluster..."
echo "==============================================="

print_status "Starting services in order: etcd -> Patroni -> HAProxy -> Supabase..."
run_remote "
cd $DEPLOY_DIR

# Load environment variables
export \$(cat .env.production | xargs)

# Start etcd first
echo 'Starting etcd...'
docker-compose up -d etcd

# Wait for etcd to be healthy
echo 'Waiting for etcd to be ready...'
sleep 10

# Start Patroni cluster
echo 'Starting Patroni cluster...'
docker-compose up -d postgres-1 postgres-2 postgres-3

# Wait for Patroni cluster to initialize
echo 'Waiting for Patroni cluster to initialize...'
sleep 30

# Start HAProxy
echo 'Starting HAProxy...'
docker-compose up -d haproxy

# Wait for HAProxy to be ready
echo 'Waiting for HAProxy to be ready...'
sleep 10

# Start Supabase services (excluding analytics per recommendations)
echo 'Starting Supabase services...'
docker-compose up -d supabase-auth supabase-rest supabase-realtime supabase-storage supabase-meta supabase-studio

# Start Redis
echo 'Starting Redis...'
docker-compose up -d redis

echo 'All services started'
"

print_success "GardenOS production cluster started"

# Step 6: Restore data to new cluster
print_status "Step 6: Restoring data to new Patroni cluster..."
echo "================================================="

print_status "Waiting for cluster to be fully ready..."
sleep 30

print_status "Creating database and restoring data..."
run_remote "
cd $DEPLOY_DIR

# Get the new postgres password
POSTGRES_PROD_PASSWORD=\$(grep '^POSTGRES_PASSWORD=' .env.production | cut -d'=' -f2)

# Create database if it doesn't exist
echo 'Creating CRM database...'
PGPASSWORD=\"\$POSTGRES_PROD_PASSWORD\" psql -h localhost -p 5000 -U postgres -c 'CREATE DATABASE crm;' || echo 'Database already exists'

# Restore data
echo 'Restoring database from backup...'
PGPASSWORD=\"\$POSTGRES_PROD_PASSWORD\" psql -h localhost -p 5000 -U postgres -d crm < $BACKUP_DIR/$BACKUP_FILE

echo 'Database restoration completed'
"

print_success "Data restored to new cluster"

# Step 7: Verify deployment
print_status "Step 7: Verifying deployment..."
echo "==============================="

print_status "Checking service status..."
run_remote "
cd $DEPLOY_DIR
docker-compose ps
"

print_status "Testing database connectivity..."
run_remote "
cd $DEPLOY_DIR
POSTGRES_PROD_PASSWORD=\$(grep '^POSTGRES_PASSWORD=' .env.production | cut -d'=' -f2)

# Test primary connection
echo 'Testing primary database connection...'
PGPASSWORD=\"\$POSTGRES_PROD_PASSWORD\" psql -h localhost -p 5000 -U postgres -d crm -c 'SELECT version();'

# Test replica connection
echo 'Testing replica database connection...'
PGPASSWORD=\"\$POSTGRES_PROD_PASSWORD\" psql -h localhost -p 5001 -U postgres -d crm -c 'SELECT version();'
"

print_status "Checking HAProxy stats..."
run_remote "curl -s http://localhost:7000/stats | grep -o 'postgres-[0-9]' | head -3"

print_success "Deployment verification completed"

# Step 8: Display connection information
print_status "Step 8: Deployment Summary"
echo "=========================="

echo ""
print_success "🎉 GardenOS Production Deployment Completed Successfully!"
echo ""
echo "📋 Connection Information:"
echo "  • HAProxy (Primary):     $HETZNER_HOST:5000"
echo "  • HAProxy (Replicas):    $HETZNER_HOST:5001"
echo "  • HAProxy Stats:         http://$HETZNER_HOST:7000/stats"
echo "  • Supabase REST API:     http://$HETZNER_HOST:3000"
echo "  • Supabase Auth:         http://$HETZNER_HOST:9999"
echo "  • Supabase Studio:       http://$HETZNER_HOST:3001"
echo "  • Supabase Realtime:     http://$HETZNER_HOST:4000"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update your local .env.local to connect to HAProxy"
echo "  2. Test localhost:3000 connectivity"
echo "  3. Verify high availability with failover testing"
echo ""
echo "📁 Files:"
echo "  • Production config:     $DEPLOY_DIR"
echo "  • Database backup:       $BACKUP_DIR/$BACKUP_FILE"
echo ""

print_warning "Remember to update your local environment configuration!"

echo ""
print_success "Deployment completed successfully! 🚀"
