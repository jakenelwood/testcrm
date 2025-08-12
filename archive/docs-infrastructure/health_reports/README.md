# 📊 Health Reports Archive

This directory contains generated health check reports from the comprehensive health check tool.

## 📋 **Report Overview**

### **Current Reports**
```
health_report_20250607_221605.txt  # 22:16 (10:16 PM)
health_report_20250607_221724.txt  # 22:17 (10:17 PM)  
health_report_20250607_221842.txt  # 22:18 (10:18 PM)
health_report_20250607_222111.txt  # 22:21 (10:21 PM)
health_report_20250607_222608.txt  # 22:26 (10:26 PM)
health_report_20250607_222926.txt  # 22:29 (10:29 PM)
health_report_20250607_223151.txt  # 22:32 (10:32 PM)
health_report_20250607_231733.txt  # 23:18 (11:18 PM) ← MOST RECENT
```

### **Latest Health Status**
- **Health Score**: 96% (Excellent - Production Ready) 🎉
- **Total Checks**: 28
- **Passed**: 27
- **Failed**: 1 (Security parsing issue)
- **Warnings**: 0

## 📄 **Report File Format**

### **File Naming Convention**
```
health_report_YYYYMMDD_HHMMSS.txt
```
- **YYYY**: Year (2025)
- **MM**: Month (06 = June)  
- **DD**: Day (07)
- **HH**: Hour (24-hour format)
- **MM**: Minute
- **SS**: Second

### **Report Contents**
1. **Header**: Timestamp, host information, report metadata
2. **Host Connectivity**: Network and SSH connectivity tests
3. **etcd Cluster**: Coordination service health (3 nodes)
4. **K3s Cluster**: Kubernetes infrastructure status
5. **Docker Services**: Container runtime and PostgreSQL containers
6. **Patroni Cluster**: Database HA cluster (1 leader + 2 replicas)
7. **Application Services**: HAProxy, Supabase, and application endpoints
8. **Security Compliance**: 17 security checks and environment validation
9. **Summary**: Health score, pass/fail counts, issues, and recommendations

## 🔍 **Viewing Reports**

### **View Latest Report**
```bash
# From project root
cat docs/reporting/health_reports/$(ls -t docs/reporting/health_reports/health_report_*.txt | head -1 | xargs basename)

# Or navigate to directory
cd docs/reporting/health_reports
cat $(ls -t health_report_*.txt | head -1)
```

### **View Specific Report**
```bash
# View by timestamp
cat docs/reporting/health_reports/health_report_20250607_231733.txt

# View with less for easier reading
less docs/reporting/health_reports/health_report_20250607_231733.txt
```

### **Compare Reports**
```bash
# Compare two reports
diff docs/reporting/health_reports/health_report_20250607_222926.txt \
     docs/reporting/health_reports/health_report_20250607_231733.txt
```

## 📈 **Health Trends Analysis**

### **Health Score History**
Based on available reports:
- **All reports**: 96%+ health score (Excellent)
- **Consistent performance**: Infrastructure stability maintained
- **Minor issues**: Occasional security parsing errors (non-critical)

### **Infrastructure Stability**
- **✅ Host Connectivity**: 100% uptime across all reports
- **✅ etcd Cluster**: 100% healthy (3/3 nodes) consistently
- **✅ K3s Cluster**: All nodes Ready, stable pod counts
- **✅ PostgreSQL HA**: 1 leader + 2 replicas, zero replication lag
- **✅ Application Services**: HAProxy and Supabase services stable

## 🗂️ **Report Management**

### **Automatic Generation**
Reports are automatically generated when running:
```bash
./scripts/comprehensive-health-check.sh
```

### **Manual Cleanup**
```bash
# Keep only the 5 most recent reports
cd docs/reporting/health_reports
ls -t health_report_*.txt | tail -n +6 | xargs rm -f

# Archive old reports
mkdir -p archive/$(date +%Y-%m)
ls -t health_report_*.txt | tail -n +6 | xargs -I {} mv {} archive/$(date +%Y-%m)/
```

### **Report Retention Policy**
- **Keep**: Last 10 reports for trend analysis
- **Archive**: Monthly archives for historical reference
- **Cleanup**: Remove reports older than 3 months

## 📊 **Report Analysis Tools**

### **Quick Health Summary**
```bash
# Extract health scores from all reports
grep "Overall Health Score:" docs/reporting/health_reports/health_report_*.txt

# Count total checks across reports
grep "Total Checks:" docs/reporting/health_reports/health_report_*.txt

# Find any failed checks
grep "Failed:" docs/reporting/health_reports/health_report_*.txt
```

### **Issue Tracking**
```bash
# Find reports with critical issues
grep -l "Critical Issues:" docs/reporting/health_reports/health_report_*.txt

# Extract all warnings
grep -A 5 "Warnings:" docs/reporting/health_reports/health_report_*.txt
```

## 🔗 **Related Documentation**

- **[Comprehensive Health Check](../comprehensive-health-check.md)** - Tool documentation
- **[Reporting Overview](../README.md)** - Main reporting guide
- **[Quick Reference](../quick-reference.md)** - Essential commands

## 📝 **Report Generation Schedule**

### **Recommended Frequency**
- **Daily**: Morning health check before starting work
- **Pre-deployment**: Before any infrastructure changes
- **Post-incident**: After resolving any issues
- **Weekly**: Comprehensive review and trend analysis

### **Automated Scheduling**
```bash
# Add to crontab for daily 6 AM health check
0 6 * * * cd /home/brian-berge/Dev/CRM-REPOSITORY/crm && ./scripts/comprehensive-health-check.sh
```

---

**📝 Last Updated**: June 7, 2025  
**📊 Current Health Score**: 96% (Excellent)  
**🔄 Next Review**: Daily monitoring recommended
