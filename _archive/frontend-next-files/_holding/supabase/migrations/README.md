# Database Migration System

This directory contains the database migration system for the CRM application. It follows a structured approach to manage schema changes and ensure consistency across environments.

## Directory Structure

- `applied/`: Migrations that have been applied to the production database
- `pending/`: Migrations waiting to be applied
- `archive/`: Historical migrations that have been incorporated into the consolidated schema
- `consolidated_schema.sql`: The complete database schema (for reference only)

## Migration Naming Convention

Migrations should be named using the following format:

```
YYYYMMDD_description.sql
```

For example:
- `20230512_add_ringcentral_tokens.sql`
- `20230601_add_pipeline_statuses.sql`

Each migration should also have a corresponding rollback script:

```
YYYYMMDD_rollback_description.sql
```

## Migration Process

### Creating a New Migration

1. Create a new SQL file in the `pending/` directory following the naming convention
2. Include a transaction to ensure atomicity:

```sql
-- Migration: Add new table for tracking email templates
BEGIN;

-- Record this migration
INSERT INTO schema_versions (version, description)
VALUES ('20230601_add_email_templates', 'Add email templates table');

-- Your schema changes here
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMIT;
```

3. Create a corresponding rollback script:

```sql
-- Rollback: Add new table for tracking email templates
BEGIN;

-- Mark migration as rolled back
UPDATE schema_versions 
SET is_active = FALSE, rolled_back_at = NOW()
WHERE version = '20230601_add_email_templates';

-- Your rollback logic here
DROP TABLE IF EXISTS email_templates;

COMMIT;
```

### Applying Migrations

1. Connect to the database
2. Check which migrations have been applied:

```sql
SELECT version, applied_at, is_active
FROM schema_versions
ORDER BY applied_at;
```

3. Apply pending migrations in chronological order
4. Move applied migrations from `pending/` to `applied/`

### Rolling Back Migrations

1. Run the corresponding rollback script
2. Verify the rollback was successful
3. Move the migration back to `pending/` if needed

## Schema Versions Table

The `schema_versions` table tracks which migrations have been applied:

```sql
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rolled_back_at TIMESTAMP WITH TIME ZONE
);
```

## Consolidated Schema

The `consolidated_schema.sql` file contains the complete database schema. It is provided for reference and as a baseline for new environments. It includes:

- All tables, indexes, and relationships
- Conditional logic to handle different database states
- Support for the hybrid storage model with JSONB fields

**Note**: The consolidated schema should not be used for migrations in an existing database. Use the migration system instead.

## Best Practices

1. **One Change Per Migration**: Each migration should make a single logical change
2. **Always Include Rollback**: Every migration should have a corresponding rollback script
3. **Test Before Applying**: Test migrations in a development environment before applying to production
4. **Document Changes**: Include a clear description of what the migration does
5. **Use Transactions**: Wrap migrations in transactions to ensure atomicity
6. **Check Constraints**: Add appropriate constraints and indexes
7. **Consider Performance**: Be mindful of the impact of schema changes on performance

## Hybrid Storage Model

Our database follows a hybrid storage model with:

- Core, frequently queried fields as dedicated columns
- Variable, dynamic data in JSONB fields
- Flexible metadata fields for future extensions

When creating migrations, consider whether new fields should be added as:
- Dedicated columns (for core, frequently queried fields)
- JSONB paths (for variable, dynamic data)

## Example Migration

```sql
-- Migration: Add customer satisfaction tracking
BEGIN;

-- Record this migration
INSERT INTO schema_versions (version, description)
VALUES ('20230615_add_customer_satisfaction', 'Add customer satisfaction tracking');

-- Add satisfaction_score column to support_tickets
ALTER TABLE support_tickets ADD COLUMN satisfaction_score INTEGER;

-- Add satisfaction_survey JSONB field for detailed feedback
ALTER TABLE support_tickets ADD COLUMN satisfaction_survey JSONB;

-- Create index for querying by satisfaction score
CREATE INDEX idx_support_tickets_satisfaction_score 
ON support_tickets(satisfaction_score);

COMMIT;
```
