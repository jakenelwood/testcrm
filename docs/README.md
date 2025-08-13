# 🚀 AI-Centric Insurance CRM Documentation Hub
**The single source of truth for all CRM documentation**

## 🎯 **Quick Navigation**

### **👋 New to the Project?**
- **[Getting Started](#-getting-started)** - 5-minute setup for new developers
- **[Architecture Overview](#-architecture-overview)** - How everything fits together
- **[Database Schema](database/README.md)** - AI-centric database design and recent updates

### **🔧 Working on the Project?**
- **[Development Planning](dev_plan/README.md)** - Strategic development roadmap and priorities
- **[Database Migrations](../migrations/README.md)** - Schema changes and migration procedures
- **[Development Journal](dev_journal/README.md)** - Project history and decision log
- **[Testing Guide](#-testing-guide)** - Running and writing tests

### **🚀 Production & Operations?**
- **[Database Management](database/README.md)** - Schema, migrations, and operations
- **[Security Configuration](SECURITY_CONFIGURATION.md)** - Security implementation details
- **[Backup System](database/BACKUP_SYSTEM.md)** - Database backup and recovery

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL client tools (psql, pg_dump) for database operations
- Git for version control
- Access to Supabase Cloud database

### **5-Minute Setup**
```bash
# 1. Clone and setup
git clone https://github.com/jakenelwood/testcrm.git
cd TestCRM

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start development
npm run dev
```

**✅ You're ready to develop!** The app runs at `http://localhost:3000`

---

## 🏗️ **Architecture Overview**

### **System Components**
```
Frontend (Next.js) ←→ AI Processing ←→ Database (PostgreSQL)
       ↓                    ↓                    ↓
     Vercel              n8n Workflows      Supabase Cloud
```

### **Key Technologies**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **AI Integration**: OpenAI, vector embeddings, semantic search
- **Database**: PostgreSQL with Supabase Cloud, JSONB for AI-optimized data
- **Workflow Automation**: n8n for background processes and integrations
- **Security**: Supabase Auth, Row Level Security (RLS), JWT authentication

### **AI-Centric Data Flow**
1. **Lead Capture** → Form submission with AI validation
2. **AI Analysis** → Automated data extraction, enrichment, and insights
3. **Intelligent Storage** → JSONB structures optimized for AI processing
4. **Workflow Automation** → n8n triggers for follow-ups and integrations
5. **Human-AI Collaboration** → AI recommendations with human oversight

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
