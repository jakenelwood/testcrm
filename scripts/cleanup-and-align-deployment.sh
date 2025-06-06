#!/bin/bash

# 🧹 Comprehensive Cleanup and Alignment Script
# Ensures local and server directories are perfectly aligned and DRY

set -e

# Configuration
HETZNER_HOST="5.161.110.205"
DEPLOY_DIR="/opt/gardenos-dev"
LOCAL_SOURCE="deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

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

print_cleanup() {
    echo -e "${PURPLE}[CLEANUP]${NC} $1"
}

# Function to run commands on server
run_remote() {
    ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "$1"
}

echo "🧹 Comprehensive Cleanup and Alignment"
echo "======================================"
echo ""

# Check connection
print_status "Testing connection to Hetzner server..."
if ! run_remote "echo 'Connected'" >/dev/null 2>&1; then
    print_error "Cannot connect to Hetzner server"
    exit 1
fi
print_success "Connected to Hetzner server"
echo ""

# Step 1: Stop all services
print_cleanup "Step 1: Stopping all services..."
run_remote "cd $DEPLOY_DIR && docker-compose down" || print_warning "Some services were already stopped"
echo ""

# Step 2: Clean up old directories on server
print_cleanup "Step 2: Cleaning up old directories on server..."
run_remote "cd $DEPLOY_DIR && ls -la"
echo ""

print_cleanup "Removing old gardenos-hetzner-dev directory..."
run_remote "cd $DEPLOY_DIR && rm -rf gardenos-hetzner-dev" || print_warning "Directory already removed"

print_cleanup "Removing any deployment subdirectory..."
run_remote "cd $DEPLOY_DIR && rm -rf deployment" || print_warning "Directory already removed"

print_cleanup "Server directory after cleanup:"
run_remote "cd $DEPLOY_DIR && ls -la"
echo ""

# Step 3: Ensure local deployment directory is complete
print_cleanup "Step 3: Verifying local deployment directory..."
if [ ! -d "$LOCAL_SOURCE" ]; then
    print_error "Local deployment directory not found!"
    exit 1
fi

print_status "Local deployment directory contents:"
ls -la $LOCAL_SOURCE/
echo ""

# Ensure storage directory exists locally
if [ ! -d "$LOCAL_SOURCE/storage" ]; then
    print_cleanup "Creating missing storage directory..."
    mkdir -p $LOCAL_SOURCE/storage
fi

# Step 4: Deploy clean files
print_cleanup "Step 4: Deploying clean files to server..."

# Copy docker-compose.yml
print_status "Copying docker-compose.yml..."
scp $LOCAL_SOURCE/docker-compose.yml root@$HETZNER_HOST:$DEPLOY_DIR/

# Copy environment files
print_status "Copying environment files..."
scp $LOCAL_SOURCE/.env.development root@$HETZNER_HOST:$DEPLOY_DIR/

# Copy configuration directories
for dir in "haproxy" "patroni" "postgres" "backend" "storage"; do
    if [ -d "$LOCAL_SOURCE/$dir" ]; then
        print_status "Copying $dir directory..."
        scp -r $LOCAL_SOURCE/$dir/ root@$HETZNER_HOST:$DEPLOY_DIR/
    else
        print_warning "$dir directory not found locally"
    fi
done

# Step 5: Generate .env file on server
print_cleanup "Step 5: Generating .env file on server..."
run_remote "cd $DEPLOY_DIR && grep '^[A-Z][A-Z_]*=' .env.development | grep -v '#' | grep -v '\$(' > .env"

# Step 6: Verify deployment structure
print_cleanup "Step 6: Verifying server deployment structure..."
run_remote "cd $DEPLOY_DIR && ls -la"
echo ""

# Step 7: Validate Docker Compose configuration
print_cleanup "Step 7: Validating Docker Compose configuration..."
if run_remote "cd $DEPLOY_DIR && docker-compose config --quiet"; then
    print_success "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration has errors!"
    run_remote "cd $DEPLOY_DIR && docker-compose config 2>&1 | head -10"
    echo ""
fi

# Step 8: Clean up local project structure
print_cleanup "Step 8: Reviewing local project structure for cleanup opportunities..."
echo ""
print_status "Current _archive directory contents:"
ls -la _archive/ | head -10
echo ""

print_warning "Consider cleaning up these duplicate directories in _archive:"
ls -la _archive/ | grep -E "(gardenos|deployment)" || echo "No duplicate directories found"
echo ""

print_success "Cleanup and alignment completed! 🧹"
echo ""
print_status "Next steps:"
echo "1. Run: ./scripts/start-services-sequentially.sh"
echo "2. Monitor: ./scripts/monitor-hetzner-deployment.sh"
echo "3. Test connectivity to verify everything works"
echo ""
print_status "Server structure is now aligned with local deployment/ directory"
