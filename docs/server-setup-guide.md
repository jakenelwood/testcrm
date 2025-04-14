# Server Setup Guide for Quote Request Generator

This guide provides step-by-step instructions for setting up the server environment for the Quote Request Generator application.

## Accessing the Hetzner Server

SSH into the server:
```bash
ssh -i ~/.ssh/id_ed25519 root@65.21.174.252
```

## Setting Up Docker

Docker is used to containerize the application components:

```bash
# Update the package list
apt update

# Install Docker and Docker Compose
apt install -y docker.io docker-compose

# Start Docker and enable it to run on boot
systemctl enable docker
systemctl start docker

# Verify Docker is installed
docker --version
docker-compose --version
```

## Setting Up LanceDB

LanceDB is used for data storage with future AI integration capabilities:

```bash
# Create a directory for LanceDB data
mkdir -p /root/api-tests/data/lancedb

# Create a docker-compose.yml for LanceDB
cat > /root/api-tests/docker-compose.yml << 'EOF'
version: '3'
services:
  lancedb:
    image: lancedb/lancedb:latest
    ports:
      - "8001:8000"  # Using port 8001 to avoid conflict with Node.js API
    volumes:
      - ./data/lancedb:/data
    environment:
      - LANCEDB_PORT=8000
EOF

# Start LanceDB
cd /root/api-tests
docker-compose up -d

# Verify LanceDB is running
docker ps
```

## Setting Up Traefik for Routing and SSL

Traefik is used for routing, load balancing, and SSL termination:

```bash
# Create Traefik configuration directory
mkdir -p /root/traefik

# Create Traefik docker-compose.yml
cat > /root/traefik/docker-compose.yml << 'EOF'
version: '3'

services:
  traefik:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik.toml:/etc/traefik/traefik.toml
      - ./acme.json:/acme.json
    restart: always
    networks:
      - web

networks:
  web:
    external: true
EOF

# Create Traefik configuration file
cat > /root/traefik/traefik.toml << 'EOF'
[entryPoints]
  [entryPoints.web]
    address = ":80"
    [entryPoints.web.http.redirections.entryPoint]
      to = "websecure"
      scheme = "https"
  [entryPoints.websecure]
    address = ":443"

[api]
  dashboard = true

[providers.docker]
  endpoint = "unix:///var/run/docker.sock"
  exposedByDefault = false

[certificatesResolvers.letsencrypt.acme]
  email = "your-email@example.com"  # Replace with your email
  storage = "acme.json"
  [certificatesResolvers.letsencrypt.acme.httpChallenge]
    entryPoint = "web"
EOF

# Create acme.json for SSL certificates
touch /root/traefik/acme.json
chmod 600 /root/traefik/acme.json

# Create Docker network
docker network create web

# Start Traefik
cd /root/traefik
docker-compose up -d
```

## Setting Up the Node.js API Service

Configure the Node.js API as a system service for automatic startup:

```bash
# Create a systemd service file
cat > /etc/systemd/system/node-api-service.service << 'EOF'
[Unit]
Description=Node.js API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/api-tests/node-test
ExecStart=/usr/bin/node app.js
Restart=on-failure
Environment=PORT=8000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd, enable and start the service
systemctl daemon-reload
systemctl enable node-api-service
systemctl start node-api-service

# Check if the service is running
systemctl status node-api-service

# Verify the API is accessible
curl http://localhost:8000/api/health-check
```

## Connecting the API to LanceDB

Install and configure LanceDB client in your Node.js API:

```bash
# Navigate to your Node.js project directory
cd /root/api-tests/node-test

# Install LanceDB client
npm install lancedb

# Add LanceDB connection to your app.js
cat >> app.js << 'EOF'

// LanceDB connection
const { connect } = require("lancedb");

// Connect to LanceDB
async function connectToLanceDB() {
  try {
    const db = await connect("http://localhost:8001");
    console.log("Connected to LanceDB successfully");
    return db;
  } catch (error) {
    console.error("Error connecting to LanceDB:", error);
    return null;
  }
}

// Initialize DB connection
let dbConnection;
connectToLanceDB().then(db => {
  dbConnection = db;
});

// Add a route to test LanceDB
app.get('/api/db-status', async (req, res) => {
  if (dbConnection) {
    res.json({ status: 'ok', message: 'Connected to LanceDB' });
  } else {
    res.status(500).json({ status: 'error', message: 'Not connected to LanceDB' });
  }
});
EOF

# Restart the service to apply changes
systemctl restart node-api-service
```

## Setting Up Document Generation

Install and configure document generation libraries:

```bash
# Navigate to your Node.js project directory
cd /root/api-tests/node-test

# Install document generation libraries
npm install docx fs-extra

# Install LibreOffice for PDF conversion
apt install -y libreoffice-writer
```

## Implementation Order Recommendation

Follow this order to implement components:

1. Docker setup - Foundation for containerizing all components
2. Node.js API Service - Core backend functionality
3. LanceDB implementation - Data persistence layer
4. Document generation - Core quote request functionality
5. Traefik routing - Production-ready routing and SSL

## Troubleshooting

For common connection issues, refer to the [Server Connection Troubleshooting Guide](server-connection-troubleshooting.md). 