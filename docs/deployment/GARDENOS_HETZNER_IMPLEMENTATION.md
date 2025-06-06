# 🌱 GardenOS Hetzner Implementation Guide

Complete implementation of the GardenOS architecture recommendations from `docs/database/gardenos_architecture_overview.md` on Hetzner server.

## 📋 Overview

This implementation upgrades the existing Hetzner setup from a basic PostgreSQL + Supabase configuration to the full **GardenOS architecture** with high availability, load balancing, and modular design.

### 🔄 Architecture Transformation

**Before (Current Setup):**
```
localhost:3000 ──► Hetzner PostgreSQL:5432 ──► Direct DB Connection
                          │
                          ▼
                   Supabase Containers
                   (via Docker bridge)
```

**After (GardenOS Implementation):**
```
localhost:3000 ──► HAProxy:5000 ──► Patroni Leader ──► PostgreSQL Cluster
                      │                    │              (3 nodes)
                      │                    ▼
                      ▼              etcd Coordination
               Supabase Stack
               (minus analytics)
```

## 🎯 Implementation Benefits

### ✅ **Addresses Strategy Document Recommendations**

1. **High Availability**: 3-node Patroni cluster with automatic failover
2. **Load Balancing**: HAProxy routes to current PostgreSQL leader
3. **Phase 1 Compliance**: Supabase minus analytics (per recommendations)
4. **Modular Design**: Clean separation for future evolution
5. **Production Ready**: Optimized for performance and reliability

### ✅ **Solves Current Limitations**

- **Single Point of Failure**: Eliminated with Patroni clustering
- **No Load Balancing**: HAProxy provides intelligent routing
- **Direct DB Connections**: All services connect through HAProxy
- **Analytics Issues**: Disabled analytics service (per Phase 1)

## 📦 What's Been Created

### 🗂️ **New Directory Structure**
```
gardenos-prod/
├── docker-compose.yml              # Production orchestration
├── .env.production                 # Production environment
├── README.md                       # Production documentation
├── patroni/
│   ├── patroni-1-prod.yml         # Node 1 configuration
│   ├── patroni-2-prod.yml         # Node 2 configuration
│   └── patroni-3-prod.yml         # Node 3 configuration
└── haproxy/
    └── haproxy-prod.cfg            # Load balancer configuration
```

### 🛠️ **Deployment Scripts**
```
scripts/
├── deploy-gardenos-prod-to-hetzner.sh     # Full deployment automation
└── setup-local-for-hetzner-gardenos.sh    # Local environment setup
```

### ⚙️ **Configuration Files**
```
.env.local.hetzner-gardenos         # Local config template
docs/deployment/
└── GARDENOS_HETZNER_IMPLEMENTATION.md     # This guide
```

## 🚀 Deployment Process

### **Step 1: Deploy GardenOS to Hetzner**

```bash
# Run the automated deployment script
./scripts/deploy-gardenos-prod-to-hetzner.sh
```

**What this does:**
- ✅ Backs up existing database
- ✅ Copies production configuration to Hetzner
- ✅ Installs Docker/Docker Compose if needed
- ✅ Generates secure production passwords
- ✅ Starts Patroni cluster with etcd coordination
- ✅ Configures HAProxy load balancing
- ✅ Deploys Supabase services (minus analytics)
- ✅ Restores data to new cluster
- ✅ Verifies deployment

### **Step 2: Configure Local Environment**

```bash
# Setup local environment to connect to Hetzner GardenOS
./scripts/setup-local-for-hetzner-gardenos.sh
```

**What this does:**
- ✅ Tests connectivity to Hetzner services
- ✅ Retrieves production passwords
- ✅ Updates local `.env.local` configuration
- ✅ Tests database connectivity
- ✅ Provides connection summary

### **Step 3: Test localhost:3000**

```bash
# Start your local development server
npm run dev

# Open http://localhost:3000
# Your app now connects to production GardenOS cluster!
```

## 🔧 Service Architecture

### **Core Infrastructure**
| Service | Role | Port | Health Check |
|---------|------|------|--------------|
| **etcd** | Coordination | 2379 | ✅ Built-in |
| **Patroni Node 1** | PostgreSQL Leader/Replica | 5432 | ✅ REST API |
| **Patroni Node 2** | PostgreSQL Replica | 5433 | ✅ REST API |
| **Patroni Node 3** | PostgreSQL Replica | 5434 | ✅ REST API |
| **HAProxy** | Load Balancer | 5000/5001 | ✅ Stats Page |

### **Supabase Stack (Phase 1)**
| Service | Role | Port | Status |
|---------|------|------|--------|
| **Auth (gotrue)** | Authentication | 9999 | ✅ Enabled |
| **REST (postgrest)** | API Layer | 3000 | ✅ Enabled |
| **Realtime** | WebSocket Events | 4000 | ✅ Enabled |
| **Storage** | File Storage | 5000 | ✅ Enabled |
| **Studio** | Admin UI | 3001 | ✅ Enabled |
| **Meta** | Schema API | 8080 | ✅ Enabled |
| **Analytics** | Logging/Metrics | ❌ | ❌ Disabled |

## 📊 Monitoring & Management

### **HAProxy Statistics**
- **URL**: `http://5.161.110.205:7000/stats`
- **Features**: Real-time cluster status, connection distribution, health checks

### **Patroni REST APIs**
- **Node 1**: `http://5.161.110.205:8008` (Primary/Replica status)
- **Node 2**: `http://5.161.110.205:8009` (Replica status)
- **Node 3**: `http://5.161.110.205:8010` (Replica status)

### **Supabase Services**
- **Studio**: `http://5.161.110.205:3001` (Database admin)
- **REST API**: `http://5.161.110.205:3000` (API endpoint)
- **Auth**: `http://5.161.110.205:9999` (Authentication)

## 🔄 High Availability Features

### **Automatic Failover**
- **Detection Time**: 3 seconds (health check interval)
- **Failover Time**: < 30 seconds typical
- **Zero Data Loss**: Synchronous replication
- **Leader Election**: etcd-coordinated consensus

### **Load Balancing**
- **Primary**: Port 5000 (read/write operations)
- **Replicas**: Port 5001 (read-only operations)
- **Health-Based**: Automatic routing around failed nodes
- **Connection Pooling**: Optimized connection management

## 🛡️ Security & Production Features

### **Security Enhancements**
- ✅ SCRAM-SHA-256 password encryption
- ✅ Generated secure passwords (32+ characters)
- ✅ Network isolation via Docker networks
- ✅ Connection limits and rate limiting
- ✅ Health check endpoints for monitoring

### **Performance Optimizations**
- ✅ SSD-optimized PostgreSQL settings
- ✅ Production-tuned memory allocation
- ✅ Optimized WAL settings for replication
- ✅ Connection pooling and load distribution

## 🚧 Evolution Path (Future Phases)

This implementation sets the foundation for the complete GardenOS evolution:

### **Phase 2: Replace PostgREST with FastAPI**
- Move API logic to FastAPI
- Maintain pgvector and RLS
- Keep JWT validation

### **Phase 3: Replace Supabase Auth (Optional)**
- Options: Ory Kratos, Authentik, FastAPI + Authlib
- Maintain JWT compatibility

### **Phase 4: Replace Supabase Storage**
- Options: MinIO, Bunny.net, Wasabi
- S3-compatible interface

### **Phase 5: Custom Admin Panel**
- Replace Studio with React + ShadCN
- Direct FastAPI integration

## 🔍 Testing & Verification

### **Connectivity Tests**
```bash
# Test HAProxy primary
curl -I http://5.161.110.205:5000

# Test Supabase REST API
curl http://5.161.110.205:3000

# Test database connection
PGPASSWORD='password' psql -h 5.161.110.205 -p 5000 -U postgres -d crm -c "SELECT version();"
```

### **Failover Testing**
```bash
# Stop primary node (simulate failure)
docker stop gardenos-postgres-1-prod

# Check HAProxy stats - should show failover
curl http://5.161.110.205:7000/stats

# Verify application still works
curl http://localhost:3000/api/health
```

## 📞 Troubleshooting

### **Common Issues**

1. **Services won't start**
   - Check Docker logs: `docker-compose logs [service]`
   - Verify environment variables in `.env.production`

2. **Database connection fails**
   - Check HAProxy stats: `http://5.161.110.205:7000/stats`
   - Verify Patroni cluster status: `http://5.161.110.205:8008`

3. **Local app can't connect**
   - Verify `.env.local` has correct passwords
   - Test network connectivity: `telnet 5.161.110.205 5000`

### **Support Commands**
```bash
# Check all services
docker-compose ps

# View service logs
docker-compose logs -f [service_name]

# Check cluster health
curl http://5.161.110.205:8080/health

# Monitor HAProxy
watch -n 2 'curl -s http://5.161.110.205:7000/stats | grep postgres'
```

## 🎉 Success Criteria

After successful deployment, you should have:

- ✅ **High Availability**: 3-node PostgreSQL cluster with automatic failover
- ✅ **Load Balancing**: HAProxy routing to healthy nodes
- ✅ **Supabase Integration**: All services working minus analytics
- ✅ **Local Testing**: localhost:3000 connecting to production cluster
- ✅ **Monitoring**: Real-time visibility into cluster health
- ✅ **Production Ready**: Optimized for performance and reliability

## 📚 Related Documentation

- [GardenOS Architecture Overview](../database/gardenos_architecture_overview.md) - Complete system architecture
- [K3s HA Setup Guide](./K3S_HA_SETUP_GUIDE.md) - Kubernetes orchestration setup
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Vercel deployment guide
- [Supabase Setup](./SUPABASE_SETUP.md) - Basic Supabase configuration
- [Hetzner Supabase Setup](./HETZNER_SUPABASE_SETUP.md) - Previous setup guide

---

**🌱 GardenOS Implementation Complete**  
*Your CRM now runs on a production-grade, highly available architecture!*
