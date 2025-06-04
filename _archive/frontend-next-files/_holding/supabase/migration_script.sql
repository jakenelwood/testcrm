-- Migration script to update the existing database to the new B2B/B2C schema
-- This script assumes you're starting with the original schema and want to migrate to the new one
-- Since we're dealing with test data, this script will:
-- 1. Create new tables
-- 2. Migrate any existing data
-- 3. Drop old tables
-- 4. Rename new tables to the original names

-- Step 1: Create new tables with temporary names
CREATE TABLE clients_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_type TEXT NOT NULL DEFAULT 'Individual' CHECK (client_type IN ('Individual', 'Business')),
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  mailing_address TEXT,
  referred_by TEXT,
  date_of_birth TEXT,
  gender TEXT,
  marital_status TEXT,
  drivers_license TEXT,
  license_state TEXT,
  education_occupation TEXT,
  business_type TEXT,
  industry TEXT,
  tax_id TEXT,
  year_established TEXT,
  annual_revenue DECIMAL(15, 2),
  number_of_employees INTEGER,
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leads_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients_new(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Quoted', 'Sold', 'Lost')),
  assigned_to TEXT,
  notes TEXT,
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('Auto', 'Home', 'Specialty', 'Commercial', 'Liability')),
  current_carrier TEXT,
  premium DECIMAL(10, 2),
  auto_premium DECIMAL(10, 2),
  home_premium DECIMAL(10, 2),
  specialty_premium DECIMAL(10, 2),
  commercial_premium DECIMAL(10, 2),
  umbrella_value DECIMAL(10, 2),
  umbrella_uninsured_underinsured TEXT,
  auto_current_insurance_carrier TEXT,
  auto_months_with_current_carrier INTEGER,
  specialty_type TEXT,
  specialty_make TEXT,
  specialty_model TEXT,
  specialty_year INTEGER,
  commercial_coverage_type TEXT,
  commercial_industry TEXT,
  auto_data JSONB,
  home_data JSONB,
  specialty_data JSONB,
  commercial_data JSONB,
  liability_data JSONB,
  additional_insureds JSONB,
  additional_locations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients_new(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone_number TEXT,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lead_notes_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads_new(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lead_communications_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads_new(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('Email', 'SMS', 'Call', 'Note', 'Meeting')),
  direction TEXT CHECK (direction IN ('Inbound', 'Outbound')),
  content TEXT,
  status TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lead_marketing_settings_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads_new(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads_new(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage TEXT NOT NULL,
  amount DECIMAL(15, 2),
  probability INTEGER,
  expected_close_date DATE,
  actual_close_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Migrate existing data
-- First, create clients from existing leads
INSERT INTO clients_new (
  id,
  client_type,
  name,
  email,
  phone_number,
  street_address,
  city,
  state,
  zip_code,
  referred_by,
  date_of_birth,
  gender,
  marital_status,
  drivers_license,
  license_state,
  education_occupation,
  created_at,
  updated_at
)
SELECT
  id,
  'Individual',
  first_name || ' ' || last_name,
  email,
  phone_number,
  NULL, -- street_address (not in original schema)
  NULL, -- city (not in original schema)
  NULL, -- state (not in original schema)
  NULL, -- zip_code (not in original schema)
  NULL, -- referred_by (not in original schema)
  NULL, -- date_of_birth (not in original schema)
  NULL, -- gender (not in original schema)
  NULL, -- marital_status (not in original schema)
  NULL, -- drivers_license (not in original schema)
  NULL, -- license_state (not in original schema)
  NULL, -- education_occupation (not in original schema)
  created_at,
  updated_at
FROM leads;

-- Then, migrate the leads data
INSERT INTO leads_new (
  id,
  client_id,
  status,
  assigned_to,
  notes,
  insurance_type,
  current_carrier,
  premium,
  auto_data,
  home_data,
  specialty_data,
  created_at,
  updated_at
)
SELECT
  id,
  id, -- Use the same ID for client_id (since we created clients with lead IDs)
  status,
  assigned_to,
  notes,
  insurance_type,
  current_carrier,
  premium,
  auto_data,
  home_data,
  specialty_data,
  created_at,
  updated_at
FROM leads;

-- Migrate lead notes
INSERT INTO lead_notes_new (
  id,
  lead_id,
  note_content,
  created_by,
  created_at
)
SELECT
  id,
  lead_id,
  note_content,
  created_by,
  created_at
FROM lead_notes;

-- Migrate lead communications
INSERT INTO lead_communications_new (
  id,
  lead_id,
  type,
  direction,
  content,
  status,
  created_by,
  created_at
)
SELECT
  id,
  lead_id,
  type,
  direction,
  content,
  status,
  created_by,
  created_at
FROM lead_communications;

-- Migrate lead marketing settings
INSERT INTO lead_marketing_settings_new (
  id,
  lead_id,
  campaign_id,
  is_active,
  settings,
  created_at,
  updated_at
)
SELECT
  id,
  lead_id,
  campaign_id,
  is_active,
  settings,
  created_at,
  updated_at
FROM lead_marketing_settings;

-- Step 3: Drop old tables (in reverse order of dependencies)
DROP TABLE IF EXISTS lead_marketing_settings;
DROP TABLE IF EXISTS lead_communications;
DROP TABLE IF EXISTS lead_notes;
DROP TABLE IF EXISTS leads;

-- Step 4: Rename new tables to original names
ALTER TABLE lead_marketing_settings_new RENAME TO lead_marketing_settings;
ALTER TABLE lead_communications_new RENAME TO lead_communications;
ALTER TABLE lead_notes_new RENAME TO lead_notes;
ALTER TABLE leads_new RENAME TO leads;

-- Step 5: Create indexes for faster queries
CREATE INDEX clients_type_idx ON clients_new (client_type);
CREATE INDEX clients_name_idx ON clients_new (name);
CREATE INDEX clients_email_idx ON clients_new (email);
CREATE INDEX clients_phone_idx ON clients_new (phone_number);
CREATE INDEX clients_location_idx ON clients_new (city, state, zip_code);

CREATE INDEX leads_client_id_idx ON leads (client_id);
CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_insurance_type_idx ON leads (insurance_type);
CREATE INDEX leads_assigned_to_idx ON leads (assigned_to);

CREATE INDEX contacts_client_id_idx ON contacts (client_id);
CREATE INDEX contacts_name_idx ON contacts (first_name, last_name);
CREATE INDEX contacts_primary_idx ON contacts (client_id, is_primary_contact);

CREATE INDEX lead_notes_lead_id_idx ON lead_notes (lead_id);
CREATE INDEX lead_communications_lead_id_idx ON lead_communications (lead_id);
CREATE INDEX lead_communications_contact_id_idx ON lead_communications (contact_id);
CREATE INDEX lead_marketing_settings_lead_id_idx ON lead_marketing_settings (lead_id);
CREATE INDEX opportunities_lead_id_idx ON opportunities (lead_id);

-- Create indexes on JSON fields for better performance
CREATE INDEX leads_auto_data_idx ON leads USING GIN (auto_data);
CREATE INDEX leads_home_data_idx ON leads USING GIN (home_data);
CREATE INDEX leads_specialty_data_idx ON leads USING GIN (specialty_data);
CREATE INDEX leads_commercial_data_idx ON leads USING GIN (commercial_data);
CREATE INDEX leads_additional_insureds_idx ON leads USING GIN (additional_insureds);
CREATE INDEX leads_additional_locations_idx ON leads USING GIN (additional_locations);
