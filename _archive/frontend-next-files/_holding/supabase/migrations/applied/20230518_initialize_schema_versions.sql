-- Migration: Initialize schema_versions table and record consolidated schema
BEGIN;

-- Create schema_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rolled_back_at TIMESTAMP WITH TIME ZONE
);

-- Record this migration
INSERT INTO schema_versions (version, description)
VALUES ('20230518_initialize_schema_versions', 'Initialize schema_versions table');

-- Record the consolidated schema as applied
INSERT INTO schema_versions (version, description)
VALUES ('20230518_consolidated_schema', 'Applied consolidated schema with all tables and relationships');

-- Record historical migrations as applied
INSERT INTO schema_versions (version, description, applied_at)
VALUES 
  ('20230512_ringcentral_tokens', 'Add RingCentral tokens table', '2023-05-12 00:00:00+00'),
  ('20250501_add_pipelines', 'Add pipeline management functionality', '2023-05-18 00:00:00+00'),
  ('20250502_optimize_indexes', 'Optimize database indexes', '2023-05-18 00:00:00+00'),
  ('20250503_optimize_alpha_page', 'Optimize alpha page performance', '2023-05-18 00:00:00+00');

COMMIT;
