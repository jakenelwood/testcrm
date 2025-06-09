#!/bin/bash

# 🔄 Unified HA Backup System
# Comprehensive backup solution for etcd + PostgreSQL + Supabase + FastAPI persistent data
# Designed for Patroni + etcd HA setup with intelligent rotation logic

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_ROOT="/opt/crm-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_SESSION_ID="backup_${TIMESTAMP}"

# Backup configuration
RETENTION_DAILY=7      # Keep 7 daily backups
RETENTION_WEEKLY=4     # Keep 4 weekly backups  
RETENTION_MONTHLY=12   # Keep 12 monthly backups
RETENTION_YEARLY=3     # Keep 3 yearly backups

# Component configuration
ETCD_ENDPOINTS="5.78.103.224:2379,5.78.103.225:2379,5.78.103.226:2379"
POSTGRES_NAMESPACE="postgres-cluster"
SUPABASE_NAMESPACE="supabase"
FASTAPI_NAMESPACE="fastapi"
STORAGE_NAMESPACE="storage"
MINIO_BUCKET="crm-backups"

# Reporting
REPORT_DIR="$PROJECT_ROOT/docs/reporting/backup_reports"
REPORT_FILE="$REPORT_DIR/unified_backup_${TIMESTAMP}.json"
LOG_FILE="/var/log/crm-unified-backup.log"

# Backup tracking
BACKUP_START_TIME=$(date +%s)
BACKUP_COMPONENTS=()
BACKUP_ERRORS=()
BACKUP_WARNINGS=()
BACKUP_SIZES=()

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    BACKUP_ERRORS+=("$1")
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
    BACKUP_WARNINGS+=("$1")
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

phase() {
    echo -e "\n${PURPLE}🎯 $1${NC}" | tee -a "$LOG_FILE"
    echo -e "${PURPLE}$(printf '=%.0s' {1..50})${NC}" | tee -a "$LOG_FILE"
}

# Create backup directory structure
create_backup_structure() {
    log "Creating backup directory structure..."
    
    local backup_types=("daily" "weekly" "monthly" "yearly")
    local components=("etcd" "postgres" "supabase" "fastapi" "unified")
    
    for backup_type in "${backup_types[@]}"; do
        for component in "${components[@]}"; do
            mkdir -p "$BACKUP_ROOT/$backup_type/$component"
        done
    done
    
    # Create session directory
    mkdir -p "$BACKUP_ROOT/sessions/$BACKUP_SESSION_ID"
    
    success "Backup directory structure created"
}

# Determine backup type based on date
determine_backup_type() {
    local day_of_week=$(date +%u)  # 1=Monday, 7=Sunday
    local day_of_month=$(date +%d)
    local day_of_year=$(date +%j)
    
    # Yearly backup on January 1st
    if [ "$day_of_year" = "001" ]; then
        echo "yearly"
    # Monthly backup on 1st of month
    elif [ "$day_of_month" = "01" ]; then
        echo "monthly"
    # Weekly backup on Sunday
    elif [ "$day_of_week" = "7" ]; then
        echo "weekly"
    # Daily backup otherwise
    else
        echo "daily"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites for unified backup..."
    
    local missing_tools=()
    
    # Check required tools
    for tool in kubectl etcdctl pg_dump jq; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        return 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "Cannot connect to Kubernetes cluster"
        return 1
    fi
    
    # Check etcd connectivity
    local healthy_etcd=0
    IFS=',' read -ra ENDPOINTS <<< "$ETCD_ENDPOINTS"
    for endpoint in "${ENDPOINTS[@]}"; do
        if curl -s "http://$endpoint/health" | grep -q '"health":"true"' 2>/dev/null; then
            ((healthy_etcd++))
        fi
    done
    
    if [ $healthy_etcd -lt 2 ]; then
        error "Insufficient healthy etcd nodes ($healthy_etcd/3)"
        return 1
    fi
    
    success "Prerequisites check passed"
}

# Backup etcd cluster
backup_etcd() {
    phase "ETCD CLUSTER BACKUP"
    
    local backup_type="$1"
    local etcd_backup_dir="$BACKUP_ROOT/$backup_type/etcd"
    local backup_name="etcd_${BACKUP_SESSION_ID}"
    local backup_file="$etcd_backup_dir/${backup_name}.db"
    
    log "Creating etcd snapshot backup..."
    
    # Create etcd snapshot using etcdctl
    local primary_endpoint=$(echo "$ETCD_ENDPOINTS" | cut -d',' -f1)
    
    if ETCDCTL_API=3 etcdctl snapshot save "$backup_file" \
        --endpoints="$ETCD_ENDPOINTS" \
        --dial-timeout=10s \
        --command-timeout=30s; then
        
        # Compress backup
        gzip "$backup_file"
        local compressed_file="${backup_file}.gz"
        
        # Verify snapshot
        if ETCDCTL_API=3 etcdctl snapshot status "$compressed_file" >/dev/null 2>&1; then
            local backup_size=$(du -h "$compressed_file" | cut -f1)
            success "etcd backup completed: $backup_size"
            BACKUP_COMPONENTS+=("etcd:$backup_size")
            BACKUP_SIZES+=("etcd:$(stat -c%s "$compressed_file")")
            
            # Create metadata
            cat > "${compressed_file}.meta" << EOF
{
    "component": "etcd",
    "backup_type": "$backup_type",
    "timestamp": "$TIMESTAMP",
    "endpoints": "$ETCD_ENDPOINTS",
    "backup_size": $(stat -c%s "$compressed_file"),
    "session_id": "$BACKUP_SESSION_ID"
}
EOF
        else
            error "etcd backup verification failed"
            return 1
        fi
    else
        error "etcd snapshot creation failed"
        return 1
    fi
}

# Backup PostgreSQL using existing script
backup_postgres() {
    phase "POSTGRESQL BACKUP"
    
    local backup_type="$1"
    local postgres_backup_dir="$BACKUP_ROOT/$backup_type/postgres"
    
    log "Running PostgreSQL backup using existing script..."
    
    # Use existing PostgreSQL backup script
    if "$SCRIPT_DIR/k8s/backup-postgres.sh" backup; then
        # Move the backup from MinIO to our unified structure
        local minio_pod=$(kubectl get pods -n "$STORAGE_NAMESPACE" -l app=minio -o name | head -1 | cut -d'/' -f2)
        local latest_backup=$(kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
            mc ls "minio/$MINIO_BUCKET/" | grep "postgres_" | tail -1 | awk '{print $NF}')
        
        if [ -n "$latest_backup" ]; then
            # Download from MinIO to unified backup location
            kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
                mc cp "minio/$MINIO_BUCKET/$latest_backup" "/tmp/$latest_backup"
            
            # Copy to local backup directory
            kubectl cp "$STORAGE_NAMESPACE/$minio_pod:/tmp/$latest_backup" \
                "$postgres_backup_dir/${latest_backup}"
            
            local backup_size=$(du -h "$postgres_backup_dir/$latest_backup" | cut -f1)
            success "PostgreSQL backup completed: $backup_size"
            BACKUP_COMPONENTS+=("postgres:$backup_size")
            BACKUP_SIZES+=("postgres:$(stat -c%s "$postgres_backup_dir/$latest_backup")")
            
            # Create metadata
            cat > "$postgres_backup_dir/${latest_backup}.meta" << EOF
{
    "component": "postgres",
    "backup_type": "$backup_type",
    "timestamp": "$TIMESTAMP",
    "backup_size": $(stat -c%s "$postgres_backup_dir/$latest_backup"),
    "session_id": "$BACKUP_SESSION_ID"
}
EOF
        else
            error "Could not find PostgreSQL backup in MinIO"
            return 1
        fi
    else
        error "PostgreSQL backup script failed"
        return 1
    fi
}

# Backup Supabase data
backup_supabase() {
    phase "SUPABASE DATA BACKUP"
    
    local backup_type="$1"
    local supabase_backup_dir="$BACKUP_ROOT/$backup_type/supabase"
    local backup_name="supabase_${BACKUP_SESSION_ID}"
    
    log "Backing up Supabase configuration and data..."
    
    # Backup Supabase configuration
    kubectl get all,secrets,configmaps -n "$SUPABASE_NAMESPACE" -o yaml > \
        "$supabase_backup_dir/${backup_name}_config.yaml"
    
    # Backup Supabase storage data (if using file storage)
    local storage_pod=$(kubectl get pods -n "$SUPABASE_NAMESPACE" -l app=storage -o name | head -1 | cut -d'/' -f2)
    if [ -n "$storage_pod" ]; then
        log "Backing up Supabase storage data..."
        kubectl exec -n "$SUPABASE_NAMESPACE" "$storage_pod" -- \
            tar czf "/tmp/supabase_storage_${TIMESTAMP}.tar.gz" /var/lib/storage 2>/dev/null || true
        
        kubectl cp "$SUPABASE_NAMESPACE/$storage_pod:/tmp/supabase_storage_${TIMESTAMP}.tar.gz" \
            "$supabase_backup_dir/${backup_name}_storage.tar.gz" 2>/dev/null || true
    fi
    
    # Compress configuration backup
    gzip "$supabase_backup_dir/${backup_name}_config.yaml"
    
    local total_size=0
    for file in "$supabase_backup_dir"/${backup_name}*; do
        if [ -f "$file" ]; then
            total_size=$((total_size + $(stat -c%s "$file")))
        fi
    done
    
    local backup_size=$(echo "$total_size" | numfmt --to=iec)
    success "Supabase backup completed: $backup_size"
    BACKUP_COMPONENTS+=("supabase:$backup_size")
    BACKUP_SIZES+=("supabase:$total_size")
    
    # Create metadata
    cat > "$supabase_backup_dir/${backup_name}.meta" << EOF
{
    "component": "supabase",
    "backup_type": "$backup_type",
    "timestamp": "$TIMESTAMP",
    "backup_size": $total_size,
    "session_id": "$BACKUP_SESSION_ID"
}
EOF
}

# Backup FastAPI persistent data
backup_fastapi() {
    phase "FASTAPI PERSISTENT DATA BACKUP"

    local backup_type="$1"
    local fastapi_backup_dir="$BACKUP_ROOT/$backup_type/fastapi"
    local backup_name="fastapi_${BACKUP_SESSION_ID}"

    log "Backing up FastAPI persistent data..."

    # Backup FastAPI configuration
    kubectl get all,secrets,configmaps,persistentvolumeclaims -n "$FASTAPI_NAMESPACE" -o yaml > \
        "$fastapi_backup_dir/${backup_name}_config.yaml"

    # Backup AI agent memory and coroutine state
    local fastapi_pod=$(kubectl get pods -n "$FASTAPI_NAMESPACE" -l app=fastapi -o name | head -1 | cut -d'/' -f2)
    if [ -n "$fastapi_pod" ]; then
        log "Backing up AI agent memory and coroutine state..."

        # Backup agent memory from database (already covered by PostgreSQL backup)
        # But backup any local file-based persistent data
        kubectl exec -n "$FASTAPI_NAMESPACE" "$fastapi_pod" -- \
            find /app -name "*.pkl" -o -name "*.json" -o -name "*.state" 2>/dev/null | \
            kubectl exec -i -n "$FASTAPI_NAMESPACE" "$fastapi_pod" -- \
            tar czf "/tmp/fastapi_persistent_${TIMESTAMP}.tar.gz" -T - 2>/dev/null || true

        if kubectl exec -n "$FASTAPI_NAMESPACE" "$fastapi_pod" -- \
            test -f "/tmp/fastapi_persistent_${TIMESTAMP}.tar.gz" 2>/dev/null; then
            kubectl cp "$FASTAPI_NAMESPACE/$fastapi_pod:/tmp/fastapi_persistent_${TIMESTAMP}.tar.gz" \
                "$fastapi_backup_dir/${backup_name}_persistent.tar.gz"
        fi
    fi

    # Compress configuration backup
    gzip "$fastapi_backup_dir/${backup_name}_config.yaml"

    local total_size=0
    for file in "$fastapi_backup_dir"/${backup_name}*; do
        if [ -f "$file" ]; then
            total_size=$((total_size + $(stat -c%s "$file")))
        fi
    done

    local backup_size=$(echo "$total_size" | numfmt --to=iec)
    success "FastAPI backup completed: $backup_size"
    BACKUP_COMPONENTS+=("fastapi:$backup_size")
    BACKUP_SIZES+=("fastapi:$total_size")

    # Create metadata
    cat > "$fastapi_backup_dir/${backup_name}.meta" << EOF
{
    "component": "fastapi",
    "backup_type": "$backup_type",
    "timestamp": "$TIMESTAMP",
    "backup_size": $total_size,
    "session_id": "$BACKUP_SESSION_ID"
}
EOF
}

# Create unified backup archive
create_unified_archive() {
    phase "CREATING UNIFIED BACKUP ARCHIVE"

    local backup_type="$1"
    local unified_backup_dir="$BACKUP_ROOT/$backup_type/unified"
    local archive_name="crm_unified_${BACKUP_SESSION_ID}.tar.gz"
    local archive_path="$unified_backup_dir/$archive_name"

    log "Creating unified backup archive..."

    # Create archive of all components
    tar czf "$archive_path" \
        -C "$BACKUP_ROOT/$backup_type" \
        etcd postgres supabase fastapi \
        --exclude="*.meta" 2>/dev/null || true

    if [ -f "$archive_path" ]; then
        local archive_size=$(du -h "$archive_path" | cut -f1)
        success "Unified archive created: $archive_size"

        # Create comprehensive metadata
        cat > "${archive_path}.meta" << EOF
{
    "component": "unified",
    "backup_type": "$backup_type",
    "timestamp": "$TIMESTAMP",
    "session_id": "$BACKUP_SESSION_ID",
    "archive_size": $(stat -c%s "$archive_path"),
    "components": [
        $(printf '"%s",' "${BACKUP_COMPONENTS[@]}" | sed 's/,$//')
    ],
    "total_components": ${#BACKUP_COMPONENTS[@]},
    "errors": [
        $(printf '"%s",' "${BACKUP_ERRORS[@]}" | sed 's/,$//')
    ],
    "warnings": [
        $(printf '"%s",' "${BACKUP_WARNINGS[@]}" | sed 's/,$//')
    ]
}
EOF
    else
        error "Failed to create unified archive"
        return 1
    fi
}

# Intelligent cleanup with retention logic
cleanup_old_backups() {
    phase "CLEANING UP OLD BACKUPS"

    log "Applying intelligent retention policies..."

    local backup_types=("daily" "weekly" "monthly" "yearly")
    local components=("etcd" "postgres" "supabase" "fastapi" "unified")

    for backup_type in "${backup_types[@]}"; do
        local retention_var="RETENTION_${backup_type^^}"
        local retention_days=${!retention_var}

        log "Cleaning $backup_type backups (keeping $retention_days)"

        for component in "${components[@]}"; do
            local backup_dir="$BACKUP_ROOT/$backup_type/$component"

            if [ -d "$backup_dir" ]; then
                # Find and remove old backups
                find "$backup_dir" -name "*${component}_*" -type f -mtime +$retention_days -delete 2>/dev/null || true
                find "$backup_dir" -name "*.meta" -type f -mtime +$retention_days -delete 2>/dev/null || true
            fi
        done
    done

    # Clean up old session directories (keep last 30 days)
    find "$BACKUP_ROOT/sessions" -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true

    success "Backup cleanup completed"
}

# Generate comprehensive backup report
generate_backup_report() {
    local backup_type="$1"
    local backup_end_time=$(date +%s)
    local backup_duration=$((backup_end_time - BACKUP_START_TIME))

    log "Generating comprehensive backup report..."

    mkdir -p "$REPORT_DIR"

    # Calculate total backup size
    local total_size=0
    for size_entry in "${BACKUP_SIZES[@]}"; do
        local size=$(echo "$size_entry" | cut -d':' -f2)
        total_size=$((total_size + size))
    done

    cat > "$REPORT_FILE" << EOF
{
    "backup_report": {
        "session_id": "$BACKUP_SESSION_ID",
        "timestamp": "$(date -Iseconds)",
        "backup_type": "$backup_type",
        "duration_seconds": $backup_duration,
        "status": "$([ ${#BACKUP_ERRORS[@]} -eq 0 ] && echo "SUCCESS" || echo "PARTIAL_FAILURE")",
        "total_size_bytes": $total_size,
        "total_size_human": "$(echo $total_size | numfmt --to=iec)",
        "components": {
            "backed_up": [
                $(printf '"%s",' "${BACKUP_COMPONENTS[@]}" | sed 's/,$//')
            ],
            "total_count": ${#BACKUP_COMPONENTS[@]}
        },
        "errors": [
            $(printf '"%s",' "${BACKUP_ERRORS[@]}" | sed 's/,$//')
        ],
        "warnings": [
            $(printf '"%s",' "${BACKUP_WARNINGS[@]}" | sed 's/,$//')
        ],
        "infrastructure": {
            "etcd_endpoints": "$ETCD_ENDPOINTS",
            "kubernetes_namespaces": [
                "$POSTGRES_NAMESPACE",
                "$SUPABASE_NAMESPACE",
                "$FASTAPI_NAMESPACE",
                "$STORAGE_NAMESPACE"
            ],
            "backup_location": "$BACKUP_ROOT",
            "retention_policies": {
                "daily": $RETENTION_DAILY,
                "weekly": $RETENTION_WEEKLY,
                "monthly": $RETENTION_MONTHLY,
                "yearly": $RETENTION_YEARLY
            }
        },
        "next_backup_recommendations": [
            "Monitor backup sizes for growth trends",
            "Verify backup integrity periodically",
            "Test restore procedures monthly",
            "Review retention policies quarterly"
        ]
    }
}
EOF

    success "Backup report generated: $REPORT_FILE"

    # Create human-readable summary
    local summary_file="$REPORT_DIR/backup_summary_${TIMESTAMP}.txt"
    cat > "$summary_file" << EOF
CRM Unified Backup Report
========================
Date: $(date)
Session ID: $BACKUP_SESSION_ID
Backup Type: $backup_type
Duration: ${backup_duration}s
Total Size: $(echo $total_size | numfmt --to=iec)

Components Backed Up:
$(printf "  ✅ %s\n" "${BACKUP_COMPONENTS[@]}")

$([ ${#BACKUP_ERRORS[@]} -gt 0 ] && echo "Errors:" && printf "  ❌ %s\n" "${BACKUP_ERRORS[@]}")
$([ ${#BACKUP_WARNINGS[@]} -gt 0 ] && echo "Warnings:" && printf "  ⚠️  %s\n" "${BACKUP_WARNINGS[@]}")

Status: $([ ${#BACKUP_ERRORS[@]} -eq 0 ] && echo "✅ SUCCESS" || echo "⚠️  PARTIAL FAILURE")
EOF

    info "Summary report: $summary_file"
}

# Main unified backup function
main_backup() {
    local backup_type="${1:-$(determine_backup_type)}"

    log "🔄 Starting Unified HA Backup System"
    log "===================================="
    log "Backup Type: $backup_type"
    log "Session ID: $BACKUP_SESSION_ID"
    log "Timestamp: $TIMESTAMP"

    # Check prerequisites
    if ! check_prerequisites; then
        error "Prerequisites check failed"
        exit 1
    fi

    # Create backup structure
    create_backup_structure

    # Backup all components
    backup_etcd "$backup_type" || warning "etcd backup failed"
    backup_postgres "$backup_type" || warning "PostgreSQL backup failed"
    backup_supabase "$backup_type" || warning "Supabase backup failed"
    backup_fastapi "$backup_type" || warning "FastAPI backup failed"

    # Create unified archive
    create_unified_archive "$backup_type" || warning "Unified archive creation failed"

    # Cleanup old backups
    cleanup_old_backups

    # Generate report
    generate_backup_report "$backup_type"

    log "🎉 Unified backup completed!"
    log "Session: $BACKUP_SESSION_ID"
    log "Components: ${#BACKUP_COMPONENTS[@]}"
    log "Errors: ${#BACKUP_ERRORS[@]}"
    log "Warnings: ${#BACKUP_WARNINGS[@]}"
}

# Restore function
restore_backup() {
    local session_id="$1"
    local component="${2:-all}"

    if [ -z "$session_id" ]; then
        error "Session ID required for restore"
        echo "Usage: $0 restore <session_id> [component]"
        echo "Components: etcd, postgres, supabase, fastapi, all"
        exit 1
    fi

    warning "⚠️  RESTORE OPERATION - THIS WILL REPLACE CURRENT DATA"
    echo "Session ID: $session_id"
    echo "Component: $component"
    echo "This operation is DESTRUCTIVE and cannot be undone."
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

    if [ "$confirm" != "yes" ]; then
        log "Restore operation cancelled"
        exit 0
    fi

    log "🔄 Starting restore process"
    log "Session: $session_id"
    log "Component: $component"

    # TODO: Implement restore logic for each component
    warning "Restore functionality not yet implemented"
    warning "Manual restore required - see backup documentation"
}

# List available backups
list_backups() {
    log "📋 Available CRM backups"
    log "========================"

    local backup_types=("daily" "weekly" "monthly" "yearly")

    for backup_type in "${backup_types[@]}"; do
        echo -e "\n${CYAN}$backup_type backups:${NC}"

        local unified_dir="$BACKUP_ROOT/$backup_type/unified"
        if [ -d "$unified_dir" ]; then
            for backup_file in "$unified_dir"/crm_unified_*.tar.gz; do
                if [ -f "$backup_file" ]; then
                    local size=$(du -h "$backup_file" | cut -f1)
                    local date=$(stat -c %y "$backup_file" | cut -d' ' -f1)
                    local session=$(basename "$backup_file" | sed 's/crm_unified_\(.*\)\.tar\.gz/\1/')
                    echo "  Session: $session ($size, $date)"
                fi
            done
        else
            echo "  No backups found"
        fi
    done
}

# Main script logic
case "${1:-backup}" in
    "backup")
        main_backup "$2"
        ;;
    "daily"|"weekly"|"monthly"|"yearly")
        main_backup "$1"
        ;;
    "restore")
        restore_backup "$2" "$3"
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {backup|daily|weekly|monthly|yearly|restore|list|cleanup}"
        echo ""
        echo "Commands:"
        echo "  backup           - Auto-determine backup type and run (default)"
        echo "  daily/weekly/... - Force specific backup type"
        echo "  restore <id>     - Restore from backup session"
        echo "  list             - List available backups"
        echo "  cleanup          - Clean up old backups"
        echo ""
        echo "Examples:"
        echo "  $0 backup                    # Auto-determine backup type"
        echo "  $0 daily                     # Force daily backup"
        echo "  $0 restore backup_20250108_120000"
        echo "  $0 list"
        exit 1
        ;;
esac
