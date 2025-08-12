# Hetzner HA PostgreSQL Troubleshooting Guide

## Quick Diagnostic Commands

### Immediate Health Check
```bash
# Quick cluster status
./scripts/cluster-status.sh

# Detailed monitoring
./scripts/monitor-cluster-health.sh --alert

# Container status
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose ps"
```

### Emergency Commands
```bash
# Emergency stop all services
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose down"

# Emergency start core cluster
./scripts/manage-cluster.sh start

# Check if database is accepting connections
pg_isready -h 5.78.103.224 -p 5435
```

## Common Issues and Solutions

### 1. Cluster Won't Start

**Symptoms:**
- Containers fail to start
- etcd connection errors
- Patroni initialization failures

**Diagnosis:**
```bash
# Check Docker status
ssh root@5.78.103.224 "systemctl status docker"

# Check container logs
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs etcd"
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs postgres-1"

# Check disk space
ssh root@5.78.103.224 "df -h"

# Check memory
ssh root@5.78.103.224 "free -h"
```

**Solutions:**
```bash
# Clean up Docker resources
ssh root@5.78.103.224 "docker system prune -f"
ssh root@5.78.103.224 "docker volume prune -f"

# Restart Docker service
ssh root@5.78.103.224 "systemctl restart docker"

# Remove and recreate containers
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose down"
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d etcd"
# Wait 10 seconds
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-1"
```

### 2. Split-Brain Scenario

**Symptoms:**
- Multiple leaders in cluster
- Inconsistent cluster state
- Connection failures

**Diagnosis:**
```bash
# Check cluster members
curl -s http://5.78.103.224:8008/cluster | jq '.members[] | {name, role, state}'
curl -s http://5.78.103.224:8009/cluster | jq '.members[] | {name, role, state}'
curl -s http://5.78.103.224:8010/cluster | jq '.members[] | {name, role, state}'

# Check etcd health
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec etcd etcdctl endpoint health"
```

**Solutions:**
```bash
# Stop all PostgreSQL containers
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose stop postgres-1 postgres-2 postgres-3"

# Clear etcd state (DANGEROUS - only if necessary)
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec etcd etcdctl del --prefix /"

# Restart etcd
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart etcd"

# Start leader first
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-1"
# Wait 30 seconds
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-2 postgres-3"
```

### 3. High Replication Lag

**Symptoms:**
- Replica lag > 1000ms
- Slow query performance
- Data inconsistency

**Diagnosis:**
```bash
# Check replication status
curl -s http://5.78.103.224:8009/patroni | jq '.replication_state'
curl -s http://5.78.103.224:8010/patroni | jq '.replication_state'

# Check WAL files
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 ls -la /home/postgres/pgdata/pgroot/data/pg_wal/ | wc -l"

# Check system resources
ssh root@5.78.103.224 "iostat -x 1 5"
ssh root@5.78.103.224 "top -bn1 | head -20"
```

**Solutions:**
```bash
# Restart problematic replica
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart postgres-2"

# Check network connectivity
ssh root@5.78.103.224 "docker network inspect twincigo-crm_default"

# Monitor replication recovery
watch "curl -s http://5.78.103.224:8009/patroni | jq '.replication_state.lag'"
```

### 4. Connection Pool Exhaustion

**Symptoms:**
- "too many connections" errors
- Application timeouts
- High connection count

**Diagnosis:**
```bash
# Check active connections
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 psql -U postgres -c \"SELECT count(*) FROM pg_stat_activity;\""

# Check connection details
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 psql -U postgres -c \"SELECT state, count(*) FROM pg_stat_activity GROUP BY state;\""

# Check max connections setting
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 psql -U postgres -c \"SHOW max_connections;\""
```

**Solutions:**
```bash
# Kill idle connections
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 psql -U postgres -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '5 minutes';\""

# Restart PostgreSQL containers (will drop all connections)
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart postgres-1 postgres-2 postgres-3"

# Start HAProxy for connection pooling
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d haproxy"
```

### 5. Disk Space Issues

**Symptoms:**
- Container startup failures
- Write errors
- WAL file accumulation

**Diagnosis:**
```bash
# Check disk usage
ssh root@5.78.103.224 "df -h"

# Check Docker space usage
ssh root@5.78.103.224 "docker system df"

# Check PostgreSQL data directory
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 du -sh /home/postgres/pgdata/"
```

**Solutions:**
```bash
# Clean up Docker resources
ssh root@5.78.103.224 "docker system prune -f"
ssh root@5.78.103.224 "docker image prune -a -f"

# Clean up old WAL files (automatic with PostgreSQL, but can check)
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 psql -U postgres -c \"SELECT pg_switch_wal();\""

# Archive old logs
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs > /tmp/cluster-logs-$(date +%Y%m%d).log && docker compose logs --tail=0 -f > /dev/null &"
```

### 6. etcd Corruption

**Symptoms:**
- etcd health check failures
- Cluster state inconsistencies
- Patroni unable to connect to etcd

**Diagnosis:**
```bash
# Check etcd health
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec etcd etcdctl endpoint health"

# Check etcd logs
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs etcd | tail -50"

# Check etcd data
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec etcd etcdctl get --prefix /"
```

**Solutions:**
```bash
# Stop all services
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose down"

# Remove etcd data volume (WILL RESET CLUSTER STATE)
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker volume rm twincigo-crm_etcd-data"

# Restart services
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d etcd"
# Wait 10 seconds
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-1"
# Wait 30 seconds
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-2 postgres-3"
```

## Performance Troubleshooting

### Slow Queries

**Diagnosis:**
```bash
# Check slow queries
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 psql -U postgres -d crm -c \"SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;\""

# Check active queries
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 psql -U postgres -d crm -c \"SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';\""
```

### High CPU Usage

**Diagnosis:**
```bash
# Check container CPU usage
ssh root@5.78.103.224 "docker stats --no-stream"

# Check PostgreSQL processes
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose exec postgres-1 top"

# Check system load
ssh root@5.78.103.224 "uptime && iostat -x 1 3"
```

## Recovery Procedures

### Complete Cluster Recovery

1. **Stop all services**:
   ```bash
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose down"
   ```

2. **Check data integrity**:
   ```bash
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && ls -la deployment/storage/"
   ```

3. **Start services in order**:
   ```bash
   # Start etcd
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d etcd"
   sleep 10
   
   # Start leader
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-1"
   sleep 30
   
   # Start replicas
   ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose up -d postgres-2 postgres-3"
   ```

4. **Verify cluster health**:
   ```bash
   ./scripts/cluster-status.sh --detailed
   ```

### Data Recovery from Backup

1. **Stop cluster**:
   ```bash
   ./scripts/manage-cluster.sh stop
   ```

2. **Restore from backup**:
   ```bash
   ./scripts/manage-cluster.sh restore backups/crm_backup_YYYYMMDD_HHMMSS.sql.gz
   ```

3. **Start cluster**:
   ```bash
   ./scripts/manage-cluster.sh start
   ```

## Monitoring and Alerting

### Continuous Monitoring
```bash
# Start continuous monitoring
./scripts/monitor-cluster-health.sh --continuous --interval 30

# Quick alert check
./scripts/monitor-cluster-health.sh --alert
```

### Log Analysis
```bash
# View recent logs
./scripts/manage-cluster.sh logs postgres-1 100

# Monitor logs in real-time
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose logs -f postgres-1"
```

## Emergency Contacts and Escalation

### Critical Issues
- Database completely unavailable
- Data corruption detected
- Security breach suspected

### Warning Issues
- High replication lag
- Resource usage above 80%
- Single node failures

### Information
- Planned maintenance
- Performance optimization
- Capacity planning

---

**Remember**: Always test recovery procedures in a non-production environment first!

**Last Updated**: June 2025  
**Version**: 1.0  
**Cluster**: gardenos-dev-cluster on Hetzner
