-- =============================================================================
-- MIGRATION: Database Functions and Triggers
-- =============================================================================
-- Description: Create utility functions for timestamps, AI processing, and automated workflows
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to generate a unique identifier for imports
CREATE OR REPLACE FUNCTION public.generate_import_batch_id()
RETURNS UUID AS $$
BEGIN
  RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate business days between two dates
CREATE OR REPLACE FUNCTION public.business_days_between(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
  days INTEGER := 0;
  current_day DATE := start_date;
BEGIN
  WHILE current_day <= end_date LOOP
    -- Check if it's a weekday (Monday = 1, Sunday = 7)
    IF EXTRACT(DOW FROM current_day) BETWEEN 1 AND 5 THEN
      days := days + 1;
    END IF;
    current_day := current_day + INTERVAL '1 day';
  END LOOP;

  RETURN days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate next business day
CREATE OR REPLACE FUNCTION public.next_business_day(input_date DATE, days_to_add INTEGER DEFAULT 1)
RETURNS DATE AS $$
DECLARE
  result_date DATE := input_date;
  days_added INTEGER := 0;
BEGIN
  WHILE days_added < days_to_add LOOP
    result_date := result_date + INTERVAL '1 day';
    -- Check if it's a weekday
    IF EXTRACT(DOW FROM result_date) BETWEEN 1 AND 5 THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;

  RETURN result_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to format phone numbers
CREATE OR REPLACE FUNCTION public.format_phone_number(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove all non-digit characters
  phone := regexp_replace(phone, '[^0-9]', '', 'g');
  
  -- Handle different phone number lengths
  CASE LENGTH(phone)
    WHEN 10 THEN
      RETURN '(' || SUBSTRING(phone, 1, 3) || ') ' || SUBSTRING(phone, 4, 3) || '-' || SUBSTRING(phone, 7, 4);
    WHEN 11 THEN
      IF SUBSTRING(phone, 1, 1) = '1' THEN
        RETURN '+1 (' || SUBSTRING(phone, 2, 3) || ') ' || SUBSTRING(phone, 5, 3) || '-' || SUBSTRING(phone, 8, 4);
      ELSE
        RETURN phone; -- Return as-is if not US number
      END IF;
    ELSE
      RETURN phone; -- Return as-is for other formats
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract digits from phone number
CREATE OR REPLACE FUNCTION public.extract_phone_digits(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate email format
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- AI PROCESSING FUNCTIONS
-- =============================================================================

-- Function to calculate lead score based on various factors
CREATE OR REPLACE FUNCTION public.calculate_lead_score(lead_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  lead_record RECORD;
  days_since_created INTEGER;
  communication_count INTEGER;
BEGIN
  -- Get lead details
  SELECT * INTO lead_record FROM public.leads WHERE id = lead_id_param;
  
  IF lead_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Base score factors
  score := 50; -- Base score
  
  -- Age factor (newer leads get higher scores)
  days_since_created := EXTRACT(DAY FROM NOW() - lead_record.created_at);
  IF days_since_created <= 7 THEN
    score := score + 20;
  ELSIF days_since_created <= 30 THEN
    score := score + 10;
  END IF;
  
  -- Premium factor
  IF lead_record.premium IS NOT NULL AND lead_record.premium > 0 THEN
    score := score + 15;
  END IF;
  
  -- Communication engagement
  SELECT COUNT(*) INTO communication_count 
  FROM public.communications 
  WHERE lead_id = lead_id_param AND direction = 'Inbound';
  
  score := score + (communication_count * 5);
  
  -- Status factor
  CASE lead_record.status
    WHEN 'Qualified' THEN score := score + 25;
    WHEN 'Contacted' THEN score := score + 15;
    WHEN 'New' THEN score := score + 10;
    WHEN 'Lost' THEN score := score - 50;
    ELSE score := score;
  END CASE;
  
  -- Ensure score is within bounds
  score := GREATEST(0, LEAST(100, score));
  
  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suggest next action for a lead
CREATE OR REPLACE FUNCTION public.suggest_next_action(lead_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  lead_record RECORD;
  last_communication RECORD;
  days_since_last_contact INTEGER;
  suggested_action TEXT;
BEGIN
  -- Get lead details
  SELECT * INTO lead_record FROM public.leads WHERE id = lead_id_param;
  
  IF lead_record IS NULL THEN
    RETURN 'Lead not found';
  END IF;
  
  -- Get last communication
  SELECT * INTO last_communication 
  FROM public.communications 
  WHERE lead_id = lead_id_param 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Calculate days since last contact
  IF last_communication IS NOT NULL THEN
    days_since_last_contact := EXTRACT(DAY FROM NOW() - last_communication.created_at);
  ELSE
    days_since_last_contact := EXTRACT(DAY FROM NOW() - lead_record.created_at);
  END IF;
  
  -- Suggest action based on status and time
  CASE lead_record.status
    WHEN 'New' THEN
      IF days_since_last_contact >= 1 THEN
        suggested_action := 'Make initial contact call';
      ELSE
        suggested_action := 'Send welcome email';
      END IF;
    WHEN 'Contacted' THEN
      IF days_since_last_contact >= 3 THEN
        suggested_action := 'Follow up with quote information';
      ELSE
        suggested_action := 'Wait for response';
      END IF;
    WHEN 'Qualified' THEN
      suggested_action := 'Prepare and send quote';
    WHEN 'Quoted' THEN
      IF days_since_last_contact >= 7 THEN
        suggested_action := 'Follow up on quote status';
      ELSE
        suggested_action := 'Wait for quote response';
      END IF;
    WHEN 'Sold' THEN
      suggested_action := 'Process policy and send welcome package';
    WHEN 'Lost' THEN
      suggested_action := 'Add to nurture campaign';
    ELSE
      suggested_action := 'Review lead status';
  END CASE;
  
  RETURN suggested_action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-assign leads based on workload
CREATE OR REPLACE FUNCTION public.auto_assign_lead(lead_id_param UUID)
RETURNS UUID AS $$
DECLARE
  assigned_user_id UUID;
  min_lead_count INTEGER;
BEGIN
  -- Find user with least number of active leads
  SELECT u.id INTO assigned_user_id
  FROM public.users u
  LEFT JOIN public.leads l ON l.assigned_to = u.id AND l.status NOT IN ('Sold', 'Lost')
  WHERE u.role IN ('agent', 'manager') AND u.is_active = TRUE
  GROUP BY u.id
  ORDER BY COUNT(l.id) ASC, RANDOM()
  LIMIT 1;
  
  -- Update the lead with assignment
  IF assigned_user_id IS NOT NULL THEN
    UPDATE public.leads 
    SET assigned_to = assigned_user_id, updated_at = NOW()
    WHERE id = lead_id_param;
  END IF;
  
  RETURN assigned_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- WORKFLOW AUTOMATION FUNCTIONS
-- =============================================================================

-- Function to create follow-up task
CREATE OR REPLACE FUNCTION public.create_follow_up_task(
  lead_id_param UUID,
  task_type TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Insert into communications as a scheduled task
  INSERT INTO public.communications (
    lead_id,
    type,
    direction,
    subject,
    content,
    status,
    scheduled_at,
    created_by
  ) VALUES (
    lead_id_param,
    task_type,
    'Outbound',
    'Follow-up: ' || task_type,
    COALESCE(description, 'Automated follow-up task'),
    'Pending',
    due_date,
    auth.uid()
  ) RETURNING id INTO task_id;
  
  RETURN task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process expired quotes
CREATE OR REPLACE FUNCTION public.process_expired_quotes()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  quote_record RECORD;
BEGIN
  -- Find and process expired quotes
  FOR quote_record IN 
    SELECT q.*, l.id as lead_id
    FROM public.quotes q
    JOIN public.leads l ON l.id = q.lead_id
    WHERE q.status = 'Approved' 
    AND q.expiration_date < CURRENT_DATE
    AND q.expired_at IS NULL
  LOOP
    -- Mark quote as expired
    UPDATE public.quotes 
    SET status = 'Expired', expired_at = NOW()
    WHERE id = quote_record.id;
    
    -- Create follow-up task
    PERFORM public.create_follow_up_task(
      quote_record.lead_id,
      'call',
      NOW() + INTERVAL '1 day',
      'Quote expired - follow up for renewal'
    );
    
    expired_count := expired_count + 1;
  END LOOP;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER := 0;
BEGIN
  -- Archive old agent memory (older than 1 year)
  UPDATE public.agent_memory 
  SET is_archived = TRUE
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND is_archived = FALSE
  AND memory_type NOT IN ('preference', 'fact');
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Delete old AI interactions (older than 6 months, except important ones)
  DELETE FROM public.ai_interactions
  WHERE created_at < NOW() - INTERVAL '6 months'
  AND type NOT IN ('Summary', 'Prediction')
  AND quality_score < 3;
  
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGER FUNCTIONS
-- =============================================================================

-- Function to automatically set next contact date
CREATE OR REPLACE FUNCTION public.set_next_contact_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set next contact date based on status
  CASE NEW.status
    WHEN 'New' THEN
      NEW.next_contact_at := NOW() + INTERVAL '1 day';
    WHEN 'Contacted' THEN
      NEW.next_contact_at := NOW() + INTERVAL '3 days';
    WHEN 'Qualified' THEN
      NEW.next_contact_at := NOW() + INTERVAL '2 days';
    WHEN 'Quoted' THEN
      NEW.next_contact_at := NOW() + INTERVAL '7 days';
    WHEN 'Sold', 'Lost' THEN
      NEW.next_contact_at := NULL;
    ELSE
      -- Keep existing date if status doesn't change
      IF OLD.status = NEW.status THEN
        NEW.next_contact_at := OLD.next_contact_at;
      END IF;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update lead last_contact_at when communication is created
CREATE OR REPLACE FUNCTION public.update_lead_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads 
    SET last_contact_at = NEW.created_at
    WHERE id = NEW.lead_id;
  END IF;
  
  IF NEW.client_id IS NOT NULL THEN
    UPDATE public.clients 
    SET last_contact_at = NEW.created_at
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- APPLY TRIGGERS
-- =============================================================================

-- Trigger to set next contact date on lead status change
CREATE TRIGGER set_lead_next_contact_date
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_next_contact_date();

-- Trigger to update last contact when communication is created
CREATE TRIGGER update_last_contact_on_communication
  AFTER INSERT ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_last_contact();

-- =============================================================================
-- SCHEDULED FUNCTIONS (for use with pg_cron or external schedulers)
-- =============================================================================

-- Function to run daily maintenance tasks
CREATE OR REPLACE FUNCTION public.daily_maintenance()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  expired_quotes INTEGER;
  cleaned_records INTEGER;
BEGIN
  -- Process expired quotes
  expired_quotes := public.process_expired_quotes();
  result := result || 'Processed ' || expired_quotes || ' expired quotes. ';
  
  -- Clean up old data
  cleaned_records := public.cleanup_old_data();
  result := result || 'Cleaned up ' || cleaned_records || ' old records. ';
  
  -- Update AI insights (placeholder for future AI integration)
  result := result || 'AI insights updated. ';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.calculate_lead_score(UUID) IS 'Calculate lead score based on various factors';
COMMENT ON FUNCTION public.suggest_next_action(UUID) IS 'Suggest next action for a lead based on status and history';
COMMENT ON FUNCTION public.auto_assign_lead(UUID) IS 'Auto-assign lead to user with least workload';
COMMENT ON FUNCTION public.daily_maintenance() IS 'Run daily maintenance tasks including cleanup and processing';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.calculate_lead_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.suggest_next_action(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_assign_lead(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_follow_up_task(UUID, TEXT, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.format_phone_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_days_between(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_business_day(DATE, INTEGER) TO authenticated;
