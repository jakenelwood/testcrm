#!/bin/bash

# 🔍 Inspect Hetzner Server
# Examines the current state of the Hetzner server to understand directory structure and running services

set -e

# Configuration
HETZNER_HOST="5.161.110.205"

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

echo "🔍 Hetzner Server Inspection"
echo "==========================="
echo ""

# Check connection to server
print_status "Testing connection to Hetzner server..."
if ! run_remote "echo 'Connected'" >/dev/null 2>&1; then
    print_error "Cannot connect to Hetzner server"
    exit 1
fi
print_success "Connected to Hetzner server"

# Check OS information
print_status "Server OS Information:"
run_remote "cat /etc/os-release | grep -E 'NAME|VERSION'"
echo ""

# Check disk space
print_status "Disk Space Usage:"
run_remote "df -h | grep -v tmpfs"
echo ""

# Check memory usage
print_status "Memory Usage:"
run_remote "free -h"
echo ""

# Check running Docker containers
print_status "Running Docker Containers:"
run_remote "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo ""

# Check all Docker containers (including stopped)
print_status "All Docker Containers (including stopped):"
run_remote "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'"
echo ""

# Check Docker networks
print_status "Docker Networks:"
run_remote "docker network ls"
echo ""

# Check Docker volumes
print_status "Docker Volumes:"
run_remote "docker volume ls"
echo ""

# Check directory structure in /opt
print_status "Directory Structure in /opt:"
run_remote "find /opt -type d -maxdepth 3 | sort"
echo ""

# Check for docker-compose files
print_status "Docker Compose Files:"
run_remote "find /opt -name 'docker-compose.yml' | sort"
echo ""

# Check for .env files
print_status "Environment Files:"
run_remote "find /opt -name '.env*' | sort"
echo ""

# Check for specific deployment directories
print_status "Checking specific deployment directories:"
for dir in "/opt/gardenos-dev" "/opt/gardenos-dev/deployment" "/opt/gardenos-dev/gardenos-hetzner-dev" "/opt/gardenos-prod"; do
    if run_remote "test -d $dir"; then
        print_success "$dir exists"
        run_remote "ls -la $dir"
    else
        print_warning "$dir does not exist"
    fi
    echo ""
done

# Check PostgreSQL status if running
print_status "PostgreSQL Status (if running):"
run_remote "docker ps | grep -i postgres" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "PostgreSQL containers found"
    run_remote "docker ps | grep -i postgres"
    
    # Try to check PostgreSQL readiness
    print_status "Checking PostgreSQL readiness:"
    postgres_containers=$(run_remote "docker ps --format '{{.Names}}' | grep -i postgres")
    for container in $postgres_containers; do
        echo "Container: $container"
        run_remote "docker exec $container pg_isready -U postgres 2>&1 || echo 'Not ready'"
    done
else
    print_warning "No PostgreSQL containers found"
fi
echo ""

# Check HAProxy status if running
print_status "HAProxy Status (if running):"
run_remote "docker ps | grep -i haproxy" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "HAProxy container found"
    run_remote "docker ps | grep -i haproxy"
    
    # Try to check HAProxy stats
    print_status "Checking HAProxy stats:"
    run_remote "curl -s http://localhost:7000/stats | head -20 || echo 'Stats not available'"
else
    print_warning "No HAProxy container found"
fi
echo ""

print_success "Server inspection complete!"