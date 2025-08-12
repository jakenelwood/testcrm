

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE OR REPLACE FUNCTION "public"."address_distance_miles"("lat1" numeric, "lng1" numeric, "lat2" numeric, "lng2" numeric) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN (
    3959 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$;


ALTER FUNCTION "public"."address_distance_miles"("lat1" numeric, "lng1" numeric, "lat2" numeric, "lng2" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."addresses_within_radius"("center_lat" numeric, "center_lng" numeric, "radius_miles" numeric DEFAULT 10) RETURNS TABLE("id" "uuid", "formatted_address" "text", "distance_miles" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.formatted_address,
    public.address_distance_miles(center_lat, center_lng, a.geocode_lat, a.geocode_lng) as distance_miles
  FROM public.addresses a
  WHERE a.geocode_lat IS NOT NULL 
    AND a.geocode_lng IS NOT NULL
    AND public.address_distance_miles(center_lat, center_lng, a.geocode_lat, a.geocode_lng) <= radius_miles
  ORDER BY distance_miles;
END;
$$;


ALTER FUNCTION "public"."addresses_within_radius"("center_lat" numeric, "center_lng" numeric, "radius_miles" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_lead"("lead_id_param" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."auto_assign_lead"("lead_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_assign_lead"("lead_id_param" "uuid") IS 'Auto-assign lead to user with least workload';



CREATE OR REPLACE FUNCTION "public"."broadcast_system_notification"("message" "text", "notification_type" "text" DEFAULT 'info'::"text", "target_roles" "text"[] DEFAULT ARRAY['admin'::"text", 'manager'::"text", 'agent'::"text", 'user'::"text"]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."broadcast_system_notification"("message" "text", "notification_type" "text", "target_roles" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."broadcast_system_notification"("message" "text", "notification_type" "text", "target_roles" "text"[]) IS 'Broadcast system-wide notifications';



CREATE OR REPLACE FUNCTION "public"."business_days_between"("start_date" "date", "end_date" "date") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."business_days_between"("start_date" "date", "end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_lead_score"("lead_id_param" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_lead_score"("lead_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_lead_score"("lead_id_param" "uuid") IS 'Calculate lead score based on various factors';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_data"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."cleanup_old_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_communication_from_call"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_communication_from_call"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_follow_up_task"("lead_id_param" "uuid", "task_type" "text", "due_date" timestamp with time zone, "description" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_follow_up_task"("lead_id_param" "uuid", "task_type" "text", "due_date" timestamp with time zone, "description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_org_on_signup"("p_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_org uuid;
  v_pipe uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.organizations(name) values (p_name)
  returning id into v_org;

  insert into public.organization_members(org_id, user_id, role)
  values (v_org, auth.uid(), 'owner');

  insert into public.pipelines(id, org_id, name, created_by)
  values (uuid_generate_v4(), v_org, 'Sales', auth.uid())
  returning id into v_pipe;

  insert into public.pipeline_stages(id, org_id, pipeline_id, name, position)
  values
    (uuid_generate_v4(), v_org, v_pipe, 'New',   100),
    (uuid_generate_v4(), v_org, v_pipe, 'Active',200),
    (uuid_generate_v4(), v_org, v_pipe, 'Quote', 300),
    (uuid_generate_v4(), v_org, v_pipe, 'Closed',400);

  return v_org;
end $$;


ALTER FUNCTION "public"."create_org_on_signup"("p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_pipeline_with_stages"("p_org_id" "uuid", "p_name" "text", "p_stage_names" "text"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_pipe uuid;
  i int;
begin
  -- Caller must be a member of the org
  if not public.is_member(p_org_id) then
    raise exception 'Forbidden';
  end if;

  insert into public.pipelines(id, org_id, name, created_by)
  values (uuid_generate_v4(), p_org_id, p_name, auth.uid())
  returning id into v_pipe;

  -- Insert stages with 100-step positions so you can insert between later
  for i in 1 .. array_length(p_stage_names, 1) loop
    insert into public.pipeline_stages(id, org_id, pipeline_id, name, position)
    values (uuid_generate_v4(), p_org_id, v_pipe, p_stage_names[i], 100 * i);
  end loop;

  return v_pipe;
end $$;


ALTER FUNCTION "public"."create_pipeline_with_stages"("p_org_id" "uuid", "p_name" "text", "p_stage_names" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_has_role"("required_role" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.user_has_role(auth.uid(), required_role);
END;
$$;


ALTER FUNCTION "public"."current_user_has_role"("required_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."daily_maintenance"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."daily_maintenance"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."daily_maintenance"() IS 'Run daily maintenance tasks including cleanup and processing';



CREATE OR REPLACE FUNCTION "public"."ensure_single_default_phone"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."ensure_single_default_phone"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_single_default_pipeline"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."ensure_single_default_pipeline"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."extract_phone_digits"("phone" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g');
END;
$$;


ALTER FUNCTION "public"."extract_phone_digits"("phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."format_address"("street" "text" DEFAULT NULL::"text", "street2" "text" DEFAULT NULL::"text", "city" "text" DEFAULT NULL::"text", "state" "text" DEFAULT NULL::"text", "zip_code" "text" DEFAULT NULL::"text", "country" "text" DEFAULT 'US'::"text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN TRIM(
    CONCAT_WS(', ',
      NULLIF(TRIM(CONCAT_WS(' ', street, street2)), ''),
      NULLIF(TRIM(city), ''),
      NULLIF(TRIM(CONCAT_WS(' ', state, zip_code)), ''),
      CASE WHEN country != 'US' THEN NULLIF(TRIM(country), '') ELSE NULL END
    )
  );
END;
$$;


ALTER FUNCTION "public"."format_address"("street" "text", "street2" "text", "city" "text", "state" "text", "zip_code" "text", "country" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."format_phone_number"("phone" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."format_phone_number"("phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_import_batch_id"() RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN uuid_generate_v4();
END;
$$;


ALTER FUNCTION "public"."generate_import_batch_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_dashboard_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats"() IS 'Get real-time dashboard statistics';



CREATE OR REPLACE FUNCTION "public"."get_default_pipeline"("lead_type_param" "text" DEFAULT 'Personal'::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT id FROM public.pipelines 
    WHERE lead_type IN (lead_type_param, 'Both') 
    AND is_default = TRUE 
    AND is_active = TRUE
    LIMIT 1
  );
END;
$$;


ALTER FUNCTION "public"."get_default_pipeline"("lead_type_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_first_pipeline_status"("pipeline_id_param" integer) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT id FROM public.pipeline_statuses 
    WHERE pipeline_id = pipeline_id_param 
    AND is_active = TRUE
    ORDER BY display_order ASC
    LIMIT 1
  );
END;
$$;


ALTER FUNCTION "public"."get_first_pipeline_status"("pipeline_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lead_channels"("lead_id_param" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_lead_channels"("lead_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_lead_channels"("lead_id_param" "uuid") IS 'Get list of real-time channels for a specific lead';



CREATE OR REPLACE FUNCTION "public"."get_user_accessible_client_ids"() RETURNS "uuid"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN ARRAY(
    SELECT c.id 
    FROM public.clients c
    WHERE c.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.leads l 
            WHERE l.client_id = c.id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
          ) OR
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
          )
  );
END;
$$;


ALTER FUNCTION "public"."get_user_accessible_client_ids"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_accessible_client_ids"() IS 'Get array of client IDs accessible to current user';



CREATE OR REPLACE FUNCTION "public"."get_user_accessible_lead_ids"() RETURNS "uuid"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN ARRAY(
    SELECT l.id 
    FROM public.leads l
    WHERE l.created_by = auth.uid() OR
          l.assigned_to = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
          )
  );
END;
$$;


ALTER FUNCTION "public"."get_user_accessible_lead_ids"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_accessible_lead_ids"() IS 'Get array of lead IDs accessible to current user';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_template_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.content_template_id IS NOT NULL THEN
    UPDATE public.content_templates
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.content_template_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_template_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member"("p_org" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_member"("p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_valid_email"("email" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$_$;


ALTER FUNCTION "public"."is_valid_email"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_sensitive_data_access"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Log access to sensitive tables for compliance
  INSERT INTO public.ai_interactions (
    type,
    source,
    content,
    user_id,
    metadata,
    created_at
  ) VALUES (
    'Data Access',
    'RLS Policy',
    'Accessed ' || TG_TABLE_NAME || ' record: ' || NEW.id::TEXT,
    auth.uid(),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', NEW.id
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_sensitive_data_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_card"("p_card_id" "uuid", "p_to_stage_id" "uuid", "p_after_card_id" "uuid" DEFAULT NULL::"uuid", "p_before_card_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_org uuid;
  v_min numeric(20,4);
  v_max numeric(20,4);
  v_after numeric(20,4);
  v_before numeric(20,4);
  v_new numeric(20,4);
begin
  -- Authorization: caller must be member of the target stage's org
  select s.org_id into v_org from public.pipeline_stages s where s.id = p_to_stage_id;
  if not public.is_member(v_org) then
    raise exception 'Forbidden';
  end if;

  -- Compute neighbor orders
  if p_after_card_id is not null then
    select c."order" into v_after from public.cards c where c.id = p_after_card_id and c.stage_id = p_to_stage_id;
  end if;
  if p_before_card_id is not null then
    select c."order" into v_before from public.cards c where c.id = p_before_card_id and c.stage_id = p_to_stage_id;
  end if;

  if v_after is null and v_before is null then
    -- empty stage: start at 100
    v_new := 100;
  elsif v_after is null then
    -- insert at head: half of min
    select min("order") into v_min from public.cards where stage_id = p_to_stage_id;
    v_new := coalesce(v_before, v_min) - 50;
  elsif v_before is null then
    -- insert at tail: max + 100
    select max("order") into v_max from public.cards where stage_id = p_to_stage_id;
    v_new := greatest(coalesce(v_after, v_max), 0) + 100;
  else
    -- between
    v_new := (v_after + v_before) / 2.0;
  end if;

  -- Move the card
  update public.cards c
  set stage_id = p_to_stage_id,
      "order"  = v_new,
      updated_at = now(),
      last_touch_at = now()
  where c.id = p_card_id
  returning org_id into v_org;

  -- Final auth check (in case card belonged to a different org)
  if not public.is_member(v_org) then
    raise exception 'Forbidden';
  end if;
end $$;


ALTER FUNCTION "public"."move_card"("p_card_id" "uuid", "p_to_stage_id" "uuid", "p_after_card_id" "uuid", "p_before_card_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_business_day"("input_date" "date", "days_to_add" integer DEFAULT 1) RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."next_business_day"("input_date" "date", "days_to_add" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_ai_interaction_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_ai_interaction_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_call_log_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_call_log_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_communication_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_communication_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_lead_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_lead_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_quote_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_quote_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_expired_quotes"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."process_expired_quotes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."repack_stage"("p_stage_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.pipeline_stages where id = p_stage_id;
  if not public.is_member(v_org) then raise exception 'Forbidden'; end if;

  with s as (
    select id, row_number() over (order by "order") as rn
    from public.cards where stage_id = p_stage_id
  )
  update public.cards c
  set "order" = 100 * s.rn,
      updated_at = now()
  from s where c.id = s.id;
end $$;


ALTER FUNCTION "public"."repack_stage"("p_stage_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_agent_memory"("agent_id_param" "uuid", "query_embedding" "public"."vector", "entity_type_param" "text" DEFAULT NULL::"text", "entity_id_param" "uuid" DEFAULT NULL::"uuid", "limit_param" integer DEFAULT 10, "similarity_threshold" numeric DEFAULT 0.7) RETURNS TABLE("id" "uuid", "title" "text", "content" "text", "similarity" numeric, "memory_type" "text", "importance_score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.content,
    (1 - (m.embedding <=> query_embedding))::DECIMAL as similarity,
    m.memory_type,
    m.importance_score
  FROM public.agent_memory m
  WHERE m.agent_id = agent_id_param
    AND m.is_archived = FALSE
    AND (entity_type_param IS NULL OR m.entity_type = entity_type_param)
    AND (entity_id_param IS NULL OR m.entity_id = entity_id_param)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND (1 - (m.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY similarity DESC, m.importance_score DESC
  LIMIT limit_param;
END;
$$;


ALTER FUNCTION "public"."search_agent_memory"("agent_id_param" "uuid", "query_embedding" "public"."vector", "entity_type_param" "text", "entity_id_param" "uuid", "limit_param" integer, "similarity_threshold" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_address_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_address_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_next_contact_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."set_next_contact_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."subscribe_to_user_channels"("user_id_param" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."subscribe_to_user_channels"("user_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."subscribe_to_user_channels"("user_id_param" "uuid") IS 'Get list of real-time channels for a specific user';



CREATE OR REPLACE FUNCTION "public"."suggest_next_action"("lead_id_param" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."suggest_next_action"("lead_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."suggest_next_action"("lead_id_param" "uuid") IS 'Suggest next action for a lead based on status and history';



CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at = now(); return new; end $$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_lead_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."track_lead_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_memory_access"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.access_count = OLD.access_count + 1;
  NEW.last_accessed_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_memory_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_address_audit_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_address_audit_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_agent_performance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update agent statistics when interaction is completed
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE public.ai_agents
    SET
      total_interactions = total_interactions + 1,
      successful_interactions = CASE
        WHEN NEW.error_message IS NULL THEN successful_interactions + 1
        ELSE successful_interactions
      END,
      last_used_at = NEW.completed_at,
      updated_at = NOW()
    WHERE id = NEW.agent_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_agent_performance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_client_audit_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_client_audit_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_formatted_address"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.formatted_address = public.format_address(
    NEW.street, NEW.street2, NEW.city, NEW.state, NEW.zip_code, NEW.country
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_formatted_address"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lead_audit_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_lead_audit_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lead_last_contact"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_lead_last_contact"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_presence"("status" "text" DEFAULT 'online'::"text", "activity" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_user_presence"("status" "text", "activity" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_presence"("status" "text", "activity" "text") IS 'Update user presence status for real-time features';



CREATE OR REPLACE FUNCTION "public"."user_can_access_client"("client_id_param" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id_param
    AND (
      c.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.leads l 
        WHERE l.client_id = c.id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );
END;
$$;


ALTER FUNCTION "public"."user_can_access_client"("client_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_can_access_client"("client_id_param" "uuid") IS 'Check if current user can access a specific client';



CREATE OR REPLACE FUNCTION "public"."user_can_access_lead"("lead_id_param" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id_param
    AND (
      l.created_by = auth.uid() OR
      l.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );
END;
$$;


ALTER FUNCTION "public"."user_can_access_lead"("lead_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_can_access_lead"("lead_id_param" "uuid") IS 'Check if current user can access a specific lead';



CREATE OR REPLACE FUNCTION "public"."user_has_role"("user_id" "uuid", "required_role" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = required_role
  );
END;
$$;


ALTER FUNCTION "public"."user_has_role"("user_id" "uuid", "required_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_client_lead_relationship"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Ensure that if both client_id and lead_id are provided, they are related
  IF NEW.client_id IS NOT NULL AND NEW.lead_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = NEW.lead_id AND l.client_id = NEW.client_id
    ) THEN
      RAISE EXCEPTION 'Client and lead are not related';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_client_lead_relationship"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ab_tests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "campaign_id" "uuid",
    "test_type" "text" NOT NULL,
    "status" "text" DEFAULT 'Draft'::"text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "traffic_split" "jsonb" DEFAULT '{"variant_a": 50, "variant_b": 50}'::"jsonb",
    "sample_size" integer,
    "confidence_level" numeric(5,2) DEFAULT 95.0,
    "success_metric" "text" NOT NULL,
    "minimum_effect_size" numeric(5,2),
    "statistical_significance" numeric(5,2),
    "winner_variant" "text",
    "variants" "jsonb" DEFAULT '{}'::"jsonb",
    "results" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_recommendations" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ab_tests_status_check" CHECK (("status" = ANY (ARRAY['Draft'::"text", 'Running'::"text", 'Completed'::"text", 'Cancelled'::"text"]))),
    CONSTRAINT "ab_tests_test_type_check" CHECK (("test_type" = ANY (ARRAY['Subject Line'::"text", 'Content'::"text", 'Send Time'::"text", 'Call Script'::"text", 'Landing Page'::"text", 'Offer'::"text", 'CTA'::"text"])))
);


ALTER TABLE "public"."ab_tests" OWNER TO "postgres";


COMMENT ON TABLE "public"."ab_tests" IS 'A/B testing framework for campaign optimization';



CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "street" "text",
    "street2" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "country" "text" DEFAULT 'US'::"text",
    "type" "text",
    "is_verified" boolean DEFAULT false,
    "verification_source" "text",
    "verification_date" timestamp with time zone,
    "geocode_lat" numeric(10,8),
    "geocode_lng" numeric(11,8),
    "geocode_accuracy" "text",
    "geocode_source" "text",
    "geocode_date" timestamp with time zone,
    "formatted_address" "text",
    "plus_code" "text",
    "place_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "addresses_type_check" CHECK (("type" = ANY (ARRAY['Physical'::"text", 'Mailing'::"text", 'Business'::"text", 'Location'::"text", 'Billing'::"text", 'Shipping'::"text"])))
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


COMMENT ON TABLE "public"."addresses" IS 'Address management with geocoding and verification support';



COMMENT ON COLUMN "public"."addresses"."type" IS 'Address type: Physical, Mailing, Business, Location, Billing, or Shipping';



COMMENT ON COLUMN "public"."addresses"."is_verified" IS 'Whether the address has been verified against a postal service';



COMMENT ON COLUMN "public"."addresses"."geocode_lat" IS 'Latitude coordinate from geocoding service';



COMMENT ON COLUMN "public"."addresses"."geocode_lng" IS 'Longitude coordinate from geocoding service';



COMMENT ON COLUMN "public"."addresses"."formatted_address" IS 'Standardized formatted address string';



COMMENT ON COLUMN "public"."addresses"."metadata" IS 'Additional address metadata stored as JSONB';



CREATE TABLE IF NOT EXISTS "public"."agent_memory" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid",
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "memory_type" "text" NOT NULL,
    "importance_score" integer DEFAULT 5,
    "title" "text",
    "content" "text" NOT NULL,
    "summary" "text",
    "embedding" "public"."vector"(1536),
    "related_memories" "uuid"[] DEFAULT '{}'::"uuid"[],
    "conversation_id" "uuid",
    "session_id" "uuid",
    "access_count" integer DEFAULT 0,
    "last_accessed_at" timestamp with time zone,
    "confidence_score" numeric(5,2) DEFAULT 100.0,
    "expires_at" timestamp with time zone,
    "is_archived" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_memory_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (100)::numeric))),
    CONSTRAINT "agent_memory_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['client'::"text", 'lead'::"text", 'user'::"text", 'global'::"text", 'conversation'::"text", 'task'::"text"]))),
    CONSTRAINT "agent_memory_importance_score_check" CHECK ((("importance_score" >= 1) AND ("importance_score" <= 10))),
    CONSTRAINT "agent_memory_memory_type_check" CHECK (("memory_type" = ANY (ARRAY['conversation'::"text", 'insight'::"text", 'preference'::"text", 'fact'::"text", 'pattern'::"text", 'feedback'::"text"])))
);


ALTER TABLE "public"."agent_memory" OWNER TO "postgres";


COMMENT ON TABLE "public"."agent_memory" IS 'Agent memory storage with vector embeddings for semantic search';



CREATE TABLE IF NOT EXISTS "public"."ai_agents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "role" "text" NOT NULL,
    "agent_type" "text" DEFAULT 'assistant'::"text",
    "model_provider" "text" DEFAULT 'deepinfra'::"text",
    "model_name" "text" DEFAULT 'deepseek-ai/DeepSeek-V3-0324'::"text",
    "temperature" numeric(3,2) DEFAULT 0.7,
    "max_tokens" integer DEFAULT 4000,
    "capabilities" "jsonb" DEFAULT '{}'::"jsonb",
    "tools" "jsonb" DEFAULT '[]'::"jsonb",
    "system_prompt" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "total_interactions" integer DEFAULT 0,
    "successful_interactions" integer DEFAULT 0,
    "average_response_time" numeric(8,2),
    "last_performance_review" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "is_learning" boolean DEFAULT true,
    "version" "text" DEFAULT '1.0.0'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_used_at" timestamp with time zone,
    CONSTRAINT "ai_agents_agent_type_check" CHECK (("agent_type" = ANY (ARRAY['assistant'::"text", 'workflow'::"text", 'analyzer'::"text", 'generator'::"text"]))),
    CONSTRAINT "ai_agents_model_provider_check" CHECK (("model_provider" = ANY (ARRAY['openai'::"text", 'anthropic'::"text", 'deepinfra'::"text", 'local'::"text"]))),
    CONSTRAINT "ai_agents_role_check" CHECK (("role" = ANY (ARRAY['follow_up'::"text", 'insight'::"text", 'design'::"text", 'support'::"text", 'marketing'::"text", 'sales'::"text", 'analysis'::"text"]))),
    CONSTRAINT "ai_agents_temperature_check" CHECK ((("temperature" >= (0)::numeric) AND ("temperature" <= (2)::numeric)))
);


ALTER TABLE "public"."ai_agents" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_agents" IS 'Seeded with specialized AI agents for insurance operations';



CREATE TABLE IF NOT EXISTS "public"."ai_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid",
    "client_id" "uuid",
    "lead_id" "uuid",
    "user_id" "uuid",
    "type" "text",
    "source" "text",
    "prompt" "text",
    "content" "text",
    "ai_response" "text",
    "summary" "text",
    "model_used" "text",
    "model_provider" "text",
    "temperature" double precision,
    "tokens_used" integer,
    "response_time_ms" integer,
    "quality_score" numeric(3,2),
    "user_feedback" "text",
    "conversation_id" "uuid",
    "session_id" "uuid",
    "context" "jsonb" DEFAULT '{}'::"jsonb",
    "actions_taken" "jsonb" DEFAULT '[]'::"jsonb",
    "results" "jsonb" DEFAULT '{}'::"jsonb",
    "follow_up_required" boolean DEFAULT false,
    "follow_up_date" timestamp with time zone,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "ai_interactions_quality_score_check" CHECK ((("quality_score" >= (0)::numeric) AND ("quality_score" <= (5)::numeric))),
    CONSTRAINT "ai_interactions_source_check" CHECK (("source" = ANY (ARRAY['Agent UI'::"text", 'Marketing Automation'::"text", 'AI Assistant'::"text", 'Backend Middleware'::"text", 'API'::"text", 'Webhook'::"text"]))),
    CONSTRAINT "ai_interactions_type_check" CHECK (("type" = ANY (ARRAY['Chat'::"text", 'Follow-Up'::"text", 'Summary'::"text", 'Prediction'::"text", 'PromptResponse'::"text", 'Analysis'::"text", 'Recommendation'::"text"]))),
    CONSTRAINT "ai_interactions_user_feedback_check" CHECK (("user_feedback" = ANY (ARRAY['positive'::"text", 'negative'::"text", 'neutral'::"text"])))
);


ALTER TABLE "public"."ai_interactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_interactions" IS 'AI interaction logging with performance metrics and context';



CREATE TABLE IF NOT EXISTS "public"."call_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "client_id" "uuid",
    "lead_id" "uuid",
    "communication_id" "uuid",
    "ringcentral_call_id" "text",
    "session_id" "text",
    "direction" "text" NOT NULL,
    "from_number" "text" NOT NULL,
    "to_number" "text" NOT NULL,
    "status" "text",
    "result" "text",
    "start_time" timestamp with time zone,
    "answer_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "duration" integer,
    "recording_url" "text",
    "recording_id" "text",
    "transcription" "text",
    "transcription_confidence" numeric(5,2),
    "ai_summary" "text",
    "ai_sentiment" "text",
    "ai_action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_follow_up_required" boolean DEFAULT false,
    "quality_score" integer,
    "connection_quality" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "call_logs_ai_sentiment_check" CHECK (("ai_sentiment" = ANY (ARRAY['Positive'::"text", 'Neutral'::"text", 'Negative'::"text"]))),
    CONSTRAINT "call_logs_direction_check" CHECK (("direction" = ANY (ARRAY['Inbound'::"text", 'Outbound'::"text"]))),
    CONSTRAINT "call_logs_quality_score_check" CHECK ((("quality_score" >= 1) AND ("quality_score" <= 5))),
    CONSTRAINT "call_logs_result_check" CHECK (("result" = ANY (ARRAY['Call connected'::"text", 'Voicemail'::"text", 'Busy'::"text", 'No Answer'::"text", 'Rejected'::"text", 'Failed'::"text"]))),
    CONSTRAINT "call_logs_status_check" CHECK (("status" = ANY (ARRAY['Ringing'::"text", 'Connected'::"text", 'Disconnected'::"text", 'Busy'::"text", 'NoAnswer'::"text", 'Rejected'::"text", 'VoiceMail'::"text"])))
);


ALTER TABLE "public"."call_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."call_logs" IS 'Call logs from RingCentral with AI analysis and transcription';



CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "campaign_type" "text" NOT NULL,
    "status" "text" DEFAULT 'Draft'::"text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "budget" numeric(15,2),
    "target_audience" "jsonb" DEFAULT '{}'::"jsonb",
    "goals" "jsonb" DEFAULT '{}'::"jsonb",
    "success_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "audience_filters" "jsonb" DEFAULT '{}'::"jsonb",
    "geographic_targeting" "jsonb" DEFAULT '{}'::"jsonb",
    "demographic_targeting" "jsonb" DEFAULT '{}'::"jsonb",
    "total_sent" integer DEFAULT 0,
    "total_delivered" integer DEFAULT 0,
    "total_opened" integer DEFAULT 0,
    "total_clicked" integer DEFAULT 0,
    "total_converted" integer DEFAULT 0,
    "total_cost" numeric(15,2) DEFAULT 0,
    "ai_optimization_enabled" boolean DEFAULT false,
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_recommendations" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "campaigns_campaign_type_check" CHECK (("campaign_type" = ANY (ARRAY['Email'::"text", 'SMS'::"text", 'Phone'::"text", 'Social'::"text", 'Direct Mail'::"text", 'Digital Ads'::"text", 'Webinar'::"text", 'Event'::"text"]))),
    CONSTRAINT "campaigns_status_check" CHECK (("status" = ANY (ARRAY['Draft'::"text", 'Active'::"text", 'Paused'::"text", 'Completed'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


COMMENT ON TABLE "public"."campaigns" IS 'Marketing campaigns with performance tracking and AI optimization';



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone_number" "text",
    "address_id" "uuid",
    "mailing_address_id" "uuid",
    "date_of_birth" "text",
    "gender" "text",
    "marital_status" "text",
    "drivers_license" "text",
    "license_state" "text",
    "education_occupation" "text",
    "referred_by" "text",
    "business_type" "text",
    "industry" "text",
    "tax_id" "text",
    "year_established" "text",
    "annual_revenue" numeric(15,2),
    "number_of_employees" integer,
    "ai_summary" "text",
    "ai_next_action" "text",
    "ai_risk_score" integer,
    "ai_lifetime_value" numeric(15,2),
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "status" "text" DEFAULT 'Active'::"text",
    "source" "text" DEFAULT 'Manual Entry'::"text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_contact_at" timestamp with time zone,
    "next_contact_at" timestamp with time zone,
    "converted_from_lead_id" "uuid",
    CONSTRAINT "clients_ai_risk_score_check" CHECK ((("ai_risk_score" >= 0) AND ("ai_risk_score" <= 100))),
    CONSTRAINT "clients_client_type_check" CHECK (("client_type" = ANY (ARRAY['Individual'::"text", 'Business'::"text"]))),
    CONSTRAINT "clients_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Inactive'::"text", 'Prospect'::"text", 'Lost'::"text"])))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON TABLE "public"."clients" IS 'Client management for both individual and business clients with AI insights';



CREATE TABLE IF NOT EXISTS "public"."communications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "lead_id" "uuid",
    "campaign_id" "uuid",
    "ab_test_id" "uuid",
    "content_template_id" "uuid",
    "type" "text" NOT NULL,
    "direction" "text",
    "subject" "text",
    "content" "text",
    "attachments" "text"[] DEFAULT '{}'::"text"[],
    "status" "text" DEFAULT 'Pending'::"text",
    "outcome" "text",
    "duration" integer,
    "recording_url" "text",
    "call_quality_score" integer,
    "email_provider" "text",
    "tracking_pixel_url" "text",
    "unsubscribe_url" "text",
    "ai_summary" "text",
    "ai_sentiment" "text",
    "ai_entities" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_follow_up_suggestions" "jsonb" DEFAULT '[]'::"jsonb",
    "personalization_data" "jsonb" DEFAULT '{}'::"jsonb",
    "targeting_data" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "scheduled_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "replied_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "communications_ai_sentiment_check" CHECK (("ai_sentiment" = ANY (ARRAY['Positive'::"text", 'Neutral'::"text", 'Negative'::"text"]))),
    CONSTRAINT "communications_call_quality_score_check" CHECK ((("call_quality_score" >= 1) AND ("call_quality_score" <= 5))),
    CONSTRAINT "communications_direction_check" CHECK (("direction" = ANY (ARRAY['Inbound'::"text", 'Outbound'::"text"]))),
    CONSTRAINT "communications_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Sent'::"text", 'Delivered'::"text", 'Opened'::"text", 'Clicked'::"text", 'Replied'::"text", 'Failed'::"text", 'Bounced'::"text"]))),
    CONSTRAINT "communications_type_check" CHECK (("type" = ANY (ARRAY['call'::"text", 'email'::"text", 'sms'::"text", 'meeting'::"text", 'note'::"text", 'voicemail'::"text", 'social'::"text", 'letter'::"text"])))
);


ALTER TABLE "public"."communications" OWNER TO "postgres";


COMMENT ON TABLE "public"."communications" IS 'Communication tracking with AI analysis and sentiment detection';



CREATE TABLE IF NOT EXISTS "public"."content_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "template_type" "text" NOT NULL,
    "category" "text",
    "subject" "text",
    "content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '{}'::"jsonb",
    "personalization_fields" "text"[] DEFAULT '{}'::"text"[],
    "dynamic_content" "jsonb" DEFAULT '{}'::"jsonb",
    "usage_count" integer DEFAULT 0,
    "performance_score" numeric(5,2),
    "conversion_rate" numeric(5,2),
    "engagement_rate" numeric(5,2),
    "ai_optimized" boolean DEFAULT false,
    "ai_suggestions" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_performance_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_templates_template_type_check" CHECK (("template_type" = ANY (ARRAY['Email'::"text", 'SMS'::"text", 'Call Script'::"text", 'Social Post'::"text", 'Ad Copy'::"text", 'Letter'::"text", 'Proposal'::"text"])))
);


ALTER TABLE "public"."content_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_templates" IS 'Reusable content templates with personalization and performance tracking';



CREATE TABLE IF NOT EXISTS "public"."conversation_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid",
    "user_id" "uuid",
    "client_id" "uuid",
    "lead_id" "uuid",
    "title" "text",
    "purpose" "text",
    "status" "text" DEFAULT 'active'::"text",
    "total_interactions" integer DEFAULT 0,
    "total_tokens_used" integer DEFAULT 0,
    "average_response_time" numeric(8,2),
    "context" "jsonb" DEFAULT '{}'::"jsonb",
    "summary" "text",
    "goals_achieved" "jsonb" DEFAULT '[]'::"jsonb",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "next_steps" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "conversation_sessions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'paused'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."conversation_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_sessions" IS 'Conversation session management for multi-turn interactions';



CREATE TABLE IF NOT EXISTS "public"."customer_touchpoints" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "lead_id" "uuid",
    "campaign_id" "uuid",
    "ab_test_id" "uuid",
    "communication_id" "uuid",
    "touchpoint_type" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "source" "text",
    "medium" "text",
    "campaign" "text",
    "content" "text",
    "attribution_weight" numeric(5,4) DEFAULT 1.0,
    "attribution_model" "text" DEFAULT 'last_touch'::"text",
    "conversion_value" numeric(15,2),
    "page_url" "text",
    "referrer_url" "text",
    "user_agent" "text",
    "ip_address" "inet",
    "device_type" "text",
    "browser" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "occurred_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "customer_touchpoints_attribution_model_check" CHECK (("attribution_model" = ANY (ARRAY['first_touch'::"text", 'last_touch'::"text", 'linear'::"text", 'time_decay'::"text", 'position_based'::"text"]))),
    CONSTRAINT "customer_touchpoints_touchpoint_type_check" CHECK (("touchpoint_type" = ANY (ARRAY['Email Open'::"text", 'Email Click'::"text", 'SMS Click'::"text", 'Phone Call'::"text", 'Website Visit'::"text", 'Form Submit'::"text", 'Ad Click'::"text", 'Social Engagement'::"text", 'Download'::"text", 'Purchase'::"text"])))
);


ALTER TABLE "public"."customer_touchpoints" OWNER TO "postgres";


COMMENT ON TABLE "public"."customer_touchpoints" IS 'Customer interaction tracking for attribution and journey mapping';



CREATE TABLE IF NOT EXISTS "public"."homes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "lead_id" "uuid",
    "address_id" "uuid",
    "property_type" "text",
    "year_built" integer,
    "square_feet" integer,
    "lot_size" numeric(10,2),
    "bedrooms" integer,
    "bathrooms" numeric(3,1),
    "stories" integer,
    "construction_type" "text",
    "roof_type" "text",
    "roof_age" integer,
    "foundation_type" "text",
    "heating_type" "text",
    "cooling_type" "text",
    "purchase_price" numeric(15,2),
    "current_value" numeric(15,2),
    "mortgage_balance" numeric(15,2),
    "current_coverage" "jsonb" DEFAULT '{}'::"jsonb",
    "coverage_limits" "jsonb" DEFAULT '{}'::"jsonb",
    "deductibles" "jsonb" DEFAULT '{}'::"jsonb",
    "safety_features" "text"[] DEFAULT '{}'::"text"[],
    "security_features" "text"[] DEFAULT '{}'::"text"[],
    "distance_to_fire_station" numeric(5,2),
    "distance_to_coast" numeric(5,2),
    "flood_zone" "text",
    "wildfire_risk" "text",
    "earthquake_risk" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."homes" OWNER TO "postgres";


COMMENT ON TABLE "public"."homes" IS 'Property information for home insurance quotes';



CREATE TABLE IF NOT EXISTS "public"."insurance_types" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "is_personal" boolean DEFAULT true,
    "is_commercial" boolean DEFAULT false,
    "description" "text",
    "icon_name" "text",
    "form_schema" "jsonb" DEFAULT '{}'::"jsonb",
    "required_fields" "text"[] DEFAULT '{}'::"text"[],
    "optional_fields" "text"[] DEFAULT '{}'::"text"[],
    "ai_prompt_template" "text",
    "ai_risk_factors" "jsonb" DEFAULT '{}'::"jsonb",
    "display_order" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."insurance_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."insurance_types" IS 'Seeded with common personal and commercial insurance types';



CREATE SEQUENCE IF NOT EXISTS "public"."insurance_types_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."insurance_types_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."insurance_types_id_seq" OWNED BY "public"."insurance_types"."id";



CREATE TABLE IF NOT EXISTS "public"."lead_status_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "from_status" "text",
    "to_status" "text" NOT NULL,
    "from_pipeline_status_id" integer,
    "to_pipeline_status_id" integer,
    "reason" "text",
    "notes" "text",
    "automated" boolean DEFAULT false,
    "duration_in_previous_status" integer,
    "ai_trigger" "text",
    "ai_confidence" numeric(5,2),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lead_status_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."lead_status_history" IS 'Historical tracking of lead status changes';



CREATE TABLE IF NOT EXISTS "public"."lead_statuses" (
    "id" integer NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "is_final" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "display_order" integer,
    "color_hex" "text",
    "icon_name" "text",
    "badge_variant" "text" DEFAULT 'default'::"text",
    "ai_action_template" "text",
    "ai_follow_up_suggestions" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_next_steps" "jsonb" DEFAULT '[]'::"jsonb",
    "auto_actions" "jsonb" DEFAULT '{}'::"jsonb",
    "notification_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lead_statuses" OWNER TO "postgres";


COMMENT ON TABLE "public"."lead_statuses" IS 'Seeded with standard insurance sales process statuses';



CREATE SEQUENCE IF NOT EXISTS "public"."lead_statuses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lead_statuses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lead_statuses_id_seq" OWNED BY "public"."lead_statuses"."id";



CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "assigned_to" "uuid",
    "lead_type" "text" DEFAULT 'Personal'::"text",
    "priority" "text" DEFAULT 'Medium'::"text",
    "current_carrier" "text",
    "current_policy_expiry" "date",
    "premium" numeric(10,2),
    "auto_premium" numeric(10,2),
    "home_premium" numeric(10,2),
    "specialty_premium" numeric(10,2),
    "commercial_premium" numeric(10,2),
    "auto_data" "jsonb" DEFAULT '{}'::"jsonb",
    "auto_data_version" integer DEFAULT 1,
    "home_data" "jsonb" DEFAULT '{}'::"jsonb",
    "home_data_version" integer DEFAULT 1,
    "specialty_data" "jsonb" DEFAULT '{}'::"jsonb",
    "specialty_data_version" integer DEFAULT 1,
    "commercial_data" "jsonb" DEFAULT '{}'::"jsonb",
    "commercial_data_version" integer DEFAULT 1,
    "liability_data" "jsonb" DEFAULT '{}'::"jsonb",
    "liability_data_version" integer DEFAULT 1,
    "additional_insureds" "jsonb" DEFAULT '[]'::"jsonb",
    "additional_locations" "jsonb" DEFAULT '[]'::"jsonb",
    "drivers" "jsonb" DEFAULT '[]'::"jsonb",
    "vehicles" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_summary" "text",
    "ai_next_action" "text",
    "ai_quote_recommendation" "text",
    "ai_follow_up_priority" integer,
    "ai_conversion_probability" numeric(5,2),
    "ai_insights" "jsonb" DEFAULT '{}'::"jsonb",
    "campaign_id" "uuid",
    "ab_test_id" "uuid",
    "content_template_id" "uuid",
    "attribution_data" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "source" "text" DEFAULT 'Manual Entry'::"text",
    "import_file_name" "text",
    "import_batch_id" "uuid",
    "status" "text" DEFAULT 'New'::"text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status_changed_at" timestamp with time zone DEFAULT "now"(),
    "last_contact_at" timestamp with time zone,
    "next_contact_at" timestamp with time zone,
    "quote_generated_at" timestamp with time zone,
    "sold_at" timestamp with time zone,
    "lost_at" timestamp with time zone,
    "hibernated_at" timestamp with time zone,
    "pipeline_id" integer,
    "pipeline_status_id" integer,
    "insurance_type_id" integer,
    "lead_status_id" integer,
    CONSTRAINT "leads_ai_conversion_probability_check" CHECK ((("ai_conversion_probability" >= (0)::numeric) AND ("ai_conversion_probability" <= (100)::numeric))),
    CONSTRAINT "leads_ai_follow_up_priority_check" CHECK ((("ai_follow_up_priority" >= 1) AND ("ai_follow_up_priority" <= 10))),
    CONSTRAINT "leads_lead_type_check" CHECK (("lead_type" = ANY (ARRAY['Personal'::"text", 'Business'::"text"]))),
    CONSTRAINT "leads_priority_check" CHECK (("priority" = ANY (ARRAY['Low'::"text", 'Medium'::"text", 'High'::"text", 'Urgent'::"text"]))),
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['New'::"text", 'Contacted'::"text", 'Qualified'::"text", 'Quoted'::"text", 'Sold'::"text", 'Lost'::"text", 'Hibernated'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


COMMENT ON TABLE "public"."leads" IS 'Lead management with insurance-specific data and AI-powered insights';



CREATE TABLE IF NOT EXISTS "public"."pipeline_statuses" (
    "id" integer NOT NULL,
    "pipeline_id" integer,
    "name" "text" NOT NULL,
    "description" "text",
    "is_final" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "display_order" integer NOT NULL,
    "color_hex" "text",
    "icon_name" "text",
    "badge_variant" "text" DEFAULT 'default'::"text",
    "stage_type" "text" DEFAULT 'active'::"text",
    "required_fields" "text"[] DEFAULT '{}'::"text"[],
    "optional_fields" "text"[] DEFAULT '{}'::"text"[],
    "target_duration" integer,
    "max_duration" integer,
    "ai_action_template" "text",
    "ai_follow_up_suggestions" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_next_steps" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_exit_criteria" "jsonb" DEFAULT '{}'::"jsonb",
    "auto_actions" "jsonb" DEFAULT '{}'::"jsonb",
    "notification_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "escalation_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "conversion_probability" numeric(5,2),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pipeline_statuses_stage_type_check" CHECK (("stage_type" = ANY (ARRAY['active'::"text", 'waiting'::"text", 'final'::"text"])))
);


ALTER TABLE "public"."pipeline_statuses" OWNER TO "postgres";


COMMENT ON TABLE "public"."pipeline_statuses" IS 'Seeded with pipeline-specific status progressions';



CREATE SEQUENCE IF NOT EXISTS "public"."pipeline_statuses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pipeline_statuses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pipeline_statuses_id_seq" OWNED BY "public"."pipeline_statuses"."id";



CREATE TABLE IF NOT EXISTS "public"."pipelines" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "display_order" integer,
    "lead_type" "text" DEFAULT 'Personal'::"text",
    "insurance_types" integer[] DEFAULT '{}'::integer[],
    "conversion_goals" "jsonb" DEFAULT '{}'::"jsonb",
    "target_conversion_rate" numeric(5,2),
    "average_cycle_time" integer,
    "ai_optimization_enabled" boolean DEFAULT false,
    "ai_scoring_model" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_automation_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pipelines_lead_type_check" CHECK (("lead_type" = ANY (ARRAY['Personal'::"text", 'Business'::"text", 'Both'::"text"])))
);


ALTER TABLE "public"."pipelines" OWNER TO "postgres";


COMMENT ON TABLE "public"."pipelines" IS 'Seeded with standard insurance sales pipelines';



CREATE SEQUENCE IF NOT EXISTS "public"."pipelines_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pipelines_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pipelines_id_seq" OWNED BY "public"."pipelines"."id";



CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "insurance_type_id" integer,
    "carrier" "text" NOT NULL,
    "policy_number" "text",
    "quote_number" "text",
    "paid_in_full_amount" numeric(10,2),
    "monthly_payment_amount" numeric(10,2),
    "down_payment_amount" numeric(10,2),
    "contract_term" "text",
    "effective_date" "date",
    "expiration_date" "date",
    "coverage_details" "jsonb" DEFAULT '{}'::"jsonb",
    "limits" "jsonb" DEFAULT '{}'::"jsonb",
    "deductibles" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'Draft'::"text",
    "competitor_quotes" "jsonb" DEFAULT '[]'::"jsonb",
    "savings_amount" numeric(10,2),
    "savings_percentage" numeric(5,2),
    "ai_recommendation" "text",
    "ai_risk_assessment" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_pricing_factors" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "quote_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bound_at" timestamp with time zone,
    "expired_at" timestamp with time zone,
    CONSTRAINT "quotes_contract_term_check" CHECK (("contract_term" = ANY (ARRAY['6mo'::"text", '12mo'::"text", '24mo'::"text"]))),
    CONSTRAINT "quotes_status_check" CHECK (("status" = ANY (ARRAY['Draft'::"text", 'Pending'::"text", 'Approved'::"text", 'Declined'::"text", 'Expired'::"text", 'Bound'::"text"])))
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotes" IS 'Insurance quotes with pricing and coverage details';



CREATE TABLE IF NOT EXISTS "public"."ringcentral_tokens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "token_type" "text" DEFAULT 'Bearer'::"text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "refresh_token_expires_at" timestamp with time zone,
    "scope" "text",
    "granted_permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "account_id" "text",
    "extension_id" "text",
    "extension_number" "text",
    "is_active" boolean DEFAULT true,
    "last_validated_at" timestamp with time zone,
    "validation_error" "text",
    "api_calls_count" integer DEFAULT 0,
    "last_api_call_at" timestamp with time zone,
    "rate_limit_remaining" integer,
    "rate_limit_reset_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ringcentral_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."ringcentral_tokens" IS 'RingCentral OAuth tokens with encryption and expiration tracking';



CREATE TABLE IF NOT EXISTS "public"."schema_versions" (
    "id" integer NOT NULL,
    "version" "text" NOT NULL,
    "description" "text",
    "applied_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."schema_versions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."schema_versions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."schema_versions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."schema_versions_id_seq" OWNED BY "public"."schema_versions"."id";



CREATE TABLE IF NOT EXISTS "public"."sms_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "client_id" "uuid",
    "lead_id" "uuid",
    "communication_id" "uuid",
    "ringcentral_message_id" "text",
    "conversation_id" "text",
    "direction" "text" NOT NULL,
    "from_number" "text" NOT NULL,
    "to_number" "text" NOT NULL,
    "message_text" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text",
    "ai_summary" "text",
    "ai_sentiment" "text",
    "ai_intent" "text",
    "ai_action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sms_logs_ai_sentiment_check" CHECK (("ai_sentiment" = ANY (ARRAY['Positive'::"text", 'Neutral'::"text", 'Negative'::"text"]))),
    CONSTRAINT "sms_logs_direction_check" CHECK (("direction" = ANY (ARRAY['Inbound'::"text", 'Outbound'::"text"]))),
    CONSTRAINT "sms_logs_status_check" CHECK (("status" = ANY (ARRAY['Queued'::"text", 'Sent'::"text", 'Delivered'::"text", 'DeliveryFailed'::"text", 'SendingFailed'::"text", 'Received'::"text"])))
);


ALTER TABLE "public"."sms_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."sms_logs" IS 'SMS logs from RingCentral with AI analysis';



CREATE TABLE IF NOT EXISTS "public"."specialty_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "lead_id" "uuid",
    "name" "text" NOT NULL,
    "category" "text",
    "description" "text",
    "brand" "text",
    "model" "text",
    "serial_number" "text",
    "appraised_value" numeric(15,2),
    "purchase_price" numeric(15,2),
    "current_value" numeric(15,2),
    "appraisal_date" "date",
    "appraiser_name" "text",
    "coverage_type" "text",
    "coverage_limit" numeric(15,2),
    "deductible" numeric(10,2),
    "storage_location" "text",
    "security_measures" "text"[] DEFAULT '{}'::"text"[],
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "documents" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."specialty_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."specialty_items" IS 'High-value items requiring special coverage';



CREATE TABLE IF NOT EXISTS "public"."user_phone_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "selected_phone_number" "text" NOT NULL,
    "phone_number_label" "text",
    "phone_number_type" "text",
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "call_forwarding_enabled" boolean DEFAULT false,
    "call_forwarding_number" "text",
    "voicemail_enabled" boolean DEFAULT true,
    "call_recording_enabled" boolean DEFAULT false,
    "sms_notifications" boolean DEFAULT true,
    "email_notifications" boolean DEFAULT true,
    "desktop_notifications" boolean DEFAULT true,
    "business_hours" "jsonb" DEFAULT '{}'::"jsonb",
    "timezone" "text" DEFAULT 'America/Chicago'::"text",
    "auto_response_enabled" boolean DEFAULT false,
    "auto_response_message" "text",
    "out_of_office_enabled" boolean DEFAULT false,
    "out_of_office_message" "text",
    "crm_integration_enabled" boolean DEFAULT true,
    "auto_log_calls" boolean DEFAULT true,
    "auto_create_activities" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_phone_preferences_phone_number_type_check" CHECK (("phone_number_type" = ANY (ARRAY['Direct'::"text", 'Main'::"text", 'Toll-Free'::"text", 'Local'::"text"])))
);


ALTER TABLE "public"."user_phone_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_phone_preferences" IS 'User phone number preferences and call settings';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text",
    "phone_number" "text",
    "timezone" "text" DEFAULT 'America/Chicago'::"text",
    "date_format" "text" DEFAULT 'MM/DD/YYYY'::"text",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text", 'agent'::"text", 'manager'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'User profiles extending Supabase auth.users with role-based access control';



COMMENT ON COLUMN "public"."users"."role" IS 'User role: user, admin, agent, or manager';



COMMENT ON COLUMN "public"."users"."preferences" IS 'User preferences stored as JSONB';



COMMENT ON COLUMN "public"."users"."metadata" IS 'Additional user metadata stored as JSONB';



CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "lead_id" "uuid",
    "make" "text" NOT NULL,
    "model" "text" NOT NULL,
    "year" integer,
    "vin" "text",
    "license_plate" "text",
    "state" "text",
    "body_style" "text",
    "engine_size" "text",
    "fuel_type" "text",
    "transmission" "text",
    "color" "text",
    "primary_use" "text",
    "annual_mileage" integer,
    "garage_location" "text",
    "current_coverage" "jsonb" DEFAULT '{}'::"jsonb",
    "coverage_limits" "jsonb" DEFAULT '{}'::"jsonb",
    "deductibles" "jsonb" DEFAULT '{}'::"jsonb",
    "purchase_price" numeric(12,2),
    "current_value" numeric(12,2),
    "loan_balance" numeric(12,2),
    "safety_features" "text"[] DEFAULT '{}'::"text"[],
    "anti_theft_devices" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


COMMENT ON TABLE "public"."vehicles" IS 'Vehicle information for auto insurance quotes';



ALTER TABLE ONLY "public"."insurance_types" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."insurance_types_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lead_statuses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lead_statuses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pipeline_statuses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pipeline_statuses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pipelines" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pipelines_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."schema_versions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."schema_versions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ab_tests"
    ADD CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_memory"
    ADD CONSTRAINT "agent_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_logs"
    ADD CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_logs"
    ADD CONSTRAINT "call_logs_ringcentral_call_id_key" UNIQUE ("ringcentral_call_id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_templates"
    ADD CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_touchpoints"
    ADD CONSTRAINT "customer_touchpoints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homes"
    ADD CONSTRAINT "homes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_types"
    ADD CONSTRAINT "insurance_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."insurance_types"
    ADD CONSTRAINT "insurance_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_status_history"
    ADD CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_statuses"
    ADD CONSTRAINT "lead_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_statuses"
    ADD CONSTRAINT "lead_statuses_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_statuses"
    ADD CONSTRAINT "pipeline_statuses_pipeline_id_display_order_key" UNIQUE ("pipeline_id", "display_order");



ALTER TABLE ONLY "public"."pipeline_statuses"
    ADD CONSTRAINT "pipeline_statuses_pipeline_id_name_key" UNIQUE ("pipeline_id", "name");



ALTER TABLE ONLY "public"."pipeline_statuses"
    ADD CONSTRAINT "pipeline_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ringcentral_tokens"
    ADD CONSTRAINT "ringcentral_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ringcentral_tokens"
    ADD CONSTRAINT "ringcentral_tokens_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."schema_versions"
    ADD CONSTRAINT "schema_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schema_versions"
    ADD CONSTRAINT "schema_versions_version_key" UNIQUE ("version");



ALTER TABLE ONLY "public"."sms_logs"
    ADD CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_logs"
    ADD CONSTRAINT "sms_logs_ringcentral_message_id_key" UNIQUE ("ringcentral_message_id");



ALTER TABLE ONLY "public"."specialty_items"
    ADD CONSTRAINT "specialty_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_phone_preferences"
    ADD CONSTRAINT "user_phone_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_phone_preferences"
    ADD CONSTRAINT "user_phone_preferences_user_id_selected_phone_number_key" UNIQUE ("user_id", "selected_phone_number");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ab_tests_campaign_id" ON "public"."ab_tests" USING "btree" ("campaign_id");



CREATE INDEX "idx_ab_tests_results" ON "public"."ab_tests" USING "gin" ("results");



CREATE INDEX "idx_ab_tests_status" ON "public"."ab_tests" USING "btree" ("status");



CREATE INDEX "idx_ab_tests_test_type" ON "public"."ab_tests" USING "btree" ("test_type");



CREATE INDEX "idx_addresses_city_state" ON "public"."addresses" USING "btree" ("city", "state");



CREATE INDEX "idx_addresses_created_at" ON "public"."addresses" USING "btree" ("created_at");



CREATE INDEX "idx_addresses_created_by" ON "public"."addresses" USING "btree" ("created_by");



CREATE INDEX "idx_addresses_geocode" ON "public"."addresses" USING "btree" ("geocode_lat", "geocode_lng") WHERE (("geocode_lat" IS NOT NULL) AND ("geocode_lng" IS NOT NULL));



CREATE INDEX "idx_addresses_is_verified" ON "public"."addresses" USING "btree" ("is_verified");



CREATE INDEX "idx_addresses_metadata" ON "public"."addresses" USING "gin" ("metadata");



CREATE INDEX "idx_addresses_search" ON "public"."addresses" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((((((COALESCE("street", ''::"text") || ' '::"text") || COALESCE("street2", ''::"text")) || ' '::"text") || COALESCE("city", ''::"text")) || ' '::"text") || COALESCE("state", ''::"text")) || ' '::"text") || COALESCE("zip_code", ''::"text"))));



CREATE INDEX "idx_addresses_type" ON "public"."addresses" USING "btree" ("type");



CREATE INDEX "idx_addresses_zip_code" ON "public"."addresses" USING "btree" ("zip_code");



CREATE INDEX "idx_agent_memory_agent_id" ON "public"."agent_memory" USING "btree" ("agent_id");



CREATE INDEX "idx_agent_memory_content_search" ON "public"."agent_memory" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("content", ''::"text")) || ' '::"text") || COALESCE("summary", ''::"text"))));



CREATE INDEX "idx_agent_memory_created_at" ON "public"."agent_memory" USING "btree" ("created_at");



CREATE INDEX "idx_agent_memory_embedding" ON "public"."agent_memory" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_agent_memory_entity" ON "public"."agent_memory" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_agent_memory_expires_at" ON "public"."agent_memory" USING "btree" ("expires_at");



CREATE INDEX "idx_agent_memory_importance" ON "public"."agent_memory" USING "btree" ("importance_score");



CREATE INDEX "idx_agent_memory_is_archived" ON "public"."agent_memory" USING "btree" ("is_archived");



CREATE INDEX "idx_agent_memory_memory_type" ON "public"."agent_memory" USING "btree" ("memory_type");



CREATE INDEX "idx_agent_memory_metadata" ON "public"."agent_memory" USING "gin" ("metadata");



CREATE INDEX "idx_ai_agents_agent_type" ON "public"."ai_agents" USING "btree" ("agent_type");



CREATE INDEX "idx_ai_agents_capabilities" ON "public"."ai_agents" USING "gin" ("capabilities");



CREATE INDEX "idx_ai_agents_config" ON "public"."ai_agents" USING "gin" ("config");



CREATE INDEX "idx_ai_agents_created_by" ON "public"."ai_agents" USING "btree" ("created_by");



CREATE INDEX "idx_ai_agents_is_active" ON "public"."ai_agents" USING "btree" ("is_active");



CREATE INDEX "idx_ai_agents_last_used_at" ON "public"."ai_agents" USING "btree" ("last_used_at");



CREATE INDEX "idx_ai_agents_model_provider" ON "public"."ai_agents" USING "btree" ("model_provider");



CREATE INDEX "idx_ai_agents_role" ON "public"."ai_agents" USING "btree" ("role");



CREATE INDEX "idx_ai_interactions_agent_id" ON "public"."ai_interactions" USING "btree" ("agent_id");



CREATE INDEX "idx_ai_interactions_client_id" ON "public"."ai_interactions" USING "btree" ("client_id");



CREATE INDEX "idx_ai_interactions_content_search" ON "public"."ai_interactions" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((COALESCE("prompt", ''::"text") || ' '::"text") || COALESCE("ai_response", ''::"text")) || ' '::"text") || COALESCE("summary", ''::"text"))));



CREATE INDEX "idx_ai_interactions_context" ON "public"."ai_interactions" USING "gin" ("context");



CREATE INDEX "idx_ai_interactions_conversation_id" ON "public"."ai_interactions" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_interactions_created_at" ON "public"."ai_interactions" USING "btree" ("created_at");



CREATE INDEX "idx_ai_interactions_follow_up_date" ON "public"."ai_interactions" USING "btree" ("follow_up_date");



CREATE INDEX "idx_ai_interactions_follow_up_required" ON "public"."ai_interactions" USING "btree" ("follow_up_required");



CREATE INDEX "idx_ai_interactions_lead_id" ON "public"."ai_interactions" USING "btree" ("lead_id");



CREATE INDEX "idx_ai_interactions_results" ON "public"."ai_interactions" USING "gin" ("results");



CREATE INDEX "idx_ai_interactions_source" ON "public"."ai_interactions" USING "btree" ("source");



CREATE INDEX "idx_ai_interactions_type" ON "public"."ai_interactions" USING "btree" ("type");



CREATE INDEX "idx_ai_interactions_user_id" ON "public"."ai_interactions" USING "btree" ("user_id");



CREATE INDEX "idx_call_logs_client_id" ON "public"."call_logs" USING "btree" ("client_id");



CREATE INDEX "idx_call_logs_direction" ON "public"."call_logs" USING "btree" ("direction");



CREATE INDEX "idx_call_logs_from_number" ON "public"."call_logs" USING "btree" ("from_number");



CREATE INDEX "idx_call_logs_lead_id" ON "public"."call_logs" USING "btree" ("lead_id");



CREATE INDEX "idx_call_logs_metadata" ON "public"."call_logs" USING "gin" ("metadata");



CREATE INDEX "idx_call_logs_ringcentral_call_id" ON "public"."call_logs" USING "btree" ("ringcentral_call_id");



CREATE INDEX "idx_call_logs_start_time" ON "public"."call_logs" USING "btree" ("start_time");



CREATE INDEX "idx_call_logs_status" ON "public"."call_logs" USING "btree" ("status");



CREATE INDEX "idx_call_logs_to_number" ON "public"."call_logs" USING "btree" ("to_number");



CREATE INDEX "idx_call_logs_transcription_search" ON "public"."call_logs" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("transcription", ''::"text")));



CREATE INDEX "idx_call_logs_user_id" ON "public"."call_logs" USING "btree" ("user_id");



CREATE INDEX "idx_campaigns_created_by" ON "public"."campaigns" USING "btree" ("created_by");



CREATE INDEX "idx_campaigns_metadata" ON "public"."campaigns" USING "gin" ("metadata");



CREATE INDEX "idx_campaigns_name" ON "public"."campaigns" USING "btree" ("name");



CREATE INDEX "idx_campaigns_search" ON "public"."campaigns" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((COALESCE("name", ''::"text") || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_campaigns_start_date" ON "public"."campaigns" USING "btree" ("start_date");



CREATE INDEX "idx_campaigns_status" ON "public"."campaigns" USING "btree" ("status");



CREATE INDEX "idx_campaigns_type" ON "public"."campaigns" USING "btree" ("campaign_type");



CREATE INDEX "idx_clients_ai_insights" ON "public"."clients" USING "gin" ("ai_insights");



CREATE INDEX "idx_clients_created_at" ON "public"."clients" USING "btree" ("created_at");



CREATE INDEX "idx_clients_created_by" ON "public"."clients" USING "btree" ("created_by");



CREATE INDEX "idx_clients_email" ON "public"."clients" USING "btree" ("email");



CREATE INDEX "idx_clients_metadata" ON "public"."clients" USING "gin" ("metadata");



CREATE INDEX "idx_clients_phone" ON "public"."clients" USING "btree" ("phone_number");



CREATE INDEX "idx_clients_search" ON "public"."clients" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((((((COALESCE("name", ''::"text") || ' '::"text") || COALESCE("email", ''::"text")) || ' '::"text") || COALESCE("phone_number", ''::"text")) || ' '::"text") || COALESCE("business_type", ''::"text")) || ' '::"text") || COALESCE("industry", ''::"text"))));



CREATE INDEX "idx_clients_source" ON "public"."clients" USING "btree" ("source");



CREATE INDEX "idx_clients_status" ON "public"."clients" USING "btree" ("status");



CREATE INDEX "idx_clients_tags" ON "public"."clients" USING "gin" ("tags");



CREATE INDEX "idx_clients_type" ON "public"."clients" USING "btree" ("client_type");



CREATE INDEX "idx_communications_ai_entities" ON "public"."communications" USING "gin" ("ai_entities");



CREATE INDEX "idx_communications_campaign_id" ON "public"."communications" USING "btree" ("campaign_id");



CREATE INDEX "idx_communications_client_id" ON "public"."communications" USING "btree" ("client_id");



CREATE INDEX "idx_communications_client_lead_created_by" ON "public"."communications" USING "btree" ("client_id", "lead_id", "created_by");



CREATE INDEX "idx_communications_created_at" ON "public"."communications" USING "btree" ("created_at");



CREATE INDEX "idx_communications_direction" ON "public"."communications" USING "btree" ("direction");



CREATE INDEX "idx_communications_lead_id" ON "public"."communications" USING "btree" ("lead_id");



CREATE INDEX "idx_communications_scheduled_at" ON "public"."communications" USING "btree" ("scheduled_at");



CREATE INDEX "idx_communications_status" ON "public"."communications" USING "btree" ("status");



CREATE INDEX "idx_communications_type" ON "public"."communications" USING "btree" ("type");



CREATE INDEX "idx_content_templates_category" ON "public"."content_templates" USING "btree" ("category");



CREATE INDEX "idx_content_templates_is_active" ON "public"."content_templates" USING "btree" ("is_active");



CREATE INDEX "idx_content_templates_search" ON "public"."content_templates" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((COALESCE("name", ''::"text") || ' '::"text") || COALESCE("content", ''::"text"))));



CREATE INDEX "idx_content_templates_type" ON "public"."content_templates" USING "btree" ("template_type");



CREATE INDEX "idx_content_templates_usage_count" ON "public"."content_templates" USING "btree" ("usage_count");



CREATE INDEX "idx_content_templates_variables" ON "public"."content_templates" USING "gin" ("variables");



CREATE INDEX "idx_conversation_sessions_agent_id" ON "public"."conversation_sessions" USING "btree" ("agent_id");



CREATE INDEX "idx_conversation_sessions_client_id" ON "public"."conversation_sessions" USING "btree" ("client_id");



CREATE INDEX "idx_conversation_sessions_context" ON "public"."conversation_sessions" USING "gin" ("context");



CREATE INDEX "idx_conversation_sessions_created_at" ON "public"."conversation_sessions" USING "btree" ("created_at");



CREATE INDEX "idx_conversation_sessions_lead_id" ON "public"."conversation_sessions" USING "btree" ("lead_id");



CREATE INDEX "idx_conversation_sessions_status" ON "public"."conversation_sessions" USING "btree" ("status");



CREATE INDEX "idx_conversation_sessions_user_id" ON "public"."conversation_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_customer_touchpoints_campaign_id" ON "public"."customer_touchpoints" USING "btree" ("campaign_id");



CREATE INDEX "idx_customer_touchpoints_channel" ON "public"."customer_touchpoints" USING "btree" ("channel");



CREATE INDEX "idx_customer_touchpoints_client_id" ON "public"."customer_touchpoints" USING "btree" ("client_id");



CREATE INDEX "idx_customer_touchpoints_lead_id" ON "public"."customer_touchpoints" USING "btree" ("lead_id");



CREATE INDEX "idx_customer_touchpoints_metadata" ON "public"."customer_touchpoints" USING "gin" ("metadata");



CREATE INDEX "idx_customer_touchpoints_occurred_at" ON "public"."customer_touchpoints" USING "btree" ("occurred_at");



CREATE INDEX "idx_customer_touchpoints_type" ON "public"."customer_touchpoints" USING "btree" ("touchpoint_type");



CREATE INDEX "idx_homes_address_id" ON "public"."homes" USING "btree" ("address_id");



CREATE INDEX "idx_homes_client_id" ON "public"."homes" USING "btree" ("client_id");



CREATE INDEX "idx_homes_client_lead_created_by" ON "public"."homes" USING "btree" ("client_id", "lead_id", "created_by");



CREATE INDEX "idx_homes_created_at" ON "public"."homes" USING "btree" ("created_at");



CREATE INDEX "idx_homes_lead_id" ON "public"."homes" USING "btree" ("lead_id");



CREATE INDEX "idx_homes_metadata" ON "public"."homes" USING "gin" ("metadata");



CREATE INDEX "idx_homes_property_type" ON "public"."homes" USING "btree" ("property_type");



CREATE INDEX "idx_homes_year_built" ON "public"."homes" USING "btree" ("year_built");



CREATE INDEX "idx_insurance_types_display_order" ON "public"."insurance_types" USING "btree" ("display_order");



CREATE INDEX "idx_insurance_types_is_active" ON "public"."insurance_types" USING "btree" ("is_active");



CREATE INDEX "idx_insurance_types_name" ON "public"."insurance_types" USING "btree" ("name");



CREATE INDEX "idx_lead_status_history_automated" ON "public"."lead_status_history" USING "btree" ("automated");



CREATE INDEX "idx_lead_status_history_changed_at" ON "public"."lead_status_history" USING "btree" ("changed_at");



CREATE INDEX "idx_lead_status_history_changed_by" ON "public"."lead_status_history" USING "btree" ("changed_by");



CREATE INDEX "idx_lead_status_history_lead_id" ON "public"."lead_status_history" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_status_history_metadata" ON "public"."lead_status_history" USING "gin" ("metadata");



CREATE INDEX "idx_lead_status_history_to_status" ON "public"."lead_status_history" USING "btree" ("to_status");



CREATE INDEX "idx_lead_statuses_display_order" ON "public"."lead_statuses" USING "btree" ("display_order");



CREATE INDEX "idx_lead_statuses_is_active" ON "public"."lead_statuses" USING "btree" ("is_active");



CREATE INDEX "idx_lead_statuses_metadata" ON "public"."lead_statuses" USING "gin" ("metadata");



CREATE INDEX "idx_lead_statuses_value" ON "public"."lead_statuses" USING "btree" ("value");



CREATE INDEX "idx_leads_ai_insights" ON "public"."leads" USING "gin" ("ai_insights");



CREATE INDEX "idx_leads_assigned_to" ON "public"."leads" USING "btree" ("assigned_to");



CREATE INDEX "idx_leads_auto_data" ON "public"."leads" USING "gin" ("auto_data");



CREATE INDEX "idx_leads_client_id" ON "public"."leads" USING "btree" ("client_id");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at");



CREATE INDEX "idx_leads_created_by" ON "public"."leads" USING "btree" ("created_by");



CREATE INDEX "idx_leads_created_by_assigned_to" ON "public"."leads" USING "btree" ("created_by", "assigned_to");



CREATE INDEX "idx_leads_custom_fields" ON "public"."leads" USING "gin" ("custom_fields");



CREATE INDEX "idx_leads_home_data" ON "public"."leads" USING "gin" ("home_data");



CREATE INDEX "idx_leads_lead_type" ON "public"."leads" USING "btree" ("lead_type");



CREATE INDEX "idx_leads_metadata" ON "public"."leads" USING "gin" ("metadata");



CREATE INDEX "idx_leads_next_contact_at" ON "public"."leads" USING "btree" ("next_contact_at");



CREATE INDEX "idx_leads_priority" ON "public"."leads" USING "btree" ("priority");



CREATE INDEX "idx_leads_source" ON "public"."leads" USING "btree" ("source");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_leads_tags" ON "public"."leads" USING "gin" ("tags");



CREATE INDEX "idx_pipeline_statuses_display_order" ON "public"."pipeline_statuses" USING "btree" ("display_order");



CREATE INDEX "idx_pipeline_statuses_is_active" ON "public"."pipeline_statuses" USING "btree" ("is_active");



CREATE INDEX "idx_pipeline_statuses_metadata" ON "public"."pipeline_statuses" USING "gin" ("metadata");



CREATE INDEX "idx_pipeline_statuses_name" ON "public"."pipeline_statuses" USING "btree" ("name");



CREATE INDEX "idx_pipeline_statuses_pipeline_id" ON "public"."pipeline_statuses" USING "btree" ("pipeline_id");



CREATE INDEX "idx_pipeline_statuses_stage_type" ON "public"."pipeline_statuses" USING "btree" ("stage_type");



CREATE INDEX "idx_pipelines_created_by" ON "public"."pipelines" USING "btree" ("created_by");



CREATE INDEX "idx_pipelines_display_order" ON "public"."pipelines" USING "btree" ("display_order");



CREATE INDEX "idx_pipelines_is_active" ON "public"."pipelines" USING "btree" ("is_active");



CREATE INDEX "idx_pipelines_is_default" ON "public"."pipelines" USING "btree" ("is_default");



CREATE INDEX "idx_pipelines_lead_type" ON "public"."pipelines" USING "btree" ("lead_type");



CREATE INDEX "idx_pipelines_metadata" ON "public"."pipelines" USING "gin" ("metadata");



CREATE INDEX "idx_pipelines_name" ON "public"."pipelines" USING "btree" ("name");



CREATE INDEX "idx_quotes_carrier" ON "public"."quotes" USING "btree" ("carrier");



CREATE INDEX "idx_quotes_coverage_details" ON "public"."quotes" USING "gin" ("coverage_details");



CREATE INDEX "idx_quotes_effective_date" ON "public"."quotes" USING "btree" ("effective_date");



CREATE INDEX "idx_quotes_insurance_type_id" ON "public"."quotes" USING "btree" ("insurance_type_id");



CREATE INDEX "idx_quotes_lead_id" ON "public"."quotes" USING "btree" ("lead_id");



CREATE INDEX "idx_quotes_metadata" ON "public"."quotes" USING "gin" ("metadata");



CREATE INDEX "idx_quotes_quote_date" ON "public"."quotes" USING "btree" ("quote_date");



CREATE INDEX "idx_quotes_status" ON "public"."quotes" USING "btree" ("status");



CREATE INDEX "idx_ringcentral_tokens_account_id" ON "public"."ringcentral_tokens" USING "btree" ("account_id");



CREATE INDEX "idx_ringcentral_tokens_expires_at" ON "public"."ringcentral_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_ringcentral_tokens_is_active" ON "public"."ringcentral_tokens" USING "btree" ("is_active");



CREATE INDEX "idx_ringcentral_tokens_metadata" ON "public"."ringcentral_tokens" USING "gin" ("metadata");



CREATE INDEX "idx_ringcentral_tokens_user_id" ON "public"."ringcentral_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_sms_logs_client_id" ON "public"."sms_logs" USING "btree" ("client_id");



CREATE INDEX "idx_sms_logs_direction" ON "public"."sms_logs" USING "btree" ("direction");



CREATE INDEX "idx_sms_logs_from_number" ON "public"."sms_logs" USING "btree" ("from_number");



CREATE INDEX "idx_sms_logs_lead_id" ON "public"."sms_logs" USING "btree" ("lead_id");



CREATE INDEX "idx_sms_logs_message_search" ON "public"."sms_logs" USING "gin" ("to_tsvector"('"english"'::"regconfig", COALESCE("message_text", ''::"text")));



CREATE INDEX "idx_sms_logs_metadata" ON "public"."sms_logs" USING "gin" ("metadata");



CREATE INDEX "idx_sms_logs_ringcentral_message_id" ON "public"."sms_logs" USING "btree" ("ringcentral_message_id");



CREATE INDEX "idx_sms_logs_sent_at" ON "public"."sms_logs" USING "btree" ("sent_at");



CREATE INDEX "idx_sms_logs_status" ON "public"."sms_logs" USING "btree" ("status");



CREATE INDEX "idx_sms_logs_to_number" ON "public"."sms_logs" USING "btree" ("to_number");



CREATE INDEX "idx_sms_logs_user_id" ON "public"."sms_logs" USING "btree" ("user_id");



CREATE INDEX "idx_specialty_items_category" ON "public"."specialty_items" USING "btree" ("category");



CREATE INDEX "idx_specialty_items_client_id" ON "public"."specialty_items" USING "btree" ("client_id");



CREATE INDEX "idx_specialty_items_client_lead_created_by" ON "public"."specialty_items" USING "btree" ("client_id", "lead_id", "created_by");



CREATE INDEX "idx_specialty_items_created_at" ON "public"."specialty_items" USING "btree" ("created_at");



CREATE INDEX "idx_specialty_items_lead_id" ON "public"."specialty_items" USING "btree" ("lead_id");



CREATE INDEX "idx_specialty_items_metadata" ON "public"."specialty_items" USING "gin" ("metadata");



CREATE INDEX "idx_specialty_items_value" ON "public"."specialty_items" USING "btree" ("current_value");



CREATE INDEX "idx_user_phone_preferences_business_hours" ON "public"."user_phone_preferences" USING "gin" ("business_hours");



CREATE INDEX "idx_user_phone_preferences_is_active" ON "public"."user_phone_preferences" USING "btree" ("is_active");



CREATE INDEX "idx_user_phone_preferences_is_default" ON "public"."user_phone_preferences" USING "btree" ("is_default");



CREATE INDEX "idx_user_phone_preferences_phone_number" ON "public"."user_phone_preferences" USING "btree" ("selected_phone_number");



CREATE INDEX "idx_user_phone_preferences_user_id" ON "public"."user_phone_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_is_active" ON "public"."users" USING "btree" ("is_active");



CREATE INDEX "idx_users_metadata" ON "public"."users" USING "gin" ("metadata");



CREATE INDEX "idx_users_preferences" ON "public"."users" USING "gin" ("preferences");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_vehicles_client_id" ON "public"."vehicles" USING "btree" ("client_id");



CREATE INDEX "idx_vehicles_client_lead_created_by" ON "public"."vehicles" USING "btree" ("client_id", "lead_id", "created_by");



CREATE INDEX "idx_vehicles_created_at" ON "public"."vehicles" USING "btree" ("created_at");



CREATE INDEX "idx_vehicles_lead_id" ON "public"."vehicles" USING "btree" ("lead_id");



CREATE INDEX "idx_vehicles_make_model" ON "public"."vehicles" USING "btree" ("make", "model");



CREATE INDEX "idx_vehicles_metadata" ON "public"."vehicles" USING "gin" ("metadata");



CREATE INDEX "idx_vehicles_vin" ON "public"."vehicles" USING "btree" ("vin");



CREATE INDEX "idx_vehicles_year" ON "public"."vehicles" USING "btree" ("year");



CREATE OR REPLACE TRIGGER "create_communication_from_call_log" AFTER INSERT OR UPDATE ON "public"."call_logs" FOR EACH ROW EXECUTE FUNCTION "public"."create_communication_from_call"();



CREATE OR REPLACE TRIGGER "ensure_single_default_phone_preference" BEFORE INSERT OR UPDATE ON "public"."user_phone_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_single_default_phone"();



CREATE OR REPLACE TRIGGER "ensure_single_default_pipeline" BEFORE INSERT OR UPDATE ON "public"."pipelines" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_single_default_pipeline"();



CREATE OR REPLACE TRIGGER "increment_template_usage_on_communication" AFTER INSERT ON "public"."communications" FOR EACH ROW EXECUTE FUNCTION "public"."increment_template_usage"();



CREATE OR REPLACE TRIGGER "notify_ai_interactions_changes" AFTER INSERT OR UPDATE ON "public"."ai_interactions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_ai_interaction_change"();



CREATE OR REPLACE TRIGGER "notify_call_logs_changes" AFTER INSERT OR UPDATE ON "public"."call_logs" FOR EACH ROW EXECUTE FUNCTION "public"."notify_call_log_change"();



CREATE OR REPLACE TRIGGER "notify_communications_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."communications" FOR EACH ROW EXECUTE FUNCTION "public"."notify_communication_change"();



CREATE OR REPLACE TRIGGER "notify_leads_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."notify_lead_change"();



CREATE OR REPLACE TRIGGER "notify_quotes_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."quotes" FOR EACH ROW EXECUTE FUNCTION "public"."notify_quote_change"();



CREATE OR REPLACE TRIGGER "set_ab_tests_created_by" BEFORE INSERT ON "public"."ab_tests" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_addresses_created_by" BEFORE INSERT ON "public"."addresses" FOR EACH ROW EXECUTE FUNCTION "public"."set_address_created_by"();



CREATE OR REPLACE TRIGGER "set_ai_agents_created_by" BEFORE INSERT ON "public"."ai_agents" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_campaigns_created_by" BEFORE INSERT ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_clients_created_by" BEFORE INSERT ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_communications_created_by" BEFORE INSERT ON "public"."communications" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_content_templates_created_by" BEFORE INSERT ON "public"."content_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_homes_created_by" BEFORE INSERT ON "public"."homes" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_lead_next_contact_date" BEFORE INSERT OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_next_contact_date"();



CREATE OR REPLACE TRIGGER "set_leads_created_by" BEFORE INSERT ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_pipelines_created_by" BEFORE INSERT ON "public"."pipelines" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_quotes_created_by" BEFORE INSERT ON "public"."quotes" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_specialty_items_created_by" BEFORE INSERT ON "public"."specialty_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "set_vehicles_created_by" BEFORE INSERT ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by"();



CREATE OR REPLACE TRIGGER "track_lead_status_changes" AFTER UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."track_lead_status_change"();



CREATE OR REPLACE TRIGGER "update_ab_tests_audit_fields" BEFORE UPDATE ON "public"."ab_tests" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_addresses_audit_fields" BEFORE UPDATE ON "public"."addresses" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_addresses_formatted_address" BEFORE INSERT OR UPDATE ON "public"."addresses" FOR EACH ROW EXECUTE FUNCTION "public"."update_formatted_address"();



CREATE OR REPLACE TRIGGER "update_agent_memory_updated_at" BEFORE UPDATE ON "public"."agent_memory" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_agent_performance_on_interaction" AFTER UPDATE ON "public"."ai_interactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_agent_performance"();



CREATE OR REPLACE TRIGGER "update_ai_agents_audit_fields" BEFORE UPDATE ON "public"."ai_agents" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_call_logs_updated_at" BEFORE UPDATE ON "public"."call_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaigns_audit_fields" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_clients_audit_fields" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_client_audit_fields"();



CREATE OR REPLACE TRIGGER "update_communications_audit_fields" BEFORE UPDATE ON "public"."communications" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_content_templates_audit_fields" BEFORE UPDATE ON "public"."content_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_conversation_sessions_updated_at" BEFORE UPDATE ON "public"."conversation_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_homes_audit_fields" BEFORE UPDATE ON "public"."homes" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_last_contact_on_communication" AFTER INSERT ON "public"."communications" FOR EACH ROW EXECUTE FUNCTION "public"."update_lead_last_contact"();



CREATE OR REPLACE TRIGGER "update_leads_audit_fields" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_lead_audit_fields"();



CREATE OR REPLACE TRIGGER "update_pipelines_audit_fields" BEFORE UPDATE ON "public"."pipelines" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_quotes_audit_fields" BEFORE UPDATE ON "public"."quotes" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_ringcentral_tokens_updated_at" BEFORE UPDATE ON "public"."ringcentral_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sms_logs_updated_at" BEFORE UPDATE ON "public"."sms_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_specialty_items_audit_fields" BEFORE UPDATE ON "public"."specialty_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "update_user_phone_preferences_updated_at" BEFORE UPDATE ON "public"."user_phone_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vehicles_audit_fields" BEFORE UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."update_address_audit_fields"();



CREATE OR REPLACE TRIGGER "validate_communications_client_lead_relationship" BEFORE INSERT OR UPDATE ON "public"."communications" FOR EACH ROW EXECUTE FUNCTION "public"."validate_client_lead_relationship"();



CREATE OR REPLACE TRIGGER "validate_homes_client_lead_relationship" BEFORE INSERT OR UPDATE ON "public"."homes" FOR EACH ROW EXECUTE FUNCTION "public"."validate_client_lead_relationship"();



CREATE OR REPLACE TRIGGER "validate_specialty_items_client_lead_relationship" BEFORE INSERT OR UPDATE ON "public"."specialty_items" FOR EACH ROW EXECUTE FUNCTION "public"."validate_client_lead_relationship"();



CREATE OR REPLACE TRIGGER "validate_vehicles_client_lead_relationship" BEFORE INSERT OR UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_client_lead_relationship"();



ALTER TABLE ONLY "public"."ab_tests"
    ADD CONSTRAINT "ab_tests_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ab_tests"
    ADD CONSTRAINT "ab_tests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ab_tests"
    ADD CONSTRAINT "ab_tests_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."agent_memory"
    ADD CONSTRAINT "agent_memory_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id");



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."call_logs"
    ADD CONSTRAINT "call_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."call_logs"
    ADD CONSTRAINT "call_logs_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "public"."communications"("id");



ALTER TABLE ONLY "public"."call_logs"
    ADD CONSTRAINT "call_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."call_logs"
    ADD CONSTRAINT "call_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_mailing_address_id_fkey" FOREIGN KEY ("mailing_address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_ab_test_id_fkey" FOREIGN KEY ("ab_test_id") REFERENCES "public"."ab_tests"("id");



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id");



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_content_template_id_fkey" FOREIGN KEY ("content_template_id") REFERENCES "public"."content_templates"("id");



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."content_templates"
    ADD CONSTRAINT "content_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."content_templates"
    ADD CONSTRAINT "content_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id");



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."customer_touchpoints"
    ADD CONSTRAINT "customer_touchpoints_ab_test_id_fkey" FOREIGN KEY ("ab_test_id") REFERENCES "public"."ab_tests"("id");



ALTER TABLE ONLY "public"."customer_touchpoints"
    ADD CONSTRAINT "customer_touchpoints_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id");



ALTER TABLE ONLY "public"."customer_touchpoints"
    ADD CONSTRAINT "customer_touchpoints_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_touchpoints"
    ADD CONSTRAINT "customer_touchpoints_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "public"."communications"("id");



ALTER TABLE ONLY "public"."customer_touchpoints"
    ADD CONSTRAINT "customer_touchpoints_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "fk_clients_converted_from_lead" FOREIGN KEY ("converted_from_lead_id") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."homes"
    ADD CONSTRAINT "homes_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."homes"
    ADD CONSTRAINT "homes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homes"
    ADD CONSTRAINT "homes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."homes"
    ADD CONSTRAINT "homes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homes"
    ADD CONSTRAINT "homes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."lead_status_history"
    ADD CONSTRAINT "lead_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."lead_status_history"
    ADD CONSTRAINT "lead_status_history_from_pipeline_status_id_fkey" FOREIGN KEY ("from_pipeline_status_id") REFERENCES "public"."pipeline_statuses"("id");



ALTER TABLE ONLY "public"."lead_status_history"
    ADD CONSTRAINT "lead_status_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_status_history"
    ADD CONSTRAINT "lead_status_history_to_pipeline_status_id_fkey" FOREIGN KEY ("to_pipeline_status_id") REFERENCES "public"."pipeline_statuses"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_insurance_type_id_fkey" FOREIGN KEY ("insurance_type_id") REFERENCES "public"."insurance_types"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_lead_status_id_fkey" FOREIGN KEY ("lead_status_id") REFERENCES "public"."lead_statuses"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pipeline_status_id_fkey" FOREIGN KEY ("pipeline_status_id") REFERENCES "public"."pipeline_statuses"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pipeline_statuses"
    ADD CONSTRAINT "pipeline_statuses_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_insurance_type_id_fkey" FOREIGN KEY ("insurance_type_id") REFERENCES "public"."insurance_types"("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ringcentral_tokens"
    ADD CONSTRAINT "ringcentral_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sms_logs"
    ADD CONSTRAINT "sms_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."sms_logs"
    ADD CONSTRAINT "sms_logs_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "public"."communications"("id");



ALTER TABLE ONLY "public"."sms_logs"
    ADD CONSTRAINT "sms_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."sms_logs"
    ADD CONSTRAINT "sms_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."specialty_items"
    ADD CONSTRAINT "specialty_items_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."specialty_items"
    ADD CONSTRAINT "specialty_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."specialty_items"
    ADD CONSTRAINT "specialty_items_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."specialty_items"
    ADD CONSTRAINT "specialty_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_phone_preferences"
    ADD CONSTRAINT "user_phone_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



CREATE POLICY "AI agents are viewable by all users" ON "public"."ai_agents" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Admins can delete addresses" ON "public"."addresses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert users" ON "public"."users" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage AI agents" ON "public"."ai_agents" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage insurance types" ON "public"."insurance_types" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage lead statuses" ON "public"."lead_statuses" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update all users" ON "public"."users" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all users" ON "public"."users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."role" = 'admin'::"text")))));



CREATE POLICY "Insurance types are viewable by all users" ON "public"."insurance_types" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Lead statuses are viewable by all users" ON "public"."lead_statuses" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Managers can manage pipeline statuses" ON "public"."pipeline_statuses" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Managers can manage pipelines" ON "public"."pipelines" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Pipeline statuses are viewable by all users" ON "public"."pipeline_statuses" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Pipelines are viewable by all users" ON "public"."pipelines" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can delete their own RingCentral tokens" ON "public"."ringcentral_tokens" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own phone preferences" ON "public"."user_phone_preferences" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert AI interactions" ON "public"."ai_interactions" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert SMS logs" ON "public"."sms_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert ab_tests" ON "public"."ab_tests" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert addresses" ON "public"."addresses" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert agent memory" ON "public"."agent_memory" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert call logs" ON "public"."call_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert campaigns" ON "public"."campaigns" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert clients" ON "public"."clients" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert communications" ON "public"."communications" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert content templates" ON "public"."content_templates" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert conversation sessions" ON "public"."conversation_sessions" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert homes" ON "public"."homes" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert lead status history" ON "public"."lead_status_history" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert leads" ON "public"."leads" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert quotes" ON "public"."quotes" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert specialty items" ON "public"."specialty_items" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert their own RingCentral tokens" ON "public"."ringcentral_tokens" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own phone preferences" ON "public"."user_phone_preferences" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert touchpoints" ON "public"."customer_touchpoints" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert vehicles" ON "public"."vehicles" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can update campaigns they have access to" ON "public"."campaigns" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can update clients they have access to" ON "public"."clients" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."client_id" = "clients"."id") AND ("leads"."assigned_to" = "auth"."uid"()))))));



CREATE POLICY "Users can update homes they have access to" ON "public"."homes" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "homes"."client_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "homes"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can update leads they have access to" ON "public"."leads" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR ("assigned_to" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can update own addresses" ON "public"."addresses" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update quotes they have access to" ON "public"."quotes" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "quotes"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can update specialty items they have access to" ON "public"."specialty_items" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "specialty_items"."client_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "specialty_items"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can update their content templates" ON "public"."content_templates" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can update their own RingCentral tokens" ON "public"."ringcentral_tokens" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own phone preferences" ON "public"."user_phone_preferences" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update vehicles they have access to" ON "public"."vehicles" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "vehicles"."client_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "vehicles"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view AI interactions they have access to" ON "public"."ai_interactions" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "ai_interactions"."client_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "ai_interactions"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view SMS logs they have access to" ON "public"."sms_logs" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "sms_logs"."client_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "sms_logs"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view ab_tests they have access to" ON "public"."ab_tests" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."campaigns" "c"
  WHERE (("c"."id" = "ab_tests"."campaign_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view agent memory they have access to" ON "public"."agent_memory" FOR SELECT USING ((("entity_type" = 'global'::"text") OR (("entity_type" = 'user'::"text") AND ("entity_id" = "auth"."uid"())) OR (("entity_type" = 'client'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "agent_memory"."entity_id") AND ("c"."created_by" = "auth"."uid"()))))) OR (("entity_type" = 'lead'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "agent_memory"."entity_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"())))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view call logs they have access to" ON "public"."call_logs" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "call_logs"."client_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "call_logs"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view campaigns they created or have access to" ON "public"."campaigns" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view clients they created or are assigned to" ON "public"."clients" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."client_id" = "clients"."id") AND ("leads"."assigned_to" = "auth"."uid"()))))));



CREATE POLICY "Users can view communications they have access to" ON "public"."communications" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "communications"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "communications"."client_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view content templates" ON "public"."content_templates" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR ("is_active" = true) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view conversation sessions they have access to" ON "public"."conversation_sessions" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "conversation_sessions"."client_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "conversation_sessions"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view homes they have access to" ON "public"."homes" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "homes"."client_id") AND (("c"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."leads" "l"
          WHERE (("l"."client_id" = "c"."id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "homes"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view lead status history they have access to" ON "public"."lead_status_history" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "lead_status_history"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view leads they created or are assigned to" ON "public"."leads" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR ("assigned_to" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view own addresses" ON "public"."addresses" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view quotes they have access to" ON "public"."quotes" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "quotes"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view specialty items they have access to" ON "public"."specialty_items" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "specialty_items"."client_id") AND (("c"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."leads" "l"
          WHERE (("l"."client_id" = "c"."id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "specialty_items"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view their own RingCentral tokens" ON "public"."ringcentral_tokens" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own phone preferences" ON "public"."user_phone_preferences" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view touchpoints they have access to" ON "public"."customer_touchpoints" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "customer_touchpoints"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "customer_touchpoints"."client_id") AND ("c"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can view vehicles they have access to" ON "public"."vehicles" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "vehicles"."client_id") AND (("c"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."leads" "l"
          WHERE (("l"."client_id" = "c"."id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "vehicles"."lead_id") AND (("l"."created_by" = "auth"."uid"()) OR ("l"."assigned_to" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



ALTER TABLE "public"."ab_tests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_memory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."call_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_touchpoints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."homes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insurance_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipeline_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipelines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ringcentral_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."specialty_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_phone_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ab_tests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ai_interactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."call_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."campaigns";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."clients";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."communications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customer_touchpoints";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."lead_status_history";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."lead_statuses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."leads";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."pipeline_statuses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."pipelines";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."quotes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."sms_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_phone_preferences";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."address_distance_miles"("lat1" numeric, "lng1" numeric, "lat2" numeric, "lng2" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."address_distance_miles"("lat1" numeric, "lng1" numeric, "lat2" numeric, "lng2" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."address_distance_miles"("lat1" numeric, "lng1" numeric, "lat2" numeric, "lng2" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."addresses_within_radius"("center_lat" numeric, "center_lng" numeric, "radius_miles" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."addresses_within_radius"("center_lat" numeric, "center_lng" numeric, "radius_miles" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."addresses_within_radius"("center_lat" numeric, "center_lng" numeric, "radius_miles" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_assign_lead"("lead_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_lead"("lead_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_lead"("lead_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."broadcast_system_notification"("message" "text", "notification_type" "text", "target_roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."broadcast_system_notification"("message" "text", "notification_type" "text", "target_roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."broadcast_system_notification"("message" "text", "notification_type" "text", "target_roles" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."business_days_between"("start_date" "date", "end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."business_days_between"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."business_days_between"("start_date" "date", "end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_lead_score"("lead_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_lead_score"("lead_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_lead_score"("lead_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_communication_from_call"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_communication_from_call"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_communication_from_call"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_follow_up_task"("lead_id_param" "uuid", "task_type" "text", "due_date" timestamp with time zone, "description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_follow_up_task"("lead_id_param" "uuid", "task_type" "text", "due_date" timestamp with time zone, "description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_follow_up_task"("lead_id_param" "uuid", "task_type" "text", "due_date" timestamp with time zone, "description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_org_on_signup"("p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_org_on_signup"("p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_org_on_signup"("p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_pipeline_with_stages"("p_org_id" "uuid", "p_name" "text", "p_stage_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_pipeline_with_stages"("p_org_id" "uuid", "p_name" "text", "p_stage_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_pipeline_with_stages"("p_org_id" "uuid", "p_name" "text", "p_stage_names" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_has_role"("required_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_has_role"("required_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_has_role"("required_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."daily_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."daily_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."daily_maintenance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_default_phone"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_default_phone"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_default_phone"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_default_pipeline"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_default_pipeline"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_default_pipeline"() TO "service_role";



GRANT ALL ON FUNCTION "public"."extract_phone_digits"("phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."extract_phone_digits"("phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_phone_digits"("phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."format_address"("street" "text", "street2" "text", "city" "text", "state" "text", "zip_code" "text", "country" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."format_address"("street" "text", "street2" "text", "city" "text", "state" "text", "zip_code" "text", "country" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."format_address"("street" "text", "street2" "text", "city" "text", "state" "text", "zip_code" "text", "country" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."format_phone_number"("phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."format_phone_number"("phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."format_phone_number"("phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_import_batch_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_import_batch_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_import_batch_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_default_pipeline"("lead_type_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_default_pipeline"("lead_type_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_default_pipeline"("lead_type_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_first_pipeline_status"("pipeline_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_first_pipeline_status"("pipeline_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_first_pipeline_status"("pipeline_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lead_channels"("lead_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_lead_channels"("lead_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lead_channels"("lead_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_accessible_client_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_accessible_client_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_accessible_client_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_accessible_lead_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_accessible_lead_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_accessible_lead_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_template_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_template_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_template_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_member"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member"("p_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_valid_email"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_valid_email"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_email"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_sensitive_data_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_sensitive_data_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_sensitive_data_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."move_card"("p_card_id" "uuid", "p_to_stage_id" "uuid", "p_after_card_id" "uuid", "p_before_card_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."move_card"("p_card_id" "uuid", "p_to_stage_id" "uuid", "p_after_card_id" "uuid", "p_before_card_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."move_card"("p_card_id" "uuid", "p_to_stage_id" "uuid", "p_after_card_id" "uuid", "p_before_card_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."next_business_day"("input_date" "date", "days_to_add" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."next_business_day"("input_date" "date", "days_to_add" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_business_day"("input_date" "date", "days_to_add" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_ai_interaction_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_ai_interaction_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_ai_interaction_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_call_log_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_call_log_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_call_log_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_communication_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_communication_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_communication_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_lead_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_lead_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_lead_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_quote_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_quote_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_quote_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_expired_quotes"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_expired_quotes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_expired_quotes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."repack_stage"("p_stage_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."repack_stage"("p_stage_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."repack_stage"("p_stage_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_agent_memory"("agent_id_param" "uuid", "query_embedding" "public"."vector", "entity_type_param" "text", "entity_id_param" "uuid", "limit_param" integer, "similarity_threshold" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."search_agent_memory"("agent_id_param" "uuid", "query_embedding" "public"."vector", "entity_type_param" "text", "entity_id_param" "uuid", "limit_param" integer, "similarity_threshold" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_agent_memory"("agent_id_param" "uuid", "query_embedding" "public"."vector", "entity_type_param" "text", "entity_id_param" "uuid", "limit_param" integer, "similarity_threshold" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_address_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_address_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_address_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_next_contact_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_next_contact_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_next_contact_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subscribe_to_user_channels"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."subscribe_to_user_channels"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."subscribe_to_user_channels"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."suggest_next_action"("lead_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."suggest_next_action"("lead_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."suggest_next_action"("lead_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_lead_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_lead_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_lead_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_memory_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_memory_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_memory_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_address_audit_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_address_audit_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_address_audit_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_agent_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_agent_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_agent_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_client_audit_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_client_audit_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_client_audit_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_formatted_address"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_formatted_address"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_formatted_address"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lead_audit_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lead_audit_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lead_audit_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lead_last_contact"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lead_last_contact"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lead_last_contact"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_presence"("status" "text", "activity" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_presence"("status" "text", "activity" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_presence"("status" "text", "activity" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_can_access_client"("client_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_can_access_client"("client_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_can_access_client"("client_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_can_access_lead"("lead_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_can_access_lead"("lead_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_can_access_lead"("lead_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_role"("user_id" "uuid", "required_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_role"("user_id" "uuid", "required_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_role"("user_id" "uuid", "required_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_client_lead_relationship"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_client_lead_relationship"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_client_lead_relationship"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."ab_tests" TO "anon";
GRANT ALL ON TABLE "public"."ab_tests" TO "authenticated";
GRANT ALL ON TABLE "public"."ab_tests" TO "service_role";



GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."agent_memory" TO "anon";
GRANT ALL ON TABLE "public"."agent_memory" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_memory" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agents" TO "anon";
GRANT ALL ON TABLE "public"."ai_agents" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agents" TO "service_role";



GRANT ALL ON TABLE "public"."ai_interactions" TO "anon";
GRANT ALL ON TABLE "public"."ai_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."call_logs" TO "anon";
GRANT ALL ON TABLE "public"."call_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."call_logs" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."communications" TO "anon";
GRANT ALL ON TABLE "public"."communications" TO "authenticated";
GRANT ALL ON TABLE "public"."communications" TO "service_role";



GRANT ALL ON TABLE "public"."content_templates" TO "anon";
GRANT ALL ON TABLE "public"."content_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."content_templates" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_sessions" TO "anon";
GRANT ALL ON TABLE "public"."conversation_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."customer_touchpoints" TO "anon";
GRANT ALL ON TABLE "public"."customer_touchpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_touchpoints" TO "service_role";



GRANT ALL ON TABLE "public"."homes" TO "anon";
GRANT ALL ON TABLE "public"."homes" TO "authenticated";
GRANT ALL ON TABLE "public"."homes" TO "service_role";



GRANT ALL ON TABLE "public"."insurance_types" TO "anon";
GRANT ALL ON TABLE "public"."insurance_types" TO "authenticated";
GRANT ALL ON TABLE "public"."insurance_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."insurance_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."insurance_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."insurance_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lead_status_history" TO "anon";
GRANT ALL ON TABLE "public"."lead_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."lead_statuses" TO "anon";
GRANT ALL ON TABLE "public"."lead_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_statuses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lead_statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lead_statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lead_statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_statuses" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_statuses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pipeline_statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pipeline_statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pipeline_statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pipelines" TO "anon";
GRANT ALL ON TABLE "public"."pipelines" TO "authenticated";
GRANT ALL ON TABLE "public"."pipelines" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pipelines_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pipelines_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pipelines_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."ringcentral_tokens" TO "anon";
GRANT ALL ON TABLE "public"."ringcentral_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."ringcentral_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."schema_versions" TO "anon";
GRANT ALL ON TABLE "public"."schema_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_versions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."schema_versions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."schema_versions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."schema_versions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sms_logs" TO "anon";
GRANT ALL ON TABLE "public"."sms_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."sms_logs" TO "service_role";



GRANT ALL ON TABLE "public"."specialty_items" TO "anon";
GRANT ALL ON TABLE "public"."specialty_items" TO "authenticated";
GRANT ALL ON TABLE "public"."specialty_items" TO "service_role";



GRANT ALL ON TABLE "public"."user_phone_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_phone_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_phone_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
