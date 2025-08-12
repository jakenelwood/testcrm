#!/bin/bash

# 🗂️ Project Structure Cleanup Script
# Organizes and cleans up the project directory structure following DRY principles

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

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

print_cleanup() {
    echo -e "${PURPLE}[CLEANUP]${NC} $1"
}

echo "🗂️ Project Structure Cleanup"
echo "============================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "deployment" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

print_status "Current project root confirmed"
echo ""

# Step 1: Analyze _archive directory
print_cleanup "Step 1: Analyzing _archive directory for cleanup opportunities..."
echo ""

if [ -d "_archive" ]; then
    print_status "Current _archive contents:"
    ls -la _archive/ | head -20
    echo ""
    
    # Identify duplicate deployment directories
    print_cleanup "Identifying duplicate deployment directories..."
    duplicate_dirs=$(ls -la _archive/ | grep -E "(gardenos|deployment)" | awk '{print $9}' | grep -v "^$" || echo "")
    
    if [ -n "$duplicate_dirs" ]; then
        print_warning "Found potential duplicate directories:"
        echo "$duplicate_dirs"
        echo ""
        
        read -p "Would you like to remove these duplicate directories? (y/n): " remove_duplicates
        if [ "$remove_duplicates" = "y" ] || [ "$remove_duplicates" = "Y" ]; then
            for dir in $duplicate_dirs; do
                if [ "$dir" != "." ] && [ "$dir" != ".." ]; then
                    print_cleanup "Removing _archive/$dir..."
                    rm -rf "_archive/$dir"
                fi
            done
            print_success "Duplicate directories removed"
        fi
    else
        print_success "No duplicate deployment directories found"
    fi
else
    print_warning "_archive directory not found"
fi

echo ""

# Step 2: Organize loose configuration files
print_cleanup "Step 2: Organizing loose configuration files..."
echo ""

# List loose config files in root
loose_configs=$(ls -la | grep -E "\.(env|config|json|js|mjs)$" | grep -v package | awk '{print $9}' || echo "")

if [ -n "$loose_configs" ]; then
    print_status "Found loose configuration files:"
    echo "$loose_configs"
    echo ""
    
    # Create config organization structure if needed
    if [ ! -d "config" ]; then
        mkdir -p config
        print_status "Created config/ directory"
    fi
    
    print_warning "Consider organizing these files into appropriate directories"
    print_status "Suggestions:"
    echo "- Move .env.example to config/"
    echo "- Keep package.json, next.config.js, tailwind.config.js in root"
    echo "- Move other config files to config/ if appropriate"
else
    print_success "No loose configuration files found"
fi

echo ""

# Step 3: Verify deployment directory structure
print_cleanup "Step 3: Verifying deployment directory structure..."
echo ""

if [ -d "deployment" ]; then
    print_status "Deployment directory structure:"
    tree deployment/ 2>/dev/null || ls -la deployment/
    echo ""
    
    # Check for required directories
    required_dirs=("haproxy" "patroni" "postgres" "backend" "storage")
    for dir in "${required_dirs[@]}"; do
        if [ -d "deployment/$dir" ]; then
            print_success "✓ deployment/$dir exists"
        else
            print_warning "✗ deployment/$dir missing"
            mkdir -p "deployment/$dir"
            print_status "Created deployment/$dir"
        fi
    done
else
    print_error "Deployment directory not found!"
    exit 1
fi

echo ""

# Step 4: Check scripts directory organization
print_cleanup "Step 4: Checking scripts directory organization..."
echo ""

if [ -d "scripts" ]; then
    print_status "Scripts directory contents:"
    ls -la scripts/ | grep -v "log\.txt"
    echo ""
    
    # Check for script consistency
    script_count=$(ls scripts/*.sh 2>/dev/null | wc -l)
    print_status "Found $script_count shell scripts"
    
    # Check for executable permissions
    non_executable=$(find scripts/ -name "*.sh" ! -executable 2>/dev/null || echo "")
    if [ -n "$non_executable" ]; then
        print_warning "Scripts without executable permissions:"
        echo "$non_executable"
        echo ""
        read -p "Fix executable permissions? (y/n): " fix_perms
        if [ "$fix_perms" = "y" ] || [ "$fix_perms" = "Y" ]; then
            chmod +x scripts/*.sh
            print_success "Fixed executable permissions"
        fi
    else
        print_success "All scripts have correct permissions"
    fi
else
    print_error "Scripts directory not found!"
fi

echo ""

# Step 5: Generate project structure summary
print_cleanup "Step 5: Generating project structure summary..."
echo ""

cat > PROJECT_STRUCTURE.md << 'EOF'
# TwinCiGo CRM Project Structure

## Directory Organization

```
crm/
├── app/                    # Next.js app directory
├── components/             # React components
├── config/                 # Configuration files
├── contexts/               # React contexts
├── database/               # Database schemas and migrations
├── deployment/             # Docker deployment files
│   ├── backend/           # FastAPI backend
│   ├── haproxy/           # Load balancer config
│   ├── patroni/           # PostgreSQL HA config
│   ├── postgres/          # Database initialization
│   └── storage/           # File storage
├── docs/                   # Documentation
├── hooks/                  # React hooks
├── lib/                    # Utility libraries
├── public/                 # Static assets
├── scripts/                # Deployment and utility scripts
├── styles/                 # CSS styles
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
└── _archive/              # Archived/deprecated files
```

## Key Files

- `deployment/docker-compose.yml` - Main orchestration file
- `deployment/.env.development` - Environment variables
- `scripts/update-and-restart-hetzner.sh` - Main deployment script
- `scripts/cleanup-and-align-deployment.sh` - Cleanup script

## Deployment Workflow

1. Local development: `npm run dev`
2. Deploy to server: `./scripts/cleanup-and-align-deployment.sh`
3. Start services: `./scripts/start-services-sequentially.sh`
4. Monitor: `./scripts/monitor-hetzner-deployment.sh`

## Principles

- **DRY**: Don't Repeat Yourself
- **Simple**: As simple as possible, but no simpler
- **Organized**: Clear directory structure
- **Aligned**: Local and server structures match exactly
EOF

print_success "Created PROJECT_STRUCTURE.md"
echo ""

print_success "Project structure cleanup completed! 🗂️"
echo ""
print_status "Summary of changes:"
echo "- Analyzed and cleaned _archive directory"
echo "- Verified deployment directory structure"
echo "- Checked script permissions"
echo "- Generated PROJECT_STRUCTURE.md"
echo ""
print_status "Next steps:"
echo "1. Review PROJECT_STRUCTURE.md"
echo "2. Run ./scripts/cleanup-and-align-deployment.sh"
echo "3. Deploy with aligned structure"
