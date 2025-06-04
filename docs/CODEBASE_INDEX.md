# 🌱 GardenOS Codebase Index

This document provides a comprehensive index of the GardenOS codebase, organized by functional areas.

## 🚀 Deployment Scripts

### Hetzner Server Management
- `scripts/deploy-gardenos-dev-to-hetzner.sh` - Deploy development environment to Hetzner
- `scripts/deploy-gardenos-prod-to-hetzner.sh` - Deploy production environment to Hetzner
- `scripts/update-and-restart-hetzner.sh` - Update and restart services on Hetzner
- `scripts/monitor-hetzner-deployment.sh` - Monitor deployment status and health
- `scripts/setup-local-for-hetzner-gardenos.sh` - Configure local environment for Hetzner

### Supabase Setup
- `scripts/setup-supabase-on-hetzner.sh` - Set up Supabase services on Hetzner

## 📊 Database

### Schema
- `database/schema/hetzner_optimized_schema.sql` - Optimized schema for Hetzner deployment

### Migrations
- `database/migrations/deploy_hetzner_db.sh` - Deploy database schema to Hetzner

## ⚙️ Configuration

### Environment Files
- `.env.local.hetzner-gardenos` - Local environment for connecting to Hetzner
- `deployment/.env.development` - Development environment variables

### Application Config
- `config/index.ts` - Central configuration module for the application

## 📝 Documentation

### Architecture
- `docs/database/gardenOS_dev_vs_production.md` - Development vs. production architecture
- `docs/database/supabase_patroni_strategy_roles.md` - Database strategy and roles
- `docs/deployment/GARDENOS_HETZNER_IMPLEMENTATION.md` - Hetzner implementation guide
- `docs/deployment/HETZNER_SUPABASE_SETUP.md` - Supabase setup on Hetzner
- `deployment/DEPLOYMENT_README.md` - Deployment instructions

### Archive
- `docs/_archive/hetzner_deployment_plan.md` - Original deployment planning document

## 🏗️ Infrastructure

### Docker Compose
- `deployment/docker-compose.yml` - Docker Compose configuration for services

### HAProxy
- `deployment/haproxy/haproxy-dev.cfg` - HAProxy configuration for development
- `deployment/haproxy/haproxy.cfg` - HAProxy configuration for production

### Patroni
- `deployment/patroni/patroni-1-dev.yml` - Patroni node 1 configuration
- `deployment/patroni/patroni-2-dev.yml` - Patroni node 2 configuration
- `deployment/patroni/patroni-3-dev.yml` - Patroni node 3 configuration

## 🔧 Utilities

### Monitoring
- `scripts/monitor-hetzner-deployment-log.txt` - Log of monitoring activities