# 🏢 TwinCiGo CRM

High-availability, AI-native Customer Relationship Management system built for insurance agencies. Features a 3-node PostgreSQL cluster with Patroni, comprehensive marketing analytics, and intelligent automation.

## 🎯 Overview

TwinCiGo CRM is designed as a production-ready, scalable solution that combines traditional CRM functionality with modern AI capabilities and comprehensive marketing analytics.

## ✨ Features

- **🗄️ High-Availability Database**: 3-node PostgreSQL cluster with Patroni and automatic failover
- **🤖 AI-Powered Automation**: LangGraph agents for follow-ups, insights, and customer support
- **📊 Marketing Analytics**: Comprehensive campaign tracking, A/B testing, and attribution
- **📞 Communication Hub**: Integrated email, SMS, phone, and social media tracking
- **🔒 Enterprise Security**: Row-level security, JWT authentication, and audit trails
- **📈 Real-time Analytics**: Live dashboards and performance monitoring
- **🚀 Scalable Architecture**: Container-based deployment with horizontal scaling

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
- **Frontend**: Next.js with TypeScript

## 🚀 Quick Start

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
./scripts/cluster-status.sh
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
# Check cluster status
./scripts/cluster-status.sh

# Check Patroni cluster
curl http://5.78.103.224:8008/cluster

# Test database connectivity
psql -h 5.78.103.224 -p 5000 -U postgres -d crm
```

### Access URLs
- **Database (HAProxy)**: 5.78.103.224:5000
- **Supabase Dashboard**: http://5.78.103.224:3000
- **FastAPI Backend**: http://5.161.110.205:8000
- **HAProxy Stats**: http://5.78.103.224:7000/stats
- **Monitoring**: http://178.156.186.10:3001

## 📊 Database Schema

### Core Tables
- **clients**: Lead contact and demographic data
- **leads**: Insurance-specific lead information
- **campaigns**: Marketing campaign management
- **communications**: All communication tracking
- **vehicles/homes/specialty_items**: Asset information

### Latest Schema
- **File**: `database/schema/twincigo_crm_complete_schema.sql`
- **Version**: 2.0.0 (June 4, 2025)
- **Features**: Complete CRM + marketing analytics

## 📚 Documentation

- [Architecture Overview](docs/database/gardenOS_dev_vs_production.md)
- [Database Documentation](docs/database/README.md)
- [Marketing Data Coverage](docs/database/marketing-data-coverage.md)
- [Schema Design Rationale](docs/database/CRM_Schema_Design_Rationale.md)

## 🔒 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Database**: Row Level Security (RLS) policies
- **Network**: HAProxy SSL termination and connection pooling
- **Monitoring**: Comprehensive audit trails and alerting

## 🚀 Deployment

### Production Checklist
- [ ] All 3 nodes accessible via SSH
- [ ] Docker installed on all nodes
- [ ] Environment variables configured
- [ ] SSL certificates deployed
- [ ] Monitoring and alerting configured
- [ ] Backup procedures tested

### Scaling
- **Horizontal**: Add more application containers
- **Vertical**: Upgrade to CCX33 nodes for production
- **Database**: Read replicas for query performance
- **Storage**: External object storage (MinIO/S3)

## 📈 Monitoring

### Key Metrics
- Database connection count and replication lag
- Application response times and error rates
- Resource utilization across nodes
- Marketing campaign performance

### Alerting
- Patroni leader changes and failover events
- High resource utilization warnings
- Application health check failures
- Backup and maintenance notifications

---

**Last Updated**: June 4, 2025
**Maintained By**: TwinCiGo CRM Team
**License**: Proprietary
