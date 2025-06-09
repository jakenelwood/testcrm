#!/bin/bash

# 🔄 Restore Environment Files from Archive
# Restores your backed-up environment files and sets up server management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔄 Environment Files Restoration${NC}"
echo "================================="
echo ""

# Check if archive exists
ARCHIVE_DIR="_archive/insecure-env-files"
if [ ! -d "$ARCHIVE_DIR" ]; then
    echo -e "${RED}❌ Archive directory not found: $ARCHIVE_DIR${NC}"
    exit 1
fi

echo -e "${CYAN}📁 Found archived environment files:${NC}"
ls -la "$ARCHIVE_DIR"
echo ""

# Create environment files directory
mkdir -p .env-files

# Function to extract database credentials
extract_db_credentials() {
    local file="$1"
    echo "# Database credentials extracted from $file"
    grep "^DATABASE_URL=" "$file" || echo ""
    grep "^DB_HOST=" "$file" || echo ""
    grep "^DB_PORT=" "$file" || echo ""
    grep "^DB_NAME=" "$file" || echo ""
    grep "^DB_USER=" "$file" || echo ""
    grep "^DB_PASSWORD=" "$file" || echo ""
}

# Function to create environment file from archive
create_env_from_archive() {
    local archive_file="$1"
    local target_env="$2"
    local description="$3"
    
    echo -e "${BLUE}📝 Creating $target_env from $archive_file${NC}"
    echo -e "${CYAN}   Description: $description${NC}"
    
    # Start with current template
    if [ -f ".env.$target_env" ]; then
        cp ".env.$target_env" ".env-files/.env.$target_env"
    else
        cp ".env.development" ".env-files/.env.$target_env"
    fi
    
    # Extract and merge values from archive
    local temp_file=$(mktemp)
    
    # Copy archive content to temp file for processing
    cp "$archive_file" "$temp_file"
    
    # Extract key values and update target file
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^[[:space:]]*# ]] && continue
        [[ -z $key ]] && continue
        
        # Clean up key and value
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Skip if no value
        [[ -z $value ]] && continue
        
        # Update in target file if key exists
        if grep -q "^$key=" ".env-files/.env.$target_env"; then
            sed -i "s|^$key=.*|$key=$value|" ".env-files/.env.$target_env"
            echo -e "${GREEN}  ✅ Updated $key${NC}"
        else
            # Add new key if it doesn't exist
            echo "$key=$value" >> ".env-files/.env.$target_env"
            echo -e "${YELLOW}  ➕ Added $key${NC}"
        fi
    done < <(grep "^[^#].*=" "$temp_file")
    
    rm "$temp_file"
    echo ""
}

# Restore K3s environment
if [ -f "$ARCHIVE_DIR/.env.k3s.20250607_114824.backup" ]; then
    create_env_from_archive "$ARCHIVE_DIR/.env.k3s.20250607_114824.backup" "k3s" "K3s cluster configuration with real secrets"
fi

# Restore Hetzner GardenOS environment  
if [ -f "$ARCHIVE_DIR/.env.local.hetzner-gardenos.20250607_114824.backup" ]; then
    create_env_from_archive "$ARCHIVE_DIR/.env.local.hetzner-gardenos.20250607_114824.backup" "hetzner-gardenos" "Hetzner development environment"
fi

# Create production environment with database credentials
if [ -f "$ARCHIVE_DIR/hetzner_db_connection.env.20250607_114824.backup" ]; then
    echo -e "${BLUE}📝 Creating production environment with database credentials${NC}"
    
    # Start with production template
    cp ".env.production" ".env-files/.env.production"
    
    # Extract database credentials
    DB_URL=$(grep "^DATABASE_URL=" "$ARCHIVE_DIR/hetzner_db_connection.env.20250607_114824.backup" | cut -d'=' -f2)
    DB_HOST=$(grep "^DB_HOST=" "$ARCHIVE_DIR/hetzner_db_connection.env.20250607_114824.backup" | cut -d'=' -f2)
    DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ARCHIVE_DIR/hetzner_db_connection.env.20250607_114824.backup" | cut -d'=' -f2)
    
    if [ -n "$DB_URL" ]; then
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DB_URL|" ".env-files/.env.production"
        echo -e "${GREEN}  ✅ Updated DATABASE_URL${NC}"
    fi
    
    # Update floating IPs and server IPs
    sed -i "s|^FLOATING_IP_MAIN=.*|FLOATING_IP_MAIN=5.78.31.2|" ".env-files/.env.production"
    sed -i "s|^FLOATING_IP_BACKUP=.*|FLOATING_IP_BACKUP=5.78.28.85|" ".env-files/.env.production"
    
    echo ""
fi

# Add Hetzner token placeholder to all files
echo -e "${BLUE}🔧 Adding infrastructure configuration to all environment files${NC}"

for env_file in .env-files/.env.*; do
    if [ -f "$env_file" ]; then
        env_name=$(basename "$env_file" | sed 's/^\.env\.//')
        echo -e "${CYAN}  Updating $env_name${NC}"
        
        # Add infrastructure section if not present
        if ! grep -q "HCLOUD_TOKEN=" "$env_file"; then
            cat >> "$env_file" << 'EOF'

# =============================================================================
# INFRASTRUCTURE CONFIGURATION
# =============================================================================
# Hetzner Cloud API token for infrastructure management
HCLOUD_TOKEN=your_hetzner_cloud_api_token_here

# Floating IP configuration
FLOATING_IP_MAIN=5.78.31.2
FLOATING_IP_BACKUP=5.78.28.85

# Server configuration
PRIMARY_SERVER=5.78.103.224
BACKUP1_SERVER=5.161.110.205
BACKUP2_SERVER=178.156.186.10
EOF
            echo -e "${GREEN}    ✅ Added infrastructure configuration${NC}"
        fi
    fi
done

echo ""

# Show what was created
echo -e "${PURPLE}📋 RESTORED ENVIRONMENT FILES${NC}"
echo "=============================="
echo ""

for env_file in .env-files/.env.*; do
    if [ -f "$env_file" ]; then
        env_name=$(basename "$env_file" | sed 's/^\.env\.//')
        file_size=$(stat -c%s "$env_file")
        echo -e "${CYAN}$env_name${NC}: $file_size bytes"
        
        # Show key configurations
        if grep -q "DATABASE_URL=" "$env_file"; then
            db_host=$(grep "DATABASE_URL=" "$env_file" | grep -o '@[^:]*' | sed 's/@//' || echo "unknown")
            echo -e "  Database: $db_host"
        fi
        
        if grep -q "NEXT_PUBLIC_BRAND_NAME=" "$env_file"; then
            brand=$(grep "NEXT_PUBLIC_BRAND_NAME=" "$env_file" | cut -d'=' -f2)
            echo -e "  Brand: $brand"
        fi
        
        if grep -q "NODE_ENV=" "$env_file"; then
            node_env=$(grep "NODE_ENV=" "$env_file" | cut -d'=' -f2)
            echo -e "  Environment: $node_env"
        fi
        
        echo ""
    fi
done

# Upload to server
echo -e "${PURPLE}📤 SERVER UPLOAD${NC}"
echo "================"
echo ""

if [ -f ".env-management-config" ]; then
    source .env-management-config
    
    echo -e "${BLUE}Testing server connection...${NC}"
    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "echo 'Connection successful'" &> /dev/null; then
        echo -e "${GREEN}✅ Server connection successful${NC}"
        
        read -p "Upload restored environment files to server? (y/n): " upload_choice
        if [ "$upload_choice" = "y" ] || [ "$upload_choice" = "Y" ]; then
            echo -e "${BLUE}📤 Uploading environment files...${NC}"
            
            # Create remote directory
            ssh -i "$SSH_KEY" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "mkdir -p $ENV_SERVER_PATH"
            
            # Upload all environment files
            for env_file in .env-files/.env.*; do
                if [ -f "$env_file" ]; then
                    env_name=$(basename "$env_file")
                    echo -e "${CYAN}  Uploading $env_name${NC}"
                    scp -i "$SSH_KEY" "$env_file" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:$ENV_SERVER_PATH/$env_name"
                fi
            done
            
            echo -e "${GREEN}✅ All environment files uploaded to server${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Server connection failed${NC}"
        echo "Environment files restored locally only"
    fi
else
    echo -e "${YELLOW}⚠️  Server configuration not found${NC}"
    echo "Environment files restored locally only"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Environment restoration complete!${NC}"
echo ""
echo -e "${CYAN}📋 What was restored:${NC}"
echo "  ✅ K3s cluster configuration with real secrets"
echo "  ✅ Hetzner GardenOS development environment"
echo "  ✅ Production environment with database credentials"
echo "  ✅ Infrastructure configuration (floating IPs, servers)"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Run: ./scripts/start-session.sh (to select environment)"
echo "2. Run: ./scripts/setup-environment-secrets.sh (to add Hetzner token)"
echo "3. Run: ./scripts/deploy-keepalived-ha.sh (to deploy HA)"
echo ""
echo -e "${YELLOW}💡 Your original secrets are now available in .env-files/${NC}"
