# 🚀 Hetzner Supabase Setup Instructions

## Problem Summary
We're trying to run Supabase Docker containers on the Hetzner server, but there are several issues:

1. **PostgreSQL Configuration**: Needs logical replication enabled
2. **Docker Compose Syntax**: Invalid `depends_on` sections
3. **Database Connection**: Containers can't reach host PostgreSQL
4. **Password Mismatch**: Need to ensure correct postgres password

## Solution

### Step 1: Copy the setup script to Hetzner server

```bash
# From your local machine, copy the setup script
scp scripts/setup-supabase-on-hetzner.sh root@5.161.110.205:/tmp/
```

> **Note**: For comprehensive setup documentation, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### Step 2: Run the setup script on Hetzner server

```bash
# SSH to Hetzner server
ssh root@5.161.110.205

# Make the script executable and run it
chmod +x /tmp/setup-supabase-on-hetzner.sh
/tmp/setup-supabase-on-hetzner.sh
```

### Step 3: Manual fixes if needed

If the automated script doesn't work completely, here are the manual steps:

#### Fix PostgreSQL Configuration:
```bash
# Enable logical replication
sudo -u postgres psql -c "ALTER SYSTEM SET wal_level = logical;"
sudo -u postgres psql -c "ALTER SYSTEM SET max_replication_slots = 10;"
sudo -u postgres psql -c "ALTER SYSTEM SET max_wal_senders = 10;"

# Restart PostgreSQL
sudo systemctl restart postgresql@16-main

# Set postgres password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'CRM_Secure_Password_2025';"
```

#### Fix Docker Compose:
```bash
cd /opt/supabase/supabase/docker

# Backup the file
cp docker-compose.yml docker-compose.yml.backup

# Fix the .env file
sed -i 's/POSTGRES_HOST=localhost/POSTGRES_HOST=172.17.0.1/' .env
sed -i 's/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=CRM_Secure_Password_2025/' .env
```

#### Test Database Connection:
```bash
# Test connection from Docker bridge IP
PGPASSWORD='CRM_Secure_Password_2025' psql -h 172.17.0.1 -U postgres -d crm -c "SELECT version();"
```

#### Start Supabase:
```bash
cd /opt/supabase/supabase/docker

# Stop any running containers
docker-compose down

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs --tail=20
```

## Expected Results

After successful setup:

1. **PostgreSQL** should be configured with logical replication
2. **Docker containers** should be able to connect to PostgreSQL
3. **Supabase services** should start successfully
4. **API endpoints** should be accessible

## Troubleshooting

### If containers still can't connect to database:
- Check if PostgreSQL is listening on all interfaces: `netstat -tlnp | grep 5432`
- Verify Docker bridge IP: `docker network inspect bridge | grep Gateway`
- Test connection manually: `docker exec -it <container> sh` then try connecting

### If Docker Compose syntax errors persist:
- Review the docker-compose.yml file manually
- Look for environment variables in `depends_on` sections
- Use `docker-compose config` to validate syntax

### If services fail to start:
- Check individual service logs: `docker-compose logs <service_name>`
- Verify all required environment variables are set
- Check if ports are already in use: `netstat -tlnp | grep <port>`

## Key Configuration Details

- **Database Host**: `172.17.0.1` (Docker bridge to host)
- **Database Port**: `5432`
- **Database Name**: `crm`
- **Database User**: `postgres`
- **Database Password**: `CRM_Secure_Password_2025`
- **PostgreSQL Config**: `wal_level=logical`, `max_replication_slots=10`, `max_wal_senders=10`
