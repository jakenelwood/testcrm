#!/bin/bash

# 🛠️ K3s PostgreSQL Backup Management Script
# Comprehensive backup management for PostgreSQL cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
NAMESPACE="postgres-cluster"
STORAGE_NAMESPACE="storage"
BACKUP_BUCKET="crm-backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
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

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

header() {
    echo -e "${PURPLE}$1${NC}"
}

# Deploy backup system
deploy_backup_system() {
    header "🚀 Deploying K3s PostgreSQL Backup System"
    echo "=============================================="
    echo ""
    
    log "Deploying backup CronJob and monitoring..."
    
    # Deploy backup CronJob
    if kubectl apply -f "$SCRIPT_DIR/../../k8s/postgres/backup-cronjob.yaml"; then
        success "Backup CronJob deployed"
    else
        error "Failed to deploy backup CronJob"
        return 1
    fi
    
    # Deploy monitoring
    if kubectl apply -f "$SCRIPT_DIR/../../k8s/postgres/backup-monitoring.yaml"; then
        success "Backup monitoring deployed"
    else
        error "Failed to deploy backup monitoring"
        return 1
    fi
    
    # Wait for resources to be ready
    log "Waiting for resources to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres-backup -n "$NAMESPACE" --timeout=60s || true
    
    success "Backup system deployed successfully"
    echo ""
    
    # Show status
    show_status
}

# Remove backup system
remove_backup_system() {
    header "🗑️ Removing K3s PostgreSQL Backup System"
    echo "==========================================="
    echo ""
    
    warning "This will remove all backup automation (backups in MinIO will remain)"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Operation cancelled"
        return 0
    fi
    
    log "Removing backup system..."
    
    # Remove CronJob and monitoring
    kubectl delete -f "$SCRIPT_DIR/../../k8s/postgres/backup-cronjob.yaml" --ignore-not-found=true
    kubectl delete -f "$SCRIPT_DIR/../../k8s/postgres/backup-monitoring.yaml" --ignore-not-found=true
    
    success "Backup system removed"
}

# Show backup system status
show_status() {
    header "📊 Backup System Status"
    echo "========================"
    echo ""
    
    # Check CronJob
    log "Checking backup CronJob..."
    if kubectl get cronjob postgres-backup -n "$NAMESPACE" >/dev/null 2>&1; then
        success "Backup CronJob is deployed"
        
        # Show CronJob details
        echo ""
        echo -e "${CYAN}CronJob Details:${NC}"
        kubectl get cronjob postgres-backup -n "$NAMESPACE" -o wide
        
        # Show recent jobs
        echo ""
        echo -e "${CYAN}Recent Backup Jobs:${NC}"
        kubectl get jobs -n "$NAMESPACE" -l app=postgres-backup --sort-by=.metadata.creationTimestamp | tail -5
        
    else
        warning "Backup CronJob not found"
    fi
    
    # Check monitoring
    echo ""
    log "Checking backup monitoring..."
    if kubectl get cronjob backup-monitoring -n "$NAMESPACE" >/dev/null 2>&1; then
        success "Backup monitoring is deployed"
    else
        warning "Backup monitoring not found"
    fi
    
    # Check MinIO bucket
    echo ""
    log "Checking MinIO backup bucket..."
    local minio_pod=$(kubectl get pods -n "$STORAGE_NAMESPACE" -l app=minio -o name | head -1 | cut -d'/' -f2)
    
    if [[ -n "$minio_pod" ]]; then
        if kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- mc ls "minio/$BACKUP_BUCKET/" >/dev/null 2>&1; then
            success "MinIO backup bucket is accessible"
            
            # Show backup count
            local backup_count=$(kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- mc ls "minio/$BACKUP_BUCKET/" | grep "postgres_" | wc -l)
            info "Total backups in bucket: $backup_count"
            
        else
            warning "MinIO backup bucket not accessible"
        fi
    else
        warning "MinIO pods not found"
    fi
    
    echo ""
}

# Test backup system
test_backup() {
    header "🧪 Testing Backup System"
    echo "========================="
    echo ""
    
    log "Running manual backup test..."
    
    # Run backup script
    if "$SCRIPT_DIR/backup-postgres.sh" backup; then
        success "Manual backup test completed successfully"
    else
        error "Manual backup test failed"
        return 1
    fi
    
    echo ""
    log "Testing backup verification..."
    
    # Get latest backup name
    local minio_pod=$(kubectl get pods -n "$STORAGE_NAMESPACE" -l app=minio -o name | head -1 | cut -d'/' -f2)
    local latest_backup=$(kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- mc ls "minio/$BACKUP_BUCKET/" | grep "postgres_" | sort -k4 | tail -1 | awk '{print $NF}')
    
    if [[ -n "$latest_backup" ]]; then
        local backup_name=$(echo "$latest_backup" | sed 's/\.sql\.gz$//')
        if "$SCRIPT_DIR/backup-postgres.sh" verify "$backup_name"; then
            success "Backup verification test passed"
        else
            error "Backup verification test failed"
            return 1
        fi
    else
        warning "No backups found for verification test"
    fi
    
    echo ""
    success "🎉 All backup tests passed!"
}

# Restore from backup
restore_backup() {
    local backup_name="$1"
    
    if [[ -z "$backup_name" ]]; then
        error "Please specify backup name to restore"
        echo "Usage: $0 restore <backup_name>"
        echo ""
        echo "Available backups:"
        "$SCRIPT_DIR/backup-postgres.sh" list
        return 1
    fi
    
    header "🔄 Restoring from Backup: $backup_name"
    echo "========================================"
    echo ""
    
    warning "This will restore the database from backup!"
    warning "Current data will be replaced!"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Restore cancelled"
        return 0
    fi
    
    log "Starting restore process..."
    
    # Get MinIO pod
    local minio_pod=$(kubectl get pods -n "$STORAGE_NAMESPACE" -l app=minio -o name | head -1 | cut -d'/' -f2)
    
    if [[ -z "$minio_pod" ]]; then
        error "MinIO pod not found"
        return 1
    fi
    
    # Download backup
    log "Downloading backup from MinIO..."
    kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        mc cp "minio/$BACKUP_BUCKET/${backup_name}.sql.gz" "/tmp/${backup_name}.sql.gz"
    
    # Copy to local temp
    kubectl cp "$STORAGE_NAMESPACE/$minio_pod:/tmp/${backup_name}.sql.gz" "/tmp/${backup_name}.sql.gz"
    
    # Decompress
    log "Decompressing backup..."
    gunzip "/tmp/${backup_name}.sql.gz"
    
    # Get PostgreSQL leader
    local leader_pod=$(kubectl get pods -n "$NAMESPACE" -l role=master -o name | head -1 | cut -d'/' -f2)
    if [[ -z "$leader_pod" ]]; then
        leader_pod="postgres-0"
    fi
    
    # Restore database
    log "Restoring database to leader pod: $leader_pod"
    kubectl exec -i -n "$NAMESPACE" "$leader_pod" -- \
        psql -U postgres -d postgres < "/tmp/${backup_name}.sql"
    
    # Clean up
    rm -f "/tmp/${backup_name}.sql"
    kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        rm -f "/tmp/${backup_name}.sql.gz"
    
    success "Database restored successfully from $backup_name"
}

# Show logs
show_logs() {
    header "📋 Backup System Logs"
    echo "======================"
    echo ""
    
    # Get recent backup job
    local recent_job=$(kubectl get jobs -n "$NAMESPACE" -l app=postgres-backup --sort-by=.metadata.creationTimestamp -o name | tail -1)
    
    if [[ -n "$recent_job" ]]; then
        log "Showing logs for most recent backup job..."
        echo ""
        kubectl logs -n "$NAMESPACE" "$recent_job" --tail=50
    else
        warning "No backup jobs found"
    fi
    
    echo ""
    
    # Show monitoring logs
    local monitor_job=$(kubectl get jobs -n "$NAMESPACE" -l app=backup-monitoring --sort-by=.metadata.creationTimestamp -o name | tail -1)
    
    if [[ -n "$monitor_job" ]]; then
        log "Showing logs for most recent monitoring job..."
        echo ""
        kubectl logs -n "$NAMESPACE" "$monitor_job" --tail=20
    else
        warning "No monitoring jobs found"
    fi
}

# Show help
show_help() {
    echo "K3s PostgreSQL Backup Management Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  deploy              Deploy backup system (CronJob + monitoring)"
    echo "  remove              Remove backup system"
    echo "  status              Show backup system status"
    echo "  test                Test backup system"
    echo "  restore <backup>    Restore from specific backup"
    echo "  logs                Show backup system logs"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 status"
    echo "  $0 test"
    echo "  $0 restore postgres_20250108_120000"
    echo "  $0 logs"
}

# Main execution
case "${1:-help}" in
    "deploy")
        deploy_backup_system
        ;;
    "remove")
        remove_backup_system
        ;;
    "status")
        show_status
        ;;
    "test")
        test_backup
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "logs")
        show_logs
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
