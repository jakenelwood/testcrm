-- =============================================================================
-- MIGRATION: Pipeline and Status Management
-- =============================================================================
-- Description: Creates pipelines, pipeline_statuses, and lead_statuses with AI action templates
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- LEAD STATUSES TABLE
-- =============================================================================

CREATE TABLE public.lead_statuses (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Status configuration
  is_final BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  
  -- UI configuration
  color_hex TEXT,
  icon_name TEXT,
  badge_variant TEXT DEFAULT 'default',
  
  -- AI configuration
  ai_action_template TEXT,
  ai_follow_up_suggestions JSONB DEFAULT '[]',
  ai_next_steps JSONB DEFAULT '[]',
  
  -- Automation configuration
  auto_actions JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PIPELINES TABLE
-- =============================================================================

CREATE TABLE public.pipelines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pipeline configuration
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  
  -- Pipeline type and targeting
  lead_type TEXT DEFAULT 'Personal' CHECK (lead_type IN ('Personal', 'Business', 'Both')),
  insurance_types INTEGER[] DEFAULT '{}', -- Array of insurance_type IDs
  
  -- Conversion tracking
  conversion_goals JSONB DEFAULT '{}',
  target_conversion_rate DECIMAL(5,2),
  average_cycle_time INTEGER, -- in days
  
  -- AI configuration
  ai_optimization_enabled BOOLEAN DEFAULT FALSE,
  ai_scoring_model JSONB DEFAULT '{}',
  ai_automation_rules JSONB DEFAULT '{}',
  
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
-- PIPELINE STATUSES TABLE
-- =============================================================================

CREATE TABLE public.pipeline_statuses (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status configuration
  is_final BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  
  -- UI configuration
  color_hex TEXT,
  icon_name TEXT,
  badge_variant TEXT DEFAULT 'default',
  
  -- Stage configuration
  stage_type TEXT DEFAULT 'active' CHECK (stage_type IN ('active', 'waiting', 'final')),
  required_fields TEXT[] DEFAULT '{}',
  optional_fields TEXT[] DEFAULT '{}',
  
  -- Time tracking
  target_duration INTEGER, -- Expected time in this status (days)
  max_duration INTEGER, -- Maximum time before escalation (days)
  
  -- AI configuration
  ai_action_template TEXT,
  ai_follow_up_suggestions JSONB DEFAULT '[]',
  ai_next_steps JSONB DEFAULT '[]',
  ai_exit_criteria JSONB DEFAULT '{}',
  
  -- Automation configuration
  auto_actions JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  escalation_rules JSONB DEFAULT '{}',
  
  -- Conversion tracking
  conversion_probability DECIMAL(5,2), -- Expected conversion rate from this stage
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(pipeline_id, display_order),
  UNIQUE(pipeline_id, name)
);

-- =============================================================================
-- LEAD STATUS HISTORY TABLE
-- =============================================================================

CREATE TABLE public.lead_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Status change details
  from_status TEXT,
  to_status TEXT NOT NULL,
  from_pipeline_status_id INTEGER REFERENCES public.pipeline_statuses(id),
  to_pipeline_status_id INTEGER REFERENCES public.pipeline_statuses(id),
  
  -- Change context
  reason TEXT,
  notes TEXT,
  automated BOOLEAN DEFAULT FALSE,
  
  -- Duration tracking
  duration_in_previous_status INTEGER, -- in hours
  
  -- AI insights
  ai_trigger TEXT, -- What AI action triggered this change
  ai_confidence DECIMAL(5,2), -- AI confidence in this status change
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit fields
  changed_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Lead statuses indexes
CREATE INDEX idx_lead_statuses_value ON public.lead_statuses(value);
CREATE INDEX idx_lead_statuses_is_active ON public.lead_statuses(is_active);
CREATE INDEX idx_lead_statuses_display_order ON public.lead_statuses(display_order);

-- Pipelines indexes
CREATE INDEX idx_pipelines_name ON public.pipelines(name);
CREATE INDEX idx_pipelines_is_default ON public.pipelines(is_default);
CREATE INDEX idx_pipelines_is_active ON public.pipelines(is_active);
CREATE INDEX idx_pipelines_lead_type ON public.pipelines(lead_type);
CREATE INDEX idx_pipelines_display_order ON public.pipelines(display_order);
CREATE INDEX idx_pipelines_created_by ON public.pipelines(created_by);

-- Pipeline statuses indexes
CREATE INDEX idx_pipeline_statuses_pipeline_id ON public.pipeline_statuses(pipeline_id);
CREATE INDEX idx_pipeline_statuses_name ON public.pipeline_statuses(name);
CREATE INDEX idx_pipeline_statuses_is_active ON public.pipeline_statuses(is_active);
CREATE INDEX idx_pipeline_statuses_display_order ON public.pipeline_statuses(display_order);
CREATE INDEX idx_pipeline_statuses_stage_type ON public.pipeline_statuses(stage_type);

-- Lead status history indexes
CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_to_status ON public.lead_status_history(to_status);
CREATE INDEX idx_lead_status_history_changed_at ON public.lead_status_history(changed_at);
CREATE INDEX idx_lead_status_history_changed_by ON public.lead_status_history(changed_by);
CREATE INDEX idx_lead_status_history_automated ON public.lead_status_history(automated);

-- JSONB indexes
CREATE INDEX idx_lead_statuses_metadata ON public.lead_statuses USING GIN (metadata);
CREATE INDEX idx_pipelines_metadata ON public.pipelines USING GIN (metadata);
CREATE INDEX idx_pipeline_statuses_metadata ON public.pipeline_statuses USING GIN (metadata);
CREATE INDEX idx_lead_status_history_metadata ON public.lead_status_history USING GIN (metadata);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- Lead statuses - readable by all authenticated users
CREATE POLICY "Lead statuses are viewable by all users" ON public.lead_statuses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage lead statuses" ON public.lead_statuses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Pipelines - readable by all, manageable by admins/managers
CREATE POLICY "Pipelines are viewable by all users" ON public.pipelines
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage pipelines" ON public.pipelines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Pipeline statuses - readable by all, manageable by admins/managers
CREATE POLICY "Pipeline statuses are viewable by all users" ON public.pipeline_statuses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage pipeline statuses" ON public.pipeline_statuses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Lead status history - users can view history for leads they have access to
CREATE POLICY "Users can view lead status history they have access to" ON public.lead_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = lead_status_history.lead_id 
      AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert lead status history" ON public.lead_status_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update pipeline references in leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pipeline_id INTEGER REFERENCES public.pipelines(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pipeline_status_id INTEGER REFERENCES public.pipeline_statuses(id);

-- Function to track lead status changes
CREATE OR REPLACE FUNCTION public.track_lead_status_change()
RETURNS TRIGGER AS $$
DECLARE
  duration_hours INTEGER;
  previous_history RECORD;
BEGIN
  -- Calculate duration in previous status
  SELECT changed_at INTO previous_history
  FROM public.lead_status_history 
  WHERE lead_id = NEW.id 
  ORDER BY changed_at DESC 
  LIMIT 1;
  
  IF previous_history.changed_at IS NOT NULL THEN
    duration_hours := EXTRACT(EPOCH FROM (NOW() - previous_history.changed_at)) / 3600;
  ELSE
    duration_hours := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600;
  END IF;
  
  -- Insert status change record if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.pipeline_status_id IS DISTINCT FROM NEW.pipeline_status_id THEN
    INSERT INTO public.lead_status_history (
      lead_id,
      from_status,
      to_status,
      from_pipeline_status_id,
      to_pipeline_status_id,
      duration_in_previous_status,
      changed_by,
      automated
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      OLD.pipeline_status_id,
      NEW.pipeline_status_id,
      duration_hours,
      auth.uid(),
      FALSE -- Assume manual unless specified otherwise
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to track lead status changes
CREATE TRIGGER track_lead_status_changes
  AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.track_lead_status_change();

-- Function to ensure only one default pipeline per lead type
CREATE OR REPLACE FUNCTION public.ensure_single_default_pipeline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Remove default flag from other pipelines of the same lead type
    UPDATE public.pipelines 
    SET is_default = FALSE 
    WHERE lead_type = NEW.lead_type 
    AND id != NEW.id 
    AND is_default = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single default pipeline
CREATE TRIGGER ensure_single_default_pipeline
  BEFORE INSERT OR UPDATE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_pipeline();

-- Apply standard audit triggers
CREATE TRIGGER update_pipelines_audit_fields
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

CREATE TRIGGER set_pipelines_created_by
  BEFORE INSERT ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get default pipeline for lead type
CREATE OR REPLACE FUNCTION public.get_default_pipeline(lead_type_param TEXT DEFAULT 'Personal')
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT id FROM public.pipelines 
    WHERE lead_type IN (lead_type_param, 'Both') 
    AND is_default = TRUE 
    AND is_active = TRUE
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get first status in pipeline
CREATE OR REPLACE FUNCTION public.get_first_pipeline_status(pipeline_id_param INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT id FROM public.pipeline_statuses 
    WHERE pipeline_id = pipeline_id_param 
    AND is_active = TRUE
    ORDER BY display_order ASC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.lead_statuses IS 'Global lead status definitions with AI action templates';
COMMENT ON TABLE public.pipelines IS 'Sales pipelines for different lead types and insurance products';
COMMENT ON TABLE public.pipeline_statuses IS 'Status definitions within specific pipelines';
COMMENT ON TABLE public.lead_status_history IS 'Historical tracking of lead status changes';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON public.lead_statuses TO authenticated;
GRANT SELECT ON public.pipelines TO authenticated;
GRANT SELECT ON public.pipeline_statuses TO authenticated;
GRANT SELECT, INSERT ON public.lead_status_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_default_pipeline(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_first_pipeline_status(INTEGER) TO authenticated;
