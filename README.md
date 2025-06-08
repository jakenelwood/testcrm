# 🚀 AICRM - AI-Powered Customer Relationship Management System

A modern, secure, and scalable CRM system built with Next.js, FastAPI, and PostgreSQL, deployed on a high-availability Kubernetes cluster.

## 🎯 Project Overview

AICRM is a comprehensive customer relationship management system featuring:
- **AI-powered lead management** with intelligent pipeline automation
- **Secure multi-tenant architecture** with role-based access control
- **High-availability deployment** on Kubernetes with automatic failover
- **Real-time communication** via RingCentral integration
- **Advanced analytics** and reporting capabilities

## 🏗️ Architecture

### **Technology Stack**
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python, PostgreSQL
- **AI Integration**: DeepSeek-V3 via DeepInfra API
- **Infrastructure**: Kubernetes (K3s), Docker, HAProxy
- **Database**: PostgreSQL with Patroni HA clustering
- **Communication**: RingCentral API integration
- **Deployment**: Hetzner Cloud with multi-node HA setup

### **Security Features**
- ✅ **Zero hardcoded secrets** - Server-centralized environment management
- ✅ **Secure authentication** - bcrypt password hashing with JWT tokens
- ✅ **SQL injection prevention** - Parameterized queries with input validation
- ✅ **CORS security** - Restricted origins, methods, and headers
- ✅ **Security headers** - Comprehensive browser-level protection
- ✅ **Automated validation** - Security compliance checking tools

### **High Availability Setup**
```
┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│   ubuntu-8gb-hil-1      │    │   ubuntu-8gb-ash-1      │    │   ubuntu-8gb-ash-2      │
│   (Primary Master)      │    │   (Worker Node)         │    │   (Worker Node)         │
│   - K3s Master          │    │   - K3s Worker          │    │   - K3s Worker          │
│   - PostgreSQL Primary  │    │   - PostgreSQL Replica │    │   - PostgreSQL Replica │
│   - HAProxy             │    │   - FastAPI Backend     │    │   - FastAPI Backend     │
│   - Ingress Controller  │    │   - AI Agents           │    │   - AI Agents           │
└─────────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Docker and Docker Compose
- SSH access to Hetzner servers (for deployment)

### **Local Development Setup**

#### **1. Environment Management**
```bash
# Set up environment file management
./scripts/setup-env-management.sh

# Start development session (downloads latest environment files)
env-start

# Select development environment when prompted
```

#### **2. Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install Python dependencies (for AI agents)
cd deployment/ai-agents && pip install -r requirements.txt
```

#### **3. Start Development Server**
```bash
# Start Next.js development server
npm run dev

# Or use the convenient alias
crm-dev
```

### **Environment Management Commands**
```bash
env-start     # Start development session (download latest env files)
env-end       # End session (backup changes to server)
env-switch    # Quick environment switch
env-status    # Show current environment info
env-sync      # Download latest from server
```

## 🔒 Security & Environment Management

### **Server-Centralized Environment Files**
AICRM uses a secure, server-centralized environment management system:

```bash
# Your HA Server Cluster stores all environment files
Primary Server:  5.78.103.224 (ubuntu-8gb-hil-1)
Backup Server:   5.161.110.205 (ubuntu-8gb-ash-1)
Path:           /root/crm-env-files/

# Local development machines cache and sync
Local Cache:    .env-files/ (downloaded copies)
Active File:    .env.local (what your app uses)
```

### **Multi-Machine Development Workflow**
Perfect for laptop/desktop development:

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

### **Security Compliance**
- **Security Score**: 17/17 (100%) - All security checks passing
- **Zero Hardcoded Secrets**: All secrets managed server-side
- **Automated Validation**: `node scripts/validate-security.js`
- **Production Ready**: Full compliance with security guidelines

## 🚢 Deployment

### **Production Deployment to Hetzner HA Cluster**

#### **Prerequisites**
- SSH access to Hetzner servers
- Environment files configured on servers
- Docker and Kubernetes (K3s) cluster running

#### **Deployment Commands**
```bash
# Deploy to production cluster
./scripts/deploy-to-production.sh

# Monitor deployment status
kubectl get pods -A

# Check service health
./scripts/health-check.sh
```

#### **Server Configuration**
```bash
# Primary Server (5.78.103.224)
- K3s Master Node
- PostgreSQL Primary
- HAProxy Load Balancer
- Ingress Controller

# Worker Servers (5.161.110.205, etc.)
- K3s Worker Nodes
- PostgreSQL Replicas
- FastAPI Backend Services
- AI Agent Services
```

### **Docker Services**
```bash
# Build and run locally
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 Features

### **Lead Management**
- **AI-Powered Pipeline Automation** - Intelligent lead routing and follow-up
- **Multi-Pipeline Support** - Personal and Business lead workflows
- **Dynamic Stage Management** - Customizable pipeline stages
- **Bulk Import/Export** - CSV import with column mapping
- **Lead Source Tracking** - Comprehensive lead attribution

### **Communication Integration**
- **RingCentral Integration** - SMS and voice communication
- **Email Automation** - Automated follow-up sequences
- **Activity Logging** - Complete communication history
- **Template Management** - Reusable message templates

### **Insurance Quoting**
- **Multi-Line Support** - Auto, Home, Renters, Specialty insurance
- **Dynamic Forms** - Context-aware form generation
- **Quote Comparison** - Side-by-side quote analysis
- **Document Management** - Secure document storage and retrieval

### **Analytics & Reporting**
- **Pipeline Analytics** - Conversion rates and performance metrics
- **Revenue Tracking** - Commission and revenue reporting
- **Activity Reports** - Team performance and activity analysis
- **Custom Dashboards** - Configurable KPI dashboards

## 📚 Documentation

### **Core Documentation**
- **[Environment File Management](docs/ENVIRONMENT_FILE_MANAGEMENT.md)** - Server-centralized environment management
- **[Security Compliance Report](docs/SECURITY_COMPLIANCE_REPORT.md)** - Complete security assessment
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Development setup and guidelines
- **[Deployment Guide](docs/deployment/HETZNER_OPERATIONS_GUIDE.md)** - Production deployment instructions

### **Development Resources**
- **[Project Structure](PROJECT_STRUCTURE.md)** - Codebase organization
- **[Pragmatic Programming Guidelines](docs/PRAGMATIC_PROGRAMMING_GUIDELINES.md)** - Development principles
- **[Rolling Journal](docs/dev_journal/rolling_journal.md)** - Development progress log

### **Reporting & Monitoring Documentation**
- **[Reporting Overview](docs/reporting/README.md)** - **COMPREHENSIVE MONITORING GUIDE**
- **[Health Check Tool](docs/reporting/comprehensive-health-check.md)** - Primary infrastructure monitoring (100% health score)
- **[Session Management](docs/reporting/session-management.md)** - Environment management with organized backups
- **[Health Reports Archive](docs/reporting/health_reports/)** - Generated health check reports

### **Security Documentation**
- **[Security Remediation Plan](docs/SECURITY_REMEDIATION_PLAN.md)** - Security fixes implemented
- **[Security Checklist](SECURITY_CHECKLIST.md)** - Pre-deployment security validation

## 🛠️ Development Commands

### **Environment Management**
```bash
# Start development session
env-start

# End session with backup
env-end

# Quick environment switch
env-switch

# Check current environment
env-status

# Download latest from server
env-sync
```

### **Development Server**
```bash
# Start Next.js development server
npm run dev

# Or use convenient alias
crm-dev

# Build for production
npm run build
```

### **Monitoring & Health Checks (100% Health Score)**
```bash
# Run comprehensive infrastructure health check (RECOMMENDED)
./scripts/comprehensive-health-check.sh

# Check cluster status
./scripts/cluster-status.sh

# Monitor cluster health continuously
./scripts/monitor-cluster-health.sh --continuous

# View health reports
ls -la docs/reporting/health_reports/
```

### **Security Validation**
```bash
# Run comprehensive security check
node scripts/validate-security.js

# Secure environment files
./scripts/secure-environment-files.sh
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Server configuration (set in .env-management-config)
ENV_PRIMARY_HOST="5.78.103.224"
ENV_BACKUP_HOSTS="5.161.110.205"
ENV_SERVER_USER="root"
ENV_SERVER_PATH="/root/crm-env-files"
SSH_KEY="~/.ssh/id_ed25519"

# Application configuration (set in .env.local)
NODE_ENV=development
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
JWT_SECRET=your_secure_secret
```

### **Directory Structure**
```
crm/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility libraries
│   ├── config/            # Environment configuration
│   └── middleware/        # Security middleware
├── scripts/               # Management scripts
│   ├── start-session.sh   # Start development session
│   ├── end-session.sh     # End session with backup
│   └── validate-security.js # Security validation
├── docs/                  # Documentation
├── deployment/            # Docker & K8s configs
└── .env-files/           # Downloaded environment cache
```

### **Logging and Debugging**
```bash
# View application logs
npm run dev  # Development logs in console

# View deployment logs
kubectl logs -f deployment/crm-frontend
kubectl logs -f deployment/crm-backend

# Debug mode (set in environment)
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 🤝 Contributing

### **Development Workflow**
1. **Fork the repository** and create a feature branch
2. **Set up environment** using `env-start`
3. **Make changes** following the pragmatic programming guidelines
4. **Run security validation** with `node scripts/validate-security.js`
5. **Test thoroughly** with both unit and integration tests
6. **Submit pull request** with detailed description

### **Code Standards**
- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Security-first** approach with input validation
- **DRY principles** - Don't Repeat Yourself
- **Comprehensive testing** for critical business logic

### **Security Requirements**
- ✅ No hardcoded secrets
- ✅ Input validation on all endpoints
- ✅ Parameterized database queries
- ✅ Secure authentication implementation
- ✅ CORS properly configured

## 📞 Support & Contact

### **Development Team**
- **Primary Developer**: Brian Berge
- **Repository**: [GitHub - jakenelwood/crm](https://github.com/jakenelwood/crm)
- **Documentation**: Available in `/docs` directory

### **Infrastructure**
- **Hosting**: Hetzner Cloud HA Cluster
- **Monitoring**: Kubernetes native monitoring
- **Backup**: Automated database backups with HA replication

### **Getting Help**
1. **Check Documentation** - Comprehensive guides in `/docs`
2. **Review Security Checklist** - `SECURITY_CHECKLIST.md`
3. **Run Diagnostics** - `node scripts/validate-security.js`
4. **Check Logs** - Application and deployment logs

## 🎯 Project Status

### **✅ Production Ready**
- **Security Score**: 17/17 (100%) - All security checks passing
- **Environment Management**: Server-centralized with HA backup
- **Documentation**: Comprehensive guides and security compliance
- **Multi-Machine Support**: Seamless development across devices

### **🚀 Recent Achievements**
- **Complete Security Overhaul** - Eliminated all hardcoded secrets and vulnerabilities
- **HA Environment Management** - Server-centralized system with automatic backup
- **Automated Validation** - Security compliance checking and validation tools
- **Production Deployment** - Successfully deployed on Hetzner HA cluster

### **📈 Next Steps**
- **Enhanced Testing** - Comprehensive unit and integration test coverage
- **Performance Optimization** - Database query optimization and caching
- **Advanced Features** - AI-powered analytics and reporting enhancements
- **Mobile Support** - Responsive design improvements for mobile devices

## 🏆 Key Accomplishments

### **Security Excellence**
✅ **Zero Hardcoded Secrets** - All secrets managed server-side
✅ **Secure Authentication** - bcrypt password hashing with JWT
✅ **SQL Injection Prevention** - Parameterized queries throughout
✅ **Input Validation** - Comprehensive validation on all endpoints
✅ **Security Headers** - Full browser-level protection

### **Infrastructure Excellence**
✅ **High Availability** - 3-node Kubernetes cluster with automatic failover
✅ **Environment Management** - Server-centralized with multi-machine sync
✅ **Automated Deployment** - Streamlined CI/CD pipeline
✅ **Monitoring & Logging** - Comprehensive observability
✅ **Backup & Recovery** - Automated database backups with HA replication

---

**AICRM represents a modern, secure, and scalable approach to customer relationship management, built with enterprise-grade security and high-availability infrastructure. The system is production-ready and designed to scale with your business needs.**

🚀 **Ready to get started?** Run `env-start` to begin your development journey!

