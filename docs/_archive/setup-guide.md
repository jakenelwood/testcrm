# 🛠️ AICRM Setup Guide

## 🔒 Security-First Development Setup

**AICRM uses a revolutionary server-centralized environment management system that eliminates hardcoded secrets and provides seamless multi-machine development.**

## Prerequisites

- Node.js 18+
- SSH access to Hetzner servers (for environment management)
- Git (version control)
- Docker (optional, for local testing)

## 🚀 Quick Setup (5 Minutes)

### 1. Clone and Setup Environment Management
```bash
# Clone the repository
git clone https://github.com/jakenelwood/crm.git
cd crm

# Set up server-centralized environment management
./scripts/setup-env-management.sh
# This creates .env-management-config with server details

# Set up convenient aliases (optional but recommended)
./scripts/setup-aliases.sh
source ~/.bashrc  # or ~/.zshrc
```

### 2. Start Your First Development Session
```bash
# Start development session
env-start
# This will:
# ✅ Download latest environment files from HA server cluster
# ✅ Show available environments (development, staging, production)
# ✅ Let you select which environment to use
# ✅ Set up .env.local with secure configuration
# ✅ Back up any existing environment before switching
```

### 3. Install Dependencies and Validate Security
```bash
# Install dependencies
npm install

# Validate security compliance (CRITICAL)
node scripts/validate-security.js
# Must show: Security Score: 17/17 (100%)
```

### 4. Start Development Server
```bash
# Start development server
npm run dev
# Or use the convenient alias
crm-dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Management System

### **How It Works**
```
HA Server Cluster                    Your Development Machine
┌─────────────────────────┐         ┌─────────────────────────┐
│ Primary (5.78.103.224)  │         │ .env-files/ (cache)     │
│ /root/crm-env-files/    │◄───────►│ ├── .env.development    │
│ ├── .env.development    │         │ ├── .env.staging        │
│ ├── .env.staging        │         │ └── .env.production     │
│ └── .env.production     │         │ .env.local (active)     │
└─────────────────────────┘         └─────────────────────────┘
            │
            ▼ (auto-sync)
┌─────────────────────────┐
│ Backup (5.161.110.205) │
│ (replicated files)      │
└─────────────────────────┘
```

### **Daily Commands**
```bash
env-start     # Start session (download latest)
env-switch    # Quick environment switch
env-status    # Show current environment
env-sync      # Download latest from server
env-end       # End session (backup to server)
```

## 🌐 Multi-Machine Development

### **Perfect for Laptop/Desktop Development**
```bash
# On Laptop
env-start          # Get latest, work on features
# ... develop features ...
env-end            # Backup changes to server

# On Desktop
env-start          # Get latest (including laptop changes)
# ... continue working ...
env-end            # Backup changes to server

# Back on Laptop
env-start          # Get latest (including desktop changes)
# ✅ Seamless continuation with all changes synchronized
```

### **Benefits**
- ✅ **Zero Configuration** - No manual environment file copying
- ✅ **Always In Sync** - Latest environment files on every machine
- ✅ **HA Backup** - Environment files replicated across server cluster
- ✅ **Git Protection** - All .env files automatically in .gitignore
- ✅ **Security Compliance** - No hardcoded secrets in codebase

## 🔒 Security Validation

### **Critical Security Checks**
```bash
# Run comprehensive security validation
node scripts/validate-security.js

# Expected output:
# ✅ No hardcoded secrets found
# ✅ Production environment template exists
# ✅ No development authentication bypass
# ✅ Password hashing implemented
# ✅ Input validation present
# ✅ CORS methods restricted
# ✅ CORS headers restricted
# ✅ Parameterized queries used
# ✅ API input validation implemented
# ✅ All security headers implemented
# Security Score: 17/17 (100%)
```

### **Security Features Implemented**
- **Authentication Security** - bcrypt password hashing, no dev bypass
- **Input Validation** - Comprehensive validation on all API endpoints
- **SQL Injection Prevention** - Parameterized queries throughout
- **CORS Security** - Restricted origins, methods, and headers
- **Security Headers** - X-Content-Type-Options, X-Frame-Options, HSTS
- **Environment Security** - Server-centralized, zero hardcoded secrets

## 🚢 Production Deployment

### **Hetzner HA Cluster (Current)**
AICRM is deployed on a high-availability Kubernetes cluster:

```bash
# Deploy to production cluster
./scripts/k8s/deploy-gardenos.sh deploy-all

# Monitor deployment
kubectl get pods -A

# Check service health
./scripts/k8s/gardenos-status.sh
```

### **Production Architecture**
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

### **Environment Management for Production**
```bash
# Switch to production environment
env-start
# Select: production

# Validate production security
node scripts/validate-security.js

# Deploy with production environment
./scripts/k8s/deploy-gardenos.sh deploy-all
```

### **Build Commands**
```bash
# Build for production
npm run build

# Run comprehensive validation
npm run lint
node scripts/validate-security.js

# Test production build locally
npm run start
```

## 🔧 Troubleshooting

### **Environment Management Issues**
```bash
# Environment files not downloading
env-sync                    # Force download from server
ssh-add ~/.ssh/id_ed25519  # Ensure SSH key is loaded

# Wrong environment active
env-status                  # Check current environment
env-switch                  # Switch to correct environment

# Security validation failing
node scripts/validate-security.js  # See specific failures
grep -r "password\|secret" .       # Find hardcoded secrets
```

### **Development Issues**
```bash
# Build failures
npm run lint               # Check for code issues
npx tsc --noEmit          # TypeScript validation
node scripts/validate-security.js  # Security compliance

# Database connection issues
env-status                 # Verify correct environment
kubectl get pods -n postgres-cluster  # Check database status

# Missing dependencies
npm install               # Reinstall dependencies
npm run build            # Test production build
```

### **Security Issues**
```bash
# Security score not 100%
node scripts/validate-security.js  # See specific failures

# Hardcoded secrets found
./scripts/secure-environment-files.sh  # Move to secure storage

# Authentication issues
# Check lib/config/environment.ts for proper JWT configuration
```

## 📋 Development Commands

```bash
# Environment Management
env-start        # Start development session
env-end          # End session with backup
env-switch       # Quick environment switch
env-status       # Show current environment
env-sync         # Download latest from server

# Development
npm run dev      # Start development server
crm-dev          # Convenient alias
npm run build    # Build for production
npm run lint     # Run ESLint

# Security & Validation
node scripts/validate-security.js  # Security compliance check
./scripts/secure-environment-files.sh  # Secure environment files
```

## 📞 Support

### **Documentation Resources**
- **Environment Management**: `docs/ENVIRONMENT_FILE_MANAGEMENT.md`
- **Security Compliance**: `docs/SECURITY_COMPLIANCE_REPORT.md`
- **Developer Guide**: `docs/DEVELOPER_GUIDE.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`

### **Quick Help**
- **Environment issues**: Run `env-status` and `env-sync`
- **Security issues**: Run `node scripts/validate-security.js`
- **Development issues**: Check `docs/dev_journal/rolling_journal.md`
- **Infrastructure issues**: Use `kubectl get pods -A`

---

**🎉 You're ready to develop!**

**Remember**: Always start with `env-start`, validate with `node scripts/validate-security.js`, and end with `env-end`.

The system is designed for security-first, multi-machine development with zero configuration hassle! 🚀
