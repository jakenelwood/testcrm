-- =============================================================================
-- MIGRATION: Insurance-Specific Tables
-- =============================================================================
-- Description: Creates vehicles, homes, specialty_items, quotes, and insurance types with proper indexing
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- INSURANCE TYPES TABLE
-- =============================================================================

CREATE TABLE public.insurance_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_personal BOOLEAN DEFAULT TRUE,
  is_commercial BOOLEAN DEFAULT FALSE,
  description TEXT,
  icon_name TEXT,
  
  -- Form configuration
  form_schema JSONB DEFAULT '{}',
  required_fields TEXT[] DEFAULT '{}',
  optional_fields TEXT[] DEFAULT '{}',
  
  -- AI configuration
  ai_prompt_template TEXT,
  ai_risk_factors JSONB DEFAULT '{}',
  
  -- Display configuration
  display_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- VEHICLES TABLE
-- =============================================================================

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Vehicle identification
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  state TEXT,
  
  -- Vehicle details
  body_style TEXT, -- Sedan, SUV, Truck, etc.
  engine_size TEXT,
  fuel_type TEXT, -- Gas, Diesel, Electric, Hybrid
  transmission TEXT, -- Manual, Automatic
  color TEXT,
  
  -- Usage information
  primary_use TEXT, -- Personal, Business, Farm, etc.
  annual_mileage INTEGER,
  garage_location TEXT, -- Garage, Driveway, Street, etc.
  
  -- Insurance information
  current_coverage JSONB DEFAULT '{}',
  coverage_limits JSONB DEFAULT '{}',
  deductibles JSONB DEFAULT '{}',
  
  -- Vehicle value
  purchase_price DECIMAL(12,2),
  current_value DECIMAL(12,2),
  loan_balance DECIMAL(12,2),
  
  -- Safety and features
  safety_features TEXT[] DEFAULT '{}',
  anti_theft_devices TEXT[] DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- HOMES TABLE
-- =============================================================================

CREATE TABLE public.homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  address_id UUID REFERENCES public.addresses(id),
  
  -- Property details
  property_type TEXT, -- Single Family, Condo, Townhouse, etc.
  year_built INTEGER,
  square_feet INTEGER,
  lot_size DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  stories INTEGER,
  
  -- Construction details
  construction_type TEXT, -- Frame, Masonry, Steel, etc.
  roof_type TEXT, -- Shingle, Tile, Metal, etc.
  roof_age INTEGER,
  foundation_type TEXT,
  heating_type TEXT,
  cooling_type TEXT,
  
  -- Property value
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  mortgage_balance DECIMAL(15,2),
  
  -- Insurance information
  current_coverage JSONB DEFAULT '{}',
  coverage_limits JSONB DEFAULT '{}',
  deductibles JSONB DEFAULT '{}',
  
  -- Safety and features
  safety_features TEXT[] DEFAULT '{}',
  security_features TEXT[] DEFAULT '{}',
  
  -- Risk factors
  distance_to_fire_station DECIMAL(5,2), -- in miles
  distance_to_coast DECIMAL(5,2), -- in miles
  flood_zone TEXT,
  wildfire_risk TEXT,
  earthquake_risk TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SPECIALTY ITEMS TABLE
-- =============================================================================

CREATE TABLE public.specialty_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Item details
  name TEXT NOT NULL,
  category TEXT, -- Jewelry, Art, Collectibles, Electronics, etc.
  description TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  
  -- Value information
  appraised_value DECIMAL(15,2),
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  appraisal_date DATE,
  appraiser_name TEXT,
  
  -- Coverage information
  coverage_type TEXT, -- Scheduled, Blanket, etc.
  coverage_limit DECIMAL(15,2),
  deductible DECIMAL(10,2),
  
  -- Storage and security
  storage_location TEXT,
  security_measures TEXT[] DEFAULT '{}',
  
  -- Documentation
  photos TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- QUOTES TABLE
-- =============================================================================

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  insurance_type_id INTEGER REFERENCES public.insurance_types(id),
  
  -- Quote details
  carrier TEXT NOT NULL,
  policy_number TEXT,
  quote_number TEXT,
  
  -- Pricing
  paid_in_full_amount DECIMAL(10,2),
  monthly_payment_amount DECIMAL(10,2),
  down_payment_amount DECIMAL(10,2),
  
  -- Terms
  contract_term TEXT CHECK (contract_term IN ('6mo', '12mo', '24mo')),
  effective_date DATE,
  expiration_date DATE,
  
  -- Coverage details
  coverage_details JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  deductibles JSONB DEFAULT '{}',
  
  -- Quote status
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Declined', 'Expired', 'Bound')),
  
  -- Comparison data
  competitor_quotes JSONB DEFAULT '[]',
  savings_amount DECIMAL(10,2),
  savings_percentage DECIMAL(5,2),
  
  -- AI insights
  ai_recommendation TEXT,
  ai_risk_assessment JSONB DEFAULT '{}',
  ai_pricing_factors JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  quote_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bound_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Insurance types indexes
CREATE INDEX idx_insurance_types_name ON public.insurance_types(name);
CREATE INDEX idx_insurance_types_is_active ON public.insurance_types(is_active);
CREATE INDEX idx_insurance_types_display_order ON public.insurance_types(display_order);

-- Vehicles indexes
CREATE INDEX idx_vehicles_client_id ON public.vehicles(client_id);
CREATE INDEX idx_vehicles_lead_id ON public.vehicles(lead_id);
CREATE INDEX idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX idx_vehicles_year ON public.vehicles(year);
CREATE INDEX idx_vehicles_vin ON public.vehicles(vin);
CREATE INDEX idx_vehicles_created_at ON public.vehicles(created_at);

-- Homes indexes
CREATE INDEX idx_homes_client_id ON public.homes(client_id);
CREATE INDEX idx_homes_lead_id ON public.homes(lead_id);
CREATE INDEX idx_homes_address_id ON public.homes(address_id);
CREATE INDEX idx_homes_property_type ON public.homes(property_type);
CREATE INDEX idx_homes_year_built ON public.homes(year_built);
CREATE INDEX idx_homes_created_at ON public.homes(created_at);

-- Specialty items indexes
CREATE INDEX idx_specialty_items_client_id ON public.specialty_items(client_id);
CREATE INDEX idx_specialty_items_lead_id ON public.specialty_items(lead_id);
CREATE INDEX idx_specialty_items_category ON public.specialty_items(category);
CREATE INDEX idx_specialty_items_value ON public.specialty_items(current_value);
CREATE INDEX idx_specialty_items_created_at ON public.specialty_items(created_at);

-- Quotes indexes
CREATE INDEX idx_quotes_lead_id ON public.quotes(lead_id);
CREATE INDEX idx_quotes_insurance_type_id ON public.quotes(insurance_type_id);
CREATE INDEX idx_quotes_carrier ON public.quotes(carrier);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_quote_date ON public.quotes(quote_date);
CREATE INDEX idx_quotes_effective_date ON public.quotes(effective_date);

-- JSONB indexes
CREATE INDEX idx_vehicles_metadata ON public.vehicles USING GIN (metadata);
CREATE INDEX idx_homes_metadata ON public.homes USING GIN (metadata);
CREATE INDEX idx_specialty_items_metadata ON public.specialty_items USING GIN (metadata);
CREATE INDEX idx_quotes_coverage_details ON public.quotes USING GIN (coverage_details);
CREATE INDEX idx_quotes_metadata ON public.quotes USING GIN (metadata);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.insurance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Insurance types - readable by all authenticated users
CREATE POLICY "Insurance types are viewable by all users" ON public.insurance_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage insurance types" ON public.insurance_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Vehicles, homes, specialty items - same pattern
CREATE POLICY "Users can view vehicles they have access to" ON public.vehicles
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = vehicles.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = vehicles.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Similar policies for homes and specialty_items (abbreviated for space)
CREATE POLICY "Users can view homes they have access to" ON public.homes
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = homes.client_id AND c.created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = homes.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Users can view specialty items they have access to" ON public.specialty_items
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = specialty_items.client_id AND c.created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = specialty_items.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Users can view quotes they have access to" ON public.quotes
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = quotes.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Insert/Update policies (abbreviated)
CREATE POLICY "Users can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert homes" ON public.homes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert specialty items" ON public.specialty_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Apply audit field triggers to all tables
CREATE TRIGGER update_vehicles_audit_fields
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

CREATE TRIGGER update_homes_audit_fields
  BEFORE UPDATE ON public.homes
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

CREATE TRIGGER update_specialty_items_audit_fields
  BEFORE UPDATE ON public.specialty_items
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

CREATE TRIGGER update_quotes_audit_fields
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

-- Set created_by triggers
CREATE TRIGGER set_vehicles_created_by
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_homes_created_by
  BEFORE INSERT ON public.homes
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_specialty_items_created_by
  BEFORE INSERT ON public.specialty_items
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_quotes_created_by
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.insurance_types IS 'Insurance product types with form schemas and AI configuration';
COMMENT ON TABLE public.vehicles IS 'Vehicle information for auto insurance quotes';
COMMENT ON TABLE public.homes IS 'Property information for home insurance quotes';
COMMENT ON TABLE public.specialty_items IS 'High-value items requiring special coverage';
COMMENT ON TABLE public.quotes IS 'Insurance quotes with pricing and coverage details';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON public.insurance_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specialty_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
