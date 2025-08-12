-- =============================================================================
-- MIGRATION: Communication and Marketing Tables
-- =============================================================================
-- Description: Creates communications, campaigns, ab_tests, content_templates, and customer_touchpoints
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- CAMPAIGNS TABLE
-- =============================================================================

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Campaign configuration
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('Email', 'SMS', 'Phone', 'Social', 'Direct Mail', 'Digital Ads', 'Webinar', 'Event')),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Paused', 'Completed', 'Cancelled')),
  
  -- Timing
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Budget and goals
  budget DECIMAL(15,2),
  target_audience JSONB DEFAULT '{}',
  goals JSONB DEFAULT '{}',
  success_metrics JSONB DEFAULT '{}',
  
  -- Targeting
  audience_filters JSONB DEFAULT '{}',
  geographic_targeting JSONB DEFAULT '{}',
  demographic_targeting JSONB DEFAULT '{}',
  
  -- Performance tracking
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_cost DECIMAL(15,2) DEFAULT 0,
  
  -- AI optimization
  ai_optimization_enabled BOOLEAN DEFAULT FALSE,
  ai_insights JSONB DEFAULT '{}',
  ai_recommendations JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- A/B TESTS TABLE
-- =============================================================================

CREATE TABLE public.ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  
  -- Test configuration
  test_type TEXT NOT NULL CHECK (test_type IN ('Subject Line', 'Content', 'Send Time', 'Call Script', 'Landing Page', 'Offer', 'CTA')),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Running', 'Completed', 'Cancelled')),
  
  -- Timing
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Test setup
  traffic_split JSONB DEFAULT '{"variant_a": 50, "variant_b": 50}',
  sample_size INTEGER,
  confidence_level DECIMAL(5,2) DEFAULT 95.0,
  
  -- Success criteria
  success_metric TEXT NOT NULL,
  minimum_effect_size DECIMAL(5,2),
  statistical_significance DECIMAL(5,2),
  
  -- Results
  winner_variant TEXT,
  variants JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  
  -- AI insights
  ai_analysis JSONB DEFAULT '{}',
  ai_recommendations JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CONTENT TEMPLATES TABLE
-- =============================================================================

CREATE TABLE public.content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template configuration
  template_type TEXT NOT NULL CHECK (template_type IN ('Email', 'SMS', 'Call Script', 'Social Post', 'Ad Copy', 'Letter', 'Proposal')),
  category TEXT,
  
  -- Content
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Template variables for personalization
  
  -- Personalization
  personalization_fields TEXT[] DEFAULT '{}',
  dynamic_content JSONB DEFAULT '{}',
  
  -- Performance tracking
  usage_count INTEGER DEFAULT 0,
  performance_score DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  engagement_rate DECIMAL(5,2),
  
  -- AI optimization
  ai_optimized BOOLEAN DEFAULT FALSE,
  ai_suggestions JSONB DEFAULT '{}',
  ai_performance_insights JSONB DEFAULT '{}',
  
  -- Status and organization
  is_active BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMMUNICATIONS TABLE
-- =============================================================================

CREATE TABLE public.communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id),
  ab_test_id UUID REFERENCES public.ab_tests(id),
  content_template_id UUID REFERENCES public.content_templates(id),
  
  -- Communication details
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'sms', 'meeting', 'note', 'voicemail', 'social', 'letter')),
  direction TEXT CHECK (direction IN ('Inbound', 'Outbound')),
  
  -- Content
  subject TEXT,
  content TEXT,
  attachments TEXT[] DEFAULT '{}',
  
  -- Status and outcome
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Replied', 'Failed', 'Bounced')),
  outcome TEXT,
  
  -- Call-specific fields
  duration INTEGER, -- in seconds
  recording_url TEXT,
  call_quality_score INTEGER CHECK (call_quality_score >= 1 AND call_quality_score <= 5),
  
  -- Email-specific fields
  email_provider TEXT,
  tracking_pixel_url TEXT,
  unsubscribe_url TEXT,
  
  -- AI analysis
  ai_summary TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('Positive', 'Neutral', 'Negative')),
  ai_entities JSONB DEFAULT '{}',
  ai_action_items JSONB DEFAULT '[]',
  ai_follow_up_suggestions JSONB DEFAULT '[]',
  
  -- Personalization and targeting
  personalization_data JSONB DEFAULT '{}',
  targeting_data JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- CUSTOMER TOUCHPOINTS TABLE
-- =============================================================================

CREATE TABLE public.customer_touchpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id),
  ab_test_id UUID REFERENCES public.ab_tests(id),
  communication_id UUID REFERENCES public.communications(id),
  
  -- Touchpoint details
  touchpoint_type TEXT NOT NULL CHECK (touchpoint_type IN (
    'Email Open', 'Email Click', 'SMS Click', 'Phone Call', 'Website Visit', 
    'Form Submit', 'Ad Click', 'Social Engagement', 'Download', 'Purchase'
  )),
  channel TEXT NOT NULL,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  content TEXT,
  
  -- Attribution
  attribution_weight DECIMAL(5,4) DEFAULT 1.0,
  attribution_model TEXT DEFAULT 'last_touch' CHECK (attribution_model IN ('first_touch', 'last_touch', 'linear', 'time_decay', 'position_based')),
  conversion_value DECIMAL(15,2),
  
  -- Context
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  device_type TEXT,
  browser TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Campaigns indexes
CREATE INDEX idx_campaigns_name ON public.campaigns(name);
CREATE INDEX idx_campaigns_type ON public.campaigns(campaign_type);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_start_date ON public.campaigns(start_date);
CREATE INDEX idx_campaigns_created_by ON public.campaigns(created_by);

-- A/B tests indexes
CREATE INDEX idx_ab_tests_campaign_id ON public.ab_tests(campaign_id);
CREATE INDEX idx_ab_tests_status ON public.ab_tests(status);
CREATE INDEX idx_ab_tests_test_type ON public.ab_tests(test_type);

-- Content templates indexes
CREATE INDEX idx_content_templates_type ON public.content_templates(template_type);
CREATE INDEX idx_content_templates_category ON public.content_templates(category);
CREATE INDEX idx_content_templates_is_active ON public.content_templates(is_active);
CREATE INDEX idx_content_templates_usage_count ON public.content_templates(usage_count);

-- Communications indexes
CREATE INDEX idx_communications_client_id ON public.communications(client_id);
CREATE INDEX idx_communications_lead_id ON public.communications(lead_id);
CREATE INDEX idx_communications_campaign_id ON public.communications(campaign_id);
CREATE INDEX idx_communications_type ON public.communications(type);
CREATE INDEX idx_communications_direction ON public.communications(direction);
CREATE INDEX idx_communications_status ON public.communications(status);
CREATE INDEX idx_communications_created_at ON public.communications(created_at);
CREATE INDEX idx_communications_scheduled_at ON public.communications(scheduled_at);

-- Customer touchpoints indexes
CREATE INDEX idx_customer_touchpoints_client_id ON public.customer_touchpoints(client_id);
CREATE INDEX idx_customer_touchpoints_lead_id ON public.customer_touchpoints(lead_id);
CREATE INDEX idx_customer_touchpoints_campaign_id ON public.customer_touchpoints(campaign_id);
CREATE INDEX idx_customer_touchpoints_type ON public.customer_touchpoints(touchpoint_type);
CREATE INDEX idx_customer_touchpoints_channel ON public.customer_touchpoints(channel);
CREATE INDEX idx_customer_touchpoints_occurred_at ON public.customer_touchpoints(occurred_at);

-- JSONB indexes
CREATE INDEX idx_campaigns_metadata ON public.campaigns USING GIN (metadata);
CREATE INDEX idx_ab_tests_results ON public.ab_tests USING GIN (results);
CREATE INDEX idx_content_templates_variables ON public.content_templates USING GIN (variables);
CREATE INDEX idx_communications_ai_entities ON public.communications USING GIN (ai_entities);
CREATE INDEX idx_customer_touchpoints_metadata ON public.customer_touchpoints USING GIN (metadata);

-- Full-text search indexes
CREATE INDEX idx_campaigns_search ON public.campaigns 
  USING GIN (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

CREATE INDEX idx_content_templates_search ON public.content_templates 
  USING GIN (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(content, '')));

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_touchpoints ENABLE ROW LEVEL SECURITY;

-- Campaigns RLS policies
CREATE POLICY "Users can view campaigns they created or have access to" ON public.campaigns
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update campaigns they have access to" ON public.campaigns
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- A/B tests RLS policies
CREATE POLICY "Users can view ab_tests they have access to" ON public.ab_tests
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = ab_tests.campaign_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert ab_tests" ON public.ab_tests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Content templates RLS policies
CREATE POLICY "Users can view content templates" ON public.content_templates
  FOR SELECT USING (
    created_by = auth.uid() OR
    is_active = TRUE OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert content templates" ON public.content_templates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their content templates" ON public.content_templates
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Communications RLS policies
CREATE POLICY "Users can view communications they have access to" ON public.communications
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = communications.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = communications.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert communications" ON public.communications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Customer touchpoints RLS policies
CREATE POLICY "Users can view touchpoints they have access to" ON public.customer_touchpoints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = customer_touchpoints.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = customer_touchpoints.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert touchpoints" ON public.customer_touchpoints
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Apply standard audit triggers
CREATE TRIGGER update_campaigns_audit_fields
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

CREATE TRIGGER update_ab_tests_audit_fields
  BEFORE UPDATE ON public.ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

CREATE TRIGGER update_content_templates_audit_fields
  BEFORE UPDATE ON public.content_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

CREATE TRIGGER update_communications_audit_fields
  BEFORE UPDATE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

-- Set created_by triggers
CREATE TRIGGER set_campaigns_created_by
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_ab_tests_created_by
  BEFORE INSERT ON public.ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_content_templates_created_by
  BEFORE INSERT ON public.content_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_communications_created_by
  BEFORE INSERT ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Function to update content template usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content_template_id IS NOT NULL THEN
    UPDATE public.content_templates
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.content_template_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment template usage
CREATE TRIGGER increment_template_usage_on_communication
  AFTER INSERT ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.increment_template_usage();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.campaigns IS 'Marketing campaigns with performance tracking and AI optimization';
COMMENT ON TABLE public.ab_tests IS 'A/B testing framework for campaign optimization';
COMMENT ON TABLE public.content_templates IS 'Reusable content templates with personalization and performance tracking';
COMMENT ON TABLE public.communications IS 'Communication tracking with AI analysis and sentiment detection';
COMMENT ON TABLE public.customer_touchpoints IS 'Customer interaction tracking for attribution and journey mapping';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ab_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_touchpoints TO authenticated;
