# 🌱 GardenOS Database Schema Summary

This document provides a summary of the database schema, automatically generated on Tue Jun  3 01:33:03 PM CDT 2025.

## 📊 Tables

### From file: `./database/schema/schema_comprehensive_enhancement.sql`

```sql

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,


CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,


CREATE TABLE user_location_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

DROP TABLE IF EXISTS vehicles CASCADE;
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),


CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),


CREATE TABLE driver_vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

DROP TABLE IF EXISTS homes CASCADE;
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),

DROP TABLE IF EXISTS quotes CASCADE;
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id),


CREATE TABLE quote_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,


CREATE TABLE quote_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id),
```

### From file: `./database/schema/fix_drivers_table.sql`

```sql

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),


CREATE TABLE driver_vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
```

### From file: `./database/schema/schema_add_winback.sql`

```sql

CREATE TABLE winbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  


CREATE TABLE winback_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
```

### From file: `./database/schema/schema_followup_management.sql`

```sql

CREATE TABLE follow_up_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  


CREATE TABLE lead_hibernation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,


CREATE TABLE follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follow_up_schedule_id UUID NOT NULL REFERENCES follow_up_schedules(id) ON DELETE CASCADE,


CREATE TABLE follow_up_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),


CREATE TABLE pipeline_automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),


CREATE TABLE follow_up_execution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follow_up_schedule_id UUID REFERENCES follow_up_schedules(id),
```

### From file: `./database/schema/schema_comprehensive_part2.sql`

```sql
DROP TABLE IF EXISTS policies CASCADE;
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,


CREATE TABLE commercial_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),


CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
```

### From file: `./database/schema/schema_fix_leads_clients.sql`

```sql

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  


CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  


CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
```

### From file: `./database/schema/marketing_data_enhancement.sql`

```sql

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,


CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),


CREATE TABLE communication_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  communication_id UUID NOT NULL REFERENCES communications(id),


CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,


CREATE TABLE customer_touchpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),


CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
```

### From file: `./database/schema/hetzner_optimized_schema.sql`

```sql

CREATE TABLE lead_statuses (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,


CREATE TABLE insurance_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,


CREATE TABLE pipelines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,


CREATE TABLE pipeline_statuses (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,


CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  street TEXT,


CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,


CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_type TEXT NOT NULL CHECK (client_type IN ('Individual', 'Business')),


CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,


CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,


CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,


CREATE TABLE agent_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,


CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES ai_agents(id),


CREATE TABLE schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,


CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),


CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),


CREATE TABLE homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),


CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),


CREATE TABLE specialty_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),


CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id),


CREATE TABLE ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),


CREATE TABLE user_phone_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
```

### From file: `./database/schema/database_schema_index.sql`

```sql

CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,


CREATE TABLE IF NOT EXISTS specialty_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,


CREATE TABLE IF NOT EXISTS other_insureds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,


CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT NOT NULL,


CREATE TABLE IF NOT EXISTS homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,


CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,


CREATE TABLE IF NOT EXISTS specialty_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,


CREATE TABLE IF NOT EXISTS other_insureds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,


CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT NOT NULL,


CREATE TABLE IF NOT EXISTS homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,

COMMENT ON TABLE homes IS 'Stores home information'; 
CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
```

### From file: `./database/schema/current_schema.sql`

```sql
```

