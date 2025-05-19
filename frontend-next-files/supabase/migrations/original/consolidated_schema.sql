-- Consolidated Schema for CRM
-- This schema follows the hybrid approach with relational columns for core fields
-- and JSONB fields for variable-length, dynamic data
-- It supports both B2C (individual) and B2B (business) clients

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: _version_info is a view in the database, not a table
-- We don't need to create it

-- Create schema_versions table for tracking database migrations
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rolled_back_at TIMESTAMP WITH TIME ZONE
);

-- Create clients table (can be either individuals or businesses)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_type TEXT NOT NULL CHECK (client_type IN ('Individual', 'Business')),
  name TEXT NOT NULL, -- Full name for individuals, business name for businesses
  email TEXT,
  phone_number TEXT,
  address_id TEXT, -- Reference to address
  mailing_address_id TEXT, -- Reference to mailing address
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

  -- AI-related fields
  ai_summary TEXT,
  ai_next_action TEXT,
  ai_risk_score INTEGER,
  ai_lifetime_value DECIMAL(15, 2),

  -- JSONB field for flexible, dynamic data
  metadata JSONB,
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_contact_at TIMESTAMP WITH TIME ZONE
);

-- Create lead_statuses table for status definitions
CREATE TABLE IF NOT EXISTS lead_statuses (
  id INTEGER PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  color_hex TEXT,
  icon_name TEXT,
  ai_action_template TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create leads table with relationship to clients
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  status_id INTEGER REFERENCES lead_statuses(id),
  assigned_to TEXT,
  notes TEXT,

  -- Core fields as columns for frequent querying
  insurance_type TEXT CHECK (insurance_type IN ('Auto', 'Home', 'Specialty', 'Commercial', 'Liability')),
  current_carrier TEXT,
  premium DECIMAL(10, 2),

  -- JSONB fields for flexible, dynamic data
  auto_data JSONB,
  home_data JSONB,
  specialty_data JSONB,
  commercial_data JSONB,
  liability_data JSONB,
  additional_insureds JSONB,
  additional_locations JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table for business relationships
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone_number TEXT,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  notes TEXT,
  department TEXT,
  linkedin_url TEXT,
  preferred_contact_method TEXT,
  ai_summary TEXT,
  ai_relationship_strength INTEGER,
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_contact_at TIMESTAMP WITH TIME ZONE
);

-- Create AI Interactions Table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  type TEXT,
  source TEXT,
  content TEXT,
  ai_response TEXT,
  summary TEXT,
  model_used TEXT,
  temperature DOUBLE PRECISION,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_by TEXT,
  issue_type TEXT,
  issue_description TEXT,
  resolution_summary TEXT,
  status TEXT,
  assigned_to TEXT,
  notes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  street TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  type TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  geocode_lat NUMERIC,
  geocode_lng NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITHOUT TIME ZONE
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  assigned_leads_count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create insurance_types table
CREATE TABLE IF NOT EXISTS insurance_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  is_personal BOOLEAN DEFAULT FALSE,
  is_commercial BOOLEAN DEFAULT FALSE,
  description TEXT,
  icon_name TEXT,
  form_schema JSONB,
  ai_prompt_template TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create communication_types table
CREATE TABLE IF NOT EXISTS communication_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  requires_follow_up BOOLEAN DEFAULT FALSE,
  ai_summary_template TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  campaign_type TEXT,
  target_audience JSONB,
  content_template JSONB,
  metrics JSONB,
  ai_optimization_notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create lead_notes table
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_by TEXT,
  note_type TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  ai_summary TEXT,
  ai_sentiment TEXT,
  ai_entities JSONB,
  ai_action_items JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_communications table
CREATE TABLE IF NOT EXISTS lead_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('Email', 'SMS', 'Call', 'Note', 'Meeting')),
  direction TEXT CHECK (direction IN ('Inbound', 'Outbound')),
  content TEXT,
  status TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_marketing_settings table
CREATE TABLE IF NOT EXISTS lead_marketing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  settings JSONB,
  opt_in_status TEXT,
  engagement_score INTEGER,
  segment TEXT[],
  ai_campaign_fit_score INTEGER,
  ai_recommended_campaigns JSONB,
  ai_content_preferences JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_engagement_at TIMESTAMP WITH TIME ZONE,
  opt_in_at TIMESTAMP WITH TIME ZONE,
  opt_out_at TIMESTAMP WITH TIME ZONE
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
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

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  description TEXT,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  plan_id TEXT
);

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  discount_percent INTEGER,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  discount_type TEXT,
  discount_amount NUMERIC,
  is_one_time_use BOOLEAN DEFAULT FALSE,
  specific_user_id UUID,
  campaign_id TEXT,
  min_purchase_amount NUMERIC,
  applicable_plan TEXT[]
);

-- Create code_redemptions table
CREATE TABLE IF NOT EXISTS code_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_code_id UUID,
  user_id UUID,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id TEXT
);

-- Create homes table
CREATE TABLE IF NOT EXISTS homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  year_built INTEGER,
  square_feet INTEGER,
  construction_type TEXT,
  roof_type TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  state TEXT,
  primary_use TEXT,
  annual_mileage INTEGER,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create specialty_items table
CREATE TABLE IF NOT EXISTS specialty_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  value NUMERIC,
  description TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create developer_notes table
CREATE TABLE IF NOT EXISTS developer_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  priority TEXT,
  status TEXT,
  summary TEXT,
  description TEXT,
  solution TEXT,
  related_table TEXT,
  related_feature TEXT,
  related_files TEXT[],
  technical_details JSONB,
  decision_context JSONB,
  implementation_notes JSONB,
  created_by TEXT,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create ringcentral_tokens table
CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE
);

-- Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pipeline_statuses table
CREATE TABLE IF NOT EXISTS pipeline_statuses (
  id INTEGER PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  color_hex TEXT,
  icon_name TEXT,
  ai_action_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create other_insureds table
CREATE TABLE IF NOT EXISTS other_insureds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth DATE,
  gender TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries (with conditional checks)
DO $$
BEGIN
  -- Create indexes on clients table
  EXECUTE 'CREATE INDEX IF NOT EXISTS clients_type_idx ON clients (client_type)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS clients_name_idx ON clients (name)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS clients_email_idx ON clients (email)';

  -- Create indexes on leads table (conditionally)
  EXECUTE 'CREATE INDEX IF NOT EXISTS leads_client_id_idx ON leads (client_id)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS leads_status_id_idx ON leads (status_id)';

  -- Check if insurance_type column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'leads' AND column_name = 'insurance_type') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS leads_insurance_type_idx ON leads (insurance_type)';
  END IF;

  -- Check if assigned_to column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'leads' AND column_name = 'assigned_to') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads (assigned_to)';
  END IF;

  -- Create indexes on contacts table
  EXECUTE 'CREATE INDEX IF NOT EXISTS contacts_client_id_idx ON contacts (client_id)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS contacts_name_idx ON contacts (first_name, last_name)';

  -- Create indexes on JSONB fields (conditionally)
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'leads' AND column_name = 'auto_data') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS leads_auto_data_idx ON leads USING GIN (auto_data)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'leads' AND column_name = 'home_data') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS leads_home_data_idx ON leads USING GIN (home_data)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'leads' AND column_name = 'specialty_data') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS leads_specialty_data_idx ON leads USING GIN (specialty_data)';
  END IF;

  -- Create indexes on addresses table
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'addresses') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS addresses_zip_idx ON addresses (zip_code)';
  END IF;

  -- Create indexes on users table
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'users') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)';
  END IF;

  -- Create indexes on additional tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invite_codes') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS invite_codes_code_idx ON invite_codes (code)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_codes') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS discount_codes_code_idx ON discount_codes (code)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS campaigns_name_idx ON campaigns (name)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS vehicles_user_id_idx ON vehicles (user_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'homes') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS homes_user_id_idx ON homes (user_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles (user_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'specialty_items') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS specialty_items_user_id_idx ON specialty_items (user_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ringcentral_tokens') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS ringcentral_tokens_user_id_idx ON ringcentral_tokens (user_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'other_insureds') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS other_insureds_user_id_idx ON other_insureds (user_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_statuses') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS pipeline_statuses_pipeline_id_idx ON pipeline_statuses (pipeline_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_notes') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS lead_notes_lead_id_idx ON lead_notes (lead_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_communications') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS lead_communications_lead_id_idx ON lead_communications (lead_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS lead_communications_contact_id_idx ON lead_communications (contact_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_marketing_settings') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS lead_marketing_settings_lead_id_idx ON lead_marketing_settings (lead_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS opportunities_lead_id_idx ON opportunities (lead_id)';
  END IF;
END $$;

-- Note: We don't insert into _version_info as it's a view
