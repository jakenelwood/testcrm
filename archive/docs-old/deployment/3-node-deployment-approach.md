# 🚀 TwinCiGo CRM 3-Node Deployment Approach

## 📋 Executive Summary

This document outlines the comprehensive approach for deploying TwinCiGo CRM across three Hetzner CCX13 servers, implementing a production-ready, high-availability PostgreSQL cluster with Patroni, comprehensive marketing analytics, and AI-powered automation.

## 🎯 Deployment Objectives

### Primary Goals
- **Zero-downtime deployment** with automatic failover capability
- **Production-ready architecture** that scales horizontally
- **Complete marketing analytics** with attribution tracking
- **AI-native design** with LangGraph agent integration
- **DRY principles** throughout infrastructure and code

### Success Criteria
- All 3 nodes operational with automatic failover
- Database cluster healthy with < 1 second replication lag
- All application services accessible and responsive
- Marketing analytics capturing comprehensive data
- AI agents operational and responsive

## 🏗️ Infrastructure Architecture

### Node Configuration
```
┌─────────────────────────────────────────────────────────────┐
│                    TwinCiGo CRM Cluster                     │
├─────────────────┬─────────────────┬─────────────────────────┤
│ ubuntu-8gb-hil-1│ ubuntu-8gb-ash-1│   ubuntu-8gb-ash-2      │
│ 5.78.103.224    │ 5.161.110.205   │   178.156.186.10        │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • Patroni Leader│ • Patroni Replica│ • Patroni Replica       │
│ • etcd Node     │ • etcd Node     │ • etcd Node             │
│ • HAProxy LB    │ • FastAPI       │ • Monitoring            │
│ • Supabase Auth │ • AI Agents     │ • Grafana               │
│ • Supabase REST │ • Backend APIs  │ • Loki                  │
│ • Realtime      │                 │ • Alerting              │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Service Distribution Strategy
- **ubuntu-8gb-hil-1**: Primary database + user-facing services
- **ubuntu-8gb-ash-1**: Application logic + AI processing
- **ubuntu-8gb-ash-2**: Monitoring + backup operations

## 📊 Database Expert Recommendations

### Schema Deployment Strategy
1. **Use latest consolidated schema**: `database/schema/twincigo_crm_complete_schema.sql`
2. **Version 2.0.0** includes complete CRM + marketing analytics
3. **Apply schema after cluster formation** to ensure consistency
4. **Verify schema integrity** across all replicas

### High Availability Best Practices
- **Patroni configuration** with proper etcd integration
- **Synchronous replication** for critical data consistency
- **Connection pooling** via HAProxy for optimal performance
- **Automated failover** with health checks every 5 seconds

### Performance Optimization
- **JSONB indexes** for flexible marketing data queries
- **Vector indexes** for AI embedding searches
- **Partitioning strategy** for high-volume communication logs
- **Query optimization** for real-time analytics

## 🔄 Deployment Phases

### Phase 1: Infrastructure Preparation (30 minutes)
```bash
# Automated via script
./scripts/deploy-3-node-cluster.sh

# Manual verification
./scripts/cluster-status.sh
```

**Tasks:**
- SSH connectivity verification
- Docker installation on all nodes
- File synchronization across nodes
- Network configuration validation

### Phase 2: Database Cluster Formation (45 minutes)
```bash
# Sequential deployment
1. Deploy etcd cluster (all nodes)
2. Deploy Patroni leader (ubuntu-8gb-hil-1)
3. Deploy Patroni replicas (ubuntu-8gb-ash-1, ubuntu-8gb-ash-2)
4. Deploy HAProxy load balancer
5. Verify cluster formation
```

**Validation:**
- Patroni cluster status: `curl http://ubuntu-8gb-hil-1:8008/cluster`
- Replication lag: < 1 second
- Failover test: Automatic leader promotion

### Phase 3: Schema Application (15 minutes)
```bash
# Apply complete schema
psql -h ubuntu-8gb-hil-1 -p 5000 -U postgres -d crm < twincigo_crm_complete_schema.sql

# Verify across replicas
for node in ubuntu-8gb-hil-1 ubuntu-8gb-ash-1 ubuntu-8gb-ash-2; do
  psql -h $node -p 5432 -U postgres -d crm -c "\dt"
done
```

**Validation:**
- Table count verification
- Index creation confirmation
- Sample data insertion test

### Phase 4: Application Services (30 minutes)
```bash
# Deploy Supabase services (ubuntu-8gb-hil-1)
docker-compose up -d supabase-auth supabase-rest supabase-realtime

# Deploy FastAPI backend (ubuntu-8gb-ash-1)
docker-compose up -d fastapi-backend

# Deploy monitoring (ubuntu-8gb-ash-2)
docker-compose up -d grafana loki prometheus
```

**Validation:**
- Service health checks
- API endpoint testing
- Authentication flow verification

### Phase 5: Verification & Testing (20 minutes)
```bash
# Comprehensive health check
./scripts/cluster-status.sh

# Load testing
./scripts/load-test.sh

# Failover testing
./scripts/test-failover.sh
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Database cluster
POSTGRES_PASSWORD=CRM_Dev_Password_2025_Hetzner
POSTGRES_REPLICATION_PASSWORD=CRM_Replication_Dev_2025_Hetzner
POSTGRES_ADMIN_PASSWORD=CRM_Admin_Dev_2025_Hetzner

# Node-specific
NODE_NAME=ubuntu-8gb-hil-1|ubuntu-8gb-ash-1|ubuntu-8gb-ash-2
NODE_IP=5.78.103.224|5.161.110.205|178.156.186.10

# Application
SUPABASE_URL=http://5.78.103.224:3000
FASTAPI_URL=http://5.161.110.205:8000
```

### Docker Compose Strategy
- **Single compose file** with service-specific profiles
- **Environment-based configuration** for node differences
- **Health checks** for all critical services
- **Restart policies** for automatic recovery

## 📈 Monitoring & Alerting

### Key Metrics to Track
- **Database**: Connection count, replication lag, query performance
- **Application**: Response times, error rates, throughput
- **Infrastructure**: CPU, memory, disk, network utilization
- **Business**: Lead conversion rates, campaign performance

### Alert Thresholds
- **Critical**: Database unavailable, leader election failure
- **Warning**: High resource utilization (>80%), slow queries
- **Info**: Successful failover, backup completion

## 🔒 Security Implementation

### Database Security
- **Row Level Security (RLS)** policies for multi-tenant data
- **JWT authentication** with Supabase Auth
- **Connection encryption** via SSL/TLS
- **Audit logging** for all data modifications

### Network Security
- **HAProxy SSL termination** for encrypted connections
- **Internal network isolation** between services
- **Firewall rules** restricting external access
- **SSH key-based authentication** only

## 🔄 Backup & Recovery

### Automated Backup Strategy
- **Daily full backups** to external storage
- **Continuous WAL archiving** for point-in-time recovery
- **Cross-region replication** for disaster recovery
- **Backup verification** with automated restore testing

### Recovery Procedures
- **Point-in-time recovery**: < 15 minutes RPO
- **Full cluster rebuild**: < 2 hours RTO
- **Single node replacement**: < 30 minutes
- **Data corruption recovery**: Automated rollback

## 📋 Post-Deployment Checklist

### Immediate Verification (First 24 hours)
- [ ] All services responding to health checks
- [ ] Database replication functioning correctly
- [ ] Failover testing successful
- [ ] Application functionality verified
- [ ] Monitoring and alerting operational

### Ongoing Maintenance (Weekly)
- [ ] Performance metrics review
- [ ] Backup verification
- [ ] Security patch assessment
- [ ] Capacity planning review
- [ ] Documentation updates

## 🚀 Scaling Strategy

### Horizontal Scaling
- **Application containers**: Add more FastAPI instances
- **Read replicas**: Additional PostgreSQL read-only nodes
- **Load balancing**: Multiple HAProxy instances
- **Microservices**: Split monolithic services

### Vertical Scaling
- **Upgrade to CCX33**: 4 vCPUs, 16GB RAM for production
- **NVMe storage**: Faster disk I/O for database
- **Dedicated networking**: Enhanced network performance
- **Memory optimization**: Larger buffer pools

## 📚 Documentation Maintenance

### Living Documentation Principle
- **Architecture diagrams** updated with each deployment
- **Runbooks** maintained for common operations
- **Troubleshooting guides** based on real incidents
- **Performance baselines** documented and tracked

### Knowledge Transfer
- **Deployment procedures** fully automated and documented
- **Monitoring dashboards** with clear metrics definitions
- **Alert playbooks** for rapid incident response
- **Training materials** for team onboarding

---

**Deployment Lead**: Database Expert  
**Review Date**: June 4, 2025  
**Next Review**: July 4, 2025  
**Status**: Ready for Implementation
