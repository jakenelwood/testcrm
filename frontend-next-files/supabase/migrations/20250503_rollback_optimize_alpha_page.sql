-- Rollback script for Alpha page optimization
-- This will remove the indexes created in 20250503_optimize_alpha_page.sql

-- Drop the composite index for pipeline filtering and sorting by created_at
DROP INDEX IF EXISTS idx_leads_pipeline_created_at;

-- Drop indexes for foreign key joins
DROP INDEX IF EXISTS idx_leads_client_id;
DROP INDEX IF EXISTS idx_leads_status_id;
DROP INDEX IF EXISTS idx_leads_insurance_type_id;

-- Drop trigram indexes for text search
DROP INDEX IF EXISTS idx_clients_name_trgm;
DROP INDEX IF EXISTS idx_clients_email_trgm;
DROP INDEX IF EXISTS idx_clients_phone_trgm;

-- Note: We're not dropping the pg_trgm extension as it might be used by other features
-- If you want to drop it, uncomment the line below:
-- DROP EXTENSION IF EXISTS pg_trgm;
