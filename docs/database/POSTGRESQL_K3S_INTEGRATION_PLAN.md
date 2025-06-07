# 🐘 PostgreSQL K3s Integration Plan

## 📋 Current Situation

### Existing Setup
- **3-node Patroni PostgreSQL cluster** running in Docker containers
- **Docker Compose networking** with ports 5433, 5434, 5435
- **HAProxy load balancer** now configured for port 5432
- **Legacy etcd configuration** (containers trying to connect to `etcd` hostname)

### K3s Requirements
- **Pod network**: 172.21.0.0/16 (needs database access)
- **Service discovery**: Kubernetes-native service resolution
- **Configuration management**: ConfigMaps and Secrets
- **Persistent storage**: Kubernetes PVs for data persistence

## 🎯 Integration Options

### Option 1: Migrate PostgreSQL to K3s (Recommended)
**Approach**: Deploy PostgreSQL cluster natively in K3s using Patroni operator or StatefulSets

**Pros**:
- ✅ Native Kubernetes integration
- ✅ Proper service discovery
- ✅ Kubernetes-native storage management
- ✅ Consistent with overall architecture
- ✅ Better resource management and scaling

**Cons**:
- ⚠️ Requires data migration
- ⚠️ More complex initial setup
- ⚠️ Potential downtime during migration

### Option 2: Bridge Docker PostgreSQL to K3s (Interim)
**Approach**: Update existing Docker PostgreSQL to work with K3s networking

**Pros**:
- ✅ Minimal disruption to existing data
- ✅ Faster implementation
- ✅ Preserves current Patroni setup

**Cons**:
- ❌ Mixed architecture (Docker + K3s)
- ❌ More complex networking
- ❌ Not following "as simple as possible" principle
- ❌ Technical debt

### Option 3: External PostgreSQL Service (Future)
**Approach**: Use managed PostgreSQL service (Hetzner Cloud Database)

**Pros**:
- ✅ Fully managed
- ✅ Built-in HA and backups
- ✅ Simplified operations

**Cons**:
- ❌ Additional cost
- ❌ Less control
- ❌ Vendor lock-in

## 🚀 Recommended Approach: Option 1 (K3s Native)

### Phase 1: Preparation
1. **Backup existing data**
   ```bash
   # Create full database backup
   docker exec gardenos-postgres-1-dev pg_dumpall -U postgres > backup-$(date +%Y%m%d).sql
   ```

2. **Create K3s PostgreSQL manifests**
   - StatefulSet for PostgreSQL with Patroni
   - ConfigMaps for PostgreSQL and Patroni configuration
   - Services for database access
   - PersistentVolumeClaims for data storage

3. **Prepare migration scripts**
   - Data export from Docker containers
   - Data import to K3s PostgreSQL
   - Validation scripts

### Phase 2: Implementation
1. **Deploy PostgreSQL StatefulSet in K3s**
2. **Configure Patroni with K3s etcd cluster**
3. **Migrate data from Docker containers**
4. **Update HAProxy to point to K3s services**
5. **Validate cluster functionality**

### Phase 3: Integration
1. **Deploy Supabase with proper database connection**
2. **Create required databases and users**
3. **Apply database schema**
4. **Test end-to-end connectivity**

## 📦 K3s PostgreSQL Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                K3s PostgreSQL Cluster                       │
├─────────────────────────────────────────────────────────────┤
│  🔗 External etcd Cluster                                   │
│  ├─ ubuntu-8gb-hil-1: 5.78.103.224:2379                    │
│  ├─ ubuntu-8gb-ash-1: 5.161.110.205:2379                  │
│  └─ ubuntu-8gb-ash-2: 178.156.186.10:2379                 │
│                                                             │
│  🐘 PostgreSQL StatefulSet                                  │
│  ├─ postgres-0 (Leader)                                     │
│  ├─ postgres-1 (Replica)                                    │
│  └─ postgres-2 (Replica)                                    │
│                                                             │
│  🌐 Kubernetes Services                                     │
│  ├─ postgres-primary (Leader access)                       │
│  ├─ postgres-replica (Read-only access)                    │
│  └─ postgres-cluster (Load balanced)                       │
│                                                             │
│  💾 Persistent Storage                                      │
│  ├─ postgres-data-0 (10Gi)                                 │
│  ├─ postgres-data-1 (10Gi)                                 │
│  └─ postgres-data-2 (10Gi)                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Implementation Steps

### Step 1: Create PostgreSQL Namespace and Configuration
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: postgres-cluster
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: postgres-cluster
data:
  # PostgreSQL configuration
  # Patroni configuration
  # pg_hba.conf with K3s network allowances
```

### Step 2: Create StatefulSet with Patroni
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: postgres-cluster
spec:
  serviceName: postgres-cluster
  replicas: 3
  # Patroni + PostgreSQL containers
  # Proper etcd integration
  # Volume mounts for data and config
```

### Step 3: Configure Services
```yaml
# Primary service (read-write)
apiVersion: v1
kind: Service
metadata:
  name: postgres-primary
  namespace: postgres-cluster
# Replica service (read-only)
# Cluster service (load balanced)
```

### Step 4: Data Migration
```bash
# Export from Docker containers
# Import to K3s PostgreSQL
# Validate data integrity
```

## 🔐 Security Configuration

### pg_hba.conf for K3s
```
# Allow K3s pod network
host    all             all             172.21.0.0/16          md5
# Allow local connections
local   all             all                                     trust
# Replication
host    replication     replicator      172.21.0.0/16          md5
```

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-network-policy
  namespace: postgres-cluster
spec:
  # Allow connections from Supabase namespace
  # Allow connections from FastAPI namespace
  # Allow etcd communication
```

## 📊 Migration Timeline

### Immediate (Next Session)
- [ ] Create PostgreSQL K3s manifests
- [ ] Test deployment in development
- [ ] Backup existing data

### Short-term (1-2 sessions)
- [ ] Deploy PostgreSQL StatefulSet
- [ ] Migrate data from Docker containers
- [ ] Update HAProxy configuration
- [ ] Deploy Supabase with new database

### Long-term (Future sessions)
- [ ] Implement automated backups
- [ ] Set up monitoring and alerting
- [ ] Optimize performance and scaling

## 🚧 Risk Mitigation

### Data Safety
- **Full backups** before any migration
- **Validation scripts** to verify data integrity
- **Rollback plan** to Docker containers if needed

### Downtime Minimization
- **Parallel deployment** of K3s PostgreSQL
- **Data sync** before cutover
- **Quick rollback** procedures

### Testing Strategy
- **Development environment** testing first
- **Staged migration** approach
- **End-to-end validation** before production use

---

**🎯 Goal**: Native K3s PostgreSQL cluster that follows our "as simple as possible, but no simpler" principle while providing production-grade reliability.
