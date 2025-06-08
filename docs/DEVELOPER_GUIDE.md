# 🚀 CRM Developer Guide

**Welcome to the CRM project!** This guide will get you from zero to productive contributor in the shortest time possible.

## 📋 **Quick Start Checklist**

- [ ] **Environment Management Setup** - Configure server-centralized environment system
- [ ] **Security Validation** - Ensure 100% security compliance
- [ ] **Architecture Understanding** - Learn how the system works
- [ ] **Development Workflow** - Understand our processes and tools
- [ ] **Multi-Machine Development** - Set up seamless laptop/desktop sync

---

## 🏗️ **System Architecture Overview**

### **High-Level Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│   Vercel/CF     │    │   K3s Cluster   │    │   HA Cluster    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   AI Agents     │
                       │  (DeepSeek-V3)  │
                       │   5 Agents      │
                       └─────────────────┘
```

### **Infrastructure Stack**
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI with Python 3.11, async/await patterns
- **Database**: PostgreSQL 13 with Patroni HA (3-node cluster)
- **Orchestration**: K3s Kubernetes (3-node cluster)
- **AI**: DeepSeek-V3-0324 via DeepInfra (90% cost reduction vs OpenAI)
- **Monitoring**: Prometheus + Grafana
- **Servers**: 3x Hetzner CCX13 (4 vCPU, 8GB RAM, 160GB SSD)

### **Server Configuration**
```yaml
# Current Production Servers (see config/servers.yaml)
ubuntu-8gb-hil-1: 5.78.103.224   # Primary (Hillsboro)
ubuntu-8gb-ash-1: 5.161.110.205  # Worker 1 (Ashburn)  
ubuntu-8gb-ash-2: 178.156.186.10 # Worker 2 (Ashburn)
```

---

## 🛠️ **Development Environment Setup**

### **Prerequisites**
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Docker (for local testing)
- kubectl (for cluster management)
- Git (version control)
- SSH access to Hetzner servers (for environment management)

### **🔒 Environment Management Setup (CRITICAL)**
```bash
# 1. Clone the repository
git clone https://github.com/jakenelwood/crm.git
cd crm

# 2. Set up server-centralized environment management
./scripts/setup-env-management.sh

# 3. Start your first development session
env-start
# This will:
# - Download latest environment files from HA server cluster
# - Show available environments (development, staging, production)
# - Let you select which environment to use
# - Set up .env.local with secure configuration

# 4. Install dependencies
npm install

# 5. Validate security compliance
node scripts/validate-security.js
# Should show: Security Score: 17/17 (100%)
```

### **🚀 Quick Development Commands**
```bash
# Start development server
env-start && npm run dev
# Or use the convenient alias
crm-dev

# Switch environments during development
env-switch

# Check current environment status
env-status

# End session (backs up changes to server)
env-end
```

### **🔐 Security-First Environment Management**
**AICRM uses a revolutionary server-centralized environment system:**

```
HA Server Cluster                    Development Machines
┌─────────────────────────┐         ┌─────────────────────────┐
│ Primary (5.78.103.224)  │         │ Laptop/Desktop          │
│ /root/crm-env-files/    │◄───────►│ .env-files/ (cache)     │
│ ├── .env.development    │         │ ├── .env.development    │
│ ├── .env.staging        │         │ ├── .env.staging        │
│ ├── .env.production     │         │ └── .env.production     │
└─────────────────────────┘         │ .env.local (active)     │
            │                       └─────────────────────────┘
            ▼ (auto-sync)
┌─────────────────────────┐
│ Backup (5.161.110.205) │
│ /root/crm-env-files/    │
│ (replicated files)      │
└─────────────────────────┘
```

**Benefits:**
- ✅ **Zero hardcoded secrets** in codebase
- ✅ **Multi-machine sync** - seamless laptop/desktop development
- ✅ **HA backup** - environment files replicated across servers
- ✅ **Automatic validation** - security compliance checking
- ✅ **Git protection** - all .env files in .gitignore

---

## 🧠 **Understanding the Codebase**

### **Frontend Structure** (`frontend-next-files/`)
```
src/
├── app/                 # Next.js 14 App Router
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── forms/          # Form components
├── lib/                # Utilities and configurations
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

### **Backend Structure** (`backend-fastapi/`)
```
app/
├── main.py             # FastAPI application entry
├── routers/            # API route handlers
├── models/             # Database models
├── services/           # Business logic
├── ai_agents/          # AI orchestration system
└── database/           # Database utilities
```

### **Infrastructure** (`k8s/`, `scripts/`)
```
k8s/                    # Kubernetes manifests
├── postgres/           # PostgreSQL cluster
├── supabase/           # Supabase services
└── fastapi/            # Backend services

scripts/                # Automation scripts
├── k3s/               # K3s cluster management
├── k8s/               # Application deployment
└── etcd/              # etcd cluster setup
```

---

## 🔄 **Development Workflow**

### **Our Development Principles**
1. **Security First** - 100% compliance with security guidelines
2. **DRY (Don't Repeat Yourself)** - Centralize configurations and reuse code
3. **SRP (Single Responsibility)** - Each component does one thing well
4. **Environment Automation** - Server-centralized environment management
5. **Documentation-First** - Update docs with every significant change

### **🌅 Daily Development Workflow**

#### **Starting a Development Session**
```bash
# Morning setup (any machine)
env-start
# ✅ Downloads latest environment files from server
# ✅ Shows available environments with update dates
# ✅ Backs up current environment before switching
# ✅ Sets up selected environment as .env.local

# Start development
npm run dev
# Or use convenient alias
crm-dev
```

#### **During Development**
```bash
# Quick environment switch
env-switch

# Check current environment
env-status

# Sync latest from server
env-sync

# Validate security compliance
node scripts/validate-security.js
```

#### **Ending a Development Session**
```bash
# End session (backs up changes to server)
env-end
# ✅ Auto-detects environment type
# ✅ Creates local backup with timestamp
# ✅ Uploads to primary server
# ✅ Syncs to backup servers (HA)
# ✅ Shows what changed
```

### **🔒 Security-First Development**

#### **Before Making Changes**
```bash
# Validate current security state
node scripts/validate-security.js
# Must show: Security Score: 17/17 (100%)

# Check for hardcoded secrets
grep -r "password\|secret\|key" --exclude-dir=node_modules .
# Should only find template files and documentation
```

#### **Making Secure Changes**
```bash
# Frontend changes
npm run dev              # Start development server
npm run build            # Test production build
npm run lint             # Check code quality

# Backend changes (if needed)
cd deployment/backend
python -m pytest        # Run tests
uvicorn main:app --reload  # Start development server

# Always validate security after changes
node scripts/validate-security.js
```

### **🌐 Multi-Machine Development**

#### **Perfect for Laptop/Desktop Development**
```bash
# On Laptop
env-start          # Get latest, work on features
env-end            # Backup changes to server

# On Desktop
env-start          # Get latest (including laptop changes)
env-end            # Backup changes to server

# Back on Laptop
env-start          # Get latest (including desktop changes)
# ✅ Seamless continuation with all changes synchronized
```

### **Adding New Servers**
1. **Update Configuration**: Add server to `config/servers.yaml`
2. **Propagate Changes**: Run `./scripts/update-server-names.sh`
3. **Update Service Distribution**: Modify service assignments as needed
4. **Test Deployment**: Validate with staging environment first

---

## 🚀 **Deployment & Operations**

### **Current System Status**
- ✅ **K3s Cluster**: 3-node HA cluster operational
- ✅ **PostgreSQL**: 3-node Patroni cluster with streaming replication
- ✅ **AI Agents**: 5 agents running DeepSeek-V3-0324
- ✅ **FastAPI**: 2 replicas with database connectivity
- ✅ **Monitoring**: Prometheus + Grafana operational

### **Key Management Commands**
```bash
# Cluster status
kubectl get nodes
kubectl get pods --all-namespaces

# Application status
./scripts/k8s/gardenos-status.sh

# Database status
kubectl exec -n postgres-cluster postgres-0 -- patronictl list

# AI agents status
kubectl logs -n default -l app=fastapi-ai-agents
```

### **Troubleshooting Resources**
- **Database Issues**: `docs/database/README.md`
- **K3s Issues**: `docs/deployment/K3S_HA_SETUP_GUIDE.md`
- **AI Issues**: Check DeepInfra API status and logs
- **General Issues**: `docs/dev_journal/rolling_journal.md`

---

## 📚 **Key Documentation References**

### **🔒 Security & Environment Management**
- **Environment Management**: `docs/ENVIRONMENT_FILE_MANAGEMENT.md` - Complete guide
- **Security Compliance**: `docs/SECURITY_COMPLIANCE_REPORT.md` - 100% compliance report
- **Security Remediation**: `docs/SECURITY_REMEDIATION_PLAN.md` - Fixes implemented
- **Security Checklist**: `SECURITY_CHECKLIST.md` - Pre-deployment validation

### **For New Developers**
- **This Guide**: Complete developer onboarding
- **Project Structure**: `PROJECT_STRUCTURE.md` - Codebase organization
- **Setup Guide**: `docs/setup-guide.md` - Basic development setup
- **Architecture**: `docs/GARDENOS_COMPLETE_SETUP_GUIDE.md` - Infrastructure overview

### **For Infrastructure Work**
- **Server Config**: `config/servers.yaml` - Single source of truth
- **K3s Setup**: `docs/deployment/K3S_HA_SETUP_GUIDE.md`
- **Database**: `docs/database/README.md`

### **For Daily Development**
- **Dev Journal**: `docs/dev_journal/rolling_journal.md` - Latest progress
- **API Docs**: FastAPI auto-generated docs at `/docs`
- **Component Library**: shadcn/ui documentation

---

## 🎯 **Getting Help**

### **🔒 Security Questions**
- **"How do I validate security?"** → `node scripts/validate-security.js`
- **"Where are environment files stored?"** → Server-side at `/root/crm-env-files/`
- **"How do I switch environments?"** → `env-switch`
- **"What if I have hardcoded secrets?"** → Run security validation, fix immediately

### **🛠️ Development Questions**
- **"How do I start development?"** → `env-start && npm run dev`
- **"How do I add a new server?"** → Update `config/servers.yaml`, run update script
- **"How do I deploy changes?"** → Use `./scripts/k8s/deploy-gardenos.sh`
- **"Where are the AI agents?"** → `deployment/ai-agents/`
- **"How do I check system status?"** → `./scripts/k8s/gardenos-status.sh`

### **🌐 Multi-Machine Questions**
- **"How do I sync between laptop/desktop?"** → `env-start` downloads latest, `env-end` uploads changes
- **"What if I'm offline?"** → Environment files are cached locally in `.env-files/`
- **"How do I backup my changes?"** → `env-end` automatically backs up to HA server cluster

### **Debugging Approach**
We use a systematic 7-step debugging methodology:
1. Assess known vs unknown information
2. Research common issues online
3. Enhance debugging capabilities
4. Gather comprehensive data
5. Synthesize findings
6. Implement targeted fixes
7. Validate success

### **Support Resources**
- **Dev Journal**: Track of all recent changes and solutions
- **Security Documentation**: Complete security compliance guides
- **Environment Management**: Server-centralized system documentation
- **GitHub Issues**: Project-specific problems and features

---

**🎉 You're ready to contribute!**

**Start with:** `env-start` → `npm run dev` → `node scripts/validate-security.js` → `env-end`

Follow our security-first, DRY principles, and enjoy seamless multi-machine development! 🚀
