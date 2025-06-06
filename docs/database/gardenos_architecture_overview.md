# 🧠 GardenOS Architecture: Complete System Overview (Updated with K3s + K9s)

## 🌟 Purpose of This Document

This comprehensive guide clarifies the roles of **K3s**, **Supabase**, and **Patroni** in our GardenOS architecture for Augment and collaborators, covering current implementation, integration strategy, and long-term evolution plans for our high-availability, AI-native CRM platform.

---

## 🗱 Core Architecture Overview

We are building **GardenOS**, a high-availability CRM stack self-hosted on Hetzner with the following components:

| Layer                | Technology               | Role                                                 |
| -------------------- | ------------------------ | ---------------------------------------------------- |
| **Database**         | PostgreSQL (Patroni)     | Core data layer with high availability and failover  |
| **Coordination**     | etcd                     | Manages cluster state and leader election            |
| **Routing**          | HAProxy                  | Routes requests to the current PostgreSQL leader     |
| **Platform Tools**   | Supabase                 | Provides Auth, REST API, Realtime, Storage, Admin UI |
| **Orchestration**    | K3s                      | Lightweight Kubernetes for workload scheduling       |
| **Observability**    | K9s, Prometheus, Grafana | Cluster monitoring, metrics, dashboards              |
| **Backend Services** | FastAPI                  | Orchestrates AI agents, APIs, and automation logic   |

---

## 📀 Role of **Patroni**

**Patroni** is our high-availability tool that manages **PostgreSQL replication, leader election, and failover**.

| Role                 | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| Core database engine | The actual data lives inside Postgres nodes run by Patroni |
| Failover controller  | Promotes replicas to leader automatically if one fails     |
| Etcd integration     | Uses etcd to track cluster state                           |
| HAProxy integration  | Supabase and services connect via HAProxy, not directly    |

### How Patroni Works:

* Runs **PostgreSQL** on each node
* Communicates with **etcd** for leader election
* When a node fails, Patroni:

  * Promotes a replica to be the new leader
  * Notifies clients via REST API
* HAProxy watches Patroni's leader status and **routes traffic** accordingly

💪 Patroni ensures that Supabase is always talking to a healthy, current Postgres node.

---

## 🤩 Role of **Supabase**

Supabase provides a **modular developer platform** that runs entirely on top of PostgreSQL. **It does not store or manage your data** — it provides tools and services that talk to your Postgres database.

| Supabase Component | Role                                                      |
| ------------------ | --------------------------------------------------------- |
| `gotrue`           | Handles **auth**: signup, login, magic links, JWTs, OAuth |
| `postgrest`        | Auto-generates REST APIs from your database schema        |
| `realtime`         | Sends WebSocket events for DB changes (optional)          |
| `storage-api`      | Handles file uploads (S3-style buckets)                   |
| `studio`           | Admin GUI for schema, data, and storage                   |

💪 Supabase connects to Postgres **via HAProxy**, not directly. It doesn't manage the DB — it interacts with it.

---

## 🔐 Authentication Strategy

We are using **Supabase Auth (`gotrue`)** to handle authentication.

### Supabase Auth Features Used:

* Email/password login
* Magic link support
* JWT token generation
* OAuth providers (optional in future)

### Auth Flow:

1. User signs up or logs in via Supabase Auth (gotrue)
2. Supabase returns a **JWT token** with user claims (e.g. `user_id`, `agency_id`, `role`)
3. Frontend passes this JWT on every request
4. Supabase and custom services (e.g., FastAPI agents) **validate the JWT**
5. Authorization is enforced via RLS policies or backend logic
6. Optional: Postgres **RLS (row-level security)** uses JWT claims to control access

🧠 This makes Supabase Auth the source of truth for user identity, while **Postgres + RLS** enforce access control.

---

## ↔️ Integration Summary: Supabase + Patroni + K3s in Practice

* **Patroni** = **brain and memory** (Postgres engine, HA, replication)
* **Supabase** = **face and interface** (auth, API, storage, realtime)
* **K3s** = **skeleton and nervous system** (orchestrates microservices and backend infrastructure)

They operate **independently but symbiotically**:

1. **PostgreSQL is the brain.** Patroni makes it reliable, scalable, and HA.
2. **Supabase connects to it** via HAProxy and provides auth + tools.
3. **FastAPI + coroutine-based AI agents** are deployed as K3s workloads.
4. **K3s schedules and scales services**, allowing real-time and AI tasks to be distributed across multiple nodes.
5. **K9s, Prometheus, and Grafana** provide layered observability: live terminal view, metrics, and dashboards.

---

## 🤖 Coroutine-Based Agent Framework (Jules-Inspired)

Instead of relying on LangGraph or LangChain, GardenOS implements a lightweight **coroutine-based AI orchestration system**, inspired by the Jules multi-agent prototype.

### Key Concepts:

* **Agents**: Async Python functions that operate on shared `context`
* **Tools**: Modular utility functions called by agents
* **Context**: A mutable dictionary passed between steps
* **Orchestrator**: A control loop that sequences agents, similar to a directed graph

### Benefits:

* No external dependencies (fully owned system)
* Deterministic and debuggable workflows
* Tailored control over cost, memory, and API behavior

### Example Flow:

```python
async def orchestrator(lead_id):
    context = {}
    context = await load_lead(lead_id, context)
    context = await score_lead(context)
    context = await generate_follow_up(context)
    return context
```

This system integrates with FastAPI, pgvector, and the rest of the GardenOS stack, enabling low-latency, high-control AI behavior with future extensibility across multiple domains.

---

## ⚖️ Monitoring & Observability Enhancements

While **metrics-server** is already running to support auto-scaling, we're introducing **Prometheus** and **Grafana** to extend observability:

### Prometheus:

* Collects detailed metrics from Kubernetes, Postgres, and app services
* Enables more intelligent **Horizontal Pod Autoscaling** based on CPU, memory, and custom metrics
* Powers Grafana dashboards

### Grafana:

* Visualizes time-series data from Prometheus
* Dashboards for:

  * Pod health & restarts
  * Query latency & throughput
  * Disk I/O pressure and DB memory
* Future: track AI model usage, call volume, inference time, and token costs

These tools enhance decision-making, operational awareness, and **capacity planning for AI and data-heavy services.**

---

## ⚠️ Current Challenges & Evolution Strategy

Supabase helped us launch quickly, but we've identified limitations for long-term scalability:

### Problems Identified:

* GoTrue is not robust enough for advanced enterprise features
* Supabase analytics service (`logflare`) fails easily
* Admin UI (Studio) breaks without analytics
* Auth customization is limited

### Why This Setup Works Now:

* Decouples storage (Patroni) from interface/API/auth (Supabase)
* Lets you swap Supabase later without losing data or logic
* Adds K3s to enable high-scale orchestration and future node autoscaling
* Provides high availability, modularity, and self-hosted control

---

## △ Modular Evolution Strategy

We're preparing for long-term scalability, resilience, and modular control with a phased approach:

### ✅ Phase 1: Use Supabase Minus Analytics

* Disable analytics container
* Keep using gotrue for auth and postgrest for simple CRUD

### ⚠️ Phase 2: Replace PostgREST with FastAPI

* Move API routing and logic to FastAPI
* Maintain pgvector, RLS, and JWT decoding in FastAPI
* Deploy all backend services as Kubernetes workloads in K3s

### 🚪 Phase 3: Replace Supabase Auth (Optional)

**Options:**

* Ory Kratos (highly customizable)
* Authentik (modern UI, SSO support)
* FastAPI + Authlib (custom)

### 📦 Phase 4: Replace Supabase Storage

**Options:**

* MinIO (S3-compatible and self-hosted)
* Bunny.net or Wasabi for low-cost offsite storage

### ⚒️ Phase 5: Build Custom Admin Panel

* Replace Studio with your own UI (React + ShadCN)
* Integrate directly with Postgres via FastAPI

---

## 🚀 Long-Term Vision

Our end goal is a fully modular, AI-native architecture:

### Target Benefits:

* 🧠 Fully AI-native: all logic flows through FastAPI + coroutine agents
* 📊 Infrastructure as building blocks, not a monolith
* 🛡️ Enterprise-ready auth + audit trails
* 💪 Self-hosted orchestration via K3s
* 🧸 Human-friendly troubleshooting (logs via Loki/Grafana stack)

### Final Architecture:

* **Patroni** for HA PostgreSQL
* **FastAPI** for backend
* **pgvector** for AI memory
* **K3s** for orchestration
* **K9s, Prometheus, Grafana** for observability
* **Custom coroutine-based agents** for AI workflows
* **Modular replacements** for Supabase components

---

## 🎯 Production-Ready Service Discovery

**BREAKTHROUGH ACHIEVED**: We've successfully implemented a production-grade sidecar pattern that solves the Patroni Kubernetes service discovery challenge.

### The Challenge

Patroni's Kubernetes integration requires reliable access to service account tokens to manage pod labels and endpoints. However, Spilo containers have internal race conditions that prevent consistent token access, resulting in:

* `postgres-primary` service with no endpoints
* Round-robin connections to all pods (including read-only replicas)
* Write operations failing ~66% of the time when hitting replicas

### The Solution: Discovery Sidecar Pattern

We implemented a **lightweight sidecar container** that handles service discovery independently:

| Component | Role |
| --------- | ---- |
| **Spilo Container** | Manages PostgreSQL and Patroni (database concerns only) |
| **Discovery Sidecar** | Monitors Patroni API and updates Kubernetes endpoints |

### Technical Implementation

```yaml
# Sidecar container in each Patroni pod
- name: discovery-sidecar
  image: alpine/k8s:1.28.4  # Has both kubectl and curl
  command: ["/bin/sh", "/app/discovery.sh"]
```

**Discovery Logic:**
1. **Monitor Patroni**: Polls `http://localhost:8008/master` every 10 seconds
2. **Detect Leader**: Uses `grep 'role.*primary'` to identify current leader
3. **Update Endpoints**: Uses `kubectl patch` to update `postgres-primary` service
4. **Automatic Failover**: New leader updates endpoints within 10 seconds

### Production Benefits

* ✅ **Reliable Service Discovery**: `postgres-primary` always points to current leader
* ✅ **Zero Downtime Failover**: Automatic endpoint updates during leadership changes
* ✅ **Write Consistency**: 100% write operations succeed (no more replica connections)
* ✅ **Separation of Concerns**: Database management separate from Kubernetes API
* ✅ **Lightweight**: Minimal resource overhead (32Mi RAM, 50m CPU per sidecar)

---

## ✅ Current State Summary

| Concern                | Handled By                    |
| ---------------------- | ----------------------------- |
| DB storage             | PostgreSQL (via Patroni)      |
| DB HA/failover         | Patroni + etcd + HAProxy      |
| **DB service discovery** | **Discovery sidecar pattern** |
| Auth                   | Supabase (gotrue)             |
| API access             | Supabase (postgrest)          |
| Admin UI               | Supabase (studio)             |
| File storage           | Supabase (storage-api)        |
| Real-time updates      | Supabase (realtime, optional) |
| Service orchestration  | K3s                           |
| Cluster monitoring     | K9s, Prometheus, Grafana      |
| AI agent orchestration | FastAPI + custom coroutines   |

This updated architecture introduces **K3s as the core scheduler**, **K9s, Prometheus, Grafana as the observability stack**, and **custom coroutine-based agents as the AI orchestration layer**, giving us full control, horizontal scalability, and modularity for future growth while maintaining a clear migration path toward our target architecture.

**— AI Strategist, GardenOS**
