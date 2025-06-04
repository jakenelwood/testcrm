# 🚀 GardenOS Database Evolution Plan

## 🎯 Goal: Progressive Architecture from Simple to Clustered

Deploy a clean, optimized database that evolves from single-server to full GardenOS cluster architecture.

## 📋 Evolution Strategy

**Phase 1: ✅ COMPLETE** - Single PostgreSQL server (current state)
**Phase 2: 🔄 NEXT** - Docker Compose cluster simulation
**Phase 3: 🎯 FUTURE** - Production Patroni cluster with failover

## 🔧 Implementation Steps

### Step 1: Hetzner Server Setup
```bash
# Connect to Hetzner server
ssh -i ~/.ssh/id_ed25519 root@5.161.110.205

# Install PostgreSQL 15 with extensions
apt update && apt install postgresql-15 postgresql-15-pgvector
systemctl enable postgresql
systemctl start postgresql
```

### Step 2: Database Configuration
```sql
-- Create CRM database
CREATE DATABASE crm;
CREATE USER crm_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE crm TO crm_user;

-- Enable required extensions
\c crm
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Step 3: Deploy Optimized Schema
- Use cleaned-up version of current schema
- Fix table naming (leads_ins_info → leads, leads_contact_info → clients)
- Add proper indexes for business query patterns
- Include GardenOS AI agent tables from day one

### Step 4: Update Application
- Change database connection string in .env.local
- Test all functionality works
- Deploy to production

### Step 5: Basic Operations Setup
- Configure automated backups
- Set up basic monitoring
- Document connection details

## 🎯 Success Criteria

- [ ] PostgreSQL running on Hetzner
- [ ] Clean schema deployed
- [ ] Application connects successfully
- [ ] All existing features work
- [ ] Backups configured
- [ ] Connection documented

## 🔄 Phase 2: Docker Compose Cluster Simulation

### GardenOS Development Environment

Use **Docker + Docker Compose** on the single CCX33 server to simulate the entire cluster:

**Architecture Components:**
- **Patroni with PostgreSQL** (3 containers)
- **etcd** (1 or 3 containers for coordination)
- **HAProxy** (1 container for load balancing)
- **Supabase containers** (Auth, Realtime, Storage, REST, Studio)
- **Python microservices** (FastAPI)

**Folder Structure:**
```
gardenos-dev/
├── docker-compose.yml
├── supabase/
│   └── .env (JWT, DB creds)
├── patroni/
│   ├── patroni.yml
│   └── postgres-data/
├── haproxy/
│   └── haproxy.cfg
├── etcd/
│   └── etcd.conf.yml
├── python-services/
│   └── csv-import/
└── Makefile
```

**Key Features:**
- All Supabase services connect to PostgreSQL cluster via HAProxy
- Simulates failover behavior in development
- Container logs verify startup order and cluster readiness
- Easy bring up/down with `make dev-up` / `make dev-down`

### Benefits of This Approach
1. **Test clustering locally** before production deployment
2. **Validate failover scenarios** in development
3. **Identical architecture** to production
4. **Easy development workflow** with single command startup

## 🎯 Phase 3: Production Patroni Cluster

When ready for production scale:
1. Deploy 3 separate CCX33 instances
2. Implement true Patroni clustering
3. Add monitoring and alerting
4. Enhanced backup strategies

## 📝 Current Status & Next Actions

✅ **Phase 1 Complete** - Single PostgreSQL server operational
- Clean schema deployed
- All tests passing
- Application ready to connect

🔄 **Phase 2 Ready** - Docker Compose simulation
- Would you like to implement the cluster simulation next?
- This allows testing failover scenarios locally

Keep it simple, make it work, scale progressively.
