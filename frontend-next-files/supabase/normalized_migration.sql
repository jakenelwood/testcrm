-- Migration script to update from the current schema to the normalized schema
-- Since we're dealing with test data, we'll drop existing tables and create new ones

-- Step 1: Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS lead_marketing_settings;
DROP TABLE IF EXISTS lead_communications;
DROP TABLE IF EXISTS lead_notes;
DROP TABLE IF EXISTS leads;

-- Step 2: Create new tables from normalized_schema.sql
-- (This would be done by running the normalized_schema.sql file)

-- Step 3: Insert sample data for testing

-- Insert sample addresses
INSERT INTO addresses (id, street, city, state, zip_code, type)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '123 Main St', 'Minneapolis', 'MN', '55401', 'Physical'),
  ('22222222-2222-2222-2222-222222222222', 'PO Box 456', 'Minneapolis', 'MN', '55402', 'Mailing'),
  ('33333333-3333-3333-3333-333333333333', '789 Business Ave', 'St. Paul', 'MN', '55101', 'Business');

-- Insert sample clients
INSERT INTO clients (id, client_type, name, email, phone_number, address_id, mailing_address_id, 
                    date_of_birth, gender, marital_status, drivers_license, license_state, 
                    education_occupation, referred_by)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Individual', 'John Doe', 'john@example.com', 
   '(612) 555-1234', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   '1980-01-15', 'Male', 'Married', 'DL12345678', 'MN', 'Software Engineer', 'Website'),
   
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Individual', 'Jane Smith', 'jane@example.com', 
   '(612) 555-5678', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   '1985-05-20', 'Female', 'Single', 'DL87654321', 'MN', 'Doctor', 'Referral'),
   
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Business', 'Acme Corporation', 'info@acme.com', 
   '(651) 555-9012', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
   NULL, NULL, NULL, NULL, NULL, NULL, 'Google');

-- Insert sample leads
INSERT INTO leads (id, client_id, status_id, insurance_type_id, assigned_to, notes, 
                  current_carrier, premium, auto_data)
VALUES 
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   1, 1, 'Brian B', 'Interested in full coverage', 'State Farm', 1200.00, 
   '{"vehicles": [{"year": 2020, "make": "Toyota", "model": "Camry", "vin": "ABC123"}]}'),
   
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
   2, 2, 'Brian B', 'Looking for better rates', 'Allstate', 950.00, 
   NULL),
   
  ('33333333-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 
   3, 4, 'Brian B', 'Needs liability coverage for business', 'Progressive', 2500.00, 
   NULL);

-- Insert sample lead notes
INSERT INTO lead_notes (lead_id, note_content, created_by)
VALUES 
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Called client to discuss options', 'Brian B'),
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sent quote via email', 'Brian B'),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Left voicemail', 'Brian B');

-- Insert sample contacts for business client
INSERT INTO contacts (client_id, first_name, last_name, title, email, phone_number, is_primary_contact)
VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Bob', 'Johnson', 'CEO', 'bob@acme.com', 
   '(651) 555-1111', TRUE),
   
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Sarah', 'Williams', 'CFO', 'sarah@acme.com', 
   '(651) 555-2222', FALSE);

-- Insert sample communications
INSERT INTO lead_communications (lead_id, contact_id, type_id, direction, content, created_by)
VALUES 
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 3, 'Outbound', 'Discussed coverage options', 'Brian B'),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 3, 'Outbound', 'Left voicemail about quote', 'Brian B'),
  ('33333333-cccc-cccc-cccc-cccccccccccc', 
   (SELECT id FROM contacts WHERE first_name = 'Bob' AND last_name = 'Johnson' LIMIT 1), 
   1, 'Outbound', 'Sent quote details', 'Brian B');
