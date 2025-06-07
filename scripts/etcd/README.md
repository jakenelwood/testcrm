# 🔗 etcd Cluster Scripts for GardenOS

This directory contains scripts for setting up and managing the 3-node etcd cluster that serves as the distributed datastore for both K3s and Patroni in the GardenOS architecture.

## 📁 Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-etcd-cluster.sh` | **Complete etcd cluster management** | Setup, start, stop, status |

## 🏗️ Architecture

The etcd cluster provides distributed consensus and key-value storage for:

- **K3s Kubernetes cluster** - Cluster state and configuration
- **Patroni PostgreSQL cluster** - Leader election and configuration
- **Service discovery** - Dynamic service registration

```
┌─────────────────────────────────────────────────────────────┐
│                    etcd Cluster Layout                      │
├─────────────────────────────────────────────────────────────┤
│  Node: ubuntu-8gb-hil-1 (5.78.103.224)                               │
│  ├─ etcd member: ubuntu-8gb-hil-1                                     │
│  ├─ Client port: 2379                                       │
│  └─ Peer port: 2380                                         │
│                                                             │
│  Node: ubuntu-8gb-ash-1 (5.161.110.205)                              │
│  ├─ etcd member: ubuntu-8gb-ash-1                                     │
│  ├─ Client port: 2379                                       │
│  └─ Peer port: 2380                                         │
│                                                             │
│  Node: ubuntu-8gb-ash-2 (178.156.186.10)                             │
│  ├─ etcd member: ubuntu-8gb-ash-2                                     │
│  ├─ Client port: 2379                                       │
│  └─ Peer port: 2380                                         │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Complete Setup

```bash
# Set up the entire etcd cluster
./setup-etcd-cluster.sh setup-cluster

# Start all etcd nodes
./setup-etcd-cluster.sh start-cluster

# Check cluster status
./setup-etcd-cluster.sh status-cluster
```

### Individual Operations

```bash
# Install etcd on all nodes
./setup-etcd-cluster.sh install-etcd

# Install on specific node
./setup-etcd-cluster.sh install-etcd --node ubuntu-8gb-hil-1

# Stop cluster
./setup-etcd-cluster.sh stop-cluster

# Clean up old installation
./setup-etcd-cluster.sh cleanup-old
```

## 🔧 Configuration

### Server Configuration

The script uses these default server mappings:

```bash
declare -A SERVERS=(
    ["ubuntu-8gb-hil-1"]="5.78.103.224"
    ["ubuntu-8gb-ash-1"]="5.161.110.205"
    ["ubuntu-8gb-ash-2"]="178.156.186.10"
)
```

### etcd Configuration

Each node gets configured with:

```yaml
# Node identity
ETCD_NAME: "ubuntu-8gb-hil-1|ubuntu-8gb-ash-1|ubuntu-8gb-ash-2"
ETCD_DATA_DIR: "/var/lib/etcd"

# Network configuration
ETCD_LISTEN_PEER_URLS: "http://NODE_IP:2380"
ETCD_LISTEN_CLIENT_URLS: "http://NODE_IP:2379,http://127.0.0.1:2379"
ETCD_ADVERTISE_CLIENT_URLS: "http://NODE_IP:2379"
ETCD_INITIAL_ADVERTISE_PEER_URLS: "http://NODE_IP:2380"

# Cluster configuration
ETCD_INITIAL_CLUSTER: "ubuntu-8gb-hil-1=http://5.78.103.224:2380,ubuntu-8gb-ash-1=http://5.161.110.205:2380,ubuntu-8gb-ash-2=http://178.156.186.10:2380"
ETCD_INITIAL_CLUSTER_STATE: "new"
ETCD_INITIAL_CLUSTER_TOKEN: "gardenos-etcd-cluster"

# Performance tuning
ETCD_HEARTBEAT_INTERVAL: "100"
ETCD_ELECTION_TIMEOUT: "1000"
ETCD_MAX_SNAPSHOTS: "5"
ETCD_MAX_WALS: "5"
ETCD_QUOTA_BACKEND_BYTES: "8589934592"  # 8GB
```

## 📊 Monitoring and Health Checks

### Health Check Commands

```bash
# Check individual node health
curl http://5.78.103.224:2379/health
curl http://5.161.110.205:2379/health
curl http://178.156.186.10:2379/health

# Check cluster membership
curl http://5.78.103.224:2379/v2/members

# Using etcdctl (on any node)
ssh root@5.78.103.224 "/usr/local/bin/etcdctl endpoint health"
ssh root@5.78.103.224 "/usr/local/bin/etcdctl member list"
```

### Status Monitoring

```bash
# Comprehensive status check
./setup-etcd-cluster.sh status-cluster

# Service status on each node
ssh root@5.78.103.224 "systemctl status etcd"
ssh root@5.161.110.205 "systemctl status etcd"
ssh root@178.156.186.10 "systemctl status etcd"
```

## 🔍 Troubleshooting

### Common Issues

**etcd fails to start:**
```bash
# Check logs
ssh root@NODE_IP "journalctl -u etcd -f"

# Check configuration
ssh root@NODE_IP "cat /etc/etcd/etcd.conf"

# Check data directory permissions
ssh root@NODE_IP "ls -la /var/lib/etcd"
```

**Cluster formation issues:**
```bash
# Verify network connectivity
ssh root@5.78.103.224 "telnet 5.161.110.205 2380"
ssh root@5.78.103.224 "telnet 178.156.186.10 2380"

# Check firewall rules
ssh root@NODE_IP "ufw status"

# Verify cluster token matches
ssh root@NODE_IP "grep CLUSTER_TOKEN /etc/etcd/etcd.conf"
```

**Split-brain scenarios:**
```bash
# Check cluster membership
curl http://NODE_IP:2379/v2/members

# Verify leader election
ssh root@NODE_IP "/usr/local/bin/etcdctl endpoint status --cluster"
```

### Recovery Procedures

**Single node failure:**
```bash
# Restart the failed node
ssh root@FAILED_NODE_IP "systemctl restart etcd"

# Verify it rejoins the cluster
./setup-etcd-cluster.sh status-cluster
```

**Multiple node failure:**
```bash
# Stop all nodes
./setup-etcd-cluster.sh stop-cluster

# Clean up data directories (CAUTION: Data loss!)
./setup-etcd-cluster.sh cleanup-old

# Rebuild cluster
./setup-etcd-cluster.sh setup-cluster
./setup-etcd-cluster.sh start-cluster
```

**Complete cluster rebuild:**
```bash
# Backup any critical data first!
# Then follow multiple node failure procedure
```

## 🔐 Security Considerations

### Current Configuration
- **HTTP communication** (no TLS) for simplicity
- **No authentication** required
- **Private network** communication only

### Production Hardening (Future)
```bash
# Enable TLS
ETCD_CLIENT_CERT_AUTH="true"
ETCD_PEER_CERT_AUTH="true"

# Add authentication
ETCD_AUTH_TOKEN="jwt"

# Certificate management
# Generate CA and node certificates
```

## 📈 Performance Tuning

### Disk I/O Optimization
```bash
# Use SSD storage for etcd data
# Mount with appropriate options
mount -o noatime,nodiratime /dev/sdb1 /var/lib/etcd
```

### Network Optimization
```bash
# Tune network buffers
echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf
```

### Memory Management
```bash
# Set appropriate backend quota (default: 8GB)
ETCD_QUOTA_BACKEND_BYTES="8589934592"

# Monitor memory usage
ssh root@NODE_IP "free -h"
```

## 🔄 Maintenance Procedures

### Regular Maintenance
```bash
# Check cluster health (daily)
./setup-etcd-cluster.sh status-cluster

# Monitor disk usage (weekly)
ssh root@NODE_IP "df -h /var/lib/etcd"

# Review logs (weekly)
ssh root@NODE_IP "journalctl -u etcd --since '1 week ago'"
```

### Backup Procedures
```bash
# Create snapshot (automated via cron)
ssh root@5.78.103.224 "/usr/local/bin/etcdctl snapshot save /backup/etcd-$(date +%Y%m%d-%H%M%S).db"

# Verify snapshot
ssh root@5.78.103.224 "/usr/local/bin/etcdctl snapshot status /backup/etcd-TIMESTAMP.db"
```

### Update Procedures
```bash
# Update etcd version (one node at a time)
# 1. Stop etcd on one node
# 2. Update binary
# 3. Start etcd
# 4. Verify cluster health
# 5. Repeat for other nodes
```

## 📚 Integration with Other Components

### K3s Integration
```bash
# K3s uses etcd endpoints
ETCD_ENDPOINTS="http://5.78.103.224:2379,http://5.161.110.205:2379,http://178.156.186.10:2379"
```

### Patroni Integration
```bash
# Patroni configuration for etcd
etcd:
  hosts:
    - 5.78.103.224:2379
    - 5.161.110.205:2379
    - 178.156.186.10:2379
```

## 🆘 Emergency Contacts

### Critical Commands
```bash
# Emergency cluster stop
./setup-etcd-cluster.sh stop-cluster

# Emergency status check
curl -s http://5.78.103.224:2379/health

# Emergency restart
./setup-etcd-cluster.sh start-cluster
```

---

**🔗 etcd Cluster Ready!**  
*Providing distributed consensus for GardenOS infrastructure.*
