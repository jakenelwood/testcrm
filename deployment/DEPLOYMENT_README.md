# 🌱 TwinCiGo CRM Development Environment - Multi-Node HA Simulation

Development environment implementing the full TwinCiGo CRM architecture with multi-node HA simulation as recommended in `docs/database/supabase_patroni_strategy_roles.md` and `docs/database/gardenOS_dev_vs_production.md`.

## 🎯 Purpose

This setup provides a **development environment** that simulates the full **production architecture** on a single Hetzner server, giving you:

- ✅ **Complete HA experience** with 3 Patroni nodes + HAProxy
- ✅ **Failover testing** capabilities in development
- ✅ **Production-like architecture** for realistic testing
- ✅ **Development-friendly** logging and debugging
- ✅ **localhost:3000 testing** against production-grade backend

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   localhost:3000│    │  Hetzner Server │    │ Patroni Cluster │
│                 │    │                 │    │                 │
│  Next.js App    │───▶│    HAProxy      │───▶│  PostgreSQL     │
│                 │    │   Port 5000     │    │   3 Nodes       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Supabase Stack  │    │ etcd Coordination│
                       │ • Auth (9999)   │    │   Port 2379     │
                       │ • REST (3000)   │    │                 │
                       │ • Realtime      │    │ Leader Election │
                       │ • Storage       │    │ Health Checks   │
                       │ • Studio (3001) │    │ Failover Logic  │
                       └─────────────────┘    └─────────────────┘
```

## 📦 Components

### **Core Infrastructure**
| Component | Role | Port | Health Check |
|-----------|------|------|--------------|
| **etcd** | Coordination service | 2379 | ✅ Built-in |
| **Patroni Node 1** | PostgreSQL Leader/Replica | 5432 | ✅ REST API (8008) |
| **Patroni Node 2** | PostgreSQL Replica | 5433 | ✅ REST API (8009) |
| **Patroni Node 3** | PostgreSQL Replica | 5434 | ✅ REST API (8010) |
| **HAProxy** | Load Balancer | 5000/5001 | ✅ Stats Page (7000) |

### **Supabase Stack (Phase 1)**
| Service | Role | Port | Status |
|---------|------|------|--------|
| **Auth (gotrue)** | Authentication | 9999 | ✅ Enabled |
| **REST (postgrest)** | API Layer | 3000 | ✅ Enabled |
| **Realtime** | WebSocket Events | 4000 | ✅ Enabled |
| **Storage** | File Storage | 5002 | ✅ Enabled |
| **Studio** | Admin UI | 3001 | ✅ Enabled |
| **Meta** | Schema API | 8080 | ✅ Enabled |
| **Analytics** | Logging/Metrics | ❌ | ❌ Disabled |

### **Development Tools**
| Tool | Purpose | Port | Access |
|------|---------|------|--------|
| **Adminer** | Database Admin | 8081 | Web UI |
| **Redis Commander** | Redis Management | 8082 | Web UI |
| **Redis** | Caching | 6379 | Internal |

## 🚀 Deployment

### **Automated Deployment (Recommended)**
```bash
# Use the interactive deployment script
./scripts/update-and-restart-hetzner.sh

# When prompted:
# 1. Enter "deployment" as the local source directory
# 2. Select option 5 for "Full update (all files)"
# 3. Choose your preferred restart strategy
```

### **Quick Deployment Scripts**
```bash
# Deploy the full HA simulation to Hetzner
./scripts/deploy-gardenos-dev-to-hetzner.sh

# Configure localhost:3000 to connect
./scripts/setup-local-for-hetzner-gardenos.sh

# Start local development
npm run dev
```

### **Manual Deployment**
```bash
# Copy files to server
scp -r deployment/ root@5.161.110.205:/opt/gardenos-dev/

# SSH to server and start services
ssh root@5.161.110.205
cd /opt/gardenos-dev
docker-compose up -d
```

## 🔧 Configuration

### **Environment Variables**
- `.env.development` - Development environment configuration
- `patroni/patroni-*-dev.yml` - Patroni cluster configuration
- `haproxy/haproxy-dev.cfg` - HAProxy load balancer configuration

### **Database Connection**

**Primary (Read/Write) via HAProxy:**
```
Host: 5.161.110.205
Port: 5000
Database: crm
User: postgres
```

**Replicas (Read Only) via HAProxy:**
```
Host: 5.161.110.205
Port: 5001
Database: crm
User: postgres
```

**Direct Node Access (for debugging):**
- Node 1: `5.161.110.205:5432`
- Node 2: `5.161.110.205:5433`
- Node 3: `5.161.110.205:5434`

## 📊 Monitoring & Testing

### **HAProxy Statistics**
- **URL**: `http://5.161.110.205:7000/stats`
- **Features**: Real-time cluster status, connection distribution, failover monitoring

### **Patroni REST APIs**
- **Node 1**: `http://5.161.110.205:8008` (Leader/Replica status)
- **Node 2**: `http://5.161.110.205:8009` (Replica status)
- **Node 3**: `http://5.161.110.205:8010` (Replica status)

### **Supabase Services**
- **Studio**: `http://5.161.110.205:3001` (Database admin)
- **REST API**: `http://5.161.110.205:3000` (API endpoint)
- **Auth**: `http://5.161.110.205:9999` (Authentication)

### **Development Tools**
- **Adminer**: `http://5.161.110.205:8081` (Database management)
- **Redis Commander**: `http://5.161.110.205:8082` (Redis management)

## 🔄 High Availability Testing

### **Failover Simulation**
```bash
# Stop the primary node to test failover
docker stop gardenos-postgres-1-dev

# Watch HAProxy stats for automatic failover
curl http://5.161.110.205:7000/stats

# Verify application still works
curl http://localhost:3000/api/health
```

### **Load Testing**
```bash
# Test read/write split
PGPASSWORD='your_password' psql -h 5.161.110.205 -p 5000 -U postgres -d crm -c "SELECT version();"  # Primary
PGPASSWORD='your_password' psql -h 5.161.110.205 -p 5001 -U postgres -d crm -c "SELECT version();"  # Replicas
```

### **Cluster Status**
```bash
# Check Patroni cluster status
curl http://5.161.110.205:8008/cluster
curl http://5.161.110.205:8009/cluster
curl http://5.161.110.205:8010/cluster

# Check etcd health
curl http://5.161.110.205:2379/health
```

## 🛠️ Management Commands

### **Automated Management (Recommended)**
```bash
# Use the update and restart script for all operations
./scripts/update-and-restart-hetzner.sh

# Monitor deployment status
./scripts/monitor-hetzner-deployment.sh

# Inspect server state
./scripts/inspect-hetzner-server.sh
```

### **Manual Service Management**
```bash
# SSH to server first
ssh root@5.161.110.205
cd /opt/gardenos-dev

# Check all services
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Restart specific service
docker-compose restart [service_name]

# Scale replicas (if needed)
docker-compose up -d --scale postgres-2=2
```

### **Database Operations**
```bash
# Connect via HAProxy (recommended)
PGPASSWORD='your_password' psql -h 5.161.110.205 -p 5000 -U postgres -d crm

# Connect to specific node (debugging)
PGPASSWORD='your_password' psql -h 5.161.110.205 -p 5432 -U postgres -d crm

# Check replication status
PGPASSWORD='your_password' psql -h 5.161.110.205 -p 5000 -U postgres -c "SELECT * FROM pg_stat_replication;"
```

### **Storage Directory**
The `storage/` directory is used by Supabase Storage API:
- Mounted as `/var/lib/storage` in the storage container
- Stores uploaded files, images, and other assets
- Provides persistent storage across container restarts
- Should be included in backups

## 🎯 Development Benefits

### **Why Multi-Node HA Simulation?**

1. **Realistic Testing**: Test against production-like architecture
2. **Failover Experience**: Learn how HA works in practice
3. **Performance Testing**: Understand load balancing behavior
4. **Debugging Skills**: Practice troubleshooting distributed systems
5. **Production Readiness**: Confidence in production deployment

### **Development vs Production**

| Aspect | Development (This Setup) | Production (Future) |
|--------|-------------------------|---------------------|
| **Nodes** | 3 containers on 1 server | 3 servers (CCX33) |
| **Resources** | Shared CPU/Memory | Dedicated per node |
| **Networking** | Docker bridge | Multi-server network |
| **Monitoring** | Basic tools | Full observability |
| **Security** | Relaxed for dev | Production hardened |

## 🚧 Evolution Path

This development setup prepares you for production scaling:

### **Current: Development HA Simulation**
- 3 Patroni containers + HAProxy + Supabase
- Single Hetzner server
- Development-friendly configuration

### **Future: Production Multi-Server**
- 3 Hetzner CCX33 servers
- Container orchestration (K8s/Swarm)
- Enhanced monitoring and security

## 📞 Support

### **Troubleshooting**
1. Check service logs: `docker-compose logs [service]`
2. Verify HAProxy stats: `http://5.161.110.205:7000/stats`
3. Test Patroni APIs: `curl http://5.161.110.205:8008`
4. Check etcd health: `curl http://5.161.110.205:2379/health`

### **Common Issues**
- **Slow startup**: Patroni cluster takes 30-60s to initialize
- **Connection refused**: Check if all services are running
- **Failover not working**: Verify etcd connectivity
- **Performance issues**: Check HAProxy connection distribution

---

**🌱 TwinCiGo CRM Development Environment**
*Experience production HA architecture in development!*

## 📁 Directory Structure

```
deployment/
├── DEPLOYMENT_README.md          # This file
├── docker-compose.yml            # Main orchestration file
├── backend/                      # FastAPI backend service
│   ├── Dockerfile
│   └── main.py
├── haproxy/                      # Load balancer configuration
│   └── haproxy-dev.cfg
├── patroni/                      # PostgreSQL HA configuration
│   ├── patroni-1-dev.yml        # Primary node config
│   ├── patroni-2-dev.yml        # Replica node config
│   └── patroni-3-dev.yml        # Replica node config
├── postgres/                     # Database initialization
│   └── init.sql
└── storage/                      # Supabase file storage
    └── (created automatically)
```

## 🔄 Update Process

The deployment uses the automated update script which:
1. Copies files from `deployment/` to `/opt/gardenos-dev/` on the server
2. Validates Docker Compose configuration
3. Provides multiple restart strategies
4. Performs health checks after deployment
5. Shows service URLs for easy access
