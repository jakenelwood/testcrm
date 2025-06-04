#!/bin/bash

# 🔍 Deep Debugging Script for Service Failures
# Comprehensive analysis of why services are failing

set -e

# Configuration
HETZNER_HOST="5.161.110.205"
DEPLOY_DIR="/opt/gardenos-dev"

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

print_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
}

# Function to run commands on server and capture output
run_remote() {
    ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "cd $DEPLOY_DIR && $1" 2>&1
}

echo "🔍 Deep Service Failure Analysis"
echo "================================"
echo ""

# Check connection
print_status "Testing connection to Hetzner server..."
if ! ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "echo 'Connected'" >/dev/null 2>&1; then
    print_error "Cannot connect to Hetzner server"
    exit 1
fi
print_success "Connected to Hetzner server"
echo ""

# 1. Check Docker Compose file syntax
print_status "1. Validating Docker Compose configuration..."
echo "----------------------------------------"
run_remote "docker-compose config --quiet" && print_success "Docker Compose syntax is valid" || print_error "Docker Compose syntax error"
echo ""

# 2. Check environment variables
print_status "2. Checking critical environment variables..."
echo "----------------------------------------"
run_remote "grep -E '^(POSTGRES_PASSWORD|JWT_SECRET|ANON_KEY|SERVICE_ROLE_KEY)=' .env | head -4"
echo ""

# 3. Check volume mounts and permissions
print_status "3. Checking volume mounts and permissions..."
echo "----------------------------------------"
run_remote "ls -la storage/ 2>/dev/null || echo 'Storage directory missing'"
run_remote "ls -la haproxy/ 2>/dev/null || echo 'HAProxy directory missing'"
run_remote "ls -la patroni/ 2>/dev/null || echo 'Patroni directory missing'"
echo ""

# 4. Analyze specific service failures
print_status "4. Analyzing failed services..."
echo "----------------------------------------"

# HAProxy logs
print_debug "HAProxy container logs (last 20 lines):"
run_remote "docker logs gardenos-haproxy-dev --tail=20 2>&1 || echo 'HAProxy container not found'"
echo ""

# Auth service logs
print_debug "Supabase Auth container logs (last 20 lines):"
run_remote "docker logs gardenos-auth-dev --tail=20 2>&1 || echo 'Auth container not found'"
echo ""

# Storage service logs
print_debug "Supabase Storage container logs (last 20 lines):"
run_remote "docker logs gardenos-storage-dev --tail=20 2>&1 || echo 'Storage container not found'"
echo ""

# Realtime service logs
print_debug "Supabase Realtime container logs (last 20 lines):"
run_remote "docker logs gardenos-realtime-dev --tail=20 2>&1 || echo 'Realtime container not found'"
echo ""

# 5. Check PostgreSQL cluster status
print_status "5. Checking PostgreSQL cluster status..."
echo "----------------------------------------"
run_remote "docker logs gardenos-postgres-1-dev --tail=10 2>&1 | grep -E '(ready|error|failed|started)' || echo 'No status messages found'"
echo ""

# 6. Check Patroni API endpoints
print_status "6. Testing Patroni API endpoints..."
echo "----------------------------------------"
run_remote "curl -s http://localhost:8008/health 2>/dev/null && echo 'Node 1: Healthy' || echo 'Node 1: Not responding'"
run_remote "curl -s http://localhost:8009/health 2>/dev/null && echo 'Node 2: Healthy' || echo 'Node 2: Not responding'"
run_remote "curl -s http://localhost:8010/health 2>/dev/null && echo 'Node 3: Healthy' || echo 'Node 3: Not responding'"
echo ""

# 7. Check network connectivity between containers
print_status "7. Testing container network connectivity..."
echo "----------------------------------------"
run_remote "docker exec gardenos-postgres-1-dev ping -c 2 gardenos-postgres-2-dev 2>/dev/null && echo 'Postgres nodes can communicate' || echo 'Postgres nodes cannot communicate'"
echo ""

# 8. Check HAProxy configuration file
print_status "8. Checking HAProxy configuration..."
echo "----------------------------------------"
run_remote "cat haproxy/haproxy-dev.cfg | grep -E '(server postgres|gardenos-postgres)' || echo 'No postgres servers found in HAProxy config'"
echo ""

# 9. Check if services are trying to start in correct order
print_status "9. Checking service startup order and dependencies..."
echo "----------------------------------------"
run_remote "docker-compose ps --format 'table {{.Name}}\t{{.State}}\t{{.Status}}'"
echo ""

# 10. Check disk space and resources
print_status "10. Checking system resources..."
echo "----------------------------------------"
run_remote "df -h / | tail -1"
run_remote "free -h | head -2"
echo ""

# 11. Check for port conflicts
print_status "11. Checking for port conflicts..."
echo "----------------------------------------"
run_remote "netstat -tlnp | grep -E ':(5000|5001|5002|7000|9999|3000|3001|4000)' || echo 'No port conflicts detected'"
echo ""

print_status "Debug analysis complete. Review the output above for specific error patterns."
