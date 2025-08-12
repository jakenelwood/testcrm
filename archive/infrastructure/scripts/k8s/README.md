# 🚀 Kubernetes Deployment Scripts for GardenOS

This directory contains scripts for deploying and managing applications on the GardenOS K3s cluster.

## 📁 Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-gardenos.sh` | **Complete application deployment** | Deploy all services |
| `gardenos-status.sh` | **Comprehensive status monitoring** | Health checks and troubleshooting |

## 🏗️ Application Architecture

The GardenOS application stack consists of:

```
┌─────────────────────────────────────────────────────────────┐
│                  GardenOS Application Stack                 │
├─────────────────────────────────────────────────────────────┤
│  🚪 Ingress Layer                                           │
│  ├─ NGINX Ingress Controller                                │
│  ├─ SSL termination and routing                             │
│  └─ api.gardenos.local domain                              │
│                                                             │
│  🔧 Supabase Stack                                          │
│  ├─ GoTrue (Authentication) - Port 9999                    │
│  ├─ PostgREST (REST API) - Port 3000                      │
│  └─ Storage API (File storage) - Port 5000                 │
│                                                             │
│  🚀 FastAPI Services                                        │
│  ├─ Main API (Business logic) - Port 8000                  │
│  └─ AI Agents (LangGraph) - Port 8001                      │
│                                                             │
│  📊 Monitoring                                              │
│  ├─ Kubernetes Dashboard                                    │
│  └─ Basic auth protection                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Complete Deployment

```bash
# Deploy all GardenOS services
./deploy-gardenos.sh deploy-all

# Check deployment status
./deploy-gardenos.sh status

# Monitor with comprehensive status
./gardenos-status.sh
```

### Individual Service Deployment

```bash
# Deploy ingress controller only
./deploy-gardenos.sh deploy-ingress

# Deploy Supabase stack only
./deploy-gardenos.sh deploy-supabase

# Deploy FastAPI services only
./deploy-gardenos.sh deploy-fastapi
```

## 🔧 Service Management

### Viewing Logs

```bash
# View logs for specific services
./deploy-gardenos.sh logs gotrue
./deploy-gardenos.sh logs postgrest
./deploy-gardenos.sh logs fastapi-api
./deploy-gardenos.sh logs fastapi-ai-agents

# Follow logs in real-time
kubectl logs -f -n supabase deployment/gotrue
```

### Restarting Services

```bash
# Restart individual services
./deploy-gardenos.sh restart gotrue
./deploy-gardenos.sh restart postgrest
./deploy-gardenos.sh restart fastapi-api

# Rolling restart (zero downtime)
kubectl rollout restart deployment gotrue -n supabase
```

### Scaling Services

```bash
# Scale services up or down
./deploy-gardenos.sh scale gotrue 3
./deploy-gardenos.sh scale postgrest 2
./deploy-gardenos.sh scale fastapi-api 5

# Auto-scaling (HPA)
kubectl autoscale deployment gotrue --cpu-percent=70 --min=2 --max=10 -n supabase
```

## 📊 Monitoring and Status

### Comprehensive Status Check

```bash
# Run complete status check
./gardenos-status.sh

# This checks:
# - Cluster health and nodes
# - etcd cluster status
# - HAProxy load balancer
# - Ingress controller
# - Supabase services
# - FastAPI services
# - Ingress routes
# - Storage and resources
```

### Real-time Monitoring

```bash
# Use K9s for interactive monitoring
k9s

# Key K9s shortcuts:
# :nodes     - View cluster nodes
# :pods      - View all pods
# :svc       - View services
# :deploy    - View deployments
# :ns        - View namespaces
# /          - Filter resources
# ?          - Help
```

### Resource Monitoring

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -A

# View resource limits and requests
kubectl describe nodes
kubectl describe pod POD_NAME -n NAMESPACE
```

## 🌐 Service Access

### Local Development Setup

Add to your `/etc/hosts`:
```bash
# Get the node IP
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)

# Add to /etc/hosts
echo "$NODE_IP api.gardenos.local monitoring.gardenos.local" | sudo tee -a /etc/hosts
```

### Service URLs

**External Access:**
- HAProxy Stats: `http://NODE_IP:8404/stats`
- K3s API: `https://NODE_IP:6443`

**Internal Services (via Ingress):**
- Supabase Auth: `http://api.gardenos.local/auth`
- Supabase REST: `http://api.gardenos.local/rest`
- Supabase Storage: `http://api.gardenos.local/storage`
- FastAPI: `http://api.gardenos.local/api`
- AI Agents: `http://api.gardenos.local/ai`
- Monitoring: `http://monitoring.gardenos.local`

### Port Forwarding for Development

```bash
# Forward Supabase services to localhost
kubectl port-forward -n supabase svc/gotrue 9999:9999
kubectl port-forward -n supabase svc/postgrest 3000:3000
kubectl port-forward -n supabase svc/storage-api 5000:5000

# Forward FastAPI services
kubectl port-forward -n fastapi svc/fastapi-api 8000:8000
kubectl port-forward -n fastapi svc/fastapi-ai-agents 8001:8001
```

## 🔐 Configuration Management

### Secrets Management

```bash
# View current secrets
kubectl get secrets -n supabase
kubectl get secrets -n fastapi

# Update secrets
kubectl create secret generic supabase-secrets \
  --from-literal=POSTGRES_PASSWORD="new-password" \
  --from-literal=JWT_SECRET="new-jwt-secret" \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart services after secret updates
kubectl rollout restart deployment gotrue -n supabase
```

### Configuration Updates

```bash
# Update ConfigMaps
kubectl edit configmap supabase-config -n supabase
kubectl edit configmap fastapi-config -n fastapi

# Apply configuration changes
kubectl rollout restart deployment postgrest -n supabase
```

## 🔍 Troubleshooting

### Common Issues

**Pods stuck in Pending:**
```bash
# Check node resources
kubectl describe nodes

# Check pod events
kubectl describe pod POD_NAME -n NAMESPACE

# Check resource quotas
kubectl get resourcequota -A
```

**Service unreachable:**
```bash
# Check service endpoints
kubectl get endpoints -n NAMESPACE

# Check ingress configuration
kubectl describe ingress -n NAMESPACE

# Test service connectivity
kubectl run test-pod --image=busybox --rm -it -- wget -qO- http://SERVICE_NAME.NAMESPACE.svc.cluster.local:PORT
```

**Database connection errors:**
```bash
# Check PostgreSQL connectivity
kubectl run postgres-test --image=postgres:13 --rm -it -- psql -h 5.78.103.224 -U supabase_admin -d crm

# Check Supabase configuration
kubectl logs -n supabase deployment/gotrue
kubectl logs -n supabase deployment/postgrest
```

### Debug Commands

```bash
# Get detailed pod information
kubectl describe pod POD_NAME -n NAMESPACE

# Execute commands in pods
kubectl exec -it POD_NAME -n NAMESPACE -- /bin/bash

# Check pod logs with timestamps
kubectl logs POD_NAME -n NAMESPACE --timestamps

# View events
kubectl get events -n NAMESPACE --sort-by='.lastTimestamp'
```

## 📈 Performance Optimization

### Resource Tuning

```bash
# Update resource requests/limits
kubectl patch deployment gotrue -n supabase -p '{"spec":{"template":{"spec":{"containers":[{"name":"gotrue","resources":{"requests":{"memory":"256Mi","cpu":"200m"},"limits":{"memory":"512Mi","cpu":"500m"}}}]}}}}'

# Enable horizontal pod autoscaling
kubectl autoscale deployment postgrest --cpu-percent=70 --min=2 --max=10 -n supabase
```

### Node Affinity

```bash
# Schedule pods on specific nodes
kubectl patch deployment fastapi-ai-agents -n fastapi -p '{"spec":{"template":{"spec":{"nodeSelector":{"node.gardenos.io/role":"control-workload"}}}}}'
```

## 🔄 Maintenance Procedures

### Regular Maintenance

```bash
# Weekly health check
./gardenos-status.sh

# Update container images
kubectl set image deployment/gotrue gotrue=supabase/gotrue:latest -n supabase
kubectl rollout status deployment/gotrue -n supabase

# Clean up unused resources
kubectl delete pod --field-selector=status.phase==Succeeded -A
```

### Backup Procedures

```bash
# Backup Kubernetes configurations
kubectl get all -o yaml > backup-$(date +%Y%m%d).yaml

# Backup persistent volumes
kubectl get pv,pvc -o yaml > pv-backup-$(date +%Y%m%d).yaml
```

### Update Procedures

```bash
# Update deployments with zero downtime
kubectl set image deployment/SERVICE_NAME CONTAINER_NAME=NEW_IMAGE -n NAMESPACE
kubectl rollout status deployment/SERVICE_NAME -n NAMESPACE

# Rollback if needed
kubectl rollout undo deployment/SERVICE_NAME -n NAMESPACE
```

## 🆘 Emergency Procedures

### Service Recovery

```bash
# Emergency restart of all services
kubectl rollout restart deployment --all -n supabase
kubectl rollout restart deployment --all -n fastapi

# Scale down problematic services
kubectl scale deployment PROBLEMATIC_SERVICE --replicas=0 -n NAMESPACE
kubectl scale deployment PROBLEMATIC_SERVICE --replicas=2 -n NAMESPACE
```

### Cluster Recovery

```bash
# Check cluster health
kubectl cluster-info
kubectl get nodes

# Restart kubelet on nodes (if needed)
ssh root@NODE_IP "systemctl restart k3s"
```

## 📚 Integration Testing

### Health Check Endpoints

```bash
# Test Supabase services
curl http://api.gardenos.local/auth/health
curl http://api.gardenos.local/rest/
curl http://api.gardenos.local/storage/status

# Test FastAPI services
curl http://api.gardenos.local/api/health
curl http://api.gardenos.local/ai/health
```

### End-to-End Testing

```bash
# Test authentication flow
curl -X POST http://api.gardenos.local/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Test API access
curl http://api.gardenos.local/rest/leads \
  -H "Authorization: Bearer JWT_TOKEN"
```

---

**🚀 GardenOS Applications Deployed!**  
*Your CRM services are running on production-grade infrastructure.*
