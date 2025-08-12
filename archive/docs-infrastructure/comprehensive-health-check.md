# 🏥 Comprehensive Health Check Tool

The comprehensive health check script is the **primary monitoring tool** for the CRM infrastructure. It performs 27 individual checks across 7 categories to provide a complete health assessment.

## 🚀 **Quick Start**

### **Basic Usage**
```bash
# Run comprehensive health check
./scripts/comprehensive-health-check.sh

# View generated report
cat health_report_YYYYMMDD_HHMMSS.txt
```

### **Expected Output**
```
🏥 Comprehensive Server Health Check
==================================================
Timestamp: Sat Jun  7 10:30:00 PM CDT 2025
Primary Host: 5.78.103.224
Report File: health_report_20250607_223000.txt

[1/7] Testing host connectivity...
✅ Primary host 5.78.103.224 is reachable
✅ SSH connection to 5.78.103.224 successful
✅ Backup host 5.161.110.205 is reachable
✅ Backup host 178.156.186.10 is reachable

[2/7] Testing etcd cluster...
✅ etcd on 5.78.103.224 is healthy
✅ etcd on 5.161.110.205 is healthy
✅ etcd on 178.156.186.10 is healthy
✅ etcd cluster is fully healthy (3/3 nodes)

[3/7] Testing K3s cluster...
✅ K3s service is running
✅ All K3s nodes are Ready (3/3)
✅ K3s core system pods are running (4/4)

[4/7] Testing Docker services...
✅ Docker service is running
✅ Docker containers are running (3/3)
✅ PostgreSQL containers are running

[5/7] Testing Patroni cluster...
✅ Patroni API on port 8008 is responding
✅ Patroni cluster is healthy (1 leader, 2 replicas, 3 total)
✅ PostgreSQL is accepting connections on port 5435
✅ PostgreSQL is accepting connections on port 5433
✅ PostgreSQL is accepting connections on port 5434

[6/7] Testing application services...
✅ HAProxy Web Frontend is listening on port 8080
✅ HAProxy Stats is listening on port 8404
✅ HAProxy PostgreSQL LB is listening on port 5432
✅ HAProxy K3s API LB is listening on port 6443
✅ Supabase Auth is running in K3s (1 pods)
✅ Supabase REST is running in K3s (1 pods)
✅ Supabase Storage is running in K3s (1 pods)

[7/7] Testing security compliance...
✅ Security compliance: 17/17 checks passed (100%)
✅ Local .env.local file contains safe template values

📊 Health Check Summary
==================================================

Overall Health Score: 96%
✅ Passed: 26
⚠️  Warnings: 1
❌ Failed: 0
📋 Total Checks: 27

🎉 EXCELLENT HEALTH - Production Ready!

📄 Full report saved to: health_report_20250607_223000.txt
```

## 📊 **Health Check Categories**

### **1. 🌐 Host Connectivity Tests**
**Purpose**: Verify network connectivity and SSH access to all servers

**Checks Performed**:
- Primary host ping test (5.78.103.224)
- SSH connectivity test with timeout
- Backup host ping tests (5.161.110.205, 178.156.186.10)

**Success Criteria**:
- All hosts respond to ping
- SSH connection established within 10 seconds
- No network connectivity issues

### **2. 🔧 etcd Cluster Health**
**Purpose**: Validate etcd coordination service used by K3s and Patroni

**Checks Performed**:
- Health endpoint test for each etcd node
- Cluster quorum assessment
- Response validation

**Success Criteria**:
- All 3 etcd nodes return `{"health":"true"}`
- Cluster maintains quorum (>50% nodes healthy)
- No coordination service failures

### **3. ☸️ K3s Cluster Health**
**Purpose**: Ensure Kubernetes infrastructure is operational

**Checks Performed**:
- K3s service status check
- Node readiness validation
- Core system pod status

**Success Criteria**:
- K3s service active and running
- All 3 nodes in "Ready" state
- Core pods (coredns, metrics-server, etc.) running

### **4. 🐳 Docker Services Health**
**Purpose**: Verify container runtime and PostgreSQL containers

**Checks Performed**:
- Docker service status
- Container status via docker compose
- PostgreSQL container verification

**Success Criteria**:
- Docker service active
- All expected containers running
- PostgreSQL containers healthy

### **5. 🗄️ Patroni PostgreSQL Cluster**
**Purpose**: Validate database high availability cluster

**Checks Performed**:
- Patroni API endpoint tests (ports 8008, 8009, 8010)
- Cluster topology analysis (leader/replica count)
- Database connectivity tests (ports 5435, 5433, 5434)

**Success Criteria**:
- Exactly 1 leader and 2+ replicas
- All Patroni APIs responding
- Database accepting connections on all ports

### **6. 🚀 Application Services**
**Purpose**: Check application-layer services and load balancers

**Checks Performed**:
- HAProxy service ports (8080, 8404, 5432, 6443)
- K3s-based Supabase services (gotrue, postgrest, storage-api)
- Service pod counts and status

**Success Criteria**:
- HAProxy listening on expected ports
- Supabase services running in K3s
- All application endpoints accessible

### **7. 🔒 Security Compliance**
**Purpose**: Validate security configuration and environment management

**Checks Performed**:
- Security validation script execution
- Environment file security assessment
- Configuration compliance check

**Success Criteria**:
- All 17 security checks pass
- Environment files properly managed
- No security vulnerabilities detected

## 📈 **Health Scoring System**

### **Score Calculation**
```
Health Score = (Passed Checks / Total Checks) × 100%
```

### **Health Categories**
| Score Range | Status | Description | Action Required |
|-------------|--------|-------------|-----------------|
| 90-100% | 🎉 EXCELLENT | Production Ready | None - monitor regularly |
| 75-89% | ⚠️ GOOD | Minor Issues | Address warnings |
| 50-74% | ⚠️ FAIR | Several Issues | Investigate and fix |
| 0-49% | 🚨 POOR | Critical Issues | Immediate attention required |

### **Check Result Types**
- **✅ Passed**: Check completed successfully
- **⚠️ Warning**: Check passed with concerns
- **❌ Failed**: Check failed - requires attention

## 🔧 **Configuration**

### **Script Configuration**
```bash
# Primary server
HETZNER_HOST="5.78.103.224"

# Backup servers
BACKUP_HOSTS=("5.161.110.205" "178.156.186.10")

# Docker compose directory
COMPOSE_DIR="/opt/twincigo-crm"

# Report file naming
REPORT_FILE="health_report_${TIMESTAMP}.txt"
```

### **Customization Options**
- Modify host lists for different environments
- Adjust timeout values for network tests
- Add custom service checks
- Configure alert thresholds

## 📋 **Report Generation**

### **Report Contents**
- **Timestamp and environment information**
- **Detailed check results with color coding**
- **Health score and categorization**
- **Issue and warning summaries**
- **Recommendations for improvements**

### **Report Files**
- **Location**: Current directory
- **Naming**: `health_report_YYYYMMDD_HHMMSS.txt`
- **Format**: Plain text with ANSI color codes
- **Retention**: Manual cleanup (consider archiving)

## 🚨 **Troubleshooting**

### **Common Issues**

#### **SSH Connection Failures**
```bash
# Check SSH key and connectivity
ssh -v root@5.78.103.224

# Verify SSH key permissions
chmod 600 ~/.ssh/id_ed25519
```

#### **etcd Health Check Failures**
```bash
# Check etcd directly
curl -s http://5.78.103.224:2379/health

# Verify etcd service
ssh root@5.78.103.224 "systemctl status etcd"
```

#### **Patroni Cluster Issues**
```bash
# Check Patroni cluster status
curl -s http://5.78.103.224:8008/cluster | jq .

# Verify container status
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose ps"
```

### **Script Debugging**
```bash
# Run with verbose output
bash -x ./scripts/comprehensive-health-check.sh

# Check specific functions
# Edit script to add debug statements as needed
```

## 🔄 **Integration with Other Tools**

### **Automated Monitoring**
```bash
# Run as cron job (daily at 6 AM)
0 6 * * * /path/to/scripts/comprehensive-health-check.sh

# Integration with alerting systems
./scripts/comprehensive-health-check.sh && echo "Health check passed" || echo "Health check failed"
```

### **CI/CD Integration**
```bash
# Pre-deployment health check
./scripts/comprehensive-health-check.sh
if [ $? -eq 0 ]; then
    echo "Infrastructure healthy - proceeding with deployment"
else
    echo "Infrastructure issues detected - aborting deployment"
    exit 1
fi
```

## 📚 **Related Documentation**

- **[Session Management](./session-management.md)** - Development environment management
- **[Cluster Monitoring](./cluster-monitoring.md)** - Database cluster specific monitoring
- **[Security Monitoring](./security-monitoring.md)** - Security validation details
- **[Troubleshooting Guide](./troubleshooting.md)** - Issue resolution procedures

---

**📝 Last Updated**: June 7, 2025  
**🔄 Review Schedule**: Monthly  
**📊 Current Health Score**: 96% (Excellent)
