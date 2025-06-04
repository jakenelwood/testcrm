#!/bin/bash

# 🚀 Sequential Service Startup Script
# Starts services in the correct order with proper health checks

set -e

# Configuration
HETZNER_HOST="5.161.110.205"
DEPLOY_DIR="/opt/gardenos-dev"

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
    ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "cd $DEPLOY_DIR && $1"
}

# Function to wait for service health
wait_for_service() {
    local service_name="$1"
    local health_check="$2"
    local max_wait="$3"
    local wait_time=0
    
    print_status "Waiting for $service_name to be healthy..."
    
    while [ $wait_time -lt $max_wait ]; do
        if run_remote "$health_check" >/dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi
        sleep 5
        wait_time=$((wait_time + 5))
        echo -n "."
    done
    
    print_error "$service_name failed to become healthy within ${max_wait}s"
    return 1
}

echo "🚀 Sequential Service Startup"
echo "============================="
echo ""

# Check connection
print_status "Testing connection to Hetzner server..."
if ! ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "echo 'Connected'" >/dev/null 2>&1; then
    print_error "Cannot connect to Hetzner server"
    exit 1
fi
print_success "Connected to Hetzner server"
echo ""

# Stop all services first
print_status "Stopping all services..."
run_remote "docker-compose down" || print_warning "Some services were already stopped"
echo ""

# Start services in correct order
print_status "Starting services in sequence..."
echo ""

# 1. Start etcd first (coordination service)
print_status "1. Starting etcd..."
run_remote "docker-compose up -d etcd"
wait_for_service "etcd" "curl -s http://localhost:2379/health" 30
echo ""

# 2. Start PostgreSQL cluster
print_status "2. Starting PostgreSQL cluster..."
run_remote "docker-compose up -d postgres-1 postgres-2 postgres-3"
print_status "Waiting for Patroni cluster to form (this may take 60-90 seconds)..."
sleep 30

# Check Patroni APIs
wait_for_service "Patroni Node 1" "curl -s http://localhost:8008/health" 60
wait_for_service "Patroni Node 2" "curl -s http://localhost:8009/health" 60
wait_for_service "Patroni Node 3" "curl -s http://localhost:8010/health" 60
echo ""

# 3. Start HAProxy
print_status "3. Starting HAProxy..."
run_remote "docker-compose up -d haproxy"
wait_for_service "HAProxy" "curl -s http://localhost:7000/stats" 30
echo ""

# 4. Start Redis
print_status "4. Starting Redis..."
run_remote "docker-compose up -d redis"
wait_for_service "Redis" "docker exec gardenos-redis-dev redis-cli ping" 15
echo ""

# 5. Start Supabase services
print_status "5. Starting Supabase services..."
run_remote "docker-compose up -d supabase-rest"
wait_for_service "Supabase REST" "curl -s http://localhost:3000" 30

run_remote "docker-compose up -d supabase-auth"
wait_for_service "Supabase Auth" "curl -s http://localhost:9999/health" 30

run_remote "docker-compose up -d supabase-storage"
wait_for_service "Supabase Storage" "curl -s http://localhost:5002" 30

run_remote "docker-compose up -d supabase-realtime"
wait_for_service "Supabase Realtime" "curl -s http://localhost:4000" 30

run_remote "docker-compose up -d supabase-meta"
wait_for_service "Supabase Meta" "curl -s http://localhost:8080" 30

run_remote "docker-compose up -d supabase-studio"
wait_for_service "Supabase Studio" "curl -s http://localhost:3001" 30
echo ""

# 6. Start remaining services
print_status "6. Starting remaining services..."
run_remote "docker-compose up -d fastapi-backend adminer redis-commander"
echo ""

# Final status check
print_status "Final service status check..."
run_remote "docker-compose ps"
echo ""

print_success "Sequential startup completed! 🚀"
echo ""
print_status "Service URLs:"
echo "• HAProxy Stats:      http://5.161.110.205:7000/stats"
echo "• Supabase Studio:    http://5.161.110.205:3001"
echo "• Supabase REST API:  http://5.161.110.205:3000"
echo "• Supabase Storage:   http://5.161.110.205:5002"
echo "• Adminer:            http://5.161.110.205:8081"
echo "• FastAPI Backend:    http://5.161.110.205:8000"
