-- CRM Schema for B2C and B2B Clients
-- AI-Centric, Scalable, DRY-Compliant Hybrid Storage Model
-- Version 1.1 - Enhanced with AI annotations, metadata tracking, and event timestamps

-- Lookup Tables
CREATE TABLE lead_statuses (
  id SERIAL PRIMARY KEY,
  value TEXT UNIQUE NOT NULL,
  description TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  display_order INT,
  color_hex TEXT,                      -- For UI display (e.g., #FF5733)
  icon_name TEXT,                      -- For UI display (e.g., 'phone', 'document')
  ai_action_template TEXT,             -- Template for AI-suggested actions at this status
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE insurance_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_personal BOOLEAN,
  is_commercial BOOLEAN,
  description TEXT,
  icon_name TEXT,                      -- For UI display
  form_schema JSONB,                   -- JSON schema for validating insurance data
  ai_prompt_template TEXT,             -- Template for AI to gather relevant info
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE communication_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT,                      -- For UI display
  requires_follow_up BOOLEAN DEFAULT FALSE, -- Whether this type typically needs follow-up
  ai_summary_template TEXT,            -- How AI should summarize this communication type
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  campaign_type TEXT,                  -- Email, SMS, Call, etc.
  target_audience JSONB,               -- Criteria for targeting leads
  content_template JSONB,              -- Templates for campaign content
  metrics JSONB,                       -- Performance metrics
  ai_optimization_notes TEXT,          -- AI suggestions for campaign improvement
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  street TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  type TEXT CHECK (type IN ('Physical', 'Mailing', 'Business', 'Location')),
  is_verified BOOLEAN DEFAULT FALSE,   -- Whether address has been verified
  geocode_lat DECIMAL(10, 8),          -- Latitude for mapping
  geocode_lng DECIMAL(11, 8),          -- Longitude for mapping
  metadata JSONB,                      -- Additional address data (unit, floor, etc.)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  verified_at TIMESTAMP                -- When address was verified
);

-- Clients Table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_type TEXT NOT NULL CHECK (client_type IN ('Individual', 'Business')),
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  address_id UUID REFERENCES addresses(id),
  mailing_address_id UUID REFERENCES addresses(id),
  referred_by TEXT,

  -- Individual-specific fields
  date_of_birth TEXT,
  gender TEXT,
  marital_status TEXT,
  drivers_license TEXT,
  license_state TEXT,
  education_occupation TEXT,

  -- Business-specific fields
  business_type TEXT,
  industry TEXT,
  tax_id TEXT,
  year_established TEXT,
  annual_revenue DECIMAL(15, 2),
  number_of_employees INTEGER,

  -- AI and metadata fields
  ai_summary TEXT,                     -- AI-generated summary of client
  ai_next_action TEXT,                 -- AI-suggested next action
  ai_risk_score INTEGER,               -- AI-calculated risk score (1-100)
  ai_lifetime_value DECIMAL(15, 2),    -- AI-predicted lifetime value
  metadata JSONB,                      -- Additional flexible client data
  tags TEXT[],                         -- Array of tags for categorization

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE, -- Last time client was contacted
  next_contact_at TIMESTAMP WITH TIME ZONE  -- When to contact client next
);

-- Leads Table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  status_id INT REFERENCES lead_statuses(id),
  insurance_type_id INT REFERENCES insurance_types(id),
  assigned_to TEXT,
  notes TEXT,
  current_carrier TEXT,

  -- Premium fields
  premium DECIMAL(10, 2),
  auto_premium DECIMAL(10, 2),
  home_premium DECIMAL(10, 2),
  specialty_premium DECIMAL(10, 2),
  commercial_premium DECIMAL(10, 2),

  -- Umbrella fields
  umbrella_value DECIMAL(10, 2),
  umbrella_uninsured_underinsured TEXT,

  -- Auto specific columns
  auto_current_insurance_carrier TEXT,
  auto_months_with_current_carrier INTEGER,

  -- Specialty specific columns
  specialty_type TEXT,
  specialty_make TEXT,
  specialty_model TEXT,
  specialty_year INTEGER,

  -- Commercial specific columns
  commercial_coverage_type TEXT,
  commercial_industry TEXT,

  -- JSON data fields with schema versioning
  auto_data JSONB,
  auto_data_schema_version TEXT,       -- Version of the schema used for auto_data
  home_data JSONB,
  home_data_schema_version TEXT,       -- Version of the schema used for home_data
  specialty_data JSONB,
  specialty_data_schema_version TEXT,  -- Version of the schema used for specialty_data
  commercial_data JSONB,
  commercial_data_schema_version TEXT, -- Version of the schema used for commercial_data
  liability_data JSONB,
  liability_data_schema_version TEXT,  -- Version of the schema used for liability_data
  additional_insureds JSONB,
  additional_locations JSONB,

  -- AI and metadata fields
  ai_summary TEXT,                     -- AI-generated summary of lead
  ai_next_action TEXT,                 -- AI-suggested next action
  ai_quote_recommendation TEXT,        -- AI-recommended quote
  ai_follow_up_priority INTEGER,       -- AI-calculated priority (1-10)
  metadata JSONB,                      -- Additional flexible lead data
  tags TEXT[],                         -- Array of tags for categorization

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_changed_at TIMESTAMP WITH TIME ZONE, -- When status was last changed
  last_contact_at TIMESTAMP WITH TIME ZONE,   -- Last time lead was contacted
  next_contact_at TIMESTAMP WITH TIME ZONE,   -- When to contact lead next
  quote_generated_at TIMESTAMP WITH TIME ZONE, -- When quote was generated
  sold_at TIMESTAMP WITH TIME ZONE,           -- When lead was sold
  lost_at TIMESTAMP WITH TIME ZONE            -- When lead was lost
);

-- Contacts Table
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

  -- Additional contact fields
  department TEXT,                     -- Department within the business
  linkedin_url TEXT,                   -- LinkedIn profile URL
  preferred_contact_method TEXT,       -- Email, Phone, etc.

  -- AI and metadata fields
  ai_summary TEXT,                     -- AI-generated summary of contact
  ai_relationship_strength INTEGER,    -- AI-calculated relationship strength (1-10)
  metadata JSONB,                      -- Additional flexible contact data
  tags TEXT[],                         -- Array of tags for categorization

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE, -- Last time contact was contacted
  next_contact_at TIMESTAMP WITH TIME ZONE  -- When to contact next
);

-- Lead Notes Table
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_by TEXT,

  -- Additional note fields
  note_type TEXT,                      -- Type of note (e.g., 'follow-up', 'quote', 'general')
  is_pinned BOOLEAN DEFAULT FALSE,     -- Whether note is pinned to top

  -- AI and metadata fields
  ai_summary TEXT,                     -- AI-generated summary of note
  ai_sentiment TEXT,                   -- AI-detected sentiment (positive, negative, neutral)
  ai_entities JSONB,                   -- AI-extracted entities (people, places, etc.)
  ai_action_items JSONB,               -- AI-extracted action items
  metadata JSONB,                      -- Additional flexible note data

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Communications Table
CREATE TABLE lead_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type_id INT REFERENCES communication_types(id),
  direction TEXT CHECK (direction IN ('Inbound', 'Outbound')),
  content TEXT,
  status TEXT,
  created_by TEXT,

  -- Additional communication fields
  subject TEXT,                        -- Subject/title of communication
  channel TEXT,                        -- Channel used (email, phone, in-person, etc.)
  duration INTEGER,                    -- Duration in seconds (for calls)
  outcome TEXT,                        -- Outcome of communication

  -- AI and metadata fields
  ai_summary TEXT,                     -- AI-generated summary of communication
  ai_sentiment TEXT,                   -- AI-detected sentiment
  ai_entities JSONB,                   -- AI-extracted entities
  ai_action_items JSONB,               -- AI-extracted action items
  ai_follow_up_suggestion TEXT,        -- AI-suggested follow-up
  metadata JSONB,                      -- Additional flexible communication data

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE, -- When communication was scheduled
  completed_at TIMESTAMP WITH TIME ZONE, -- When communication was completed
  follow_up_at TIMESTAMP WITH TIME ZONE  -- When to follow up
);

-- Lead Marketing Settings Table
CREATE TABLE lead_marketing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id),
  is_active BOOLEAN DEFAULT true,
  settings JSONB,

  -- Additional marketing fields
  opt_in_status TEXT,                  -- Explicit, Implicit, Unsubscribed, etc.
  engagement_score INTEGER,            -- Engagement score (1-100)
  segment TEXT[],                      -- Marketing segments

  -- AI and metadata fields
  ai_campaign_fit_score INTEGER,       -- AI-calculated fit score (1-100)
  ai_recommended_campaigns JSONB,      -- AI-recommended campaigns
  ai_content_preferences JSONB,        -- AI-detected content preferences
  metadata JSONB,                      -- Additional flexible marketing data

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_engagement_at TIMESTAMP WITH TIME ZONE, -- Last time lead engaged with marketing
  opt_in_at TIMESTAMP WITH TIME ZONE,          -- When lead opted in
  opt_out_at TIMESTAMP WITH TIME ZONE          -- When lead opted out
);

-- Opportunities Table
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

  -- Additional opportunity fields
  source TEXT,                         -- Source of opportunity
  type TEXT,                           -- Type of opportunity
  competitors TEXT[],                  -- Competing companies
  decision_makers TEXT[],              -- Decision makers

  -- AI and metadata fields
  ai_win_probability INTEGER,          -- AI-calculated win probability (1-100)
  ai_suggested_actions JSONB,          -- AI-suggested actions to win
  ai_risk_factors JSONB,               -- AI-identified risk factors
  ai_summary TEXT,                     -- AI-generated summary
  metadata JSONB,                      -- Additional flexible opportunity data
  tags TEXT[],                         -- Array of tags for categorization

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stage_changed_at TIMESTAMP WITH TIME ZONE, -- When stage was last changed
  last_activity_at TIMESTAMP WITH TIME ZONE  -- Last activity on opportunity
);

-- Indexes
CREATE INDEX clients_type_idx ON clients (client_type);
CREATE INDEX clients_name_idx ON clients (name);
CREATE INDEX clients_email_idx ON clients (email);
CREATE INDEX clients_phone_idx ON clients (phone_number);
CREATE INDEX leads_client_id_idx ON leads (client_id);
CREATE INDEX leads_status_idx ON leads (status_id);
CREATE INDEX leads_insurance_type_idx ON leads (insurance_type_id);
CREATE INDEX leads_assigned_to_idx ON leads (assigned_to);
CREATE INDEX contacts_client_id_idx ON contacts (client_id);
CREATE INDEX contacts_name_idx ON contacts (first_name, last_name);
CREATE INDEX contacts_primary_idx ON contacts (client_id, is_primary_contact);
CREATE INDEX lead_notes_lead_id_idx ON lead_notes (lead_id);
CREATE INDEX lead_communications_lead_id_idx ON lead_communications (lead_id);
CREATE INDEX lead_communications_contact_id_idx ON lead_communications (contact_id);
CREATE INDEX lead_marketing_settings_lead_id_idx ON lead_marketing_settings (lead_id);
CREATE INDEX opportunities_lead_id_idx ON opportunities (lead_id);
CREATE INDEX leads_auto_data_idx ON leads USING GIN (auto_data);
CREATE INDEX leads_home_data_idx ON leads USING GIN (home_data);
CREATE INDEX leads_specialty_data_idx ON leads USING GIN (specialty_data);
CREATE INDEX leads_commercial_data_idx ON leads USING GIN (commercial_data);
CREATE INDEX leads_additional_insureds_idx ON leads USING GIN (additional_insureds);
CREATE INDEX leads_additional_locations_idx ON leads USING GIN (additional_locations);

-- Additional indexes for AI and metadata fields
CREATE INDEX clients_ai_risk_score_idx ON clients (ai_risk_score);
CREATE INDEX clients_tags_idx ON clients USING GIN (tags);
CREATE INDEX leads_ai_follow_up_priority_idx ON leads (ai_follow_up_priority);
CREATE INDEX leads_tags_idx ON leads USING GIN (tags);
CREATE INDEX leads_next_contact_at_idx ON leads (next_contact_at);
CREATE INDEX contacts_ai_relationship_strength_idx ON contacts (ai_relationship_strength);
CREATE INDEX lead_notes_is_pinned_idx ON lead_notes (is_pinned);
CREATE INDEX lead_communications_follow_up_at_idx ON lead_communications (follow_up_at);
CREATE INDEX opportunities_ai_win_probability_idx ON opportunities (ai_win_probability);

-- Initial data for lookup tables
INSERT INTO lead_statuses (value, description, is_final, display_order, color_hex, icon_name, ai_action_template) VALUES
('New', 'Lead has been created but no action taken', FALSE, 1, '#3498db', 'plus-circle', 'Review lead information and make initial contact via {preferred_contact_method}'),
('Contacted', 'Initial contact has been made', FALSE, 2, '#f39c12', 'phone', 'Follow up on initial contact and gather additional information about insurance needs'),
('Quoted', 'Quote has been provided', FALSE, 3, '#2ecc71', 'file-text', 'Follow up on quote, address any questions, and discuss next steps'),
('Sold', 'Policy has been sold', TRUE, 4, '#27ae60', 'check-circle', 'Confirm policy details, schedule welcome call, and explore cross-selling opportunities'),
('Lost', 'Lead did not convert', TRUE, 5, '#e74c3c', 'x-circle', 'Analyze reason for loss, document feedback, and consider for future remarketing');

INSERT INTO insurance_types (name, is_personal, is_commercial, description, icon_name, ai_prompt_template) VALUES
('Auto', TRUE, FALSE, 'Automobile insurance for personal vehicles', 'car', 'Ask about: vehicle details (year, make, model), drivers, current coverage, driving history, and desired coverage levels'),
('Home', TRUE, FALSE, 'Homeowners and renters insurance', 'home', 'Ask about: property details, value, construction type, safety features, current coverage, and desired coverage levels'),
('Specialty', TRUE, FALSE, 'Specialty items like boats, RVs, motorcycles', 'umbrella', 'Ask about: item details, usage, storage, value, and desired coverage levels'),
('Commercial', FALSE, TRUE, 'Business insurance for commercial entities', 'briefcase', 'Ask about: business type, size, revenue, employees, assets, operations, and risk exposures'),
('Liability', TRUE, TRUE, 'Liability coverage for individuals and businesses', 'shield', 'Ask about: assets to protect, current coverage, risk factors, and desired coverage levels');

INSERT INTO communication_types (name, description, icon_name, requires_follow_up, ai_summary_template) VALUES
('Email', 'Email communication with client', 'mail', TRUE, 'Email about {topic}: {key_points}'),
('SMS', 'Text message communication', 'message-square', TRUE, 'Text message about {topic}: {key_points}'),
('Call', 'Phone call with client', 'phone', TRUE, '{duration} minute call about {topic}: {key_points}'),
('Note', 'Internal note about client', 'file-text', FALSE, 'Note about {topic}: {key_points}'),
('Meeting', 'In-person or virtual meeting', 'users', TRUE, '{duration} minute meeting about {topic}: {key_points}'),
('Video Call', 'Video conference with client', 'video', TRUE, '{duration} minute video call about {topic}: {key_points}'),
('Social Media', 'Interaction via social media', 'instagram', FALSE, 'Social media interaction on {platform}: {key_points}'),
('Mail', 'Physical mail sent to client', 'mail', FALSE, 'Mail sent about {topic}: {key_points}');
