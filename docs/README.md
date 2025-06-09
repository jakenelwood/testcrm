# 🚀 CRM Documentation Hub
**The single source of truth for all CRM documentation**

## 🎯 **Quick Navigation**

### **👋 New to the Project?**
- **[Getting Started](#-getting-started)** - 5-minute setup for new developers
- **[Architecture Overview](#-architecture-overview)** - How everything fits together
- **[Development Workflow](#-development-workflow)** - Daily development process

### **🔧 Working on the Project?**
- **[Development Planning](dev_plan/README.md)** - Strategic development roadmap and priorities
- **[Command Reference](#-command-reference)** - All essential commands in one place
- **[Troubleshooting](#-troubleshooting)** - Common issues and solutions
- **[Testing Guide](#-testing-guide)** - Running and writing tests

### **🚀 Deploying to Production?**
- **[Deployment Guide](#-deployment-guide)** - Production deployment process
- **[Monitoring & Health](#-monitoring--health)** - System monitoring and health checks
- **[Security Checklist](#-security-checklist)** - Pre-deployment security validation

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- SSH access to Hetzner servers (for environment management)
- Git for version control

### **5-Minute Setup**
```bash
# 1. Clone and setup
git clone https://github.com/jakenelwood/crm.git
cd crm

# 2. Install dependencies and setup testing
npm install
npm test

# 3. Setup environment management (server-centralized)
./scripts/sync-environment.sh

# 4. Start development
npm run dev
```

**✅ You're ready to develop!** The app runs at `http://localhost:3000`

---

## 🏗️ **Architecture Overview**

### **System Components**
```
Frontend (Next.js) ←→ Backend (FastAPI) ←→ Database (PostgreSQL)
       ↓                    ↓                    ↓
   Vercel/CF            Hetzner K3s         Supabase HA
```

### **Key Technologies**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python 3.11, Pydantic validation
- **Database**: PostgreSQL with Supabase, JSONB for flexibility
- **Infrastructure**: K3s on Hetzner, Docker containers, HAProxy load balancing
- **Security**: Server-centralized environment management, JWT authentication

### **Data Flow**
1. **Leads** → Form submission and validation
2. **Processing** → AI-powered data extraction and enrichment
3. **Storage** → Secure database with audit trails
4. **Integration** → RingCentral telephony, document generation

---

## 🔧 **Development Workflow**

### **Daily Commands**
```bash
# Start your day
./scripts/sync-environment.sh    # Sync latest environment config
npm run dev                      # Start development server

# During development
npm test                         # Run tests
npm run test:watch              # Watch mode for active development
npm run lint                    # Check code quality

# End your day
npm test                        # Ensure tests pass
git add . && git commit -m "..."  # Commit changes
```

### **Environment Management**
Our **server-centralized environment system** eliminates hardcoded secrets:
- Environment files stored securely on Hetzner servers
- Automatic synchronization across development machines
- No secrets in version control

---

## 📋 **Command Reference**

### **🏥 Health & Monitoring**
```bash
./scripts/comprehensive-health-check.sh  # Complete system health (run daily)
./scripts/cluster-status.sh             # Quick database cluster status
node scripts/validate-security.js       # Security compliance check
```

### **🧪 Testing & Quality**
```bash
npm test                    # Run all tests
npm run test:coverage      # Test coverage report
npm run test:ci           # CI-friendly test run
npx tsc --noEmit          # TypeScript validation
```

### **🔧 Development**
```bash
npm run dev               # Development server
npm run build            # Production build
npm run start            # Production server
./scripts/sync-environment.sh  # Environment sync
```

### **🚀 Deployment**
```bash
./scripts/deploy-gardenos.sh              # Deploy to K3s cluster
./scripts/comprehensive-health-check.sh   # Post-deployment validation
```

---

## 🧪 **Testing Guide**

### **Running Tests**
```bash
# Basic testing
npm test                    # Run all tests
npm run test:watch         # Watch mode for development

# Coverage and CI
npm run test:coverage      # Generate coverage report
npm run test:ci           # CI-friendly run (no watch)
```

### **Test Structure**
- **Unit Tests**: `lib/__tests__/` - Business logic and utilities
- **Component Tests**: `components/__tests__/` - React component testing
- **Integration Tests**: `app/api/__tests__/` - API endpoint testing

### **Writing Tests**
Follow the established patterns in `lib/__tests__/form-transformers.test.ts` for comprehensive test examples.

---

## 🚨 **Troubleshooting**

### **Common Issues**

**Build Errors**
```bash
npm run lint              # Check for code issues
npx tsc --noEmit         # TypeScript validation
node scripts/validate-security.js  # Security compliance
```

**Environment Issues**
```bash
./scripts/sync-environment.sh     # Sync environment files
# Check .env-files/ directory for available environments
```

**Database Connection**
```bash
./scripts/cluster-status.sh       # Check database cluster health
./scripts/comprehensive-health-check.sh  # Full system check
```

**Test Failures**
```bash
npm run test:debug        # Debug mode with detailed output
npm run test:coverage     # Check test coverage
```

**Security Issues**
```bash
node scripts/validate-security.js       # See specific security failures
grep -r "password\|secret" . --exclude-dir=node_modules  # Find hardcoded secrets
./scripts/secure-environment-files.sh   # Move secrets to secure storage
```

---

## 🚀 **Deployment Guide**

### **Pre-Deployment Checklist**
- [ ] All tests passing: `npm test`
- [ ] TypeScript validation: `npx tsc --noEmit`
- [ ] Security compliance: `node scripts/validate-security.js`
- [ ] Environment files synced: `./scripts/sync-environment.sh`

### **Deployment Process**
```bash
# 1. Deploy to K3s cluster
./scripts/deploy-gardenos.sh

# 2. Validate deployment
./scripts/comprehensive-health-check.sh

# 3. Monitor health score (target: 90%+)
```

---

## 🏥 **Monitoring & Health**

### **Health Monitoring**
- **Daily**: Run `./scripts/comprehensive-health-check.sh`
- **Target Health Score**: 90%+ (Excellent)
- **Critical Threshold**: Below 75% requires immediate attention

### **Health Score Guide**
| Score | Status | Action Required |
|-------|--------|----------------|
| 90-100% | 🎉 Excellent | Continue monitoring |
| 75-89% | ⚠️ Good | Address warnings |
| 50-74% | ⚠️ Fair | Investigate issues |
| 0-49% | 🚨 Poor | Immediate attention |

### **🚨 Emergency Recovery**
```bash
# Critical system issues
./scripts/comprehensive-health-check.sh  # Quick diagnostic
ssh root@5.78.103.224                   # Direct server access

# Service recovery
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose restart"
ssh root@5.78.103.224 "cd /opt/twincigo-crm && docker compose ps"
```

---

## 🔒 **Security Checklist**

### **Pre-Deployment Security Validation**
- [ ] No hardcoded secrets: `grep -r "password\|secret\|key" . --exclude-dir=node_modules`
- [ ] Security compliance: `node scripts/validate-security.js`
- [ ] Environment templates only: Check no `.env` files in git
- [ ] TypeScript strict checks: `npx tsc --noEmit`

---

## 📚 **Additional Resources**

### **Detailed Documentation**
- **[Development Planning](dev_plan/README.md)** - Strategic roadmap using Eisenhower Matrix
- **[Testing Implementation Plan](TESTING_IMPLEMENTATION_PLAN.md)** - Comprehensive testing strategy
- **[TypeScript Migration Guide](TYPESCRIPT_STRICT_MODE_MIGRATION.md)** - Type safety improvements
- **[Pragmatic Programming Guidelines](PRAGMATIC_PROGRAMMING_GUIDELINES.md)** - Code quality standards

### **Infrastructure Deep Dives**
- **[K3s Setup Guide](deployment/K3S_HA_SETUP_GUIDE.md)** - Kubernetes cluster setup
- **[Database Architecture](database/README.md)** - PostgreSQL and Supabase setup
- **[Security Compliance Report](SECURITY_COMPLIANCE_REPORT.md)** - Security implementation details

### **Development Tools**
- **[Environment Management](ENVIRONMENT_FILE_MANAGEMENT.md)** - Server-centralized environment system
- **[Monitoring Tools](reporting/README.md)** - Health checks and monitoring

---

## 🎯 **Getting Help**

### **Quick Support**
1. **Check this documentation first** - Most answers are here
2. **Run health check**: `./scripts/comprehensive-health-check.sh`
3. **Check recent changes**: `git log --oneline -10`

### **Documentation Feedback**
This documentation follows the principle: **"As simple as possible, but no simpler."**

Found something unclear or missing? The documentation should answer your question in under 30 seconds.
