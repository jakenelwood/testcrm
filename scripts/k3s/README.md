# 🚀 K3s Scripts for GardenOS

This directory contains scripts for setting up and managing the K3s high-availability cluster for the GardenOS CRM stack.

## 📁 Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-gardenos-k3s.sh` | **Main orchestration script** | Complete K3s HA setup |
| `bootstrap-k3s-control-plane.sh` | Bootstrap first control plane node | Initial cluster setup |
| `join-k3s-server.sh` | Join additional control plane nodes | HA control plane |
| `join-k3s-agent.sh` | Join worker nodes | Application workloads |
| `install-k9s.sh` | Install K9s monitoring tool | Cluster observability |

## 🚀 Quick Start

### Complete Setup (Recommended)

Run the complete setup on your local machine:

```bash
# Make scripts executable
chmod +x scripts/k3s/*.sh

# Run complete setup
./scripts/k3s/setup-gardenos-k3s.sh full-setup
```

This will:
1. ✅ Bootstrap the first control plane node
2. ✅ Join additional control plane nodes
3. ✅ Set up HAProxy load balancer
4. ✅ Configure local kubectl access
5. ✅ Install metrics server
6. ✅ Install K9s monitoring tool
7. ✅ Verify cluster health

### Manual Step-by-Step Setup

If you prefer manual control:

```bash
# 1. Bootstrap first control plane
./scripts/k3s/setup-gardenos-k3s.sh bootstrap

# 2. Join additional servers
./scripts/k3s/setup-gardenos-k3s.sh join-servers

# 3. Set up load balancer
./scripts/k3s/setup-gardenos-k3s.sh setup-haproxy

# 4. Install K9s locally
./scripts/k3s/setup-gardenos-k3s.sh install-k9s

# 5. Verify cluster
./scripts/k3s/setup-gardenos-k3s.sh verify-cluster
```

## 🔧 Individual Script Usage

### Bootstrap Control Plane

```bash
# On the first server (5.78.103.224)
sudo ./bootstrap-k3s-control-plane.sh
```

### Join Additional Control Plane Nodes

```bash
# On additional servers
sudo ./join-k3s-server.sh \
  --url https://5.78.103.224:6443 \
  --token YOUR_CLUSTER_TOKEN
```

### Join Worker Nodes

```bash
# General worker node
sudo ./join-k3s-agent.sh \
  --url https://5.78.103.224:6443 \
  --token YOUR_CLUSTER_TOKEN \
  --role worker

# AI workload node
sudo ./join-k3s-agent.sh \
  --url https://5.78.103.224:6443 \
  --token YOUR_CLUSTER_TOKEN \
  --role ai

# Database workload node
sudo ./join-k3s-agent.sh \
  --url https://5.78.103.224:6443 \
  --token YOUR_CLUSTER_TOKEN \
  --role database
```

### Install K9s

```bash
# Local installation
./install-k9s.sh
```

## 🏗️ Architecture

The scripts set up this architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    GardenOS K3s Cluster                     │
├─────────────────────────────────────────────────────────────┤
│  HAProxy LB (6443) ──► K3s Control Plane Nodes             │
│  ├─ west-1:  5.78.103.224:6443                             │
│  ├─ east-1:  5.161.110.205:6443                            │
│  └─ east-2:  178.156.186.10:6443                           │
│                                                             │
│  External etcd Cluster (shared with Patroni)               │
│  ├─ west-1:  5.78.103.224:2379                             │
│  ├─ east-1:  5.161.110.205:2379                            │
│  └─ east-2:  178.156.186.10:2379                           │
│                                                             │
│  Worker Nodes (labeled for workload scheduling)            │
│  ├─ AI Agents:     node.gardenos.io/role=ai                │
│  ├─ Database:      node.gardenos.io/role=database          │
│  ├─ Ingress:       node.gardenos.io/role=ingress           │
│  └─ Monitoring:    node.gardenos.io/role=monitoring        │
└─────────────────────────────────────────────────────────────┘
```

## 🏷️ Node Labels and Taints

### Control Plane Nodes

**Labels:**
- `node.gardenos.io/role=control-plane`
- `node.gardenos.io/tier=system`

**Taints:**
- `node-role.kubernetes.io/control-plane:NoSchedule`

### Worker Node Types

#### AI Workload Nodes
**Labels:**
- `node.gardenos.io/role=ai`
- `node.gardenos.io/tier=application`
- `node.gardenos.io/workload=ai`

**Taints:**
- `node.gardenos.io/ai:NoSchedule`

#### Database Nodes
**Labels:**
- `node.gardenos.io/role=database`
- `node.gardenos.io/tier=system`
- `node.gardenos.io/workload=database`

**Taints:**
- `node.gardenos.io/database:NoSchedule`

#### General Worker Nodes
**Labels:**
- `node.gardenos.io/role=worker`
- `node.gardenos.io/tier=application`
- `node.gardenos.io/workload=general`

## 🔍 Monitoring with K9s

After installation, use K9s for cluster monitoring:

```bash
# Launch K9s
k9s

# Key shortcuts:
# :nodes     - View cluster nodes
# :pods      - View all pods
# :svc       - View services
# :deploy    - View deployments
# :ns        - View namespaces
# q          - Quit current view
# ?          - Help
```

### GardenOS-Specific Views

```bash
# View nodes by role
:nodes
# Then press '/' and filter by 'role=ai' or 'role=database'

# View workloads by tier
:pods
# Then press '/' and filter by 'tier=application' or 'tier=system'
```

## 🔧 Configuration

### Environment Variables

The scripts support these environment variables:

```bash
# etcd endpoints (default: Hetzner servers)
export ETCD_ENDPOINTS="https://5.78.103.224:2379,https://5.161.110.205:2379,https://178.156.186.10:2379"

# K3s cluster token (auto-generated if not set)
export K3S_TOKEN="your-secure-token"

# Node name (default: hostname)
export NODE_NAME="custom-node-name"
```

### Server Configuration

Update server IPs in `setup-gardenos-k3s.sh`:

```bash
SERVERS=(
    "your-server-1-ip"
    "your-server-2-ip"
    "your-server-3-ip"
)
```

## 🚧 Prerequisites

1. **SSH Access**: Passwordless SSH to all servers as root
2. **etcd Cluster**: Running etcd cluster (shared with Patroni)
3. **Ubuntu 22.04**: All servers running Ubuntu 22.04 LTS
4. **Network**: Servers can communicate on ports 6443, 2379, 2380

## 🔍 Troubleshooting

### Common Issues

**SSH connection failed:**
```bash
# Set up SSH key authentication
ssh-copy-id root@your-server-ip
```

**etcd connection failed:**
```bash
# Check etcd health
curl -k https://5.78.103.224:2379/health
```

**K3s startup failed:**
```bash
# Check logs on server
sudo journalctl -u k3s -f
```

**kubectl connection failed:**
```bash
# Verify kubeconfig
kubectl config view

# Test API server
curl -k https://5.78.103.224:6443/healthz
```

## 📚 Related Documentation

- [K3s HA Setup Guide](../../docs/deployment/K3S_HA_SETUP_GUIDE.md) - Detailed setup instructions
- [GardenOS Architecture Overview](../../docs/database/gardenos_architecture_overview.md) - Complete system architecture
- [HAProxy Configuration](../../config/haproxy/k3s-api-lb.cfg) - Load balancer setup

---

**🚀 Ready to deploy your GardenOS K3s cluster!**
