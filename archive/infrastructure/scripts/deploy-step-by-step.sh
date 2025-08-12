#!/bin/bash

# 🚀 Step-by-Step GardenOS Deployment
# Deploy services one by one with real-time feedback

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

# Function to run command and show real-time output
run_step() {
    local cmd="$1"
    local description="$2"
    local wait_time="${3:-5}"
    
    print_status "$description"
    echo "Command: $cmd"
    echo "----------------------------------------"
    
    ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "cd $DEPLOY_DIR && $cmd"
    local exit_code=$?
    
    echo "----------------------------------------"
    if [ $exit_code -eq 0 ]; then
        print_success "$description completed successfully"
        if [ $wait_time -gt 0 ]; then
            print_status "Waiting ${wait_time} seconds for service to stabilize..."
            sleep $wait_time
        fi
    else
        print_error "$description failed with exit code $exit_code"
        read -p "Continue anyway? (y/n): " continue_choice
        if [ "$continue_choice" != "y" ]; then
            exit 1
        fi
    fi
    echo ""
    return $exit_code
}

# Function to check service health
check_service() {
    local service="$1"
    local description="$2"
    
    print_status "Checking $description..."
    ssh root@$HETZNER_HOST "cd $DEPLOY_DIR && docker-compose ps $service" 2>/dev/null || print_warning "$service not found"
}

echo "🚀 GardenOS Step-by-Step Deployment"
echo "==================================="
echo ""

# Step 1: Verify configuration
print_status "Step 1: Verifying Docker Compose configuration..."
run_step "docker-compose config --quiet && echo 'Configuration is valid!'" "Configuration validation" 0

# Step 2: Start etcd
print_status "Step 2: Starting etcd coordination service..."
run_step "docker-compose --env-file .env up -d etcd" "Starting etcd" 10
check_service "etcd" "etcd coordination service"

# Step 3: Start Patroni cluster
print_status "Step 3: Starting Patroni PostgreSQL cluster (3 nodes)..."
run_step "docker-compose --env-file .env up -d postgres-1" "Starting Patroni Node 1" 15
check_service "postgres-1" "Patroni Node 1"

run_step "docker-compose --env-file .env up -d postgres-2" "Starting Patroni Node 2" 10
check_service "postgres-2" "Patroni Node 2"

run_step "docker-compose --env-file .env up -d postgres-3" "Starting Patroni Node 3" 10
check_service "postgres-3" "Patroni Node 3"

# Step 4: Start HAProxy
print_status "Step 4: Starting HAProxy load balancer..."
run_step "docker-compose --env-file .env up -d haproxy" "Starting HAProxy" 10
check_service "haproxy" "HAProxy load balancer"

# Step 5: Test database connectivity
print_status "Step 5: Testing database connectivity..."
run_step "PGPASSWORD=\$(grep '^POSTGRES_PASSWORD=' .env | cut -d'=' -f2) psql -h localhost -p 5000 -U postgres -d crm -c 'SELECT version();' || echo 'Database not ready yet'" "Testing database connection" 5

# Step 6: Start Supabase services
print_status "Step 6: Starting Supabase services..."
run_step "docker-compose --env-file .env up -d supabase-auth" "Starting Supabase Auth" 10
check_service "supabase-auth" "Supabase Auth service"

run_step "docker-compose --env-file .env up -d supabase-rest" "Starting Supabase REST API" 10
check_service "supabase-rest" "Supabase REST API"

run_step "docker-compose --env-file .env up -d supabase-meta" "Starting Supabase Meta" 5
check_service "supabase-meta" "Supabase Meta service"

run_step "docker-compose --env-file .env up -d supabase-studio" "Starting Supabase Studio" 5
check_service "supabase-studio" "Supabase Studio"

run_step "docker-compose --env-file .env up -d supabase-realtime" "Starting Supabase Realtime" 5
check_service "supabase-realtime" "Supabase Realtime"

run_step "docker-compose --env-file .env up -d supabase-storage" "Starting Supabase Storage" 5
check_service "supabase-storage" "Supabase Storage"

# Step 7: Start development tools
print_status "Step 7: Starting development tools..."
run_step "docker-compose --env-file .env up -d redis" "Starting Redis" 5
check_service "redis" "Redis cache"

run_step "docker-compose --env-file .env up -d adminer" "Starting Adminer" 5
check_service "adminer" "Adminer database admin"

run_step "docker-compose --env-file .env up -d redis-commander" "Starting Redis Commander" 5
check_service "redis-commander" "Redis Commander"

# Step 8: Optional FastAPI backend
print_status "Step 8: Starting FastAPI backend (optional)..."
run_step "docker-compose --env-file .env up -d fastapi-backend || echo 'FastAPI backend skipped'" "Starting FastAPI backend" 10

# Step 9: Final status check
print_status "Step 9: Final deployment status..."
run_step "docker-compose ps" "Checking all services" 0

# Step 10: Service URLs
print_status "Step 10: Deployment Summary"
echo "=============================="
echo ""
print_success "🎉 GardenOS Development Environment Deployed!"
echo ""
echo "📋 Service URLs:"
echo "  • HAProxy Stats:         http://5.161.110.205:7000/stats"
echo "  • Supabase REST API:     http://5.161.110.205:3000"
echo "  • Supabase Auth:         http://5.161.110.205:9999"
echo "  • Supabase Studio:       http://5.161.110.205:3001"
echo "  • Supabase Realtime:     http://5.161.110.205:4000"
echo "  • Supabase Storage:      http://5.161.110.205:5000"
echo "  • Adminer (DB Admin):    http://5.161.110.205:8081"
echo "  • Redis Commander:       http://5.161.110.205:8082"
echo "  • FastAPI Backend:       http://5.161.110.205:8000"
echo ""
echo "🔄 Database Connections:"
echo "  • Primary (R/W):         5.161.110.205:5000"
echo "  • Replicas (R/O):        5.161.110.205:5001"
echo "  • Direct Node 1:         5.161.110.205:5432"
echo "  • Direct Node 2:         5.161.110.205:5433"
echo "  • Direct Node 3:         5.161.110.205:5434"
echo ""
echo "🔧 Next Steps:"
echo "  1. Run: ./scripts/setup-local-for-hetzner-gardenos.sh"
echo "  2. Start: npm run dev"
echo "  3. Open: http://localhost:3000"
echo ""
print_success "Deployment completed! 🚀"
