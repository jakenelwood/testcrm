-- First, clear existing data
DELETE FROM lead_marketing_settings;
DELETE FROM lead_communications;
DELETE FROM lead_notes;
DELETE FROM leads;

-- Insert 15 unique test leads with different dates and statuses
INSERT INTO leads (first_name, last_name, email, phone_number, insurance_type, status, current_carrier, premium, assigned_to, notes, auto_data, created_at)
VALUES
  -- New leads (5)
  ('Mike', 'Zajaczkowski', 'mike.z@example.com', '555-123-4567', 'Auto', 'New', NULL, 741.00, 'Brian B', 'Initial contact made via website', 
   '{"v1yr": "2019", "v1make": "Honda", "v1model": "Accord", "v1vin": "1HGCV1F34LA123456"}', NOW() - INTERVAL '1 day'),
  
  ('Robin', 'Cheifetz', 'robin.c@example.com', '555-234-5678', 'Home', 'New', 'State Farm', 1000.00, 'Brian B', 'Looking for better rates on home insurance', 
   NULL, NOW() - INTERVAL '2 days'),
  
  ('Sarah', 'Johnson', 'sarah.j@example.com', '555-987-6543', 'Auto', 'New', 'Progressive', 850.00, 'Brian B', 'Referred by Mike Z.', 
   '{"v1yr": "2021", "v1make": "Toyota", "v1model": "Camry", "v1vin": "4T1BF1FK5MU123456"}', NOW() - INTERVAL '3 days'),
   
  ('James', 'Wilson', 'james.w@example.com', '555-222-3333', 'Home', 'New', 'Allstate', 1200.00, 'Brian B', 'Needs quote ASAP', 
   NULL, NOW() - INTERVAL '4 days'),
   
  ('Emily', 'Davis', 'emily.d@example.com', '555-444-5555', 'Specialty', 'New', NULL, 500.00, 'Brian B', 'Interested in motorcycle insurance', 
   NULL, NOW() - INTERVAL '5 days'),
  
  -- Contacted leads (4)
  ('Crisriver', 'Aparicio', 'cris.a@example.com', '555-345-6789', 'Auto', 'Contacted', NULL, 691.00, 'Brian B', 'Needs full coverage for new vehicle', 
   '{"v1yr": "2023", "v1make": "Toyota", "v1model": "RAV4", "v1vin": "JTMWFREV2ND123456"}', NOW() - INTERVAL '6 days'),
  
  ('Michael', 'Brown', 'michael.b@example.com', '555-666-7777', 'Auto', 'Contacted', 'Geico', 920.00, 'Brian B', 'Called back, interested in quote', 
   '{"v1yr": "2018", "v1make": "Honda", "v1model": "Civic", "v1vin": "2HGFC2F55LH123456"}', NOW() - INTERVAL '7 days'),
   
  ('Jennifer', 'Miller', 'jennifer.m@example.com', '555-888-9999', 'Home', 'Contacted', 'Liberty Mutual', 1100.00, 'Brian B', 'Scheduled follow-up call', 
   NULL, NOW() - INTERVAL '8 days'),
   
  ('David', 'Garcia', 'david.g@example.com', '555-111-2222', 'Specialty', 'Contacted', 'Progressive', 750.00, 'Brian B', 'Interested in boat insurance', 
   NULL, NOW() - INTERVAL '9 days'),
  
  -- Quoted leads (3)
  ('Thomas', 'Barnhiser', 'thomas.b@example.com', '555-456-7890', 'Specialty', 'Quoted', NULL, 2632.00, 'Brian B', 'Sent quote for boat insurance', 
   NULL, NOW() - INTERVAL '10 days'),
  
  ('Lisa', 'Martinez', 'lisa.m@example.com', '555-333-4444', 'Auto', 'Quoted', 'Farmers', 880.00, 'Brian B', 'Comparing our quote with current provider', 
   '{"v1yr": "2020", "v1make": "Nissan", "v1model": "Altima", "v1vin": "1N4BL4BV4LC123456"}', NOW() - INTERVAL '11 days'),
   
  ('Robert', 'Anderson', 'robert.a@example.com', '555-555-6666', 'Home', 'Quoted', 'State Farm', 950.00, 'Brian B', 'Quote sent via email', 
   NULL, NOW() - INTERVAL '12 days'),
  
  -- Sold leads (2)
  ('Todd', 'Ross', 'todd.r@example.com', '555-567-8901', 'Auto', 'Sold', NULL, 2689.00, 'Brian B', 'Policy issued for multiple vehicles', 
   '{"v1yr": "2020", "v1make": "Ford", "v1model": "F-150", "v1vin": "1FTEW1EP5LFA12345"}', NOW() - INTERVAL '13 days'),
   
  ('Amanda', 'Taylor', 'amanda.t@example.com', '555-777-8888', 'Home', 'Sold', 'Nationwide', 1300.00, 'Brian B', 'Policy starts next month', 
   NULL, NOW() - INTERVAL '14 days'),
  
  -- Lost lead (1)
  ('Kevin', 'Thomas', 'kevin.t@example.com', '555-999-0000', 'Auto', 'Lost', 'Geico', 775.00, 'Brian B', 'Decided to stay with current provider', 
   '{"v1yr": "2022", "v1make": "Chevrolet", "v1model": "Malibu", "v1vin": "1G1ZD5ST4LF123456"}', NOW() - INTERVAL '15 days');

-- Add some notes
INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Initial contact made via website', 'Brian B', created_at + INTERVAL '1 hour'
FROM leads
WHERE first_name = 'Mike' AND last_name = 'Zajaczkowski';

INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Left voicemail', 'Brian B', created_at + INTERVAL '1 day'
FROM leads
WHERE first_name = 'Robin' AND last_name = 'Cheifetz';

INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Discussed coverage options', 'Brian B', created_at + INTERVAL '2 days'
FROM leads
WHERE first_name = 'Crisriver' AND last_name = 'Aparicio';

INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Sent quote details', 'Brian B', created_at + INTERVAL '1 day'
FROM leads
WHERE first_name = 'Thomas' AND last_name = 'Barnhiser';

INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Policy issued', 'Brian B', created_at + INTERVAL '3 days'
FROM leads
WHERE first_name = 'Todd' AND last_name = 'Ross';

-- Add some communications
INSERT INTO lead_communications (lead_id, type, direction, content, status, created_by, created_at)
SELECT id, 'Email', 'Outbound', 'Welcome email sent', 'Delivered', 'System', created_at + INTERVAL '2 hours'
FROM leads
WHERE first_name = 'Mike' AND last_name = 'Zajaczkowski';

INSERT INTO lead_communications (lead_id, type, direction, content, status, created_by, created_at)
SELECT id, 'Call', 'Outbound', 'Introduction call', 'Completed', 'Brian B', created_at + INTERVAL '1 day'
FROM leads
WHERE first_name = 'Robin' AND last_name = 'Cheifetz';

INSERT INTO lead_communications (lead_id, type, direction, content, status, created_by, created_at)
SELECT id, 'SMS', 'Outbound', 'Quote reminder', 'Delivered', 'System', created_at + INTERVAL '2 days'
FROM leads
WHERE first_name = 'Thomas' AND last_name = 'Barnhiser';

-- Add some marketing settings
INSERT INTO lead_marketing_settings (lead_id, campaign_id, is_active, settings)
SELECT id, 'welcome_series', true, '{"frequency": "weekly", "channel": "email"}'
FROM leads
WHERE status = 'New'
LIMIT 3;

INSERT INTO lead_marketing_settings (lead_id, campaign_id, is_active, settings)
SELECT id, 'quote_follow_up', true, '{"frequency": "daily", "channel": "sms"}'
FROM leads
WHERE status = 'Quoted'
LIMIT 2;

INSERT INTO lead_marketing_settings (lead_id, campaign_id, is_active, settings)
SELECT id, 'customer_retention', true, '{"frequency": "monthly", "channel": "email"}'
FROM leads
WHERE status = 'Sold'
LIMIT 2;
