# 🌱 GardenOS Codebase Index

Complete index of the GardenOS CRM codebase with production-grade K3s infrastructure.

## 🎯 Quick Navigation

### 🚀 Getting Started
- `README.md` - Project overview and quick start
- `docs/GARDENOS_COMPLETE_SETUP_GUIDE.md` - **Complete setup guide for new developers**
- `docs/CODEBASE_INDEX.md` - This file - complete codebase navigation
- `docs/deployment/K3S_HA_SETUP_GUIDE.md` - K3s high-availability setup

### 🏗️ Core Infrastructure Scripts

#### etcd Cluster Management
- `scripts/etcd/setup-etcd-cluster.sh` - **3-node etcd cluster setup and management**
- `scripts/etcd/README.md` - etcd cluster documentation

#### K3s Kubernetes Cluster
- `scripts/k3s/bootstrap-k3s-control-plane.sh` - Bootstrap first K3s control plane node
- `scripts/k3s/join-k3s-server.sh` - Join additional control plane nodes
- `scripts/k3s/join-k3s-agent.sh` - Join worker nodes with role-based labeling
- `scripts/k3s/setup-gardenos-k3s.sh` - **Complete K3s cluster orchestration**
- `scripts/k3s/install-k9s.sh` - K9s monitoring tool installation
- `scripts/k3s/README.md` - K3s scripts documentation

#### Application Deployment
- `scripts/k8s/deploy-gardenos.sh` - **Deploy all GardenOS services to K3s**
- `scripts/k8s/gardenos-status.sh` - **Comprehensive cluster status monitoring**
- `scripts/k8s/README.md` - Application deployment documentation

## 🚀 Kubernetes Manifests

### Core Services
- `k8s/supabase/namespace.yaml` - Supabase namespace and configuration
- `k8s/supabase/gotrue.yaml` - Authentication service (GoTrue)
- `k8s/supabase/postgrest.yaml` - REST API service (PostgREST)
- `k8s/supabase/storage.yaml` - File storage service

### Backend Services
- `k8s/fastapi/namespace.yaml` - FastAPI namespace and configuration
- `k8s/fastapi/api-deployment.yaml` - Main API and AI agents deployment

### Ingress and Routing
- `k8s/ingress/nginx-ingress.yaml` - NGINX ingress controller
- `k8s/ingress/routes.yaml` - Service routing configuration

## ⚙️ Configuration

### HAProxy Load Balancing
- `config/haproxy/k3s-api-lb.cfg` - **K3s API server load balancer**

### Application Config
- `config/index.ts` - Central configuration module for the application

## 📝 Documentation

### Architecture and Setup
- `docs/GARDENOS_COMPLETE_SETUP_GUIDE.md` - **Complete setup guide for new developers**
- `docs/database/gardenos_architecture_overview.md` - Complete GardenOS system architecture
- `docs/deployment/K3S_HA_SETUP_GUIDE.md` - K3s high-availability cluster setup
- `docs/deployment/K3S_DEPLOYMENT_SUMMARY.md` - K3s deployment summary
- `docs/deployment/GARDENOS_HETZNER_IMPLEMENTATION.md` - Hetzner implementation guide

### Development Journal
- `docs/dev_journal/README.md` - **Development journal documentation**
- `docs/dev_journal/TEMPLATE.md` - Template for new journal entries
- `docs/dev_journal/06042025.md` - K3s infrastructure milestone completion

### Database and Schema
- `frontend-next-files/supabase/full-supabase-dump.sql` - Complete database schema
- `frontend-next-files/supabase/schema-only.sql` - Schema-only dump
- `docs/database/gardenOS_dev_vs_production.md` - Development vs. production architecture

### Legacy Documentation (Archive)
- `docs/_archive/supabase_patroni_strategy_roles.md` - Previous architecture strategy
- `docs/_archive/hetzner_deployment_plan.md` - Original deployment planning

## 🏗️ Core Application

### Frontend
- `frontend-next-files/` - Next.js CRM application
- `frontend-next-files/src/` - Application source code
- `frontend-next-files/supabase/` - Database schema and migrations

### Backend
- `backend-fastapi/` - FastAPI backend services
- `backend-fastapi/app/` - Application logic and APIs

### Legacy Infrastructure (Development)
- `deployment/docker-compose.yml` - Docker Compose for local development
- `deployment/haproxy/` - HAProxy configurations for development
- `deployment/patroni/` - Patroni configurations for development

## 🔧 Monitoring and Operations

### Status and Health Checks
- `scripts/k8s/gardenos-status.sh` - **Comprehensive cluster monitoring**
- K9s terminal UI for real-time cluster monitoring

### Troubleshooting
- HAProxy stats: `http://NODE_IP:8404/stats`
- kubectl commands for debugging
- Service logs via `kubectl logs`

## 🌐 Service Access

### Production URLs
- Frontend: `https://crm-jakenelwoods-projects.vercel.app`
- API Gateway: `http://api.gardenos.local` (via ingress)
- Monitoring: `http://monitoring.gardenos.local`

### Development Access
- Local port forwarding via kubectl
- Direct service access via NodePort
- K9s for interactive cluster management