# 🌱 GardenOS Architecture Guide

## 🎯 Vision: Progressive Evolution from CRM to AI-Powered Platform

GardenOS represents the evolution of the CRM system into a comprehensive AI-powered business platform with clustering, failover, and autonomous agent capabilities.

## 📊 Current State (Phase 1) ✅

### Single Server Architecture
- **Database**: PostgreSQL 16.9 on Hetzner CCX33
- **Schema**: Optimized with clean naming (leads, clients, ai_agents)
- **Extensions**: pgvector for AI embeddings, uuid-ossp, pg_trgm
- **Status**: Operational and tested

### Key Achievements
- ✅ Clean database schema with proper relationships
- ✅ AI-ready architecture with vector embeddings
- ✅ Sample data and proper indexing
- ✅ External connectivity configured
- ✅ Automated backups configured

## 🔄 Development Environment (Phase 2)

### Docker Compose Cluster Simulation

**Purpose**: Test clustering and failover scenarios locally before production deployment.

**Architecture Components**:
```yaml
services:
  # PostgreSQL Cluster (Patroni)
  postgres-1:
    image: patroni/patroni:latest
  postgres-2:
    image: patroni/patroni:latest  
  postgres-3:
    image: patroni/patroni:latest

  # Coordination Service
  etcd:
    image: quay.io/coreos/etcd:latest

  # Load Balancer
  haproxy:
    image: haproxy:latest

  # Supabase Services
  supabase-auth:
    image: supabase/gotrue:latest
  supabase-rest:
    image: postgrest/postgrest:latest
  supabase-realtime:
    image: supabase/realtime:latest
  supabase-storage:
    image: supabase/storage-api:latest
  supabase-studio:
    image: supabase/studio:latest

  # Python Microservices
  csv-import-service:
    build: ./python-services/csv-import
```

**Folder Structure**:
```
gardenos-dev/
├── docker-compose.yml          # Main orchestration
├── Makefile                    # Easy commands
├── .env                        # Environment variables
├── patroni/
│   ├── patroni.yml            # Patroni configuration
│   ├── postgres-1.yml         # Node 1 config
│   ├── postgres-2.yml         # Node 2 config
│   └── postgres-3.yml         # Node 3 config
├── haproxy/
│   └── haproxy.cfg            # Load balancer config
├── etcd/
│   └── etcd.conf.yml          # Coordination config
├── supabase/
│   ├── .env                   # JWT secrets, DB creds
│   ├── auth.env               # GoTrue configuration
│   ├── rest.env               # PostgREST configuration
│   └── storage.env            # Storage API configuration
├── python-services/
│   └── csv-import/
│       ├── Dockerfile
│       ├── requirements.txt
│       └── main.py
└── scripts/
    ├── init-cluster.sh        # Initialize Patroni cluster
    ├── test-failover.sh       # Test failover scenarios
    └── backup-cluster.sh      # Backup procedures
```

**Key Features**:
- **Patroni Clustering**: 3-node PostgreSQL cluster with automatic failover
- **HAProxy Load Balancing**: Routes traffic to healthy PostgreSQL nodes
- **Supabase Integration**: All services connect via HAProxy for consistency
- **Development Workflow**: Single command to start/stop entire environment
- **Failover Testing**: Simulate node failures and validate recovery

**Management Commands**:
```bash
# Start the entire development environment
make dev-up

# Stop everything
make dev-down

# View logs from all services
make logs

# Test failover by stopping primary node
make test-failover

# Backup the cluster
make backup

# Reset and rebuild everything
make clean && make dev-up
```

## 🎯 Production Architecture (Phase 3)

### Multi-Server Patroni Cluster

**Infrastructure**:
- **3 × CCX33 Hetzner instances** for PostgreSQL cluster
- **1 × CCX11 instance** for monitoring and backups
- **Private networking** between all nodes
- **Floating IP** for external access

**High Availability Features**:
- **Automatic failover** with Patroni
- **Load balancing** with HAProxy
- **Streaming replication** between nodes
- **Point-in-time recovery** with wal-g
- **Monitoring** with Prometheus + Grafana

**Disaster Recovery**:
- **Automated backups** to Hetzner Object Storage
- **Cross-region replication** for critical data
- **Recovery procedures** documented and tested

## 🤖 AI Agent Architecture

### LangGraph Integration

**Agent Types**:
- **Follow-up Agent**: Automated client communication
- **Insight Agent**: Data analysis and recommendations  
- **Support Agent**: Customer service automation
- **Design Agent**: Quote and proposal generation

**Data Flow**:
```
Client Data → Vector Embeddings → Agent Memory → LangGraph → Actions
```

**Storage Strategy**:
- **agent_memory**: Persistent context with vector embeddings
- **agent_subscriptions**: Proactive monitoring rules
- **ai_interactions**: Complete audit trail of AI actions

## 📈 Scaling Strategy

### Performance Targets
- **Concurrent Users**: 100+ simultaneous users
- **Query Response**: < 100ms for 95% of queries  
- **Data Volume**: 1M+ leads, 100K+ clients
- **Uptime**: 99.9% availability target

### Monitoring & Observability
- **Database Metrics**: Query performance, connection pools, replication lag
- **Application Metrics**: API response times, error rates, feature usage
- **Infrastructure Metrics**: Server resources, network performance, disk usage
- **AI Metrics**: Agent performance, embedding quality, action success rates

## 🔒 Security & Compliance

### Data Protection
- **Encryption**: TLS 1.3 for all connections, encrypted backups
- **Access Control**: Row-level security, API rate limiting
- **Audit Logging**: Complete trail of data access and modifications

### Compliance Readiness
- **GDPR**: Data handling and deletion procedures
- **SOC 2**: Security controls and monitoring
- **Regular Audits**: Automated security scanning

## 📚 Documentation Standards

### Living Documentation
- **Architecture decisions** recorded with rationale
- **Runbooks** for common operations and troubleshooting
- **API documentation** auto-generated from code
- **Disaster recovery** procedures tested quarterly

### Knowledge Management
- **Team onboarding** guides for new developers
- **Troubleshooting** guides with common issues and solutions
- **Performance tuning** guidelines and best practices

## 🚀 Implementation Roadmap

### Immediate (Next 2 weeks)
- [ ] Update application to use Hetzner database
- [ ] Implement Docker Compose development environment
- [ ] Test failover scenarios locally

### Short-term (Next month)
- [ ] Deploy production Patroni cluster
- [ ] Implement monitoring and alerting
- [ ] Enhanced backup and recovery procedures

### Medium-term (Next quarter)
- [ ] AI agent deployment and testing
- [ ] Performance optimization and scaling
- [ ] Advanced security implementations

This architecture provides a clear evolution path from simple to sophisticated while maintaining operational simplicity at each stage.
