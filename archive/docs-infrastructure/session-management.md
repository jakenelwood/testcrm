# 📁 Session Management & Environment Tools

The session management system implements **server-centralized environment management** for consistent, secure development workflows.

## 🎯 **Overview**

### **Server-Centralized Philosophy**
Instead of maintaining environment files locally, the system:
- **Stores** environment files securely on the server
- **Downloads** latest configurations at session start
- **Synchronizes** changes back to server at session end
- **Maintains** consistency across all development environments

### **Benefits**
- 🔒 **Security**: Environment files stored on secure server
- 🔄 **Consistency**: All developers use same configurations
- 💾 **Backup**: Files backed up with server HA infrastructure
- 👥 **Team Sync**: Environment changes shared automatically

## 🚀 **Core Tools**

### **1. Start Session Script**
**File**: `scripts/start-session.sh`  
**Purpose**: Begin development session with latest environment files

#### **Usage**
```bash
./scripts/start-session.sh
```

#### **What It Does**
1. **Tests server connectivity** to primary host
2. **Downloads latest environment files** from server
3. **Shows available environments** (development, production, staging)
4. **Prompts for environment selection**
5. **Backs up current .env.local** before switching
6. **Switches to selected environment**
7. **Displays environment summary** and helpful commands

#### **Example Session**
```
📥 Start of Session - Environment Setup
=======================================
✅ Loaded environment configuration
🔗 Testing server connection...
✅ Server connection successful
📥 Downloading latest environment files...
✅ Downloaded latest environment files
📁 Available environments:
   development (updated: 2025-06-07)
   production (updated: 2025-06-07)
📋 Current environment: development

🎯 Select environment for this session:
1) development (current)
2) production
3) Keep current (development)

Enter choice (1-3): 1
💾 Backed up current .env.local to .env.local.backup.20250607_224230
🔄 Switching to development environment...
✅ Switched to development environment

🎉 Session setup complete!
📋 Environment Summary:
   Active environment: development
   App name: AICRM-Dev
   Base URL: http://localhost:3000
   Debug mode: true

🛠️  Helpful commands for this session:
   Start development: npm run dev
   Switch environment: ./scripts/start-session.sh
   End session backup: ./scripts/end-session.sh

✨ Ready to start development!
```

### **2. End Session Script**
**File**: `scripts/end-session.sh`  
**Purpose**: End development session and backup changes to server

#### **Usage**
```bash
./scripts/end-session.sh
```

#### **What It Does**
1. **Backs up current environment files** locally
2. **Uploads changes to server** if modifications detected
3. **Creates timestamped backups** on server
4. **Verifies upload success**
5. **Provides session summary**

### **3. Environment Management Script**
**File**: `scripts/manage-env-files.sh`  
**Purpose**: Advanced environment file operations

#### **Usage**
```bash
# Download specific environment
./scripts/manage-env-files.sh download development

# Upload specific environment
./scripts/manage-env-files.sh upload production

# List available environments
./scripts/manage-env-files.sh list

# Sync all environments
./scripts/manage-env-files.sh sync
```

## 📁 **File Structure**

### **Server-Side Structure**
```
/root/crm-env-files/
├── .env.development     # Development environment
├── .env.production      # Production environment
├── .env.staging         # Staging environment (if used)
└── backups/
    ├── .env.development.backup.20250607_120000
    ├── .env.production.backup.20250607_120000
    └── ...
```

### **Local Structure**
```
your-project/
├── .env.local                           # Active environment (working copy)
├── .env-backup/                         # Session backups folder
│   ├── README.md                        # Backup documentation
│   ├── .env.local.backup.TIMESTAMP     # Timestamped backups
│   └── ...                              # Additional backups
├── .env-files/                          # Downloaded server files
│   ├── .env.development                 # Server's development config
│   ├── .env.production                  # Server's production config
│   └── .env.staging                     # Server's staging config
├── .env-management-config               # Configuration file
└── scripts/
    ├── start-session.sh
    ├── end-session.sh
    └── manage-env-files.sh
```

## ⚙️ **Configuration**

### **Management Configuration File**
**File**: `.env-management-config`

```bash
# Environment File Management Configuration
export ENV_PRIMARY_HOST="5.78.103.224"
export ENV_BACKUP_HOSTS="5.161.110.205"
export ENV_SERVER_USER="root"
export ENV_SERVER_PATH="/root/crm-env-files"
export SSH_KEY="~/.ssh/id_ed25519"
```

### **Environment Types**

#### **Development Environment**
```bash
NODE_ENV=development
DEBUG_MODE=true
NEXT_PUBLIC_APP_NAME=AICRM-Dev
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# Development database and API keys
```

#### **Production Environment**
```bash
NODE_ENV=production
DEBUG_MODE=false
NEXT_PUBLIC_APP_NAME=AICRM
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
# Production database and API keys
```

## 🔄 **Workflow Examples**

### **Daily Development Workflow**
```bash
# 1. Start development session
./scripts/start-session.sh
# Choose development environment

# 2. Work on features
npm run dev
# Make changes, test features

# 3. End session (backup changes)
./scripts/end-session.sh
```

### **Environment Switching Workflow**
```bash
# Switch to production for testing
./scripts/start-session.sh
# Choose production environment

# Test with production settings
npm run build
npm start

# Switch back to development
./scripts/start-session.sh
# Choose development environment
```

### **Team Collaboration Workflow**
```bash
# Team member A makes environment changes
./scripts/start-session.sh  # Gets latest
# Modify environment variables
./scripts/end-session.sh    # Uploads changes

# Team member B gets the changes
./scripts/start-session.sh  # Downloads A's changes automatically
```

## 🔒 **Security Features**

### **Environment File Security**
- **Server Storage**: Files stored on secure Hetzner servers
- **SSH Encryption**: All transfers use SSH encryption
- **Access Control**: SSH key-based authentication
- **Backup Retention**: Timestamped backups for recovery

### **Local Security**
- **Temporary Files**: Local files are working copies only
- **Automatic Cleanup**: Old backups can be cleaned up
- **Permission Control**: Files set to 600 (owner read/write only)

### **Template vs Real Values**
The health check distinguishes between:
- **Template Values**: `your_dev_*`, `development_password` (safe)
- **Real Secrets**: Actual API keys, passwords (require server management)

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Server Connection Failed**
```bash
# Check SSH connectivity
ssh root@5.78.103.224 "echo 'Connection test'"

# Verify SSH key
ls -la ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
```

#### **Environment Files Not Found**
```bash
# Check server directory
ssh root@5.78.103.224 "ls -la /root/crm-env-files/"

# Upload initial files if needed
scp .env.local root@5.78.103.224:/root/crm-env-files/.env.development
```

#### **Permission Denied**
```bash
# Fix SSH key permissions
chmod 600 ~/.ssh/id_ed25519

# Check server directory permissions
ssh root@5.78.103.224 "chmod 755 /root/crm-env-files"
```

### **Recovery Procedures**

#### **Restore from Backup**
```bash
# List available backups
ssh root@5.78.103.224 "ls -la /root/crm-env-files/backups/"

# Restore specific backup
ssh root@5.78.103.224 "cp /root/crm-env-files/backups/.env.development.backup.TIMESTAMP /root/crm-env-files/.env.development"
```

#### **Reset to Server State**
```bash
# Download fresh copy from server
rm .env.local .env-files/*
./scripts/start-session.sh
```

## 📊 **Monitoring Integration**

### **Health Check Integration**
The comprehensive health check script validates:
- ✅ Environment file security (template vs real values)
- ✅ Server-centralized management usage
- ✅ Configuration consistency

### **Session Tracking**
- **Session Start**: Logged with timestamp and environment
- **Environment Switch**: Tracked with backup creation
- **Session End**: Logged with upload status

## 📚 **Related Documentation**

- **[Comprehensive Health Check](./comprehensive-health-check.md)** - Health monitoring
- **[Security Monitoring](./security-monitoring.md)** - Security validation
- **[Daily Operations](./daily-operations.md)** - Routine procedures
- **[Environment File Management](../ENVIRONMENT_FILE_MANAGEMENT.md)** - Detailed setup guide

---

**📝 Last Updated**: June 7, 2025  
**🔄 Review Schedule**: Monthly  
**🔒 Security Level**: Server-Centralized Management
