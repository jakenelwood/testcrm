-- 🏢 Comprehensive CRM Schema Enhancement - Part 2
-- Enhanced Policy Management, Commercial Details, Reporting, and Multi-tenancy

-- =============================================================================
-- ENHANCED POLICY MANAGEMENT
-- =============================================================================

-- Comprehensive Policies Table
DROP TABLE IF EXISTS policies CASCADE;
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  quote_option_id UUID REFERENCES quote_options(id), -- Link to original quote
  
  -- Policy identification
  policy_number TEXT NOT NULL UNIQUE,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('Auto', 'Home', 'Renters', 'Condo', 'Umbrella', 'Motorcycle', 'RV', 'Boat', 'Commercial')),
  carrier_name TEXT NOT NULL,
  product_name TEXT,
  
  -- Policy terms
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  term_length INTEGER, -- months
  
  -- Premium and billing
  annual_premium DECIMAL(12,2) NOT NULL,
  installment_premium DECIMAL(12,2),
  billing_frequency TEXT CHECK (billing_frequency IN ('Annual', 'Semi_Annual', 'Quarterly', 'Monthly')),
  down_payment DECIMAL(12,2),
  
  -- Coverage details
  coverage_details JSONB NOT NULL,
  deductibles JSONB,
  coverage_limits JSONB,
  
  -- Discounts and adjustments
  discounts JSONB,
  surcharges JSONB,
  
  -- Policy status and workflow
  status TEXT DEFAULT 'Active' CHECK (status IN ('Quoted', 'Bound', 'Active', 'Cancelled', 'Non_Renewed', 'Expired')),
  cancellation_reason TEXT,
  cancellation_date DATE,
  
  -- Renewal tracking
  renewal_date DATE,
  renewal_quoted BOOLEAN DEFAULT FALSE,
  renewal_premium DECIMAL(12,2),
  auto_renew BOOLEAN DEFAULT TRUE,
  
  -- Documents and compliance
  id_cards_issued BOOLEAN DEFAULT FALSE,
  id_cards_issued_date DATE,
  certificates_issued JSONB, -- Array of certificates with dates
  
  -- Commission and financials
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  agency_fee DECIMAL(8,2),
  
  -- Underwriting and risk
  underwriting_notes TEXT,
  risk_factors JSONB,
  inspection_required BOOLEAN DEFAULT FALSE,
  inspection_completed BOOLEAN DEFAULT FALSE,
  
  -- Claims
  claims_made BOOLEAN DEFAULT FALSE,
  total_claims_paid DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMMERCIAL INSURANCE ENHANCEMENTS
-- =============================================================================

-- Commercial-specific data for business clients
CREATE TABLE commercial_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),
  entity_id UUID NOT NULL,
  
  -- Business classification
  naics_code TEXT,
  sic_code TEXT,
  industry_description TEXT,
  business_operations_description TEXT,
  
  -- Business structure
  years_in_business INTEGER,
  years_under_current_ownership INTEGER,
  business_structure TEXT CHECK (business_structure IN ('Sole_Proprietorship', 'Partnership', 'LLC', 'Corporation', 'S_Corp', 'Non_Profit')),
  
  -- Financial information
  annual_gross_receipts DECIMAL(15,2),
  annual_payroll DECIMAL(15,2),
  number_of_employees INTEGER,
  number_of_owners INTEGER,
  
  -- Locations and operations
  number_of_locations INTEGER DEFAULT 1,
  operates_in_states TEXT[],
  seasonal_operations BOOLEAN DEFAULT FALSE,
  seasonal_details JSONB,
  
  -- Risk management
  safety_programs JSONB,
  training_programs JSONB,
  safety_certifications JSONB,
  
  -- Subcontractors and vendors
  uses_subcontractors BOOLEAN DEFAULT FALSE,
  subcontractor_details JSONB,
  
  -- Professional services
  professional_services JSONB, -- For E&O coverage
  
  -- Property details
  owns_real_estate BOOLEAN DEFAULT FALSE,
  property_values JSONB,
  equipment_values JSONB,
  
  -- Auto fleet
  commercial_vehicles INTEGER DEFAULT 0,
  fleet_details JSONB,
  
  -- Workers compensation
  workers_comp_required BOOLEAN DEFAULT FALSE,
  workers_comp_class_codes JSONB,
  
  -- Claims history
  prior_coverage JSONB,
  claims_history JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- REPORTING AND ANALYTICS TABLES
-- =============================================================================

-- Performance metrics by user/location/organization
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scope of metrics
  metric_scope TEXT NOT NULL CHECK (metric_scope IN ('User', 'Location', 'Organization')),
  scope_id UUID NOT NULL, -- user_id, location_id, or organization_id
  
  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Lead metrics
  leads_created INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  leads_quoted INTEGER DEFAULT 0,
  leads_sold INTEGER DEFAULT 0,
  leads_lost INTEGER DEFAULT 0,
  
  -- Conversion rates
  contact_rate DECIMAL(5,2), -- contacted/created
  quote_rate DECIMAL(5,2),   -- quoted/contacted
  close_rate DECIMAL(5,2),   -- sold/quoted
  
  -- Financial metrics
  total_premium_written DECIMAL(15,2) DEFAULT 0,
  total_commission_earned DECIMAL(12,2) DEFAULT 0,
  average_policy_premium DECIMAL(10,2),
  
  -- Client metrics
  new_clients INTEGER DEFAULT 0,
  retained_clients INTEGER DEFAULT 0,
  lost_clients INTEGER DEFAULT 0,
  winback_clients INTEGER DEFAULT 0,
  
  -- Activity metrics
  calls_made INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  meetings_held INTEGER DEFAULT 0,
  quotes_generated INTEGER DEFAULT 0,
  
  -- Quality metrics
  average_response_time_hours DECIMAL(8,2),
  customer_satisfaction_score DECIMAL(3,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(metric_scope, scope_id, period_type, period_start)
);

-- =============================================================================
-- INDEXES FOR MULTI-TENANT PERFORMANCE
-- =============================================================================

-- Organizational hierarchy indexes
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_locations_organization_id ON locations(organization_id);
CREATE INDEX idx_locations_is_active ON locations(is_active);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_primary_location_id ON users(primary_location_id);
CREATE INDEX idx_user_location_assignments_user_id ON user_location_assignments(user_id);
CREATE INDEX idx_user_location_assignments_location_id ON user_location_assignments(location_id);

-- Vehicle and driver indexes
CREATE INDEX idx_vehicles_entity ON vehicles(entity_type, entity_id);
CREATE INDEX idx_drivers_entity ON drivers(entity_type, entity_id);
CREATE INDEX idx_driver_vehicle_assignments_driver_id ON driver_vehicle_assignments(driver_id);
CREATE INDEX idx_driver_vehicle_assignments_vehicle_id ON driver_vehicle_assignments(vehicle_id);

-- Property indexes
CREATE INDEX idx_properties_entity ON properties(entity_type, entity_id);
CREATE INDEX idx_properties_property_type ON properties(property_type);

-- Quote management indexes
CREATE INDEX idx_quote_requests_lead_id ON quote_requests(lead_id);
CREATE INDEX idx_quote_requests_assigned_to ON quote_requests(assigned_to);
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_options_quote_request_id ON quote_options(quote_request_id);
CREATE INDEX idx_quote_options_carrier_name ON quote_options(carrier_name);

-- Policy indexes
CREATE INDEX idx_policies_client_id ON policies(client_id);
CREATE INDEX idx_policies_policy_type ON policies(policy_type);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_renewal_date ON policies(renewal_date);

-- Commercial details indexes
CREATE INDEX idx_commercial_details_entity ON commercial_details(entity_type, entity_id);
CREATE INDEX idx_commercial_details_naics_code ON commercial_details(naics_code);

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_scope ON performance_metrics(metric_scope, scope_id);
CREATE INDEX idx_performance_metrics_period ON performance_metrics(period_type, period_start, period_end);

-- =============================================================================
-- ADD ORGANIZATION REFERENCES TO EXISTING TABLES
-- =============================================================================

-- Add organization_id to main entity tables for multi-tenancy
ALTER TABLE leads ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE clients ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE winbacks ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Update foreign key for locations manager
ALTER TABLE locations ADD CONSTRAINT fk_locations_manager FOREIGN KEY (manager_id) REFERENCES users(id);

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample organization types
INSERT INTO organizations (name, organization_type, subscription_tier) VALUES
('Solo Agent License', 'Individual', 'Basic'),
('Metro Insurance Agency', 'Agency', 'Professional'),
('National Insurance Group', 'Enterprise', 'Enterprise');

-- Insert sample locations
INSERT INTO locations (organization_id, name, location_type, region) 
SELECT id, name || ' - Main Office', 'Headquarters', 'Central' 
FROM organizations;

-- Update schema version
INSERT INTO schema_versions (version, description) 
VALUES ('2.0.0', 'Comprehensive multi-tenant schema with full data coverage');
