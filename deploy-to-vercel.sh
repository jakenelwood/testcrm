#!/bin/bash

# Script to deploy the CRM application to Vercel

echo "Starting Vercel deployment process..."

# Ensure we're in the root directory
cd "$(dirname "$0")"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Verify the frontend directory exists
if [ ! -d "frontend-next-files" ]; then
    echo "Error: frontend-next-files directory not found!"
    exit 1
fi

# Verify package.json exists in the frontend directory
if [ ! -f "frontend-next-files/package.json" ]; then
    echo "Error: package.json not found in frontend-next-files directory!"
    exit 1
fi

# Verify vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "Error: vercel.json not found in the root directory!"
    exit 1
fi

echo "Configuration verified. Deploying to Vercel..."

# Deploy to Vercel
vercel --prod

echo "Deployment process completed."
