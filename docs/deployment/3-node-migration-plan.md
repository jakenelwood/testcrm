# 🚀 3-Node CCX13 Migration Plan

## Overview
Migration from single CCX33 to three CCX13 servers for true high-availability deployment.

## Current State Backup ✅
- **Schema Preserved**: `database/schema/hetzner_optimized_schema.sql` (490 lines)
- **Comprehensive Schema**: `database/schema/schema_comprehensive_enhancement.sql` (500+ lines)
- **Migration Scripts**: Available in `database/migrations/`

## New Infrastructure Plan

### Server Configuration
- **3× Hetzner CCX13 servers**
- **2 vCPUs, 8GB RAM, 80GB SSD each**
- **Cost**: ~€17.49/month total vs €15.51/month for single CCX33
- **Benefit**: True HA with automatic failover

### Network Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (HAProxy)                  │
│                         Port 5000                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼───┐         ┌───▼───┐         ┌───▼───┐
│ CCX13 │         │ CCX13 │         │ CCX13 │
│ Node1 │         │ Node2 │         │ Node3 │
│ Leader│         │Replica│         │Replica│
└───────┘         └───────┘         └───────┘
```

## Migration Steps

### Phase 1: Server Setup
1. **Provision 3× CCX13 servers**
2. **Configure networking and SSH access**
3. **Install Docker and Docker Compose on all nodes**
4. **Set up shared storage/backup strategy**

### Phase 2: Cluster Configuration
1. **Deploy etcd cluster (3 nodes)**
2. **Deploy Patroni PostgreSQL cluster**
3. **Configure HAProxy for load balancing**
4. **Test cluster formation and failover**

### Phase 3: Data Migration
1. **Deploy schema using `hetzner_optimized_schema.sql`**
2. **Import any existing data (if recoverable)**
3. **Verify data integrity**
4. **Test all application connections**

### Phase 4: Application Deployment
1. **Deploy Supabase services**
2. **Deploy FastAPI backend**
3. **Configure monitoring and logging**
4. **Update DNS/connection strings**

## Configuration Files Ready

### Docker Compose (Updated for 3-node)
- ✅ `deployment/docker-compose.yml` - Updated with proper Patroni config
- ✅ Environment variables configured
- ✅ HAProxy configuration aligned

### Scripts Ready
- ✅ `scripts/cleanup-and-align-deployment.sh`
- ✅ `scripts/start-services-sequentially.sh`
- ✅ `scripts/monitor-hetzner-deployment.sh`
- ✅ `scripts/debug-service-failures.sh`

## Benefits of 3-Node Setup

### High Availability
- **Automatic failover** if primary node fails
- **Zero-downtime maintenance** possible
- **Split-brain protection** with 3-node quorum

### Performance
- **Read replicas** for better query performance
- **Load distribution** across nodes
- **Better resource utilization**

### Production Readiness
- **Matches production architecture**
- **Real HA testing environment**
- **Simplified deployment pipeline**

## Post-Migration Verification

### Database Cluster Health
```bash
# Check Patroni cluster status
curl http://node1:8008/cluster
curl http://node2:8008/cluster  
curl http://node3:8008/cluster

# Test failover
# Stop primary node and verify automatic promotion
```

### Application Connectivity
```bash
# Test HAProxy load balancing
psql -h haproxy -p 5000 -U postgres -d crm

# Test Supabase services
curl http://node1:3000/health
curl http://node1:3001
```

### Performance Testing
- **Connection pooling efficiency**
- **Query performance across nodes**
- **Failover time measurement**
- **Backup and restore procedures**

## Rollback Plan
If issues arise:
1. **Keep current CCX33 as backup**
2. **DNS switch back to original**
3. **Data export/import procedures ready**
4. **Configuration rollback scripts**

## Timeline Estimate
- **Server provisioning**: 30 minutes
- **Cluster setup**: 2-3 hours
- **Data migration**: 1 hour
- **Testing and verification**: 2 hours
- **Total**: ~6 hours for complete migration

## Next Steps
1. **Provision the 3 CCX13 servers**
2. **Update deployment scripts with new IPs**
3. **Execute migration plan**
4. **Comprehensive testing**
5. **Update documentation**

This migration will provide a robust, production-ready environment that eliminates the complexity we've been dealing with in the single-node simulation.
