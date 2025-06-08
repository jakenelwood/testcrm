#!/bin/bash

# 📥 Start Session Script
# Downloads latest environment files and sets up your development environment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}📥 Start of Session - Environment Setup${NC}"
echo "======================================="

# Load configuration
if [ -f ".env-management-config" ]; then
    source .env-management-config
    echo -e "${GREEN}✅ Loaded environment configuration${NC}"
else
    echo -e "${RED}❌ Configuration file not found. Run setup first.${NC}"
    exit 1
fi

# Test server connection
echo -e "${BLUE}🔗 Testing server connection...${NC}"
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "echo 'Connection test successful'" &> /dev/null; then
    echo -e "${RED}❌ Failed to connect to server${NC}"
    echo -e "${YELLOW}⚠️  Working with cached environment files only${NC}"
    
    if [ -d ".env-files" ] && [ "$(ls -A .env-files)" ]; then
        echo -e "${CYAN}📁 Available cached environments:${NC}"
        ls -la .env-files/.env.* 2>/dev/null | awk '{print "   " $9}' | sed 's|.env-files/.env.||'
    else
        echo -e "${RED}❌ No cached environment files available${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Server connection successful${NC}"
    
    # Download latest environment files
    echo -e "${BLUE}📥 Downloading latest environment files...${NC}"
    mkdir -p .env-files
    
    if rsync -avz -e "ssh -i $SSH_KEY" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:$ENV_SERVER_PATH/" .env-files/ 2>/dev/null; then
        echo -e "${GREEN}✅ Downloaded latest environment files${NC}"
        
        # Show what's available
        echo -e "${CYAN}📁 Available environments:${NC}"
        for file in .env-files/.env.*; do
            if [ -f "$file" ]; then
                env_name=$(basename "$file" | sed 's/^\.env\.//')
                file_date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
                echo -e "   ${env_name} (updated: ${file_date})"
            fi
        done
    else
        echo -e "${YELLOW}⚠️  Download failed, using cached files${NC}"
        if [ -d ".env-files" ] && [ "$(ls -A .env-files)" ]; then
            echo -e "${CYAN}📁 Available cached environments:${NC}"
            ls -la .env-files/.env.* 2>/dev/null | awk '{print "   " $9}' | sed 's|.env-files/.env.||'
        else
            echo -e "${RED}❌ No environment files available${NC}"
            exit 1
        fi
    fi
fi

# Check current environment
CURRENT_ENV="none"
if [ -f ".env.local" ]; then
    if grep -q "NODE_ENV=development" .env.local; then
        CURRENT_ENV="development"
    elif grep -q "NODE_ENV=production" .env.local; then
        CURRENT_ENV="production"
    elif grep -q "NODE_ENV=staging" .env.local; then
        CURRENT_ENV="staging"
    else
        CURRENT_ENV="unknown"
    fi
    echo -e "${YELLOW}📋 Current environment: ${CURRENT_ENV}${NC}"
else
    echo -e "${YELLOW}📋 No current environment set${NC}"
fi

# Environment selection
echo ""
echo -e "${BLUE}🎯 Select environment for this session:${NC}"

# Build environment list
ENV_OPTIONS=()
ENV_FILES=()
counter=1

for file in .env-files/.env.*; do
    if [ -f "$file" ]; then
        env_name=$(basename "$file" | sed 's/^\.env\.//')
        ENV_OPTIONS+=("$env_name")
        ENV_FILES+=("$file")
        
        # Mark current environment
        marker=""
        if [ "$env_name" = "$CURRENT_ENV" ]; then
            marker=" (current)"
        fi
        
        echo "$counter) $env_name$marker"
        ((counter++))
    fi
done

# Add option to keep current
if [ -f ".env.local" ] && [ "$CURRENT_ENV" != "none" ]; then
    echo "$counter) Keep current ($CURRENT_ENV)"
    ENV_OPTIONS+=("keep-current")
fi

echo ""
read -p "Enter choice (1-${#ENV_OPTIONS[@]}): " choice

# Validate choice
if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#ENV_OPTIONS[@]}" ]; then
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
fi

# Get selected environment
selected_env="${ENV_OPTIONS[$((choice-1))]}"

if [ "$selected_env" = "keep-current" ]; then
    echo -e "${GREEN}✅ Keeping current environment: $CURRENT_ENV${NC}"
else
    selected_file="${ENV_FILES[$((choice-1))]}"
    
    # Backup current .env.local if it exists
    if [ -f ".env.local" ]; then
        mkdir -p .env-backup
        backup_file=".env-backup/.env.local.backup.$(date +%Y%m%d_%H%M%S)"
        cp .env.local "$backup_file"
        echo -e "${YELLOW}💾 Backed up current .env.local to $backup_file${NC}"
    fi
    
    # Switch to selected environment
    echo -e "${BLUE}🔄 Switching to $selected_env environment...${NC}"
    cp "$selected_file" .env.local
    chmod 600 .env.local
    echo -e "${GREEN}✅ Switched to $selected_env environment${NC}"
fi

# Show environment summary
echo ""
echo -e "${GREEN}🎉 Session setup complete!${NC}"
echo -e "${BLUE}📋 Environment Summary:${NC}"

if [ -f ".env.local" ]; then
    echo -e "   Active environment: $(grep "NODE_ENV=" .env.local | cut -d'=' -f2 || echo 'unknown')"
    echo -e "   App name: $(grep "NEXT_PUBLIC_APP_NAME=" .env.local | cut -d'=' -f2 || echo 'not set')"
    echo -e "   Base URL: $(grep "NEXT_PUBLIC_BASE_URL=" .env.local | cut -d'=' -f2 || echo 'not set')"
    echo -e "   Debug mode: $(grep "DEBUG_MODE=" .env.local | cut -d'=' -f2 || echo 'not set')"
fi

# Show helpful commands
echo ""
echo -e "${CYAN}🛠️  Helpful commands for this session:${NC}"
echo -e "   Start development: ${YELLOW}npm run dev${NC}"
echo -e "   Switch environment: ${YELLOW}./scripts/start-session.sh${NC}"
echo -e "   End session backup: ${YELLOW}./scripts/end-session.sh${NC}"

# Optional: Check for updates
echo ""
read -p "Check for package updates? (y/n): " check_updates
if [ "$check_updates" = "y" ] || [ "$check_updates" = "Y" ]; then
    echo -e "${BLUE}📦 Checking for package updates...${NC}"
    if command -v npm &> /dev/null; then
        npm outdated || echo -e "${GREEN}✅ All packages are up to date${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✨ Ready to start development!${NC}"
