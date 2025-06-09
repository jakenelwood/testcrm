#!/bin/bash

# 🔐 Setup Environment Secrets
# Helps you configure your actual API tokens and secrets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔐 Environment Secrets Setup${NC}"
echo "============================="
echo ""

# Check if we have a current environment
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  No .env.local file found${NC}"
    echo "Please run ./scripts/start-session.sh first to select an environment"
    exit 1
fi

# Determine current environment
CURRENT_ENV="unknown"
if grep -q "NODE_ENV=development" .env.local; then
    CURRENT_ENV="development"
elif grep -q "NODE_ENV=production" .env.local; then
    CURRENT_ENV="production"
elif grep -q "NODE_ENV=staging" .env.local; then
    CURRENT_ENV="staging"
fi

echo -e "${CYAN}📋 Current environment: $CURRENT_ENV${NC}"
echo ""

# Function to update environment variable
update_env_var() {
    local var_name="$1"
    local var_description="$2"
    local current_value="$3"
    local is_secret="$4"
    
    echo -e "${BLUE}🔧 $var_description${NC}"
    
    if [ "$is_secret" = "true" ]; then
        echo -e "${YELLOW}Current value: [HIDDEN]${NC}"
    else
        echo -e "${YELLOW}Current value: $current_value${NC}"
    fi
    
    echo -n "Enter new value (or press Enter to keep current): "
    if [ "$is_secret" = "true" ]; then
        read -s new_value
        echo ""
    else
        read new_value
    fi
    
    if [ -n "$new_value" ]; then
        # Escape special characters for sed
        escaped_value=$(printf '%s\n' "$new_value" | sed 's/[[\.*^$()+?{|]/\\&/g')
        sed -i "s|^$var_name=.*|$var_name=$escaped_value|" .env.local
        echo -e "${GREEN}✅ Updated $var_name${NC}"
    else
        echo -e "${CYAN}⏭️  Keeping current value${NC}"
    fi
    echo ""
}

# Infrastructure secrets
echo -e "${PURPLE}🏗️  INFRASTRUCTURE CONFIGURATION${NC}"
echo "=================================="
echo ""

# Get current values
CURRENT_HCLOUD_TOKEN=$(grep "^HCLOUD_TOKEN=" .env.local | cut -d'=' -f2 || echo "")

update_env_var "HCLOUD_TOKEN" "Hetzner Cloud API Token" "$CURRENT_HCLOUD_TOKEN" "true"

# Application secrets (if in development)
if [ "$CURRENT_ENV" = "development" ]; then
    echo -e "${PURPLE}🔧 DEVELOPMENT CONFIGURATION${NC}"
    echo "============================="
    echo ""
    
    echo -e "${CYAN}ℹ️  Development environment detected${NC}"
    echo "You can use placeholder values for development"
    echo ""
    
elif [ "$CURRENT_ENV" = "production" ]; then
    echo -e "${PURPLE}🚀 PRODUCTION CONFIGURATION${NC}"
    echo "============================"
    echo ""
    
    echo -e "${RED}⚠️  PRODUCTION ENVIRONMENT DETECTED${NC}"
    echo -e "${RED}⚠️  All values should be actual production secrets${NC}"
    echo ""
    
    # Get current values
    CURRENT_JWT_SECRET=$(grep "^JWT_SECRET=" .env.local | cut -d'=' -f2 || echo "")
    CURRENT_NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" .env.local | cut -d'=' -f2 || echo "")
    CURRENT_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2 || echo "")
    CURRENT_SUPABASE_ANON=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2 || echo "")
    CURRENT_SUPABASE_SERVICE=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2 || echo "")
    
    update_env_var "JWT_SECRET" "JWT Secret (32+ characters)" "$CURRENT_JWT_SECRET" "true"
    update_env_var "NEXTAUTH_SECRET" "NextAuth Secret (32+ characters)" "$CURRENT_NEXTAUTH_SECRET" "true"
    update_env_var "NEXT_PUBLIC_SUPABASE_URL" "Supabase Project URL" "$CURRENT_SUPABASE_URL" "false"
    update_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anonymous Key" "$CURRENT_SUPABASE_ANON" "true"
    update_env_var "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key" "$CURRENT_SUPABASE_SERVICE" "true"
fi

# Verify Hetzner token
echo -e "${PURPLE}🔍 VERIFYING HETZNER CLOUD TOKEN${NC}"
echo "================================="
echo ""

HCLOUD_TOKEN=$(grep "^HCLOUD_TOKEN=" .env.local | cut -d'=' -f2)

if [ -z "$HCLOUD_TOKEN" ] || [ "$HCLOUD_TOKEN" = "your_hetzner_cloud_api_token_here" ]; then
    echo -e "${RED}❌ Hetzner Cloud token not set${NC}"
    echo ""
    echo -e "${YELLOW}To get your Hetzner Cloud token:${NC}"
    echo "1. Go to https://console.hetzner.cloud/"
    echo "2. Select your project"
    echo "3. Go to Security > API Tokens"
    echo "4. Create a new token with Read & Write permissions"
    echo "5. Copy the token and run this script again"
    echo ""
else
    echo -e "${BLUE}Testing Hetzner Cloud connection...${NC}"
    
    # Export token for testing
    export HCLOUD_TOKEN
    
    if hcloud server list > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Hetzner Cloud token is valid${NC}"
        
        # Show floating IPs
        echo ""
        echo -e "${CYAN}📋 Your floating IPs:${NC}"
        hcloud floating-ip list
        
    else
        echo -e "${RED}❌ Hetzner Cloud token is invalid or has insufficient permissions${NC}"
        echo ""
        echo -e "${YELLOW}Please check:${NC}"
        echo "1. Token is correct"
        echo "2. Token has Read & Write permissions"
        echo "3. Token is for the correct project"
    fi
fi

# Upload to server (if configured)
echo ""
echo -e "${PURPLE}📤 SERVER SYNCHRONIZATION${NC}"
echo "========================="
echo ""

if [ -f ".env-files/.env-management-config" ]; then
    source .env-files/.env-management-config
    
    echo -e "${BLUE}Testing server connection...${NC}"
    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "echo 'Connection test successful'" &> /dev/null; then
        echo -e "${GREEN}✅ Server connection successful${NC}"
        
        read -p "Upload updated environment file to server? (y/n): " upload_choice
        if [ "$upload_choice" = "y" ] || [ "$upload_choice" = "Y" ]; then
            echo -e "${BLUE}📤 Uploading to server...${NC}"
            
            # Create remote directory
            ssh -i "$SSH_KEY" "$ENV_SERVER_USER@$ENV_PRIMARY_HOST" "mkdir -p $ENV_SERVER_PATH"
            
            # Upload file
            scp -i "$SSH_KEY" .env.local "$ENV_SERVER_USER@$ENV_PRIMARY_HOST:$ENV_SERVER_PATH/.env.$CURRENT_ENV"
            
            echo -e "${GREEN}✅ Environment file uploaded to server${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Server connection failed${NC}"
        echo "Environment file updated locally only"
    fi
else
    echo -e "${YELLOW}⚠️  Server configuration not found${NC}"
    echo "Environment file updated locally only"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo ""
echo -e "${CYAN}📋 Summary:${NC}"
echo "  Environment: $CURRENT_ENV"
echo "  File: .env.local"

if [ -n "$HCLOUD_TOKEN" ] && [ "$HCLOUD_TOKEN" != "your_hetzner_cloud_api_token_here" ]; then
    echo "  Hetzner token: ✅ Configured"
else
    echo "  Hetzner token: ❌ Not configured"
fi

echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Run: export HCLOUD_TOKEN=\$(grep '^HCLOUD_TOKEN=' .env.local | cut -d'=' -f2)"
echo "2. Run: ./scripts/deploy-keepalived-ha.sh"
echo "3. Test your high availability setup"

echo ""
echo -e "${YELLOW}💡 Pro tip: Add this to your shell profile for automatic token loading:${NC}"
echo "echo 'export HCLOUD_TOKEN=\$(grep \"^HCLOUD_TOKEN=\" .env.local | cut -d\"=\" -f2 2>/dev/null || echo \"\")' >> ~/.bashrc"
