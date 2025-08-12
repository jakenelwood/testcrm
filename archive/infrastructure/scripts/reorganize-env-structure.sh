#!/bin/bash

# 📁 Reorganize Environment File Structure
# Moves essential config and templates into .env-files/ for better organization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}📁 Environment File Structure Reorganization${NC}"
echo "============================================="
echo ""

# Create the new structure
echo -e "${BLUE}📂 Creating new directory structure...${NC}"

# Create templates directory
mkdir -p .env-files/templates
echo -e "${GREEN}  ✅ Created .env-files/templates/${NC}"

# Files to move
ESSENTIAL_FILE=".env-management-config"
TEMPLATE_FILES=(
    ".env.k3s.template"
    ".env.local.hetzner-gardenos.template"
    ".env.local.template"
    ".env.production.template"
)

echo ""
echo -e "${PURPLE}📋 Current structure:${NC}"
echo "Root level:"
for file in "${TEMPLATE_FILES[@]}" "$ESSENTIAL_FILE"; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}  📄 $file${NC}"
    fi
done

echo ""
echo ".env-files/:"
ls -la .env-files/ | grep -v "^total" | grep -v "^d.*\.$" | awk '{print "  📄 " $9}' | grep -v "^  📄 $"

echo ""
echo -e "${BLUE}🔄 Moving files to new structure...${NC}"

# Move essential config file
if [ -f "$ESSENTIAL_FILE" ]; then
    echo -e "${CYAN}  Moving $ESSENTIAL_FILE to .env-files/${NC}"
    mv "$ESSENTIAL_FILE" ".env-files/"
    echo -e "${GREEN}    ✅ Moved to .env-files/$ESSENTIAL_FILE${NC}"
else
    echo -e "${YELLOW}    ⚠️  $ESSENTIAL_FILE not found${NC}"
fi

# Move template files
echo ""
echo -e "${CYAN}  Moving template files to .env-files/templates/${NC}"
for template in "${TEMPLATE_FILES[@]}"; do
    if [ -f "$template" ]; then
        echo -e "${CYAN}    Moving $template${NC}"
        mv "$template" ".env-files/templates/"
        echo -e "${GREEN}      ✅ Moved to .env-files/templates/$template${NC}"
    else
        echo -e "${YELLOW}      ⚠️  $template not found${NC}"
    fi
done

echo ""
echo -e "${BLUE}📝 Updating .env-management-config paths...${NC}"

# Update the config file to reflect its new location
CONFIG_FILE=".env-files/.env-management-config"
if [ -f "$CONFIG_FILE" ]; then
    # Add a comment about the new location
    sed -i '1i# Environment File Management Configuration (moved to .env-files/ for better organization)' "$CONFIG_FILE"
    echo -e "${GREEN}  ✅ Updated configuration file${NC}"
fi

echo ""
echo -e "${BLUE}📝 Creating README for new structure...${NC}"

# Create README for the new structure
cat > .env-files/README.md << 'EOF'
# 🔧 Environment Files Directory

This directory contains all environment-related files for the CRM project, organized for better management and security.

## 📁 Directory Structure

```
.env-files/
├── README.md                    # This file
├── .env-management-config       # Server connection configuration
├── templates/                   # Environment file templates
│   ├── .env.k3s.template
│   ├── .env.local.template
│   ├── .env.local.hetzner-gardenos.template
│   └── .env.production.template
├── .env.development            # Development environment
├── .env.hetzner-gardenos       # Hetzner development setup
├── .env.k3s                    # K3s cluster configuration
└── .env.production             # Production environment
```

## 🔧 Configuration Files

### `.env-management-config`
Contains server connection settings for centralized environment management:
- Server IPs and connection details
- SSH key configuration
- Remote path settings

## 📄 Template Files (`templates/`)

Template files serve as:
- **Documentation** of available environment variables
- **Starting points** for new environments
- **Reference** for required configurations

### Available Templates:
- **`.env.local.template`** - Generic local development
- **`.env.k3s.template`** - K3s cluster setup
- **`.env.local.hetzner-gardenos.template`** - Hetzner development
- **`.env.production.template`** - Production deployment

## 🌍 Active Environment Files

These contain your actual configurations with real secrets:

### `.env.development`
- Local development with placeholder values
- Safe for development and testing

### `.env.hetzner-gardenos`
- Connects to Hetzner development servers
- Real database connections and API endpoints
- Your "Twincigo" brand configuration

### `.env.k3s`
- K3s cluster configuration
- Production-grade setup with real secrets
- AI and monitoring configurations

### `.env.production`
- Production environment
- Real database credentials and API keys
- Enterprise-grade security settings

## 🔄 Usage

### Select Environment
```bash
./scripts/start-session.sh
```

### Configure Secrets
```bash
./scripts/setup-environment-secrets.sh
```

### Server Management
Environment files are automatically synchronized with your Hetzner servers for centralized management.

## 🔒 Security

- **Never commit** active environment files to version control
- **Templates only** should be in git (with placeholder values)
- **Real secrets** are managed through server synchronization
- **Backups** are maintained in `.env-backup/` directory

## 📊 File Management

- **Active files** are managed by `./scripts/start-session.sh`
- **Server sync** uploads/downloads from Hetzner servers
- **Backups** are created automatically during session management
- **Templates** provide safe starting points for new environments

---

**Last Updated**: $(date)
**Total Environments**: $(ls -1 .env.* 2>/dev/null | wc -l)
**Total Templates**: $(ls -1 templates/.env.* 2>/dev/null | wc -l)
EOF

echo -e "${GREEN}  ✅ Created .env-files/README.md${NC}"

echo ""
echo -e "${BLUE}📝 Creating templates README...${NC}"

# Create README for templates
cat > .env-files/templates/README.md << 'EOF'
# 📄 Environment File Templates

This directory contains template files for different environment configurations.

## 🎯 Purpose

Templates serve as:
- **Documentation** of required environment variables
- **Starting points** for new environments  
- **Reference** for configuration options
- **Safe examples** with placeholder values

## 📋 Available Templates

### `.env.local.template`
**Generic local development template**
- Basic CRM configuration
- Placeholder values for all services
- Good starting point for new developers

### `.env.k3s.template`
**Kubernetes cluster template**
- K3s-specific configurations
- Service discovery endpoints
- Cluster networking settings

### `.env.local.hetzner-gardenos.template`
**Hetzner development template**
- Connects to Hetzner development servers
- HAProxy and database configurations
- GardenOS architecture setup

### `.env.production.template`
**Production deployment template**
- Production-grade security settings
- Enterprise configuration options
- SSL and performance optimizations

## 🔧 Using Templates

### Create New Environment
```bash
# Copy template to active environment
cp .env-files/templates/.env.local.template .env-files/.env.mynewenv

# Edit with real values
nano .env-files/.env.mynewenv

# Upload to server
./scripts/start-session.sh
```

### Reference Configuration
```bash
# View available options
cat .env-files/templates/.env.production.template

# Compare with current environment
diff .env.local .env-files/templates/.env.local.template
```

## ⚠️ Important Notes

- **Never put real secrets** in template files
- **Always use placeholders** like `your_api_key_here`
- **Keep templates updated** when adding new configuration options
- **Templates should be safe** to commit to version control

## 🔄 Template Maintenance

When adding new environment variables:
1. Add to appropriate template(s) with placeholder values
2. Update this README if needed
3. Document the new variable's purpose
4. Test template with real values

---

**Template Count**: $(ls -1 .env.* 2>/dev/null | wc -l)
**Last Updated**: $(date)
EOF

echo -e "${GREEN}  ✅ Created .env-files/templates/README.md${NC}"

echo ""
echo -e "${PURPLE}📋 NEW STRUCTURE SUMMARY${NC}"
echo "========================"
echo ""

echo -e "${CYAN}📁 .env-files/ (centralized environment management)${NC}"
echo "├── 📄 README.md"
echo "├── ⚙️  .env-management-config"
echo "├── 📂 templates/"
echo "│   ├── 📄 README.md"
for template in "${TEMPLATE_FILES[@]}"; do
    template_name=$(basename "$template")
    if [ -f ".env-files/templates/$template_name" ]; then
        echo "│   ├── 📄 $template_name"
    fi
done
echo "│   └── ..."
echo "├── 🔧 .env.development"
echo "├── 🏗️  .env.hetzner-gardenos"
echo "├── ☸️  .env.k3s"
echo "└── 🚀 .env.production"

echo ""
echo -e "${GREEN}✅ Root level is now clean!${NC}"
ls -la .env* 2>/dev/null | grep -v "^d" || echo "No root-level .env files remaining"

echo ""
echo -e "${BLUE}🔄 Next Steps:${NC}"
echo "1. Update scripts to use new config location"
echo "2. Test environment management: ./scripts/start-session.sh"
echo "3. Configure secrets: ./scripts/setup-environment-secrets.sh"
echo "4. Deploy infrastructure: ./scripts/deploy-keepalived-ha.sh"

echo ""
echo -e "${GREEN}🎉 Environment structure reorganization complete!${NC}"
