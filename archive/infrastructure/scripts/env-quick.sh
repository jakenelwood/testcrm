#!/bin/bash

# 🚀 Quick Environment Commands
# Shortcuts for common environment management tasks

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

show_usage() {
    echo -e "${BLUE}🚀 Quick Environment Management${NC}"
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start     - Start session (download latest, select environment)"
    echo "  end       - End session (backup current environment)"
    echo "  switch    - Switch environment without downloading"
    echo "  sync      - Download latest files from server"
    echo "  status    - Show current environment status"
    echo "  list      - List available environments"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start new session"
    echo "  $0 switch   # Quick environment switch"
    echo "  $0 end      # End session with backup"
}

show_status() {
    echo -e "${BLUE}📋 Environment Status${NC}"
    echo "===================="
    
    if [ -f ".env.local" ]; then
        echo -e "${GREEN}✅ Active environment file: .env.local${NC}"
        echo -e "   NODE_ENV: $(grep "NODE_ENV=" .env.local | cut -d'=' -f2 || echo 'not set')"
        echo -e "   App: $(grep "NEXT_PUBLIC_APP_NAME=" .env.local | cut -d'=' -f2 || echo 'not set')"
        echo -e "   Modified: $(stat -c %y .env.local 2>/dev/null | cut -d'.' -f1 || echo 'unknown')"
    else
        echo -e "${YELLOW}⚠️  No active environment (.env.local not found)${NC}"
    fi
    
    if [ -d ".env-files" ]; then
        echo ""
        echo -e "${BLUE}📁 Cached environments:${NC}"
        for file in .env-files/.env.*; do
            if [ -f "$file" ]; then
                env_name=$(basename "$file" | sed 's/^\.env\.//')
                echo -e "   $env_name"
            fi
        done
    else
        echo -e "${YELLOW}⚠️  No cached environments found${NC}"
    fi
}

list_environments() {
    echo -e "${BLUE}📁 Available Environments${NC}"
    echo "========================="
    
    if [ -d ".env-files" ]; then
        for file in .env-files/.env.*; do
            if [ -f "$file" ]; then
                env_name=$(basename "$file" | sed 's/^\.env\.//')
                file_date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
                echo -e "   ${GREEN}$env_name${NC} (updated: $file_date)"
            fi
        done
    else
        echo -e "${YELLOW}⚠️  No environments found. Run 'env-quick start' first.${NC}"
    fi
}

quick_switch() {
    if [ ! -d ".env-files" ] || [ -z "$(ls -A .env-files 2>/dev/null)" ]; then
        echo -e "${RED}❌ No cached environments found. Run 'env-quick start' first.${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔄 Quick Environment Switch${NC}"
    echo "==========================="
    
    # Show available environments
    ENV_OPTIONS=()
    counter=1
    
    for file in .env-files/.env.*; do
        if [ -f "$file" ]; then
            env_name=$(basename "$file" | sed 's/^\.env\.//')
            ENV_OPTIONS+=("$file")
            echo "$counter) $env_name"
            ((counter++))
        fi
    done
    
    echo ""
    read -p "Select environment (1-${#ENV_OPTIONS[@]}): " choice
    
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#ENV_OPTIONS[@]}" ]; then
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
    fi
    
    selected_file="${ENV_OPTIONS[$((choice-1))]}"
    env_name=$(basename "$selected_file" | sed 's/^\.env\.//')
    
    # Backup current if exists
    if [ -f ".env.local" ]; then
        cp .env.local ".env.local.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Switch
    cp "$selected_file" .env.local
    chmod 600 .env.local
    echo -e "${GREEN}✅ Switched to $env_name environment${NC}"
}

sync_from_server() {
    echo -e "${BLUE}📥 Syncing from server...${NC}"
    
    if [ -f ".env-management-config" ]; then
        source .env-management-config
    else
        echo -e "${RED}❌ Configuration not found${NC}"
        exit 1
    fi
    
    mkdir -p .env-files
    
    if rsync -avz -e "ssh -i $SSH_KEY" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:$ENV_SERVER_PATH/" .env-files/ 2>/dev/null; then
        echo -e "${GREEN}✅ Sync complete${NC}"
    else
        echo -e "${RED}❌ Sync failed${NC}"
        exit 1
    fi
}

# Main command handling
case "${1:-}" in
    "start")
        ./scripts/start-session.sh
        ;;
    "end")
        ./scripts/end-session.sh
        ;;
    "switch")
        quick_switch
        ;;
    "sync")
        sync_from_server
        ;;
    "status")
        show_status
        ;;
    "list")
        list_environments
        ;;
    *)
        show_usage
        ;;
esac
