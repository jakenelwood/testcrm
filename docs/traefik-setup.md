# Traefik Setup Guide for Quote Request Generator

This guide explains how to set up and configure Traefik as a reverse proxy with automatic SSL certificate provisioning for the Quote Request Generator application.

## Overview

Traefik is used as a reverse proxy to route traffic to different services based on the URL path or domain. It also handles SSL/TLS termination with automatic certificate provisioning via Let's Encrypt.

## Directory Structure

```
docker/
└── traefik/
    ├── traefik.yml           # Static configuration for Traefik
    ├── init-traefik.sh       # Initialization script for Traefik
    ├── certs/                # Directory for certificates
    │   └── acme.json         # Let's Encrypt certificate storage
    └── config/               # Dynamic configuration for Traefik
        ├── middlewares.yml   # Middleware configurations
        └── services.yml      # Router and service definitions
```

## Setup Instructions

### 1. Initialize Traefik Configuration

Run the initialization script to set up the necessary directories and files:

```bash
./docker/traefik/init-traefik.sh
```

This script will:
- Create the required directories
- Initialize the certificate storage file with correct permissions
- Create a default `.env` file if it doesn't exist

### 2. Configure Environment Variables

Edit the `.env` file in the project root to set your domain and secret key:

```
DOMAIN=65.21.174.252      # Change to your domain name
SECRET_KEY=your_secure_random_string
FRONTEND_PORT=3015
BACKEND_PORT=8000
```

### 3. Customize Traefik Configuration (Optional)

You can customize the Traefik configuration by editing these files:

- `docker/traefik/traefik.yml`: Static Traefik configuration
- `docker/traefik/config/middlewares.yml`: Security headers and middleware settings
- `docker/traefik/config/services.yml`: Router rules and service definitions

### 4. Deploy with Docker Compose

Deploy the application with Traefik using the production Docker Compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Configuration Details

### Static Configuration (traefik.yml)

The static configuration in `traefik.yml` defines:

- Entry points for HTTP (port 80) and HTTPS (port 443)
- Automatic HTTP to HTTPS redirection
- Let's Encrypt integration for automatic SSL certificates
- Provider configuration for Docker and file-based dynamic configuration
- TLS settings for security

### Dynamic Configuration

Dynamic configuration is split into two files:

1. **middlewares.yml**:
   - Security headers for all requests
   - Compression middleware for the frontend
   - Rate limiting configuration to prevent abuse
   - Chained middlewares for different service types

2. **services.yml**:
   - Router rules for the API backend
   - Router rules for the frontend application
   - Service definitions with load balancing settings
   - Health check configuration for services

## SSL Certificates

Traefik will automatically obtain SSL certificates from Let's Encrypt when:

1. The server is publicly accessible on ports 80 and 443
2. The domain name in the configuration resolves to the server's IP address
3. The `acme.json` file has proper permissions (600)

For local development or testing, you can set `insecureSkipVerify: true` in the TLS configuration, but this should never be used in production.

## Troubleshooting

### Check Traefik Logs

```bash
docker logs quote-request-traefik
```

### Verify Certificate Acquisition

Check if certificates were successfully acquired:

```bash
docker exec quote-request-traefik cat /certs/acme.json | grep -o "\"status\":\"valid\""
```

### Test HTTPS Connections

```bash
curl -v https://your-domain.com/api/health-check
```

### Common Issues

1. **Certificate Acquisition Failure**: Make sure ports 80 and 443 are open to the internet and your domain points to the server.

2. **Routing Issues**: Verify that the host rules in Traefik configuration match your domain name.

3. **Backend Not Reachable**: Check if the backend service is running and the health check is passing.

## Security Considerations

The current configuration includes:

- Strong TLS settings (TLS 1.2+, secure cipher suites)
- Security HTTP headers (HSTS, XSS protection, content type sniffing prevention)
- Rate limiting to prevent abuse
- Basic authentication for Traefik dashboard access

For production, consider:

1. Changing the default dashboard password
2. Using a more restrictive Content Security Policy
3. Implementing IP-based access controls for sensitive endpoints
4. Regularly updating Traefik to the latest version 