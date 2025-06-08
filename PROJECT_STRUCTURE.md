# AICRM Project Structure

## Directory Organization

```
crm/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── quotes/            # Quote management pages
├── components/             # React components
│   ├── client/            # Client-side components
│   ├── forms/             # Form components
│   ├── kanban/            # Kanban board components
│   ├── leads/             # Lead management components
│   ├── pipelines/         # Pipeline components
│   ├── providers/         # Context providers
│   ├── ringcentral/       # RingCentral integration
│   ├── theme/             # Theme components
│   └── ui/                # UI components (shadcn/ui)
├── config/                 # Configuration files
├── contexts/               # React contexts
├── database/               # Database schemas and migrations
├── deployment/             # Docker deployment files
│   ├── ai-agents/         # AI agent services
│   ├── backend/           # FastAPI backend
│   ├── haproxy/           # Load balancer config
│   ├── patroni/           # PostgreSQL HA config
│   ├── postgres/          # Database initialization
│   └── storage/           # File storage
├── docs/                   # Documentation
│   ├── ai/                # AI integration docs
│   ├── database/          # Database documentation
│   ├── deployment/        # Deployment guides
│   ├── dev_journal/       # Development journal
│   ├── features/          # Feature documentation
│   └── integrations/      # Integration guides
├── hooks/                  # React hooks
├── k8s/                    # Kubernetes manifests
│   ├── fastapi/           # FastAPI deployments
│   ├── ingress/           # Ingress configurations
│   ├── monitoring/        # Monitoring stack
│   ├── postgres/          # PostgreSQL cluster
│   └── supabase/          # Supabase stack
├── lib/                    # Utility libraries
│   ├── config/            # Environment configuration
│   ├── database/          # Database utilities
│   ├── middleware/        # Security middleware
│   ├── ringcentral/       # RingCentral integration
│   └── themes/            # Theme definitions
├── public/                 # Static assets
├── scripts/                # Management and deployment scripts
│   ├── etcd/              # etcd cluster scripts
│   ├── k3s/               # K3s cluster scripts
│   ├── k8s/               # Kubernetes scripts
│   ├── start-session.sh   # Start development session
│   ├── end-session.sh     # End session with backup
│   ├── env-quick.sh       # Quick environment commands
│   └── validate-security.js # Security validation
├── styles/                 # CSS styles
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── .env-files/            # Downloaded environment cache
└── _archive/              # Archived/deprecated files
```

## Key Files

### **Environment Management**
- `.env-management-config` - Server configuration for environment management
- `.env.local` - Active environment file (not in git)
- `.env-files/` - Downloaded environment cache
- `scripts/start-session.sh` - Start development session
- `scripts/end-session.sh` - End session with backup

### **Security & Configuration**
- `lib/config/environment.ts` - Environment configuration with validation
- `lib/middleware/validation.ts` - Input validation middleware
- `scripts/validate-security.js` - Security compliance validation
- `SECURITY_CHECKLIST.md` - Pre-deployment security checklist

### **Deployment**
- `deployment/docker-compose.yml` - Local development orchestration
- `k8s/` - Kubernetes manifests for production
- `scripts/k8s/deploy-gardenos.sh` - Production deployment script

### **Documentation**
- `README.md` - Main project overview
- `docs/ENVIRONMENT_FILE_MANAGEMENT.md` - Environment management guide
- `docs/SECURITY_COMPLIANCE_REPORT.md` - Security compliance report
- `docs/DEVELOPER_GUIDE.md` - Developer setup guide

## Development Workflow

### **Daily Development**
1. **Start session**: `env-start` (downloads latest environment files)
2. **Develop**: `npm run dev` or `crm-dev`
3. **Switch environments**: `env-switch` (if needed)
4. **End session**: `env-end` (backs up changes to server)

### **Security Validation**
1. **Run security check**: `node scripts/validate-security.js`
2. **Validate environment**: Check for hardcoded secrets
3. **Test authentication**: Verify secure login flow

### **Deployment**
1. **Local testing**: `docker-compose up -d`
2. **Production deploy**: `./scripts/k8s/deploy-gardenos.sh`
3. **Monitor**: `kubectl get pods -A`

## Architecture Principles

### **Security First**
- ✅ **Zero hardcoded secrets** - Server-centralized environment management
- ✅ **Input validation** - All API endpoints validated
- ✅ **Secure authentication** - bcrypt + JWT implementation
- ✅ **SQL injection prevention** - Parameterized queries only

### **DRY (Don't Repeat Yourself)**
- **Centralized configuration** - Single source of truth for settings
- **Reusable components** - Modular React component architecture
- **Shared utilities** - Common functions in `/lib` and `/utils`

### **High Availability**
- **Multi-node deployment** - 3-node Kubernetes cluster
- **Database replication** - PostgreSQL with Patroni HA
- **Environment backup** - Automatic server-side backup and sync

### **Developer Experience**
- **Environment automation** - Seamless multi-machine development
- **Comprehensive documentation** - Guides for all major workflows
- **Security automation** - Automated compliance checking
- **Type safety** - Full TypeScript implementation
