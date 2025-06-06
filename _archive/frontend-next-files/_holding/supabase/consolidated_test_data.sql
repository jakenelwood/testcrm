-- Test Data for Consolidated Schema
-- This script inserts realistic test data into the tables defined in consolidated_schema.sql

-- Insert test clients (individuals)
INSERT INTO clients (
  id,
  client_type,
  name,
  email,
  phone_number,
  address_id,
  mailing_address_id,
  referred_by,
  date_of_birth,
  gender,
  marital_status,
  drivers_license,
  license_state,
  education_occupation,
  ai_summary,
  ai_next_action,
  created_at
)
VALUES
  -- Individual clients
  (
    '11111111-1111-1111-1111-111111111111',
    'Individual',
    'Mike Zajaczkowski',
    'mike.z@example.com',
    '555-123-4567',
    '123 Main St, Minneapolis, MN 55401',
    '123 Main St, Minneapolis, MN 55401',
    'Website',
    '1985-06-15',
    'Male',
    'Married',
    'DL12345678',
    'MN',
    'Software Engineer',
    'New client looking for auto insurance',
    'Follow up on auto quote',
    NOW() - INTERVAL '2 days'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Individual',
    'Robin Cheifetz',
    'robin.c@example.com',
    '555-234-5678',
    '456 Oak Ave, St. Paul, MN 55102',
    '456 Oak Ave, St. Paul, MN 55102',
    'Referral - Mike Z',
    '1978-09-22',
    'Female',
    'Single',
    'DL87654321',
    'MN',
    'Marketing Director',
    'Interested in bundling home and auto',
    'Send home insurance quote',
    NOW() - INTERVAL '5 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Individual',
    'David Johnson',
    'david.j@example.com',
    '555-345-6789',
    '789 Pine St, Edina, MN 55424',
    '789 Pine St, Edina, MN 55424',
    'Google Ad',
    '1990-03-10',
    'Male',
    'Married',
    'DL55555555',
    'MN',
    'Dentist',
    'Looking for specialty boat insurance',
    'Follow up on boat quote',
    NOW() - INTERVAL '10 days'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Individual',
    'Sarah Williams',
    'sarah.w@example.com',
    '555-456-7890',
    '101 River Rd, Bloomington, MN 55420',
    '101 River Rd, Bloomington, MN 55420',
    'Facebook Ad',
    '1982-11-05',
    'Female',
    'Married',
    'DL44444444',
    'MN',
    'Accountant',
    'Recently purchased auto policy',
    'Schedule policy review in 6 months',
    NOW() - INTERVAL '30 days'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Individual',
    'Kevin Thomas',
    'kevin.t@example.com',
    '555-567-8901',
    '202 Lake St, Wayzata, MN 55391',
    '202 Lake St, Wayzata, MN 55391',
    'Yelp',
    '1975-07-18',
    'Male',
    'Divorced',
    'DL33333333',
    'MN',
    'Attorney',
    'Lost lead - stayed with current provider',
    'Follow up in 6 months for renewal opportunity',
    NOW() - INTERVAL '45 days'
  );

-- Insert a business client
INSERT INTO clients (
  id,
  client_type,
  name,
  email,
  phone_number,
  address_id,
  mailing_address_id,
  referred_by,
  business_type,
  industry,
  tax_id,
  year_established,
  annual_revenue,
  number_of_employees,
  ai_summary,
  ai_next_action,
  ai_risk_score,
  ai_lifetime_value,
  metadata,
  tags,
  created_at
)
VALUES
  (
    '66666666-6666-6666-6666-666666666666',
    'Business',
    'Acme Corporation',
    'info@acmecorp.example.com',
    '555-789-0123',
    '500 Corporate Way, Minneapolis, MN 55402',
    '500 Corporate Way, Minneapolis, MN 55402',
    'Chamber of Commerce',
    'Corporation',
    'Manufacturing',
    '12-3456789',
    '2005',
    5000000.00,
    75,
    'Manufacturing business looking for commercial coverage',
    'Schedule meeting with decision makers',
    65,
    250000.00,
    '{"industry_risk": "medium", "years_in_business": 18, "payment_history": "excellent"}',
    ARRAY['manufacturing', 'commercial', 'property', 'liability'],
    NOW() - INTERVAL '15 days'
  );

-- Insert test leads with data for all fields
INSERT INTO leads (
  id,
  client_id,

  -- Primary Named Insured fields (copied from client data for backward compatibility)
  primary_named_insured_name,
  primary_named_insured_email_address,
  primary_named_insured_phone_number,
  primary_named_insured_address,
  primary_named_insured_mailing_address,
  primary_named_insured_dob,
  primary_named_insured_gender,
  primary_named_insured_marital_status,
  primary_named_insured_dl_number,
  primary_named_insured_license_state,
  primary_named_insured_education_occupation,
  primary_named_insured_referred_by,
  primary_named_insured_effective_date,

  -- Lead status and assignment
  status,
  assigned_to,
  notes,

  -- Insurance type and basic info
  insurance_type,
  current_carrier,

  -- Auto specific columns
  auto_current_insurance_carrier_auto,
  auto_months_with_current_carrier_auto,
  auto_premium,

  -- Auto data as JSON
  auto_data,

  -- Created at (for different dates)
  created_at
)
VALUES
  -- New Auto Lead
  (
    '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',

    'Mike Zajaczkowski',
    'mike.z@example.com',
    '555-123-4567',
    '123 Main St, Minneapolis, MN 55401',
    '123 Main St, Minneapolis, MN 55401',
    '1985-06-15',
    'Male',
    'Married',
    'DL12345678',
    'MN',
    'Software Engineer',
    'Website',
    '2023-12-01',

    'New',
    'Brian B',
    'Initial contact made via website. Looking for better rates on auto insurance.',

    'Auto',
    'State Farm',

    'State Farm',
    24,
    741.00,

    '{
      "auto_vehicle_year": "2019",
      "auto_vehicle_make": "Honda",
      "auto_vehicle_model": "Accord",
      "auto_vehicle_vin": "1HGCV1F34LA123456",
      "auto_vehicle_usage": "Commute",
      "auto_vehicle_miles": "12000",
      "auto_vehicle_driver": "Mike Zajaczkowski",
      "auto_vehicle_collision": true,
      "auto_vehicle_comp": true,
      "auto_vehicle_gap": false,
      "auto_vehicle_glass": true,
      "auto_vehicle_rental_car_reimbursement": true,
      "auto_vehicle_tow": false,
      "auto_vehicle_financed": true,
      "auto_current_limits": {
        "bodily_injury": "100/300",
        "property_damage": "100",
        "uninsured_motorist": "100/300",
        "medical_payments": "5000"
      },
      "auto_quoting_limits": {
        "bodily_injury": "250/500",
        "property_damage": "100",
        "uninsured_motorist": "250/500",
        "medical_payments": "10000"
      },
      "auto_additional_notes": "Looking for comprehensive coverage with lower deductibles."
    }',

    NOW() - INTERVAL '2 days'
  ),

  -- Contacted Home Lead
  (
    '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',

    'Robin Cheifetz',
    'robin.c@example.com',
    '555-234-5678',
    '456 Oak Ave, St. Paul, MN 55102',
    '456 Oak Ave, St. Paul, MN 55102',
    '1978-09-22',
    'Female',
    'Single',
    'DL87654321',
    'MN',
    'Marketing Director',
    'Referral - Mike Z',
    '2023-11-15',

    'Contacted',
    'Brian B',
    'Followed up on 11/20. Interested in bundling home and auto.',

    'Home',
    'State Farm',

    NULL,
    NULL,
    NULL,

    NULL,

    NOW() - INTERVAL '5 days'
  ),

  -- Quoted Specialty Lead
  (
    '33333333-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',

    'David Johnson',
    'david.j@example.com',
    '555-345-6789',
    '789 Pine St, Edina, MN 55424',
    '789 Pine St, Edina, MN 55424',
    '1990-03-10',
    'Male',
    'Married',
    'DL55555555',
    'MN',
    'Dentist',
    'Google Ad',
    '2023-11-10',

    'Quoted',
    'Brian B',
    'Quote sent on 11/12. Following up next week.',

    'Specialty',
    NULL,

    NULL,
    NULL,
    NULL,

    NULL,

    NOW() - INTERVAL '10 days'
  ),

  -- Sold Auto Lead
  (
    '44444444-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',

    'Sarah Williams',
    'sarah.w@example.com',
    '555-456-7890',
    '101 River Rd, Bloomington, MN 55420',
    '101 River Rd, Bloomington, MN 55420',
    '1982-11-05',
    'Female',
    'Married',
    'DL44444444',
    'MN',
    'Accountant',
    'Facebook Ad',
    '2023-10-15',

    'Sold',
    'Brian B',
    'Policy issued on 10/20. Set up for auto-renewal.',

    'Auto',
    'Progressive',

    'Progressive',
    36,
    892.50,

    '{
      "auto_vehicle_year": "2021",
      "auto_vehicle_make": "Toyota",
      "auto_vehicle_model": "RAV4",
      "auto_vehicle_vin": "JTMWFREV2ND123456",
      "auto_vehicle_usage": "Commute",
      "auto_vehicle_miles": "15000",
      "auto_vehicle_driver": "Sarah Williams",
      "auto_vehicle_collision": true,
      "auto_vehicle_comp": true,
      "auto_vehicle_gap": true,
      "auto_vehicle_glass": true,
      "auto_vehicle_rental_car_reimbursement": true,
      "auto_vehicle_tow": true,
      "auto_vehicle_financed": true
    }',

    NOW() - INTERVAL '30 days'
  ),

  -- Lost Home Lead
  (
    '55555555-eeee-eeee-eeee-eeeeeeeeeeee',
    '55555555-5555-5555-5555-555555555555',

    'Kevin Thomas',
    'kevin.t@example.com',
    '555-567-8901',
    '202 Lake St, Wayzata, MN 55391',
    '202 Lake St, Wayzata, MN 55391',
    '1975-07-18',
    'Male',
    'Divorced',
    'DL33333333',
    'MN',
    'Attorney',
    'Yelp',
    '2023-10-01',

    'Lost',
    'Brian B',
    'Decided to stay with current provider. Follow up in 6 months.',

    'Home',
    'Allstate',

    NULL,
    NULL,
    NULL,

    NULL,

    NOW() - INTERVAL '45 days'
  ),

  -- Commercial Lead for Business Client
  (
    '66666666-ffff-ffff-ffff-ffffffffffff',
    '66666666-6666-6666-6666-666666666666',

    'Acme Corporation',
    'info@acmecorp.example.com',
    '555-789-0123',
    '500 Corporate Way, Minneapolis, MN 55402',
    '500 Corporate Way, Minneapolis, MN 55402',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Chamber of Commerce',
    '2023-11-01',

    'Quoted',
    'Brian B',
    'Quote sent for commercial property and liability coverage.',

    'Commercial',
    'Travelers',

    NULL,
    NULL,
    NULL,

    NULL,

    NOW() - INTERVAL '15 days'
  );

-- Update home data for Robin's lead
UPDATE leads
SET
  home_premium = 1200.00,
  home_current_insurance_carrier = 'State Farm',
  home_months_with_current_carrier = 36,
  home_data = '{
    "home_coverage_type_owner_renter": "Owner",
    "home_year_built": "1995",
    "home_sq_ft_above_ground": "2200",
    "home_stories_style": "2 Story",
    "home_reconstruction_cost": "350000",
    "home_personal_property_value": "175000",
    "home_deductible": "1000",
    "home_roof_type": "Asphalt Shingle",
    "home_roof_year_replaced": "2018",
    "home_siding_type": "Vinyl",
    "home_garage": "Attached 2-Car",
    "home_full_bath": "2",
    "home_half_bath": "1",
    "home_three_qtr_bath": "0",
    "home_heating_system_type": "Forced Air",
    "home_heating_system_year": "2010",
    "home_electrical_type_amps": "200 Amp",
    "home_electrical_year": "2000",
    "home_plumbing_material_type": "Copper",
    "home_plumbing_year": "2000",
    "home_pets": "Dog - Labrador",
    "home_pool": false,
    "home_trampoline": false,
    "home_woodstove": false,
    "home_fire_place": true,
    "home_alarm": true,
    "home_sprinkled": false,
    "home_responding_fd": "St. Paul FD",
    "home_miles_from_fd": "1.5",
    "home_fire_hydrant_distance": "500 ft",
    "home_additional_notes": "Looking for increased liability coverage."
  }'
WHERE primary_named_insured_email_address = 'robin.c@example.com';

-- Update specialty data for David's lead
UPDATE leads
SET
  specialty_premium = 950.00,
  specialty_make = 'Sea Ray',
  specialty_model = 'Sundancer 320',
  specialty_year = 2018,
  specialty_vin = 'BOAT123456789XYZ',
  specialty_market_value = 120000.00,
  specialty_type_toy = 'Boat',
  specialty_cc_size = 'N/A',
  specialty_total_hp = '350',
  specialty_max_speed = '40 knots',
  specialty_collision_deductible = 1000.00,
  specialty_comprehensive_deductible = 500.00,
  specialty_comprehensive_location_stored = 'Marina - Lake Minnetonka',
  specialty_data = '{
    "specialty_type": "Boat",
    "specialty_year": "2018",
    "specialty_make": "Sea Ray",
    "specialty_model": "Sundancer 320",
    "specialty_vin": "BOAT123456789XYZ",
    "specialty_market_value": "120000",
    "specialty_total_hp": "350",
    "specialty_max_speed": "40 knots",
    "specialty_collision_deductible": "1000",
    "specialty_comprehensive_deductible": "500",
    "specialty_comprehensive_location_stored": "Marina - Lake Minnetonka",
    "specialty_additional_information": "Used for recreational purposes, 3-4 times per month during summer."
  }'
WHERE primary_named_insured_email_address = 'david.j@example.com';

-- Update commercial data for Acme Corporation lead
UPDATE leads
SET
  commercial_premium = 4500.00,
  commercial_coverage_type = 'Property & Liability',
  commercial_industry = 'Manufacturing',
  commercial_data = '{
    "commercial_property_value": "2500000",
    "commercial_liability_limit": "2000000",
    "commercial_business_interruption": "1000000",
    "commercial_deductible": "5000",
    "commercial_building_construction": "Masonry",
    "commercial_building_year": "2005",
    "commercial_square_footage": "25000",
    "commercial_sprinkler_system": true,
    "commercial_alarm_system": true,
    "commercial_number_of_stories": "2",
    "commercial_additional_notes": "Manufacturing facility with office space. Needs coverage for equipment and inventory."
  }',
  additional_locations = '[
    {
      "address": "123 Warehouse Ave, St. Paul, MN 55114",
      "type": "Warehouse",
      "square_footage": "15000",
      "year_built": "2010",
      "construction_type": "Metal",
      "sprinkler_system": true
    }
  ]'
WHERE primary_named_insured_name = 'Acme Corporation';

-- Insert additional insureds for Mike's lead
UPDATE leads
SET additional_insureds = '[
  {
    "additional_insured_name": "Jennifer Zajaczkowski",
    "additional_insured_relation_to_primary_insured": "Spouse",
    "additional_insured_dob": "1987-08-20",
    "additional_insured_gender": "Female",
    "additional_insured_marital_status": "Married",
    "additional_insured_dl_number": "DL98765432",
    "additional_insured_license_state": "MN",
    "additional_insured_education_occupation": "Nurse"
  }
]'
WHERE primary_named_insured_email_address = 'mike.z@example.com';

-- Insert contacts for the business client
INSERT INTO contacts (
  client_id,
  first_name,
  last_name,
  title,
  email,
  phone_number,
  is_primary_contact,
  notes,
  created_at
)
VALUES
  (
    '66666666-6666-6666-6666-666666666666',
    'John',
    'Smith',
    'CEO',
    'john.smith@acmecorp.example.com',
    '555-789-0124',
    TRUE,
    'Primary decision maker for all insurance matters.',
    NOW() - INTERVAL '15 days'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Jane',
    'Doe',
    'CFO',
    'jane.doe@acmecorp.example.com',
    '555-789-0125',
    FALSE,
    'Handles financial aspects of insurance decisions.',
    NOW() - INTERVAL '15 days'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Robert',
    'Johnson',
    'Facilities Manager',
    'robert.johnson@acmecorp.example.com',
    '555-789-0126',
    FALSE,
    'Manages property and can provide details about facilities.',
    NOW() - INTERVAL '14 days'
  );

-- Insert notes for each lead
INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Initial contact made. Client is interested in getting a quote.', 'Brian B', created_at
FROM leads;

-- Insert additional notes for specific leads
INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Followed up via email. Waiting for response.', 'Brian B', created_at + INTERVAL '1 day'
FROM leads
WHERE status IN ('Contacted', 'Quoted');

INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Quote prepared and sent to client.', 'Brian B', created_at + INTERVAL '2 days'
FROM leads
WHERE status IN ('Quoted', 'Sold');

INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Client accepted quote. Processing paperwork.', 'Brian B', created_at + INTERVAL '5 days'
FROM leads
WHERE status = 'Sold';

-- Insert specific note for business client
INSERT INTO lead_notes (lead_id, note_content, created_by, created_at)
SELECT id, 'Met with John Smith and Jane Doe to discuss commercial coverage needs. They require property, liability, and business interruption coverage.', 'Brian B', created_at + INTERVAL '1 day'
FROM leads
WHERE insurance_type = 'Commercial';

-- Insert communications for each lead
INSERT INTO lead_communications (lead_id, type, direction, content, created_by, created_at)
SELECT id, 'Email', 'Outbound', 'Sent welcome email with information about our services.', 'Brian B', created_at
FROM leads;

-- Insert additional communications for specific leads
INSERT INTO lead_communications (lead_id, type, direction, content, created_by, created_at)
SELECT id, 'Call', 'Outbound', 'Called to discuss insurance needs and gather information.', 'Brian B', created_at + INTERVAL '1 day'
FROM leads
WHERE status IN ('Contacted', 'Quoted', 'Sold');

INSERT INTO lead_communications (lead_id, type, direction, content, created_by, created_at)
SELECT id, 'Email', 'Outbound', 'Sent quote details and coverage options.', 'Brian B', created_at + INTERVAL '2 days'
FROM leads
WHERE status IN ('Quoted', 'Sold');

INSERT INTO lead_communications (lead_id, type, direction, content, created_by, created_at)
SELECT id, 'Call', 'Inbound', 'Client called with questions about the quote.', 'Brian B', created_at + INTERVAL '3 days'
FROM leads
WHERE status IN ('Quoted', 'Sold');

-- Insert communications with contacts for business client
INSERT INTO lead_communications (
  lead_id,
  contact_id,
  type,
  direction,
  content,
  created_by,
  created_at
)
SELECT
  l.id,
  c.id,
  'Meeting',
  'Outbound',
  'In-person meeting to discuss commercial insurance needs and tour the facility.',
  'Brian B',
  l.created_at + INTERVAL '2 days'
FROM
  leads l
  JOIN contacts c ON c.client_id = l.client_id AND c.is_primary_contact = TRUE
WHERE
  l.insurance_type = 'Commercial';

-- Insert marketing settings for each lead
INSERT INTO lead_marketing_settings (lead_id, campaign_id, is_active, settings)
SELECT id,
  CASE
    WHEN status = 'New' THEN 'welcome_series'
    WHEN status = 'Contacted' THEN 'follow_up'
    WHEN status = 'Quoted' THEN 'quote_reminder'
    WHEN status = 'Sold' THEN 'onboarding'
    WHEN status = 'Lost' THEN 'win_back'
  END,
  true,
  CASE
    WHEN status = 'New' THEN '{"frequency": "weekly", "channel": "email"}'
    WHEN status = 'Contacted' THEN '{"frequency": "3_days", "channel": "email,sms"}'
    WHEN status = 'Quoted' THEN '{"frequency": "2_days", "channel": "email,call"}'
    WHEN status = 'Sold' THEN '{"frequency": "monthly", "channel": "email"}'
    WHEN status = 'Lost' THEN '{"frequency": "quarterly", "channel": "email"}'
  END
FROM leads;

-- Insert opportunity for business client
INSERT INTO opportunities (
  lead_id,
  name,
  stage,
  amount,
  probability,
  expected_close_date,
  notes,
  created_at
)
SELECT
  id,
  'Commercial Property & Liability Package',
  'Proposal',
  4500.00,
  70,
  created_at + INTERVAL '30 days',
  'Comprehensive commercial package including property, liability, and business interruption coverage.',
  created_at
FROM
  leads
WHERE
  insurance_type = 'Commercial';

-- Insert AI interactions for demonstration
INSERT INTO ai_interactions (
  lead_id,
  type,
  source,
  content,
  ai_response,
  summary,
  model_used,
  temperature,
  metadata,
  created_at
)
SELECT
  id,
  'Chat',
  'Agent UI',
  'Can you help me draft an email to follow up with this client about their auto insurance quote?',
  'Here''s a draft email for following up on the auto insurance quote:\n\nSubject: Following Up on Your Auto Insurance Quote\n\nDear [Client Name],\n\nI hope this email finds you well. I wanted to follow up on the auto insurance quote we discussed recently. Have you had a chance to review the coverage options and rates we provided?\n\nIf you have any questions or would like to discuss any aspects of the quote in more detail, please don''t hesitate to reach out. I''m here to help ensure you get the coverage that best meets your needs.\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]',
  'Email template for following up on auto insurance quote',
  'gpt-4',
  0.7,
  '{"purpose": "client_communication", "quote_reference": "Q-2023-1234"}',
  NOW() - INTERVAL '1 day'
FROM
  leads
WHERE
  insurance_type = 'Auto' AND status = 'Quoted'
LIMIT 1;

-- Insert support ticket for demonstration
INSERT INTO support_tickets (
  lead_id,
  created_by,
  issue_type,
  issue_description,
  resolution_summary,
  status,
  assigned_to,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  'Brian B',
  'Billing',
  'Client reports discrepancy between quoted premium and actual bill.',
  'Verified quote details and explained the difference was due to additional coverage options selected during policy binding.',
  'Resolved',
  'Brian B',
  '{"follow_up_needed": false, "client_satisfaction": "high"}',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '8 days'
FROM
  leads
WHERE
  status = 'Sold'
LIMIT 1;
