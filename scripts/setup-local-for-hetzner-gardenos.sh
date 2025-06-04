#!/bin/bash

# 🔧 Setup Local Environment for Hetzner GardenOS Development Testing
# Configures localhost:3000 to connect to Hetzner GardenOS development environment

set -e  # Exit on any error

echo "🔧 Setting up local environment for Hetzner GardenOS development testing"
echo "======================================================================="
echo ""

# Configuration
HETZNER_HOST="5.161.110.205"
DEPLOY_DIR="/opt/gardenos-dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run commands on Hetzner server
run_remote() {
    ssh -o StrictHostKeyChecking=no root@$HETZNER_HOST "$1"
}

# Step 1: Check if GardenOS development is running on Hetzner
print_status "Step 1: Checking GardenOS development deployment on Hetzner..."
echo "=============================================================="

if ! run_remote "test -d $DEPLOY_DIR"; then
    print_error "GardenOS development not found on Hetzner server at $DEPLOY_DIR"
    print_warning "Please run ./scripts/deploy-gardenos-dev-to-hetzner.sh first"
    exit 1
fi

print_success "GardenOS development deployment found on Hetzner"

# Step 2: Get development passwords from server
print_status "Step 2: Retrieving development configuration..."
echo "=============================================="

print_status "Getting database password from server..."
POSTGRES_PASSWORD=$(run_remote "cd $DEPLOY_DIR && grep '^POSTGRES_PASSWORD=' .env.development | cut -d'=' -f2")

if [ -z "$POSTGRES_PASSWORD" ]; then
    print_error "Could not retrieve PostgreSQL password from server"
    exit 1
fi

print_success "Retrieved development configuration"

# Step 3: Test connectivity to Hetzner services
print_status "Step 3: Testing connectivity to Hetzner services..."
echo "=================================================="

print_status "Testing HAProxy primary connection..."
if timeout 5 bash -c "</dev/tcp/$HETZNER_HOST/5000"; then
    print_success "HAProxy primary (port 5000) is accessible"
else
    print_error "Cannot connect to HAProxy primary on port 5000"
    exit 1
fi

print_status "Testing HAProxy replica connection..."
if timeout 5 bash -c "</dev/tcp/$HETZNER_HOST/5001"; then
    print_success "HAProxy replica (port 5001) is accessible"
else
    print_warning "Cannot connect to HAProxy replica on port 5001 (may be normal)"
fi

print_status "Testing HAProxy stats..."
if timeout 5 bash -c "</dev/tcp/$HETZNER_HOST/7000"; then
    print_success "HAProxy stats (port 7000) is accessible"
else
    print_warning "Cannot connect to HAProxy stats on port 7000"
fi

print_status "Testing Supabase REST API..."
if timeout 5 bash -c "</dev/tcp/$HETZNER_HOST/3000"; then
    print_success "Supabase REST API (port 3000) is accessible"
else
    print_error "Cannot connect to Supabase REST API on port 3000"
    exit 1
fi

print_status "Testing Supabase Auth..."
if timeout 5 bash -c "</dev/tcp/$HETZNER_HOST/9999"; then
    print_success "Supabase Auth (port 9999) is accessible"
else
    print_error "Cannot connect to Supabase Auth on port 9999"
    exit 1
fi

print_success "All required services are accessible"

# Step 4: Create updated local environment file
print_status "Step 4: Creating updated local environment configuration..."
echo "=========================================================="

print_status "Backing up current .env.local..."
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Current .env.local backed up"
fi

print_status "Creating new .env.local with Hetzner GardenOS configuration..."

# Update the template with actual password
sed "s/POSTGRES_PASSWORD_FROM_SERVER/$POSTGRES_PASSWORD/g" .env.local.hetzner-gardenos > .env.local.temp

# Update all PASSWORD placeholders
sed "s/PASSWORD/$POSTGRES_PASSWORD/g" .env.local.temp > .env.local

# Clean up temp file
rm .env.local.temp

print_success "Local environment configuration updated"

# Step 5: Test database connectivity
print_status "Step 5: Testing database connectivity..."
echo "======================================="

print_status "Testing PostgreSQL connection via HAProxy..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    print_warning "psql not found. Installing PostgreSQL client..."

    # Detect OS and install psql
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y postgresql-client
        elif command -v yum &> /dev/null; then
            sudo yum install -y postgresql
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install postgresql
        fi
    fi
fi

if command -v psql &> /dev/null; then
    print_status "Testing database connection via HAProxy..."
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h $HETZNER_HOST -p 5000 -U postgres -d crm -c "SELECT version();" > /dev/null 2>&1; then
        print_success "HAProxy primary database connection successful"
    else
        print_warning "HAProxy primary connection failed (may need to wait for services to fully start)"
    fi

    print_status "Testing replica connection via HAProxy..."
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h $HETZNER_HOST -p 5001 -U postgres -d crm -c "SELECT version();" > /dev/null 2>&1; then
        print_success "HAProxy replica database connection successful"
    else
        print_warning "HAProxy replica connection failed (may be normal if no replicas ready)"
    fi
else
    print_warning "psql not available for testing database connection"
fi

# Step 6: Update package.json scripts (if needed)
print_status "Step 6: Checking package.json scripts..."
echo "======================================="

if [ -f "package.json" ]; then
    if grep -q "hetzner" package.json; then
        print_success "Hetzner scripts already present in package.json"
    else
        print_status "Adding Hetzner testing scripts to package.json..."
        # This would require jq or manual editing - for now just inform the user
        print_warning "Consider adding these scripts to package.json:"
        echo '  "dev:hetzner": "npm run dev",'
        echo '  "test:hetzner": "npm run test",'
        echo '  "build:hetzner": "npm run build"'
    fi
fi

# Step 7: Display connection summary
print_status "Step 7: Setup Summary"
echo "===================="

echo ""
print_success "🎉 Local environment configured for Hetzner GardenOS testing!"
echo ""
echo "📋 Connection Details:"
echo "  • Database (Primary):    $HETZNER_HOST:5000"
echo "  • Database (Replicas):   $HETZNER_HOST:5001"
echo "  • Supabase REST API:     http://$HETZNER_HOST:3000"
echo "  • Supabase Auth:         http://$HETZNER_HOST:9999"
echo "  • Supabase Studio:       http://$HETZNER_HOST:3001"
echo "  • HAProxy Stats:         http://$HETZNER_HOST:7000/stats"
echo ""
echo "🔧 Architecture:"
echo "  • Patroni: 3-node PostgreSQL cluster"
echo "  • HAProxy: Load balancer with automatic failover"
echo "  • Supabase: Auth + REST + Realtime + Storage"
echo "  • Phase 1: Minus analytics (per recommendations)"
echo ""
echo "🚀 Next Steps:"
echo "  1. Start your local development server:"
echo "     npm run dev"
echo ""
echo "  2. Open http://localhost:3000 in your browser"
echo ""
echo "  3. Test the application functionality:"
echo "     • Database operations"
echo "     • Authentication"
echo "     • Real-time features"
echo ""
echo "  4. Monitor the cluster:"
echo "     • HAProxy Stats: http://$HETZNER_HOST:7000/stats"
echo "     • Supabase Studio: http://$HETZNER_HOST:3001"
echo ""
echo "📁 Files:"
echo "  • Local config: .env.local"
echo "  • Backup: .env.local.backup.*"
echo "  • Template: .env.local.hetzner-gardenos"
echo ""

print_warning "Your localhost:3000 is now configured to use the production Hetzner GardenOS cluster!"
print_warning "Be careful with data modifications as this connects to the production database."

echo ""
print_success "Setup completed successfully! 🚀"

# Step 8: Optional - start development server
echo ""
read -p "Would you like to start the development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting development server..."
    npm run dev
fi
