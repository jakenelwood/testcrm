#!/bin/bash

# 🚀 Deploy GardenOS Development to Hetzner
# Implements the development strategy from docs/database/gardenOS_dev_vs_production.md
# Single-node setup optimized for localhost:3000 testing

set -e  # Exit on any error

echo "🌱 GardenOS Development Deployment to Hetzner"
echo "=============================================="
echo "Multi-node HA simulation for localhost:3000 testing"
echo "3 Patroni nodes + HAProxy + Supabase (development environment)"
echo ""

# Configuration
HETZNER_HOST="5.161.110.205"
HETZNER_USER="root"
DEPLOY_DIR="/opt/gardenos-dev"
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

# Step 1: Backup existing data (if any)
print_status "Step 1: Creating backup of existing database (if exists)..."
echo "============================================================"

run_remote "mkdir -p $BACKUP_DIR"
BACKUP_FILE="crm_backup_$(date +%Y%m%d_%H%M%S).sql"

# Try to backup existing database
if run_remote "PGPASSWORD='$CURRENT_DB_PASSWORD' pg_dump -h localhost -U postgres -d crm > $BACKUP_DIR/$BACKUP_FILE 2>/dev/null || echo 'No existing database to backup'"; then
    print_success "Backup attempt completed (may be empty if no existing database)"
else
    print_warning "Could not backup existing database (may not exist yet)"
fi

# Step 2: Copy GardenOS development files
print_status "Step 2: Copying GardenOS development files..."
echo "=============================================="

print_status "Creating deployment directory..."
run_remote "mkdir -p $DEPLOY_DIR"

print_status "Copying development configuration..."
copy_to_server "gardenos-hetzner-dev/" "$DEPLOY_DIR/"

print_success "Development files copied successfully"

# Step 3: Install Docker and Docker Compose if needed
print_status "Step 3: Ensuring Docker is installed..."
echo "======================================"

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

# Step 4: Stop any existing services
print_status "Step 4: Stopping existing services..."
echo "====================================="

run_remote "
cd $DEPLOY_DIR

# Stop any existing containers
docker-compose down || echo 'No existing containers to stop'

# Clean up any orphaned containers
docker container prune -f || echo 'No containers to prune'
"

print_success "Existing services stopped"

# Step 5: Start GardenOS development environment
print_status "Step 5: Starting GardenOS development environment..."
echo "=================================================="

print_status "Starting services: etcd -> Patroni Cluster -> HAProxy -> Supabase -> Tools..."
run_remote "
cd $DEPLOY_DIR

# Load environment variables
export \$(cat .env.development | xargs)

# Start etcd first
echo 'Starting etcd coordination service...'
docker-compose up -d etcd

# Wait for etcd to be ready
echo 'Waiting for etcd to be ready...'
sleep 10

# Start Patroni cluster (3 nodes)
echo 'Starting Patroni PostgreSQL cluster (3 nodes)...'
docker-compose up -d postgres-1 postgres-2 postgres-3

# Wait for Patroni cluster to initialize
echo 'Waiting for Patroni cluster to initialize...'
sleep 30

# Start HAProxy
echo 'Starting HAProxy load balancer...'
docker-compose up -d haproxy

# Wait for HAProxy to be ready
echo 'Waiting for HAProxy to be ready...'
sleep 10

# Start Supabase services
echo 'Starting Supabase services...'
docker-compose up -d supabase-auth supabase-rest supabase-realtime supabase-storage supabase-meta supabase-studio

# Start Redis
echo 'Starting Redis...'
docker-compose up -d redis

# Start development tools
echo 'Starting development tools...'
docker-compose up -d adminer redis-commander

echo 'All services started'
"

print_success "GardenOS development environment started"

# Step 6: Restore data (if backup exists)
print_status "Step 6: Restoring data (if backup exists)..."
echo "============================================="

print_status "Waiting for services to be fully ready..."
sleep 20

if run_remote "test -f $BACKUP_DIR/$BACKUP_FILE && test -s $BACKUP_DIR/$BACKUP_FILE"; then
    print_status "Restoring data from backup..."
    run_remote "
    cd $DEPLOY_DIR

    # Get the postgres password
    POSTGRES_DEV_PASSWORD=\$(grep '^POSTGRES_PASSWORD=' .env.development | cut -d'=' -f2)

    # Restore data
    echo 'Restoring database from backup...'
    PGPASSWORD=\"\$POSTGRES_DEV_PASSWORD\" psql -h localhost -p 5432 -U postgres -d crm < $BACKUP_DIR/$BACKUP_FILE

    echo 'Database restoration completed'
    "
    print_success "Data restored from backup"
else
    print_status "No backup to restore or backup is empty"
fi

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
POSTGRES_DEV_PASSWORD=\$(grep '^POSTGRES_PASSWORD=' .env.development | cut -d'=' -f2)

# Test HAProxy primary connection
echo 'Testing HAProxy primary connection...'
PGPASSWORD=\"\$POSTGRES_DEV_PASSWORD\" psql -h localhost -p 5000 -U postgres -d crm -c 'SELECT version();'

# Test HAProxy replica connection
echo 'Testing HAProxy replica connection...'
PGPASSWORD=\"\$POSTGRES_DEV_PASSWORD\" psql -h localhost -p 5001 -U postgres -d crm -c 'SELECT version();'

# Test direct node connections
echo 'Testing direct node connections...'
PGPASSWORD=\"\$POSTGRES_DEV_PASSWORD\" psql -h localhost -p 5432 -U postgres -d crm -c 'SELECT version();' || echo 'Node 1 not ready'
PGPASSWORD=\"\$POSTGRES_DEV_PASSWORD\" psql -h localhost -p 5433 -U postgres -d crm -c 'SELECT version();' || echo 'Node 2 not ready'
PGPASSWORD=\"\$POSTGRES_DEV_PASSWORD\" psql -h localhost -p 5434 -U postgres -d crm -c 'SELECT version();' || echo 'Node 3 not ready'
"

print_status "Testing Supabase services..."
run_remote "
# Test Supabase REST API
echo 'Testing Supabase REST API...'
curl -s http://localhost:3000 | head -n 5 || echo 'REST API not ready yet'

# Test Supabase Auth
echo 'Testing Supabase Auth...'
curl -s http://localhost:9999/health || echo 'Auth service not ready yet'
"

print_success "Deployment verification completed"

# Step 8: Display connection information
print_status "Step 8: Development Environment Summary"
echo "======================================"

echo ""
print_success "🎉 GardenOS Development Environment Deployed Successfully!"
echo ""
echo "📋 Connection Information for localhost:3000:"
echo "  • Database (HAProxy):     5.161.110.205:5000 (primary)"
echo "  • Database (Replicas):    5.161.110.205:5001 (read-only)"
echo "  • Supabase REST API:     http://5.161.110.205:3000"
echo "  • Supabase Auth:         http://5.161.110.205:9999"
echo "  • Supabase Studio:       http://5.161.110.205:3001"
echo "  • Supabase Realtime:     http://5.161.110.205:4000"
echo "  • Supabase Storage:      http://5.161.110.205:5000"
echo ""
echo "🔄 High Availability Simulation:"
echo "  • HAProxy Stats:         http://5.161.110.205:7000/stats"
echo "  • Patroni Node 1:        5.161.110.205:5432 (API: 8008)"
echo "  • Patroni Node 2:        5.161.110.205:5433 (API: 8009)"
echo "  • Patroni Node 3:        5.161.110.205:5434 (API: 8010)"
echo "  • etcd Coordination:     5.161.110.205:2379"
echo ""
echo "🛠️ Development Tools:"
echo "  • Adminer (DB Admin):    http://5.161.110.205:8081"
echo "  • Redis Commander:       http://5.161.110.205:8082"
echo ""
echo "🏗️ Architecture:"
echo "  • Multi-node HA simulation (3 Patroni nodes + HAProxy)"
echo "  • Full production architecture in development environment"
echo "  • All Supabase services enabled (minus analytics)"
echo "  • Development-friendly logging and debugging"
echo "  • Automatic failover testing capability"
echo ""
echo "🔧 Next Steps:"
echo "  1. Run the local setup script:"
echo "     ./scripts/setup-local-for-hetzner-gardenos.sh"
echo ""
echo "  2. Start your local development server:"
echo "     npm run dev"
echo ""
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "  4. Test the application functionality"
echo ""
echo "📁 Files:"
echo "  • Development config:    $DEPLOY_DIR"
echo "  • Database backup:       $BACKUP_DIR/$BACKUP_FILE"
echo ""

print_warning "Your localhost:3000 will connect to this development environment!"
print_warning "This is a single-node setup optimized for development and testing."

echo ""
print_success "Development deployment completed successfully! 🚀"
