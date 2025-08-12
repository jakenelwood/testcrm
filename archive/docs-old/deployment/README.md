# TwinCiGo CRM Hetzner HA Deployment Documentation

## 📋 Documentation Index

This directory contains comprehensive documentation for deploying and managing the TwinCiGo CRM system on Hetzner servers with high availability PostgreSQL infrastructure.

### 🏗️ **Core Documentation**

#### [HETZNER_OPERATIONS_GUIDE.md](./HETZNER_OPERATIONS_GUIDE.md)
**Complete operational guide for the Hetzner HA PostgreSQL cluster**
- Architecture overview and component descriptions
- Cluster management procedures
- Container operations and monitoring
- Troubleshooting common issues
- Backup and recovery procedures
- Security considerations
- Performance tuning guidelines
- Emergency procedures and maintenance windows

#### [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
**Comprehensive troubleshooting guide for common issues**
- Quick diagnostic commands
- Emergency procedures
- Common issues and step-by-step solutions
- Performance troubleshooting
- Recovery procedures
- Monitoring and alerting setup

### 🔧 **Management Scripts**

#### [scripts/cluster-status.sh](../../scripts/cluster-status.sh)
**Comprehensive cluster status monitoring script**
```bash
# Basic status check
./scripts/cluster-status.sh

# Detailed status with resource usage
./scripts/cluster-status.sh --detailed

# Show recent logs
./scripts/cluster-status.sh --logs
```

#### [scripts/monitor-cluster-health.sh](../../scripts/monitor-cluster-health.sh)
**Continuous health monitoring with alerting**
```bash
# Single health check
./scripts/monitor-cluster-health.sh

# Continuous monitoring
./scripts/monitor-cluster-health.sh --continuous

# Quick alert check only
./scripts/monitor-cluster-health.sh --alert

# Custom interval monitoring
./scripts/monitor-cluster-health.sh --continuous --interval 60
```

#### [scripts/manage-cluster.sh](../../scripts/manage-cluster.sh)
**Complete cluster management operations**
```bash
# Cluster operations
./scripts/manage-cluster.sh start
./scripts/manage-cluster.sh stop
./scripts/manage-cluster.sh restart
./scripts/manage-cluster.sh status

# Service management
./scripts/manage-cluster.sh start-services
./scripts/manage-cluster.sh stop-services

# Database operations
./scripts/manage-cluster.sh apply-schema
./scripts/manage-cluster.sh backup
./scripts/manage-cluster.sh restore backup_file.sql.gz

# Maintenance
./scripts/manage-cluster.sh failover-test
./scripts/manage-cluster.sh logs postgres-1 100
```

### 🚀 **Quick Start Guide**

#### 1. **Initial Deployment**
```bash
# Deploy the cluster
./scripts/deploy-to-hetzner-gardenos.sh

# Verify deployment
./scripts/validate-deployment.sh

# Check cluster status
./scripts/cluster-status.sh
```

#### 2. **Daily Operations**
```bash
# Morning health check
./scripts/monitor-cluster-health.sh --alert

# Check cluster status
./scripts/cluster-status.sh

# View recent logs if needed
./scripts/manage-cluster.sh logs all 50
```

#### 3. **Emergency Procedures**
```bash
# Quick diagnostic
./scripts/cluster-status.sh --detailed

# Emergency stop
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose down"

# Emergency start
./scripts/manage-cluster.sh start

# Check connectivity
pg_isready -h 5.78.103.224 -p 5435
```

### 📊 **Architecture Overview**

#### **Current Deployment (Single Server)**
- **Host**: 5.78.103.224 (Hetzner ccx13)
- **Cluster**: 3-node Patroni PostgreSQL with etcd coordination
- **High Availability**: Automatic failover and leader election
- **Load Balancing**: HAProxy for connection pooling
- **Monitoring**: Real-time health checks and alerting

#### **Component Ports**
- **PostgreSQL Leader**: 5435
- **PostgreSQL Replica 1**: 5433
- **PostgreSQL Replica 2**: 5434
- **Patroni API Node 1**: 8008
- **Patroni API Node 2**: 8009
- **Patroni API Node 3**: 8010
- **etcd Client**: 2379
- **etcd Peer**: 2380
- **HAProxy Stats**: 7000
- **Supabase Studio**: 3000 (when running)

### 🔍 **Monitoring and Alerting**

#### **Health Check Levels**
1. **HEALTHY**: All systems operational
2. **WARNING**: Non-critical issues detected
3. **CRITICAL**: Immediate attention required

#### **Key Metrics**
- Cluster member count (should be 3)
- Leader count (should be 1)
- Replication lag (should be 0 or very low)
- Database connectivity
- Container health
- Resource usage (CPU, memory, disk)

#### **Automated Monitoring**
```bash
# Start continuous monitoring
./scripts/monitor-cluster-health.sh --continuous --log-file /var/log/cluster-health.log

# Set up cron job for regular checks
echo "*/5 * * * * /path/to/scripts/monitor-cluster-health.sh --alert" | crontab -
```

### 🛠️ **Maintenance Procedures**

#### **Regular Maintenance**
- **Daily**: Health checks and log review
- **Weekly**: Performance monitoring and resource usage review
- **Monthly**: Backup verification and failover testing
- **Quarterly**: Security updates and capacity planning

#### **Backup Strategy**
```bash
# Create daily backup
./scripts/manage-cluster.sh backup

# Automated backup script
echo "0 2 * * * /path/to/scripts/manage-cluster.sh backup" | crontab -
```

#### **Update Procedures**
1. **Test in development environment**
2. **Schedule maintenance window**
3. **Create backup before updates**
4. **Update one replica at a time**
5. **Verify cluster health after each update**

### 🔐 **Security Considerations**

#### **Access Control**
- SSH key-based authentication
- PostgreSQL password authentication
- Network isolation via Docker networking
- Firewall rules for external access

#### **Data Protection**
- Encrypted connections (SSL/TLS)
- Regular backups with compression
- Point-in-time recovery capability
- Audit logging enabled

### 📈 **Performance Optimization**

#### **Database Tuning**
- Automatic memory allocation by Spilo
- Connection pooling via HAProxy
- WAL archiving and cleanup
- Query performance monitoring

#### **Resource Monitoring**
```bash
# Check resource usage
./scripts/cluster-status.sh --detailed

# Monitor performance
./scripts/monitor-cluster-health.sh --continuous
```

### 🆘 **Emergency Contacts**

#### **Critical Issues**
- Database completely unavailable
- Data corruption detected
- Security breach suspected

#### **Escalation Procedures**
1. **Immediate**: Run diagnostic scripts
2. **5 minutes**: Attempt automated recovery
3. **15 minutes**: Manual intervention
4. **30 minutes**: Escalate to senior team

### 📚 **Additional Resources**

#### **External Documentation**
- [Patroni Documentation](https://patroni.readthedocs.io/)
- [etcd Documentation](https://etcd.io/docs/)
- [HAProxy Documentation](http://www.haproxy.org/download/2.4/doc/configuration.txt)
- [Supabase Documentation](https://supabase.com/docs)

#### **Related Files**
- [Docker Compose Configuration](../../deployment/docker-compose.yml)
- [Environment Templates](../../.env.local.template)
- [Database Schema](../../database/)
- [Deployment Scripts](../../scripts/)

---

## 🎯 **Getting Help**

### **For Operational Issues**
1. Check [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
2. Run diagnostic scripts
3. Review logs and monitoring data
4. Follow escalation procedures

### **For Development Issues**
1. Check application logs
2. Verify database connectivity
3. Test with local development environment
4. Review environment configuration

### **For Infrastructure Issues**
1. Check Hetzner server status
2. Verify network connectivity
3. Review Docker and system logs
4. Check resource availability

---

**Last Updated**: June 2025  
**Version**: 1.0  
**Deployment**: Hetzner HA PostgreSQL Cluster  
**Maintainer**: TwinCiGo CRM Team
