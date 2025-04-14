# Docker Deployment Guide with Traefik

This guide provides step-by-step instructions for deploying the Quote Request Generator application using Docker and Traefik on the Hetzner server.

## Prerequisites

- SSH access to the Hetzner server
- Git repository access
- Docker and Docker Compose installed on the server

## Deployment Steps

### 1. SSH into the Hetzner Server

```bash
ssh -i ~/.ssh/id_ed25519 root@65.21.174.252
```

### 2. Automated Deployment with Script

The easiest way to deploy is using the automated script:

```bash
# Clone the repository if not already done
git clone https://github.com/jakenelwood/quote-request-fresh.git
cd quote-request-fresh

# Run the deployment script
./deploy-traefik.sh
```

The script will:
- Set up the necessary directories
- Configure Traefik for routing and SSL
- Create environment variables
- Deploy all services with Docker Compose

### 3. Manual Deployment

If you prefer to deploy manually, follow these steps:

#### A. Clone the Repository

```bash
# Navigate to your preferred directory
cd /root

# Clone the repository
git clone https://github.com/jakenelwood/quote-request-fresh.git

# Navigate to the repository
cd quote-request-fresh
```

#### B. Set Up Traefik

```bash
# Create Traefik directories
mkdir -p docker/traefik/certs docker/traefik/config

# Copy configuration files
cp -f templates/traefik.yml docker/traefik/traefik.yml
cp -f templates/middlewares.yml docker/traefik/config/middlewares.yml
cp -f templates/services.yml docker/traefik/config/services.yml

# Create ACME JSON file with proper permissions
touch docker/traefik/certs/acme.json
chmod 600 docker/traefik/certs/acme.json
```

#### C. Set Up Environment Variables

```bash
# Set up environment variables
cat > .env << EOF
# Server configuration
DOMAIN=65.21.174.252
SERVER_IP=65.21.174.252

# Port configuration
FRONTEND_PORT=3015
BACKEND_PORT=8000

# Security
SECRET_KEY=$(openssl rand -hex 32)
EOF
```

#### D. Deploy with Docker Compose

```bash
# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Create an Admin User

```bash
# Execute the create_admin.py script inside the backend container
docker exec -it quote-request-backend python create_admin.py
```

Follow the prompts to create an admin user.

### 5. Verify the Deployment

Check that all containers are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Verify the backend is accessible:

```bash
curl https://65.21.174.252/api/health-check
```

The API should return a JSON response with a `status` field set to `ok`.

### 6. Access the Application

The application should now be accessible at:

- Frontend: https://65.21.174.252
- Backend API: https://65.21.174.252/api
- Traefik Dashboard: https://65.21.174.252/dashboard/ (requires authentication)

## Managing the Deployment

### Viewing Logs

```bash
# View logs from all services
docker-compose -f docker-compose.prod.yml logs

# View logs from a specific service
docker-compose -f docker-compose.prod.yml logs backend

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f frontend

# View Traefik logs
docker logs quote-request-traefik
```

### Stopping and Starting Services

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml stop

# Start all services
docker-compose -f docker-compose.prod.yml start

# Restart a specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Updating the Application

When you make changes to the code:

```bash
# Pull the latest changes
git pull

# Rebuild and restart the containers
docker-compose -f docker-compose.prod.yml up -d --build
```

### Cleaning Up

If you need to completely remove the containers and volumes:

```bash
# Stop and remove containers, networks, and volumes
docker-compose -f docker-compose.prod.yml down -v
```

## Troubleshooting

### Traefik Certificate Issues

1. Check Traefik logs for certificate errors:
   ```bash
   docker logs quote-request-traefik | grep -i "certificate\|acme\|error"
   ```

2. Verify the `acme.json` file has correct permissions:
   ```bash
   ls -la docker/traefik/certs/acme.json
   ```
   It should show permissions as `-rw-------` (600).

3. Check if ports 80 and 443 are open:
   ```bash
   ufw status | grep '80\|443'
   ```

### Container Won't Start

1. Check the logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs [service_name]
   ```

2. Verify environment variables:
   ```bash
   docker-compose -f docker-compose.prod.yml config
   ```

3. Check if ports are already in use:
   ```bash
   netstat -tulpn | grep [port]
   ```

### LanceDB Connection Issues

1. Check if the LanceDB container is running:
   ```bash
   docker ps | grep lancedb
   ```

2. Check the LanceDB logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs lancedb
   ```

3. Verify the container can be accessed from the backend:
   ```bash
   docker exec -it quote-request-backend curl http://lancedb:9520
   ```

### Frontend Can't Connect to Backend

1. Verify the backend API is running:
   ```bash
   curl https://65.21.174.252/api/health-check
   ```

2. Check the CORS settings in the backend configuration

3. Verify the API URL in the frontend environment variables:
   ```bash
   docker exec -it quote-request-frontend env | grep API
   ```

## Next Steps

After successful deployment:

1. Configure monitoring and alerts for the containers
2. Set up regular database backups
3. Implement a CI/CD pipeline for automated deployments
4. Consider using a proper domain name instead of IP address 