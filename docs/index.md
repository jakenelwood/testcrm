# 📚 CRM Documentation Index

## 🎉 **Current Status: Production-Grade Infrastructure Ready**

**MAJOR MILESTONE**: Complete CRM system operational with AI agents, PostgreSQL HA cluster, and scalable K3s infrastructure. Ready for development and production use.

## Essential Documentation

### **🚀 Infrastructure & Deployment**
- **[GARDENOS_COMPLETE_SETUP_GUIDE.md](GARDENOS_COMPLETE_SETUP_GUIDE.md)** - Complete K3s infrastructure setup
- **[deployment/GARDENOS_NEXT_STEPS.md](deployment/GARDENOS_NEXT_STEPS.md)** - Next steps for Supabase deployment
- **[database/patroni_service_discovery_guide.md](database/patroni_service_discovery_guide.md)** - Service discovery solution

### **📊 Architecture & Database**
- **[database/gardenos_architecture_overview.md](database/gardenos_architecture_overview.md)** - Complete system architecture
- **[database/POSTGRESQL_K3S_INTEGRATION_PLAN.md](database/POSTGRESQL_K3S_INTEGRATION_PLAN.md)** - PostgreSQL K3s integration

### **📝 Development Journal**
- **[dev_journal/06042025.md](dev_journal/06042025.md)** - Latest breakthrough documentation

### **🎯 Application Development**
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - **START HERE** - Complete developer onboarding guide
- **[setup-guide.md](setup-guide.md)** - Basic development environment setup
- **[next_steps.md](next_steps.md)** - CRM development roadmap

### **Database**
- **[database/database-guide.md](database/database-guide.md)** - Database overview and connection
- **[database/comprehensive_schema_summary.md](database/comprehensive_schema_summary.md)** - Complete schema overview
- **[../database/database-reference.md](../database/database-reference.md)** - Technical database reference

### **Integrations**
- **[integrations/RINGCENTRAL_SETUP.md](integrations/RINGCENTRAL_SETUP.md)** - RingCentral telephony setup

### **Features**
- **[features/followup_management_guide.md](features/followup_management_guide.md)** - Follow-up system guide

### **Branding**
- **[branding/brand_personality.md](branding/brand_personality.md)** - Brand guidelines and personality

### **📊 Reporting & Monitoring**
- **[reporting/README.md](reporting/README.md)** - **COMPREHENSIVE MONITORING SYSTEM**
- **[reporting/comprehensive-health-check.md](reporting/comprehensive-health-check.md)** - Primary infrastructure monitoring (100% health score)
- **[reporting/session-management.md](reporting/session-management.md)** - Environment management with server-centralized backups
- **[reporting/health_reports/](reporting/health_reports/)** - Generated health check reports archive

### **Deployment**
- **[deployment/](deployment/)** - Production deployment guides

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
