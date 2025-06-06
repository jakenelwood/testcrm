# 🗄️ TwinCiGo CRM Database Documentation

## 📋 Overview

TwinCiGo CRM uses a high-availability PostgreSQL cluster with Patroni for automatic failover, etcd for coordination, and HAProxy for load balancing. This setup provides production-ready reliability with zero-downtime maintenance capabilities.

## 🏗️ Architecture

### 3-Node Cluster Configuration
- **west-1** (5.78.103.224): Primary Patroni leader + Supabase services
- **east-1** (5.161.110.205): Patroni replica + FastAPI backend  
- **east-2** (178.156.186.10): Patroni replica + monitoring

### Technology Stack
- **Database**: PostgreSQL 15 with Patroni HA
- **Coordination**: etcd cluster for leader election
- **Load Balancing**: HAProxy for connection routing
- **Platform**: Supabase (Auth, REST API, Realtime, Storage)
- **Backend**: FastAPI with AI agents

## 📊 Schema Overview

### Core Tables
- **leads_contact_info**: Lead contact and demographic data
- **leads_ins_info**: Insurance-specific lead information
- **addresses**: Normalized address data
- **communications**: All communication tracking
- **vehicles**: Vehicle information for auto insurance
- **homes**: Property information for home insurance
- **specialty_items**: High-value items coverage

### Marketing Analytics
- **campaigns**: Marketing campaign management
- **ab_tests**: A/B testing framework
- **communication_metrics**: Channel-specific engagement
- **customer_touchpoints**: Attribution and journey tracking

### System Tables
- **ai_interactions**: AI agent conversation logs
- **support_tickets**: Customer support tracking
- **contacts**: Additional contact methods

## 🚀 Deployment

### Prerequisites
```bash
# Ensure SSH access to all nodes
ssh root@5.78.103.224   # west-1
ssh root@5.161.110.205  # east-1  
ssh root@178.156.186.10 # east-2
```

### Automated Deployment
```bash
# Deploy complete 3-node cluster
./scripts/deploy-3-node-cluster.sh

# Monitor deployment status
./scripts/monitor-cluster-health.sh
```

### Manual Deployment
```bash
# On each node:
cd /opt/twincigo-crm
docker-compose up -d
```

## 🔧 Management

### Health Checks
```bash
# Check Patroni cluster status
curl http://5.78.103.224:8008/cluster

# Check HAProxy stats
curl http://5.78.103.224:7000/stats

# Test database connectivity
psql -h 5.78.103.224 -p 5000 -U postgres -d crm
```

### Common Operations
```bash
# View cluster status
./scripts/cluster-status.sh

# Perform failover test
./scripts/test-failover.sh

# Backup database
./scripts/backup-database.sh

# Apply schema updates
./scripts/apply-schema-update.sh
```

## 📁 File Organization

### Schema Files (Latest)
- `database/schema/hetzner_optimized_schema.sql` - Base schema (Jun 2, 14:43)
- `database/schema/marketing_data_enhancement.sql` - Marketing tables (Jun 2, 20:32)
- `database/schema/schema_comprehensive_enhancement.sql` - Complete schema (Jun 2, 18:53)

### Migration Files
- `database/migrations/` - Incremental schema changes
- `database/seeds/` - Initial data for development

### Documentation
- `docs/database/gardenOS_dev_vs_production.md` - Architecture reference
- `docs/database/marketing-data-coverage.md` - Marketing analytics spec

## 🔒 Security

### Authentication
- Supabase Auth (gotrue) for user authentication
- JWT tokens for API access
- Row Level Security (RLS) policies

### Database Access
- HAProxy provides connection pooling and SSL termination
- Patroni manages replication and failover
- Environment-specific credentials in `.env` files

## 📈 Monitoring

### Key Metrics
- Database connection count
- Replication lag
- Query performance
- Failover events

### Alerting
- Patroni leader changes
- Database connectivity issues
- High resource utilization
- Backup failures

## 🔄 Backup & Recovery

### Automated Backups
- Daily full backups to external storage
- Continuous WAL archiving
- Point-in-time recovery capability

### Disaster Recovery
- Cross-region backup replication
- Automated failover procedures
- Recovery time objective: < 5 minutes

## 📚 References

- [Architecture Overview](gardenOS_dev_vs_production.md)
- [Marketing Data Coverage](marketing-data-coverage.md)
- [Schema Design Rationale](CRM_Schema_Design_Rationale.md)

---

**Last Updated**: June 4, 2025  
**Maintained By**: TwinCiGo CRM Team
