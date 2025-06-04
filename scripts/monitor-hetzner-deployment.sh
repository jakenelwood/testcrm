#!/bin/bash

# 📊 Monitor Hetzner GardenOS Deployment
# Real-time monitoring script for deployment progress

set -e

# Configuration
HETZNER_HOST="5.161.110.205"
DEPLOY_DIR="/opt/gardenos-dev/deployment"

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

# Function to run commands on server and show output
run_and_show() {
    local cmd="$1"
    local description="$2"
    
    print_status "$description"
    echo "Command: $cmd"
    echo "----------------------------------------"
    
    ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "cd $DEPLOY_DIR && $cmd" 2>&1
    local exit_code=$?
    
    echo "----------------------------------------"
    if [ $exit_code -eq 0 ]; then
        print_success "$description completed successfully"
    else
        print_error "$description failed with exit code $exit_code"
    fi
    echo ""
    return $exit_code
}

echo "📊 GardenOS Hetzner Deployment Monitor"
echo "======================================"
echo ""

# Check if we can connect
print_status "Testing connection to Hetzner server..."
if ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "echo 'Connected successfully'" 2>/dev/null; then
    print_success "Connected to Hetzner server"
else
    print_error "Cannot connect to Hetzner server"
    exit 1
fi

echo ""

# Menu for monitoring options
while true; do
    echo "Select monitoring option:"
    echo "1. Check Docker Compose configuration"
    echo "2. View current service status"
    echo "3. Start services step by step"
    echo "4. View service logs"
    echo "5. Test database connectivity"
    echo "6. Monitor HAProxy stats"
    echo "7. Check Patroni cluster status"
    echo "8. Full deployment status"
    echo "9. Exit"
    echo ""
    read -p "Enter your choice (1-9): " choice

    case $choice in
        1)
            run_and_show "docker-compose config --quiet && echo 'Configuration is valid!'" "Checking Docker Compose configuration"
            ;;
        2)
            run_and_show "docker-compose ps" "Checking service status"
            ;;
        3)
            echo "Starting services step by step..."
            run_and_show "docker-compose --env-file .env up -d etcd" "Starting etcd"
            sleep 5
            run_and_show "docker-compose --env-file .env up -d postgres-1 postgres-2 postgres-3" "Starting Patroni cluster"
            sleep 15
            run_and_show "docker-compose --env-file .env up -d haproxy" "Starting HAProxy"
            sleep 5
            run_and_show "docker-compose --env-file .env up -d supabase-auth supabase-rest supabase-realtime supabase-storage supabase-meta supabase-studio" "Starting Supabase services"
            sleep 5
            run_and_show "docker-compose --env-file .env up -d redis adminer redis-commander" "Starting development tools"
            ;;
        4)
            echo "Available services:"
            ssh root@$HETZNER_HOST "cd $DEPLOY_DIR && docker-compose ps --format table" 2>/dev/null || echo "No services running"
            echo ""
            read -p "Enter service name to view logs (or 'all' for all services): " service
            if [ "$service" = "all" ]; then
                run_and_show "docker-compose logs --tail=50" "Viewing all service logs"
            else
                run_and_show "docker-compose logs --tail=50 $service" "Viewing logs for $service"
            fi
            ;;
        5)
            echo "Testing database connectivity..."
            run_and_show "PGPASSWORD=\$(grep '^POSTGRES_PASSWORD=' .env | cut -d'=' -f2) psql -h localhost -p 5000 -U postgres -d crm -c 'SELECT version();'" "Testing HAProxy primary connection"
            run_and_show "PGPASSWORD=\$(grep '^POSTGRES_PASSWORD=' .env | cut -d'=' -f2) psql -h localhost -p 5001 -U postgres -d crm -c 'SELECT version();'" "Testing HAProxy replica connection"
            ;;
        6)
            run_and_show "curl -s http://localhost:7000/stats | grep -E '(postgres-[0-9]|Status)' | head -10" "Checking HAProxy stats"
            echo ""
            print_status "Full HAProxy stats available at: http://5.161.110.205:7000/stats"
            ;;
        7)
            echo "Checking Patroni cluster status..."
            run_and_show "curl -s http://localhost:8008/cluster 2>/dev/null | head -20 || echo 'Node 1 not ready'" "Patroni Node 1 status"
            run_and_show "curl -s http://localhost:8009/cluster 2>/dev/null | head -20 || echo 'Node 2 not ready'" "Patroni Node 2 status"
            run_and_show "curl -s http://localhost:8010/cluster 2>/dev/null | head -20 || echo 'Node 3 not ready'" "Patroni Node 3 status"
            ;;
        8)
            echo "Full deployment status check..."
            run_and_show "docker-compose ps" "Service status"
            run_and_show "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'" "Resource usage"
            run_and_show "curl -s http://localhost:7000/stats | grep postgres | wc -l && echo 'HAProxy backends'" "HAProxy status"
            run_and_show "curl -s http://localhost:3000 >/dev/null && echo 'Supabase REST API: OK' || echo 'Supabase REST API: FAILED'" "Supabase REST API"
            run_and_show "curl -s http://localhost:9999/health >/dev/null && echo 'Supabase Auth: OK' || echo 'Supabase Auth: FAILED'" "Supabase Auth"
            ;;
        9)
            print_status "Exiting monitor..."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please enter 1-9."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done
