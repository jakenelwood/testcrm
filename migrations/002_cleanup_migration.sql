-- Migration Cleanup: Complete the circular dependency resolution
-- Purpose: Remove remaining circular references and update RLS policies
-- Date: 2025-01-13

-- =====================================================
-- STEP 1: Update RLS Policies to Remove client_id Dependencies
-- =====================================================

-- Drop policies that depend on leads.client_id
DO $$
BEGIN
    -- Drop RLS policies that reference leads.client_id
    DROP POLICY IF EXISTS "Users can view clients they created or are assigned to" ON clients;
    DROP POLICY IF EXISTS "Users can update clients they have access to" ON clients;
    DROP POLICY IF EXISTS "Users can view vehicles they have access to" ON vehicles;
    DROP POLICY IF EXISTS "Users can view homes they have access to" ON homes;
    DROP POLICY IF EXISTS "Users can view specialty items they have access to" ON specialty_items;

    -- Drop storage policies that might reference leads.client_id
    DROP POLICY IF EXISTS "Users can view underwriting documents they have access to" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view ACORD forms they have access to" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view quote documents they have access to" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view policy documents they have access to" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view other documents they have access to" ON storage.objects;

    RAISE NOTICE 'Dropped RLS policies that depend on leads.client_id';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some policies may not exist, continuing...';
END $$;

-- =====================================================
-- STEP 2: Remove Circular Foreign Key Columns
-- =====================================================

-- Remove client_id from leads table (now that policies are dropped)
ALTER TABLE leads DROP COLUMN IF EXISTS client_id;

-- Remove converted_from_lead_id from clients table
ALTER TABLE clients DROP COLUMN IF EXISTS converted_from_lead_id;

-- =====================================================
-- STEP 3: Recreate RLS Policies with Correct Logic
-- =====================================================

-- Recreate client policies without circular dependency
CREATE POLICY "Users can view clients they created or are assigned to" ON clients
    FOR SELECT USING (
        auth.uid() = created_by OR
        auth.uid() = updated_by OR
        auth.uid() IN (
            SELECT assigned_to FROM leads WHERE converted_to_client_id = clients.id
        )
    );

CREATE POLICY "Users can update clients they have access to" ON clients
    FOR UPDATE USING (
        auth.uid() = created_by OR
        auth.uid() = updated_by OR
        auth.uid() IN (
            SELECT assigned_to FROM leads WHERE converted_to_client_id = clients.id
        )
    );

-- Recreate vehicle policies
CREATE POLICY "Users can view vehicles they have access to" ON vehicles
    FOR SELECT USING (
        auth.uid() = created_by OR
        auth.uid() = updated_by OR
        client_id IN (
            SELECT id FROM clients WHERE
                auth.uid() = created_by OR
                auth.uid() = updated_by OR
                auth.uid() IN (
                    SELECT assigned_to FROM leads WHERE converted_to_client_id = clients.id
                )
        ) OR
        lead_id IN (
            SELECT id FROM leads WHERE
                auth.uid() = created_by OR
                auth.uid() = assigned_to
        )
    );

-- Recreate home policies
CREATE POLICY "Users can view homes they have access to" ON homes
    FOR SELECT USING (
        auth.uid() = created_by OR
        auth.uid() = updated_by OR
        client_id IN (
            SELECT id FROM clients WHERE
                auth.uid() = created_by OR
                auth.uid() = updated_by OR
                auth.uid() IN (
                    SELECT assigned_to FROM leads WHERE converted_to_client_id = clients.id
                )
        ) OR
        lead_id IN (
            SELECT id FROM leads WHERE
                auth.uid() = created_by OR
                auth.uid() = assigned_to
        )
    );

-- Recreate specialty items policies
CREATE POLICY "Users can view specialty items they have access to" ON specialty_items
    FOR SELECT USING (
        auth.uid() = created_by OR
        auth.uid() = updated_by OR
        client_id IN (
            SELECT id FROM clients WHERE
                auth.uid() = created_by OR
                auth.uid() = updated_by OR
                auth.uid() IN (
                    SELECT assigned_to FROM leads WHERE converted_to_client_id = clients.id
                )
        ) OR
        lead_id IN (
            SELECT id FROM leads WHERE
                auth.uid() = created_by OR
                auth.uid() = assigned_to
        )
    );

-- =====================================================
-- STEP 4: Verification
-- =====================================================

DO $$
DECLARE
    circular_refs INTEGER;
    new_fields INTEGER;
BEGIN
    -- Verify no circular references remain
    SELECT COUNT(*) INTO circular_refs
    FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'converted_from_lead_id'
    OR table_name = 'leads' AND column_name = 'client_id';

    IF circular_refs > 0 THEN
        RAISE EXCEPTION 'Cleanup failed: Circular reference columns still exist';
    END IF;

    -- Verify new fields exist
    SELECT COUNT(*) INTO new_fields
    FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name IN ('converted_to_client_id', 'conversion_date', 'is_converted');

    IF new_fields != 3 THEN
        RAISE EXCEPTION 'Cleanup failed: New conversion fields missing';
    END IF;

    RAISE NOTICE 'Migration cleanup completed successfully!';
    RAISE NOTICE 'Circular dependency fully resolved.';
    RAISE NOTICE 'RLS policies updated to use proper relationships.';
END $$;