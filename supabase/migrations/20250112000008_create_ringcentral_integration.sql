-- =============================================================================
-- MIGRATION: RingCentral Integration
-- =============================================================================
-- Description: Creates ringcentral_tokens and user_phone_preferences with proper security
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- RINGCENTRAL TOKENS TABLE
-- =============================================================================

CREATE TABLE public.ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  
  -- Token expiration
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- OAuth scope and permissions
  scope TEXT,
  granted_permissions JSONB DEFAULT '[]',
  
  -- RingCentral account information
  account_id TEXT,
  extension_id TEXT,
  extension_number TEXT,
  
  -- Token status and validation
  is_active BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  validation_error TEXT,
  
  -- Usage tracking
  api_calls_count INTEGER DEFAULT 0,
  last_api_call_at TIMESTAMP WITH TIME ZONE,
  rate_limit_remaining INTEGER,
  rate_limit_reset_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id) -- One token set per user
);

-- =============================================================================
-- USER PHONE PREFERENCES TABLE
-- =============================================================================

CREATE TABLE public.user_phone_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Phone number configuration
  selected_phone_number TEXT NOT NULL,
  phone_number_label TEXT,
  phone_number_type TEXT CHECK (phone_number_type IN ('Direct', 'Main', 'Toll-Free', 'Local')),
  
  -- Preferences
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Call settings
  call_forwarding_enabled BOOLEAN DEFAULT FALSE,
  call_forwarding_number TEXT,
  voicemail_enabled BOOLEAN DEFAULT TRUE,
  call_recording_enabled BOOLEAN DEFAULT FALSE,
  
  -- Notification preferences
  sms_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  desktop_notifications BOOLEAN DEFAULT TRUE,
  
  -- Business hours
  business_hours JSONB DEFAULT '{}', -- {"monday": {"start": "09:00", "end": "17:00"}, ...}
  timezone TEXT DEFAULT 'America/Chicago',
  
  -- Auto-response settings
  auto_response_enabled BOOLEAN DEFAULT FALSE,
  auto_response_message TEXT,
  out_of_office_enabled BOOLEAN DEFAULT FALSE,
  out_of_office_message TEXT,
  
  -- Integration settings
  crm_integration_enabled BOOLEAN DEFAULT TRUE,
  auto_log_calls BOOLEAN DEFAULT TRUE,
  auto_create_activities BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, selected_phone_number)
);

-- =============================================================================
-- CALL LOGS TABLE
-- =============================================================================

CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  user_id UUID REFERENCES public.users(id),
  client_id UUID REFERENCES public.clients(id),
  lead_id UUID REFERENCES public.leads(id),
  communication_id UUID REFERENCES public.communications(id),
  
  -- RingCentral call details
  ringcentral_call_id TEXT UNIQUE,
  session_id TEXT,
  
  -- Call information
  direction TEXT NOT NULL CHECK (direction IN ('Inbound', 'Outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  
  -- Call status and outcome
  status TEXT CHECK (status IN ('Ringing', 'Connected', 'Disconnected', 'Busy', 'NoAnswer', 'Rejected', 'VoiceMail')),
  result TEXT CHECK (result IN ('Call connected', 'Voicemail', 'Busy', 'No Answer', 'Rejected', 'Failed')),
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE,
  answer_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  
  -- Recording and transcription
  recording_url TEXT,
  recording_id TEXT,
  transcription TEXT,
  transcription_confidence DECIMAL(5,2),
  
  -- AI analysis
  ai_summary TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('Positive', 'Neutral', 'Negative')),
  ai_action_items JSONB DEFAULT '[]',
  ai_follow_up_required BOOLEAN DEFAULT FALSE,
  
  -- Call quality
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  connection_quality TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SMS LOGS TABLE
-- =============================================================================

CREATE TABLE public.sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  user_id UUID REFERENCES public.users(id),
  client_id UUID REFERENCES public.clients(id),
  lead_id UUID REFERENCES public.leads(id),
  communication_id UUID REFERENCES public.communications(id),
  
  -- RingCentral message details
  ringcentral_message_id TEXT UNIQUE,
  conversation_id TEXT,
  
  -- Message information
  direction TEXT NOT NULL CHECK (direction IN ('Inbound', 'Outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  
  -- Message content
  message_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  
  -- Message status
  status TEXT CHECK (status IN ('Queued', 'Sent', 'Delivered', 'DeliveryFailed', 'SendingFailed', 'Received')),
  
  -- AI analysis
  ai_summary TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('Positive', 'Neutral', 'Negative')),
  ai_intent TEXT,
  ai_action_items JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- RingCentral tokens indexes
CREATE INDEX idx_ringcentral_tokens_user_id ON public.ringcentral_tokens(user_id);
CREATE INDEX idx_ringcentral_tokens_expires_at ON public.ringcentral_tokens(expires_at);
CREATE INDEX idx_ringcentral_tokens_is_active ON public.ringcentral_tokens(is_active);
CREATE INDEX idx_ringcentral_tokens_account_id ON public.ringcentral_tokens(account_id);

-- User phone preferences indexes
CREATE INDEX idx_user_phone_preferences_user_id ON public.user_phone_preferences(user_id);
CREATE INDEX idx_user_phone_preferences_phone_number ON public.user_phone_preferences(selected_phone_number);
CREATE INDEX idx_user_phone_preferences_is_default ON public.user_phone_preferences(is_default);
CREATE INDEX idx_user_phone_preferences_is_active ON public.user_phone_preferences(is_active);

-- Call logs indexes
CREATE INDEX idx_call_logs_user_id ON public.call_logs(user_id);
CREATE INDEX idx_call_logs_client_id ON public.call_logs(client_id);
CREATE INDEX idx_call_logs_lead_id ON public.call_logs(lead_id);
CREATE INDEX idx_call_logs_ringcentral_call_id ON public.call_logs(ringcentral_call_id);
CREATE INDEX idx_call_logs_direction ON public.call_logs(direction);
CREATE INDEX idx_call_logs_status ON public.call_logs(status);
CREATE INDEX idx_call_logs_start_time ON public.call_logs(start_time);
CREATE INDEX idx_call_logs_from_number ON public.call_logs(from_number);
CREATE INDEX idx_call_logs_to_number ON public.call_logs(to_number);

-- SMS logs indexes
CREATE INDEX idx_sms_logs_user_id ON public.sms_logs(user_id);
CREATE INDEX idx_sms_logs_client_id ON public.sms_logs(client_id);
CREATE INDEX idx_sms_logs_lead_id ON public.sms_logs(lead_id);
CREATE INDEX idx_sms_logs_ringcentral_message_id ON public.sms_logs(ringcentral_message_id);
CREATE INDEX idx_sms_logs_direction ON public.sms_logs(direction);
CREATE INDEX idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX idx_sms_logs_sent_at ON public.sms_logs(sent_at);
CREATE INDEX idx_sms_logs_from_number ON public.sms_logs(from_number);
CREATE INDEX idx_sms_logs_to_number ON public.sms_logs(to_number);

-- JSONB indexes
CREATE INDEX idx_ringcentral_tokens_metadata ON public.ringcentral_tokens USING GIN (metadata);
CREATE INDEX idx_user_phone_preferences_business_hours ON public.user_phone_preferences USING GIN (business_hours);
CREATE INDEX idx_call_logs_metadata ON public.call_logs USING GIN (metadata);
CREATE INDEX idx_sms_logs_metadata ON public.sms_logs USING GIN (metadata);

-- Full-text search for call transcriptions and SMS content
CREATE INDEX idx_call_logs_transcription_search ON public.call_logs 
  USING GIN (to_tsvector('english', COALESCE(transcription, '')));

CREATE INDEX idx_sms_logs_message_search ON public.sms_logs 
  USING GIN (to_tsvector('english', COALESCE(message_text, '')));

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.ringcentral_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_phone_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- RingCentral tokens - users can only access their own tokens
CREATE POLICY "Users can view their own RingCentral tokens" ON public.ringcentral_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own RingCentral tokens" ON public.ringcentral_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RingCentral tokens" ON public.ringcentral_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own RingCentral tokens" ON public.ringcentral_tokens
  FOR DELETE USING (user_id = auth.uid());

-- User phone preferences - users can only access their own preferences
CREATE POLICY "Users can view their own phone preferences" ON public.user_phone_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own phone preferences" ON public.user_phone_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own phone preferences" ON public.user_phone_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own phone preferences" ON public.user_phone_preferences
  FOR DELETE USING (user_id = auth.uid());

-- Call logs - users can view calls they made/received or have access to related entities
CREATE POLICY "Users can view call logs they have access to" ON public.call_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = call_logs.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = call_logs.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert call logs" ON public.call_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- SMS logs - similar access pattern as call logs
CREATE POLICY "Users can view SMS logs they have access to" ON public.sms_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = sms_logs.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = sms_logs.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert SMS logs" ON public.sms_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Apply standard audit triggers
CREATE TRIGGER update_ringcentral_tokens_updated_at
  BEFORE UPDATE ON public.ringcentral_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_phone_preferences_updated_at
  BEFORE UPDATE ON public.user_phone_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_call_logs_updated_at
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sms_logs_updated_at
  BEFORE UPDATE ON public.sms_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one default phone preference per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Remove default flag from other phone preferences for this user
    UPDATE public.user_phone_preferences 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single default phone preference
CREATE TRIGGER ensure_single_default_phone_preference
  BEFORE INSERT OR UPDATE ON public.user_phone_preferences
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_phone();

-- Function to automatically create communication record from call/SMS
CREATE OR REPLACE FUNCTION public.create_communication_from_call()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create communication record if call was connected and has client/lead
  IF NEW.status = 'Connected' AND (NEW.client_id IS NOT NULL OR NEW.lead_id IS NOT NULL) THEN
    INSERT INTO public.communications (
      client_id,
      lead_id,
      type,
      direction,
      content,
      duration,
      status,
      ai_summary,
      ai_sentiment,
      created_at,
      completed_at
    ) VALUES (
      NEW.client_id,
      NEW.lead_id,
      'call',
      NEW.direction,
      COALESCE(NEW.transcription, 'Call completed - duration: ' || NEW.duration || ' seconds'),
      NEW.duration,
      'Completed',
      NEW.ai_summary,
      NEW.ai_sentiment,
      NEW.start_time,
      NEW.end_time
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create communication from call
CREATE TRIGGER create_communication_from_call_log
  AFTER INSERT OR UPDATE ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION public.create_communication_from_call();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.ringcentral_tokens IS 'RingCentral OAuth tokens with encryption and expiration tracking';
COMMENT ON TABLE public.user_phone_preferences IS 'User phone number preferences and call settings';
COMMENT ON TABLE public.call_logs IS 'Call logs from RingCentral with AI analysis and transcription';
COMMENT ON TABLE public.sms_logs IS 'SMS logs from RingCentral with AI analysis';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ringcentral_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_phone_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_logs TO authenticated;
