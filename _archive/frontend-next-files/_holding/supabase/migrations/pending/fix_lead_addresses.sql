-- Fix missing address associations for leads
-- This script updates leads_ins_info records to ensure they have proper address_id and mailing_address_id values

-- First, check if the lead with ID c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f exists
DO $$
DECLARE
  lead_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM leads_ins_info 
    WHERE id = 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f'
  ) INTO lead_exists;
  
  IF lead_exists THEN
    -- Update the lead with the correct address IDs
    UPDATE leads_ins_info
    SET 
      address_id = 'c3d4e5f6-a7b8-6c7d-0e1f-3a4b5c6d7e8f',
      mailing_address_id = 'c9d0e1f2-a3b4-2c5d-6e7f-9a0b1c2d3e4f'
    WHERE id = 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f';
    
    RAISE NOTICE 'Updated address for lead c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f';
  ELSE
    RAISE NOTICE 'Lead c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f not found';
  END IF;
END
$$;

-- Check and update all leads to ensure they have address associations
DO $$
DECLARE
  lead_record RECORD;
  client_record RECORD;
BEGIN
  -- Loop through all leads
  FOR lead_record IN 
    SELECT l.id, l.client_id, l.address_id, l.mailing_address_id
    FROM leads_ins_info l
    WHERE l.address_id IS NULL OR l.mailing_address_id IS NULL
  LOOP
    -- Try to get address info from the associated client
    SELECT c.address_id, c.mailing_address_id
    INTO client_record
    FROM leads_contact_info c
    WHERE c.id = lead_record.client_id;
    
    -- Update the lead with the client's address IDs if available
    IF client_record.address_id IS NOT NULL OR client_record.mailing_address_id IS NOT NULL THEN
      UPDATE leads_ins_info
      SET 
        address_id = COALESCE(lead_record.address_id, client_record.address_id),
        mailing_address_id = COALESCE(lead_record.mailing_address_id, client_record.mailing_address_id)
      WHERE id = lead_record.id;
      
      RAISE NOTICE 'Updated addresses for lead % from client %', lead_record.id, lead_record.client_id;
    END IF;
  END LOOP;
END
$$;

-- Verify the updates
SELECT 
  l.id AS lead_id, 
  l.client_id,
  l.address_id, 
  l.mailing_address_id,
  c.address_id AS client_address_id,
  c.mailing_address_id AS client_mailing_address_id
FROM 
  leads_ins_info l
LEFT JOIN 
  leads_contact_info c ON l.client_id = c.id
WHERE 
  l.id = 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f'
  OR l.address_id IS NULL 
  OR l.mailing_address_id IS NULL;
