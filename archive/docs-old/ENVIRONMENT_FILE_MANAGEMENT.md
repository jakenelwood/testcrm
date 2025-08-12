# 🔒 Environment File Management System

## Overview

This system allows you to securely store environment files on your server and download them to any development machine as needed. This approach provides:

- **Centralized secret management** on a secure server
- **Consistent environments** across development machines
- **Version control** for environment configurations
- **Secure access** via SSH authentication

## 🏗️ Architecture

```
┌─────────────────┐    SSH/SCP    ┌─────────────────┐
│   Server        │◄─────────────►│ Local Machine   │
│                 │               │                 │
│ ~/crm-env-files/│               │ .env-files/     │
│ ├── .env.dev    │               │ ├── .env.dev    │
│ ├── .env.staging│               │ ├── .env.staging│
│ └── .env.prod   │               │ └── .env.prod   │
└─────────────────┘               └─────────────────┘
                                           │
                                           ▼
                                    .env.local (active)
```

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Configure your server connection
export ENV_SERVER_HOST="your-server.com"
export ENV_SERVER_USER="your-username"
export ENV_SERVER_PATH="/home/your-username/crm-env-files"

# Run initial setup
./scripts/manage-env-files.sh setup
```

### 2. Test Connection

```bash
./scripts/manage-env-files.sh test
```

### 3. Upload Environment Files to Server

```bash
# Upload your current environment files
./scripts/manage-env-files.sh upload .env.development
./scripts/manage-env-files.sh upload .env.staging
./scripts/manage-env-files.sh upload .env.production
```

### 4. Download and Use Environment Files

```bash
# Download all environment files
./scripts/manage-env-files.sh download

# Or download specific environment
./scripts/manage-env-files.sh download development

# Sync to active environment
./scripts/manage-env-files.sh sync development
```

## 📋 Commands Reference

### Connection Management
```bash
# Test server connection
./scripts/manage-env-files.sh test

# List files on server
./scripts/manage-env-files.sh list
```

### File Operations
```bash
# Download all environment files
./scripts/manage-env-files.sh download

# Download specific environment
./scripts/manage-env-files.sh download development
./scripts/manage-env-files.sh download staging
./scripts/manage-env-files.sh download production

# Upload environment file to server
./scripts/manage-env-files.sh upload .env.development
./scripts/manage-env-files.sh upload .env.production

# Sync downloaded environment to .env.local
./scripts/manage-env-files.sh sync development
./scripts/manage-env-files.sh sync production
```

## 🔧 Configuration

### Environment Variables

Set these in your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# Server configuration
export ENV_SERVER_HOST="your-hetzner-server.com"
export ENV_SERVER_USER="your-username"
export ENV_SERVER_PATH="/home/your-username/crm-env-files"
export SSH_KEY="~/.ssh/id_ed25519"
```

### Server Directory Structure

On your server, create this structure:

```
~/crm-env-files/
├── .env.development     # Development environment
├── .env.staging         # Staging environment
├── .env.production      # Production environment
├── .env.local.template  # Template for local development
└── README.md           # Documentation
```

## 🔒 Security Best Practices

### 1. SSH Key Authentication
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server.com
```

### 2. File Permissions
```bash
# On server - restrict access to environment files
chmod 700 ~/crm-env-files
chmod 600 ~/crm-env-files/.env.*

# Locally - secure downloaded files
chmod 600 .env-files/.env.*
chmod 600 .env.local
```

### 3. Server Security
- Use SSH key authentication (disable password auth)
- Keep server updated with security patches
- Use firewall to restrict access
- Consider using a VPN for additional security

## 🔄 Workflow Examples

### Daily Development Workflow

```bash
# Morning: Get latest environment files
./scripts/manage-env-files.sh download development
./scripts/manage-env-files.sh sync development

# Work on your project...

# Evening: Upload any environment changes
./scripts/manage-env-files.sh upload .env.local
```

### Switching Between Environments

```bash
# Switch to staging environment
./scripts/manage-env-files.sh sync staging

# Switch to production environment (for debugging)
./scripts/manage-env-files.sh sync production

# Back to development
./scripts/manage-env-files.sh sync development
```

### Team Collaboration

```bash
# Team member updates environment
./scripts/manage-env-files.sh upload .env.development

# Other team members get updates
./scripts/manage-env-files.sh download development
./scripts/manage-env-files.sh sync development
```

## 🛡️ Security Considerations

### What's Protected:
- ✅ Environment files are stored on secure server
- ✅ SSH key authentication required
- ✅ Files are not committed to git
- ✅ Automatic file permission management
- ✅ Backup of existing files before sync

### What to Watch:
- ⚠️ Ensure server is properly secured
- ⚠️ Regularly rotate SSH keys
- ⚠️ Monitor server access logs
- ⚠️ Use different secrets per environment

## 🔧 Troubleshooting

### Connection Issues
```bash
# Test SSH connection manually
ssh -i ~/.ssh/id_ed25519 user@your-server.com

# Check SSH key permissions
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

### File Permission Issues
```bash
# Fix local file permissions
chmod 600 .env.local
chmod -R 600 .env-files/

# Fix server file permissions
ssh user@server "chmod -R 600 ~/crm-env-files/"
```

### Missing Files
```bash
# List what's actually on the server
./scripts/manage-env-files.sh list

# Re-upload missing files
./scripts/manage-env-files.sh upload .env.development
```

## 📚 Integration with Development

### VS Code Integration
Add to your VS Code settings:

```json
{
  "terminal.integrated.env.linux": {
    "ENV_SERVER_HOST": "your-server.com",
    "ENV_SERVER_USER": "your-username"
  }
}
```

### Git Hooks
Create a pre-commit hook to ensure environment files are synced:

```bash
#!/bin/sh
# .git/hooks/pre-commit
if [ -f ".env.local" ]; then
    echo "Backing up environment file..."
    ./scripts/manage-env-files.sh upload .env.local
fi
```

## 🎯 Benefits of This Approach

1. **Security**: Secrets stored on secure server, not local machines
2. **Consistency**: Same environment across all development machines
3. **Backup**: Server acts as backup for environment configurations
4. **Team Collaboration**: Easy sharing of environment updates
5. **Flexibility**: Switch between environments quickly
6. **Audit Trail**: Track environment changes on server

This system gives you the security of centralized secret management while maintaining the flexibility of local development!
