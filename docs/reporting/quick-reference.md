# 🚀 Monitoring Quick Reference Card

## 📋 **Essential Commands**

### **🏥 Health Checks**
```bash
# PRIMARY TOOL - Run this daily
./scripts/comprehensive-health-check.sh

# Quick cluster status
./scripts/cluster-status.sh

# Security validation
node scripts/validate-security.js
```

### **📁 Session Management**
```bash
# Start development session
./scripts/start-session.sh

# End session with backup
./scripts/end-session.sh
```

### **🔍 Troubleshooting**
```bash
# Resolve health warnings
./scripts/resolve-health-warnings.sh

# Continuous monitoring
./scripts/monitor-cluster-health.sh --continuous
```

## 📊 **Health Score Guide**

| Score | Status | Action |
|-------|--------|--------|
| 90-100% | 🎉 EXCELLENT | Monitor regularly |
| 75-89% | ⚠️ GOOD | Address warnings |
| 50-74% | ⚠️ FAIR | Investigate issues |
| 0-49% | 🚨 POOR | Immediate attention |

## 🎯 **Daily Workflow**

### **Morning Routine**
1. `./scripts/comprehensive-health-check.sh`
2. `./scripts/start-session.sh`
3. Select development environment

### **Development Work**
1. `npm run dev`
2. Make changes and test
3. Check status as needed: `./scripts/cluster-status.sh`

### **End of Day**
1. `./scripts/end-session.sh`
2. Review health report if issues

## 🚨 **Emergency Commands**

### **Critical Issues**
```bash
# Quick diagnostic
./scripts/comprehensive-health-check.sh

# Check cluster status
./scripts/cluster-status.sh

# SSH to server for manual intervention
ssh root@5.78.103.224
```

### **Service Recovery**
```bash
# Restart services on server
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart"

# Check service status
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose ps"
```

## 📁 **File Locations**

### **Scripts**
- `scripts/comprehensive-health-check.sh` - Main health check
- `scripts/start-session.sh` - Start development session
- `scripts/end-session.sh` - End session with backup
- `scripts/cluster-status.sh` - Quick cluster status
- `scripts/validate-security.js` - Security validation

### **Documentation**
- `docs/monitoring/README.md` - Complete monitoring guide
- `docs/monitoring/comprehensive-health-check.md` - Health check details
- `docs/monitoring/session-management.md` - Session management guide

### **Reports**
- `docs/reporting/health_reports/health_report_YYYYMMDD_HHMMSS.txt` - Generated health reports
- `.env-backup/.env.local.backup.TIMESTAMP` - Environment file backups

## 🔧 **Configuration Files**

### **Environment Management**
- `.env-management-config` - Server connection settings
- `.env.local` - Active environment file
- `.env-files/` - Downloaded server environments

### **Server Locations**
- Primary: `5.78.103.224`
- Backup: `5.161.110.205`, `178.156.186.10`
- Environment files: `/root/crm-env-files/`

## 📞 **Quick Troubleshooting**

### **SSH Issues**
```bash
ssh -v root@5.78.103.224
chmod 600 ~/.ssh/id_ed25519
```

### **Environment Issues**
```bash
# Reset to server state
rm .env.local .env-files/*
./scripts/start-session.sh
```

### **Health Check Issues**
```bash
# Run with debug
bash -x ./scripts/comprehensive-health-check.sh
```

## 📚 **Documentation Links**

- **[Complete Monitoring Guide](./README.md)**
- **[Health Check Details](./comprehensive-health-check.md)**
- **[Session Management](./session-management.md)**
- **[Troubleshooting Guide](./troubleshooting.md)**

---

**📝 Keep this card handy for daily operations!**  
**🔄 Updated**: June 7, 2025
