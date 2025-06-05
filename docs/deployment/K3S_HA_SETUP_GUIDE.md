# 🚀 K3s High-Availability Setup Guide for GardenOS

Complete guide for setting up a 3-node K3s high-availability cluster using external etcd for the GardenOS CRM stack on Hetzner Ubuntu 22.04 VPS.

## 📋 Overview

This guide implements the K3s orchestration layer from the [GardenOS Architecture Overview](../database/gardenos_architecture_overview.md), providing:

- ✅ **3-node K3s HA cluster** with external etcd datastore
- ✅ **HAProxy load balancing** for K3s API servers
- ✅ **Node labeling and taints** for workload scheduling
- ✅ **Metrics server** for horizontal pod autoscaling
- ✅ **K9s monitoring** for operational visibility

## 🏗️ Architecture

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

## 🚀 Quick Start

### 1. Bootstrap First Control Plane Node

On your first server (west-1: 5.78.103.224):

```bash
# Make script executable
chmod +x scripts/k3s/bootstrap-k3s-control-plane.sh

# Run bootstrap script
sudo ./scripts/k3s/bootstrap-k3s-control-plane.sh
```

The script will:
- Install K3s with external etcd configuration
- Configure node labels and taints
- Set up kubectl access
- Display cluster token and join commands

### 2. Join Additional Control Plane Nodes

On servers east-1 and east-2:

```bash
# Copy the join script
scp scripts/k3s/join-k3s-server.sh root@5.161.110.205:/tmp/
scp scripts/k3s/join-k3s-server.sh root@178.156.186.10:/tmp/

# Join the cluster (use token from bootstrap output)
sudo ./join-k3s-server.sh \
  --url https://5.78.103.224:6443 \
  --token YOUR_CLUSTER_TOKEN
```

### 3. Set Up HAProxy Load Balancer

Deploy HAProxy to load balance K3s API traffic:

```bash
# Install HAProxy
sudo apt update && sudo apt install -y haproxy

# Copy configuration
sudo cp config/haproxy/k3s-api-lb.cfg /etc/haproxy/haproxy.cfg

# Enable and start HAProxy
sudo systemctl enable haproxy
sudo systemctl start haproxy

# Check status
sudo systemctl status haproxy
```

### 4. Configure Local kubectl Access

On your local development machine:

```bash
# Copy kubeconfig from control plane
scp root@5.78.103.224:/etc/rancher/k3s/k3s.yaml ~/.kube/config

# Update server address to use HAProxy
sed -i 's/127.0.0.1/5.78.103.224/g' ~/.kube/config

# Test connection
kubectl get nodes
```

## 🧩 Adding Worker Nodes

### AI/ML Workload Nodes

For nodes dedicated to LangGraph agents and AI workloads:

```bash
sudo ./join-k3s-agent.sh \
  --url https://5.78.103.224:6443 \
  --token YOUR_CLUSTER_TOKEN \
  --role ai \
  --tier application
```

### Database Workload Nodes

For nodes running database-related services:

```bash
sudo ./join-k3s-agent.sh \
  --url https://5.78.103.224:6443 \
  --token YOUR_CLUSTER_TOKEN \
  --role database \
  --tier system
```

### General Worker Nodes

For general application workloads:

```bash
sudo ./join-k3s-agent.sh \
  --url https://5.78.103.224:6443 \
  --token YOUR_CLUSTER_TOKEN \
  --role worker \
  --tier application
```

## 📈 Install Metrics Server

Enable horizontal pod autoscaling with metrics-server:

```bash
# Install metrics-server using Helm
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm repo update

# Install with insecure TLS (for development)
helm install metrics-server metrics-server/metrics-server \
  --namespace kube-system \
  --set args="{--kubelet-insecure-tls}"

# Verify installation
kubectl get deployment metrics-server -n kube-system
kubectl top nodes
```

## 🔍 Install and Configure K9s

### Local Installation (Ubuntu/Debian)

```bash
# Download latest k9s
curl -sL https://github.com/derailed/k9s/releases/latest/download/k9s_Linux_amd64.tar.gz | tar xz
sudo mv k9s /usr/local/bin/

# Verify installation
k9s version
```

### Local Installation (macOS)

```bash
# Using Homebrew
brew install k9s

# Or using MacPorts
sudo port install k9s
```

### Using K9s

```bash
# Launch k9s (uses ~/.kube/config automatically)
k9s

# Key shortcuts in k9s:
# :nodes     - View cluster nodes
# :pods      - View all pods
# :svc       - View services
# :deploy    - View deployments
# :ns        - View namespaces
# q          - Quit current view
# ?          - Help
```

## 🔧 Cluster Verification

### Check Cluster Health

```bash
# View all nodes
kubectl get nodes -o wide

# Check node labels
kubectl get nodes --show-labels

# View cluster info
kubectl cluster-info

# Check system pods
kubectl get pods -n kube-system
```

### Test Workload Scheduling

Deploy a test application with node selectors:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-ai-workload
spec:
  replicas: 2
  selector:
    matchLabels:
      app: test-ai
  template:
    metadata:
      labels:
        app: test-ai
    spec:
      nodeSelector:
        node.gardenos.io/role: ai
      containers:
      - name: test
        image: nginx:alpine
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

## 🚧 Next Steps

After completing the K3s setup:

1. **Deploy Core Services**:
   - HAProxy for database load balancing
   - Supabase containers
   - FastAPI backend services

2. **Apply Database Schema**:
   - Initialize PostgreSQL with CRM schema
   - Configure Supabase authentication

3. **Set Up Monitoring**:
   - Deploy Prometheus and Grafana
   - Configure log aggregation

4. **Test Application Connectivity**:
   - Deploy CRM frontend
   - Verify end-to-end functionality

## 🔍 Troubleshooting

### Common Issues

**K3s fails to start:**
```bash
# Check logs
sudo journalctl -u k3s -f

# Verify etcd connectivity
curl -k https://5.78.103.224:2379/health
```

**kubectl connection issues:**
```bash
# Verify kubeconfig
kubectl config view

# Test API server connectivity
curl -k https://5.78.103.224:6443/healthz
```

**Node join failures:**
```bash
# Check token validity
sudo cat /var/lib/rancher/k3s/server/token

# Verify network connectivity
telnet 5.78.103.224 6443
```

## 📚 Related Documentation

- [GardenOS Architecture Overview](../database/gardenos_architecture_overview.md) - Complete system architecture
- [Hetzner Implementation Guide](./GARDENOS_HETZNER_IMPLEMENTATION.md) - Infrastructure setup
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Application deployment

---

**🚀 K3s HA Cluster Setup Complete!**  
*Your GardenOS CRM now has enterprise-grade orchestration capabilities.*
