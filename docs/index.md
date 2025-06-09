# 📚 CRM Documentation Index

> **🚀 NEW**: See **[README.md](README.md)** for the unified documentation hub with quick navigation and essential commands.

## 🎉 **Current Status: Production-Grade Infrastructure Ready**

**MAJOR MILESTONE**: Complete CRM system operational with AI agents, PostgreSQL HA cluster, and scalable K3s infrastructure. Ready for development and production use.

## 📋 **Documentation Organization**

### **👋 Start Here**
- **[README.md](README.md)** - **MAIN DOCUMENTATION HUB** - Everything you need in one place
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Comprehensive developer onboarding (detailed version)

### **🏗️ Infrastructure Deep Dives**
- **[GARDENOS_COMPLETE_SETUP_GUIDE.md](GARDENOS_COMPLETE_SETUP_GUIDE.md)** - Complete K3s infrastructure setup
- **[deployment/](deployment/)** - Production deployment guides
- **[database/](database/)** - Database architecture and setup

### **🔧 Specialized Documentation**
- **[database/](database/)** - Database architecture, schema, and setup guides
- **[deployment/](deployment/)** - Production deployment and K3s infrastructure
- **[integrations/](integrations/)** - Third-party service integrations (RingCentral, etc.)
- **[reporting/](reporting/)** - Monitoring, health checks, and system reports
- **[branding/](branding/)** - Brand guidelines and visual identity

### **📊 Quality & Process**
- **[TESTING_IMPLEMENTATION_PLAN.md](TESTING_IMPLEMENTATION_PLAN.md)** - Comprehensive testing strategy
- **[TYPESCRIPT_STRICT_MODE_MIGRATION.md](TYPESCRIPT_STRICT_MODE_MIGRATION.md)** - Type safety improvements
- **[PRAGMATIC_PROGRAMMING_GUIDELINES.md](PRAGMATIC_PROGRAMMING_GUIDELINES.md)** - Code quality standards
- **[DOCUMENTATION_CONSOLIDATION_SUMMARY.md](DOCUMENTATION_CONSOLIDATION_SUMMARY.md)** - Documentation improvements

## 🏗️ **Infrastructure Status**

### **✅ Operational Services (100% Health Score)**
- **K3s Cluster**: 3-node HA control plane (5.78.103.224, 5.161.110.205, 178.156.186.10)
- **PostgreSQL**: 3-node Patroni cluster with 0 MB replication lag
- **Service Discovery**: Sidecar pattern ensuring postgres-primary → current leader
- **Storage**: local-path-provisioner with persistent volumes
- **Health Monitoring**: 28/28 checks passing with automated reporting
- **Environment Management**: Server-centralized with organized backup system

### **🎯 Ready for Deployment**
- **Supabase Stack**: Auth, REST API, Storage services
- **FastAPI Services**: Main API and AI agents
- **Ingress Controller**: External access configuration

## Quick Reference

### **Infrastructure Commands**
```bash
# Health monitoring (RECOMMENDED)
./scripts/comprehensive-health-check.sh

# Check cluster status
kubectl get nodes
kubectl get pods -n postgres-cluster

# Verify service discovery
kubectl get endpoints postgres-primary -n postgres-cluster

# Deploy next services
./scripts/k8s/deploy-gardenos.sh deploy-supabase
```

### **Session Management**
```bash
# Start development session
./scripts/start-session.sh

# End session with backup
./scripts/end-session.sh

# Quick cluster status
./scripts/cluster-status.sh
```

### **Database Connection (K3s)**
```
Service: postgres-primary.postgres-cluster.svc.cluster.local:5432
External: 5.78.103.224:30432 (NodePort)
Database: postgres
Schema Version: Latest Patroni
```

### **Application Development**
```bash
npm install
cp .env.local.template .env.local
# Edit .env.local with your values
npm run dev
```

### **Key Features**
- ✅ Multi-tenant architecture
- ✅ Complete customer lifecycle (Lead → Client → Win-back)
- ✅ Comprehensive insurance data coverage (95%+)
- ✅ RingCentral telephony integration
- ✅ Automated follow-up system

## Architecture Overview

```
Organizations → Locations → Users
     ↓
Leads → Clients → Win-backs
     ↓
Vehicles, Drivers, Properties
     ↓
Quotes → Policies
```

## Archived Documentation

Historical and detailed implementation documents are available in `_archive/` for reference but are not needed for daily development.

---

**The documentation is organized by purpose - start with setup-guide.md for development setup.**
