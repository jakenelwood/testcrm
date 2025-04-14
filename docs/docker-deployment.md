# Docker Deployment Guide

This guide provides step-by-step instructions for deploying the Quote Request Generator application using Docker on the Hetzner server.

## Prerequisites

- SSH access to the Hetzner server
- Git repository access
- Docker and Docker Compose installed on the server (see [Server Setup Guide](server-setup-guide.md))

## Deployment Steps

### 1. SSH into the Hetzner Server

```bash
ssh -i ~/.ssh/id_ed25519 root@65.21.174.252
```

### 2. Clone the Repository

```bash
# Navigate to your preferred directory
cd /root

# Clone the repository
git clone https://github.com/jakenelwood/quote-request-fresh.git

# Navigate to the repository
cd quote-request-generator72
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env-example .env

# Edit the environment file with your production values
nano .env
```

Make sure to update:
- `SECRET_KEY` with a secure random string
- Any other environment-specific settings

### 4. Build and Start the Containers

```bash
# Build and start the containers in detached mode
docker-compose up -d --build
```

### 5. Create an Admin User

```bash
# Execute the create_admin.py script inside the backend container
docker exec -it quote-request-backend python create_admin.py
```

Follow the prompts to create an admin user.

### 6. Verify the Deployment

Check that all containers are running:

```bash
docker-compose ps
```

Verify the backend is accessible:

```bash
curl http://localhost:8000/api/health-check
```

The API should return a JSON response with a `status` field set to `ok`.

### 7. Access the Application

The application should now be accessible at:

- Frontend: http://65.21.174.252:3000
- Backend API: http://65.21.174.252:8000
- LanceDB: http://65.21.174.252:8001

## Managing the Deployment

### Viewing Logs

```bash
# View logs from all services
docker-compose logs

# View logs from a specific service
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f frontend
```

### Stopping and Starting Services

```bash
# Stop all services
docker-compose stop

# Start all services
docker-compose start

# Restart a specific service
docker-compose restart backend
```

### Updating the Application

When you make changes to the code:

```bash
# Pull the latest changes
git pull

# Rebuild and restart the containers
docker-compose up -d --build
```

### Cleaning Up

If you need to completely remove the containers and volumes:

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v
```

## Troubleshooting

### Container Won't Start

1. Check the logs:
   ```bash
   docker-compose logs [service_name]
   ```

2. Verify environment variables:
   ```bash
   docker-compose config
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
   docker-compose logs lancedb
   ```

3. Verify the container can be accessed from the backend:
   ```bash
   docker exec -it quote-request-backend curl http://lancedb:8000
   ```

### Frontend Can't Connect to Backend

1. Verify the backend API is running:
   ```bash
   curl http://localhost:8000/api/health-check
   ```

2. Check the CORS settings in the backend configuration

3. Verify the API URL in the frontend environment variables:
   ```bash
   docker exec -it quote-request-frontend env | grep API
   ```

## Next Steps

After successful deployment:

1. Configure Traefik for proper routing and SSL (see [Server Setup Guide](server-setup-guide.md))
2. Set up regular database backups
3. Configure monitoring and alerts for the containers 