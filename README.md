# 🚀 Enterprise CRM System

**Production-grade CRM with AI agents, K3s infrastructure, and comprehensive insurance data management**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)](https://kubernetes.io/)

## 🎯 **Quick Start**

```bash
# 1. Clone and setup
git clone https://github.com/jakenelwood/crm.git
cd crm

# 2. Install and test
npm install
npm test

# 3. Setup environment (server-centralized)
./scripts/sync-environment.sh

# 4. Start development
npm run dev
```

**✅ Ready in 5 minutes!** Visit `http://localhost:3000`

## 📚 **Documentation**

**📋 [Complete Documentation Hub](docs/README.md)** - Everything you need in one place

### **Quick Links**
- **[Getting Started](docs/README.md#-getting-started)** - 5-minute setup guide
- **[Architecture Overview](docs/README.md#-architecture-overview)** - How everything works
- **[Command Reference](docs/README.md#-command-reference)** - All essential commands
- **[Troubleshooting](docs/README.md#-troubleshooting)** - Common issues and solutions

## 🏗️ **Architecture**

```
Frontend (Next.js) ←→ Backend (FastAPI) ←→ Database (PostgreSQL)
       ↓                    ↓                    ↓
   Vercel/CF            Hetzner K3s         Supabase HA
```

**Key Features:**
- 🔒 **Security-First**: Server-centralized environment management
- 🧪 **Type-Safe**: TypeScript with comprehensive testing
- 🚀 **Production-Ready**: K3s cluster with HA PostgreSQL
- 🤖 **AI-Powered**: Intelligent data processing and automation
- 📱 **Modern Stack**: Next.js 15, React 19, Tailwind CSS

## 🛠️ **Tech Stack**

### **Frontend**
- **Framework**: Next.js 15 with App Router
- **UI**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **State**: React Context, React Hook Form
- **Testing**: Jest, React Testing Library

### **Backend**
- **API**: FastAPI with Python 3.11
- **Database**: PostgreSQL with Supabase
- **Infrastructure**: K3s on Hetzner Cloud
- **Monitoring**: Comprehensive health checks

### **DevOps**
- **Deployment**: Docker containers on K3s
- **Environment**: Server-centralized secret management
- **Monitoring**: 28-check health monitoring system
- **Security**: 100% compliance validation

## 📊 **Project Status**

### **✅ Production Ready**
- **Health Score**: 90%+ (Excellent)
- **Test Coverage**: Comprehensive test suite
- **Security**: 100% compliance validated
- **Infrastructure**: 3-node HA cluster operational

### **🚀 Recent Achievements**
- ✅ Fixed all TypeScript type safety issues
- ✅ Implemented comprehensive testing infrastructure
- ✅ Enhanced security validation and monitoring
- ✅ Streamlined documentation (DRY principles)

## 🤝 **Contributing**

1. **Read the docs**: Start with [docs/README.md](docs/README.md)
2. **Run tests**: `npm test` (all tests must pass)
3. **Security check**: `node scripts/validate-security.js`
4. **Follow conventions**: TypeScript strict mode, comprehensive testing

## 📞 **Support**

- **📚 Documentation**: [docs/README.md](docs/README.md)
- **🔍 Health Check**: `./scripts/comprehensive-health-check.sh`
- **🛠️ Troubleshooting**: [docs/README.md#-troubleshooting](docs/README.md#-troubleshooting)

---

**Built with ❤️ for insurance professionals**
