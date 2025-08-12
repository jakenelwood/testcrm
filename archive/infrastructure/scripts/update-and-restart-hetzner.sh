#!/bin/bash

# 🔄 Update and Restart Hetzner GardenOS Services
# Pushes local changes to server, restarts services, and verifies updates

set -e

# Configuration
HETZNER_HOST="5.161.110.205"
DEPLOY_DIR="/opt/gardenos-dev"  # Base directory on server

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

echo "🔄 GardenOS Update and Restart Script"
echo "====================================="
echo ""

# Check connection to server
print_status "Testing connection to Hetzner server..."
if ! ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "echo 'Connected'" >/dev/null 2>&1; then
    print_error "Cannot connect to Hetzner server"
    exit 1
fi
print_success "Connected to Hetzner server"

# First, let's check what directories we have locally
print_status "Checking local directory structure..."
echo "Available directories for deployment:"
ls -la | grep "^d" | awk '{print $9}' | grep -v "^\." | sort

# Ask user which directory to use as source
echo ""
read -p "Enter the local source directory to deploy from: " LOCAL_SOURCE

# Validate the source directory
if [ ! -d "$LOCAL_SOURCE" ]; then
    print_error "Local source directory '$LOCAL_SOURCE' not found!"
    exit 1
fi
print_success "Using $LOCAL_SOURCE as the source directory"

# Menu for update options
echo ""
echo "Select update option:"
echo "1. Update docker-compose.yml only"
echo "2. Update environment files only"
echo "3. Update configuration files (patroni, haproxy)"
echo "4. Update backend code"
echo "5. Full update (all files)"
echo "6. Custom file update"
echo "7. Exit"
echo ""
read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        print_status "Updating docker-compose.yml..."
        scp "$LOCAL_SOURCE/docker-compose.yml" root@$HETZNER_HOST:"$DEPLOY_DIR/"
        print_success "docker-compose.yml updated"
        UPDATE_TYPE="docker-compose"
        ;;
    2)
        print_status "Updating environment files..."
        scp "$LOCAL_SOURCE/.env.development" root@$HETZNER_HOST:"$DEPLOY_DIR/"
        run_remote "cd $DEPLOY_DIR && grep '^[A-Z][A-Z_]*=' .env.development | grep -v '#' | grep -v '\$(' > .env"
        print_success "Environment files updated and cleaned"
        UPDATE_TYPE="environment"
        ;;
    3)
        print_status "Updating configuration files..."
        run_remote "mkdir -p $DEPLOY_DIR/patroni $DEPLOY_DIR/haproxy $DEPLOY_DIR/postgres"
        
        print_status "Copying patroni files..."
        if [ -d "$LOCAL_SOURCE/patroni" ] && [ "$(ls -A "$LOCAL_SOURCE/patroni" 2>/dev/null)" ]; then
            scp -r "$LOCAL_SOURCE/patroni/"* root@$HETZNER_HOST:"$DEPLOY_DIR/patroni/"
        else
            print_warning "No patroni files found in $LOCAL_SOURCE/patroni"
        fi
        
        print_status "Copying haproxy files..."
        if [ -d "$LOCAL_SOURCE/haproxy" ] && [ "$(ls -A "$LOCAL_SOURCE/haproxy" 2>/dev/null)" ]; then
            scp -r "$LOCAL_SOURCE/haproxy/"* root@$HETZNER_HOST:"$DEPLOY_DIR/haproxy/"
        else
            print_warning "No haproxy files found in $LOCAL_SOURCE/haproxy"
        fi
        
        print_status "Copying postgres files..."
        if [ -d "$LOCAL_SOURCE/postgres" ] && [ "$(ls -A "$LOCAL_SOURCE/postgres" 2>/dev/null)" ]; then
            scp -r "$LOCAL_SOURCE/postgres/"* root@$HETZNER_HOST:"$DEPLOY_DIR/postgres/"
        else
            print_warning "No postgres files found in $LOCAL_SOURCE/postgres"
        fi
        
        print_success "Configuration files updated"
        UPDATE_TYPE="configuration"
        ;;
    4)
        print_status "Updating backend code..."
        run_remote "mkdir -p $DEPLOY_DIR/backend"
        
        if [ -d "$LOCAL_SOURCE/backend" ] && [ "$(ls -A "$LOCAL_SOURCE/backend" 2>/dev/null)" ]; then
            scp -r "$LOCAL_SOURCE/backend/"* root@$HETZNER_HOST:"$DEPLOY_DIR/backend/"
            print_success "Backend code updated"
        else
            print_warning "No backend files found in $LOCAL_SOURCE/backend"
        fi
        
        UPDATE_TYPE="backend"
        ;;
    5)
        print_status "Performing full update..."
        print_status "Copying all files"

        # Create all necessary directories first
        run_remote "mkdir -p $DEPLOY_DIR/patroni $DEPLOY_DIR/haproxy $DEPLOY_DIR/postgres $DEPLOY_DIR/backend $DEPLOY_DIR/storage"

        # Copy docker-compose.yml and environment files
        if [ -f "$LOCAL_SOURCE/docker-compose.yml" ]; then
            print_status "Copying docker-compose.yml..."
            scp "$LOCAL_SOURCE/docker-compose.yml" root@$HETZNER_HOST:"$DEPLOY_DIR/"
        else
            print_warning "docker-compose.yml not found in $LOCAL_SOURCE"
        fi

        if [ -f "$LOCAL_SOURCE/.env.development" ]; then
            print_status "Copying environment files..."
            scp "$LOCAL_SOURCE/.env.development" root@$HETZNER_HOST:"$DEPLOY_DIR/"
            run_remote "cd $DEPLOY_DIR && grep '^[A-Z][A-Z_]*=' .env.development | grep -v '#' | grep -v '\$(' > .env"
        else
            print_warning ".env.development not found in $LOCAL_SOURCE"
        fi

        # Copy directory contents with error handling
        for dir in "patroni" "haproxy" "postgres" "backend" "storage"; do
            if [ -d "$LOCAL_SOURCE/$dir" ] && [ "$(ls -A "$LOCAL_SOURCE/$dir" 2>/dev/null)" ]; then
                print_status "Copying $dir files..."
                scp -r "$LOCAL_SOURCE/$dir/"* root@$HETZNER_HOST:"$DEPLOY_DIR/$dir/" || {
                    print_warning "Some files in $dir may not have copied correctly"
                }
            else
                print_warning "No files found in $LOCAL_SOURCE/$dir"
            fi
        done

        print_success "Full update completed"
        UPDATE_TYPE="full"
        ;;
    6)
        echo ""
        read -p "Enter file/directory path to update (relative to $LOCAL_SOURCE): " custom_path
        if [ -e "$LOCAL_SOURCE/$custom_path" ]; then
            # Determine if it's a file or directory
            if [ -f "$LOCAL_SOURCE/$custom_path" ]; then
                # It's a file, get the directory part
                dir_part=$(dirname "$custom_path")
                run_remote "mkdir -p $DEPLOY_DIR/$dir_part"
                scp "$LOCAL_SOURCE/$custom_path" root@$HETZNER_HOST:"$DEPLOY_DIR/$dir_part/"
            else
                # It's a directory
                run_remote "mkdir -p $DEPLOY_DIR/$custom_path"
                if [ "$(ls -A "$LOCAL_SOURCE/$custom_path" 2>/dev/null)" ]; then
                    scp -r "$LOCAL_SOURCE/$custom_path/"* root@$HETZNER_HOST:"$DEPLOY_DIR/$custom_path/"
                else
                    print_warning "Directory is empty: $LOCAL_SOURCE/$custom_path"
                fi
            fi
            print_success "Custom path $custom_path updated"
            UPDATE_TYPE="custom"
        else
            print_error "File/directory not found: $LOCAL_SOURCE/$custom_path"
            exit 1
        fi
        ;;
    7)
        print_status "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Verify configuration
print_status "Verifying Docker Compose configuration..."
if run_remote "cd $DEPLOY_DIR && docker-compose config --quiet"; then
    print_success "Configuration is valid"
else
    print_error "Configuration validation failed!"
    echo ""
    print_status "Showing configuration errors:"
    run_remote "cd $DEPLOY_DIR && docker-compose config 2>&1 | head -10"
    echo ""
    read -p "Continue with restart anyway? (y/n): " continue_choice
    if [ "$continue_choice" != "y" ]; then
        exit 1
    fi
fi

# Ask about restart strategy
echo ""
echo "Select restart strategy:"
echo "1. Restart specific services"
echo "2. Restart all services"
echo "3. Rolling restart (one by one)"
echo "4. Stop all, then start all"
echo "5. Force complete rebuild (remove volumes & cache)"
echo "6. No restart (update only)"
echo ""
read -p "Enter restart choice (1-6): " restart_choice

case $restart_choice in
    1)
        echo ""
        print_status "Available services:"
        run_remote "cd $DEPLOY_DIR && docker-compose ps --services" 2>/dev/null || echo "No services found"
        echo ""
        read -p "Enter service names to restart (space-separated): " services
        if [ -n "$services" ]; then
            print_status "Restarting services: $services"
            run_remote "cd $DEPLOY_DIR && docker-compose restart $services"
            print_success "Services restarted"
        fi
        ;;
    2)
        print_status "Restarting all services..."
        run_remote "cd $DEPLOY_DIR && docker-compose restart"
        print_success "All services restarted"
        ;;
    3)
        print_status "Performing rolling restart..."
        services=$(run_remote "cd $DEPLOY_DIR && docker-compose ps --services" 2>/dev/null || echo "")
        for service in $services; do
            print_status "Restarting $service..."
            run_remote "cd $DEPLOY_DIR && docker-compose restart $service"
            sleep 2
        done
        print_success "Rolling restart completed"
        ;;
    4)
        print_status "Stopping all services..."
        run_remote "cd $DEPLOY_DIR && docker-compose down"
        print_status "Starting all services..."
        run_remote "cd $DEPLOY_DIR && docker-compose --env-file .env up -d"
        print_success "Full restart completed"
        ;;
    5)
        print_status "Force complete rebuild - this will remove ALL containers, volumes, and cached images..."
        print_warning "This will STOP ALL CONTAINERS and delete all data in volumes! Continue? (y/N)"
        read -p "Confirm complete rebuild: " rebuild_confirm
        if [ "$rebuild_confirm" = "y" ] || [ "$rebuild_confirm" = "Y" ]; then
            print_status "Stopping all services and removing volumes..."
            run_remote "cd $DEPLOY_DIR && docker-compose down -v"
            print_status "Force stopping all containers..."
            run_remote "docker stop \$(docker ps -q) 2>/dev/null || true"
            print_status "Removing all containers..."
            run_remote "docker rm \$(docker ps -aq) 2>/dev/null || true"
            print_status "Removing all cached images and build cache..."
            run_remote "docker system prune -af"
            print_status "Cleaning up all networks..."
            run_remote "docker network prune -f"
            print_status "Rebuilding and starting all services..."
            run_remote "cd $DEPLOY_DIR && docker-compose --env-file .env up -d --build --force-recreate"
            print_success "Complete rebuild completed"
        else
            print_status "Rebuild cancelled"
        fi
        ;;
    6)
        print_status "Skipping restart (update only)"
        ;;
    *)
        print_error "Invalid restart choice"
        exit 1
        ;;
esac

# Verification
if [ "$restart_choice" != "6" ]; then
    echo ""
    print_status "Verifying services after restart..."
    sleep 5

    print_status "Service status:"
    run_remote "cd $DEPLOY_DIR && docker-compose ps"

    echo ""
    print_status "Quick health checks:"

    # Check if HAProxy is responding
    if run_remote "curl -s http://localhost:7000/stats >/dev/null 2>&1"; then
        print_success "HAProxy: OK"
    else
        print_warning "HAProxy: Not responding"
    fi

    # Check if Supabase REST API is responding
    if run_remote "curl -s http://localhost:3000 >/dev/null 2>&1"; then
        print_success "Supabase REST API: OK"
    else
        print_warning "Supabase REST API: Not responding"
    fi

    # Check if database is accessible
    if run_remote "cd $DEPLOY_DIR && PGPASSWORD=\$(grep '^POSTGRES_PASSWORD=' .env | cut -d'=' -f2) psql -h localhost -p 5000 -U postgres -d crm -c 'SELECT 1;' >/dev/null 2>&1"; then
        print_success "Database: OK"
    else
        print_warning "Database: Not accessible"
    fi
fi

# Summary
echo ""
print_status "Update Summary"
echo "=============="
echo "• Update type: $UPDATE_TYPE"
echo "• Restart strategy: $restart_choice"
echo "• Server: $HETZNER_HOST"
echo "• Deploy directory: $DEPLOY_DIR"
echo ""

# Show useful URLs
print_status "Service URLs:"
echo "• HAProxy Stats:      http://5.161.110.205:7000/stats"
echo "• Supabase Studio:    http://5.161.110.205:3001"
echo "• Supabase REST API:  http://5.161.110.205:3000"
echo "• Supabase Storage:   http://5.161.110.205:5002"
echo "• Adminer:            http://5.161.110.205:8081"
echo "• FastAPI Backend:    http://5.161.110.205:8000"
echo ""

print_success "Update and restart completed! 🚀"

# Offer to run monitoring
echo ""
read -p "Would you like to run the monitoring script to check status? (y/n): " monitor_choice
if [ "$monitor_choice" = "y" ]; then
    exec ./scripts/monitor-hetzner-deployment.sh
fi
