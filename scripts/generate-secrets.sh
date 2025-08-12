#!/bin/bash

# =============================================================================
# Secret Generation Script
# =============================================================================
# This script generates secure secrets for your environment variables.
# Run this script to generate new secrets for development and production.

set -e

echo "🔐 Generating secure secrets for environment variables..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to generate a secure secret
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate hex secret
generate_hex() {
    local length=${1:-32}
    openssl rand -hex $length
}

echo -e "${BLUE}📋 Copy these secrets to your environment files:${NC}"
echo ""

echo -e "${YELLOW}=== DEVELOPMENT SECRETS (.env.local) ===${NC}"
echo "NEXTAUTH_SECRET=$(generate_secret 32)"
echo "SUPABASE_JWT_SECRET=$(generate_secret 64)"
echo ""

echo -e "${YELLOW}=== PRODUCTION SECRETS (.env.production) ===${NC}"
echo "NEXTAUTH_SECRET=$(generate_secret 32)"
echo "SUPABASE_JWT_SECRET=$(generate_secret 64)"
echo ""

echo -e "${YELLOW}=== OPTIONAL API KEYS ===${NC}"
echo "# N8N_API_KEY=$(generate_hex 32)"
echo "# CUSTOM_API_KEY=$(generate_secret 32)"
echo ""

echo -e "${GREEN}✅ Secrets generated successfully!${NC}"
echo ""
echo -e "${RED}⚠️  SECURITY REMINDERS:${NC}"
echo "1. Use different secrets for development and production"
echo "2. Never commit these secrets to version control"
echo "3. Store production secrets in your deployment platform"
echo "4. Rotate secrets regularly (every 90 days)"
echo ""

echo -e "${BLUE}📖 Next steps:${NC}"
echo "1. Copy the development secrets to .env.local"
echo "2. Copy the production secrets to your deployment platform"
echo "3. Update NEXTAUTH_URL and other environment-specific values"
echo "4. Test your application with the new secrets"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}📝 Found .env.local file${NC}"
    echo "Remember to update the secrets in this file with the generated values above."
else
    echo -e "${YELLOW}📝 No .env.local file found${NC}"
    echo "Copy .env.example to .env.local and add the generated secrets."
fi

echo ""
echo -e "${GREEN}🚀 Ready to secure your application!${NC}"
