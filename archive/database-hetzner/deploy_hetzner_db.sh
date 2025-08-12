#!/bin/bash

# 🚀 Deploy GardenOS Database to Hetzner
# This script sets up PostgreSQL and deploys the optimized schema

set -e  # Exit on any error

echo "🌱 GardenOS Database Deployment to Hetzner"
echo "=========================================="

# Configuration
DB_NAME="crm"
DB_USER="crm_user"
DB_PASSWORD="$(openssl rand -base64 32)"
HETZNER_HOST="5.161.110.205"
SSH_KEY="~/.ssh/id_ed25519"

echo "📋 Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $HETZNER_HOST"
echo ""

# Function to run commands on Hetzner server
run_remote() {
    ssh -i $SSH_KEY root@$HETZNER_HOST "$1"
}

# Function to run SQL commands
run_sql() {
    run_remote "sudo -u postgres psql -d $DB_NAME -c \"$1\""
}

echo "🔧 Step 1: Installing PostgreSQL and Extensions"
# Add PostgreSQL official repository
run_remote "apt update && apt install -y wget ca-certificates"
run_remote "wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -"
run_remote "echo 'deb http://apt.postgresql.org/pub/repos/apt/ noble-pgdg main' > /etc/apt/sources.list.d/pgdg.list"
run_remote "apt update"

# Install PostgreSQL and extensions
run_remote "apt install -y postgresql-15 postgresql-15-pgvector postgresql-contrib"
run_remote "systemctl enable postgresql && systemctl start postgresql"

echo "✅ PostgreSQL installed and started"

echo "🔧 Step 2: Creating Database and User"
run_remote "sudo -u postgres createdb $DB_NAME || echo 'Database already exists'"
run_remote "sudo -u postgres psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';\" || echo 'User already exists'"
run_remote "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""
run_remote "sudo -u postgres psql -d $DB_NAME -c \"GRANT ALL ON SCHEMA public TO $DB_USER;\""

echo "✅ Database and user created"

echo "🔧 Step 3: Enabling Extensions"
run_remote "sudo -u postgres psql -d $DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";'"
run_remote "sudo -u postgres psql -d $DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS \"vector\";'"
run_remote "sudo -u postgres psql -d $DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";'"

echo "✅ Extensions enabled"

echo "🔧 Step 4: Deploying Schema"
# Copy schema file to server and execute
scp -i $SSH_KEY hetzner_optimized_schema.sql root@$HETZNER_HOST:/tmp/
run_remote "sudo -u postgres psql -d $DB_NAME -f /tmp/hetzner_optimized_schema.sql"
run_remote "rm /tmp/hetzner_optimized_schema.sql"

echo "✅ Schema deployed successfully"

echo "🔧 Step 5: Configuring PostgreSQL"
# Basic performance tuning
run_remote "sudo -u postgres psql -c \"ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,vector';\""
run_remote "sudo -u postgres psql -c \"ALTER SYSTEM SET max_connections = 100;\""
run_remote "sudo -u postgres psql -c \"ALTER SYSTEM SET shared_buffers = '256MB';\""
run_remote "sudo -u postgres psql -c \"ALTER SYSTEM SET effective_cache_size = '1GB';\""
run_remote "sudo -u postgres psql -c \"SELECT pg_reload_conf();\""

echo "✅ PostgreSQL configured"

echo "🔧 Step 6: Setting up Backups"
# Create backup directory and script
run_remote "mkdir -p /var/backups/postgresql"
run_remote "cat > /usr/local/bin/backup_crm.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=\"/var/backups/postgresql\"
DATE=\$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump $DB_NAME | gzip > \$BACKUP_DIR/crm_backup_\$DATE.sql.gz
# Keep only last 7 days of backups
find \$BACKUP_DIR -name \"crm_backup_*.sql.gz\" -mtime +7 -delete
EOF"
run_remote "chmod +x /usr/local/bin/backup_crm.sh"

# Add to crontab for daily backups at 2 AM
run_remote "echo '0 2 * * * /usr/local/bin/backup_crm.sh' | crontab -"

echo "✅ Backup system configured"

echo "🔧 Step 7: Firewall Configuration"
run_remote "ufw allow 5432/tcp comment 'PostgreSQL'"
run_remote "ufw --force enable"

echo "✅ Firewall configured"

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📊 Database Information:"
echo "  Host: $HETZNER_HOST"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "🔗 Connection String:"
echo "  postgresql://$DB_USER:$DB_PASSWORD@$HETZNER_HOST:5432/$DB_NAME"
echo ""
echo "📝 Next Steps:"
echo "  1. Update your .env.local file with the new connection string"
echo "  2. Test the connection from your application"
echo "  3. Deploy your application with the new database"
echo ""
echo "💾 Backups:"
echo "  - Automated daily backups at 2 AM"
echo "  - Stored in /var/backups/postgresql/"
echo "  - Retained for 7 days"
echo ""

# Save connection details to file
cat > hetzner_db_connection.env << EOF
# Hetzner Database Connection Details
# Generated on $(date)

DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$HETZNER_HOST:5432/$DB_NAME
DB_HOST=$HETZNER_HOST
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF

echo "💾 Connection details saved to: hetzner_db_connection.env"
echo ""
echo "⚠️  IMPORTANT: Save the password securely and update your application configuration!"
