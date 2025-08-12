#!/bin/bash

# 🔧 TwinCiGo CRM Cluster Management Script
# Provides common management operations for the Hetzner HA PostgreSQL cluster
# Author: TwinCiGo CRM Team

set -euo pipefail

# Configuration
HETZNER_HOST="5.78.103.224"
CLUSTER_NAME="gardenos-dev-cluster"
COMPOSE_DIR="/opt/twincigo-crm"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Cluster operations
start_cluster() {
    log "🚀 Starting Hetzner HA PostgreSQL cluster..."
    
    # Start etcd first
    log "Starting etcd coordination service..."
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose up -d etcd"
    sleep 10
    
    # Start PostgreSQL nodes
    log "Starting PostgreSQL leader..."
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose up -d postgres-1"
    sleep 30
    
    log "Starting PostgreSQL replicas..."
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose up -d postgres-2 postgres-3"
    sleep 20
    
    # Verify cluster formation
    if ssh root@"$HETZNER_HOST" "curl -s http://localhost:8008/cluster" >/dev/null 2>&1; then
        success "Cluster started successfully"
        log "Cluster status:"
        ssh root@"$HETZNER_HOST" "curl -s http://localhost:8008/cluster" | jq . 2>/dev/null || ssh root@"$HETZNER_HOST" "curl -s http://localhost:8008/cluster"
    else
        error "Failed to start cluster"
        return 1
    fi
}

stop_cluster() {
    log "🛑 Stopping Hetzner HA PostgreSQL cluster..."
    
    warning "This will stop all database services. Are you sure? (y/N)"
    read -r confirmation
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        log "Operation cancelled"
        return 0
    fi
    
    # Stop PostgreSQL nodes first
    log "Stopping PostgreSQL nodes..."
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose stop postgres-1 postgres-2 postgres-3"
    
    # Stop etcd
    log "Stopping etcd coordination service..."
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose stop etcd"
    
    success "Cluster stopped successfully"
}

restart_cluster() {
    log "🔄 Restarting Hetzner HA PostgreSQL cluster..."
    
    stop_cluster
    sleep 5
    start_cluster
}

start_services() {
    log "🚀 Starting additional services (HAProxy, Supabase)..."
    
    # Start HAProxy
    log "Starting HAProxy load balancer..."
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose up -d haproxy"
    
    # Start Supabase services
    log "Starting Supabase services..."
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose up -d supabase-auth supabase-rest supabase-realtime supabase-storage supabase-meta supabase-studio"
    
    success "Additional services started"
}

stop_services() {
    log "🛑 Stopping additional services..."
    
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose stop haproxy supabase-auth supabase-rest supabase-realtime supabase-storage supabase-meta supabase-studio"
    
    success "Additional services stopped"
}

# Database operations
apply_schema() {
    local schema_file=${1:-"database/schema.sql"}
    
    log "📋 Applying database schema from $schema_file..."
    
    if [[ ! -f "$schema_file" ]]; then
        error "Schema file not found: $schema_file"
        return 1
    fi
    
    # Copy schema file to server
    scp "$schema_file" root@"$HETZNER_HOST":/tmp/schema.sql
    
    # Apply schema
    if ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T postgres-1 psql -U postgres -d crm < /tmp/schema.sql"; then
        success "Schema applied successfully"
    else
        error "Failed to apply schema"
        return 1
    fi
    
    # Clean up
    ssh root@"$HETZNER_HOST" "rm -f /tmp/schema.sql"
}

backup_database() {
    local backup_name="crm_backup_$(date +%Y%m%d_%H%M%S)"
    
    log "💾 Creating database backup: $backup_name..."
    
    # Create backup
    if ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose exec -T postgres-1 pg_dump -U postgres crm | gzip > /tmp/${backup_name}.sql.gz"; then
        success "Backup created: /tmp/${backup_name}.sql.gz"
        
        # Download backup
        log "Downloading backup to local machine..."
        scp root@"$HETZNER_HOST":/tmp/${backup_name}.sql.gz ./backups/
        
        success "Backup downloaded to ./backups/${backup_name}.sql.gz"
    else
        error "Failed to create backup"
        return 1
    fi
}

restore_database() {
    local backup_file=$1
    
    if [[ -z "$backup_file" ]]; then
        error "Please specify backup file to restore"
        return 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    warning "This will REPLACE the current database. Are you sure? (y/N)"
    read -r confirmation
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        log "Operation cancelled"
        return 0
    fi
    
    log "📥 Restoring database from $backup_file..."
    
    # Upload backup file
    scp "$backup_file" root@"$HETZNER_HOST":/tmp/restore.sql.gz
    
    # Restore database
    if ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && gunzip -c /tmp/restore.sql.gz | docker compose exec -T postgres-1 psql -U postgres -d crm"; then
        success "Database restored successfully"
    else
        error "Failed to restore database"
        return 1
    fi
    
    # Clean up
    ssh root@"$HETZNER_HOST" "rm -f /tmp/restore.sql.gz"
}

# Maintenance operations
failover_test() {
    log "🔄 Testing automatic failover..."
    
    warning "This will temporarily stop the leader node. Continue? (y/N)"
    read -r confirmation
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        log "Operation cancelled"
        return 0
    fi
    
    # Get current leader
    current_leader=$(ssh root@"$HETZNER_HOST" "curl -s http://localhost:8008/cluster" | jq -r '.members[] | select(.role=="leader") | .name' 2>/dev/null)
    log "Current leader: $current_leader"
    
    # Stop leader
    log "Stopping current leader..."
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose stop postgres-1"
    
    # Wait for failover
    log "Waiting for failover (30 seconds)..."
    sleep 30
    
    # Check new leader
    if new_leader=$(ssh root@"$HETZNER_HOST" "curl -s http://localhost:8009/cluster" 2>/dev/null | jq -r '.members[] | select(.role=="leader") | .name' 2>/dev/null); then
        success "Failover successful! New leader: $new_leader"
    else
        error "Failover may have failed"
    fi
    
    # Restart original node
    log "Restarting original node..."
    ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose up -d postgres-1"
    
    success "Failover test complete"
}

show_logs() {
    local service=${1:-"all"}
    local lines=${2:-50}
    
    log "📋 Showing logs for $service (last $lines lines)..."
    
    case $service in
        "all")
            ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose logs --tail=$lines"
            ;;
        "postgres"|"postgres-1"|"postgres-2"|"postgres-3")
            ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose logs --tail=$lines $service"
            ;;
        "etcd")
            ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose logs --tail=$lines etcd"
            ;;
        "haproxy")
            ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose logs --tail=$lines haproxy"
            ;;
        *)
            ssh root@"$HETZNER_HOST" "cd $COMPOSE_DIR && docker compose logs --tail=$lines $service"
            ;;
    esac
}

# Utility functions
show_status() {
    log "📊 Current cluster status:"
    ./scripts/cluster-status.sh
}

show_help() {
    echo "TwinCiGo CRM Cluster Management Script"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Cluster Operations:"
    echo "  start              Start the PostgreSQL cluster"
    echo "  stop               Stop the PostgreSQL cluster"
    echo "  restart            Restart the PostgreSQL cluster"
    echo "  start-services     Start additional services (HAProxy, Supabase)"
    echo "  stop-services      Stop additional services"
    echo "  status             Show cluster status"
    echo
    echo "Database Operations:"
    echo "  apply-schema [file]    Apply database schema (default: database/schema.sql)"
    echo "  backup                 Create database backup"
    echo "  restore <file>         Restore database from backup"
    echo
    echo "Maintenance:"
    echo "  failover-test          Test automatic failover"
    echo "  logs [service] [lines] Show logs (default: all services, 50 lines)"
    echo
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 apply-schema database/init.sql"
    echo "  $0 backup"
    echo "  $0 logs postgres-1 100"
    echo "  $0 failover-test"
}

# Main function
main() {
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    local command=$1
    shift
    
    case $command in
        "start")
            start_cluster
            ;;
        "stop")
            stop_cluster
            ;;
        "restart")
            restart_cluster
            ;;
        "start-services")
            start_services
            ;;
        "stop-services")
            stop_services
            ;;
        "status")
            show_status
            ;;
        "apply-schema")
            apply_schema "$@"
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database "$@"
            ;;
        "failover-test")
            failover_test
            ;;
        "logs")
            show_logs "$@"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            error "Unknown command: $command"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Create backups directory if it doesn't exist
mkdir -p backups

main "$@"
