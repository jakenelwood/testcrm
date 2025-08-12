#!/bin/bash

# 🔄 etcd Backup Automation Script
# Automated backup system for etcd cluster with retention and monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BACKUP_DIR="/opt/etcd-backups"
RETENTION_DAYS=30
ETCD_ENDPOINTS="5.78.103.224:2379,5.78.103.225:2379,5.78.103.226:2379"
BACKUP_PREFIX="etcd-backup"
LOG_FILE="/var/log/etcd-backup.log"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Create backup directory
create_backup_directory() {
    log "Creating backup directory structure..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/daily"
    mkdir -p "$BACKUP_DIR/weekly"
    mkdir -p "$BACKUP_DIR/monthly"
    
    success "Backup directories created"
}

# Check etcd cluster health
check_etcd_health() {
    log "Checking etcd cluster health..."
    
    local healthy_nodes=0
    local total_nodes=0
    
    IFS=',' read -ra ENDPOINTS <<< "$ETCD_ENDPOINTS"
    for endpoint in "${ENDPOINTS[@]}"; do
        ((total_nodes++))
        if curl -s "http://$endpoint/health" | grep -q '"health":"true"' 2>/dev/null; then
            success "etcd node $endpoint is healthy"
            ((healthy_nodes++))
        else
            error "etcd node $endpoint is unhealthy"
        fi
    done
    
    if [ $healthy_nodes -lt 2 ]; then
        error "Insufficient healthy etcd nodes ($healthy_nodes/$total_nodes). Backup may be inconsistent."
        return 1
    fi
    
    success "etcd cluster is healthy ($healthy_nodes/$total_nodes nodes)"
    return 0
}

# Create etcd backup
create_backup() {
    local backup_type="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="${BACKUP_PREFIX}_${backup_type}_${timestamp}"
    local backup_path="$BACKUP_DIR/$backup_type/$backup_name"
    
    log "Creating $backup_type backup: $backup_name"
    
    # Use etcdctl to create snapshot
    if command -v etcdctl >/dev/null 2>&1; then
        # Use etcdctl if available
        ETCDCTL_API=3 etcdctl snapshot save "$backup_path.db" \
            --endpoints="$ETCD_ENDPOINTS" \
            --dial-timeout=10s \
            --command-timeout=30s
    else
        # Fallback to direct API call
        local primary_endpoint=$(echo "$ETCD_ENDPOINTS" | cut -d',' -f1)
        curl -s "http://$primary_endpoint/v3/maintenance/snapshot" \
            --output "$backup_path.db" \
            --max-time 30
    fi
    
    if [ $? -eq 0 ] && [ -f "$backup_path.db" ]; then
        # Compress backup
        gzip "$backup_path.db"
        
        # Create metadata file
        cat > "$backup_path.meta" << EOF
{
    "backup_type": "$backup_type",
    "timestamp": "$timestamp",
    "endpoints": "$ETCD_ENDPOINTS",
    "backup_size": "$(stat -c%s "$backup_path.db.gz" 2>/dev/null || echo 0)",
    "created_at": "$(date -Iseconds)",
    "retention_until": "$(date -d "+$RETENTION_DAYS days" -Iseconds)"
}
EOF
        
        success "$backup_type backup created: $backup_path.db.gz"
        log "Backup size: $(du -h "$backup_path.db.gz" | cut -f1)"
        
        # Verify backup integrity
        if command -v etcdctl >/dev/null 2>&1; then
            log "Verifying backup integrity..."
            if ETCDCTL_API=3 etcdctl snapshot status "$backup_path.db.gz" >/dev/null 2>&1; then
                success "Backup integrity verified"
            else
                warning "Backup integrity check failed"
            fi
        fi
        
        return 0
    else
        error "Failed to create $backup_type backup"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    local cleaned_count=0
    
    for backup_type in daily weekly monthly; do
        if [ -d "$BACKUP_DIR/$backup_type" ]; then
            # Find and remove old backups
            while IFS= read -r -d '' file; do
                rm -f "$file"
                ((cleaned_count++))
                log "Removed old backup: $(basename "$file")"
            done < <(find "$BACKUP_DIR/$backup_type" -name "*.db.gz" -mtime +$RETENTION_DAYS -print0)
            
            # Also remove corresponding metadata files
            find "$BACKUP_DIR/$backup_type" -name "*.meta" -mtime +$RETENTION_DAYS -delete
        fi
    done
    
    if [ $cleaned_count -gt 0 ]; then
        success "Cleaned up $cleaned_count old backup files"
    else
        log "No old backups to clean up"
    fi
}

# Generate backup report
generate_report() {
    local report_file="$BACKUP_DIR/backup_report_$(date +%Y%m%d).json"
    
    log "Generating backup report..."
    
    cat > "$report_file" << EOF
{
    "report_date": "$(date -Iseconds)",
    "backup_directory": "$BACKUP_DIR",
    "retention_days": $RETENTION_DAYS,
    "etcd_endpoints": "$ETCD_ENDPOINTS",
    "backups": {
EOF
    
    local first=true
    for backup_type in daily weekly monthly; do
        if [ "$first" = false ]; then
            echo "," >> "$report_file"
        fi
        first=false
        
        echo "        \"$backup_type\": [" >> "$report_file"
        
        local backup_first=true
        if [ -d "$BACKUP_DIR/$backup_type" ]; then
            for meta_file in "$BACKUP_DIR/$backup_type"/*.meta; do
                if [ -f "$meta_file" ]; then
                    if [ "$backup_first" = false ]; then
                        echo "," >> "$report_file"
                    fi
                    backup_first=false
                    
                    echo -n "            " >> "$report_file"
                    cat "$meta_file" >> "$report_file"
                fi
            done
        fi
        
        echo "" >> "$report_file"
        echo "        ]" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF
    },
    "disk_usage": {
        "total_backup_size": "$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")",
        "available_space": "$(df -h "$BACKUP_DIR" 2>/dev/null | awk 'NR==2 {print $4}' || echo "unknown")"
    }
}
EOF
    
    success "Backup report generated: $report_file"
}

# Main backup function
perform_backup() {
    local backup_type="${1:-daily}"
    
    log "🔄 Starting etcd backup process ($backup_type)"
    log "================================================"
    
    # Create backup directory structure
    create_backup_directory
    
    # Check etcd health
    if ! check_etcd_health; then
        error "etcd cluster health check failed. Aborting backup."
        exit 1
    fi
    
    # Create backup
    if create_backup "$backup_type"; then
        success "Backup completed successfully"
    else
        error "Backup failed"
        exit 1
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Generate report
    generate_report
    
    log "🎉 etcd backup process completed"
}

# Restore function
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Backup file path is required for restore"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi
    
    warning "⚠️  RESTORE OPERATION - THIS WILL REPLACE CURRENT etcd DATA"
    echo "Backup file: $backup_file"
    echo "This operation is DESTRUCTIVE and cannot be undone."
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Restore operation cancelled"
        exit 0
    fi
    
    log "🔄 Starting etcd restore process"
    log "Backup file: $backup_file"
    
    # TODO: Implement restore logic
    # This would typically involve:
    # 1. Stopping etcd cluster
    # 2. Clearing data directories
    # 3. Restoring from snapshot
    # 4. Restarting cluster
    
    warning "Restore functionality not yet implemented"
    warning "Manual restore required - see etcd documentation"
}

# List available backups
list_backups() {
    log "📋 Available etcd backups"
    log "========================="
    
    for backup_type in daily weekly monthly; do
        echo -e "\n${CYAN}$backup_type backups:${NC}"
        if [ -d "$BACKUP_DIR/$backup_type" ]; then
            for backup_file in "$BACKUP_DIR/$backup_type"/*.db.gz; do
                if [ -f "$backup_file" ]; then
                    local size=$(du -h "$backup_file" | cut -f1)
                    local date=$(stat -c %y "$backup_file" | cut -d' ' -f1)
                    echo "  $(basename "$backup_file") ($size, $date)"
                fi
            done
        else
            echo "  No backups found"
        fi
    done
}

# Main script logic
case "${1:-daily}" in
    "daily"|"weekly"|"monthly")
        perform_backup "$1"
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "report")
        generate_report
        ;;
    *)
        echo "Usage: $0 {daily|weekly|monthly|restore|list|cleanup|report}"
        echo ""
        echo "Commands:"
        echo "  daily    - Create daily backup (default)"
        echo "  weekly   - Create weekly backup"
        echo "  monthly  - Create monthly backup"
        echo "  restore  - Restore from backup file"
        echo "  list     - List available backups"
        echo "  cleanup  - Clean up old backups"
        echo "  report   - Generate backup report"
        exit 1
        ;;
esac
