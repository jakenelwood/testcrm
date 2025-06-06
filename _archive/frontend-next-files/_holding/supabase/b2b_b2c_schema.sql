-- Updated schema based on the data modeling strategy document and storage fields CSV
-- Designed to accommodate both B2C (individual) and B2B (business) clients

-- Create clients table (can be either individuals or businesses)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Client type
  client_type TEXT NOT NULL CHECK (client_type IN ('Individual', 'Business')),
  
  -- Common fields for both individual and business
  name TEXT NOT NULL, -- Full name for individuals, business name for businesses
  email TEXT,
  phone_number TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  mailing_address TEXT,
  referred_by TEXT,
  
  -- Individual-specific fields (null for businesses)
  date_of_birth TEXT,
  gender TEXT,
  marital_status TEXT,
  drivers_license TEXT,
  license_state TEXT,
  education_occupation TEXT,
  
  -- Business-specific fields (null for individuals)
  business_type TEXT,
  industry TEXT,
  tax_id TEXT,
  year_established TEXT,
  annual_revenue DECIMAL(15, 2),
  number_of_employees INTEGER,
  
  -- Contact person for business (null for individuals)
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table with relationship to clients
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to client (can be individual or business)
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Lead status and assignment
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Quoted', 'Sold', 'Lost')),
  assigned_to TEXT,
  notes TEXT,
  
  -- Insurance type and basic info
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('Auto', 'Home', 'Specialty', 'Commercial', 'Liability')),
  current_carrier TEXT,
  
  -- Premium fields (as columns per CSV)
  premium DECIMAL(10, 2),
  auto_premium DECIMAL(10, 2),
  home_premium DECIMAL(10, 2),
  specialty_premium DECIMAL(10, 2),
  commercial_premium DECIMAL(10, 2),
  
  -- Umbrella fields (as columns per CSV)
  umbrella_value DECIMAL(10, 2),
  umbrella_uninsured_underinsured TEXT,
  
  -- Auto specific columns (per CSV)
  auto_current_insurance_carrier TEXT,
  auto_months_with_current_carrier INTEGER,
  
  -- Specialty specific columns (per CSV)
  specialty_type TEXT,
  specialty_make TEXT,
  specialty_model TEXT,
  specialty_year INTEGER,
  
  -- Commercial specific columns
  commercial_coverage_type TEXT,
  commercial_industry TEXT,
  
  -- Store the detailed insurance data as JSON
  auto_data JSONB,
  home_data JSONB,
  specialty_data JSONB,
  commercial_data JSONB,
  liability_data JSONB,
  
  -- Additional insureds/covered entities as JSON array
  additional_insureds JSONB,
  
  -- Additional locations for businesses as JSON array
  additional_locations JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table for business relationships (employees, decision makers, etc.)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
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

-- Create lead_notes table
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_communications table
CREATE TABLE lead_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- For B2B communications
  type TEXT NOT NULL CHECK (type IN ('Email', 'SMS', 'Call', 'Note', 'Meeting')),
  direction TEXT CHECK (direction IN ('Inbound', 'Outbound')),
  content TEXT,
  status TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_marketing_settings table
CREATE TABLE lead_marketing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opportunities table for tracking sales opportunities (especially for B2B)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
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

-- Create indexes for faster queries
CREATE INDEX clients_type_idx ON clients (client_type);
CREATE INDEX clients_name_idx ON clients (name);
CREATE INDEX clients_email_idx ON clients (email);
CREATE INDEX clients_phone_idx ON clients (phone_number);
CREATE INDEX clients_location_idx ON clients (city, state, zip_code);

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
