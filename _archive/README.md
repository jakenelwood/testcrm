# 📁 Archive Directory

This directory contains legacy deployment configurations that are no longer actively used but preserved for reference.

## 📋 **Archived Directories:**

### **gardenos-dev/**
- **Purpose:** Original local development setup
- **Contents:** 
  - Local Docker Compose configuration
  - Python services (CSV import)
  - Supabase local setup
  - Development scripts
- **Status:** Replaced by consolidated `deployment/` directory
- **Archived:** June 3, 2025

### **gardenos-dev-hetzner/**
- **Purpose:** Production-specific configurations
- **Contents:**
  - Production Patroni configurations (`patroni-*-prod.yml`)
  - Production HAProxy configuration (`haproxy-prod.cfg`)
  - Production Docker Compose setup
- **Status:** May be useful for future production deployment
- **Archived:** June 3, 2025

## 🎯 **Current Active Directory:**

The active deployment configuration is now in:
```
/deployment/
```

This consolidated directory contains:
- ✅ Development configurations for Hetzner deployment
- ✅ Patroni cluster setup (3 nodes)
- ✅ HAProxy load balancer configuration
- ✅ Supabase services configuration
- ✅ FastAPI backend
- ✅ PostgreSQL initialization scripts

## 🔄 **Migration Notes:**

- **Scripts updated:** All deployment scripts now point to `deployment/` directory
- **Server path:** `/opt/gardenos-dev/deployment/` on Hetzner server
- **Local path:** `deployment/` in project root

## 🗂️ **File Organization:**

The consolidation follows the principle: **"As simple as possible, but no simpler"**

- **Before:** 3 confusing directories with overlapping purposes
- **After:** 1 clear `deployment/` directory + archived legacy configs
