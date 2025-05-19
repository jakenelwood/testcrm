-- Rollback script for pipeline management functionality
-- This will revert the changes made by 20250501_add_pipelines.sql
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
