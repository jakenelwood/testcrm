#!/bin/bash

# 🕒 Setup Backup Automation
# Configures cron jobs and monitoring for unified HA backup system

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
BACKUP_SCRIPT="$SCRIPT_DIR/unified-ha-backup.sh"
CRON_USER="root"
LOG_DIR="/var/log/crm-backups"

# Hetzner server configuration
HETZNER_SERVERS=("5.78.103.224" "5.78.103.225" "5.78.103.226")
PRIMARY_SERVER="5.78.103.224"
SSH_KEY="~/.ssh/id_ed25519"

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Setup backup automation on primary server
setup_primary_backup() {
    log "Setting up backup automation on primary server: $PRIMARY_SERVER"
    
    # Copy backup scripts to server
    log "Copying backup scripts to server..."
    scp -i "$SSH_KEY" "$BACKUP_SCRIPT" "root@$PRIMARY_SERVER:/usr/local/bin/"
    scp -i "$SSH_KEY" "$SCRIPT_DIR/etcd-backup-automation.sh" "root@$PRIMARY_SERVER:/usr/local/bin/"
    scp -i "$SSH_KEY" "$SCRIPT_DIR/k8s/backup-postgres.sh" "root@$PRIMARY_SERVER:/usr/local/bin/"
    
    # Make scripts executable
    ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" "chmod +x /usr/local/bin/*.sh"
    
    # Create log directory
    ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" "mkdir -p $LOG_DIR"
    
    # Setup cron jobs
    log "Setting up cron jobs for automated backups..."
    
    ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" << 'EOF'
# Create backup cron configuration
cat > /etc/cron.d/crm-backups << 'CRON_EOF'
# CRM Unified Backup System
# Runs automated backups with intelligent scheduling

# Daily backup at 2:00 AM (will auto-determine if it should be weekly/monthly/yearly)
0 2 * * * root /usr/local/bin/unified-ha-backup.sh backup >> /var/log/crm-backups/unified-backup.log 2>&1

# Additional etcd-only backup every 6 hours for extra safety
0 */6 * * * root /usr/local/bin/etcd-backup-automation.sh daily >> /var/log/crm-backups/etcd-backup.log 2>&1

# Weekly backup verification (Sundays at 3:00 AM)
0 3 * * 0 root /usr/local/bin/unified-ha-backup.sh list >> /var/log/crm-backups/backup-verification.log 2>&1

# Monthly cleanup of old logs (1st of month at 4:00 AM)
0 4 1 * * root find /var/log/crm-backups -name "*.log" -mtime +90 -delete

CRON_EOF

# Reload cron
systemctl reload cron
EOF
    
    success "Backup automation configured on primary server"
}

# Setup backup monitoring
setup_backup_monitoring() {
    log "Setting up backup monitoring and alerting..."
    
    # Create monitoring script
    ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" << 'EOF'
cat > /usr/local/bin/backup-health-monitor.sh << 'MONITOR_EOF'
#!/bin/bash

# Backup Health Monitor
# Checks backup status and sends alerts if needed

LOG_FILE="/var/log/crm-backups/backup-health.log"
BACKUP_DIR="/opt/crm-backups"
ALERT_EMAIL="admin@ronrico-crm.com"  # Configure as needed

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

check_recent_backups() {
    local recent_backup_found=false
    
    # Check for backups in last 25 hours (allowing for some delay)
    if find "$BACKUP_DIR" -name "crm_unified_*.tar.gz" -mtime -1 | grep -q .; then
        recent_backup_found=true
        log "✅ Recent unified backup found"
    fi
    
    if [ "$recent_backup_found" = false ]; then
        log "❌ No recent backups found - ALERT"
        # Send alert (configure email/webhook as needed)
        echo "ALERT: No recent CRM backups found on $(hostname)" | \
            mail -s "CRM Backup Alert" "$ALERT_EMAIL" 2>/dev/null || \
            logger "CRM Backup Alert: No recent backups found"
        return 1
    fi
    
    return 0
}

check_backup_sizes() {
    local min_size_mb=10  # Minimum expected backup size in MB
    
    # Check latest backup size
    local latest_backup=$(find "$BACKUP_DIR" -name "crm_unified_*.tar.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$latest_backup" ]; then
        local size_mb=$(du -m "$latest_backup" | cut -f1)
        if [ "$size_mb" -lt "$min_size_mb" ]; then
            log "❌ Latest backup is too small: ${size_mb}MB - ALERT"
            echo "ALERT: CRM backup size is suspiciously small: ${size_mb}MB" | \
                mail -s "CRM Backup Size Alert" "$ALERT_EMAIL" 2>/dev/null || \
                logger "CRM Backup Size Alert: Backup too small"
            return 1
        else
            log "✅ Latest backup size OK: ${size_mb}MB"
        fi
    fi
    
    return 0
}

check_disk_space() {
    local backup_disk_usage=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$backup_disk_usage" -gt 85 ]; then
        log "❌ Backup disk usage high: ${backup_disk_usage}% - ALERT"
        echo "ALERT: CRM backup disk usage is high: ${backup_disk_usage}%" | \
            mail -s "CRM Backup Disk Alert" "$ALERT_EMAIL" 2>/dev/null || \
            logger "CRM Backup Disk Alert: High disk usage"
        return 1
    else
        log "✅ Backup disk usage OK: ${backup_disk_usage}%"
    fi
    
    return 0
}

# Main monitoring
log "Starting backup health check"
check_recent_backups
check_backup_sizes  
check_disk_space
log "Backup health check completed"
MONITOR_EOF

chmod +x /usr/local/bin/backup-health-monitor.sh

# Add monitoring to cron (runs every 4 hours)
echo "0 */4 * * * root /usr/local/bin/backup-health-monitor.sh" >> /etc/cron.d/crm-backups
EOF
    
    success "Backup monitoring configured"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation for backup logs..."
    
    ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" << 'EOF'
cat > /etc/logrotate.d/crm-backups << 'LOGROTATE_EOF'
/var/log/crm-backups/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
LOGROTATE_EOF
EOF
    
    success "Log rotation configured"
}

# Create backup status dashboard script
create_status_dashboard() {
    log "Creating backup status dashboard..."
    
    ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" << 'EOF'
cat > /usr/local/bin/backup-status-dashboard.sh << 'DASHBOARD_EOF'
#!/bin/bash

# CRM Backup Status Dashboard
# Provides comprehensive backup status overview

BACKUP_DIR="/opt/crm-backups"
REPORT_DIR="/opt/crm-backups/reports"

echo "🔄 CRM Backup Status Dashboard"
echo "=============================="
echo "Generated: $(date)"
echo ""

# Recent backups summary
echo "📋 Recent Backups:"
echo "=================="
find "$BACKUP_DIR" -name "crm_unified_*.tar.gz" -printf '%T@ %TY-%Tm-%Td %TH:%TM %s %p\n' | \
    sort -nr | head -10 | while read timestamp date time size path; do
    size_mb=$(echo "scale=1; $size / 1024 / 1024" | bc)
    backup_name=$(basename "$path" .tar.gz)
    echo "  $date $time - $backup_name (${size_mb}MB)"
done
echo ""

# Backup type distribution
echo "📊 Backup Type Distribution (Last 30 days):"
echo "==========================================="
for backup_type in daily weekly monthly yearly; do
    count=$(find "$BACKUP_DIR/$backup_type" -name "crm_unified_*.tar.gz" -mtime -30 | wc -l)
    echo "  $backup_type: $count backups"
done
echo ""

# Disk usage
echo "💾 Storage Usage:"
echo "================"
df -h "$BACKUP_DIR" | tail -1 | awk '{print "  Used: " $3 " / " $2 " (" $5 ")"}'
echo ""

# Component status
echo "🔧 Component Backup Status:"
echo "==========================="
for component in etcd postgres supabase fastapi; do
    latest=$(find "$BACKUP_DIR" -path "*/$component/*" -name "*${component}_*" -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)
    if [ -n "$latest" ]; then
        age=$(find "$latest" -printf '%A@\n' | awk '{print int((systime() - $1) / 3600)}')
        echo "  $component: Last backup ${age}h ago"
    else
        echo "  $component: No backups found"
    fi
done
echo ""

# Error summary
echo "⚠️  Recent Issues:"
echo "================="
if [ -f "/var/log/crm-backups/unified-backup.log" ]; then
    grep -i "error\|failed\|warning" /var/log/crm-backups/unified-backup.log | tail -5 | \
        sed 's/^/  /' || echo "  No recent issues found"
else
    echo "  No log file found"
fi
echo ""

echo "📈 For detailed reports, check: $REPORT_DIR"
DASHBOARD_EOF

chmod +x /usr/local/bin/backup-status-dashboard.sh
EOF
    
    success "Backup status dashboard created"
}

# Test backup system
test_backup_system() {
    log "Testing backup system..."
    
    # Run a test backup
    log "Running test backup..."
    ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" "/usr/local/bin/unified-ha-backup.sh backup daily"
    
    # Check if backup was created
    if ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" "find /opt/crm-backups -name 'crm_unified_*.tar.gz' -mtime -1 | grep -q ."; then
        success "Test backup completed successfully"
    else
        error "Test backup failed"
        return 1
    fi
    
    # Run status dashboard
    log "Testing status dashboard..."
    ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" "/usr/local/bin/backup-status-dashboard.sh"
    
    success "Backup system test completed"
}

# Setup backup automation on all servers
setup_distributed_backup() {
    log "Setting up distributed backup configuration..."
    
    for server in "${HETZNER_SERVERS[@]}"; do
        if [ "$server" != "$PRIMARY_SERVER" ]; then
            log "Configuring backup support on $server..."
            
            # Copy etcd backup script to all servers
            scp -i "$SSH_KEY" "$SCRIPT_DIR/etcd-backup-automation.sh" "root@$server:/usr/local/bin/"
            ssh -i "$SSH_KEY" "root@$server" "chmod +x /usr/local/bin/etcd-backup-automation.sh"
            
            # Create backup directories
            ssh -i "$SSH_KEY" "root@$server" "mkdir -p /opt/etcd-backups/{daily,weekly,monthly}"
            
            success "Backup support configured on $server"
        fi
    done
}

# Main setup function
main() {
    log "🕒 Setting up CRM Backup Automation"
    log "==================================="
    
    # Check prerequisites
    if [ ! -f "$BACKUP_SCRIPT" ]; then
        error "Unified backup script not found: $BACKUP_SCRIPT"
        exit 1
    fi
    
    if ! command -v ssh >/dev/null 2>&1; then
        error "SSH client not found"
        exit 1
    fi
    
    # Setup components
    setup_primary_backup
    setup_backup_monitoring
    setup_log_rotation
    create_status_dashboard
    setup_distributed_backup
    
    # Test the system
    test_backup_system
    
    log "🎉 Backup automation setup completed!"
    log "===================================="
    
    info "Backup Schedule:"
    info "  • Daily backups: 2:00 AM (auto-determines type)"
    info "  • etcd backups: Every 6 hours"
    info "  • Monitoring: Every 4 hours"
    info "  • Verification: Weekly on Sundays"
    
    info "Management Commands:"
    info "  • Status: ssh root@$PRIMARY_SERVER '/usr/local/bin/backup-status-dashboard.sh'"
    info "  • Manual backup: ssh root@$PRIMARY_SERVER '/usr/local/bin/unified-ha-backup.sh backup'"
    info "  • List backups: ssh root@$PRIMARY_SERVER '/usr/local/bin/unified-ha-backup.sh list'"
    
    warning "Important:"
    warning "1. Configure email alerts in backup-health-monitor.sh"
    warning "2. Test restore procedures monthly"
    warning "3. Monitor disk usage regularly"
    warning "4. Review backup reports weekly"
}

# Script entry point
case "${1:-setup}" in
    "setup")
        main
        ;;
    "test")
        test_backup_system
        ;;
    "status")
        ssh -i "$SSH_KEY" "root@$PRIMARY_SERVER" "/usr/local/bin/backup-status-dashboard.sh"
        ;;
    *)
        echo "Usage: $0 {setup|test|status}"
        echo ""
        echo "Commands:"
        echo "  setup  - Setup backup automation (default)"
        echo "  test   - Test backup system"
        echo "  status - Show backup status dashboard"
        exit 1
        ;;
esac
