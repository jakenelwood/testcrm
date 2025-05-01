-- Updated schema based on the data modeling strategy document and storage fields CSV

-- Create leads table with primary named insured fields as columns
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Primary Named Insured fields (as columns)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  date_of_birth TEXT,
  gender TEXT,
  marital_status TEXT,
  drivers_license TEXT,
  license_state TEXT,
  mailing_address TEXT,
  education_occupation TEXT,
  referred_by TEXT,
  
  -- Lead status and assignment
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Quoted', 'Sold', 'Lost')),
  assigned_to TEXT,
  notes TEXT,
  
  -- Insurance type and basic info
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('Auto', 'Home', 'Specialty')),
  current_carrier TEXT,
  
  -- Premium fields (as columns per CSV)
  premium DECIMAL(10, 2),
  auto_premium DECIMAL(10, 2),
  home_premium DECIMAL(10, 2),
  specialty_premium DECIMAL(10, 2),
  
  -- Umbrella fields (as columns per CSV)
  home_umbrella_value DECIMAL(10, 2),
  home_umbrella_uninsured_underinsured TEXT,
  
  -- Auto specific columns (per CSV)
  auto_current_insurance_carrier_auto TEXT,
  auto_months_with_current_carrier_auto INTEGER,
  
  -- Specialty specific columns (per CSV)
  specialty_additional_information TEXT,
  specialty_cc_size TEXT,
  specialty_collision_deductible DECIMAL(10, 2),
  specialty_comprehensive_deductible DECIMAL(10, 2),
  specialty_comprehensive_location_stored TEXT,
  specialty_make TEXT,
  specialty_market_value DECIMAL(10, 2),
  specialty_max_speed TEXT,
  specialty_model TEXT,
  specialty_total_hp TEXT,
  specialty_type_toy TEXT,
  specialty_vin TEXT,
  specialty_year INTEGER,
  
  -- Store the detailed insurance data as JSON
  auto_data JSONB,
  home_data JSONB,
  specialty_data JSONB,
  
  -- Additional insureds as JSON array
  additional_insureds JSONB,
  
  -- Timestamps
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
  type TEXT NOT NULL CHECK (type IN ('Email', 'SMS', 'Call', 'Note')),
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

-- Create indexes for faster queries
CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_insurance_type_idx ON leads (insurance_type);
CREATE INDEX leads_name_idx ON leads (first_name, last_name);
CREATE INDEX leads_email_idx ON leads (email);
CREATE INDEX leads_phone_idx ON leads (phone_number);
CREATE INDEX leads_address_idx ON leads (city, state, zip_code);
CREATE INDEX lead_notes_lead_id_idx ON lead_notes (lead_id);
CREATE INDEX lead_communications_lead_id_idx ON lead_communications (lead_id);
CREATE INDEX lead_marketing_settings_lead_id_idx ON lead_marketing_settings (lead_id);

-- Create indexes on JSON fields for better performance
CREATE INDEX leads_auto_data_idx ON leads USING GIN (auto_data);
CREATE INDEX leads_home_data_idx ON leads USING GIN (home_data);
CREATE INDEX leads_specialty_data_idx ON leads USING GIN (specialty_data);
CREATE INDEX leads_additional_insureds_idx ON leads USING GIN (additional_insureds);
