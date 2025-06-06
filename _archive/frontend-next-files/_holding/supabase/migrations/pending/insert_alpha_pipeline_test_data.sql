-- Insert Alpha Pipeline Test Data
-- This script inserts test data for the Alpha pipeline (personal insurance)

-- First, check if required reference tables have data
DO $$
DECLARE
  pipeline_exists BOOLEAN;
  type1_exists BOOLEAN;
  type2_exists BOOLEAN;
  status1_exists BOOLEAN;
  status2_exists BOOLEAN;
  status3_exists BOOLEAN;
  status4_exists BOOLEAN;
BEGIN
  -- Check pipelines
  SELECT EXISTS (
    SELECT FROM pipelines WHERE id = 1
  ) INTO pipeline_exists;

  IF NOT pipeline_exists THEN
    RAISE NOTICE 'Creating default Alpha pipeline';
    INSERT INTO pipelines (id, name, description, is_default, display_order)
    VALUES (1, 'Alpha', 'Standard sales pipeline for personal insurance', TRUE, 1);
  END IF;

  -- Check insurance types
  SELECT EXISTS (
    SELECT FROM insurance_types WHERE id = 1
  ) INTO type1_exists;

  SELECT EXISTS (
    SELECT FROM insurance_types WHERE id = 2
  ) INTO type2_exists;

  IF NOT type1_exists THEN
    RAISE NOTICE 'Creating Auto insurance type';
    INSERT INTO insurance_types (id, name, description)
    VALUES (1, 'Auto', 'Automobile insurance');
  END IF;

  IF NOT type2_exists THEN
    RAISE NOTICE 'Creating Home insurance type';
    INSERT INTO insurance_types (id, name, description)
    VALUES (2, 'Home', 'Home insurance');
  END IF;

  -- Check lead statuses
  SELECT EXISTS (SELECT FROM lead_statuses WHERE id = 1) INTO status1_exists;
  SELECT EXISTS (SELECT FROM lead_statuses WHERE id = 2) INTO status2_exists;
  SELECT EXISTS (SELECT FROM lead_statuses WHERE id = 3) INTO status3_exists;
  SELECT EXISTS (SELECT FROM lead_statuses WHERE id = 4) INTO status4_exists;

  IF NOT status1_exists THEN
    INSERT INTO lead_statuses (id, value, description, is_final, display_order)
    VALUES (1, 'New', 'New lead', FALSE, 1);
  END IF;

  IF NOT status2_exists THEN
    INSERT INTO lead_statuses (id, value, description, is_final, display_order)
    VALUES (2, 'Contacted', 'Lead has been contacted', FALSE, 2);
  END IF;

  IF NOT status3_exists THEN
    INSERT INTO lead_statuses (id, value, description, is_final, display_order)
    VALUES (3, 'Quoted', 'Quote provided to lead', FALSE, 3);
  END IF;

  IF NOT status4_exists THEN
    INSERT INTO lead_statuses (id, value, description, is_final, display_order)
    VALUES (4, 'Sold', 'Lead converted to client', TRUE, 4);
  END IF;
END
$$;

-- Step 1: Delete existing test data
DELETE FROM lead_notes WHERE lead_id IN (
  'f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c',
  'a6b7c8d9-e0f1-2a3b-4c5d-6e7f8a9b0c1d',
  'b7c8d9e0-f1a2-3b4c-5d6e-7f8a9b0c1d2e',
  'c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f',
  'd9e0f1a2-b3c4-5d6e-7f8a-9b0c1d2e3f4a'
);

DELETE FROM lead_communications WHERE lead_id IN (
  'f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c',
  'a6b7c8d9-e0f1-2a3b-4c5d-6e7f8a9b0c1d',
  'b7c8d9e0-f1a2-3b4c-5d6e-7f8a9b0c1d2e',
  'c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f',
  'd9e0f1a2-b3c4-5d6e-7f8a-9b0c1d2e3f4a'
);

DELETE FROM lead_marketing_settings WHERE lead_id IN (
  'f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c',
  'a6b7c8d9-e0f1-2a3b-4c5d-6e7f8a9b0c1d',
  'b7c8d9e0-f1a2-3b4c-5d6e-7f8a9b0c1d2e',
  'c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f',
  'd9e0f1a2-b3c4-5d6e-7f8a-9b0c1d2e3f4a'
);

DELETE FROM opportunities WHERE lead_id IN (
  'f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c',
  'a6b7c8d9-e0f1-2a3b-4c5d-6e7f8a9b0c1d',
  'b7c8d9e0-f1a2-3b4c-5d6e-7f8a9b0c1d2e',
  'c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f',
  'd9e0f1a2-b3c4-5d6e-7f8a-9b0c1d2e3f4a'
);

-- Delete test vehicles, specialty items, other insureds, and homes
DELETE FROM vehicles WHERE id IN (
  'f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c',
  'a8b9c0d1-e2f3-4a5b-6c7d-8e9f0a1b2c3d',
  'b9c0d1e2-f3a4-5b6c-7d8e-9f0a1b2c3d4e',
  'c0d1e2f3-a4b5-6c7d-8e9f-0a1b2c3d4e5f',
  'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a',
  'e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b'
);

DELETE FROM specialty_items WHERE id IN (
  'f3a4b5c6-d7e8-9f0a-1b2c-3d4e5f6a7b8c',
  'a4b5c6d7-e8f9-0a1b-2c3d-4e5f6a7b8c9d'
);

DELETE FROM other_insureds WHERE id IN (
  'f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c',
  'a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d',
  'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e',
  'c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f',
  'd5e6f7a8-b9c0-1d2e-3f4a-5b6c7d8e9f0a',
  'e6f7a8b9-c0d1-2e3f-4a5b-6c7d8e9f0a1b'
);

DELETE FROM homes WHERE id IN (
  'f4a5b6c7-d8e9-0f1a-2b3c-4d5e6f7a8b9c',
  'a5b6c7d8-e9f0-1a2b-3c4d-5e6f7a8b9c0d',
  'b6c7d8e9-f0a1-2b3c-4d5e-6f7a8b9c0d1e'
);

-- Delete test leads and clients
DELETE FROM leads_ins_info WHERE id IN (
  'f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c',
  'a6b7c8d9-e0f1-2a3b-4c5d-6e7f8a9b0c1d',
  'b7c8d9e0-f1a2-3b4c-5d6e-7f8a9b0c1d2e',
  'c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f',
  'd9e0f1a2-b3c4-5d6e-7f8a-9b0c1d2e3f4a'
);

DELETE FROM leads_contact_info WHERE id IN (
  'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
  'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
  'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f',
  'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a',
  'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b'
);

-- Delete test addresses
DELETE FROM addresses WHERE id IN (
  'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
  'b2c3d4e5-f6a7-5b6c-9d0e-2f3a4b5c6d7e',
  'c3d4e5f6-a7b8-6c7d-0e1f-3a4b5c6d7e8f',
  'd4e5f6a7-b8c9-7d0e-1f2a-4b5c6d7e8f9a',
  'e5f6a7b8-c9d0-8e1f-2a3b-5c6d7e8f9a0b',
  'f6a7b8c9-d0e1-9f2a-3b4c-6d7e8f9a0b1c',
  'a7b8c9d0-e1f2-0a3b-4c5d-7e8f9a0b1c2d',
  'b8c9d0e1-f2a3-1b4c-5d6e-8f9a0b1c2d3e',
  'c9d0e1f2-a3b4-2c5d-6e7f-9a0b1c2d3e4f',
  'd0e1f2a3-b4c5-3d6e-7f8a-0b1c2d3e4f5a'
);

-- Step 2: Create new test data

-- Create addresses
INSERT INTO addresses (id, street, city, state, zip_code, type, is_verified, geocode_lat, geocode_lng, created_at, updated_at)
VALUES
  -- Primary addresses
  ('a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d', '123 Main St', 'Minneapolis', 'MN', '55401', 'Physical', true, 44.9778, -93.2650, NOW(), NOW()),
  ('b2c3d4e5-f6a7-5b6c-9d0e-2f3a4b5c6d7e', '456 Oak Ave', 'St. Paul', 'MN', '55102', 'Physical', true, 44.9537, -93.0900, NOW(), NOW()),
  ('c3d4e5f6-a7b8-6c7d-0e1f-3a4b5c6d7e8f', '789 Pine Rd', 'Edina', 'MN', '55424', 'Physical', true, 44.8897, -93.3501, NOW(), NOW()),
  ('d4e5f6a7-b8c9-7d0e-1f2a-4b5c6d7e8f9a', '101 Cedar Ln', 'Bloomington', 'MN', '55420', 'Physical', true, 44.8408, -93.2983, NOW(), NOW()),
  ('e5f6a7b8-c9d0-8e1f-2a3b-5c6d7e8f9a0b', '202 Maple Dr', 'Plymouth', 'MN', '55441', 'Physical', true, 45.0105, -93.4555, NOW(), NOW()),

  -- Mailing addresses (same as primary for some, different for others)
  ('f6a7b8c9-d0e1-9f2a-3b4c-6d7e8f9a0b1c', '123 Main St', 'Minneapolis', 'MN', '55401', 'Mailing', true, 44.9778, -93.2650, NOW(), NOW()),
  ('a7b8c9d0-e1f2-0a3b-4c5d-7e8f9a0b1c2d', 'PO Box 1234', 'Minneapolis', 'MN', '55402', 'Mailing', true, 44.9778, -93.2650, NOW(), NOW()),
  ('b8c9d0e1-f2a3-1b4c-5d6e-8f9a0b1c2d3e', '456 Oak Ave', 'St. Paul', 'MN', '55102', 'Mailing', true, 44.9537, -93.0900, NOW(), NOW()),
  ('c9d0e1f2-a3b4-2c5d-6e7f-9a0b1c2d3e4f', 'PO Box 5678', 'Edina', 'MN', '55424', 'Mailing', true, 44.8897, -93.3501, NOW(), NOW()),
  ('d0e1f2a3-b4c5-3d6e-7f8a-0b1c2d3e4f5a', '101 Cedar Ln', 'Bloomington', 'MN', '55420', 'Mailing', true, 44.8408, -93.2983, NOW(), NOW());

-- Create leads_contact_info (clients)
INSERT INTO leads_contact_info (id, client_type, name, email, phone_number, address_id, mailing_address_id, date_of_birth, gender, marital_status, drivers_license, license_state, education_occupation, created_at, updated_at)
VALUES
  ('a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d', 'Individual', 'John Smith', 'john.smith@example.com', '612-555-1234', 'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d', 'f6a7b8c9-d0e1-9f2a-3b4c-6d7e8f9a0b1c', '1980-05-15', 'Male', 'Married', 'S12345678', 'MN', 'Software Engineer', NOW(), NOW()),
  ('b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', 'Individual', 'Jane Doe', 'jane.doe@example.com', '651-555-5678', 'b2c3d4e5-f6a7-5b6c-9d0e-2f3a4b5c6d7e', 'a7b8c9d0-e1f2-0a3b-4c5d-7e8f9a0b1c2d', '1985-08-22', 'Female', 'Single', 'D87654321', 'MN', 'Marketing Director', NOW(), NOW()),
  ('c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f', 'Individual', 'Robert Johnson', 'robert.johnson@example.com', '763-555-9012', 'c3d4e5f6-a7b8-6c7d-0e1f-3a4b5c6d7e8f', 'c9d0e1f2-a3b4-2c5d-6e7f-9a0b1c2d3e4f', '1975-03-10', 'Male', 'Divorced', 'J23456789', 'MN', 'Financial Analyst', NOW(), NOW()),
  ('d3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a', 'Individual', 'Emily Wilson', 'emily.wilson@example.com', '952-555-3456', 'd4e5f6a7-b8c9-7d0e-1f2a-4b5c6d7e8f9a', 'd0e1f2a3-b4c5-3d6e-7f8a-0b1c2d3e4f5a', '1990-11-28', 'Female', 'Married', 'W34567890', 'MN', 'Physician', NOW(), NOW()),
  ('e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b', 'Individual', 'Michael Brown', 'michael.brown@example.com', '612-555-7890', 'e5f6a7b8-c9d0-8e1f-2a3b-5c6d7e8f9a0b', 'b8c9d0e1-f2a3-1b4c-5d6e-8f9a0b1c2d3e', '1982-07-04', 'Male', 'Married', 'B45678901', 'MN', 'Construction Manager', NOW(), NOW());

-- Create homes
INSERT INTO homes (id, address, city, state, zip, year_built, square_feet, construction_type, roof_type, user_id, created_at, updated_at)
VALUES
  ('f4a5b6c7-d8e9-0f1a-2b3c-4d5e6f7a8b9c', '123 Main St', 'Minneapolis', 'MN', '55401', 1995, 2200, 'Frame', 'Asphalt Shingle', NULL, NOW(), NOW()),
  ('a5b6c7d8-e9f0-1a2b-3c4d-5e6f7a8b9c0d', '456 Oak Ave', 'St. Paul', 'MN', '55102', 2010, 1800, 'Frame', 'Asphalt Shingle', NULL, NOW(), NOW()),
  ('b6c7d8e9-f0a1-2b3c-4d5e-6f7a8b9c0d1e', '789 Pine Rd', 'Edina', 'MN', '55424', 2005, 2800, 'Brick', 'Metal', NULL, NOW(), NOW());

-- Create leads_ins_info
INSERT INTO leads_ins_info (
  id, status_id, insurance_type_id, assigned_to, notes, current_carrier, premium,
  auto_premium, home_premium, specialty_premium, umbrella_value,
  auto_current_insurance_carrier, auto_months_with_current_carrier,
  auto_data, auto_data_schema_version,
  home_data, home_data_schema_version,
  specialty_data, specialty_data_schema_version,
  additional_insureds, pipeline_id, address_id, mailing_address_id, client_id,
  created_at, updated_at, status_changed_at
)
VALUES
  -- John Smith - Auto + Home + Umbrella
  ('f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c', 3, 1, 'agent@example.com',
   'Client looking for bundled auto and home insurance with umbrella coverage',
   'State Farm', 2450.00, 1200.00, 950.00, 0, 300.00, 'State Farm', 36,
   '{
     "vehicles": [
       {
         "year": 2020,
         "make": "Toyota",
         "model": "Highlander",
         "vin": "1HGCM82633A123456",
         "primary_use": "Commute",
         "annual_mileage": 12000
       },
       {
         "year": 2018,
         "make": "Honda",
         "model": "Civic",
         "vin": "2HGFC2F52JH123456",
         "primary_use": "Pleasure",
         "annual_mileage": 8000
       }
     ],
     "drivers": [
       {
         "name": "John Smith",
         "license": "S12345678",
         "state": "MN",
         "primary": true
       },
       {
         "name": "Mary Smith",
         "license": "S87654321",
         "state": "MN",
         "primary": false
       }
     ],
     "coverages": {
       "liability": "100/300/100",
       "uninsured_motorist": "100/300",
       "comprehensive_deductible": 500,
       "collision_deductible": 500
     }
   }', '1.0',
   '{
     "property_type": "Single Family",
     "year_built": 1995,
     "square_feet": 2200,
     "construction_type": "Frame",
     "roof_type": "Asphalt Shingle",
     "num_bathrooms": 2.5,
     "num_bedrooms": 4,
     "garage_type": "Attached",
     "garage_size": 2,
     "replacement_cost": 350000,
     "coverages": {
       "dwelling": 350000,
       "personal_property": 175000,
       "liability": 300000,
       "medical": 5000,
       "deductible": 1000
     },
     "safety_features": ["Smoke Detectors", "Security System", "Fire Extinguisher"]
   }', '1.0',
   NULL, NULL,
   '[
     {
       "name": "Mary Smith",
       "relationship": "Spouse",
       "date_of_birth": "1982-09-20",
       "gender": "Female"
     },
     {
       "name": "James Smith",
       "relationship": "Child",
       "date_of_birth": "2010-03-15",
       "gender": "Male"
     },
     {
       "name": "Emma Smith",
       "relationship": "Child",
       "date_of_birth": "2012-07-10",
       "gender": "Female"
     }
   ]',
   1, 'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d', 'f6a7b8c9-d0e1-9f2a-3b4c-6d7e8f9a0b1c', 'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
   NOW(), NOW(), NOW()),

  -- Jane Doe - Auto only
  ('a6b7c8d9-e0f1-2a3b-4c5d-6e7f8a9b0c1d', 2, 1, 'agent@example.com',
   'Client interested in auto insurance only, currently with high premiums',
   'Progressive', 1100.00, 1100.00, 0, 0, 0, 'Progressive', 24,
   '{
     "vehicles": [
       {
         "year": 2019,
         "make": "Subaru",
         "model": "Outback",
         "vin": "4S3BNAC61J3123456",
         "primary_use": "Commute",
         "annual_mileage": 15000
       }
     ],
     "drivers": [
       {
         "name": "Jane Doe",
         "license": "D87654321",
         "state": "MN",
         "primary": true
       }
     ],
     "coverages": {
       "liability": "100/300/100",
       "uninsured_motorist": "100/300",
       "comprehensive_deductible": 250,
       "collision_deductible": 500
     }
   }', '1.0',
   NULL, NULL, NULL, NULL, NULL,
   1, 'b2c3d4e5-f6a7-5b6c-9d0e-2f3a4b5c6d7e', 'a7b8c9d0-e1f2-0a3b-4c5d-7e8f9a0b1c2d', 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
   NOW(), NOW(), NOW()),

  -- Robert Johnson - Home + Specialty (Boat)
  ('b7c8d9e0-f1a2-3b4c-5d6e-7f8a9b0c1d2e', 1, 2, 'agent@example.com',
   'Client looking for home insurance and coverage for a boat',
   'Allstate', 1800.00, 0, 1200.00, 600.00, 0, NULL, NULL,
   NULL, NULL,
   '{
     "property_type": "Single Family",
     "year_built": 2005,
     "square_feet": 2800,
     "construction_type": "Brick",
     "roof_type": "Metal",
     "num_bathrooms": 3,
     "num_bedrooms": 4,
     "garage_type": "Attached",
     "garage_size": 3,
     "replacement_cost": 450000,
     "coverages": {
       "dwelling": 450000,
       "personal_property": 225000,
       "liability": 300000,
       "medical": 5000,
       "deductible": 1000
     },
     "safety_features": ["Smoke Detectors", "Security System", "Sprinkler System", "Fire Extinguisher"]
   }', '1.0',
   '{
     "type": "Boat",
     "year": 2018,
     "make": "Sea Ray",
     "model": "Sundancer 320",
     "length": 32,
     "value": 120000,
     "max_speed": 40,
     "storage_location": "Marina",
     "coverages": {
       "hull": 120000,
       "liability": 300000,
       "medical": 5000,
       "uninsured_boater": 100000,
       "deductible": 1000
     }
   }', '1.0',
   '[
     {
       "name": "Sarah Johnson",
       "relationship": "Spouse",
       "date_of_birth": "1978-11-05",
       "gender": "Female"
     }
   ]',
   1, 'c3d4e5f6-a7b8-6c7d-0e1f-3a4b5c6d7e8f', 'c9d0e1f2-a3b4-2c5d-6e7f-9a0b1c2d3e4f', 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f',
   NOW(), NOW(), NOW()),

  -- Emily Wilson - Auto + Home
  ('c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f', 4, 1, 'agent@example.com',
   'Client purchased bundled auto and home insurance',
   'Liberty Mutual', 2200.00, 1400.00, 800.00, 0, 0, 'Liberty Mutual', 48,
   '{
     "vehicles": [
       {
         "year": 2021,
         "make": "Tesla",
         "model": "Model Y",
         "vin": "5YJ3E1EA1MF123456",
         "primary_use": "Commute",
         "annual_mileage": 10000
       },
       {
         "year": 2017,
         "make": "Jeep",
         "model": "Grand Cherokee",
         "vin": "1C4RJFAG5HC123456",
         "primary_use": "Pleasure",
         "annual_mileage": 5000
       }
     ],
     "drivers": [
       {
         "name": "Emily Wilson",
         "license": "W34567890",
         "state": "MN",
         "primary": true
       },
       {
         "name": "David Wilson",
         "license": "W12345678",
         "state": "MN",
         "primary": false
       }
     ],
     "coverages": {
       "liability": "250/500/100",
       "uninsured_motorist": "250/500",
       "comprehensive_deductible": 500,
       "collision_deductible": 500
     }
   }', '1.0',
   '{
     "property_type": "Townhouse",
     "year_built": 2010,
     "square_feet": 1800,
     "construction_type": "Frame",
     "roof_type": "Asphalt Shingle",
     "num_bathrooms": 2.5,
     "num_bedrooms": 3,
     "garage_type": "Attached",
     "garage_size": 2,
     "replacement_cost": 320000,
     "coverages": {
       "dwelling": 320000,
       "personal_property": 160000,
       "liability": 300000,
       "medical": 5000,
       "deductible": 1000
     },
     "safety_features": ["Smoke Detectors", "Security System", "Fire Extinguisher"]
   }', '1.0',
   NULL, NULL,
   '[
     {
       "name": "David Wilson",
       "relationship": "Spouse",
       "date_of_birth": "1988-04-12",
       "gender": "Male"
     }
   ]',
   1, 'd4e5f6a7-b8c9-7d0e-1f2a-4b5c6d7e8f9a', 'd0e1f2a3-b4c5-3d6e-7f8a-0b1c2d3e4f5a', 'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a',
   NOW(), NOW(), NOW()),

  -- Michael Brown - Auto + Specialty (Motorcycle)
  ('d9e0f1a2-b3c4-5d6e-7f8a-9b0c1d2e3f4a', 3, 1, 'agent@example.com',
   'Client looking for auto insurance and motorcycle coverage',
   'Farmers', 1950.00, 1350.00, 0, 600.00, 0, 'Farmers', 18,
   '{
     "vehicles": [
       {
         "year": 2019,
         "make": "Ford",
         "model": "F-150",
         "vin": "1FTEW1E53JFA12345",
         "primary_use": "Commute",
         "annual_mileage": 18000
       }
     ],
     "drivers": [
       {
         "name": "Michael Brown",
         "license": "B45678901",
         "state": "MN",
         "primary": true
       },
       {
         "name": "Jennifer Brown",
         "license": "B56789012",
         "state": "MN",
         "primary": false
       }
     ],
     "coverages": {
       "liability": "100/300/100",
       "uninsured_motorist": "100/300",
       "comprehensive_deductible": 500,
       "collision_deductible": 1000
     }
   }', '1.0',
   NULL, NULL,
   '{
     "type": "Motorcycle",
     "year": 2020,
     "make": "Harley-Davidson",
     "model": "Street Glide",
     "vin": "1HD1KTC14LB123456",
     "value": 22000,
     "storage": "Garage",
     "annual_mileage": 3000,
     "coverages": {
       "liability": "100/300/50",
       "uninsured_motorist": "100/300",
       "comprehensive_deductible": 250,
       "collision_deductible": 500,
       "medical": 5000
     }
   }', '1.0',
   '[
     {
       "name": "Jennifer Brown",
       "relationship": "Spouse",
       "date_of_birth": "1984-02-18",
       "gender": "Female"
     }
   ]',
   1, 'e5f6a7b8-c9d0-8e1f-2a3b-5c6d7e8f9a0b', 'b8c9d0e1-f2a3-1b4c-5d6e-8f9a0b1c2d3e', 'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b',
   NOW(), NOW(), NOW());

-- Create other_insureds
INSERT INTO other_insureds (id, name, relationship, date_of_birth, gender, user_id, created_at, updated_at)
VALUES
  -- John Smith's family
  ('f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c', 'Mary Smith', 'Spouse', '1982-09-20', 'Female', NULL, NOW(), NOW()),
  ('a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'James Smith', 'Child', '2010-03-15', 'Male', NULL, NOW(), NOW()),
  ('b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', 'Emma Smith', 'Child', '2012-07-10', 'Female', NULL, NOW(), NOW()),

  -- Robert Johnson's spouse
  ('c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f', 'Sarah Johnson', 'Spouse', '1978-11-05', 'Female', NULL, NOW(), NOW()),

  -- Emily Wilson's spouse
  ('d5e6f7a8-b9c0-1d2e-3f4a-5b6c7d8e9f0a', 'David Wilson', 'Spouse', '1988-04-12', 'Male', NULL, NOW(), NOW()),

  -- Michael Brown's spouse
  ('e6f7a8b9-c0d1-2e3f-4a5b-6c7d8e9f0a1b', 'Jennifer Brown', 'Spouse', '1984-02-18', 'Female', NULL, NOW(), NOW());

-- Create vehicles
INSERT INTO vehicles (id, make, model, year, vin, license_plate, state, primary_use, annual_mileage, user_id, created_at, updated_at)
VALUES
  -- John Smith's vehicles
  ('f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c', 'Toyota', 'Highlander', 2020, '1HGCM82633A123456', 'ABC-123', 'MN', 'Commute', 12000, NULL, NOW(), NOW()),
  ('a8b9c0d1-e2f3-4a5b-6c7d-8e9f0a1b2c3d', 'Honda', 'Civic', 2018, '2HGFC2F52JH123456', 'XYZ-789', 'MN', 'Pleasure', 8000, NULL, NOW(), NOW()),

  -- Jane Doe's vehicle
  ('b9c0d1e2-f3a4-5b6c-7d8e-9f0a1b2c3d4e', 'Subaru', 'Outback', 2019, '4S3BNAC61J3123456', 'DEF-456', 'MN', 'Commute', 15000, NULL, NOW(), NOW()),

  -- Emily Wilson's vehicles
  ('c0d1e2f3-a4b5-6c7d-8e9f-0a1b2c3d4e5f', 'Tesla', 'Model Y', 2021, '5YJ3E1EA1MF123456', 'GHI-789', 'MN', 'Commute', 10000, NULL, NOW(), NOW()),
  ('d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', 'Jeep', 'Grand Cherokee', 2017, '1C4RJFAG5HC123456', 'JKL-012', 'MN', 'Pleasure', 5000, NULL, NOW(), NOW()),

  -- Michael Brown's vehicle
  ('e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b', 'Ford', 'F-150', 2019, '1FTEW1E53JFA12345', 'MNO-345', 'MN', 'Commute', 18000, NULL, NOW(), NOW());

-- Create specialty items
INSERT INTO specialty_items (id, name, value, description, user_id, created_at, updated_at)
VALUES
  -- Robert Johnson's boat
  ('f3a4b5c6-d7e8-9f0a-1b2c-3d4e5f6a7b8c', 'Sea Ray Sundancer 320', 120000.00, '32-foot boat, 2018 model year, stored at marina', NULL, NOW(), NOW()),

  -- Michael Brown's motorcycle
  ('a4b5c6d7-e8f9-0a1b-2c3d-4e5f6a7b8c9d', 'Harley-Davidson Street Glide', 22000.00, '2020 model year, stored in garage', NULL, NOW(), NOW());
