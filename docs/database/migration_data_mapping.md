# 🗺️ Schema Migration Data Mapping

## Overview
This document maps the prior insurance-focused schema to the current unified AI-native schema that has been successfully implemented based on the optimization report recommendations.

## Prior Schema → Current Schema Mapping

### Core Entity Transformation

#### 1. Multi-Tenancy Foundation
**Prior State**: No multi-tenancy
**Current State**: Workspace-based isolation

```sql
-- NEW: workspaces table
CREATE TABLE workspaces (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name TEXT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration: Create default workspace for existing data
INSERT INTO workspaces (name) VALUES ('Default Insurance Agency');
```

#### 2. User Management
**Prior**: `users` table (basic structure)
**Current**: Enhanced users with workspace reference

| Prior Field | Current Field | Transformation |
|---------------|--------------|----------------|
| id | id | Direct copy |
| email | email | Direct copy |
| full_name | full_name | Direct copy |
| role | role | Direct copy |
| - | workspace_id | Set to default workspace UUID |

#### 3. Unified Contact Model
**Prior**: Separate `clients` and `leads` tables
**Current**: Single `contacts` table with lifecycle stages

##### Clients → Contacts Mapping
| Prior Field (clients) | Current Field (contacts) | Transformation |
|-------------------------|-------------------------|----------------|
| id | id | Direct copy |
| name | first_name + last_name | Parse full name |
| email | email | Direct copy |
| phone_number | phone | Direct copy |
| client_type | account_id | If 'Business' → create account record |
| date_of_birth | custom_fields.date_of_birth | Move to JSONB |
| gender | custom_fields.gender | Move to JSONB |
| marital_status | custom_fields.marital_status | Move to JSONB |
| drivers_license | custom_fields.drivers_license | Move to JSONB |
| business_type | account.industry | If business client |
| industry | account.industry | If business client |
| ai_summary | summary_embedding | Generate embedding |
| - | lifecycle_stage | Set to 'customer' |
| - | workspace_id | Set to default workspace |

##### Leads → Contacts Mapping
| Prior Field (leads) | Current Field (contacts) | Transformation |
|----------------------|-------------------------|----------------|
| client_id | id | Use client_id if exists, else generate new |
| - | first_name + last_name | Extract from client.name |
| - | email | From linked client record |
| - | phone | From linked client record |
| status_id | lifecycle_stage | Map to enum values |
| ai_summary | summary_embedding | Generate embedding |
| - | workspace_id | Set to default workspace |

#### 4. Account Creation (B2B)
**Prior**: Business data mixed in clients table
**Current**: Separate accounts table

```sql
-- Create accounts for business clients
INSERT INTO accounts (workspace_id, name, industry, custom_fields)
SELECT 
  default_workspace_id,
  name,
  industry,
  jsonb_build_object(
    'business_type', business_type,
    'tax_id', tax_id,
    'annual_revenue', annual_revenue,
    'number_of_employees', number_of_employees
  )
FROM clients 
WHERE client_type = 'Business';
```

### Activity Stream Transformation

#### 5. Communications → Interactions
**Prior**: `communications` table
**Current**: Partitioned `interactions` table with embeddings

| Prior Field | Current Field | Transformation |
|---------------|--------------|----------------|
| id | id | Direct copy |
| client_id | contact_id | Map to new contact ID |
| type | type | Direct copy |
| content | content | Direct copy |
| - | embedding | Generate from content |
| created_at | interacted_at | Direct copy |
| - | workspace_id | Set to default workspace |

### Insurance-Specific Data Preservation

#### 6. Asset Tables Integration
**Prior**: `homes`, `vehicles`, `specialty_items`
**Current**: Link to unified contacts

| Prior Reference | Current Reference | Transformation |
|------------------|------------------|----------------|
| client_id | contact_id | Map to new contact structure |
| lead_id | contact_id | Map to new contact structure |

#### 7. Insurance Data in Opportunities
**Prior**: Premium data scattered in leads
**Current**: Structured opportunities for quotes/policies

```sql
-- Create opportunities for existing leads with premium data
INSERT INTO opportunities (workspace_id, name, contact_id, amount, stage, custom_fields)
SELECT 
  default_workspace_id,
  'Insurance Quote - ' || c.name,
  new_contact_id,
  COALESCE(l.premium, l.auto_premium + l.home_premium),
  CASE 
    WHEN l.sold_at IS NOT NULL THEN 'closed_won'
    WHEN l.lost_at IS NOT NULL THEN 'closed_lost'
    ELSE 'qualification'
  END,
  jsonb_build_object(
    'insurance_type_id', l.insurance_type_id,
    'auto_premium', l.auto_premium,
    'home_premium', l.home_premium,
    'auto_data', l.auto_data,
    'home_data', l.home_data
  )
FROM leads l
JOIN clients c ON l.client_id = c.id;
```

## Migration Phases

### Phase 1: Foundation
1. Create workspaces table
2. Add workspace_id to all tables
3. Create default workspace
4. Update RLS policies

### Phase 2: Core Entities
1. Create accounts table
2. Create contacts table
3. Migrate business clients → accounts
4. Migrate all clients → contacts
5. Migrate leads → contacts (merge with existing)

### Phase 3: AI Infrastructure
1. Enable pgvector
2. Add embedding columns
3. Create partitioned interactions
4. Migrate communications data
5. Generate initial embeddings

### Phase 4: Relationships
1. Update asset table references
2. Create opportunities from leads
3. Update all foreign keys
4. Verify data integrity

## Data Validation Checkpoints

### Pre-Migration Counts
```sql
SELECT 'clients' as table_name, COUNT(*) as count FROM clients
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'communications', COUNT(*) FROM communications;
```

### Post-Migration Validation
```sql
-- Verify no data loss
SELECT 'contacts' as table_name, COUNT(*) as count FROM contacts
UNION ALL
SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'interactions', COUNT(*) FROM interactions;

-- Verify relationships
SELECT COUNT(*) as business_contacts_with_accounts
FROM contacts c
JOIN accounts a ON c.account_id = a.id;
```

## Rollback Strategy

### Backup Tables
```sql
-- Create backup tables before migration
CREATE TABLE clients_backup AS SELECT * FROM clients;
CREATE TABLE leads_backup AS SELECT * FROM leads;
CREATE TABLE communications_backup AS SELECT * FROM communications;
```

### Rollback Procedure
1. Drop new tables (contacts, accounts, interactions)
2. Restore from backup tables
3. Remove workspace_id columns
4. Restore original RLS policies

## Risk Mitigation

### High-Risk Areas
1. **Data Loss**: Complex client/lead relationships
2. **Performance**: Large communications table migration
3. **Downtime**: Schema changes require application updates

### Mitigation Strategies
1. **Staging Environment**: Full migration testing
2. **Incremental Migration**: Phase-by-phase approach
3. **Validation Scripts**: Automated data integrity checks
4. **Rollback Plan**: Tested recovery procedures

---

## ✅ Migration Status: COMPLETED

**Date Completed**: August 15, 2025
**Schema Version**: Unified v2.0.0
**Status**: Successfully implemented and validated

### Completed Components:
- ✅ **Database Schema**: Unified schema deployed and tested
- ✅ **API Layer**: Contacts and opportunities APIs refactored
- ✅ **Multi-tenancy**: Workspace isolation implemented
- ✅ **Data Validation**: Health checks and API tests passing
- ✅ **Documentation**: Complete lead journey mapping created

### Next Phase: Frontend Migration
The backend unified schema is now the source of truth. Next steps involve updating the frontend components to use the new API structure as outlined in the [Kanban Board Migration Guide](./Kanban_Board_Migration_Guide.md).
