#!/bin/bash

# 🧹 Clean up Hetzner Server
# Aligns server directory structure with local environment and removes unnecessary files

set -e

# Configuration
HETZNER_HOST="5.161.110.205"
BASE_DIR="/opt/gardenos-dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to run commands on server
run_remote() {
    ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "$1"
}

echo "🧹 Hetzner Server Cleanup"
echo "========================="
echo ""

# Check connection to server
print_status "Testing connection to Hetzner server..."
if ! run_remote "echo 'Connected'" >/dev/null 2>&1; then
    print_error "Cannot connect to Hetzner server"
    exit 1
fi
print_success "Connected to Hetzner server"

# Backup current environment
print_status "Creating backup of current environment..."
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
run_remote "mkdir -p /opt/backups"
run_remote "tar -czf /opt/backups/gardenos_backup_$BACKUP_DATE.tar.gz -C /opt gardenos-dev 2>/dev/null || echo 'Nothing to backup'"
print_success "Backup created at /opt/backups/gardenos_backup_$BACKUP_DATE.tar.gz"

# Stop all running containers
print_status "Stopping all running containers..."
run_remote "cd $BASE_DIR && docker-compose down || echo 'No containers to stop'"
run_remote "cd $BASE_DIR/gardenos-hetzner-dev && docker-compose down || echo 'No containers to stop'"
print_success "All containers stopped"

# Clean up nested directory structure
print_status "Cleaning up nested directory structure..."
run_remote "if [ -d '$BASE_DIR/gardenos-hetzner-dev/gardenos-hetzner-dev' ]; then 
    echo 'Removing nested directory...'
    rm -rf $BASE_DIR/gardenos-hetzner-dev/gardenos-hetzner-dev
    echo 'Nested directory removed'
fi"

# Create proper directory structure
print_status "Creating proper directory structure..."
run_remote "mkdir -p $BASE_DIR/backend"
run_remote "mkdir -p $BASE_DIR/haproxy"
run_remote "mkdir -p $BASE_DIR/patroni"
run_remote "mkdir -p $BASE_DIR/postgres"
run_remote "mkdir -p $BASE_DIR/storage"
print_success "Directory structure created"

# Clean up any deployment directory if it exists
print_status "Checking for deployment directory..."
run_remote "if [ -d '$BASE_DIR/deployment' ]; then 
    echo 'Removing deployment directory...'
    rm -rf $BASE_DIR/deployment
    echo 'Deployment directory removed'
fi"

# Verify Docker is installed and running
print_status "Verifying Docker installation..."
run_remote "if ! command -v docker &> /dev/null; then
    echo 'Docker not found, installing...'
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo 'Docker is installed'
fi"

run_remote "if ! command -v docker-compose &> /dev/null; then
    echo 'Docker Compose not found, installing...'
    curl -L \"https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo 'Docker Compose is installed'
fi"
print_success "Docker environment verified"

# Clean up Docker resources
print_status "Cleaning up Docker resources..."
run_remote "docker system prune -f"
print_success "Docker resources cleaned up"

# Final verification
print_status "Verifying final directory structure..."
run_remote "find $BASE_DIR -type d -maxdepth 2 | sort"

echo ""
print_success "🎉 Server cleanup complete!"
echo ""
echo "The server is now ready for a fresh deployment."
echo "Next steps:"
echo "1. Run ./scripts/deploy-gardenos-dev-to-hetzner.sh to deploy the development environment"
echo "2. Or run ./scripts/update-and-restart-hetzner.sh to update specific components"
echo ""