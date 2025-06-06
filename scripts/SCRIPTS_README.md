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

### Validation Scripts

- **`validate-ringcentral-config.js`** - Validates RingCentral configuration
  - Checks environment variables
  - Validates API credentials
  - Tests connectivity

## Usage

### Supabase Setup on Hetzner

```bash
# Copy script to server
scp scripts/setup-supabase-on-hetzner.sh root@your-server:/tmp/

# Run on server
ssh root@your-server
chmod +x /tmp/setup-supabase-on-hetzner.sh
/tmp/setup-supabase-on-hetzner.sh
```

### RingCentral Configuration Validation

```bash
# Run locally
node scripts/validate-ringcentral-config.js
```

## Development Scripts

For development-specific scripts, see:
- `gardenos-dev/scripts/` - Development environment scripts
- `gardenos-dev/scripts/validate-environment.sh` - Development environment validation

## Documentation

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
