-- Consolidated Schema for CRM
-- Based on storage_fields.csv, schema_evolution_guidance.md, and b2b_b2c_schema.sql
-- This schema follows the hybrid approach with relational columns for core fields
-- and JSONB fields for variable-length, dynamic data
-- It supports both B2C (individual) and B2B (business) clients

-- Create clients table (can be either individuals or businesses)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Client type
  client_type TEXT NOT NULL CHECK (client_type IN ('Individual', 'Business')),

  -- Common fields for both individual and business
  name TEXT NOT NULL, -- Full name for individuals, business name for businesses
  email TEXT,
  phone_number TEXT,
  address_id TEXT, -- Reference to address (instead of separate street, city, state, zip)
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

  -- AI-related fields (based on your table structure)
  ai_summary TEXT,
  ai_next_action TEXT,
  ai_risk_score INTEGER,
  ai_lifetime_value DECIMAL(15, 2),

  -- Additional fields
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

-- Create leads table with relationship to clients and fields from storage_fields.csv
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Reference to client (can be individual or business)
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Reference to status
  status_id INTEGER REFERENCES lead_statuses(id),

  -- Primary Named Insured fields (as columns per CSV)
  -- These are kept for backward compatibility and will be populated from client data
  primary_named_insured_name TEXT,
  primary_named_insured_email_address TEXT,
  primary_named_insured_phone_number TEXT,
  primary_named_insured_address TEXT,
  primary_named_insured_mailing_address TEXT,
  primary_named_insured_prior_address TEXT,
  primary_named_insured_dob TEXT,
  primary_named_insured_gender TEXT,
  primary_named_insured_marital_status TEXT,
  primary_named_insured_dl_number TEXT,
  primary_named_insured_license_state TEXT,
  primary_named_insured_education_occupation TEXT,
  primary_named_insured_relation_to_primary_insured TEXT,
  primary_named_insured_referred_by TEXT,
  primary_named_insured_effective_date TEXT,
  primary_named_insured_current_date TEXT,

  -- Lead assignment
  assigned_to TEXT,
  notes TEXT,

  -- Insurance type and basic info
  insurance_type TEXT CHECK (insurance_type IN ('Auto', 'Home', 'Specialty', 'Commercial', 'Liability')),
  current_carrier TEXT,

  -- Premium fields (as columns per CSV)
  premium DECIMAL(10, 2),
  auto_premium DECIMAL(10, 2),
  home_premium DECIMAL(10, 2),
  specialty_premium DECIMAL(10, 2),
  commercial_premium DECIMAL(10, 2),

  -- Umbrella fields (as columns per CSV)
  home_umbrella_value DECIMAL(10, 2),
  home_umbrella_uninsured_underinsured TEXT,

  -- Auto specific columns (per CSV)
  auto_current_insurance_carrier_auto TEXT,
  auto_months_with_current_carrier_auto INTEGER,

  -- Home specific columns (per CSV)
  home_months_with_current_carrier INTEGER,
  home_current_insurance_carrier TEXT,

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

  -- Commercial specific columns
  commercial_coverage_type TEXT,
  commercial_industry TEXT,

  -- Store the detailed insurance data as JSON (per CSV)
  auto_data JSONB,
  home_data JSONB,
  specialty_data JSONB,
  commercial_data JSONB,
  liability_data JSONB,

  -- Additional insureds as JSON (per CSV)
  additional_insureds JSONB,

  -- Additional locations for businesses as JSON array
  additional_locations JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table for business relationships (employees, decision makers, etc.)
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
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- For B2B communications
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

-- Create opportunities table for tracking sales opportunities (especially for B2B)
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS clients_type_idx ON clients (client_type);
CREATE INDEX IF NOT EXISTS clients_name_idx ON clients (name);
CREATE INDEX IF NOT EXISTS clients_email_idx ON clients (email);
CREATE INDEX IF NOT EXISTS clients_phone_idx ON clients (phone_number);
CREATE INDEX IF NOT EXISTS clients_address_idx ON clients (address_id);
CREATE INDEX IF NOT EXISTS clients_mailing_address_idx ON clients (mailing_address_id);

CREATE INDEX IF NOT EXISTS leads_client_id_idx ON leads (client_id);
CREATE INDEX IF NOT EXISTS leads_status_id_idx ON leads (status_id);
-- Ensure the insurance_type column exists before creating an index on it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'insurance_type'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_insurance_type_idx ON leads (insurance_type)';
    END IF;
END $$;
-- Ensure the assigned_to column exists before creating an index on it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'assigned_to'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads (assigned_to)';
    END IF;
END $$;

-- Ensure the primary_named_insured_name column exists before creating an index on it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'primary_named_insured_name'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_name_idx ON leads (primary_named_insured_name)';
    END IF;
END $$;

-- Ensure the primary_named_insured_email_address column exists before creating an index on it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'primary_named_insured_email_address'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (primary_named_insured_email_address)';
    END IF;
END $$;

-- Ensure the primary_named_insured_phone_number column exists before creating an index on it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'primary_named_insured_phone_number'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads (primary_named_insured_phone_number)';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS lead_statuses_value_idx ON lead_statuses (value);
CREATE INDEX IF NOT EXISTS lead_statuses_display_order_idx ON lead_statuses (display_order);

CREATE INDEX IF NOT EXISTS contacts_client_id_idx ON contacts (client_id);
CREATE INDEX IF NOT EXISTS contacts_name_idx ON contacts (first_name, last_name);
CREATE INDEX IF NOT EXISTS contacts_primary_idx ON contacts (client_id, is_primary_contact);

CREATE INDEX IF NOT EXISTS lead_notes_lead_id_idx ON lead_notes (lead_id);
CREATE INDEX IF NOT EXISTS lead_communications_lead_id_idx ON lead_communications (lead_id);
CREATE INDEX IF NOT EXISTS lead_communications_contact_id_idx ON lead_communications (contact_id);
CREATE INDEX IF NOT EXISTS lead_marketing_settings_lead_id_idx ON lead_marketing_settings (lead_id);
CREATE INDEX IF NOT EXISTS opportunities_lead_id_idx ON opportunities (lead_id);

-- Create indexes on JSON fields for better performance
-- Check and create indexes for JSON fields conditionally
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'auto_data'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_auto_data_idx ON leads USING GIN (auto_data)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'home_data'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_home_data_idx ON leads USING GIN (home_data)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'specialty_data'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_specialty_data_idx ON leads USING GIN (specialty_data)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'commercial_data'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_commercial_data_idx ON leads USING GIN (commercial_data)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'liability_data'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_liability_data_idx ON leads USING GIN (liability_data)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'additional_insureds'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_additional_insureds_idx ON leads USING GIN (additional_insureds)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'additional_locations'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS leads_additional_locations_idx ON leads USING GIN (additional_locations)';
    END IF;
END $$;

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

-- Create code_redemptions table
CREATE TABLE IF NOT EXISTS code_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_code_id UUID,
  user_id UUID,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id TEXT
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_leads_count BIGINT DEFAULT 0
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

-- Create additional indexes for new tables
CREATE INDEX IF NOT EXISTS invite_codes_code_idx ON invite_codes (code);
CREATE INDEX IF NOT EXISTS discount_codes_code_idx ON discount_codes (code);
CREATE INDEX IF NOT EXISTS campaigns_name_idx ON campaigns (name);
CREATE INDEX IF NOT EXISTS vehicles_user_id_idx ON vehicles (user_id);
CREATE INDEX IF NOT EXISTS homes_user_id_idx ON homes (user_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS addresses_zip_idx ON addresses (zip_code);
CREATE INDEX IF NOT EXISTS specialty_items_user_id_idx ON specialty_items (user_id);
CREATE INDEX IF NOT EXISTS ringcentral_tokens_user_id_idx ON ringcentral_tokens (user_id);
CREATE INDEX IF NOT EXISTS other_insureds_user_id_idx ON other_insureds (user_id);
CREATE INDEX IF NOT EXISTS pipeline_statuses_pipeline_id_idx ON pipeline_statuses (pipeline_id);

-- Create schema_versions table for tracking database migrations
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rolled_back_at TIMESTAMP WITH TIME ZONE
);

-- Create _version_info table for system versioning
CREATE TABLE IF NOT EXISTS _version_info (
  version TEXT NOT NULL
);
