-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('Auto', 'Home', 'Specialty')),
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Quoted', 'Sold', 'Lost')),
  current_carrier TEXT,
  premium DECIMAL(10, 2),
  assigned_to TEXT,
  notes TEXT,
  
  -- Store the detailed insurance data as JSON
  auto_data JSONB,
  home_data JSONB,
  specialty_data JSONB,
  
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
CREATE INDEX lead_notes_lead_id_idx ON lead_notes (lead_id);
CREATE INDEX lead_communications_lead_id_idx ON lead_communications (lead_id);
CREATE INDEX lead_marketing_settings_lead_id_idx ON lead_marketing_settings (lead_id);
