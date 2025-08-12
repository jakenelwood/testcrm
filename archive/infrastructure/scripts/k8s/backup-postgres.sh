#!/bin/bash

# 💾 K3s PostgreSQL Backup Script
# Backs up PostgreSQL cluster to MinIO S3 storage with verification

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
RETENTION_DAYS=30

# Reporting configuration
REPORT_DIR="docs/reporting/backup_reports"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
REPORT_FILE="$REPORT_DIR/backup_report_${TIMESTAMP}.json"

# Backup operation tracking
BACKUP_START_TIME=""
BACKUP_END_TIME=""
BACKUP_STATUS="UNKNOWN"
BACKUP_ERROR=""
BACKUP_SIZE=""
BACKUP_DURATION=""
LEADER_POD=""
MINIO_POD=""
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

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check kubectl access
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "kubectl not configured or cluster not accessible"
        exit 1
    fi
    
    # Check postgres namespace
    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        error "PostgreSQL namespace '$NAMESPACE' not found"
        exit 1
    fi
    
    # Check storage namespace
    if ! kubectl get namespace "$STORAGE_NAMESPACE" >/dev/null 2>&1; then
        error "Storage namespace '$STORAGE_NAMESPACE' not found"
        exit 1
    fi
    
    # Check MinIO pods
    if ! kubectl get pods -n "$STORAGE_NAMESPACE" -l app=minio | grep -q Running; then
        error "MinIO pods not running in namespace '$STORAGE_NAMESPACE'"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Get Patroni leader pod
get_leader_pod() {
    log "Identifying PostgreSQL leader pod..."

    # Try to get leader from Patroni API
    local leader_pod=""
    for pod in $(kubectl get pods -n "$NAMESPACE" -l app=postgres -o name); do
        pod_name=$(echo "$pod" | cut -d'/' -f2)

        # Check if this pod is the leader
        if kubectl exec -n "$NAMESPACE" "$pod_name" -- curl -s http://localhost:8008/master 2>/dev/null | grep -q '"role":"primary"'; then
            leader_pod="$pod_name"
            break
        fi
    done

    if [[ -z "$leader_pod" ]]; then
        # Fallback: use postgres-0 (usually the leader)
        leader_pod="postgres-0"
        warning "Could not determine leader via Patroni API, using fallback: $leader_pod" >&2
    else
        success "Found PostgreSQL leader: $leader_pod" >&2
    fi

    # Return just the pod name without any formatting
    echo "$leader_pod"
}

# Create database backup
create_backup() {
    local leader_pod="$1"
    local backup_name="$2"
    local temp_file="/tmp/${backup_name}.sql"
    local compressed_file="/tmp/${backup_name}.sql.gz"

    log "Creating database backup from leader pod: $leader_pod" >&2

    # Create backup using pg_dump
    info "Running pg_dump on leader pod..." >&2
    kubectl exec -n "$NAMESPACE" "$leader_pod" -- \
        pg_dump -U postgres -h localhost -p 5432 postgres \
        > "$temp_file"

    if [[ ! -f "$temp_file" ]] || [[ ! -s "$temp_file" ]]; then
        error "Backup file is empty or not created" >&2
        return 1
    fi

    # Compress backup
    info "Compressing backup file..." >&2
    gzip "$temp_file"

    if [[ ! -f "$compressed_file" ]]; then
        error "Failed to compress backup file" >&2
        return 1
    fi

    local backup_size=$(du -h "$compressed_file" | cut -f1)
    success "Backup created and compressed: $backup_name.sql.gz ($backup_size)" >&2

    # Only output the file path to stdout
    echo "$compressed_file"
}

# Generate backup report
generate_backup_report() {
    local backup_name="$1"
    local backup_file="$2"
    local status="$3"
    local error_msg="$4"

    # Ensure report directory exists
    mkdir -p "$REPORT_DIR"

    # Calculate duration
    if [[ -n "$BACKUP_START_TIME" && -n "$BACKUP_END_TIME" ]]; then
        BACKUP_DURATION=$((BACKUP_END_TIME - BACKUP_START_TIME))
    fi

    # Get backup size if file exists
    if [[ -f "$backup_file" ]]; then
        BACKUP_SIZE=$(stat -c%s "$backup_file" 2>/dev/null || echo "0")
    fi

    # Get cluster status
    local cluster_status=""
    if [[ -n "$LEADER_POD" ]]; then
        cluster_status=$(kubectl exec -n "$NAMESPACE" "$LEADER_POD" -- patronictl list 2>/dev/null | grep -E "(Leader|Replica)" | wc -l || echo "0")
    fi

    # Generate JSON report
    cat > "$REPORT_FILE" << EOF
{
  "backup_report": {
    "timestamp": "$(date -Iseconds)",
    "backup_name": "$backup_name",
    "status": "$status",
    "duration_seconds": $BACKUP_DURATION,
    "backup_size_bytes": $BACKUP_SIZE,
    "backup_size_human": "$(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "N/A")",
    "error_message": "$error_msg",
    "cluster_info": {
      "leader_pod": "$LEADER_POD",
      "cluster_members": $cluster_status,
      "namespace": "$NAMESPACE"
    },
    "storage_info": {
      "minio_pod": "$MINIO_POD",
      "bucket": "$BACKUP_BUCKET",
      "storage_namespace": "$STORAGE_NAMESPACE"
    },
    "retention": {
      "retention_days": $RETENTION_DAYS,
      "cleanup_performed": true
    },
    "system_info": {
      "hostname": "$(hostname)",
      "kubernetes_version": "$(kubectl version --client --short 2>/dev/null | grep Client || echo "Unknown")",
      "script_version": "1.0"
    }
  }
}
EOF

    # Also create a human-readable summary
    local summary_file="$REPORT_DIR/backup_summary_${TIMESTAMP}.txt"
    cat > "$summary_file" << EOF
PostgreSQL Backup Report
========================
Date: $(date)
Backup Name: $backup_name
Status: $status
Duration: ${BACKUP_DURATION}s
Size: $(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "N/A")
Leader Pod: $LEADER_POD
MinIO Pod: $MINIO_POD
Bucket: $BACKUP_BUCKET

$(if [[ "$status" == "SUCCESS" ]]; then echo "✅ Backup completed successfully"; else echo "❌ Backup failed: $error_msg"; fi)
EOF

    info "Backup report generated: $REPORT_FILE"
    info "Summary report: $summary_file"
}

# Upload backup to MinIO
upload_to_minio() {
    local backup_file="$1"
    local backup_name="$2"

    log "Uploading backup to MinIO S3 storage..."

    # Validate backup file exists
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    # Get MinIO pod
    local minio_pod=$(kubectl get pods -n "$STORAGE_NAMESPACE" -l app=minio -o name | head -1 | cut -d'/' -f2)
    MINIO_POD="$minio_pod"

    if [[ -z "$minio_pod" ]]; then
        error "No MinIO pods found"
        return 1
    fi

    info "Found MinIO pod: $minio_pod"
    info "Backup file: $backup_file"

    # Copy backup file to MinIO pod using cat (kubectl cp requires tar which MinIO doesn't have)
    info "Copying backup to MinIO pod: $minio_pod"
    local backup_filename=$(basename "$backup_file")

    if cat "$backup_file" | kubectl exec -i -n "$STORAGE_NAMESPACE" "$minio_pod" -- sh -c "cat > /tmp/$backup_filename"; then
        success "Backup file copied to MinIO pod"
    else
        error "Failed to copy backup file to MinIO pod"
        return 1
    fi

    # Upload to S3 bucket using mc
    info "Uploading to S3 bucket: $BACKUP_BUCKET"
    kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        mc cp "/tmp/$(basename "$backup_file")" "minio/$BACKUP_BUCKET/"

    # Verify upload
    if kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        mc ls "minio/$BACKUP_BUCKET/$(basename "$backup_file")" >/dev/null 2>&1; then
        success "Backup uploaded successfully to MinIO"
    else
        error "Failed to verify backup upload"
        return 1
    fi

    # Clean up temp file from MinIO pod
    kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        rm -f "/tmp/$(basename "$backup_file")" || true
}

# Verify backup integrity
verify_backup() {
    local backup_name="$1"
    
    log "Verifying backup integrity..."
    
    local minio_pod=$(kubectl get pods -n "$STORAGE_NAMESPACE" -l app=minio -o name | head -1 | cut -d'/' -f2)
    
    # Download backup for verification
    kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        mc cp "minio/$BACKUP_BUCKET/${backup_name}.sql.gz" "/tmp/${backup_name}_verify.sql.gz"
    
    # Test if backup file exists and has reasonable size
    local file_size=$(kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        stat -c%s "/tmp/${backup_name}_verify.sql.gz" 2>/dev/null || echo "0")

    if [[ "$file_size" -gt 1000 ]]; then
        success "Backup integrity verified - file exists and has valid size ($file_size bytes)"
    else
        error "Backup integrity check failed - file is missing or too small ($file_size bytes)"
        return 1
    fi
    
    # Clean up verification file
    kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        rm -f "/tmp/${backup_name}_verify.sql.gz" || true
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local minio_pod=$(kubectl get pods -n "$STORAGE_NAMESPACE" -l app=minio -o name | head -1 | cut -d'/' -f2)
    
    # List and remove old backups
    local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
    
    kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        mc ls "minio/$BACKUP_BUCKET/" | while read -r line; do
            if [[ "$line" =~ postgres_([0-9]{8})_[0-9]{6}\.sql\.gz ]]; then
                local backup_date="${BASH_REMATCH[1]}"
                if [[ "$backup_date" < "$cutoff_date" ]]; then
                    local old_backup=$(echo "$line" | awk '{print $NF}')
                    info "Removing old backup: $old_backup"
                    kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
                        mc rm "minio/$BACKUP_BUCKET/$old_backup" || true
                fi
            fi
        done
    
    success "Old backup cleanup completed"
}

# List available backups
list_backups() {
    log "Listing available backups in MinIO..."
    
    local minio_pod=$(kubectl get pods -n "$STORAGE_NAMESPACE" -l app=minio -o name | head -1 | cut -d'/' -f2)
    
    echo ""
    echo -e "${CYAN}📋 Available backups in bucket '$BACKUP_BUCKET':${NC}"
    kubectl exec -n "$STORAGE_NAMESPACE" "$minio_pod" -- \
        mc ls "minio/$BACKUP_BUCKET/" | grep "postgres_" | sort -r
    echo ""
}

# Show help
show_help() {
    echo "K3s PostgreSQL Backup Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  backup              Create a new backup"
    echo "  list                List available backups"
    echo "  verify <backup>     Verify backup integrity"
    echo "  cleanup             Clean up old backups"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 list"
    echo "  $0 verify postgres_20250108_120000"
    echo "  $0 cleanup"
}

# Main backup function
main_backup() {
    echo -e "${PURPLE}💾 K3s PostgreSQL Backup${NC}"
    echo "=========================="
    echo ""

    # Initialize backup tracking
    BACKUP_START_TIME=$(date +%s)
    BACKUP_STATUS="IN_PROGRESS"

    # Ensure report directory exists
    mkdir -p "$REPORT_DIR"

    check_prerequisites

    # Generate backup name
    local backup_name="postgres_$(date +%Y%m%d_%H%M%S)"

    # Get leader pod - check all running pods
    log "Identifying PostgreSQL leader pod..."
    local leader_pod=""

    # Check each postgres pod to find the leader using patronictl
    for i in 0 1 2; do
        local pod_name="postgres-$i"

        # Check if pod is running
        if kubectl get pod -n "$NAMESPACE" "$pod_name" --no-headers 2>/dev/null | grep -q "Running"; then
            # Check if this pod is the leader using patronictl
            if kubectl exec -n "$NAMESPACE" "$pod_name" -- patronictl list 2>/dev/null | grep -q "$pod_name.*Leader"; then
                leader_pod="$pod_name"
                LEADER_POD="$pod_name"
                success "Found PostgreSQL leader: $leader_pod"
                break
            fi
        else
            info "Pod $pod_name is not running, skipping..."
        fi
    done

    # Fallback if no leader found
    if [[ -z "$leader_pod" ]]; then
        # Use first running pod as fallback
        for i in 0 1 2; do
            local pod_name="postgres-$i"
            if kubectl get pod -n "$NAMESPACE" "$pod_name" --no-headers 2>/dev/null | grep -q "Running"; then
                leader_pod="$pod_name"
                warning "Could not detect leader, using running pod: $leader_pod"
                break
            fi
        done
    fi

    if [[ -z "$leader_pod" ]]; then
        BACKUP_END_TIME=$(date +%s)
        BACKUP_STATUS="FAILED"
        BACKUP_ERROR="No running PostgreSQL pods found"
        generate_backup_report "$backup_name" "" "$BACKUP_STATUS" "$BACKUP_ERROR"
        error "No running PostgreSQL pods found!"
        return 1
    fi

    # Create backup
    local backup_file
    if backup_file=$(create_backup "$leader_pod" "$backup_name"); then
        info "Backup file created: $backup_file"
    else
        BACKUP_END_TIME=$(date +%s)
        BACKUP_STATUS="FAILED"
        BACKUP_ERROR="Failed to create backup file"
        generate_backup_report "$backup_name" "" "$BACKUP_STATUS" "$BACKUP_ERROR"
        error "Failed to create backup"
        return 1
    fi

    # Upload to MinIO
    if upload_to_minio "$backup_file" "$backup_name"; then
        info "Backup uploaded successfully"
    else
        BACKUP_END_TIME=$(date +%s)
        BACKUP_STATUS="FAILED"
        BACKUP_ERROR="Failed to upload backup to MinIO"
        generate_backup_report "$backup_name" "$backup_file" "$BACKUP_STATUS" "$BACKUP_ERROR"
        error "Failed to upload backup"
        return 1
    fi

    # Verify backup
    if verify_backup "$backup_name"; then
        info "Backup verification successful"
    else
        BACKUP_END_TIME=$(date +%s)
        BACKUP_STATUS="FAILED"
        BACKUP_ERROR="Backup verification failed"
        generate_backup_report "$backup_name" "$backup_file" "$BACKUP_STATUS" "$BACKUP_ERROR"
        error "Backup verification failed"
        return 1
    fi

    # Mark backup as successful and generate report before cleanup
    BACKUP_END_TIME=$(date +%s)
    BACKUP_STATUS="SUCCESS"
    generate_backup_report "$backup_name" "$backup_file" "$BACKUP_STATUS" ""

    # Clean up local temp file
    rm -f "$backup_file"

    # Clean up old backups
    cleanup_old_backups

    echo ""
    echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
    echo -e "${CYAN}📋 Backup details:${NC}"
    echo "   Name: $backup_name.sql.gz"
    echo "   Bucket: $BACKUP_BUCKET"
    echo "   Retention: $RETENTION_DAYS days"
    echo "   Report: $REPORT_FILE"
    echo ""
}

# Main execution
case "${1:-backup}" in
    "backup")
        main_backup
        ;;
    "list")
        check_prerequisites
        list_backups
        ;;
    "verify")
        if [[ -z "$2" ]]; then
            error "Please specify backup name to verify"
            echo "Usage: $0 verify <backup_name>"
            exit 1
        fi
        check_prerequisites
        verify_backup "$2"
        ;;
    "cleanup")
        check_prerequisites
        cleanup_old_backups
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
