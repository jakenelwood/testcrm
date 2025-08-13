-- Migration: Resolve Circular Foreign Key Dependency
-- Purpose: Fix circular dependency between clients and leads tables
-- Business Logic: Lead → (conversion) → Client (one-way flow)
-- Date: 2025-01-13

-- =====================================================
-- STEP 1: Verify Current Data Integrity
-- =====================================================

-- Check for orphaned references before migration
DO $$
BEGIN
    -- Check for clients referencing non-existent leads
    IF EXISTS (
        SELECT 1 FROM clients c
        LEFT JOIN leads l ON c.converted_from_lead_id = l.id
        WHERE c.converted_from_lead_id IS NOT NULL AND l.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Found clients with invalid converted_from_lead_id references. Please fix data integrity first.';
    END IF;

    -- Check for leads referencing non-existent clients
    IF EXISTS (
        SELECT 1 FROM leads l
        LEFT JOIN clients c ON l.client_id = c.id
        WHERE l.client_id IS NOT NULL AND c.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Found leads with invalid client_id references. Please fix data integrity first.';
    END IF;

    RAISE NOTICE 'Data integrity check passed. Proceeding with migration.';
END $$;

-- =====================================================
-- STEP 2: Create Backup of Relationship Data
-- =====================================================

-- Create temporary table to backup existing relationships
CREATE TEMP TABLE migration_backup AS
SELECT
    c.id as client_id,
    c.converted_from_lead_id as original_lead_id,
    l.id as lead_id,
    l.client_id as original_client_id,
    l.status as lead_status,
    l.sold_at,
    c.created_at as client_created_at
FROM clients c
FULL OUTER JOIN leads l ON (c.converted_from_lead_id = l.id OR l.client_id = c.id)
WHERE c.converted_from_lead_id IS NOT NULL OR l.client_id IS NOT NULL;

-- Log backup statistics
DO $$
DECLARE
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM migration_backup;
    RAISE NOTICE 'Backed up % relationship records', backup_count;
END $$;

-- =====================================================
-- STEP 3: Add New Conversion Tracking Fields to Leads
-- =====================================================

-- Add conversion tracking fields to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS converted_to_client_id uuid,
ADD COLUMN IF NOT EXISTS conversion_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_converted boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN leads.converted_to_client_id IS 'References the client created from this lead conversion';
COMMENT ON COLUMN leads.conversion_date IS 'Timestamp when lead was converted to client';
COMMENT ON COLUMN leads.is_converted IS 'Flag indicating if lead has been converted to client';

-- =====================================================
-- STEP 4: Migrate Existing Conversion Data
-- =====================================================

-- Update leads with conversion information
UPDATE leads
SET
    converted_to_client_id = c.id,
    conversion_date = COALESCE(leads.sold_at, c.created_at),
    is_converted = true
FROM clients c
WHERE c.converted_from_lead_id = leads.id;

-- Update leads that were linked to existing clients (expansion scenarios)
-- These become "expansion leads" that are not converted yet
UPDATE leads
SET
    converted_to_client_id = NULL,
    conversion_date = NULL,
    is_converted = false
WHERE client_id IS NOT NULL
AND converted_to_client_id IS NULL;

-- Log migration statistics
DO $$
DECLARE
    converted_count INTEGER;
    expansion_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO converted_count FROM leads WHERE is_converted = true;
    SELECT COUNT(*) INTO expansion_count FROM leads WHERE client_id IS NOT NULL AND is_converted = false;
    RAISE NOTICE 'Migrated % converted leads and identified % expansion leads', converted_count, expansion_count;
END $$;

-- =====================================================
-- STEP 5: Remove Circular Foreign Key Constraints
-- =====================================================

-- Drop the circular foreign key constraints
ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_converted_from_lead;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_client_id_fkey;

RAISE NOTICE 'Removed circular foreign key constraints';

-- =====================================================
-- STEP 6: Add Proper One-Way Foreign Key Constraint
-- =====================================================

-- Add proper foreign key constraint for lead conversion tracking
ALTER TABLE leads
ADD CONSTRAINT leads_converted_to_client_id_fkey
FOREIGN KEY (converted_to_client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_leads_converted_to_client_id ON leads(converted_to_client_id);
CREATE INDEX IF NOT EXISTS idx_leads_is_converted ON leads(is_converted);
CREATE INDEX IF NOT EXISTS idx_leads_conversion_date ON leads(conversion_date);

-- =====================================================
-- STEP 7: Remove Old Columns
-- =====================================================

-- Remove the problematic columns
ALTER TABLE clients DROP COLUMN IF EXISTS converted_from_lead_id;
ALTER TABLE leads DROP COLUMN IF EXISTS client_id;

RAISE NOTICE 'Removed old circular reference columns';

-- =====================================================
-- STEP 8: Add Helpful Views for Common Queries
-- =====================================================

-- Create view for lead conversion analysis
CREATE OR REPLACE VIEW lead_conversion_summary AS
SELECT
    l.id as lead_id,
    l.status,
    l.is_converted,
    l.conversion_date,
    l.converted_to_client_id,
    c.name as client_name,
    c.client_type,
    EXTRACT(DAYS FROM (l.conversion_date - l.created_at)) as days_to_conversion
FROM leads l
LEFT JOIN clients c ON l.converted_to_client_id = c.id;

-- Create view for client lead history
CREATE OR REPLACE VIEW client_lead_history AS
SELECT
    c.id as client_id,
    c.name as client_name,
    c.client_type,
    l.id as original_lead_id,
    l.created_at as lead_created_at,
    l.conversion_date,
    l.status as final_lead_status,
    EXTRACT(DAYS FROM (l.conversion_date - l.created_at)) as conversion_days
FROM clients c
LEFT JOIN leads l ON c.id = l.converted_to_client_id;

-- =====================================================
-- STEP 9: Update Contacts Table for Clarity
-- =====================================================

-- Add comments to clarify contacts can link to leads OR clients
COMMENT ON COLUMN contacts.client_id IS 'References client for B2B contacts (nullable)';
COMMENT ON COLUMN contacts.lead_id IS 'References lead for prospect contacts (nullable)';

-- Add constraint to ensure contact links to either lead OR client, not both
ALTER TABLE contacts
ADD CONSTRAINT contacts_lead_or_client_check
CHECK (
    (client_id IS NOT NULL AND lead_id IS NULL) OR
    (client_id IS NULL AND lead_id IS NOT NULL) OR
    (client_id IS NULL AND lead_id IS NULL)
);

-- =====================================================
-- STEP 10: Verification and Cleanup
-- =====================================================

-- Verify migration success
DO $$
DECLARE
    orphaned_conversions INTEGER;
    total_converted INTEGER;
    circular_refs INTEGER;
BEGIN
    -- Check for orphaned conversion references
    SELECT COUNT(*) INTO orphaned_conversions
    FROM leads l
    LEFT JOIN clients c ON l.converted_to_client_id = c.id
    WHERE l.converted_to_client_id IS NOT NULL AND c.id IS NULL;

    IF orphaned_conversions > 0 THEN
        RAISE EXCEPTION 'Migration failed: Found % orphaned conversion references', orphaned_conversions;
    END IF;

    -- Verify no circular references remain
    SELECT COUNT(*) INTO circular_refs
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('clients', 'leads')
    AND kcu.column_name IN ('converted_from_lead_id', 'client_id');

    IF circular_refs > 0 THEN
        RAISE EXCEPTION 'Migration failed: Circular foreign key constraints still exist';
    END IF;

    SELECT COUNT(*) INTO total_converted FROM leads WHERE is_converted = true;
    RAISE NOTICE 'Migration completed successfully. % leads marked as converted.', total_converted;
    RAISE NOTICE 'Circular dependency resolved. Schema now supports clean Lead → Client conversion flow.';
END $$;

-- Drop temporary backup table
DROP TABLE IF EXISTS migration_backup;

RAISE NOTICE 'Migration 001_resolve_circular_dependency completed successfully!';