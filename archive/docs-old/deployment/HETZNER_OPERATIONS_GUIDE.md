# Hetzner HA PostgreSQL Operations Guide

## Overview

This guide covers the operational management of the 3-node Patroni PostgreSQL cluster deployed on Hetzner servers. The cluster provides high availability, automatic failover, and zero-downtime operations.

## Architecture Summary

- **3 Hetzner Servers**: ccx13 instances across different regions
- **Patroni Cluster**: 3-node PostgreSQL with automatic leader election
- **etcd Coordination**: Distributed consensus for cluster state
- **HAProxy Load Balancer**: Connection pooling and routing
- **Supabase Stack**: REST API, Auth, Realtime, Storage

## Quick Status Check

```bash
# Check cluster health
./scripts/cluster-status.sh

# Check all services
./scripts/monitor-cluster-health.sh

# Validate deployment
./scripts/validate-deployment.sh
```

## Cluster Management

### 1. Checking Cluster Status

#### Basic Cluster Info
```bash
# From leader node (port 8008)
curl -s http://5.78.103.224:8008/cluster | jq .

# Expected output shows leader + 2 replicas with lag: 0
```

#### Individual Node Status
```bash
# Node 1 (Leader) - port 8008
curl -s http://5.78.103.224:8008/patroni

# Node 2 (Replica) - port 8009  
curl -s http://5.78.103.224:8009/patroni

# Node 3 (Replica) - port 8010
curl -s http://5.78.103.224:8010/patroni
```

#### Database Connectivity
```bash
# Test PostgreSQL connection
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec -T postgres-1 pg_isready"

# Test from each port
pg_isready -h 5.78.103.224 -p 5435  # Leader
pg_isready -h 5.78.103.224 -p 5433  # Replica 1
pg_isready -h 5.78.103.224 -p 5434  # Replica 2
```

### 2. Container Management

#### View All Containers
```bash
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose ps"
```

#### Check Container Logs
```bash
# Patroni logs
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs postgres-1"
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs postgres-2"
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs postgres-3"

# etcd logs
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs etcd"

# HAProxy logs (when running)
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs haproxy"
```

#### Restart Services
```bash
# Restart individual service
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart postgres-1"

# Restart all PostgreSQL nodes (careful!)
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart postgres-1 postgres-2 postgres-3"

# Restart etcd (will cause brief cluster disruption)
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart etcd"
```

## Troubleshooting Common Issues

### 1. Replica Not Streaming

**Symptoms:**
- Replica shows state other than "streaming"
- Non-zero lag on replicas
- Cluster shows fewer than 3 members

**Diagnosis:**
```bash
# Check replica status
curl -s http://5.78.103.224:8009/patroni | jq '.replication_state'
curl -s http://5.78.103.224:8010/patroni | jq '.replication_state'

# Check logs for errors
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs postgres-2 | tail -50"
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs postgres-3 | tail -50"
```

**Resolution:**
```bash
# Restart problematic replica
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart postgres-2"

# If persistent, recreate replica
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose stop postgres-2"
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose rm -f postgres-2"
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-2"
```

### 2. Leader Election Issues

**Symptoms:**
- No leader in cluster
- Multiple leaders (split-brain)
- Frequent leader changes

**Diagnosis:**
```bash
# Check cluster leadership
curl -s http://5.78.103.224:8008/cluster | jq '.members[] | select(.role=="leader")'

# Check etcd health
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec etcd etcdctl endpoint health"
```

**Resolution:**
```bash
# Restart etcd (will trigger re-election)
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart etcd"

# Wait 30 seconds, then check cluster
sleep 30
curl -s http://5.78.103.224:8008/cluster
```

### 3. Connection Issues

**Symptoms:**
- Cannot connect to PostgreSQL
- Connection timeouts
- Authentication failures

**Diagnosis:**
```bash
# Test basic connectivity
telnet 5.78.103.224 5435

# Check PostgreSQL logs
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs postgres-1 | grep ERROR"

# Verify container networking
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 netstat -tlnp"
```

**Resolution:**
```bash
# Restart PostgreSQL containers
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart postgres-1 postgres-2 postgres-3"

# Check firewall (if needed)
ssh root@5.78.103.224 "ufw status"

# Verify Docker networking
ssh root@5.78.103.224 "docker network ls"
ssh root@5.78.103.224 "docker network inspect twincigo-crm_default"
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Cluster Health**
   - Number of running members (should be 3)
   - Leader presence (should be 1)
   - Replica lag (should be 0 or very low)

2. **Database Performance**
   - Connection count
   - Query response time
   - Disk usage
   - Memory usage

3. **System Resources**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network connectivity

### Automated Monitoring Script

```bash
# Run continuous monitoring
./scripts/monitor-cluster-health.sh --continuous

# Check specific metrics
./scripts/cluster-status.sh --detailed

# Generate health report
./scripts/validate-deployment.sh --report
```

## Emergency Procedures

### Complete Cluster Failure

1. **Stop all services**:
   ```bash
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose down"
   ```

2. **Check data integrity**:
   ```bash
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && ls -la deployment/storage/"
   ```

3. **Restart with recovery**:
   ```bash
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d etcd"
   sleep 10
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-1"
   sleep 30
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-2 postgres-3"
   ```

## Backup and Recovery

### Database Backups

```bash
# Create backup from leader
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 pg_dump -U postgres crm > backup_$(date +%Y%m%d_%H%M%S).sql"

# Create compressed backup
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 pg_dump -U postgres crm | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz"
```

### Point-in-Time Recovery

```bash
# List available WAL files
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 ls -la /home/postgres/pgdata/pgroot/data/pg_wal/"

# Restore to specific point (advanced - requires planning)
# This should be done with cluster stopped and proper backup strategy
```

## Scaling Operations

### Adding a New Replica

1. **Prepare new server** (if needed)
2. **Update docker-compose.yml** to add postgres-4
3. **Deploy new container**:
   ```bash
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-4"
   ```
4. **Verify cluster membership**:
   ```bash
   curl -s http://5.78.103.224:8008/cluster
   ```

### Removing a Replica

1. **Stop the replica**:
   ```bash
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose stop postgres-3"
   ```
2. **Remove from cluster** (automatic with Patroni)
3. **Clean up container**:
   ```bash
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose rm -f postgres-3"
   ```

## Security Considerations

### Access Control
- PostgreSQL uses password authentication
- Passwords stored in environment variables
- Network access controlled by Docker networking
- External access limited to specific ports

### SSL/TLS
- PostgreSQL configured for SSL connections
- Certificates managed by Spilo/Patroni
- Client connections should use SSL

### Firewall Rules
```bash
# Check current firewall status
ssh root@5.78.103.224 "ufw status numbered"

# Required open ports:
# 5432-5434: PostgreSQL instances
# 8008-8010: Patroni REST API
# 2379-2380: etcd client/peer
```

## Performance Tuning

### PostgreSQL Configuration
- Managed by Spilo with sensible defaults
- Custom configuration via environment variables
- Memory settings auto-tuned based on container resources

### Connection Pooling
- HAProxy provides connection pooling
- PgBouncer can be added for additional pooling
- Monitor connection counts and adjust pool sizes

### Resource Allocation
```bash
# Check container resource usage
ssh root@5.78.103.224 "docker stats --no-stream"

# Monitor disk usage
ssh root@5.78.103.224 "df -h"

# Check memory usage
ssh root@5.78.103.224 "free -h"
```

## Split-Brain Recovery

1. **Identify the correct leader** (most recent data)
2. **Stop all PostgreSQL containers**
3. **Clear etcd state** (if necessary)
4. **Restart with single node first**
5. **Add replicas one by one**

## Maintenance Windows

### Planned Maintenance

1. **Schedule during low-usage periods**
2. **Notify users of potential brief interruptions**
3. **Test failover procedures**
4. **Update one node at a time**
5. **Verify cluster health after each change**

### Rolling Updates

```bash
# Update replica first (no downtime)
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose pull postgres-2"
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-2"

# Wait for sync, then update next replica
# Finally update leader (brief failover)
```

## Key Commands Reference
```bash
# Quick health check
curl -s http://5.78.103.224:8008/cluster

# Emergency stop
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose down"

# Emergency start
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d"

# View all logs
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs --tail=100"
```

---

**Last Updated**: June 2025
**Version**: 1.0
**Cluster**: gardenos-dev-cluster on Hetzner
