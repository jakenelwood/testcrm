#!/bin/bash

# Setup Vercel Environment Variables for Insurance CRM
# Run this script to configure all required environment variables

echo "🚀 Setting up Vercel Environment Variables..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Supabase Configuration (REQUIRED)
echo "📝 Setting Supabase environment variables..."

# You need to replace these with your actual values
SUPABASE_URL="https://xyfpnlxwimjbgjloujxw.supabase.co"
SUPABASE_ANON_KEY="your_supabase_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# NextAuth Configuration
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="https://your-vercel-app.vercel.app"

# Set environment variables for all environments
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"
vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
vercel env add NEXTAUTH_URL production <<< "$NEXTAUTH_URL"

# Also set for preview and development
vercel env add NEXT_PUBLIC_SUPABASE_URL preview <<< "$SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview <<< "$SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY preview <<< "$SUPABASE_SERVICE_ROLE_KEY"

echo "✅ Environment variables configured!"
echo "🔄 Trigger a new deployment to apply changes"

# Optional: Trigger a new deployment
read -p "🚀 Trigger a new deployment now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
fi
