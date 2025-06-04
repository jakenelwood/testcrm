-- Migration to add indexes for optimizing query performance
-- Based on Supabase Inspect recommendations

-- Add index for pipeline_id filtering (used in fetchLeadsByPipeline)
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_id ON leads(pipeline_id);

-- Add composite index for pipeline filtering and sorting by created_at
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_created_at ON leads(pipeline_id, created_at DESC);

-- Add index for client_id joins
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);

-- Add index for status_id joins
CREATE INDEX IF NOT EXISTS idx_leads_status_id ON leads(status_id);

-- Add index for insurance_type_id joins
CREATE INDEX IF NOT EXISTS idx_leads_insurance_type_id ON leads(insurance_type_id);

-- Add index for searching leads by name (used in search functionality)
CREATE INDEX IF NOT EXISTS idx_clients_name_trigram ON clients USING gin(name gin_trig_ops);

-- Add index for searching leads by email
CREATE INDEX IF NOT EXISTS idx_clients_email_trigram ON clients USING gin(email gin_trig_ops);

-- Add index for searching leads by phone number
CREATE INDEX IF NOT EXISTS idx_clients_phone_trigram ON clients USING gin(phone_number gin_trig_ops);

-- Make sure the pg_trgm extension is enabled for trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add comment to document the purpose of these indexes
COMMENT ON INDEX idx_leads_pipeline_id IS 'Optimizes filtering leads by pipeline';
COMMENT ON INDEX idx_leads_pipeline_created_at IS 'Optimizes filtering by pipeline and sorting by creation date';
COMMENT ON INDEX idx_leads_client_id IS 'Optimizes joins between leads and clients';
COMMENT ON INDEX idx_leads_status_id IS 'Optimizes joins between leads and statuses';
COMMENT ON INDEX idx_leads_insurance_type_id IS 'Optimizes joins between leads and insurance types';
COMMENT ON INDEX idx_clients_name_trigram IS 'Optimizes searching clients by name using trigram matching';
COMMENT ON INDEX idx_clients_email_trigram IS 'Optimizes searching clients by email using trigram matching';
COMMENT ON INDEX idx_clients_phone_trigram IS 'Optimizes searching clients by phone using trigram matching';
