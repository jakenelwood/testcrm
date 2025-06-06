-- 📊 Marketing Data Enhancement Schema
-- Comprehensive marketing analytics following MECE principles
-- Designed to be "simple but no simpler" with DRY architecture

-- =============================================================================
-- CAMPAIGN MANAGEMENT
-- =============================================================================

-- Master campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT CHECK (campaign_type IN ('Email', 'SMS', 'Phone', 'Social', 'Multi-Channel')),
  objective TEXT CHECK (objective IN ('Lead_Generation', 'Nurture', 'Conversion', 'Retention', 'Winback')),
  
  -- Targeting
  target_audience JSONB, -- Criteria for targeting
  expected_reach INTEGER,
  
  -- Timing
  start_date DATE,
  end_date DATE,
  timezone TEXT DEFAULT 'America/Chicago',
  
  -- Budget and goals
  budget_allocated DECIMAL(10,2),
  target_conversions INTEGER,
  target_cac DECIMAL(8,2), -- Customer Acquisition Cost
  
  -- Templates and content
  content_templates JSONB, -- Templates by channel
  
  -- Status and tracking
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Paused', 'Completed', 'Cancelled')),
  created_by UUID REFERENCES users(id),
  
  -- AI optimization
  ai_optimization_notes TEXT,
  ai_performance_prediction JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Testing framework
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  test_name TEXT NOT NULL,
  hypothesis TEXT,
  
  -- Test configuration
  test_type TEXT CHECK (test_type IN ('Subject_Line', 'Content', 'Send_Time', 'Channel', 'Template')),
  control_variant TEXT NOT NULL,
  test_variants JSONB NOT NULL, -- Array of variant configurations
  
  -- Sample allocation
  sample_size_per_variant INTEGER,
  traffic_allocation JSONB, -- Percentage per variant
  
  -- Test duration
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Results
  statistical_significance DECIMAL(5,2), -- Confidence level
  winner_variant TEXT,
  performance_lift DECIMAL(8,4), -- Percentage improvement
  
  -- Status
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Running', 'Completed', 'Stopped')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ENHANCED COMMUNICATIONS WITH MARKETING DATA
-- =============================================================================

-- Extend existing communications table with marketing fields
ALTER TABLE communications ADD COLUMN campaign_id UUID REFERENCES campaigns(id);
ALTER TABLE communications ADD COLUMN ab_test_id UUID REFERENCES ab_tests(id);
ALTER TABLE communications ADD COLUMN ab_variant TEXT;
ALTER TABLE communications ADD COLUMN content_template_id TEXT;
ALTER TABLE communications ADD COLUMN personalization_data JSONB;

-- Channel-specific engagement metrics
CREATE TABLE communication_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  communication_id UUID NOT NULL REFERENCES communications(id),
  
  -- Universal metrics
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Email-specific metrics
  email_client TEXT,
  device_type TEXT,
  bounce_type TEXT CHECK (bounce_type IN ('Hard', 'Soft', 'None')),
  spam_complaint BOOLEAN DEFAULT FALSE,
  unsubscribed BOOLEAN DEFAULT FALSE,
  
  -- SMS-specific metrics
  sms_delivery_status TEXT,
  sms_opt_out BOOLEAN DEFAULT FALSE,
  
  -- Phone-specific metrics
  call_duration_seconds INTEGER,
  call_outcome TEXT,
  voicemail_left BOOLEAN DEFAULT FALSE,
  voicemail_listened BOOLEAN DEFAULT FALSE,
  
  -- Social media metrics
  social_platform TEXT,
  social_engagement_type TEXT, -- like, share, comment, etc.
  social_reach INTEGER,
  social_impressions INTEGER,
  
  -- Attribution and conversion
  conversion_attributed BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10,2),
  attribution_model TEXT DEFAULT 'Last_Touch',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CONTENT AND TEMPLATE MANAGEMENT
-- =============================================================================

-- Content templates for reusability
CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN ('Email', 'SMS', 'Social', 'Script')),
  
  -- Template content
  subject_line TEXT, -- For emails
  content_body TEXT NOT NULL,
  call_to_action TEXT,
  
  -- Personalization
  personalization_fields JSONB, -- Available merge fields
  dynamic_content_rules JSONB, -- Conditional content rules
  
  -- Performance tracking
  usage_count INTEGER DEFAULT 0,
  avg_open_rate DECIMAL(5,4),
  avg_click_rate DECIMAL(5,4),
  avg_conversion_rate DECIMAL(5,4),
  
  -- Categorization
  category TEXT,
  tags TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ATTRIBUTION AND JOURNEY TRACKING
-- =============================================================================

-- Customer journey touchpoints
CREATE TABLE customer_touchpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  client_id UUID REFERENCES clients(id),
  
  -- Touchpoint details
  touchpoint_type TEXT CHECK (touchpoint_type IN ('Email', 'SMS', 'Phone', 'Social', 'Website', 'In_Person')),
  communication_id UUID REFERENCES communications(id),
  campaign_id UUID REFERENCES campaigns(id),
  
  -- Journey position
  touchpoint_sequence INTEGER, -- Order in customer journey
  is_first_touch BOOLEAN DEFAULT FALSE,
  is_last_touch BOOLEAN DEFAULT FALSE,
  
  -- Attribution weights
  linear_attribution_weight DECIMAL(5,4),
  time_decay_weight DECIMAL(5,4),
  position_based_weight DECIMAL(5,4),
  
  -- Conversion tracking
  led_to_conversion BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10,2),
  days_to_conversion INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE ANALYTICS
-- =============================================================================

-- Campaign performance summary (materialized view data)
CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  date_period DATE NOT NULL, -- Daily aggregation
  
  -- Volume metrics
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_responded INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  
  -- Rate metrics (calculated)
  delivery_rate DECIMAL(5,4),
  open_rate DECIMAL(5,4),
  click_rate DECIMAL(5,4),
  response_rate DECIMAL(5,4),
  conversion_rate DECIMAL(5,4),
  
  -- Financial metrics
  cost_per_send DECIMAL(8,4),
  cost_per_click DECIMAL(8,2),
  cost_per_conversion DECIMAL(8,2),
  revenue_attributed DECIMAL(12,2),
  roi DECIMAL(8,4),
  
  -- Channel breakdown
  channel_performance JSONB, -- Performance by channel
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(campaign_id, date_period)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Campaign indexes
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);

-- A/B test indexes
CREATE INDEX idx_ab_tests_campaign_id ON ab_tests(campaign_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);

-- Communication metrics indexes
CREATE INDEX idx_communication_metrics_comm_id ON communication_metrics(communication_id);
CREATE INDEX idx_communication_metrics_sent_at ON communication_metrics(sent_at);
CREATE INDEX idx_communication_metrics_conversion ON communication_metrics(conversion_attributed);

-- Content template indexes
CREATE INDEX idx_content_templates_type ON content_templates(template_type);
CREATE INDEX idx_content_templates_active ON content_templates(is_active);
CREATE INDEX idx_content_templates_performance ON content_templates(avg_conversion_rate);

-- Touchpoint indexes
CREATE INDEX idx_touchpoints_lead_id ON customer_touchpoints(lead_id);
CREATE INDEX idx_touchpoints_client_id ON customer_touchpoints(client_id);
CREATE INDEX idx_touchpoints_campaign_id ON customer_touchpoints(campaign_id);
CREATE INDEX idx_touchpoints_sequence ON customer_touchpoints(touchpoint_sequence);
CREATE INDEX idx_touchpoints_conversion ON customer_touchpoints(led_to_conversion);

-- Analytics indexes
CREATE INDEX idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, date_period);
CREATE INDEX idx_campaign_analytics_performance ON campaign_analytics(conversion_rate, roi);

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample campaign
INSERT INTO campaigns (name, description, campaign_type, objective, target_audience, status) VALUES
('Q1 Auto Insurance Follow-up', 'Nurture leads who requested auto quotes', 'Multi-Channel', 'Conversion',
 '{"lead_status": ["Quoted"], "insurance_type": ["Auto"], "days_since_quote": [7, 30]}', 'Draft');

-- Insert sample content template
INSERT INTO content_templates (name, template_type, subject_line, content_body, call_to_action, category) VALUES
('Auto Quote Follow-up Email', 'Email', 'Your auto insurance quote is ready!',
 'Hi {{first_name}}, your personalized auto insurance quote is ready. Save up to {{savings_amount}} per year!',
 'View Your Quote', 'Follow-up');

-- Record schema version
INSERT INTO schema_versions (version, description)
VALUES ('2.0.0', 'Marketing data enhancement with comprehensive analytics');
