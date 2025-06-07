# 🧠 TwinCiGo CRM Architecture: Complete Dev vs. Prod Deployment Strategy

This document outlines the complete infrastructure, integration, scaling strategy, and environment-specific differences between **development** and **production** environments for TwinCiGo CRM. It is written for Augment and all collaborators building the high-availability, AI-native CRM system.

---

## 🎯 Architecture Overview

| Layer                | Technology           | Role                                                 |
| -------------------- | -------------------- | ---------------------------------------------------- |
| **Database**         | PostgreSQL (Patroni) | Core data layer with high availability and failover  |
| **Coordination**     | etcd                 | Manages cluster state and leader election            |
| **Routing**          | HAProxy              | Routes requests to the current PostgreSQL leader     |
| **Platform Tools**   | Supabase             | Provides Auth, REST API, Realtime, Storage, Admin UI |
| **Backend Services** | FastAPI              | Orchestrates AI agents, APIs, and automation logic   |

---

## 🌱 Development (3× CCX13 Nodes)

| Component  | Details                                                 |
| ---------- | ------------------------------------------------------- |
| **Servers**    | **ubuntu-8gb-hil-1**: 5.78.103.224 (Hetzner CCX13)     |
|            | **ubuntu-8gb-ash-1**: 5.161.110.205 (Hetzner CCX13)     |
|            | **ubuntu-8gb-ash-2**: 178.156.186.10 (Hetzner CCX13)    |
| PostgreSQL | Patroni (HA with etcd + HAProxy on separate containers) |
| Supabase   | Deployed on 1–2 nodes (lightweight services only)       |
| Backend    | FastAPI + LangGraph agents (distributed or colocated)   |
| Storage    | Supabase storage-api (local or offloaded)               |
| Analytics  | Loki + Grafana (minimal scrape interval)                |
| Domain     | `.dev.twincigo.local` or staging subdomain              |
| TLS/SSL    | Optional (for internal testing only)                    |
| Redis      | Shared container on low-usage node                      |

### ✅ Dev Highlights

* 3-node HA Patroni cluster mimics production
* Container efficiency enforced by resource limits
* Forces lean architecture and early optimizations
* Run Docker on each node or use lightweight k3s
* Allows dev testing of failover, replication, and HA scenarios

---

## 🚀 Production (HA, Multi-Node)

| Component  | Details                                       |
| ---------- | --------------------------------------------- |
| Servers    | 3× Hetzner CCX33 (Ashburn or mix regions)     |
| PostgreSQL | Patroni cluster w/ etcd + HAProxy             |
| Supabase   | Deployed via Docker Swarm or K8s across nodes |
| Backend    | FastAPI + LangGraph agents (scalable)         |
| Storage    | MinIO cluster or offsite (Wasabi/Bunny CDN)   |
| Analytics  | Loki + Grafana (Logflare removed)             |
| Redis      | Dedicated container or shared node            |
| Domain     | `app.twincigo.com`                            |
| TLS/SSL    | Full Let’s Encrypt / Cloudflare integration   |

### ✅ Prod Highlights

* High-availability PostgreSQL (HAProxy + Patroni)
* Dedicated vector DB with `pgvector`
* Container orchestration (Swarm, K8s, or Nomad)
* Real monitoring (Prometheus + Loki)
* Secure auth, RLS, and JWT validation at scale
* CI/CD connected via GitHub or CI runner

---

## 🧩 Dev vs Prod Comparison Table

| Category       | Development (Dev)        | Production (Prod)                     |
| -------------- | ------------------------ | ------------------------------------- |
| HA Setup       | ✅ Yes (3-node Patroni)   | ✅ Yes (3-node Patroni + HAProxy)      |
| Analytics      | ✅ Minimal Loki + Grafana | ✅ Full Loki + Prometheus + Grafana    |
| Authentication | ✅ Supabase Auth (gotrue) | ✅ Supabase Auth or future Ory/Authlib |
| Deployment     | Docker Compose or k3s    | Docker Swarm / K8s                    |
| Resource Usage | Medium                   | Medium-High                           |
| Scaling        | Manual                   | Horizontal via agents & containers    |
| File Storage   | Local or Supabase bucket | MinIO or CDN-based                    |
| Observability  | Basic+ logs              | Full metrics + alerting               |

---

## 🔁 Supabase + Patroni Interaction Summary

* **Patroni** = **brain and memory** (Postgres engine, HA, replication)
* **Supabase** = **face and interface** (auth, API, storage, realtime)

They operate **independently but symbiotically**:

1. PostgreSQL is run by Patroni (with etcd + HAProxy)
2. Supabase services connect to Postgres via HAProxy
3. Supabase Auth (`gotrue`) issues JWTs used by PostgREST and FastAPI
4. Your app also connects via HAProxy and validates JWTs

Supabase does not manage Patroni — it is purely a consumer of PostgreSQL.

---

## 🚧 Evolution Strategy (Phased Modularization)

| Phase | Focus                       | Replacements / Tools                            |
| ----- | --------------------------- | ----------------------------------------------- |
| 1     | Disable Supabase Analytics  | Remove logflare container                       |
| 2     | Move APIs to FastAPI        | Replace PostgREST with FastAPI                  |
| 3     | Replace Supabase Auth (opt) | Ory Kratos / Authentik / FastAPI+Authlib        |
| 4     | Replace Supabase Storage    | MinIO / Wasabi / Bunny                          |
| 5     | Build Custom Admin UI       | React + ShadCN + Supabase SQL / FastAPI backend |

This phased strategy preserves initial velocity while removing Supabase dependencies over time.

---

## 🪠 Dev Bootstrap Script (3× CCX13 Nodes)

### Node Configuration
- **ubuntu-8gb-hil-1** (5.78.103.224): Primary Patroni leader + Supabase services
- **ubuntu-8gb-ash-1** (5.161.110.205): Patroni replica + FastAPI backend
- **ubuntu-8gb-ash-2** (178.156.186.10): Patroni replica + monitoring

```bash
# Deploy to all 3 nodes using automated script
./scripts/deploy-3-node-cluster.sh

# Or manually on each node:
cd /opt/twincigo-crm
docker-compose up -d
```

---

## 🚀 Prod Bootstrap Script (3× CCX33 Nodes)

```bash
# Run on each prod node with appropriate configs
cd /opt/twincigo-crm
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Recommendations

* Dev = 3-node simulation of prod HA environment
* Prod = 3-node, HA, future-proofed deployment
* Use `.env.dev` and `.env.prod` with shared secrets split cleanly
* Automate DB migration and container builds for consistency
* Prioritize lean builds, metrics sampling, and job offloading to stay within CCX13 constraints

---

**— AI Strategist, TwinCiGo CRM**
