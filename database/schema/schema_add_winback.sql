-- 🔄 Schema Addition: Win-back Customer Lifecycle
-- Lead → Client → Win-back workflow support

-- =============================================================================
-- WIN-BACK TABLE (Former clients who left)
-- =============================================================================

CREATE TABLE winbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to original client (required)
  original_client_id UUID NOT NULL REFERENCES clients(id),
  original_lead_id UUID NOT NULL, -- Denormalized for easy tracking
  
  -- Contact information (migrated from client)
  client_type TEXT NOT NULL CHECK (client_type IN ('Personal', 'Business')),
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  address_id UUID REFERENCES addresses(id),
  mailing_address_id UUID REFERENCES addresses(id),
  
  -- Personal fields (migrated from client)
  date_of_birth TEXT,
  gender TEXT,
  marital_status TEXT,
  drivers_license TEXT,
  license_state TEXT,
  education_occupation TEXT,
  referred_by TEXT,
  
  -- Business fields (migrated from client)
  business_type TEXT,
  industry TEXT,
  tax_id TEXT,
  year_established TEXT,
  annual_revenue DECIMAL(15,2),
  number_of_employees INTEGER,
  
  -- Win-back specific fields
  reason_for_leaving TEXT,
  competitor_name TEXT,
  competitor_rate DECIMAL(10,2),
  last_policy_type TEXT,
  last_carrier TEXT,
  last_premium DECIMAL(10,2),
  last_renewal_date DATE,
  
  -- Win-back campaign tracking
  winback_status TEXT DEFAULT 'New' CHECK (winback_status IN ('New', 'Contacted', 'Interested', 'Quoted', 'Won', 'Lost')),
  assigned_to UUID REFERENCES users(id),
  campaign_id TEXT,
  last_contact_attempt DATE,
  next_contact_date DATE,
  contact_attempts INTEGER DEFAULT 0,
  
  -- Historical data (JSONB for flexibility)
  previous_policies JSONB, -- Array of all previous policies
  interaction_history JSONB, -- Summary of past interactions
  payment_history JSONB, -- Payment patterns and history
  
  -- AI fields for win-back optimization
  ai_win_probability DECIMAL(5,2), -- 0-100% chance of winning back
  ai_recommended_offer TEXT,
  ai_best_contact_time TEXT,
  ai_preferred_channel TEXT, -- 'email', 'phone', 'sms'
  ai_summary TEXT,
  
  -- Conversion tracking
  converted_back_to_client_id UUID REFERENCES clients(id),
  converted_back_at TIMESTAMP WITH TIME ZONE,
  is_won_back BOOLEAN DEFAULT FALSE,
  
  -- Flexible data
  metadata JSONB,
  tags TEXT[],
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_client_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_contact_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- UPDATE CLIENTS TABLE for Win-back Tracking
-- =============================================================================

-- Add win-back tracking to clients table
ALTER TABLE clients ADD COLUMN converted_to_winback_id UUID REFERENCES winbacks(id);
ALTER TABLE clients ADD COLUMN converted_to_winback_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN is_winback BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN client_status TEXT DEFAULT 'Active' CHECK (client_status IN ('Active', 'Inactive', 'Winback'));

-- =============================================================================
-- WIN-BACK CAMPAIGNS TABLE (Optional - for organized campaigns)
-- =============================================================================

CREATE TABLE winback_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT CHECK (campaign_type IN ('Rate_Drop', 'New_Product', 'Seasonal', 'Competitor_Beat')),
  
  -- Campaign parameters
  target_criteria JSONB, -- Who to target (e.g., left in last 6 months, certain policy types)
  offer_details JSONB, -- What to offer (discounts, new products, etc.)
  contact_schedule JSONB, -- When and how often to contact
  
  -- Campaign status
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Paused', 'Completed')),
  start_date DATE,
  end_date DATE,
  
  -- Results tracking
  total_targeted INTEGER DEFAULT 0,
  total_contacted INTEGER DEFAULT 0,
  total_responded INTEGER DEFAULT 0,
  total_won_back INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================================================
-- UPDATE SUPPORTING TABLES for Win-back Support
-- =============================================================================

-- Update communications to support win-backs
ALTER TABLE communications ADD COLUMN winback_id UUID REFERENCES winbacks(id);

-- Update notes to support win-backs  
ALTER TABLE notes ADD COLUMN winback_id UUID REFERENCES winbacks(id);

-- Update AI interactions to support win-backs
ALTER TABLE ai_interactions ADD COLUMN winback_id UUID REFERENCES winbacks(id);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Win-back indexes
CREATE INDEX idx_winbacks_original_client_id ON winbacks(original_client_id);
CREATE INDEX idx_winbacks_winback_status ON winbacks(winback_status);
CREATE INDEX idx_winbacks_assigned_to ON winbacks(assigned_to);
CREATE INDEX idx_winbacks_next_contact_date ON winbacks(next_contact_date);
CREATE INDEX idx_winbacks_is_won_back ON winbacks(is_won_back);
CREATE INDEX idx_winbacks_client_type ON winbacks(client_type);
CREATE INDEX idx_winbacks_left_client_at ON winbacks(left_client_at);

-- Client win-back tracking indexes
CREATE INDEX idx_clients_converted_to_winback_id ON clients(converted_to_winback_id);
CREATE INDEX idx_clients_client_status ON clients(client_status);
CREATE INDEX idx_clients_is_winback ON clients(is_winback);

-- Campaign indexes
CREATE INDEX idx_winback_campaigns_status ON winback_campaigns(status);
CREATE INDEX idx_winback_campaigns_start_date ON winback_campaigns(start_date);
CREATE INDEX idx_winback_campaigns_created_by ON winback_campaigns(created_by);

-- Supporting table indexes for win-backs
CREATE INDEX idx_communications_winback_id ON communications(winback_id);
CREATE INDEX idx_notes_winback_id ON notes(winback_id);
CREATE INDEX idx_ai_interactions_winback_id ON ai_interactions(winback_id);

-- =============================================================================
-- SAMPLE WIN-BACK STATUSES
-- =============================================================================

-- Insert sample win-back campaign
INSERT INTO winback_campaigns (name, description, campaign_type, target_criteria, offer_details, status) VALUES
('Q1 Rate Drop Campaign', 'Target former clients with lower rates due to market changes', 'Rate_Drop', 
 '{"left_within_months": 12, "policy_types": ["Auto", "Home"], "min_last_premium": 500}',
 '{"discount_percent": 15, "new_customer_bonus": 100, "free_months": 1}',
 'Draft');

-- =============================================================================
-- SAMPLE CONVERSION FUNCTIONS (for reference)
-- =============================================================================

-- Function to convert client to win-back (would be implemented in application)
/*
CREATE OR REPLACE FUNCTION convert_client_to_winback(
  p_client_id UUID,
  p_reason_for_leaving TEXT,
  p_competitor_name TEXT DEFAULT NULL,
  p_competitor_rate DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_winback_id UUID;
  v_client_record RECORD;
BEGIN
  -- Get client data
  SELECT * INTO v_client_record FROM clients WHERE id = p_client_id;
  
  -- Create win-back record
  INSERT INTO winbacks (
    original_client_id, original_lead_id, client_type, name, email, phone_number,
    reason_for_leaving, competitor_name, competitor_rate,
    -- ... copy all relevant fields
  ) VALUES (
    p_client_id, v_client_record.original_lead_id, v_client_record.client_type,
    v_client_record.name, v_client_record.email, v_client_record.phone_number,
    p_reason_for_leaving, p_competitor_name, p_competitor_rate
    -- ... copy all relevant fields
  ) RETURNING id INTO v_winback_id;
  
  -- Update client record
  UPDATE clients 
  SET converted_to_winback_id = v_winback_id,
      converted_to_winback_at = NOW(),
      is_winback = TRUE,
      client_status = 'Winback'
  WHERE id = p_client_id;
  
  -- Archive policies (mark as inactive)
  UPDATE policies 
  SET status = 'Cancelled'
  WHERE client_id = p_client_id AND status = 'Active';
  
  RETURN v_winback_id;
END;
$$ LANGUAGE plpgsql;
*/
