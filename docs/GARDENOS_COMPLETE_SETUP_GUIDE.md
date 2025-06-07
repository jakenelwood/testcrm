# 🌱 GardenOS Complete Setup Guide

**Production-grade CRM infrastructure with K3s, etcd, and Supabase on Hetzner**

## 📋 Overview

GardenOS is a high-availability CRM system built on modern cloud-native technologies. This guide provides complete setup instructions for new developers to understand and deploy the entire stack.

### 🏗️ Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    GardenOS Architecture                     │
├─────────────────────────────────────────────────────────────┤
│  🌐 Frontend (Vercel)                                       │
│  ├─ Next.js CRM Application                                 │
│  └─ https://crm-jakenelwoods-projects.vercel.app           │
│                                                             │
│  🚪 Ingress Layer (K3s)                                     │
│  ├─ NGINX Ingress Controller                                │
│  └─ api.gardenos.local routing                             │
│                                                             │
│  🧠 Application Layer (K3s Pods)                           │
│  ├─ Supabase Stack (Auth, REST API, Storage)               │
│  ├─ FastAPI Backend Services                               │
│  └─ LangGraph AI Agents                                    │
│                                                             │
│  🔗 Orchestration Layer (K3s)                              │
│  ├─ 3-node HA control plane + workloads                    │
│  ├─ HAProxy load balancer (port 6443)                      │
│  └─ Node labels for workload scheduling                    │
│                                                             │
│  💾 Data Layer (PostgreSQL + etcd)                         │
│  ├─ 3-node Patroni PostgreSQL cluster                     │
│  ├─ 3-node etcd cluster (shared datastore)                │
│  └─ HAProxy load balancer (port 5432)                     │
│                                                             │
│  🖥️ Infrastructure Layer (Hetzner)                         │
│  ├─ ubuntu-8gb-hil-1: 5.78.103.224 (CCX-class VPS)       │
│  ├─ ubuntu-8gb-ash-1: 5.161.110.205 (CCX-class VPS)     │
│  └─ ubuntu-8gb-ash-2: 178.156.186.10 (CCX-class VPS)    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Design Principles

- **As simple as possible, but no simpler** - Avoid over-engineering while maintaining production quality
- **DRY (Don't Repeat Yourself)** - Reusable scripts and configurations
- **Production-grade reliability** - 3-node HA clusters for all critical components
- **Cost-effective** - Hybrid control-plane/worker nodes for optimal resource utilization
- **Developer-friendly** - Comprehensive documentation and troubleshooting tools

## 🚀 Quick Start (Complete Setup)

### Prerequisites

1. **3 Hetzner Ubuntu 22.04 VPS servers** (CCX-class recommended)
2. **SSH key authentication** set up for root access
3. **Local development machine** with kubectl and git

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/jakenelwood/crm.git
cd crm

# Run complete setup
./scripts/etcd/setup-etcd-cluster.sh setup-cluster
./scripts/etcd/setup-etcd-cluster.sh start-cluster
./scripts/k3s/setup-gardenos-k3s.sh full-setup

# Check status
./scripts/k8s/gardenos-status.sh
```

This will:
1. ✅ Set up 3-node etcd cluster
2. ✅ Bootstrap K3s HA control plane
3. ✅ Configure HAProxy load balancing
4. ✅ Set up local kubectl access
5. ✅ Install monitoring tools (K9s)
6. ✅ Verify cluster health

## 📚 Component Documentation

### Core Infrastructure
- **[etcd Cluster Setup](../scripts/etcd/README.md)** - Distributed key-value store
- **[K3s HA Setup](./deployment/K3S_HA_SETUP_GUIDE.md)** - Kubernetes orchestration
- **[HAProxy Configuration](../config/haproxy/k3s-api-lb.cfg)** - Load balancing

### Application Services
- **[Supabase Stack](../k8s/supabase/)** - Authentication and REST API
- **[FastAPI Services](../k8s/fastapi/)** - Backend API and AI agents
- **[Ingress Routes](../k8s/ingress/)** - Traffic routing

### Management Tools
- **[Deployment Scripts](../scripts/k8s/)** - Service deployment and management
- **[Status Monitoring](../scripts/k8s/gardenos-status.sh)** - Health checks and troubleshooting

## 🔧 Daily Operations

### Status Monitoring

```bash
# Complete cluster status
./scripts/k8s/gardenos-status.sh

# Real-time monitoring with K9s
k9s

# Check specific services
kubectl get pods -A
kubectl top nodes
```

### Service Management

```bash
# Deploy all services
./scripts/k8s/deploy-gardenos.sh deploy-all

# Check deployment status
./scripts/k8s/deploy-gardenos.sh status

# View service logs
./scripts/k8s/deploy-gardenos.sh logs gotrue

# Restart a service
./scripts/k8s/deploy-gardenos.sh restart postgrest

# Scale a service
./scripts/k8s/deploy-gardenos.sh scale fastapi-api 3
```

### Troubleshooting

```bash
# Check cluster connectivity
kubectl cluster-info

# Verify etcd health
./scripts/etcd/setup-etcd-cluster.sh status-cluster

# Check HAProxy stats
curl http://5.78.103.224:8404/stats

# View detailed pod information
kubectl describe pod POD_NAME -n NAMESPACE

# Port forward for local testing
kubectl port-forward -n supabase svc/gotrue 9999:9999
```

## 🌐 Service URLs

After setup, add to your `/etc/hosts`:
```
5.78.103.224 api.gardenos.local monitoring.gardenos.local
```

### External Access
- **HAProxy Stats**: http://5.78.103.224:8404/stats
- **K3s API**: https://5.78.103.224:6443

### Internal Services (via Ingress)
- **Supabase Auth**: http://api.gardenos.local/auth
- **Supabase REST**: http://api.gardenos.local/rest
- **Supabase Storage**: http://api.gardenos.local/storage
- **FastAPI**: http://api.gardenos.local/api
- **AI Agents**: http://api.gardenos.local/ai

## 🔐 Security Considerations

### Network Security
- **Private networking** between cluster nodes
- **Firewall rules** restricting external access
- **SSH key authentication** only

### Application Security
- **JWT-based authentication** via Supabase
- **Row Level Security (RLS)** in PostgreSQL
- **Service-to-service** authentication with service roles

### Secrets Management
- **Kubernetes secrets** for sensitive data
- **Environment-specific** configuration
- **Rotation procedures** for keys and tokens

## 📈 Scaling and Performance

### Horizontal Scaling
```bash
# Scale application services
kubectl scale deployment gotrue --replicas=3 -n supabase
kubectl scale deployment fastapi-api --replicas=5 -n fastapi

# Add worker nodes (if needed)
./scripts/k3s/join-k3s-agent.sh --role worker
```

### Resource Monitoring
```bash
# Check resource usage
kubectl top nodes
kubectl top pods -A

# View resource limits
kubectl describe nodes
```

### Performance Tuning
- **Node affinity** for workload placement
- **Resource requests/limits** for predictable performance
- **Horizontal Pod Autoscaling** based on metrics

## 🚧 Maintenance Procedures

### Regular Maintenance
1. **Weekly**: Check cluster health and resource usage
2. **Monthly**: Update container images and security patches
3. **Quarterly**: Review and optimize resource allocation

### Backup Procedures
```bash
# Database backups (handled by Patroni)
# etcd snapshots
# Kubernetes configuration backups
```

### Update Procedures
```bash
# Update K3s cluster
# Update container images
# Apply security patches
```

## 🆘 Emergency Procedures

### Cluster Recovery
1. **Single node failure**: Automatic failover via HA
2. **Multiple node failure**: Manual recovery procedures
3. **Complete cluster failure**: Disaster recovery from backups

### Service Recovery
```bash
# Restart failed services
kubectl rollout restart deployment SERVICE_NAME -n NAMESPACE

# Check service health
kubectl get pods -n NAMESPACE
kubectl describe pod POD_NAME -n NAMESPACE
```

## 📞 Support and Troubleshooting

### Common Issues
- **Pod stuck in Pending**: Check resource constraints and node capacity
- **Service unreachable**: Verify ingress configuration and DNS
- **Database connection errors**: Check Patroni cluster and HAProxy status

### Getting Help
1. **Check logs**: `kubectl logs POD_NAME -n NAMESPACE`
2. **Describe resources**: `kubectl describe TYPE NAME -n NAMESPACE`
3. **Monitor with K9s**: Real-time cluster visualization
4. **Review documentation**: Component-specific guides

---

**🌱 Welcome to GardenOS!**  
*Your production-grade CRM infrastructure is ready for scale.*
