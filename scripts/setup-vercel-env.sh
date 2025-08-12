#!/bin/bash

# =============================================================================
# Vercel Environment Variables Setup Script
# =============================================================================
# This script helps you set up environment variables in Vercel for production.
# Make sure you have the Vercel CLI installed and authenticated.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Vercel environment variables...${NC}"
echo ""

# Check if Vercel CLI is installed and authenticated
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed.${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

# Check if user is authenticated
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Vercel.${NC}"
    echo "Run: vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI is ready!${NC}"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found.${NC}"
    echo "Please create .env.production with your production environment variables."
    exit 1
fi

echo -e "${YELLOW}📋 This script will help you set the following environment variables in Vercel:${NC}"
echo ""
echo "🔐 Security Variables:"
echo "  - NEXTAUTH_SECRET"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - SUPABASE_JWT_SECRET"
echo ""
echo "🌐 Public Variables:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - NEXT_PUBLIC_APP_URL"
echo ""
echo "🔗 Integration Variables:"
echo "  - RINGCENTRAL_CLIENT_ID"
echo "  - RINGCENTRAL_CLIENT_SECRET"
echo "  - RINGCENTRAL_SERVER_URL"
echo "  - RINGCENTRAL_REDIRECT_URI"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}🔧 Setting up environment variables...${NC}"
echo ""

# Function to set environment variable in Vercel
set_vercel_env() {
    local key=$1
    local value=$2
    local environment=${3:-"production"}
    
    if [ -n "$value" ] && [ "$value" != "your_"* ]; then
        echo -e "${YELLOW}Setting $key...${NC}"
        echo "$value" | vercel env add "$key" "$environment" --force
        echo -e "${GREEN}✅ $key set successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping $key (placeholder value detected)${NC}"
    fi
}

# Read environment variables from .env.production
echo -e "${BLUE}📖 Reading variables from .env.production...${NC}"

# Source the .env.production file (safely)
while IFS= read -r line; do
    # Skip comments and empty lines
    if [[ $line =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
        continue
    fi
    
    # Extract key=value pairs
    if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Remove quotes if present
        value=$(echo "$value" | sed 's/^["'\'']\|["'\'']$//g')
        
        case $key in
            "NEXTAUTH_SECRET")
                set_vercel_env "$key" "$value" "production"
                ;;
            "NEXTAUTH_URL")
                set_vercel_env "$key" "$value" "production"
                ;;
            "NEXT_PUBLIC_SUPABASE_URL")
                set_vercel_env "$key" "$value" "production"
                ;;
            "NEXT_PUBLIC_SUPABASE_ANON_KEY")
                set_vercel_env "$key" "$value" "production"
                ;;
            "SUPABASE_SERVICE_ROLE_KEY")
                set_vercel_env "$key" "$value" "production"
                ;;
            "SUPABASE_JWT_SECRET")
                set_vercel_env "$key" "$value" "production"
                ;;
            "RINGCENTRAL_CLIENT_ID")
                set_vercel_env "$key" "$value" "production"
                ;;
            "RINGCENTRAL_CLIENT_SECRET")
                set_vercel_env "$key" "$value" "production"
                ;;
            "RINGCENTRAL_SERVER_URL")
                set_vercel_env "$key" "$value" "production"
                ;;
            "RINGCENTRAL_REDIRECT_URI")
                set_vercel_env "$key" "$value" "production"
                ;;
            "NEXT_PUBLIC_APP_URL")
                set_vercel_env "$key" "$value" "production"
                ;;
            "NODE_ENV")
                set_vercel_env "$key" "$value" "production"
                ;;
            "N8N_WEBHOOK_URL")
                set_vercel_env "$key" "$value" "production"
                ;;
            "N8N_API_KEY")
                set_vercel_env "$key" "$value" "production"
                ;;
        esac
    fi
done < .env.production

echo ""
echo -e "${GREEN}🎉 Environment variables setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Verify the variables in your Vercel dashboard"
echo "2. Update NEXTAUTH_URL and RINGCENTRAL_REDIRECT_URI with your actual domain"
echo "3. Deploy your application: vercel --prod"
echo "4. Test the production deployment"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "- Update URLs with your actual production domain"
echo "- Test all integrations after deployment"
echo "- Monitor logs for any configuration issues"
echo ""
echo -e "${GREEN}🚀 Your application is ready for production!${NC}"
