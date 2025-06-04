# 🚀 Supabase Setup Guide

This guide covers setting up Supabase on a Hetzner server for the CRM system, including troubleshooting common issues.

## Overview

Supabase provides real-time features, authentication, and API layer for the CRM system. This guide covers:
- Setting up Supabase Docker containers on Hetzner server
- Configuring PostgreSQL for Supabase compatibility
- Troubleshooting common connection and configuration issues

## Prerequisites

- Hetzner server with Ubuntu 24.04
- PostgreSQL 16 installed and running
- Docker and Docker Compose installed
- Root access to the server

## Quick Setup

### Automated Setup Script

The fastest way to set up Supabase is using our automated script:

```bash
# Copy the setup script to your Hetzner server
scp scripts/setup-supabase-on-hetzner.sh root@5.161.110.205:/tmp/

# SSH to the server and run the script
ssh root@5.161.110.205
chmod +x /tmp/setup-supabase-on-hetzner.sh
/tmp/setup-supabase-on-hetzner.sh
```

> **Note**: The setup script is located at `scripts/setup-supabase-on-hetzner.sh` in the project root.

## Manual Setup

If you prefer to set up manually or need to troubleshoot issues:

### Step 1: Configure PostgreSQL for Supabase

Supabase requires logical replication to be enabled:

```bash
# Enable logical replication
sudo -u postgres psql -c "ALTER SYSTEM SET wal_level = logical;"
sudo -u postgres psql -c "ALTER SYSTEM SET max_replication_slots = 10;"
sudo -u postgres psql -c "ALTER SYSTEM SET max_wal_senders = 10;"

# Restart PostgreSQL (required for wal_level change)
sudo systemctl restart postgresql@16-main

# Set postgres user password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'CRM_Secure_Password_2025';"
```

### Step 2: Configure Supabase Environment

```bash
cd /opt/supabase/supabase/docker

# Update .env file for Docker bridge networking
sed -i 's/POSTGRES_HOST=localhost/POSTGRES_HOST=172.17.0.1/' .env
sed -i 's/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=CRM_Secure_Password_2025/' .env
```

### Step 3: Fix Docker Compose Syntax Issues

Common syntax errors in docker-compose.yml:

```bash
# Create backup
cp docker-compose.yml docker-compose.yml.backup

# The depends_on sections may have environment variables instead of service names
# These need to be manually reviewed and fixed
```

### Step 4: Test Database Connection

```bash
# Test connection from Docker bridge IP
PGPASSWORD='CRM_Secure_Password_2025' psql -h 172.17.0.1 -U postgres -d crm -c "SELECT version();"
```

### Step 5: Start Supabase Services

```bash
# Stop any existing containers
docker-compose down

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

## Configuration Details

### Database Connection

- **Host**: `172.17.0.1` (Docker bridge to host PostgreSQL)
- **Port**: `5432`
- **Database**: `crm`
- **User**: `postgres`
- **Password**: `CRM_Secure_Password_2025`

### PostgreSQL Requirements

- **wal_level**: `logical` (required for logical replication)
- **max_replication_slots**: `10` (for Supabase realtime features)
- **max_wal_senders**: `10` (for replication)

### Service Ports

- **Supabase Studio**: `3000`
- **API Gateway (Kong)**: `8000`
- **Auth Service**: `9999`
- **Realtime**: `4000`
- **Analytics**: `4000` (if enabled)

## Troubleshooting

### Common Issues and Solutions

#### 1. "Connection Refused" Errors

**Problem**: Analytics service shows `tcp connect (localhost:5432): connection refused`

**Solution**:
- Containers can't access `localhost` - they need to use Docker bridge IP
- Update `POSTGRES_HOST=172.17.0.1` in .env file
- Restart containers: `docker-compose down && docker-compose up -d`

#### 2. Docker Compose Syntax Errors

**Problem**: `depends_on contains an invalid type, it should be an array, or an object`

**Solution**:
- Environment variables got mixed into `depends_on` sections
- Review docker-compose.yml and fix `depends_on` entries
- Use `docker-compose config` to validate syntax

#### 3. PostgreSQL Authentication Issues

**Problem**: Password authentication failed

**Solution**:
```bash
# Set the correct password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'CRM_Secure_Password_2025';"

# Test connection
PGPASSWORD='CRM_Secure_Password_2025' psql -h 172.17.0.1 -U postgres -d crm -c "SELECT 1;"
```

#### 4. Logical Replication Not Enabled

**Problem**: Supabase services fail because logical replication is disabled

**Solution**:
```bash
# Check current setting
sudo -u postgres psql -c "SHOW wal_level;"

# If not 'logical', enable it
sudo -u postgres psql -c "ALTER SYSTEM SET wal_level = logical;"
sudo systemctl restart postgresql@16-main
```

#### 5. Services Stuck in "Starting" State

**Problem**: Containers show as "starting" but never become healthy

**Solution**:
```bash
# Check logs for specific service
docker-compose logs <service_name>

# Common issues:
# - Database connection problems
# - Missing environment variables
# - Port conflicts
```

### Diagnostic Commands

```bash
# Check PostgreSQL status
sudo systemctl status postgresql@16-main

# Check if PostgreSQL is listening
netstat -tlnp | grep 5432

# Check Docker bridge network
docker network inspect bridge | grep Gateway

# Validate docker-compose syntax
docker-compose config

# Check container logs
docker-compose logs --tail=20

# Check service health
docker-compose ps
```

## Expected Results

After successful setup:

1. **PostgreSQL** configured with logical replication
2. **All Supabase services** running and healthy
3. **API endpoints** accessible:
   - Studio: `http://server-ip:3000`
   - API: `http://server-ip:8000`
   - Auth: `http://server-ip:9999`

## Integration with CRM Application

Once Supabase is running, update your CRM application's environment:

```bash
# In your .env.local file
NEXT_PUBLIC_SUPABASE_URL=http://your-server-ip:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Security Considerations

- Change default passwords
- Configure firewall rules
- Use SSL/TLS in production
- Restrict access to management ports
- Regular security updates

## Support

For additional help:
- Check [Supabase Documentation](https://supabase.com/docs)
- Review Docker Compose logs
- Consult PostgreSQL documentation for replication setup
