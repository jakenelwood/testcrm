-- 🏢 Comprehensive CRM Schema Enhancement
-- Multi-tenant, multi-location, multi-user architecture with complete data coverage

-- =============================================================================
-- ORGANIZATIONAL HIERARCHY (Multi-tenant Architecture)
-- =============================================================================

-- Organizations (Top level - can be single user or enterprise)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_type TEXT CHECK (organization_type IN ('Individual', 'Agency', 'Enterprise')),
  
  -- Business details
  legal_name TEXT,
  tax_id TEXT,
  business_type TEXT,
  industry TEXT,
  
  -- Contact info
  primary_email TEXT,
  primary_phone TEXT,
  website_url TEXT,
  
  -- Subscription and billing
  subscription_tier TEXT DEFAULT 'Basic',
  billing_contact_id UUID,
  
  -- Settings
  timezone TEXT DEFAULT 'America/Chicago',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations (Offices, branches, territories)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Location details
  name TEXT NOT NULL, -- "Main Office", "Dallas Branch", "Territory 5"
  location_type TEXT CHECK (location_type IN ('Headquarters', 'Branch', 'Territory', 'Remote')),
  
  -- Address
  address_id UUID REFERENCES addresses(id),
  
  -- Geographic data for reporting
  region TEXT,
  territory TEXT,
  market_area TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT,
  manager_id UUID, -- Will reference users table
  
  -- Business settings
  license_numbers JSONB, -- Array of license numbers for this location
  appointed_carriers JSONB, -- Array of carriers this location can write
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Users Table (Multi-location support)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  primary_location_id UUID REFERENCES locations(id),
  
  -- Personal info
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  
  -- Role and permissions
  role TEXT DEFAULT 'Agent' CHECK (role IN ('Owner', 'Manager', 'Agent', 'CSR', 'Admin')),
  permissions JSONB, -- Granular permissions
  
  -- License and credentials
  license_number TEXT,
  license_state TEXT,
  license_expiration DATE,
  certifications JSONB,
  
  -- Contact and preferences
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT,
  notification_preferences JSONB,
  
  -- Performance tracking
  hire_date DATE,
  territory_assignments JSONB,
  quota_targets JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Location Assignments (Many-to-many for multi-location users)
CREATE TABLE user_location_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Assignment details
  role_at_location TEXT,
  is_primary_location BOOLEAN DEFAULT FALSE,
  access_level TEXT DEFAULT 'Full' CHECK (access_level IN ('Full', 'Read', 'Limited')),
  
  -- Date range
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, location_id)
);

-- =============================================================================
-- ENHANCED VEHICLE MANAGEMENT
-- =============================================================================

-- Comprehensive Vehicles Table
DROP TABLE IF EXISTS vehicles CASCADE;
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),
  entity_id UUID NOT NULL,
  
  -- Basic vehicle info
  year INTEGER,
  make TEXT,
  model TEXT,
  trim_level TEXT,
  vin TEXT,
  license_plate TEXT,
  license_state TEXT,
  
  -- Vehicle details
  body_style TEXT,
  engine_size TEXT,
  fuel_type TEXT,
  transmission_type TEXT,
  
  -- Usage and storage
  usage_type TEXT CHECK (usage_type IN ('Pleasure', 'Commute', 'Business', 'Farm')),
  annual_mileage INTEGER,
  daily_commute_miles INTEGER,
  garaging_address_id UUID REFERENCES addresses(id),
  garaging_zip TEXT,
  
  -- Ownership and financing
  ownership_type TEXT CHECK (ownership_type IN ('Owned', 'Financed', 'Leased')),
  lienholder_name TEXT,
  lienholder_address TEXT,
  loan_amount DECIMAL(12,2),
  lease_details JSONB,
  
  -- Purchase information
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  current_value DECIMAL(12,2),
  
  -- Safety and features
  safety_features JSONB, -- ABS, airbags, etc.
  anti_theft_devices JSONB, -- Alarm, GPS, etc.
  performance_modifications JSONB,
  
  -- Coverage and claims
  desired_coverage JSONB,
  current_coverage JSONB,
  claims_history JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMPREHENSIVE DRIVER MANAGEMENT
-- =============================================================================

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),
  entity_id UUID NOT NULL,
  
  -- Personal information
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || COALESCE(' ' || middle_name, '') || ' ' || last_name) STORED,
  date_of_birth DATE,
  age INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(date_of_birth))) STORED,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  marital_status TEXT CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
  
  -- License information
  license_number TEXT,
  license_state TEXT,
  license_class TEXT,
  license_issue_date DATE,
  license_expiration_date DATE,
  years_licensed INTEGER,
  
  -- Driving history
  violations JSONB, -- Array of violations with dates, types, points
  accidents JSONB,  -- Array of accidents with dates, fault, claims
  claims_history JSONB,
  
  -- Education and training
  drivers_education BOOLEAN DEFAULT FALSE,
  defensive_driving_course BOOLEAN DEFAULT FALSE,
  training_courses JSONB,
  
  -- Status and qualifications
  good_student BOOLEAN DEFAULT FALSE,
  good_driver BOOLEAN DEFAULT TRUE,
  sr22_required BOOLEAN DEFAULT FALSE,
  
  -- Employment and occupation
  occupation TEXT,
  employer_name TEXT,
  employment_status TEXT CHECK (employment_status IN ('Employed', 'Unemployed', 'Retired', 'Student')),
  
  -- Relationship to primary insured
  relationship_to_primary TEXT CHECK (relationship_to_primary IN ('Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Other')),
  
  -- Exclusions and restrictions
  is_excluded BOOLEAN DEFAULT FALSE,
  exclusion_reason TEXT,
  driving_restrictions JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver-Vehicle Assignments with detailed usage
CREATE TABLE driver_vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Assignment details
  assignment_type TEXT CHECK (assignment_type IN ('Primary', 'Secondary', 'Occasional')),
  usage_percentage INTEGER CHECK (usage_percentage >= 0 AND usage_percentage <= 100),
  
  -- Usage patterns
  primary_use TEXT CHECK (primary_use IN ('Commute', 'Pleasure', 'Business', 'School')),
  commute_distance INTEGER, -- miles per day
  
  -- Date range
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(driver_id, vehicle_id)
);

-- =============================================================================
-- ENHANCED PROPERTY MANAGEMENT
-- =============================================================================

DROP TABLE IF EXISTS homes CASCADE;
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),
  entity_id UUID NOT NULL,
  
  -- Property identification
  property_type TEXT CHECK (property_type IN ('Primary_Residence', 'Secondary_Home', 'Rental_Property', 'Condo', 'Townhome', 'Mobile_Home')),
  address_id UUID NOT NULL REFERENCES addresses(id),
  
  -- Basic property details
  year_built INTEGER,
  square_footage INTEGER,
  lot_size_acres DECIMAL(8,2),
  stories INTEGER,
  bedrooms INTEGER,
  full_bathrooms INTEGER,
  half_bathrooms INTEGER,
  three_quarter_bathrooms INTEGER,
  
  -- Construction details
  foundation_type TEXT,
  exterior_wall_type TEXT,
  roof_type TEXT,
  roof_year_installed INTEGER,
  roof_condition TEXT,
  
  -- Systems and utilities
  heating_system_type TEXT,
  heating_system_year INTEGER,
  cooling_system_type TEXT,
  electrical_system_year INTEGER,
  electrical_amps INTEGER,
  plumbing_system_year INTEGER,
  plumbing_material TEXT,
  
  -- Property features
  garage_type TEXT,
  garage_spaces INTEGER,
  driveway_type TEXT,
  basement_type TEXT,
  basement_finished_percentage INTEGER,
  
  -- Safety and security
  smoke_detectors BOOLEAN DEFAULT FALSE,
  fire_extinguishers BOOLEAN DEFAULT FALSE,
  security_system JSONB,
  fire_sprinkler_system BOOLEAN DEFAULT FALSE,
  
  -- Special features and risks
  swimming_pool JSONB, -- Type, fenced, depth, etc.
  trampoline BOOLEAN DEFAULT FALSE,
  hot_tub_spa BOOLEAN DEFAULT FALSE,
  deck_details JSONB,
  fence_details JSONB,
  
  -- Pets and animals
  pets JSONB, -- Array of pets with breed, bite history
  farm_animals JSONB,
  
  -- Business use
  home_business JSONB,
  business_percentage INTEGER DEFAULT 0,
  
  -- Financial information
  purchase_price DECIMAL(15,2),
  purchase_date DATE,
  current_market_value DECIMAL(15,2),
  replacement_cost DECIMAL(15,2),
  
  -- Mortgage and ownership
  mortgage_company TEXT,
  mortgage_balance DECIMAL(15,2),
  ownership_percentage INTEGER DEFAULT 100,
  
  -- Claims and history
  prior_losses JSONB,
  insurance_claims JSONB,
  
  -- Coverage preferences
  desired_coverage JSONB,
  current_coverage JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  occupancy_status TEXT DEFAULT 'Owner_Occupied',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMPREHENSIVE QUOTE MANAGEMENT SYSTEM
-- =============================================================================

-- Quote Requests (Replaces basic quotes table)
DROP TABLE IF EXISTS quotes CASCADE;
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  
  -- Request details
  insurance_types TEXT[] NOT NULL, -- ['Auto', 'Home', 'Umbrella']
  coverage_preferences JSONB,
  budget_constraints JSONB,
  
  -- Assignment and priority
  assigned_to UUID REFERENCES users(id),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  -- Process tracking
  status TEXT DEFAULT 'Requested' CHECK (status IN ('Requested', 'In_Progress', 'Quoted', 'Presented', 'Accepted', 'Declined', 'Expired')),
  
  -- Timeline
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  target_delivery_date DATE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  presented_at TIMESTAMP WITH TIME ZONE,
  response_received_at TIMESTAMP WITH TIME ZONE,
  
  -- Client interaction
  presentation_method TEXT CHECK (presentation_method IN ('Email', 'Phone', 'In_Person', 'Portal')),
  client_feedback JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual Quote Options from Different Carriers
CREATE TABLE quote_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  
  -- Carrier and product information
  carrier_name TEXT NOT NULL,
  product_name TEXT,
  agent_contact JSONB,
  
  -- Quote identification
  carrier_quote_number TEXT,
  quote_version INTEGER DEFAULT 1,
  
  -- Pricing structure
  annual_premium DECIMAL(12,2) NOT NULL,
  monthly_premium DECIMAL(12,2),
  down_payment DECIMAL(12,2),
  installment_fee DECIMAL(8,2),
  policy_fee DECIMAL(8,2),
  
  -- Payment options
  payment_plans JSONB, -- Available payment frequencies
  financing_options JSONB,
  
  -- Coverage details by type
  auto_coverage JSONB,
  home_coverage JSONB,
  umbrella_coverage JSONB,
  specialty_coverage JSONB,
  
  -- Deductibles and limits
  deductibles JSONB,
  coverage_limits JSONB,
  
  -- Discounts and surcharges
  discounts_applied JSONB,
  surcharges_applied JSONB,
  
  -- Quote validity
  effective_date DATE,
  expiration_date DATE,
  
  -- Competitive analysis
  competitive_position TEXT CHECK (competitive_position IN ('Best', 'Competitive', 'High')),
  price_rank INTEGER,
  
  -- Status and tracking
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Declined', 'Expired')),
  is_recommended BOOLEAN DEFAULT FALSE,
  recommendation_reason TEXT,
  
  -- Client interaction
  presented_to_client BOOLEAN DEFAULT FALSE,
  client_response TEXT CHECK (client_response IN ('Interested', 'Not_Interested', 'Needs_Time', 'Wants_Changes')),
  client_notes TEXT,
  
  -- Underwriting
  underwriting_notes TEXT,
  special_conditions JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote Comparisons and Analysis
CREATE TABLE quote_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id),
  
  -- Comparison data
  comparison_matrix JSONB, -- Side-by-side comparison
  recommended_option_id UUID REFERENCES quote_options(id),
  recommendation_reasoning TEXT,
  
  -- Analysis
  price_analysis JSONB,
  coverage_analysis JSONB,
  carrier_ratings JSONB,
  
  -- Presentation
  presentation_format TEXT CHECK (presentation_format IN ('PDF', 'Email', 'Portal', 'Verbal')),
  presentation_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
