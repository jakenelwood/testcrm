#!/bin/bash

# 🔒 Environment File Management Script
# Securely manage environment files between server and local development

set -e

# Configuration
PRIMARY_HOST="${ENV_PRIMARY_HOST:-5.78.103.224}"
BACKUP_HOSTS="${ENV_BACKUP_HOSTS:-5.161.110.205}"
SERVER_USER="${ENV_SERVER_USER:-brian-berge}"
SERVER_PATH="${ENV_SERVER_PATH:-/home/brian-berge/crm-env-files}"
LOCAL_ENV_DIR=".env-files"
SSH_KEY="${SSH_KEY:-~/.ssh/id_ed25519}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${2:-$NC}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    local missing_deps=()
    
    if ! command -v ssh &> /dev/null; then
        missing_deps+=("ssh")
    fi
    
    if ! command -v scp &> /dev/null; then
        missing_deps+=("scp")
    fi
    
    if ! command -v rsync &> /dev/null; then
        missing_deps+=("rsync")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log "Missing required dependencies: ${missing_deps[*]}" $RED
        exit 1
    fi
}

# Test server connections (primary and backup)
test_connection() {
    log "Testing connection to primary server $PRIMARY_HOST..." $BLUE

    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SERVER_USER@$PRIMARY_HOST" "echo 'Primary connection successful'" &> /dev/null; then
        log "✅ Primary server connection successful" $GREEN

        # Test backup servers
        if [ -n "$BACKUP_HOSTS" ]; then
            for backup_host in $BACKUP_HOSTS; do
                log "Testing backup server $backup_host..." $BLUE
                if ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SERVER_USER@$backup_host" "echo 'Backup connection successful'" &> /dev/null; then
                    log "✅ Backup server $backup_host connection successful" $GREEN
                else
                    log "⚠️  Backup server $backup_host connection failed" $YELLOW
                fi
            done
        fi
        return 0
    else
        log "❌ Failed to connect to primary server" $RED
        log "Check your SSH key, server host, and credentials" $YELLOW
        return 1
    fi
}

# List available environment files on server
list_server_files() {
    log "📋 Available environment files on primary server:" $BLUE

    ssh -i "$SSH_KEY" "$SERVER_USER@$PRIMARY_HOST" "
        if [ -d '$SERVER_PATH' ]; then
            ls -la '$SERVER_PATH'/*.env* 2>/dev/null || echo 'No .env files found'
        else
            echo 'Environment directory does not exist on server'
        fi
    "
}

# Sync environment files across HA servers
sync_across_servers() {
    log "🔄 Syncing environment files across HA servers..." $BLUE

    if [ -z "$BACKUP_HOSTS" ]; then
        log "⚠️  No backup hosts configured, skipping HA sync" $YELLOW
        return 0
    fi

    for backup_host in $BACKUP_HOSTS; do
        log "Syncing to backup server $backup_host..." $YELLOW

        # Create directory on backup server
        ssh -i "$SSH_KEY" "$SERVER_USER@$backup_host" "mkdir -p '$SERVER_PATH'" || {
            log "❌ Failed to create directory on $backup_host" $RED
            continue
        }

        # Sync files from primary to backup
        rsync -avz -e "ssh -i $SSH_KEY" \
            "$SERVER_USER@$PRIMARY_HOST:$SERVER_PATH/" \
            "$SERVER_USER@$backup_host:$SERVER_PATH/" || {
            log "❌ Failed to sync to $backup_host" $RED
            continue
        }

        log "✅ Synced to backup server $backup_host" $GREEN
    done

    log "🎉 HA sync complete!" $GREEN
}

# Download environment files from server
download_env_files() {
    local env_type="$1"
    
    log "📥 Downloading environment files from server..." $BLUE
    
    # Create local env directory if it doesn't exist
    mkdir -p "$LOCAL_ENV_DIR"
    
    # Download specific environment or all files
    if [ -n "$env_type" ]; then
        log "Downloading $env_type environment files..." $YELLOW
        rsync -avz -e "ssh -i $SSH_KEY" \
            "$SERVER_USER@$PRIMARY_HOST:$SERVER_PATH/.env.$env_type*" \
            "$LOCAL_ENV_DIR/" 2>/dev/null || {
            log "❌ Failed to download $env_type environment files" $RED
            return 1
        }
    else
        log "Downloading all environment files..." $YELLOW
        rsync -avz -e "ssh -i $SSH_KEY" \
            "$SERVER_USER@$PRIMARY_HOST:$SERVER_PATH/" \
            "$LOCAL_ENV_DIR/" 2>/dev/null || {
            log "❌ Failed to download environment files" $RED
            return 1
        }
    fi
    
    log "✅ Environment files downloaded to $LOCAL_ENV_DIR" $GREEN
}

# Upload environment files to server
upload_env_files() {
    local file_path="$1"
    
    if [ ! -f "$file_path" ]; then
        log "❌ File $file_path does not exist" $RED
        return 1
    fi
    
    log "📤 Uploading $file_path to server..." $BLUE
    
    # Ensure server directory exists
    ssh -i "$SSH_KEY" "$SERVER_USER@$PRIMARY_HOST" "mkdir -p '$SERVER_PATH'"

    # Upload file to primary server
    scp -i "$SSH_KEY" "$file_path" "$SERVER_USER@$PRIMARY_HOST:$SERVER_PATH/" || {
        log "❌ Failed to upload $file_path" $RED
        return 1
    }
    
    log "✅ File uploaded to primary server" $GREEN

    # Sync to backup servers for HA
    sync_across_servers
}

# Sync local environment file to current directory
sync_env_file() {
    local env_type="$1"
    local source_file="$LOCAL_ENV_DIR/.env.$env_type"
    local target_file=".env.local"
    
    if [ ! -f "$source_file" ]; then
        log "❌ Environment file $source_file not found" $RED
        log "Run: $0 download $env_type" $YELLOW
        return 1
    fi
    
    # Backup existing .env.local if it exists
    if [ -f "$target_file" ]; then
        cp "$target_file" "$target_file.backup.$(date +%Y%m%d_%H%M%S)"
        log "📋 Backed up existing $target_file" $YELLOW
    fi
    
    # Copy environment file
    cp "$source_file" "$target_file"
    log "✅ Synced $env_type environment to $target_file" $GREEN
    
    # Set appropriate permissions
    chmod 600 "$target_file"
    log "🔒 Set secure permissions on $target_file" $GREEN
}

# Show usage information
show_usage() {
    cat << EOF
🔒 Environment File Management Tool

Usage: $0 <command> [options]

Commands:
    test                    Test connections to all HA servers
    list                    List available environment files on primary server
    download [env_type]     Download environment files from primary server
                           env_type: development, staging, production, etc.
    upload <file_path>      Upload environment file to primary server and sync to backups
    sync <env_type>         Sync downloaded environment file to .env.local
    sync-servers            Manually sync environment files across HA servers
    setup                   Initial setup and configuration

Examples:
    $0 test                           # Test server connection
    $0 list                           # List server files
    $0 download development           # Download development env files
    $0 download                       # Download all env files
    $0 upload .env.production         # Upload production env file
    $0 sync development               # Use development env locally

Environment Variables:
    ENV_PRIMARY_HOST        Primary server IP (default: 5.78.103.224)
    ENV_BACKUP_HOSTS        Backup server IPs (default: 5.161.110.205)
    ENV_SERVER_USER         SSH username (default: brian-berge)
    ENV_SERVER_PATH         Server path for env files (default: /home/brian-berge/crm-env-files)
    SSH_KEY                 SSH private key path (default: ~/.ssh/id_ed25519)

EOF
}

# Initial setup
setup() {
    log "🔧 Setting up environment file management..." $BLUE
    
    # Test connection
    if ! test_connection; then
        log "Please configure your server connection first" $YELLOW
        return 1
    fi
    
    # Create server directory
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "mkdir -p '$SERVER_PATH'"
    log "✅ Created server directory: $SERVER_PATH" $GREEN
    
    # Create local directory
    mkdir -p "$LOCAL_ENV_DIR"
    log "✅ Created local directory: $LOCAL_ENV_DIR" $GREEN
    
    # Add to .gitignore
    if ! grep -q "$LOCAL_ENV_DIR" .gitignore 2>/dev/null; then
        echo "" >> .gitignore
        echo "# Environment files downloaded from server" >> .gitignore
        echo "$LOCAL_ENV_DIR/" >> .gitignore
        echo ".env.local" >> .gitignore
        echo ".env.*.backup.*" >> .gitignore
        log "✅ Updated .gitignore" $GREEN
    fi
    
    log "🎉 Setup complete!" $GREEN
}

# Main script logic
main() {
    check_dependencies
    
    case "${1:-}" in
        "test")
            test_connection
            ;;
        "list")
            test_connection && list_server_files
            ;;
        "download")
            test_connection && download_env_files "$2"
            ;;
        "upload")
            if [ -z "$2" ]; then
                log "❌ Please specify a file to upload" $RED
                show_usage
                exit 1
            fi
            test_connection && upload_env_files "$2"
            ;;
        "sync")
            if [ -z "$2" ]; then
                log "❌ Please specify environment type to sync" $RED
                show_usage
                exit 1
            fi
            sync_env_file "$2"
            ;;
        "sync-servers")
            test_connection && sync_across_servers
            ;;
        "setup")
            setup
            ;;
        *)
            show_usage
            ;;
    esac
}

# Run main function with all arguments
main "$@"
