# Docker Setup Guide for Quote Request Generator

This guide provides instructions for deploying the Quote Request Generator using Docker containers on the Hetzner server.

## Prerequisites

Before starting, ensure you have:

- SSH access to the Hetzner server
- Docker and Docker Compose installed (see [Server Setup Guide](server-setup-guide.md))
- Git repository cloned on the server

## Overview of Docker Components

The Quote Request Generator uses three main Docker containers:

1. **Backend** - Node.js/Python API for document generation and data storage
2. **Frontend** - Next.js application for the user interface
3. **LanceDB** - Vector database for data storage and future AI capabilities

Additional supporting containers:
- **Traefik** - For routing and SSL termination
- **Watchtower** - For automatic container updates

## Docker Compose Configuration

The `docker-compose.yml` file defines the services and their configuration:

```yaml
version: '3.8'

services:
  # Backend service
  backend:
    build: ./backend
    container_name: quote-request-backend
    restart: unless-stopped
    volumes:
      - ./backend:/app
      - documents:/app/documents
      - ./auto-request-form.docx:/app/auto-request-form.docx
      - ./home-quote-request-form.docx:/app/home-quote-request-form.docx
      - ./specialty-quote-request-form.docx:/app/specialty-quote-request-form.docx
    environment:
      - DATABASE_URL=sqlite:///./quoterequest.db
      - SECRET_KEY=${SECRET_KEY:-your_secret_key_here}
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
      - ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80,http://localhost,http://${SERVER_IP:-localhost}:80,http://${SERVER_IP:-localhost}:3000,http://${SERVER_IP:-65.21.174.252}:3000
    ports:
      - "8000:8000"

  # Frontend service using Next.js
  frontend:
    build: ./frontend-next
    container_name: quote-request-frontend
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://${SERVER_IP:-65.21.174.252}:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend

  # LanceDB service
  lancedb:
    image: lancedb/lancedb:latest
    container_name: quote-request-lancedb
    restart: unless-stopped
    volumes:
      - lancedb-data:/data
    ports:
      - "8001:8000"
    environment:
      - LANCEDB_PORT=8000

  # Watchtower for automatic updates
  watchtower:
    image: containrrr/watchtower
    container_name: quote-request-watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 30 --cleanup
    restart: unless-stopped

volumes:
  documents: # Volume for storing generated documents
  lancedb-data: # Volume for LanceDB data
```

## Deployment Steps

### 1. Prepare Environment Variables

Create a `.env` file in the project root with the following variables:

```
SECRET_KEY=your_secure_random_key_here
SERVER_IP=65.21.174.252
```

### 2. Building and Starting the Containers

Run the following commands to build and start the containers:

```bash
# SSH into the server
ssh -i ~/.ssh/id_ed25519 root@65.21.174.252

# Navigate to the project directory
cd quote-request-fresh

# Build and start the containers
docker-compose up -d --build
```

### 3. Verify the Deployment

Check that all containers are running:

```bash
docker-compose ps
```

You should see all services with status "Up".

### 4. Creating an Admin User

Create an admin user for the backend:

```bash
docker exec -it quote-request-backend python create_admin.py
```

### 5. Accessing the Application

- Frontend: http://65.21.174.252:3000
- Backend API: http://65.21.174.252:8000
- LanceDB: http://65.21.174.252:8001

## Container Management

### Viewing Container Logs

```bash
# View logs for a specific service
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f frontend
```

### Stopping and Starting Containers

```bash
# Stop all containers
docker-compose stop

# Start all containers
docker-compose start

# Restart a specific container
docker-compose restart backend
```

### Updating Containers

When you push updates to the repository, you can update the containers:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose up -d --build
```

Alternatively, Watchtower will automatically update containers at the interval specified in the docker-compose.yml file.

## Troubleshooting Docker Issues

### Container Won't Start

1. Check logs for errors:
   ```bash
   docker-compose logs backend
   ```

2. Verify environment variables:
   ```bash
   docker-compose config
   ```

3. Check if ports are already in use:
   ```bash
   netstat -tulpn | grep 8000
   ```

### Connection Issues Between Containers

1. Check that containers are on the same network:
   ```bash
   docker network inspect quote-request-generator_default
   ```

2. Test connectivity from inside a container:
   ```bash
   docker exec -it quote-request-backend curl http://frontend:3000
   ```

### Volume Permissions Issues

If you encounter permission issues with mounted volumes:

```bash
# Fix permissions on the documents volume
docker exec -it quote-request-backend chmod -R 755 /app/documents
```

## Next Steps

After successfully deploying with Docker, follow these next steps:

1. Set up Traefik for routing and SSL (see [Server Setup Guide](server-setup-guide.md))
2. Configure automated backups for the database and document volumes
3. Set up monitoring and alerts for container health 