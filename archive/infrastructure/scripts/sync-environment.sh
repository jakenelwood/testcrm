#!/bin/bash

# 🔄 Environment Synchronization Script
# Bidirectional sync between local development and Hetzner servers
# Replaces start-session.sh and end-session.sh with unified workflow

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# File comparison functions
compare_files() {
    local local_dir="$1"
    local remote_host="$2"
    local remote_path="$3"

    echo -e "${BLUE}🔍 Comparing local and server files...${NC}"

    # Create temporary directory for server files
    local temp_dir=$(mktemp -d)

    # Download server files for comparison
    if rsync -az --quiet -e "ssh -i $SSH_KEY" "$remote_host:$remote_path/" "$temp_dir/"; then
        echo -e "${CYAN}📊 File comparison results:${NC}"

        local changes_found=false

        # Compare all files in .env-files
        find "$local_dir" -type f | while read -r local_file; do
            local rel_path="${local_file#$local_dir/}"
            local server_file="$temp_dir/$rel_path"

            if [ ! -f "$server_file" ]; then
                echo -e "${GREEN}   + NEW: $rel_path (local only)${NC}"
                changes_found=true
            elif ! cmp -s "$local_file" "$server_file"; then
                echo -e "${YELLOW}   ~ MODIFIED: $rel_path (differs from server)${NC}"
                changes_found=true
            else
                echo -e "${CYAN}   = SAME: $rel_path${NC}"
            fi
        done

        # Check for files that exist on server but not locally
        find "$temp_dir" -type f | while read -r server_file; do
            local rel_path="${server_file#$temp_dir/}"
            local local_file="$local_dir/$rel_path"

            if [ ! -f "$local_file" ]; then
                echo -e "${RED}   - DELETED: $rel_path (server only)${NC}"
                changes_found=true
            fi
        done

    else
        echo -e "${YELLOW}⚠️  Could not download server files for comparison${NC}"
    fi

    # Clean up
    rm -rf "$temp_dir"
}

# Backup functions
backup_local_environments() {
    local backup_dir=".env-local-backup"
    local timestamp=$(date +"%Y%m%d_%H%M%S")

    if [ -d ".env-files" ] && [ "$(ls -A .env-files/ 2>/dev/null)" ]; then
        echo -e "${BLUE}💾 Backing up local .env-files directory...${NC}"
        mkdir -p "$backup_dir"

        # Backup all files in .env-files (not just .env.* files)
        for file in .env-files/*; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                backup_file="$backup_dir/${filename}.backup.${timestamp}"
                cp "$file" "$backup_file"
                echo -e "${CYAN}   • Backed up $filename to $backup_file${NC}"
            fi
        done

        # Backup templates directory if it exists
        if [ -d ".env-files/templates" ]; then
            mkdir -p "$backup_dir/templates"
            for file in .env-files/templates/*; do
                if [ -f "$file" ]; then
                    filename=$(basename "$file")
                    backup_file="$backup_dir/templates/${filename}.backup.${timestamp}"
                    cp "$file" "$backup_file"
                    echo -e "${CYAN}   • Backed up templates/$filename${NC}"
                fi
            done
        fi

        # Clean up old backups (keep last 10)
        find "$backup_dir" -name "*.backup.*" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
        echo -e "${GREEN}✅ Local .env-files backed up${NC}"
    else
        echo -e "${YELLOW}⚠️  No local .env-files directory to backup${NC}"
    fi
}

backup_server_environments() {
    local backup_dir=".env-server-backup"
    local timestamp=$(date +"%Y%m%d_%H%M%S")

    echo -e "${BLUE}💾 Backing up server environments...${NC}"
    mkdir -p "$backup_dir"

    # Download current server files to backup directory
    if rsync -avz --progress -e "ssh -i $SSH_KEY" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:$ENV_SERVER_PATH/" "$backup_dir/server-backup-$timestamp/"; then
        echo -e "${GREEN}✅ Server environments backed up to $backup_dir/server-backup-$timestamp/${NC}"

        # Clean up old server backups (keep last 5)
        ls -td "$backup_dir"/server-backup-* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    else
        echo -e "${YELLOW}⚠️  Failed to backup server environments${NC}"
    fi
}

backup_current_local_env() {
    local backup_dir=".env-local-backup"
    local timestamp=$(date +"%Y%m%d_%H%M%S")

    if [ -f ".env.local" ]; then
        mkdir -p "$backup_dir"
        backup_file="$backup_dir/.env.local.backup.$timestamp"
        cp .env.local "$backup_file"
        echo -e "${YELLOW}💾 Backed up current .env.local to $backup_file${NC}"

        # Clean up old .env.local backups (keep last 10)
        ls -t "$backup_dir"/.env.local.backup.* 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    fi
}

echo -e "${BLUE}🔄 CRM Environment Synchronization${NC}"
echo "=================================="
echo ""
echo -e "${CYAN}🏗️  Server-Based Environment Management${NC}"
echo -e "   Your environments are centrally managed on Hetzner servers"
echo -e "   This script syncs between local development and servers"
echo ""

# Load configuration
if [ -f ".env-files/.env-management-config" ]; then
    source .env-files/.env-management-config
    # Expand tilde in SSH_KEY path
    SSH_KEY="${SSH_KEY/#\~/$HOME}"
    echo -e "${GREEN}✅ Loaded environment configuration${NC}"
else
    echo -e "${RED}❌ Configuration file not found: .env-files/.env-management-config${NC}"
    echo -e "${YELLOW}💡 Run ./scripts/reorganize-env-structure.sh if you just reorganized files${NC}"
    exit 1
fi

# Test server connection
echo -e "${BLUE}🔗 Testing server connection...${NC}"
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "echo 'Connection test successful'" &> /dev/null; then
    echo -e "${RED}❌ Failed to connect to server${NC}"
    echo -e "${YELLOW}⚠️  Cannot sync with servers. Working offline only.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server connection successful${NC}"

# Check current state
echo ""
echo -e "${PURPLE}📋 CURRENT STATE${NC}"
echo "==============="

# Check local .env.local
CURRENT_LOCAL_ENV="none"
if [ -f ".env.local" ]; then
    if grep -q "NODE_ENV=development" .env.local; then
        CURRENT_LOCAL_ENV="development"
    elif grep -q "NODE_ENV=production" .env.local; then
        CURRENT_LOCAL_ENV="production"
    elif grep -q "NEXT_PUBLIC_BRAND_NAME=Twincigo" .env.local; then
        CURRENT_LOCAL_ENV="hetzner-gardenos"
    elif grep -q "NEXT_PUBLIC_DEPLOYMENT_TARGET=hetzner-k3s" .env.local; then
        CURRENT_LOCAL_ENV="k3s"
    else
        CURRENT_LOCAL_ENV="unknown"
    fi
    echo -e "${CYAN}📱 Local environment: ${CURRENT_LOCAL_ENV}${NC}"
else
    echo -e "${YELLOW}📱 Local environment: No .env.local file${NC}"
fi

# Check .env-files directory
if [ -d ".env-files" ] && [ "$(ls -A .env-files/ 2>/dev/null)" ]; then
    echo -e "${CYAN}📁 Available files in .env-files/:${NC}"

    # Show environment files
    echo -e "${CYAN}   Environment files:${NC}"
    for file in .env-files/.env.*; do
        if [ -f "$file" ]; then
            env_name=$(basename "$file" | sed 's/^\.env\.//')
            file_date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
            echo -e "     • ${env_name} (last modified: ${file_date})"
        fi
    done

    # Show other files
    echo -e "${CYAN}   Other files:${NC}"
    find .env-files -maxdepth 1 -type f ! -name '.env.*' | sort | while read -r file; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            file_date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
            echo -e "     • ${filename} (last modified: ${file_date})"
        fi
    done

    # Show templates directory
    if [ -d ".env-files/templates" ]; then
        echo -e "${CYAN}   Templates:${NC}"
        find .env-files/templates -type f | sort | while read -r file; do
            filename=$(basename "$file")
            file_date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
            echo -e "     • templates/${filename} (last modified: ${file_date})"
        done
    fi
else
    echo -e "${YELLOW}📁 No .env-files directory found${NC}"
fi

# Ask user what they want to do
echo ""
echo -e "${BLUE}🎯 What would you like to do?${NC}"
echo ""
echo "1) 📥 PULL - Download latest environments from server to local"
echo "2) 📤 PUSH - Upload local changes to server"
echo "3) 🔄 SWITCH - Change active local environment"
echo "4) ❌ EXIT - Cancel operation"
echo ""
read -p "Enter choice (1-4): " action_choice

case $action_choice in
    1)
        # PULL from server
        echo ""
        echo -e "${BLUE}📥 PULL - Download from Server${NC}"
        echo "=============================="
        echo ""
        echo -e "${YELLOW}This will download the latest environment files from the server.${NC}"
        echo -e "${YELLOW}Any local changes in .env-files/ will be overwritten.${NC}"
        echo ""
        read -p "Continue with download? (y/n): " confirm_pull
        
        if [ "$confirm_pull" != "y" ] && [ "$confirm_pull" != "Y" ]; then
            echo -e "${YELLOW}⚠️  Download cancelled${NC}"
            exit 0
        fi

        # Compare files first
        if [ -d ".env-files" ]; then
            compare_files ".env-files" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "$ENV_SERVER_PATH"
            echo ""
        fi

        # Backup current local environments before overwriting
        backup_local_environments

        echo -e "${BLUE}📥 Downloading latest environment files...${NC}"
        mkdir -p .env-files

        # Use rsync with checksum comparison to only transfer changed files
        if rsync -avz --checksum --progress -e "ssh -i $SSH_KEY" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:$ENV_SERVER_PATH/" .env-files/; then
            echo -e "${GREEN}✅ Successfully downloaded latest environment files${NC}"

            # Show what was downloaded
            echo ""
            echo -e "${CYAN}📁 Current .env-files structure:${NC}"
            find .env-files -type f | sort | while read -r file; do
                rel_path="${file#.env-files/}"
                file_date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
                file_size=$(stat -c %s "$file" 2>/dev/null || echo "0")
                echo -e "   • ${rel_path} (${file_size} bytes, updated: ${file_date})"
            done
        else
            echo -e "${RED}❌ Failed to download from server${NC}"
            exit 1
        fi
        ;;
        
    2)
        # PUSH to server
        echo ""
        echo -e "${BLUE}📤 PUSH - Upload to Server${NC}"
        echo "=========================="
        echo ""
        echo -e "${YELLOW}This will upload your local .env-files/ to the server.${NC}"
        echo -e "${YELLOW}Server versions will be overwritten with your local changes.${NC}"
        echo ""
        
        if [ ! -d ".env-files" ] || [ ! "$(ls -A .env-files/ 2>/dev/null)" ]; then
            echo -e "${RED}❌ No .env-files directory found to upload${NC}"
            exit 1
        fi

        # Compare files first
        compare_files ".env-files" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "$ENV_SERVER_PATH"
        echo ""

        echo -e "${CYAN}📁 Files to upload from .env-files/:${NC}"
        find .env-files -type f | sort | while read -r file; do
            rel_path="${file#.env-files/}"
            file_date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
            file_size=$(stat -c %s "$file" 2>/dev/null || echo "0")
            echo -e "   • ${rel_path} (${file_size} bytes, modified: ${file_date})"
        done
        
        echo ""
        read -p "Continue with upload? (y/n): " confirm_push
        
        if [ "$confirm_push" != "y" ] && [ "$confirm_push" != "Y" ]; then
            echo -e "${YELLOW}⚠️  Upload cancelled${NC}"
            exit 0
        fi

        # Backup current server environments before overwriting
        backup_server_environments

        echo -e "${BLUE}📤 Uploading environment files to server...${NC}"

        # Use rsync with checksum comparison to only transfer changed files
        if rsync -avz --checksum --progress -e "ssh -i $SSH_KEY" .env-files/ "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:$ENV_SERVER_PATH/"; then
            echo -e "${GREEN}✅ Successfully uploaded environment files to server${NC}"
            echo ""
            echo -e "${CYAN}📊 Upload summary:${NC}"
            echo -e "   • Only changed files were transferred (checksum comparison)"
            echo -e "   • All files in .env-files/ directory synchronized"
            echo -e "   • Templates directory included if present"
        else
            echo -e "${RED}❌ Failed to upload to server${NC}"
            exit 1
        fi
        ;;
        
    3)
        # SWITCH environment
        echo ""
        echo -e "${BLUE}🔄 SWITCH - Change Active Environment${NC}"
        echo "===================================="
        echo ""
        
        if [ ! -d ".env-files" ] || [ ! "$(ls -A .env-files/.env.* 2>/dev/null)" ]; then
            echo -e "${RED}❌ No environment files available. Run option 1 to download first.${NC}"
            exit 1
        fi
        
        echo -e "${CYAN}📁 Available environments:${NC}"
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
                if [ "$env_name" = "$CURRENT_LOCAL_ENV" ]; then
                    marker=" (current)"
                fi
                
                echo "$counter) $env_name$marker"
                ((counter++))
            fi
        done
        
        # Add option to keep current
        if [ -f ".env.local" ] && [ "$CURRENT_LOCAL_ENV" != "none" ]; then
            echo "$counter) Keep current ($CURRENT_LOCAL_ENV)"
            ENV_OPTIONS+=("keep-current")
        fi
        
        echo ""
        read -p "Enter choice (1-${#ENV_OPTIONS[@]}): " env_choice
        
        # Validate choice
        if ! [[ "$env_choice" =~ ^[0-9]+$ ]] || [ "$env_choice" -lt 1 ] || [ "$env_choice" -gt "${#ENV_OPTIONS[@]}" ]; then
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
        fi
        
        # Get selected environment
        selected_env="${ENV_OPTIONS[$((env_choice-1))]}"
        
        if [ "$selected_env" = "keep-current" ]; then
            echo -e "${GREEN}✅ Keeping current environment: $CURRENT_LOCAL_ENV${NC}"
            exit 0
        else
            selected_file="${ENV_FILES[$((env_choice-1))]}"
            
            echo ""
            echo -e "${YELLOW}Switch to ${selected_env} environment?${NC}"
            read -p "Confirm switch? (y/n): " confirm_switch
            
            if [ "$confirm_switch" != "y" ] && [ "$confirm_switch" != "Y" ]; then
                echo -e "${YELLOW}⚠️  Environment switch cancelled${NC}"
                exit 0
            fi
            
            # Backup current .env.local if it exists
            backup_current_local_env
            
            # Switch to selected environment
            echo -e "${BLUE}🔄 Switching to $selected_env environment...${NC}"
            cp "$selected_file" .env.local
            chmod 600 .env.local
            echo -e "${GREEN}✅ Switched to $selected_env environment${NC}"
        fi
        ;;
        
    4)
        echo -e "${YELLOW}❌ Operation cancelled${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Show backup information
echo ""
echo -e "${PURPLE}💾 BACKUP INFORMATION${NC}"
echo "===================="

# Show local backups
if [ -d ".env-local-backup" ] && [ "$(ls -A .env-local-backup/ 2>/dev/null)" ]; then
    local_backup_count=$(ls .env-local-backup/ 2>/dev/null | wc -l)
    latest_local_backup=$(ls -t .env-local-backup/ 2>/dev/null | head -1)
    echo -e "${CYAN}📱 Local backups: $local_backup_count files${NC}"
    if [ -n "$latest_local_backup" ]; then
        echo -e "   Latest: $latest_local_backup"
    fi
fi

# Show server backups
if [ -d ".env-server-backup" ] && [ "$(ls -A .env-server-backup/ 2>/dev/null)" ]; then
    server_backup_count=$(ls .env-server-backup/ 2>/dev/null | wc -l)
    latest_server_backup=$(ls -t .env-server-backup/ 2>/dev/null | head -1)
    echo -e "${CYAN}🖥️  Server backups: $server_backup_count directories${NC}"
    if [ -n "$latest_server_backup" ]; then
        echo -e "   Latest: $latest_server_backup"
    fi
fi

# Show final summary
echo ""
echo -e "${GREEN}🎉 Environment synchronization complete!${NC}"

# Show current environment summary if .env.local exists
if [ -f ".env.local" ]; then
    echo ""
    echo -e "${BLUE}📋 Current Environment Summary:${NC}"
    echo -e "   Active environment: $(grep "NODE_ENV=" .env.local | cut -d'=' -f2 || echo 'unknown')"
    echo -e "   App name: $(grep "NEXT_PUBLIC_APP_NAME=" .env.local | cut -d'=' -f2 || echo 'not set')"
    echo -e "   Brand: $(grep "NEXT_PUBLIC_BRAND_NAME=" .env.local | cut -d'=' -f2 || echo 'not set')"
    echo -e "   Debug mode: $(grep "DEBUG_MODE=" .env.local | cut -d'=' -f2 || echo 'not set')"
fi

# Show helpful commands
echo ""
echo -e "${CYAN}🛠️  Next Steps:${NC}"
echo -e "   Start development: ${YELLOW}npm run dev${NC}"
echo -e "   Sync environments: ${YELLOW}./scripts/sync-environment.sh${NC}"
echo -e "   Configure secrets: ${YELLOW}./scripts/setup-environment-secrets.sh${NC}"
echo ""
echo -e "${CYAN}💾 Backup Locations:${NC}"
echo -e "   Local backups: ${YELLOW}.env-local-backup/${NC}"
echo -e "   Server backups: ${YELLOW}.env-server-backup/${NC}"

echo ""
echo -e "${GREEN}✨ Ready for development!${NC}"
