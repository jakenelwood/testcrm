#!/bin/bash

# Exit on error
set -e

echo "⭐ Preparing to push changes to GitHub ⭐"

# Add the most important files first
git add .env-example
git add backend/app/main.py
git add backend/requirements.txt
git add backend/app/services/database.py
git add minimal-cors-test/
git add frontend-next/
git add docker-compose.dev.yml
git add docker-compose.prod.yml
git add vercel.json

# Add everything else
git add .

# Commit with a meaningful message
git commit -m "Add CORS support and fix API connectivity issues for Vercel deployment"

# Push to GitHub
git push origin main

echo "✅ Successfully pushed changes to GitHub!"
echo "🚀 Now you can deploy on Vercel" 