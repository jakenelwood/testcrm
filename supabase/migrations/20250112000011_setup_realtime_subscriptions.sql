-- =============================================================================
-- MIGRATION: Real-time Subscriptions Setup
-- =============================================================================
-- Description: Configure Supabase real-time for live updates on leads, communications, and pipeline changes
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- ENABLE REAL-TIME FOR TABLES
-- =============================================================================

-- Enable real-time for core business tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_touchpoints;

-- Enable real-time for configuration tables that might change
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipelines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ab_tests;

-- Enable real-time for user-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_phone_preferences;

-- =============================================================================
-- REAL-TIME NOTIFICATION FUNCTIONS
-- =============================================================================

-- Function to send real-time notifications for lead changes
CREATE OR REPLACE FUNCTION public.notify_lead_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Determine the operation type
  IF TG_OP = 'DELETE' THEN
    notification_payload := jsonb_build_object(
      'operation', 'DELETE',
      'table', 'leads',
      'id', OLD.id,
      'old_record', row_to_json(OLD)
    );
  ELSE
    notification_payload := jsonb_build_object(
      'operation', TG_OP,
      'table', 'leads',
      'id', COALESCE(NEW.id, OLD.id),
      'new_record', CASE WHEN NEW IS NOT NULL THEN row_to_json(NEW) ELSE NULL END,
      'old_record', CASE WHEN OLD IS NOT NULL THEN row_to_json(OLD) ELSE NULL END
    );
  END IF;
  
  -- Send notification to general leads channel
  PERFORM pg_notify('leads_changes', notification_payload::TEXT);
  
  -- Send notification to user-specific channel if assigned
  IF (TG_OP = 'DELETE' AND OLD.assigned_to IS NOT NULL) OR 
     (TG_OP != 'DELETE' AND NEW.assigned_to IS NOT NULL) THEN
    channel_name := 'user_' || COALESCE(NEW.assigned_to, OLD.assigned_to)::TEXT || '_leads';
    PERFORM pg_notify(channel_name, notification_payload::TEXT);
  END IF;
  
  -- Send notification to pipeline-specific channel
  IF (TG_OP = 'DELETE' AND OLD.pipeline_id IS NOT NULL) OR 
     (TG_OP != 'DELETE' AND NEW.pipeline_id IS NOT NULL) THEN
    channel_name := 'pipeline_' || COALESCE(NEW.pipeline_id, OLD.pipeline_id)::TEXT || '_leads';
    PERFORM pg_notify(channel_name, notification_payload::TEXT);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send real-time notifications for communication changes
CREATE OR REPLACE FUNCTION public.notify_communication_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Build notification payload
  IF TG_OP = 'DELETE' THEN
    notification_payload := jsonb_build_object(
      'operation', 'DELETE',
      'table', 'communications',
      'id', OLD.id,
      'lead_id', OLD.lead_id,
      'client_id', OLD.client_id,
      'old_record', row_to_json(OLD)
    );
  ELSE
    notification_payload := jsonb_build_object(
      'operation', TG_OP,
      'table', 'communications',
      'id', COALESCE(NEW.id, OLD.id),
      'lead_id', COALESCE(NEW.lead_id, OLD.lead_id),
      'client_id', COALESCE(NEW.client_id, OLD.client_id),
      'new_record', CASE WHEN NEW IS NOT NULL THEN row_to_json(NEW) ELSE NULL END,
      'old_record', CASE WHEN OLD IS NOT NULL THEN row_to_json(OLD) ELSE NULL END
    );
  END IF;
  
  -- Send to general communications channel
  PERFORM pg_notify('communications_changes', notification_payload::TEXT);
  
  -- Send to lead-specific channel
  IF COALESCE(NEW.lead_id, OLD.lead_id) IS NOT NULL THEN
    channel_name := 'lead_' || COALESCE(NEW.lead_id, OLD.lead_id)::TEXT || '_communications';
    PERFORM pg_notify(channel_name, notification_payload::TEXT);
  END IF;
  
  -- Send to client-specific channel
  IF COALESCE(NEW.client_id, OLD.client_id) IS NOT NULL THEN
    channel_name := 'client_' || COALESCE(NEW.client_id, OLD.client_id)::TEXT || '_communications';
    PERFORM pg_notify(channel_name, notification_payload::TEXT);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send real-time notifications for quote changes
CREATE OR REPLACE FUNCTION public.notify_quote_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Build notification payload
  IF TG_OP = 'DELETE' THEN
    notification_payload := jsonb_build_object(
      'operation', 'DELETE',
      'table', 'quotes',
      'id', OLD.id,
      'lead_id', OLD.lead_id,
      'old_record', row_to_json(OLD)
    );
  ELSE
    notification_payload := jsonb_build_object(
      'operation', TG_OP,
      'table', 'quotes',
      'id', COALESCE(NEW.id, OLD.id),
      'lead_id', COALESCE(NEW.lead_id, OLD.lead_id),
      'new_record', CASE WHEN NEW IS NOT NULL THEN row_to_json(NEW) ELSE NULL END,
      'old_record', CASE WHEN OLD IS NOT NULL THEN row_to_json(OLD) ELSE NULL END
    );
  END IF;
  
  -- Send to general quotes channel
  PERFORM pg_notify('quotes_changes', notification_payload::TEXT);
  
  -- Send to lead-specific channel
  IF COALESCE(NEW.lead_id, OLD.lead_id) IS NOT NULL THEN
    channel_name := 'lead_' || COALESCE(NEW.lead_id, OLD.lead_id)::TEXT || '_quotes';
    PERFORM pg_notify(channel_name, notification_payload::TEXT);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send real-time notifications for AI interactions
CREATE OR REPLACE FUNCTION public.notify_ai_interaction_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Only notify on INSERT and UPDATE for AI interactions
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  -- Build notification payload
  notification_payload := jsonb_build_object(
    'operation', TG_OP,
    'table', 'ai_interactions',
    'id', NEW.id,
    'agent_id', NEW.agent_id,
    'lead_id', NEW.lead_id,
    'client_id', NEW.client_id,
    'user_id', NEW.user_id,
    'type', NEW.type,
    'summary', NEW.summary
  );
  
  -- Send to general AI interactions channel
  PERFORM pg_notify('ai_interactions_changes', notification_payload::TEXT);
  
  -- Send to user-specific channel
  IF NEW.user_id IS NOT NULL THEN
    channel_name := 'user_' || NEW.user_id::TEXT || '_ai_interactions';
    PERFORM pg_notify(channel_name, notification_payload::TEXT);
  END IF;
  
  -- Send to lead-specific channel
  IF NEW.lead_id IS NOT NULL THEN
    channel_name := 'lead_' || NEW.lead_id::TEXT || '_ai_interactions';
    PERFORM pg_notify(channel_name, notification_payload::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send real-time notifications for call logs
CREATE OR REPLACE FUNCTION public.notify_call_log_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Build notification payload
  notification_payload := jsonb_build_object(
    'operation', TG_OP,
    'table', 'call_logs',
    'id', NEW.id,
    'user_id', NEW.user_id,
    'lead_id', NEW.lead_id,
    'client_id', NEW.client_id,
    'direction', NEW.direction,
    'status', NEW.status,
    'from_number', NEW.from_number,
    'to_number', NEW.to_number,
    'duration', NEW.duration
  );
  
  -- Send to general call logs channel
  PERFORM pg_notify('call_logs_changes', notification_payload::TEXT);
  
  -- Send to user-specific channel
  IF NEW.user_id IS NOT NULL THEN
    channel_name := 'user_' || NEW.user_id::TEXT || '_calls';
    PERFORM pg_notify(channel_name, notification_payload::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CREATE TRIGGERS FOR REAL-TIME NOTIFICATIONS
-- =============================================================================

-- Triggers for leads table
CREATE TRIGGER notify_leads_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_lead_change();

-- Triggers for communications table
CREATE TRIGGER notify_communications_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.notify_communication_change();

-- Triggers for quotes table
CREATE TRIGGER notify_quotes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.notify_quote_change();

-- Triggers for AI interactions table
CREATE TRIGGER notify_ai_interactions_changes
  AFTER INSERT OR UPDATE ON public.ai_interactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_ai_interaction_change();

-- Triggers for call logs table
CREATE TRIGGER notify_call_logs_changes
  AFTER INSERT OR UPDATE ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_call_log_change();

-- =============================================================================
-- REAL-TIME HELPER FUNCTIONS
-- =============================================================================

-- Function to subscribe to user-specific channels
CREATE OR REPLACE FUNCTION public.subscribe_to_user_channels(user_id_param UUID)
RETURNS TEXT[] AS $$
DECLARE
  channels TEXT[];
BEGIN
  -- Build array of channels for the user
  channels := ARRAY[
    'user_' || user_id_param::TEXT || '_leads',
    'user_' || user_id_param::TEXT || '_ai_interactions',
    'user_' || user_id_param::TEXT || '_calls'
  ];
  
  RETURN channels;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time channels for a lead
CREATE OR REPLACE FUNCTION public.get_lead_channels(lead_id_param UUID)
RETURNS TEXT[] AS $$
DECLARE
  channels TEXT[];
  lead_record RECORD;
BEGIN
  -- Get lead details
  SELECT * INTO lead_record FROM public.leads WHERE id = lead_id_param;
  
  IF lead_record IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Build array of channels for the lead
  channels := ARRAY[
    'lead_' || lead_id_param::TEXT || '_communications',
    'lead_' || lead_id_param::TEXT || '_quotes',
    'lead_' || lead_id_param::TEXT || '_ai_interactions'
  ];
  
  -- Add pipeline-specific channel
  IF lead_record.pipeline_id IS NOT NULL THEN
    channels := channels || ('pipeline_' || lead_record.pipeline_id::TEXT || '_leads');
  END IF;
  
  RETURN channels;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast system-wide notifications
CREATE OR REPLACE FUNCTION public.broadcast_system_notification(
  message TEXT,
  notification_type TEXT DEFAULT 'info',
  target_roles TEXT[] DEFAULT ARRAY['admin', 'manager', 'agent', 'user']
)
RETURNS VOID AS $$
DECLARE
  notification_payload JSONB;
BEGIN
  notification_payload := jsonb_build_object(
    'type', notification_type,
    'message', message,
    'target_roles', target_roles,
    'timestamp', NOW()
  );
  
  PERFORM pg_notify('system_notifications', notification_payload::TEXT);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- REAL-TIME PRESENCE FUNCTIONS
-- =============================================================================

-- Function to update user presence
CREATE OR REPLACE FUNCTION public.update_user_presence(
  status TEXT DEFAULT 'online',
  activity TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  presence_payload JSONB;
BEGIN
  -- Update user's last activity
  UPDATE public.users 
  SET 
    last_login_at = NOW(),
    metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
      'presence_status', status,
      'last_activity', activity,
      'last_seen', NOW()
    )
  WHERE id = auth.uid();
  
  -- Broadcast presence update
  presence_payload := jsonb_build_object(
    'user_id', auth.uid(),
    'status', status,
    'activity', activity,
    'timestamp', NOW()
  );
  
  PERFORM pg_notify('user_presence', presence_payload::TEXT);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- REAL-TIME DASHBOARD FUNCTIONS
-- =============================================================================

-- Function to get real-time dashboard data
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
  user_role TEXT;
BEGIN
  -- Get current user role
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  
  -- Build dashboard statistics
  stats := jsonb_build_object(
    'leads', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.leads WHERE 
        CASE 
          WHEN user_role IN ('admin', 'manager') THEN TRUE
          ELSE created_by = auth.uid() OR assigned_to = auth.uid()
        END),
      'new', (SELECT COUNT(*) FROM public.leads WHERE status = 'New' AND
        CASE 
          WHEN user_role IN ('admin', 'manager') THEN TRUE
          ELSE created_by = auth.uid() OR assigned_to = auth.uid()
        END),
      'qualified', (SELECT COUNT(*) FROM public.leads WHERE status = 'Qualified' AND
        CASE 
          WHEN user_role IN ('admin', 'manager') THEN TRUE
          ELSE created_by = auth.uid() OR assigned_to = auth.uid()
        END)
    ),
    'communications', jsonb_build_object(
      'today', (SELECT COUNT(*) FROM public.communications WHERE 
        DATE(created_at) = CURRENT_DATE AND
        CASE 
          WHEN user_role IN ('admin', 'manager') THEN TRUE
          ELSE created_by = auth.uid()
        END)
    ),
    'quotes', jsonb_build_object(
      'pending', (SELECT COUNT(*) FROM public.quotes WHERE status = 'Pending' AND
        EXISTS (SELECT 1 FROM public.leads l WHERE l.id = quotes.lead_id AND
          CASE 
            WHEN user_role IN ('admin', 'manager') THEN TRUE
            ELSE l.created_by = auth.uid() OR l.assigned_to = auth.uid()
          END))
    ),
    'timestamp', NOW()
  );
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.subscribe_to_user_channels(UUID) IS 'Get list of real-time channels for a specific user';
COMMENT ON FUNCTION public.get_lead_channels(UUID) IS 'Get list of real-time channels for a specific lead';
COMMENT ON FUNCTION public.broadcast_system_notification(TEXT, TEXT, TEXT[]) IS 'Broadcast system-wide notifications';
COMMENT ON FUNCTION public.update_user_presence(TEXT, TEXT) IS 'Update user presence status for real-time features';
COMMENT ON FUNCTION public.get_dashboard_stats() IS 'Get real-time dashboard statistics';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.subscribe_to_user_channels(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_channels(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.broadcast_system_notification(TEXT, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_presence(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
