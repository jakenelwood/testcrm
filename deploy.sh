#!/bin/bash

# Script to deploy the Quote Request Generator application

# Set up environment variable for Hetzner server IP
export SERVER_IP=65.21.174.252

echo "=== Quote Request Generator Deployment ==="
echo "Starting deployment process..."

# Pull latest changes
echo "Pulling latest changes from repository..."
git pull

# Set up document templates
echo "Setting up document templates..."
chmod +x setup-templates.sh
./setup-templates.sh

# Build and start containers
echo "Building and starting Docker containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check if containers are running
echo "Checking container status..."
docker-compose ps

echo "=== Deployment Complete ==="
echo "Application should be available at:"
echo "Frontend: http://$SERVER_IP:3000"
echo "Backend API: http://$SERVER_IP:8000" 