# Pipeline Management Feature: Database Migration Process

This document outlines the process for safely implementing and potentially rolling back the pipeline management feature database changes.

## Table of Contents
1. [Pre-Migration Steps](#pre-migration-steps)
2. [Migration Process](#migration-process)
3. [Testing Process](#testing-process)
4. [Rollback Process](#rollback-process)
5. [Feature Deployment](#feature-deployment)
6. [Troubleshooting](#troubleshooting)

## Pre-Migration Steps

### 1. Create a Full Database Backup

```sql
-- Run this in Supabase SQL Editor before applying any changes
SELECT pg_dump_table('public');

-- Save the output to a file named 'pre_pipeline_feature_backup.sql'
```

### 2. Create a Schema Versions Table (if not exists)

```sql
-- Create a schema_versions table to track migrations
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rolled_back_at TIMESTAMP WITH TIME ZONE
);
```

## Migration Process

### 1. Prepare the Migration Script

Save the following as `20250501_add_pipelines.sql`:

```sql
-- Migration to add pipeline management functionality
BEGIN;

-- Record this migration in schema_versions
INSERT INTO schema_versions (version, description)
VALUES ('20250501_add_pipelines', 'Add pipeline management functionality');

-- Create pipelines table
CREATE TABLE pipelines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pipeline_statuses table
CREATE TABLE pipeline_statuses (
  id SERIAL PRIMARY KEY,
  pipeline_id INT REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  display_order INT NOT NULL,
  color_hex TEXT,                      -- For UI display (e.g., #FF5733)
  icon_name TEXT,                      -- For UI display (e.g., 'phone', 'document')
  ai_action_template TEXT,             -- Template for AI-suggested actions at this status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique status names within a pipeline
  UNIQUE(pipeline_id, name)
);

-- Add pipeline_id to leads table
ALTER TABLE leads ADD COLUMN pipeline_id INT REFERENCES pipelines(id);

-- Create a default pipeline
INSERT INTO pipelines (name, description, is_default, display_order)
VALUES ('Default Sales Pipeline', 'Standard sales pipeline for insurance leads', TRUE, 1);

-- Migrate existing lead_statuses to pipeline_statuses for the default pipeline
INSERT INTO pipeline_statuses (
  pipeline_id,
  name,
  description,
  is_final,
  display_order,
  color_hex,
  icon_name,
  ai_action_template
)
SELECT
  1 as pipeline_id, -- Default pipeline ID
  value as name,
  description,
  is_final,
  display_order,
  color_hex,
  icon_name,
  ai_action_template
FROM lead_statuses;

-- Update leads to use the default pipeline
UPDATE leads SET pipeline_id = 1;

-- Make pipeline_id NOT NULL after migration
ALTER TABLE leads ALTER COLUMN pipeline_id SET NOT NULL;

-- Create index for faster lookups
CREATE INDEX idx_leads_pipeline_id ON leads(pipeline_id);
CREATE INDEX idx_pipeline_statuses_pipeline_id ON pipeline_statuses(pipeline_id);

COMMIT;
```

### 2. Prepare the Rollback Script

Save the following as `20250501_rollback_pipelines.sql`:

```sql
-- Rollback script for pipeline management functionality
BEGIN;

-- Update schema_versions to mark this migration as rolled back
UPDATE schema_versions
SET is_active = FALSE, rolled_back_at = NOW()
WHERE version = '20250501_add_pipelines';

-- Drop the indexes
DROP INDEX IF EXISTS idx_pipeline_statuses_pipeline_id;
DROP INDEX IF EXISTS idx_leads_pipeline_id;

-- Remove the NOT NULL constraint from pipeline_id
ALTER TABLE leads ALTER COLUMN pipeline_id DROP NOT NULL;

-- Update leads to remove pipeline_id reference
UPDATE leads SET pipeline_id = NULL;

-- Drop the foreign key constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_pipeline_id_fkey;

-- Drop the pipeline_id column from leads
ALTER TABLE leads DROP COLUMN IF EXISTS pipeline_id;

-- Drop the pipeline_statuses table
DROP TABLE IF EXISTS pipeline_statuses;

-- Drop the pipelines table
DROP TABLE IF EXISTS pipelines;

COMMIT;
```

### 3. Apply the Migration

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of the `20250501_add_pipelines.sql` file
4. Run the SQL script
5. Verify that the script executed without errors

## Testing Process

### 1. Verify Database Changes

```sql
-- Check that the pipelines table was created
SELECT * FROM pipelines;

-- Check that the pipeline_statuses table was created
SELECT * FROM pipeline_statuses;

-- Check that leads have pipeline_id values
SELECT COUNT(*) FROM leads WHERE pipeline_id IS NULL;
```

### 2. Test Application Features

1. Navigate to `/dashboard/pipelines` in your application
2. Verify that the default pipeline appears
3. Create a new pipeline
4. Add statuses to the new pipeline
5. Navigate to the leads page
6. Verify that the pipeline selector works
7. Test changing between pipelines

### 3. Test Edge Cases

1. Try creating a pipeline with no statuses
2. Try creating a status with the same name in the same pipeline
3. Try deleting a pipeline that has leads assigned to it
4. Test with a large number of pipelines and statuses

## Rollback Process

If issues are discovered and you need to roll back the changes:

### 1. Apply the Rollback Script

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of the `20250501_rollback_pipelines.sql` file
4. Run the SQL script
5. Verify that the script executed without errors

### 2. Verify Rollback

```sql
-- Verify that the pipelines table no longer exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'pipelines'
);

-- Verify that the pipeline_statuses table no longer exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'pipeline_statuses'
);

-- Verify that the pipeline_id column no longer exists in leads
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'leads'
AND column_name = 'pipeline_id';
```

### 3. Update Application Code

1. Revert the feature branch changes:
   ```bash
   git checkout main
   git branch -D feature/pipeline-management
   ```

2. Or implement feature flags to disable the pipeline management UI while keeping the code:
   ```typescript
   // In config/features.ts
   export const FEATURES = {
     PIPELINE_MANAGEMENT: false
   };
   ```

## Feature Deployment

Once testing is complete and the feature is working correctly:

1. Create a pull request to merge the `feature/pipeline-management` branch into `main`
2. Have the PR reviewed by another developer
3. Merge the PR
4. Deploy the application
5. Monitor for any issues

## Troubleshooting

### Common Issues and Solutions

1. **Migration fails due to existing data**
   - Check for NULL values in required fields
   - Verify foreign key constraints

2. **Rollback fails**
   - Check for dependencies on the pipeline tables
   - May need to manually remove references

3. **UI doesn't reflect database changes**
   - Clear browser cache
   - Restart the development server
   - Check for TypeScript errors

4. **Performance issues**
   - Check that indexes were created correctly
   - Monitor query performance

### Emergency Restore

If all else fails, restore from the full backup:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of your `pre_pipeline_feature_backup.sql` file
4. Run the SQL script

---

By following this process, you can safely implement the pipeline management feature and have multiple options for rolling back if issues arise.
