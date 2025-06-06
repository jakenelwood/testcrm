-- Migration to optimize Alpha page performance
-- Based on Supabase Inspect analysis

-- Add composite index for pipeline filtering and sorting by created_at
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_created_at ON leads(pipeline_id, created_at DESC);

-- Add indexes for foreign key joins
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_id ON leads(status_id);
CREATE INDEX IF NOT EXISTS idx_leads_insurance_type_id ON leads(insurance_type_id);

-- Make sure the pg_trgm extension is enabled for trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes for text search
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_email_trgm ON clients USING gin(email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm ON clients USING gin(phone_number gin_trgm_ops);

-- Add comment to document the purpose of these indexes
COMMENT ON INDEX idx_leads_pipeline_id IS 'Optimizes filtering leads by pipeline';
COMMENT ON INDEX idx_leads_pipeline_created_at IS 'Optimizes filtering by pipeline and sorting by creation date';
COMMENT ON INDEX idx_leads_client_id IS 'Optimizes joins between leads and clients';
COMMENT ON INDEX idx_leads_status_id IS 'Optimizes joins between leads and statuses';
COMMENT ON INDEX idx_leads_insurance_type_id IS 'Optimizes joins between leads and insurance types';
COMMENT ON INDEX idx_clients_name_trgm IS 'Optimizes searching clients by name using trigram matching';
COMMENT ON INDEX idx_clients_email_trgm IS 'Optimizes searching clients by email using trigram matching';
COMMENT ON INDEX idx_clients_phone_trgm IS 'Optimizes searching clients by phone using trigram matching';
