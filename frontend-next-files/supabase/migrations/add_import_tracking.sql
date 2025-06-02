-- Migration: Add import tracking fields to leads tables
-- Date: 2025-01-16
-- Description: Add source and import_file_name columns to track lead origins

-- Add columns to leads_ins_info table (main leads table)
ALTER TABLE leads_ins_info 
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS import_file_name TEXT;

-- Add columns to leads_contact_info table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads_contact_info' AND table_schema = 'public') THEN
        ALTER TABLE leads_contact_info 
        ADD COLUMN IF NOT EXISTS source TEXT,
        ADD COLUMN IF NOT EXISTS import_file_name TEXT;
    END IF;
END $$;

-- Add comments to document the new columns
COMMENT ON COLUMN leads_ins_info.source IS 'Source of the lead (e.g., CSV Import, Manual Entry, Web Form, API)';
COMMENT ON COLUMN leads_ins_info.import_file_name IS 'Name of the file used for import (if applicable)';

-- Create an index on source for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_ins_info_source ON leads_ins_info(source);

-- Update any existing leads to have a default source
UPDATE leads_ins_info 
SET source = 'Manual Entry' 
WHERE source IS NULL;

-- Set source as NOT NULL with default value for future records
ALTER TABLE leads_ins_info 
ALTER COLUMN source SET DEFAULT 'Manual Entry';
