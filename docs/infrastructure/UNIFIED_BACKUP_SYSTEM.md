# 🔄 Unified HA Backup System

Comprehensive backup solution for the RonRico CRM's Patroni + etcd HA setup, ensuring complete data protection across all critical components.

## 📋 Overview

The Unified HA Backup System provides enterprise-grade backup coverage for:

- **etcd Cluster**: Coordination service state and configuration
- **PostgreSQL**: Primary database with Patroni HA management
- **Supabase**: User data, file storage, and configuration
- **FastAPI**: AI agent memory, coroutine state, and persistent data

## 🎯 Key Features

### **Intelligent Backup Scheduling**
- **Auto-Detection**: Automatically determines backup type based on date
- **Retention Policies**: Configurable retention for daily/weekly/monthly/yearly backups
- **Unified Archives**: Single archive containing all components for easy restore

### **Comprehensive Coverage**
```bash
# Components Backed Up
├── etcd/           # Cluster snapshots with verification
├── postgres/       # Full database dumps via existing script
├── supabase/       # Configuration and file storage
├── fastapi/        # AI agent memory and persistent state
└── unified/        # Combined archive of all components
```

### **Enterprise Features**
- **Automated Monitoring**: Health checks and alerting
- **Integrity Verification**: Backup validation and corruption detection
- **Distributed Storage**: Multi-location backup storage
- **Detailed Reporting**: JSON and human-readable reports

## 🚀 Quick Start

### **Deploy Backup System**
```bash
# Full deployment (includes backup automation)
./scripts/deploy-infrastructure-upgrades.sh deploy

# Setup backup automation only
./scripts/setup-backup-automation.sh setup
```

### **Manual Backup Operations**
```bash
# Auto-determine backup type (daily/weekly/monthly/yearly)
./scripts/unified-ha-backup.sh backup

# Force specific backup type
./scripts/unified-ha-backup.sh daily
./scripts/unified-ha-backup.sh weekly
./scripts/unified-ha-backup.sh monthly

# List available backups
./scripts/unified-ha-backup.sh list

# Check backup status
./scripts/setup-backup-automation.sh status
```

## 📅 Automated Schedule

### **Cron Configuration**
```bash
# Daily backup at 2:00 AM (auto-determines if weekly/monthly/yearly)
0 2 * * * /usr/local/bin/unified-ha-backup.sh backup

# Additional etcd-only backup every 6 hours
0 */6 * * * /usr/local/bin/etcd-backup-automation.sh daily

# Weekly verification on Sundays at 3:00 AM
0 3 * * 0 /usr/local/bin/unified-ha-backup.sh list

# Monthly log cleanup
0 4 1 * * find /var/log/crm-backups -name "*.log" -mtime +90 -delete
```

### **Backup Type Logic**
```bash
# Automatic backup type determination
January 1st    → yearly backup
1st of month   → monthly backup  
Sunday         → weekly backup
Other days     → daily backup
```

## 🗂️ Backup Structure

### **Directory Layout**
```
/opt/crm-backups/
├── daily/
│   ├── etcd/           # Daily etcd snapshots
│   ├── postgres/       # Daily database dumps
│   ├── supabase/       # Daily Supabase backups
│   ├── fastapi/        # Daily FastAPI data
│   └── unified/        # Daily unified archives
├── weekly/             # Weekly backups (same structure)
├── monthly/            # Monthly backups (same structure)
├── yearly/             # Yearly backups (same structure)
└── sessions/           # Backup session metadata
    └── backup_YYYYMMDD_HHMMSS/
```

### **Backup Naming Convention**
```bash
# Component backups
etcd_backup_YYYYMMDD_HHMMSS.db.gz
postgres_YYYYMMDD_HHMMSS.sql.gz
supabase_backup_YYYYMMDD_HHMMSS_config.yaml.gz
fastapi_backup_YYYYMMDD_HHMMSS_config.yaml.gz

# Unified archive
crm_unified_backup_YYYYMMDD_HHMMSS.tar.gz
```

## 🔧 Component Details

### **etcd Backup**
```bash
# Uses etcdctl for consistent snapshots
ETCDCTL_API=3 etcdctl snapshot save backup.db \
    --endpoints="5.78.103.224:2379,5.78.103.225:2379,5.78.103.226:2379"

# Verification
ETCDCTL_API=3 etcdctl snapshot status backup.db.gz
```

### **PostgreSQL Backup**
```bash
# Leverages existing backup-postgres.sh
# Identifies Patroni leader automatically
# Creates compressed pg_dump via leader pod
# Stores in MinIO with verification
```

### **Supabase Backup**
```bash
# Configuration backup
kubectl get all,secrets,configmaps -n supabase -o yaml

# File storage backup (if using file storage)
tar czf supabase_storage.tar.gz /var/lib/storage
```

### **FastAPI Backup**
```bash
# Configuration and secrets
kubectl get all,secrets,configmaps,pvc -n fastapi -o yaml

# AI agent persistent data
find /app -name "*.pkl" -o -name "*.json" -o -name "*.state"
```

## 📊 Retention Policies

### **Default Retention**
```bash
RETENTION_DAILY=7      # Keep 7 daily backups
RETENTION_WEEKLY=4     # Keep 4 weekly backups  
RETENTION_MONTHLY=12   # Keep 12 monthly backups
RETENTION_YEARLY=3     # Keep 3 yearly backups
```

### **Storage Requirements**
```bash
# Estimated backup sizes (compressed)
etcd:      ~50MB per backup
postgres:  ~500MB per backup (varies with data)
supabase:  ~100MB per backup
fastapi:   ~50MB per backup
unified:   ~700MB per backup

# Total storage for full retention: ~25GB
```

## 🔍 Monitoring & Alerting

### **Health Monitoring**
```bash
# Automated health checks every 4 hours
/usr/local/bin/backup-health-monitor.sh

# Checks performed:
- Recent backup existence (last 25 hours)
- Backup size validation (minimum thresholds)
- Disk space monitoring (alert at 85%)
- Component backup freshness
```

### **Status Dashboard**
```bash
# Comprehensive status overview
/usr/local/bin/backup-status-dashboard.sh

# Displays:
- Recent backups summary
- Backup type distribution
- Storage usage
- Component status
- Recent issues/errors
```

### **Alerting Configuration**
```bash
# Email alerts (configure in backup-health-monitor.sh)
ALERT_EMAIL="admin@ronrico-crm.com"

# Alert conditions:
- No recent backups found
- Backup size too small
- High disk usage (>85%)
- Component backup failures
```

## 🔄 Restore Procedures

### **Preparation**
```bash
# List available backups
./scripts/unified-ha-backup.sh list

# Identify session ID for restore
# Format: backup_YYYYMMDD_HHMMSS
```

### **Full System Restore**
```bash
# WARNING: This will replace all current data
./scripts/unified-ha-backup.sh restore backup_20250108_120000 all
```

### **Component-Specific Restore**
```bash
# Restore individual components
./scripts/unified-ha-backup.sh restore backup_20250108_120000 etcd
./scripts/unified-ha-backup.sh restore backup_20250108_120000 postgres
./scripts/unified-ha-backup.sh restore backup_20250108_120000 supabase
./scripts/unified-ha-backup.sh restore backup_20250108_120000 fastapi
```

### **Manual Restore Process**
```bash
# 1. Stop affected services
kubectl scale deployment --replicas=0 -n fastapi
kubectl scale statefulset --replicas=0 -n postgres-cluster

# 2. Extract backup archive
tar xzf crm_unified_backup_YYYYMMDD_HHMMSS.tar.gz

# 3. Restore etcd
etcdctl snapshot restore etcd/etcd_backup_YYYYMMDD_HHMMSS.db.gz

# 4. Restore PostgreSQL
kubectl exec -i postgres-0 -- psql -U postgres < postgres/postgres_YYYYMMDD_HHMMSS.sql

# 5. Restore configurations
kubectl apply -f supabase/supabase_backup_YYYYMMDD_HHMMSS_config.yaml
kubectl apply -f fastapi/fastapi_backup_YYYYMMDD_HHMMSS_config.yaml

# 6. Restart services
kubectl scale statefulset --replicas=3 -n postgres-cluster
kubectl scale deployment --replicas=1 -n fastapi
```

## 📈 Reporting

### **Backup Reports**
```bash
# JSON report location
docs/reporting/backup_reports/unified_backup_YYYYMMDD_HHMMSS.json

# Report contents:
{
    "session_id": "backup_20250108_120000",
    "backup_type": "daily",
    "duration_seconds": 180,
    "total_size_bytes": 734003200,
    "components": ["etcd:50MB", "postgres:500MB", "supabase:100MB", "fastapi:50MB"],
    "status": "SUCCESS",
    "errors": [],
    "warnings": []
}
```

### **Summary Reports**
```bash
# Human-readable summary
docs/reporting/backup_reports/backup_summary_YYYYMMDD_HHMMSS.txt

# Contains:
- Backup session details
- Component status
- Size information
- Error/warning summary
```

## 🔧 Troubleshooting

### **Common Issues**

1. **etcd Backup Fails**
   ```bash
   # Check etcd cluster health
   curl http://5.78.103.224:2379/health
   
   # Verify etcdctl connectivity
   ETCDCTL_API=3 etcdctl endpoint health
   ```

2. **PostgreSQL Backup Fails**
   ```bash
   # Check Patroni leader
   kubectl exec postgres-0 -- patronictl list
   
   # Verify database connectivity
   kubectl exec postgres-0 -- pg_isready
   ```

3. **Disk Space Issues**
   ```bash
   # Check backup disk usage
   df -h /opt/crm-backups
   
   # Manual cleanup
   ./scripts/unified-ha-backup.sh cleanup
   ```

4. **Missing Backups**
   ```bash
   # Check cron status
   systemctl status cron
   
   # Review backup logs
   tail -f /var/log/crm-backups/unified-backup.log
   ```

## 🎯 Best Practices

### **Operational**
- Test restore procedures monthly
- Monitor backup sizes for growth trends
- Review retention policies quarterly
- Validate backup integrity weekly

### **Security**
- Encrypt backups for off-site storage
- Restrict backup directory access
- Audit backup access logs
- Use secure transport for backup transfers

### **Performance**
- Schedule backups during low-usage periods
- Monitor backup duration trends
- Optimize backup compression settings
- Consider incremental backups for large datasets

---

**Last Updated**: December 8, 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
