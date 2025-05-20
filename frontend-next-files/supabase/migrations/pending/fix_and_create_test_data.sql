-- First, check if the renamed tables exist
DO $$
DECLARE
  leads_ins_info_exists BOOLEAN;
  leads_contact_info_exists BOOLEAN;
  leads_exists BOOLEAN;
  clients_exists BOOLEAN;
BEGIN
  -- Check if renamed tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads_ins_info'
  ) INTO leads_ins_info_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads_contact_info'
  ) INTO leads_contact_info_exists;

  -- Check if original tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) INTO leads_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) INTO clients_exists;

  -- If renamed tables don't exist but original tables do, rename them
  IF NOT leads_ins_info_exists AND leads_exists THEN
    RAISE NOTICE 'Renaming leads table to leads_ins_info';
    EXECUTE 'ALTER TABLE leads RENAME TO leads_ins_info';
  END IF;

  IF NOT leads_contact_info_exists AND clients_exists THEN
    RAISE NOTICE 'Renaming clients table to leads_contact_info';
    EXECUTE 'ALTER TABLE clients RENAME TO leads_contact_info';
  END IF;
END
$$;

-- Now proceed with creating test data

-- Step 1: Delete existing test data
DELETE FROM lead_notes;
DELETE FROM lead_communications;
DELETE FROM lead_marketing_settings;
DELETE FROM opportunities;
DELETE FROM vehicles;
DELETE FROM specialty_items;
DELETE FROM other_insureds;
DELETE FROM homes;
DELETE FROM leads_ins_info;
DELETE FROM leads_contact_info;
DELETE FROM addresses;

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

-- Check if pipeline with ID 1 exists, if not create it
DO $$
DECLARE
  pipeline_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pipelines WHERE id = 1
  ) INTO pipeline_exists;

  IF NOT pipeline_exists THEN
    RAISE NOTICE 'Creating default Alpha pipeline';
    INSERT INTO pipelines (id, name, description, is_default, display_order)
    VALUES (1, 'Alpha', 'Standard sales pipeline for personal insurance', TRUE, 1);
  END IF;
END
$$;

-- Check if insurance_types with ID 1 and 2 exist, if not create them
DO $$
DECLARE
  type1_exists BOOLEAN;
  type2_exists BOOLEAN;
BEGIN
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
END
$$;

-- Check if lead_statuses with IDs 1-4 exist, if not create them
DO $$
DECLARE
  status1_exists BOOLEAN;
  status2_exists BOOLEAN;
  status3_exists BOOLEAN;
  status4_exists BOOLEAN;
BEGIN
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
