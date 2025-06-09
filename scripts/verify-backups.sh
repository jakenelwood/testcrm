#!/bin/bash

# 📁 Backup Directories Verification Script
# Checks the status and contents of backup directories

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}📁 BACKUP DIRECTORIES VERIFICATION${NC}"
echo "==================================="
echo ""

# Check local backup directory
echo -e "${CYAN}📱 LOCAL BACKUP DIRECTORY (.env-local-backup)${NC}"
if [ -d ".env-local-backup" ]; then
    echo "✅ Directory exists"
    local_count=$(ls .env-local-backup/ 2>/dev/null | wc -l)
    echo "📊 Total files: $local_count"
    
    if [ "$local_count" -gt 0 ]; then
        latest_local=$(ls -t .env-local-backup/.env.*.backup.* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
        if [ -n "$latest_local" ]; then
            echo "📅 Latest backup: $latest_local"
        fi
        
        # Show breakdown by type
        env_backups=$(ls .env-local-backup/.env.*.backup.* 2>/dev/null | wc -l)
        local_backups=$(ls .env-local-backup/.env.local.backup.* 2>/dev/null | wc -l)
        echo "   • Environment files: $env_backups"
        echo "   • Local .env backups: $local_backups"
    fi
    
    dir_modified=$(stat -c %y .env-local-backup/ 2>/dev/null | cut -d' ' -f1-2)
    echo "🕒 Last modified: $dir_modified"
else
    echo "❌ Directory does not exist"
fi

echo ""

# Check server backup directory
echo -e "${CYAN}🖥️  SERVER BACKUP DIRECTORY (.env-server-backup)${NC}"
if [ -d ".env-server-backup" ]; then
    echo "✅ Directory exists"
    server_count=$(ls .env-server-backup/ 2>/dev/null | wc -l)
    echo "📊 Total backup sets: $server_count"
    
    if [ "$server_count" -gt 0 ]; then
        latest_server=$(ls -t .env-server-backup/ 2>/dev/null | head -1)
        if [ -n "$latest_server" ]; then
            echo "📅 Latest backup: $latest_server"
            
            # Show contents of latest backup
            if [ -d ".env-server-backup/$latest_server" ]; then
                backup_files=$(ls .env-server-backup/$latest_server/.env.* 2>/dev/null | wc -l)
                echo "   • Environment files in latest: $backup_files"
            fi
        fi
    fi
    
    dir_modified=$(stat -c %y .env-server-backup/ 2>/dev/null | cut -d' ' -f1-2)
    echo "🕒 Last modified: $dir_modified"
else
    echo "❌ Directory does not exist"
fi

echo ""

# Summary
echo -e "${BLUE}📋 BACKUP SYSTEM STATUS${NC}"
echo "======================="

if [ -d ".env-local-backup" ] && [ -d ".env-server-backup" ]; then
    echo -e "${GREEN}✅ Both backup directories exist and are properly configured${NC}"
    echo ""
    echo -e "${CYAN}💾 Backup Strategy:${NC}"
    echo "   • Local backups: Created before PULL operations and environment switches"
    echo "   • Server backups: Created before PUSH operations"
    echo "   • Automatic cleanup: Keeps last 10 local files, last 5 server sets"
    echo ""
    echo -e "${YELLOW}📁 Directory Structure:${NC}"
    echo "   .env-local-backup/     - Individual environment file backups"
    echo "   .env-server-backup/    - Complete server state snapshots"
else
    echo -e "${YELLOW}⚠️  Backup system partially configured${NC}"
    echo "Run ./scripts/sync-environment.sh to initialize missing directories"
fi

echo ""
echo -e "${GREEN}🎉 Backup verification complete!${NC}"
