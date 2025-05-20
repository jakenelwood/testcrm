-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'leads_ins_info', 
  'leads_contact_info', 
  'addresses', 
  'vehicles', 
  'homes', 
  'specialty_items', 
  'other_insureds',
  'lead_notes',
  'lead_communications',
  'lead_marketing_settings',
  'opportunities'
);

-- Check if the original tables still exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'clients');

-- Check pipeline and status data
SELECT id, name FROM pipelines;
SELECT id, value FROM lead_statuses;
