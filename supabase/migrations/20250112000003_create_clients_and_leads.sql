-- =============================================================================
-- MIGRATION: Client and Lead Management
-- =============================================================================
-- Description: Creates clients and leads tables with AI fields, JSONB data, and proper relationships
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic information
  client_type TEXT NOT NULL CHECK (client_type IN ('Individual', 'Business')),
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  
  -- Address relationships
  address_id UUID REFERENCES public.addresses(id),
  mailing_address_id UUID REFERENCES public.addresses(id),
  
  -- Individual-specific fields
  date_of_birth TEXT,
  gender TEXT,
  marital_status TEXT,
  drivers_license TEXT,
  license_state TEXT,
  education_occupation TEXT,
  referred_by TEXT,
  
  -- Business-specific fields
  business_type TEXT,
  industry TEXT,
  tax_id TEXT,
  year_established TEXT,
  annual_revenue DECIMAL(15,2),
  number_of_employees INTEGER,
  
  -- AI fields
  ai_summary TEXT,
  ai_next_action TEXT,
  ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
  ai_lifetime_value DECIMAL(15,2),
  ai_insights JSONB DEFAULT '{}',
  
  -- Flexible data
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Status and tracking
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Prospect', 'Lost')),
  source TEXT DEFAULT 'Manual Entry',
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_contact_at TIMESTAMP WITH TIME ZONE,
  converted_from_lead_id UUID -- Will reference leads table
);

-- =============================================================================
-- LEADS TABLE
-- =============================================================================

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id),
  
  -- Lead classification
  lead_type TEXT DEFAULT 'Personal' CHECK (lead_type IN ('Personal', 'Business')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  
  -- Insurance information
  current_carrier TEXT,
  current_policy_expiry DATE,
  
  -- Premium information
  premium DECIMAL(10,2),
  auto_premium DECIMAL(10,2),
  home_premium DECIMAL(10,2),
  specialty_premium DECIMAL(10,2),
  commercial_premium DECIMAL(10,2),
  
  -- Insurance-specific JSONB data with schema versioning
  auto_data JSONB DEFAULT '{}',
  auto_data_version INTEGER DEFAULT 1,
  home_data JSONB DEFAULT '{}',
  home_data_version INTEGER DEFAULT 1,
  specialty_data JSONB DEFAULT '{}',
  specialty_data_version INTEGER DEFAULT 1,
  commercial_data JSONB DEFAULT '{}',
  commercial_data_version INTEGER DEFAULT 1,
  liability_data JSONB DEFAULT '{}',
  liability_data_version INTEGER DEFAULT 1,
  
  -- Multi-party and multi-location data
  additional_insureds JSONB DEFAULT '[]',
  additional_locations JSONB DEFAULT '[]',
  drivers JSONB DEFAULT '[]',
  vehicles JSONB DEFAULT '[]',
  
  -- AI fields
  ai_summary TEXT,
  ai_next_action TEXT,
  ai_quote_recommendation TEXT,
  ai_follow_up_priority INTEGER CHECK (ai_follow_up_priority >= 1 AND ai_follow_up_priority <= 10),
  ai_conversion_probability DECIMAL(5,2) CHECK (ai_conversion_probability >= 0 AND ai_conversion_probability <= 100),
  ai_insights JSONB DEFAULT '{}',
  
  -- Marketing attribution
  campaign_id UUID, -- Will reference campaigns table
  ab_test_id UUID, -- Will reference ab_tests table
  content_template_id UUID, -- Will reference content_templates table
  attribution_data JSONB DEFAULT '{}',
  
  -- Flexible data
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  
  -- Import and source tracking
  source TEXT DEFAULT 'Manual Entry',
  import_file_name TEXT,
  import_batch_id UUID,
  
  -- Status tracking
  status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Quoted', 'Sold', 'Lost', 'Hibernated')),
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_contact_at TIMESTAMP WITH TIME ZONE,
  quote_generated_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  lost_at TIMESTAMP WITH TIME ZONE,
  hibernated_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key constraint for converted_from_lead_id after leads table is created
ALTER TABLE public.clients 
ADD CONSTRAINT fk_clients_converted_from_lead 
FOREIGN KEY (converted_from_lead_id) REFERENCES public.leads(id);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Clients indexes
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_phone ON public.clients(phone_number);
CREATE INDEX idx_clients_type ON public.clients(client_type);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_source ON public.clients(source);
CREATE INDEX idx_clients_created_at ON public.clients(created_at);
CREATE INDEX idx_clients_created_by ON public.clients(created_by);

-- Clients JSONB indexes
CREATE INDEX idx_clients_metadata ON public.clients USING GIN (metadata);
CREATE INDEX idx_clients_tags ON public.clients USING GIN (tags);
CREATE INDEX idx_clients_ai_insights ON public.clients USING GIN (ai_insights);

-- Clients full-text search
CREATE INDEX idx_clients_search ON public.clients 
  USING GIN (to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(phone_number, '') || ' ' ||
    COALESCE(business_type, '') || ' ' ||
    COALESCE(industry, '')
  ));

-- Leads indexes
CREATE INDEX idx_leads_client_id ON public.leads(client_id);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_priority ON public.leads(priority);
CREATE INDEX idx_leads_lead_type ON public.leads(lead_type);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_created_by ON public.leads(created_by);
CREATE INDEX idx_leads_next_contact_at ON public.leads(next_contact_at);

-- Leads JSONB indexes
CREATE INDEX idx_leads_auto_data ON public.leads USING GIN (auto_data);
CREATE INDEX idx_leads_home_data ON public.leads USING GIN (home_data);
CREATE INDEX idx_leads_metadata ON public.leads USING GIN (metadata);
CREATE INDEX idx_leads_tags ON public.leads USING GIN (tags);
CREATE INDEX idx_leads_ai_insights ON public.leads USING GIN (ai_insights);
CREATE INDEX idx_leads_custom_fields ON public.leads USING GIN (custom_fields);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Clients RLS policies
CREATE POLICY "Users can view clients they created or are assigned to" ON public.clients
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE client_id = clients.id AND assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update clients they have access to" ON public.clients
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE client_id = clients.id AND assigned_to = auth.uid()
    )
  );

-- Leads RLS policies
CREATE POLICY "Users can view leads they created or are assigned to" ON public.leads
  FOR SELECT USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update leads they have access to" ON public.leads
  FOR UPDATE USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update audit fields for clients
CREATE OR REPLACE FUNCTION public.update_client_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update audit fields for leads
CREATE OR REPLACE FUNCTION public.update_lead_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  
  -- Update status_changed_at if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = NOW();
    
    -- Set specific timestamp fields based on status
    CASE NEW.status
      WHEN 'Sold' THEN NEW.sold_at = NOW();
      WHEN 'Lost' THEN NEW.lost_at = NOW();
      WHEN 'Hibernated' THEN NEW.hibernated_at = NOW();
      ELSE NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for audit fields
CREATE TRIGGER update_clients_audit_fields
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_client_audit_fields();

CREATE TRIGGER update_leads_audit_fields
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_audit_fields();

-- Function to set created_by on insert
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to set created_by
CREATE TRIGGER set_clients_created_by
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_leads_created_by
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.clients IS 'Client management for both individual and business clients with AI insights';
COMMENT ON TABLE public.leads IS 'Lead management with insurance-specific data and AI-powered insights';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
