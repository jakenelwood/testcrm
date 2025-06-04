# 🧠 GardenOS Architecture: Complete System Overview

## 🎯 Purpose of This Document

This comprehensive guide clarifies the roles of **Supabase** and **Patroni** in our GardenOS architecture for Augment and collaborators, covering current implementation, integration strategy, and long-term evolution plans for our high-availability, AI-native CRM platform.

---

## 🧱 Core Architecture Overview

We are building **GardenOS**, a high-availability CRM stack self-hosted on Hetzner with the following components:

| Layer                | Technology           | Role                                                 |
| -------------------- | -------------------- | ---------------------------------------------------- |
| **Database**         | PostgreSQL (Patroni) | Core data layer with high availability and failover  |
| **Coordination**     | etcd                 | Manages cluster state and leader election            |
| **Routing**          | HAProxy              | Routes requests to the current PostgreSQL leader     |
| **Platform Tools**   | Supabase             | Provides Auth, REST API, Realtime, Storage, Admin UI |
| **Backend Services** | FastAPI              | Orchestrates AI agents, APIs, and automation logic   |

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

👊 Patroni ensures that Supabase is always talking to a healthy, current Postgres node.

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

👊 Supabase connects to Postgres **via HAProxy**, not directly. It doesn't manage the DB — it interacts with it.

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

## 🔁 Integration Summary: Supabase + Patroni in Practice

* **Patroni** = **brain and memory** (Postgres engine, HA, replication)
* **Supabase** = **face and interface** (auth, API, storage, realtime)

They operate **independently but symbiotically**:

1. **PostgreSQL is the brain.** Patroni makes it reliable, scalable, and HA.
2. **Supabase connects to it** via HAProxy and provides auth + tools.
3. **Your app (FastAPI, AI agents)** also connects to the database through HAProxy.
4. **Everything authenticates through Supabase Auth**, with JWTs propagated to services.

* Supabase doesn't manage or control Patroni
* Patroni ensures Supabase always has a reliable database

---

## 🚧 Current Challenges & Evolution Strategy

Supabase helped us launch quickly, but we've identified limitations for long-term scalability:

### Problems Identified:

* GoTrue is not robust enough for advanced enterprise features
* Supabase analytics service (`logflare`) fails easily
* Admin UI (Studio) breaks without analytics
* Auth customization is limited

### Why This Setup Works Now:

* Decouples storage (Patroni) from interface/API/auth (Supabase)
* Lets you swap Supabase later without losing data or logic
* Provides high availability, modern auth, and self-hosted control
* Cleanly separates concerns across layers

---

## Modular Evolution Strategy

We're preparing for long-term scalability, resilience, and modular control with a phased approach:

### ✅ Phase 1: Use Supabase Minus Analytics

* Disable analytics container
* Keep using gotrue for auth and postgrest for simple CRUD

### 🚧 Phase 2: Replace PostgREST with FastAPI

* Move API routing and logic to FastAPI
* Maintain pgvector, RLS, and JWT decoding in FastAPI

### 🚪 Phase 3: Replace Supabase Auth (Optional)

**Options:**

* Ory Kratos (highly customizable)
* Authentik (modern UI, SSO support)
* FastAPI + Authlib (custom)

### 📦 Phase 4: Replace Supabase Storage

**Options:**

* MinIO (S3-compatible and self-hosted)
* Bunny.net or Wasabi for low-cost offsite storage

### 🛠️ Phase 5: Build Custom Admin Panel

* Replace Studio with your own UI (React + ShadCN)
* Integrate directly with Postgres via FastAPI

---

## 🚀 Long-Term Vision

Our end goal is a fully modular, AI-native architecture:

### Target Benefits:

* 🧠 Fully AI-native: all logic flows through FastAPI + LangGraph agents
* 📊 Infrastructure as building blocks, not a monolith
* 🛡️ Enterprise-ready auth + audit trails
* 🔧 Zero reliance on Elixir/Logflare for diagnostics
* 💬 Human-friendly troubleshooting (logs via Loki/Grafana stack)

### Final Architecture:

* **Patroni** for HA PostgreSQL
* **FastAPI** for backend
* **pgvector** for AI memory
* **Modular replacements** for Supabase components

---

## ✅ Current State Summary

| Concern           | Handled By                    |
| ----------------- | ----------------------------- |
| DB storage        | PostgreSQL (via Patroni)      |
| DB HA/failover    | Patroni + etcd + HAProxy      |
| Auth              | Supabase (gotrue)             |
| API access        | Supabase (postgrest)          |
| Admin UI          | Supabase (studio)             |
| File storage      | Supabase (storage-api)        |
| Real-time updates | Supabase (realtime, optional) |

This setup gives us full control, horizontal scalability, and modularity for future growth while maintaining a clear migration path toward our target architecture.

**— AI Strategist, GardenOS**
