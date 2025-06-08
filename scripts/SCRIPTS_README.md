# 🛠️ Scripts Directory

This directory contains deployment and maintenance scripts for the CRM system.

## Production Scripts

### Supabase Setup Scripts

- **`setup-supabase-on-hetzner.sh`** - Complete automated setup for Supabase on Hetzner server
  - Configures PostgreSQL with logical replication
  - Fixes Docker Compose syntax issues
  - Sets up proper database connectivity
  - Documentation: [docs/deployment/SUPABASE_SETUP.md](../docs/deployment/SUPABASE_SETUP.md)

- **`fix-postgresql-for-supabase.sh`** - PostgreSQL-specific configuration for Supabase
  - Enables logical replication
  - Sets required replication parameters
  - Configures authentication

- **`fix-docker-compose-syntax.py`** - Fixes Docker Compose syntax errors
  - Corrects invalid `depends_on` sections
  - Handles environment variable misplacements

### Monitoring & Health Check Scripts

- **`comprehensive-health-check.sh`** - **PRIMARY MONITORING TOOL**
  - Tests all infrastructure components (27 checks across 7 categories)
  - Provides health scoring and detailed reports
  - Documentation: [docs/reporting/comprehensive-health-check.md](../docs/reporting/comprehensive-health-check.md)

- **`cluster-status.sh`** - PostgreSQL HA cluster status
  - Patroni cluster health and topology
  - Database connectivity and replication status
  - Quick cluster overview

- **`monitor-cluster-health.sh`** - Continuous monitoring
  - Background health monitoring
  - Alert generation and logging
  - Performance metrics collection

### Session Management Scripts

- **`start-session.sh`** - Start development session
  - Downloads latest environment files from server
  - Environment selection (development/production)
  - Server-centralized environment management
  - Documentation: [docs/reporting/session-management.md](../docs/reporting/session-management.md)

- **`end-session.sh`** - End development session
  - Backs up environment changes to server
  - Session cleanup and synchronization

### Validation Scripts

- **`validate-security.js`** - **SECURITY COMPLIANCE TOOL**
  - 17 comprehensive security checks
  - Hardcoded secrets detection
  - Authentication and authorization validation
  - Documentation: [docs/reporting/security-monitoring.md](../docs/reporting/security-monitoring.md)

- **`validate-ringcentral-config.js`** - RingCentral configuration validation
  - Environment variables validation
  - API credentials testing
  - Connectivity verification

## Usage

### 🏥 Monitoring & Health Checks

#### Comprehensive Health Check (Recommended)
```bash
# Run complete infrastructure health check
./scripts/comprehensive-health-check.sh

# View generated report
cat health_report_YYYYMMDD_HHMMSS.txt
```

#### Daily Monitoring Routine
```bash
# Morning health check
./scripts/comprehensive-health-check.sh

# Start development session
./scripts/start-session.sh

# Check cluster status (as needed)
./scripts/cluster-status.sh

# End session with backup
./scripts/end-session.sh
```

#### Security Validation
```bash
# Run comprehensive security check
node scripts/validate-security.js

# RingCentral configuration validation
node scripts/validate-ringcentral-config.js
```

### 🚀 Production Deployment

#### Supabase Setup on Hetzner
```bash
# Copy script to server
scp scripts/setup-supabase-on-hetzner.sh root@your-server:/tmp/

# Run on server
ssh root@your-server
chmod +x /tmp/setup-supabase-on-hetzner.sh
/tmp/setup-supabase-on-hetzner.sh
```

## Development Scripts

For development-specific scripts, see:
- `gardenos-dev/scripts/` - Development environment scripts
- `gardenos-dev/scripts/validate-environment.sh` - Development environment validation

## Documentation

### 🏥 Reporting & Monitoring Documentation
- **[Reporting Overview](../docs/reporting/README.md)** - **COMPREHENSIVE MONITORING GUIDE**
- **[Comprehensive Health Check](../docs/reporting/comprehensive-health-check.md)** - Primary monitoring tool
- **[Session Management](../docs/reporting/session-management.md)** - Environment management system
- **[Security Monitoring](../docs/reporting/security-monitoring.md)** - Security validation tools

### 🚀 Deployment Documentation
- **[Supabase Setup Guide](../docs/deployment/SUPABASE_SETUP.md)** - Comprehensive setup documentation
- **[Hetzner Supabase Setup](../docs/deployment/HETZNER_SUPABASE_SETUP.md)** - Quick troubleshooting guide
- **[Production Deployment](../docs/deployment/PRODUCTION_DEPLOYMENT.md)** - General deployment guide

## Script Organization

- **Production scripts** → `scripts/` (this directory)
- **Development scripts** → `gardenos-dev/scripts/`
- **Database migrations** → `database/migrations/`
- **Setup scripts** → `docs/deployment/` (documentation with embedded scripts)

## Contributing

When adding new scripts:

1. **Choose the right location**:
   - Production/deployment scripts → `scripts/`
   - Development environment scripts → `gardenos-dev/scripts/`

2. **Add documentation**:
   - Include header comments with purpose and documentation links
   - Update this SCRIPTS_README.md
   - Add to relevant documentation in `docs/`

3. **Make executable**:
   ```bash
   chmod +x scripts/your-script.sh
   ```

4. **Test thoroughly** before committing
