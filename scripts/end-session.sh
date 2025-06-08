#!/bin/bash

# 📤 End Session Script
# Backs up your current environment to the server before ending your work session

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📤 End of Session - Environment Backup${NC}"
echo "========================================"

# Load configuration
if [ -f ".env-management-config" ]; then
    source .env-management-config
    echo -e "${GREEN}✅ Loaded environment configuration${NC}"
else
    echo -e "${RED}❌ Configuration file not found. Run setup first.${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  No .env.local file found. Nothing to backup.${NC}"
    exit 0
fi

# Determine which environment this is based on content
echo -e "${BLUE}🔍 Detecting environment type...${NC}"

if grep -q "NODE_ENV=development" .env.local; then
    ENV_TYPE="development"
    TARGET_FILE=".env.development"
elif grep -q "NODE_ENV=production" .env.local; then
    ENV_TYPE="production"
    TARGET_FILE=".env.production"
elif grep -q "NODE_ENV=staging" .env.local; then
    ENV_TYPE="staging"
    TARGET_FILE=".env.staging"
else
    echo -e "${YELLOW}⚠️  Could not detect environment type. Please specify:${NC}"
    echo "1) development"
    echo "2) production"
    echo "3) staging"
    echo "4) custom name"
    read -p "Enter choice (1-4): " choice
    
    case $choice in
        1) ENV_TYPE="development"; TARGET_FILE=".env.development" ;;
        2) ENV_TYPE="production"; TARGET_FILE=".env.production" ;;
        3) ENV_TYPE="staging"; TARGET_FILE=".env.staging" ;;
        4) 
            read -p "Enter custom environment name: " custom_name
            ENV_TYPE="$custom_name"
            TARGET_FILE=".env.$custom_name"
            ;;
        *) echo -e "${RED}❌ Invalid choice${NC}"; exit 1 ;;
    esac
fi

echo -e "${GREEN}📋 Detected environment: ${ENV_TYPE}${NC}"

# Ask for confirmation
echo ""
read -p "Upload current .env.local as ${TARGET_FILE} to server? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}⚠️  Backup cancelled by user${NC}"
    exit 0
fi

# Create backup timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE=".env.local.backup.$TIMESTAMP"

# Backup current .env.local locally
cp .env.local "$BACKUP_FILE"
echo -e "${GREEN}✅ Created local backup: $BACKUP_FILE${NC}"

# Test server connection
echo -e "${BLUE}🔗 Testing server connection...${NC}"
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "echo 'Connection test successful'" &> /dev/null; then
    echo -e "${RED}❌ Failed to connect to server${NC}"
    echo -e "${YELLOW}💾 Local backup saved as: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Server connection successful${NC}"

# Upload to server
echo -e "${BLUE}📤 Uploading $TARGET_FILE to server...${NC}"
if scp -i "$SSH_KEY" .env.local "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:$ENV_SERVER_PATH/$TARGET_FILE"; then
    echo -e "${GREEN}✅ Successfully uploaded $TARGET_FILE to primary server${NC}"
else
    echo -e "${RED}❌ Failed to upload to server${NC}"
    echo -e "${YELLOW}💾 Local backup saved as: $BACKUP_FILE${NC}"
    exit 1
fi

# Sync to backup servers if configured
if [ -n "$ENV_BACKUP_HOSTS" ]; then
    echo -e "${BLUE}🔄 Syncing to backup servers...${NC}"
    for backup_host in $ENV_BACKUP_HOSTS; do
        echo -e "${YELLOW}   Syncing to $backup_host...${NC}"
        if ssh -i "$SSH_KEY" "$ENV_SERVER_USER@$backup_host" "mkdir -p '$ENV_SERVER_PATH'" && \
           scp -i "$SSH_KEY" .env.local "$ENV_SERVER_USER@$backup_host:$ENV_SERVER_PATH/$TARGET_FILE"; then
            echo -e "${GREEN}   ✅ Synced to $backup_host${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Failed to sync to $backup_host${NC}"
        fi
    done
fi

# Clean up old local backups (keep last 5)
echo -e "${BLUE}🧹 Cleaning up old backups...${NC}"
ls -t .env.local.backup.* 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
echo -e "${GREEN}✅ Cleaned up old backups (kept 5 most recent)${NC}"

# Summary
echo ""
echo -e "${GREEN}🎉 Session backup complete!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "   Environment: ${ENV_TYPE}"
echo -e "   Uploaded as: ${TARGET_FILE}"
echo -e "   Local backup: ${BACKUP_FILE}"
echo -e "   Server: ${ENV_PRIMARY_HOST}"

# Optional: Show what changed
if [ -f ".env-files/$TARGET_FILE" ]; then
    echo ""
    read -p "Show changes since last download? (y/n): " show_diff
    if [ "$show_diff" = "y" ] || [ "$show_diff" = "Y" ]; then
        echo -e "${BLUE}📊 Changes since last download:${NC}"
        diff ".env-files/$TARGET_FILE" .env.local || echo -e "${YELLOW}(Files are identical or diff not available)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✨ Ready to end session. Environment safely backed up!${NC}"
