#!/bin/bash

# Script to initialize Traefik configuration

# Ensure we're in the right directory (project root)
cd "$(dirname "$0")/../.." || exit 1

echo "Creating Traefik configuration directories..."
mkdir -p docker/traefik/certs docker/traefik/config

# Create ACME JSON file with proper permissions
echo "Creating ACME JSON file for Let's Encrypt certificates..."
touch docker/traefik/certs/acme.json
chmod 600 docker/traefik/certs/acme.json

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOF
# Traefik Configuration
DOMAIN=65.21.174.252
SECRET_KEY=change_this_to_a_secure_random_string_in_production
FRONTEND_PORT=3015
BACKEND_PORT=8000
EOF

  echo ".env file created. Please update it with your actual values."
else
  echo ".env file already exists. Make sure it contains DOMAIN and SECRET_KEY."
fi

# Ensure execute permissions for this script
chmod +x docker/traefik/init-traefik.sh

echo "Traefik configuration initialized successfully."
echo "You can now run: docker-compose -f docker-compose.prod.yml up -d" 