-- Script to apply the consolidated schema and test data
-- This script will:
-- 1. Create the tables if they don't exist
-- 2. Insert test data if the tables are empty

-- First, apply the consolidated schema
\i consolidated_schema.sql

-- Check if the leads table is empty
DO $$
DECLARE
  lead_count INTEGER;
BEGIN
  -- Get the count of leads
  SELECT COUNT(*) INTO lead_count FROM leads;
  
  -- If the table is empty, apply the test data
  IF lead_count = 0 THEN
    RAISE NOTICE 'Leads table is empty. Applying test data...';
    \i consolidated_test_data.sql
  ELSE
    RAISE NOTICE 'Leads table already has data. Skipping test data insertion.';
  END IF;
END $$;
