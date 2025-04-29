-- Insert test leads
INSERT INTO leads (first_name, last_name, email, phone_number, insurance_type, status, current_carrier, premium, assigned_to, notes, auto_data, created_at)
VALUES
  ('Mike', 'Zajaczkowski', 'mike.z@example.com', '555-123-4567', 'Auto', 'New', NULL, 741.00, 'Brian B', 'Initial contact made via website', 
   '{"v1yr": "2019", "v1make": "Honda", "v1model": "Accord", "v1vin": "1HGCV1F34LA123456"}', NOW() - INTERVAL '2 days'),
  
  ('Robin', 'Cheifetz', 'robin.c@example.com', '555-234-5678', 'Home', 'New', 'State Farm', 1000.00, 'Brian B', 'Looking for better rates on home insurance', 
   NULL, NOW() - INTERVAL '3 days'),
  
  ('Crisriver', 'Aparicio', 'cris.a@example.com', '555-345-6789', 'Auto', 'New', NULL, 691.00, 'Brian B', 'Needs full coverage for new vehicle', 
   '{"v1yr": "2023", "v1make": "Toyota", "v1model": "RAV4", "v1vin": "JTMWFREV2ND123456"}', NOW() - INTERVAL '1 day'),
  
  ('Thomas', 'Barnhiser', 'thomas.b@example.com', '555-456-7890', 'Specialty', 'New', NULL, 2632.00, 'Brian B', 'Interested in boat insurance', 
   NULL, NOW() - INTERVAL '5 days'),
  
  ('Todd', 'Ross', 'todd.r@example.com', '555-567-8901', 'Auto', 'New', NULL, 2689.00, 'Brian B', 'Multiple vehicles, looking for bundle discount', 
   '{"v1yr": "2020", "v1make": "Ford", "v1model": "F-150", "v1vin": "1FTEW1EP5LFA12345"}', NOW() - INTERVAL '4 days');

-- Insert test notes
INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
VALUES
  ((SELECT id FROM leads WHERE first_name = 'Mike' AND last_name = 'Zajaczkowski'), 'Left voicemail introducing our services', 'Brian B', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM leads WHERE first_name = 'Robin' AND last_name = 'Cheifetz'), 'Scheduled follow-up call for next week', 'Brian B', NOW() - INTERVAL '2 days'),
  ((SELECT id FROM leads WHERE first_name = 'Crisriver' AND last_name = 'Aparicio'), 'Sent email with quote details', 'Brian B', NOW() - INTERVAL '12 hours');

-- Insert test communications
INSERT INTO lead_communications (lead_id, type, direction, content, status, created_by, created_at)
VALUES
  ((SELECT id FROM leads WHERE first_name = 'Mike' AND last_name = 'Zajaczkowski'), 'Call', 'Outbound', 'Initial introduction call', 'Completed', 'Brian B', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM leads WHERE first_name = 'Robin' AND last_name = 'Cheifetz'), 'Email', 'Outbound', 'Sent quote details', 'Delivered', 'System', NOW() - INTERVAL '2 days'),
  ((SELECT id FROM leads WHERE first_name = 'Crisriver' AND last_name = 'Aparicio'), 'SMS', 'Outbound', 'Reminder about upcoming appointment', 'Delivered', 'System', NOW() - INTERVAL '6 hours');

-- Insert test marketing settings
INSERT INTO lead_marketing_settings (lead_id, campaign_id, is_active, settings)
VALUES
  ((SELECT id FROM leads WHERE first_name = 'Mike' AND last_name = 'Zajaczkowski'), 'welcome_series', true, '{"frequency": "weekly", "channel": "email"}'),
  ((SELECT id FROM leads WHERE first_name = 'Robin' AND last_name = 'Cheifetz'), 'home_insurance_tips', true, '{"frequency": "biweekly", "channel": "email"}'),
  ((SELECT id FROM leads WHERE first_name = 'Crisriver' AND last_name = 'Aparicio'), 'new_driver_safety', false, '{"frequency": "monthly", "channel": "sms"}');
