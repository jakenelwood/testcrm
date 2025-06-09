#!/bin/bash

# 🧹 Clean Up Root-Level Environment Files
# Removes redundant root-level .env files now that we have proper server management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🧹 Root-Level Environment Files Cleanup${NC}"
echo "========================================"
echo ""

# Files to remove (redundant root-level files)
FILES_TO_REMOVE=(
    ".env.development"
    ".env.production" 
    ".env.local"
    ".env.local.backup.20250608_002533"
)

# Template files to keep (for reference)
TEMPLATE_FILES=(
    ".env.k3s.template"
    ".env.local.hetzner-gardenos.template"
    ".env.local.template"
    ".env.production.template"
)

# Important files to keep
KEEP_FILES=(
    ".env-management-config"
    ".env-backup/"
    ".env-files/"
)

echo -e "${YELLOW}📋 Current root-level .env files:${NC}"
ls -la .env* 2>/dev/null | grep -v "^d" || echo "No files found"
echo ""

echo -e "${PURPLE}🗑️  Files to be removed:${NC}"
for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${RED}  ❌ $file${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $file (not found)${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Files to keep:${NC}"
for file in "${TEMPLATE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}  ✅ $file (template)${NC}"
    fi
done

for file in "${KEEP_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo -e "${GREEN}  ✅ $file (important)${NC}"
    fi
done

echo ""
echo -e "${CYAN}📁 Your active environment files are in:${NC}"
echo "  .env-files/ (managed by server sync)"
echo "  .env-backup/ (automatic backups)"
echo ""

# Confirm deletion
read -p "Remove the redundant root-level files? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}⏭️  Cleanup cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🗑️  Removing redundant files...${NC}"

# Remove files
for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${RED}  Removing $file${NC}"
        rm "$file"
    fi
done

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""

echo -e "${PURPLE}📋 REMAINING ROOT-LEVEL FILES${NC}"
echo "============================="
echo ""

echo -e "${CYAN}Template files (for reference):${NC}"
for file in "${TEMPLATE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  📄 $file"
    fi
done

echo ""
echo -e "${CYAN}Configuration files:${NC}"
if [ -f ".env-management-config" ]; then
    echo "  ⚙️  .env-management-config"
fi

echo ""
echo -e "${CYAN}Active environment directories:${NC}"
if [ -d ".env-files" ]; then
    echo "  📁 .env-files/ ($(ls .env-files/ | wc -l) files)"
fi
if [ -d ".env-backup" ]; then
    echo "  💾 .env-backup/ ($(ls .env-backup/ | wc -l) files)"
fi

echo ""
echo -e "${GREEN}🎉 Your environment is now clean and organized!${NC}"
echo ""
echo -e "${BLUE}📋 How to use your environments:${NC}"
echo "1. Select environment: ./scripts/start-session.sh"
echo "2. Configure secrets: ./scripts/setup-environment-secrets.sh"
echo "3. Deploy infrastructure: ./scripts/deploy-keepalived-ha.sh"
echo ""
echo -e "${YELLOW}💡 All your real secrets are safely stored in .env-files/${NC}"
