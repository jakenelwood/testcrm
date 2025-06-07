# 🚀 CRM Developer Guide

**Welcome to the CRM project!** This guide will get you from zero to productive contributor in the shortest time possible.

## 📋 **Quick Start Checklist**

- [ ] **Environment Setup** - Get your development environment running
- [ ] **Architecture Understanding** - Learn how the system works
- [ ] **Development Workflow** - Understand our processes and tools
- [ ] **Deployment Knowledge** - Know how to deploy and manage the system

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

### **Quick Setup Commands**
```bash
# 1. Clone and setup frontend
git clone https://github.com/jakenelwood/crm.git
cd crm/frontend-next-files
npm install
cp .env.local.template .env.local

# 2. Setup backend (if developing locally)
cd ../backend-fastapi
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# 3. Configure environment variables
# Edit .env.local with your database credentials
```

### **Environment Variables**
```env
# Database (Production Hetzner PostgreSQL)
DATABASE_URL=postgresql://crm_user:password@ubuntu-8gb-hil-1:5432/crm

# AI Integration (DeepInfra)
DEEPINFRA_API_KEY=your_deepinfra_key
OPENAI_API_KEY=your_deepinfra_key  # OpenAI-compatible API

# Authentication (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

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
1. **DRY (Don't Repeat Yourself)** - Centralize configurations and reuse code
2. **SRP (Single Responsibility)** - Each component does one thing well
3. **Configuration-Driven** - Use `config/servers.yaml` for infrastructure changes
4. **Documentation-First** - Update docs with every significant change

### **Making Changes**

#### **Frontend Changes**
```bash
cd frontend-next-files
npm run dev              # Start development server
npm run build            # Test production build
npm run lint             # Check code quality
```

#### **Backend Changes**
```bash
cd backend-fastapi
source venv/bin/activate
uvicorn app.main:app --reload  # Start development server
pytest                   # Run tests
```

#### **Infrastructure Changes**
```bash
# Update server configuration
vim config/servers.yaml

# Apply changes across all files
./scripts/update-server-names.sh

# Deploy to cluster
./scripts/k8s/deploy-gardenos.sh deploy-all
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

### **For New Developers**
- **This Guide**: Complete developer onboarding
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

### **Common Questions**
- **"How do I add a new server?"** → Update `config/servers.yaml`, run update script
- **"How do I deploy changes?"** → Use `./scripts/k8s/deploy-gardenos.sh`
- **"Where are the AI agents?"** → `backend-fastapi/app/ai_agents/`
- **"How do I check system status?"** → `./scripts/k8s/gardenos-status.sh`

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
- **GitHub Issues**: Project-specific problems and features
- **Documentation**: Comprehensive guides for all components

---

**🎉 You're ready to contribute!** Start with small changes, follow our DRY principles, and don't hesitate to ask questions.
