# 📊 CRM Monitoring & Health Reports

**Centralized monitoring documentation and health report storage**

> **📋 Quick Commands**: See [docs/README.md](../README.md#-command-reference) for all essential commands

## 🎯 **Purpose**

This directory contains:
- **Health report storage** - Automated reports from comprehensive health checks
- **Monitoring tool documentation** - Detailed guides for each monitoring script
- **Analysis tools** - Scripts and guides for report analysis

### **📊 Health Check Results**
- **90%+ Health Score**: Production Ready ✅
- **75-89% Health Score**: Good Health (minor issues) ⚠️
- **50-74% Health Score**: Fair Health (needs attention) ⚠️
- **<50% Health Score**: Poor Health (critical issues) 🚨

## 📁 **Documentation Structure**

### **📊 Health Reports**
- **[Health Reports Archive](./health_reports/)** - Generated health check reports
- **Latest Reports**: `health_report_YYYYMMDD_HHMMSS.txt`
- **Report Analysis**: Historical health trends and patterns

### **Core Monitoring Tools**
- **[Comprehensive Health Check](./comprehensive-health-check.md)** - Main health monitoring tool
- **[Session Management](./session-management.md)** - Environment and development session tools
- **[Cluster Monitoring](./cluster-monitoring.md)** - PostgreSQL HA cluster monitoring
- **[Security Monitoring](./security-monitoring.md)** - Security validation and compliance

### **Infrastructure Monitoring**
- **[Server Health](./server-health.md)** - Host connectivity and system status
- **[Database Monitoring](./database-monitoring.md)** - PostgreSQL, Patroni, and etcd monitoring
- **[Application Monitoring](./application-monitoring.md)** - K3s, Supabase, and service monitoring
- **[Network Monitoring](./network-monitoring.md)** - Connectivity and port monitoring

### **Operational Procedures**
- **[Daily Operations](./daily-operations.md)** - Routine monitoring tasks
- **[Troubleshooting Guide](./troubleshooting.md)** - Common issues and solutions
- **[Emergency Procedures](./emergency-procedures.md)** - Critical issue response
- **[Maintenance Procedures](./maintenance.md)** - Regular maintenance tasks

## 🎯 **Monitoring Architecture**

### **Infrastructure Components**
```
┌─────────────────────────────────────────────────────────────┐
│                    CRM Infrastructure                       │
├─────────────────────────────────────────────────────────────┤
│  🌐 Host Layer                                             │
│  ├── Primary: 5.78.103.224 (ubuntu-8gb-hil-1)            │
│  ├── Backup:  5.161.110.205 (ubuntu-8gb-ash-1)           │
│  └── Backup:  178.156.186.10 (ubuntu-8gb-ash-2)          │
├─────────────────────────────────────────────────────────────┤
│  🔧 Coordination Layer                                     │
│  └── etcd Cluster (3 nodes) - Shared by K3s & Patroni     │
├─────────────────────────────────────────────────────────────┤
│  ☸️  Kubernetes Layer (K3s)                               │
│  ├── Control Plane (3 nodes)                              │
│  ├── Supabase Services (ClusterIP + Ingress)              │
│  └── Application Services                                  │
├─────────────────────────────────────────────────────────────┤
│  🗄️  Database Layer                                        │
│  ├── Patroni HA Cluster (3 nodes)                         │
│  ├── PostgreSQL 17 with Spilo                             │
│  └── HAProxy Load Balancer                                 │
├─────────────────────────────────────────────────────────────┤
│  🐳 Container Layer                                        │
│  └── Docker Compose Services                               │
└─────────────────────────────────────────────────────────────┘
```

### **Monitoring Coverage**
- **✅ Host Connectivity**: Ping, SSH, network reachability
- **✅ etcd Cluster**: Health endpoints, quorum status
- **✅ K3s Cluster**: Node status, pod health, services
- **✅ PostgreSQL HA**: Patroni cluster, replication lag, connectivity
- **✅ Application Services**: HAProxy, Supabase, APIs
- **✅ Security Compliance**: 17 security checks, environment management
- **✅ Performance**: Resource usage, response times

## 🛠️ **Tool Categories**

### **🏥 Health Check Tools**
| Tool | Purpose | Frequency | Scope |
|------|---------|-----------|-------|
| `comprehensive-health-check.sh` | Complete infrastructure health | Daily/On-demand | All systems |
| `cluster-status.sh` | PostgreSQL cluster status | Multiple times daily | Database layer |
| `validate-security.js` | Security compliance | Weekly/Pre-deployment | Security |
| `resolve-health-warnings.sh` | Address specific warnings | As needed | Issue resolution |

### **📊 Session Management Tools**
| Tool | Purpose | Usage | Environment |
|------|---------|-------|-------------|
| `start-session.sh` | Begin development session | Start of work | Development |
| `end-session.sh` | End session with backup | End of work | Development |
| `manage-env-files.sh` | Environment file operations | As needed | All |

### **🔍 Diagnostic Tools**
| Tool | Purpose | When to Use | Output |
|------|---------|-------------|--------|
| `monitor-cluster-health.sh` | Continuous monitoring | Background/Alerts | Real-time status |
| `diagnose-current-state.sh` | Deep system analysis | Troubleshooting | Detailed diagnostics |
| `inspect-hetzner-server.sh` | Server inspection | Initial setup/Issues | Server state |

## 📈 **Monitoring Best Practices**

### **Daily Monitoring Routine**
1. **Morning Health Check**
   ```bash
   ./scripts/comprehensive-health-check.sh
   ```

2. **Start Development Session**
   ```bash
   ./scripts/start-session.sh
   ```

3. **Periodic Status Checks**
   ```bash
   ./scripts/cluster-status.sh
   ```

4. **End Session Backup**
   ```bash
   ./scripts/end-session.sh
   ```

### **Weekly Monitoring Tasks**
- Run security validation
- Review health check reports
- Check system resource usage
- Verify backup integrity

### **Monthly Monitoring Tasks**
- Performance analysis
- Capacity planning review
- Security audit
- Documentation updates

## 🚨 **Alert Thresholds**

### **Critical Alerts (Immediate Action)**
- Database cluster has no leader
- etcd cluster lost quorum
- Host unreachable
- Security compliance failures

### **Warning Alerts (Monitor Closely)**
- High replication lag (>1MB)
- Single node failures
- Resource usage >80%
- Service response time >5s

### **Info Alerts (Informational)**
- Environment file updates
- Successful failover tests
- Routine maintenance completed

## 📚 **Additional Resources**

### **Related Documentation**
- **[Deployment Guide](../deployment/README.md)** - Infrastructure deployment
- **[Database Documentation](../database/README.md)** - Database architecture
- **[Security Documentation](../SECURITY_REMEDIATION_PLAN.md)** - Security implementation

### **External Tools**
- **K9s**: Terminal UI for K3s cluster monitoring
- **HAProxy Stats**: Web interface at `http://server:8404/stats`
- **Patroni API**: REST API for cluster management

### **Support Contacts**
- **Infrastructure Issues**: Check troubleshooting guide first
- **Security Concerns**: Run security validation immediately
- **Emergency Procedures**: Follow emergency response guide

---

**📝 Last Updated**: $(date)  
**🔄 Review Schedule**: Monthly  
**👥 Maintained By**: Development Team
