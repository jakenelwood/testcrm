#!/bin/bash

# Deployment script for Traefik on the Hetzner server
# Usage: ./deploy-traefik.sh

# Exit on any error
set -e

echo "==== Quote Request Generator - Traefik Deployment ===="
echo "This script will deploy Traefik with SSL on the Hetzner server."

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "Error: This script must be run as root" >&2
    exit 1
fi

# Server configuration
SERVER_IP=${SERVER_IP:-65.21.174.252}
DOMAIN=${DOMAIN:-$SERVER_IP}
PROJECT_DIR=${PROJECT_DIR:-/root/quote-request-generator72}

echo "Using server IP: $SERVER_IP"
echo "Using domain: $DOMAIN"
echo "Project directory: $PROJECT_DIR"

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Creating project directory..."
    mkdir -p "$PROJECT_DIR"
fi

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Clone or update repository
if [ -d ".git" ]; then
    echo "Repository exists, updating..."
    git pull
else
    echo "Cloning repository..."
    # Clean the directory if it's not empty and not a git repo
    if [ "$(ls -A .)" ]; then
        echo "Directory not empty and not a git repository. Cleaning..."
        rm -rf ./*
    fi
    git clone https://github.com/jakenelwood/quote-request-fresh.git .
fi

# Create Traefik directories
echo "Setting up Traefik directories..."
mkdir -p docker/traefik/certs docker/traefik/config

# Create or update configuration files
echo "Copying Traefik configuration files..."
cp -f templates/traefik.yml docker/traefik/traefik.yml
cp -f templates/middlewares.yml docker/traefik/config/middlewares.yml
cp -f templates/services.yml docker/traefik/config/services.yml

# Create ACME JSON file with proper permissions
echo "Creating ACME JSON file for Let's Encrypt certificates..."
touch docker/traefik/certs/acme.json
chmod 600 docker/traefik/certs/acme.json

# Update environment variables
echo "Setting up environment variables..."
if [ -f ".env" ]; then
    # Backup existing .env file
    cp .env .env.backup
    echo "Backed up existing .env file to .env.backup"
fi

cat > .env << EOF
# Server configuration
DOMAIN=$DOMAIN
SERVER_IP=$SERVER_IP

# Port configuration
FRONTEND_PORT=3015
BACKEND_PORT=8000

# Security
SECRET_KEY=$(openssl rand -hex 32)
EOF

echo "Environment file created."

# Check Docker and Docker Compose installation
echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Docker not found, installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

echo "Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found, installing..."
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Open firewall ports
echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Deploy with Docker Compose
echo "Deploying with Docker Compose..."
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo "==== Deployment Complete ===="
echo "Traefik dashboard: https://$DOMAIN/dashboard/"
echo "Frontend: https://$DOMAIN"
echo "API: https://$DOMAIN/api"
echo ""
echo "To check logs: docker-compose -f docker-compose.prod.yml logs"
echo "To check Traefik logs: docker logs quote-request-traefik" 