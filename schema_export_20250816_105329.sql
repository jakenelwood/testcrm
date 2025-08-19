--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Ubuntu 17.5-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'Query performance monitoring extension';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: contact_lifecycle_stage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contact_lifecycle_stage AS ENUM (
    'lead',
    'opportunity_contact',
    'customer',
    'churned',
    'on_hold'
);


--
-- Name: interaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.interaction_type AS ENUM (
    'email',
    'call',
    'meeting',
    'note',
    'task_completed',
    'sms',
    'quote_generated',
    'policy_issued'
);


--
-- Name: opportunity_stage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.opportunity_stage AS ENUM (
    'prospecting',
    'qualification',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
    'start',
    'attempting_contact',
    'contacted_no_interest',
    'contacted_interested',
    'quoted',
    'quote_yes',
    'quote_no_followup_ok',
    'quote_no_dont_contact',
    'quote_maybe',
    'proposed',
    'paused',
    'future_follow_up_date'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: address_distance_miles(numeric, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.address_distance_miles(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: addresses_within_radius(numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.addresses_within_radius(center_lat numeric, center_lng numeric, radius_miles numeric DEFAULT 10) RETURNS TABLE(id uuid, formatted_address text, distance_miles numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: assign_lead_to_campaign(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_lead_to_campaign() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    default_campaign_id UUID;
    hold_campaign_id UUID;
    previous_campaign_id UUID;
BEGIN
    -- Store previous campaign for transition tracking
    IF TG_OP = 'UPDATE' THEN
        previous_campaign_id := OLD.current_campaign_id;
    END IF;
    
    -- Handle hold state assignment
    IF NEW.lifecycle_stage = 'on_hold' THEN
        -- Find or create hold management campaign
        SELECT c.id INTO NEW.current_campaign_id
        FROM campaigns c
        WHERE c.workspace_id = NEW.workspace_id
        AND c.campaign_type = 'on_hold'
        AND c.status = 'active'
        LIMIT 1;
        
        -- Create hold campaign if it doesn't exist
        IF NEW.current_campaign_id IS NULL THEN
            INSERT INTO campaigns (workspace_id, name, description, campaign_type, objective, status, ai_optimization_enabled, automation_rules)
            VALUES (NEW.workspace_id, 'Hold Management', 'Manages contacts who are on hold and schedules re-engagement', 'on_hold', 'hold_management', 'active', true, 
                    '{"hold_monitoring": true, "auto_reengagement": true}')
            RETURNING id INTO NEW.current_campaign_id;
        END IF;
        
        -- Set assignment timestamp
        NEW.campaign_assigned_at = now();
        
        -- Schedule re-engagement if hold_until is set
        IF NEW.hold_until IS NOT NULL THEN
            PERFORM schedule_reengagement(NEW.id, NEW.hold_until, NEW.workspace_id);
        END IF;
        
        -- Create campaign participant record
        INSERT INTO campaign_participants (workspace_id, campaign_id, contact_id, assigned_at, metadata)
        VALUES (NEW.workspace_id, NEW.current_campaign_id, NEW.id, now(), 
                jsonb_build_object('hold_until', NEW.hold_until, 'hold_reason', NEW.hold_reason))
        ON CONFLICT (contact_id) WHERE is_current = true 
        DO UPDATE SET 
            campaign_id = NEW.current_campaign_id,
            metadata = jsonb_build_object('hold_until', NEW.hold_until, 'hold_reason', NEW.hold_reason),
            assigned_at = now();
            
        -- Record transition if changing campaigns
        IF previous_campaign_id IS NOT NULL AND previous_campaign_id != NEW.current_campaign_id THEN
            INSERT INTO campaign_transitions (workspace_id, contact_id, from_campaign_id, to_campaign_id, transition_reason)
            VALUES (NEW.workspace_id, NEW.id, previous_campaign_id, NEW.current_campaign_id, 'moved_to_hold');
        END IF;
            
        RETURN NEW;
    END IF;
    
    -- Handle coming off hold - transition to re-engagement
    IF TG_OP = 'UPDATE' AND OLD.lifecycle_stage = 'on_hold' AND NEW.lifecycle_stage != 'on_hold' THEN
        -- Find appropriate re-engagement campaign
        SELECT c.id INTO NEW.current_campaign_id
        FROM campaigns c
        WHERE c.workspace_id = NEW.workspace_id
        AND c.campaign_type = 'reengagement'
        AND c.status = 'active'
        ORDER BY c.created_at DESC
        LIMIT 1;
        
        -- If no specific re-engagement campaign, use AI default
        IF NEW.current_campaign_id IS NULL THEN
            SELECT c.id INTO NEW.current_campaign_id
            FROM campaigns c
            WHERE c.workspace_id = NEW.workspace_id
            AND c.campaign_type = 'ai_automated'
            AND c.status = 'active'
            LIMIT 1;
        END IF;
        
        -- Record the transition
        INSERT INTO campaign_transitions (workspace_id, contact_id, from_campaign_id, to_campaign_id, transition_reason, transition_data)
        VALUES (NEW.workspace_id, NEW.id, OLD.current_campaign_id, NEW.current_campaign_id, 'hold_expired', 
                jsonb_build_object('hold_duration_days', EXTRACT(days FROM now() - OLD.campaign_assigned_at)));
    END IF;
    
    -- For new leads (not on hold), find the appropriate campaign
    IF NEW.lifecycle_stage = 'lead' AND (TG_OP = 'INSERT' OR OLD.lifecycle_stage IS DISTINCT FROM 'lead') AND NEW.lifecycle_stage != 'on_hold' THEN
        
        -- First, check for active targeted campaigns that match this lead
        SELECT c.id INTO NEW.current_campaign_id
        FROM campaigns c
        WHERE c.workspace_id = NEW.workspace_id
        AND c.status = 'active'
        AND c.objective IN ('lead_generation', 'ai_qualification')
        -- TODO: Add logic here to check audience_criteria JSONB matching
        ORDER BY c.created_at DESC
        LIMIT 1;
        
        -- If no targeted campaign found, assign to default AI campaign
        IF NEW.current_campaign_id IS NULL THEN
            SELECT c.id INTO NEW.current_campaign_id
            FROM campaigns c
            WHERE c.workspace_id = NEW.workspace_id
            AND c.campaign_type = 'ai_automated'
            AND c.status = 'active'
            LIMIT 1;
            
            -- Create default AI campaign if it doesn't exist
            IF NEW.current_campaign_id IS NULL THEN
                INSERT INTO campaigns (workspace_id, name, description, campaign_type, objective, status, ai_optimization_enabled, automation_rules)
                VALUES (NEW.workspace_id, 'AI Default Lead Nurture', 'Fully automated AI-driven lead nurturing and interaction campaign', 'ai_automated', 'ai_nurture', 'active', true, 
                        '{"auto_assign_new_leads": true, "ai_interaction_frequency": "smart"}')
                RETURNING id INTO NEW.current_campaign_id;
            END IF;
        END IF;
        
        -- Set assignment timestamp
        NEW.campaign_assigned_at = now();
        
        -- Create campaign participant record
        INSERT INTO campaign_participants (workspace_id, campaign_id, contact_id, assigned_at)
        VALUES (NEW.workspace_id, NEW.current_campaign_id, NEW.id, now())
        ON CONFLICT (contact_id) WHERE is_current = true 
        DO UPDATE SET 
            campaign_id = NEW.current_campaign_id,
            assigned_at = now();
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: auto_assign_lead(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_assign_lead(lead_id_param uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION auto_assign_lead(lead_id_param uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.auto_assign_lead(lead_id_param uuid) IS 'Auto-assign lead to user with least workload';


--
-- Name: broadcast_system_notification(text, text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.broadcast_system_notification(message text, notification_type text DEFAULT 'info'::text, target_roles text[] DEFAULT ARRAY['admin'::text, 'manager'::text, 'agent'::text, 'user'::text]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION broadcast_system_notification(message text, notification_type text, target_roles text[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.broadcast_system_notification(message text, notification_type text, target_roles text[]) IS 'Broadcast system-wide notifications';


--
-- Name: business_days_between(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.business_days_between(start_date date, end_date date) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: calculate_lead_score(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_lead_score(lead_id_param uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION calculate_lead_score(lead_id_param uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_lead_score(lead_id_param uuid) IS 'Calculate lead score based on various factors';


--
-- Name: calculate_similarity(extensions.vector, extensions.vector); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_similarity(embedding1 extensions.vector, embedding2 extensions.vector) RETURNS double precision
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT (embedding1 <#> embedding2) * -1;
$$;


--
-- Name: check_rate_limit(text, inet, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_rate_limit(endpoint_param text, ip_address_param inet DEFAULT NULL::inet, max_requests integer DEFAULT 100, window_minutes integer DEFAULT 60) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  current_user_id UUID := auth.uid();
  window_start_time TIMESTAMP WITH TIME ZONE;
  current_count INTEGER;
  rate_limit_record RECORD;
  result JSONB;
BEGIN
  -- Calculate window start time (round to nearest window)
  window_start_time := date_trunc('hour', NOW()) + 
    (EXTRACT(MINUTE FROM NOW())::INTEGER / window_minutes) * 
    (window_minutes || ' minutes')::INTERVAL;

  -- Check existing rate limit record
  SELECT * INTO rate_limit_record
  FROM public.api_rate_limits
  WHERE (
    (current_user_id IS NOT NULL AND user_id = current_user_id) OR
    (current_user_id IS NULL AND ip_address = ip_address_param)
  )
  AND endpoint = endpoint_param
  AND window_start = window_start_time;

  IF rate_limit_record IS NOT NULL THEN
    current_count := rate_limit_record.request_count + 1;
    
    -- Update existing record
    UPDATE public.api_rate_limits
    SET request_count = current_count, updated_at = NOW()
    WHERE id = rate_limit_record.id;
  ELSE
    current_count := 1;
    
    -- Insert new record
    INSERT INTO public.api_rate_limits (
      user_id, ip_address, endpoint, request_count, window_start
    ) VALUES (
      current_user_id, ip_address_param, endpoint_param, current_count, window_start_time
    );
  END IF;

  -- Build result
  result := jsonb_build_object(
    'allowed', current_count <= max_requests,
    'current_count', current_count,
    'max_requests', max_requests,
    'window_start', window_start_time,
    'reset_time', window_start_time + (window_minutes || ' minutes')::INTERVAL,
    'remaining', GREATEST(0, max_requests - current_count)
  );

  RETURN result;
END;
$$;


--
-- Name: FUNCTION check_rate_limit(endpoint_param text, ip_address_param inet, max_requests integer, window_minutes integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_rate_limit(endpoint_param text, ip_address_param inet, max_requests integer, window_minutes integer) IS 'Check and enforce API rate limits per user/IP and endpoint';


--
-- Name: cleanup_old_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_data() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: cleanup_rate_limits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_rate_limits() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM public.api_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


--
-- Name: FUNCTION cleanup_rate_limits(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.cleanup_rate_limits() IS 'Clean up old rate limit records (call periodically)';


--
-- Name: create_communication_from_call(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_communication_from_call() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: create_communication_from_call_log(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_communication_from_call_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF NEW.status = 'Connected' AND (NEW.client_id IS NOT NULL OR NEW.lead_id IS NOT NULL) THEN INSERT INTO public.communications (client_id, lead_id, type, direction, content, duration, status, ai_summary, ai_sentiment, created_at, completed_at) VALUES (NEW.client_id, NEW.lead_id, 'call', NEW.direction, COALESCE(NEW.transcription, 'Call completed - duration: ' || NEW.duration || ' seconds'), NEW.duration, 'Delivered', NEW.ai_summary, NEW.ai_sentiment, NEW.start_time, NEW.end_time); END IF; RETURN NEW; END; $$;


--
-- Name: create_follow_up_task(uuid, text, timestamp with time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_follow_up_task(lead_id_param uuid, task_type text, due_date timestamp with time zone, description text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: create_org_on_signup(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_org_on_signup(p_name text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: create_pipeline_with_stages(uuid, text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_pipeline_with_stages(p_org_id uuid, p_name text, p_stage_names text[]) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: current_user_has_role(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_has_role(required_role text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN public.user_has_role(auth.uid(), required_role);
END;
$$;


--
-- Name: daily_maintenance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.daily_maintenance() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: FUNCTION daily_maintenance(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.daily_maintenance() IS 'Run daily maintenance tasks including cleanup and processing';


--
-- Name: ensure_single_default_phone(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_single_default_phone() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


--
-- Name: ensure_single_default_pipeline(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_single_default_pipeline() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: extract_phone_digits(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.extract_phone_digits(phone text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g');
END;
$$;


--
-- Name: find_similar_contacts(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_similar_contacts(contact_id uuid, workspace_id uuid, match_count integer DEFAULT 5) RETURNS TABLE(id uuid, first_name text, last_name text, lifecycle_stage public.contact_lifecycle_stage, ai_risk_score integer, similarity double precision, account_name text)
    LANGUAGE plpgsql
    AS $$
DECLARE
  target_embedding vector(1024);
BEGIN
  -- Get the embedding of the target contact
  SELECT summary_embedding INTO target_embedding
  FROM contacts
  WHERE contacts.id = contact_id AND contacts.workspace_id = find_similar_contacts.workspace_id;
  
  IF target_embedding IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.lifecycle_stage,
    c.ai_risk_score,
    (c.summary_embedding <#> target_embedding) * -1 AS similarity,
    a.name AS account_name
  FROM contacts c
  LEFT JOIN accounts a ON c.account_id = a.id
  WHERE 
    c.workspace_id = find_similar_contacts.workspace_id
    AND c.id != contact_id
    AND c.summary_embedding IS NOT NULL
  ORDER BY c.summary_embedding <#> target_embedding
  LIMIT match_count;
END;
$$;


--
-- Name: format_address(text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.format_address(street text DEFAULT NULL::text, street2 text DEFAULT NULL::text, city text DEFAULT NULL::text, state text DEFAULT NULL::text, zip_code text DEFAULT NULL::text, country text DEFAULT 'US'::text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: format_phone_number(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.format_phone_number(phone text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: generate_import_batch_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_import_batch_id() RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN uuid_generate_v4();
END;
$$;


--
-- Name: get_campaign_performance(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_campaign_performance(p_campaign_id uuid) RETURNS TABLE(total_participants bigint, total_sent bigint, total_delivered bigint, total_opened bigint, total_clicked bigint, total_converted bigint, open_rate numeric, click_rate numeric, conversion_rate numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT cp.contact_id) as total_participants,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.sent_at IS NOT NULL) as total_sent,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.delivered_at IS NOT NULL) as total_delivered,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.opened_at IS NOT NULL) as total_opened,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.clicked_at IS NOT NULL) as total_clicked,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.converted_at IS NOT NULL) as total_converted,
        CASE 
            WHEN COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.delivered_at IS NOT NULL) > 0 
            THEN ROUND(
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.opened_at IS NOT NULL)::DECIMAL / 
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.delivered_at IS NOT NULL) * 100, 2
            )
            ELSE 0
        END as open_rate,
        CASE 
            WHEN COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.opened_at IS NOT NULL) > 0 
            THEN ROUND(
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.clicked_at IS NOT NULL)::DECIMAL / 
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.opened_at IS NOT NULL) * 100, 2
            )
            ELSE 0
        END as click_rate,
        CASE 
            WHEN COUNT(DISTINCT cp.contact_id) > 0 
            THEN ROUND(
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.converted_at IS NOT NULL)::DECIMAL / 
                COUNT(DISTINCT cp.contact_id) * 100, 2
            )
            ELSE 0
        END as conversion_rate
    FROM campaign_participants cp
    LEFT JOIN campaign_metrics cm ON cp.contact_id = cm.contact_id AND cp.campaign_id = cm.campaign_id
    WHERE cp.campaign_id = p_campaign_id;
END;
$$;


--
-- Name: get_contact_insights(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_contact_insights(contact_id uuid, workspace_id uuid) RETURNS TABLE(insight_type text, insight_text text, confidence_score double precision, supporting_data jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
  target_contact record;
  similar_contact_count integer;
  avg_lifetime_value decimal;
  avg_risk_score integer;
BEGIN
  -- Get target contact data
  SELECT * INTO target_contact
  FROM contacts c
  WHERE c.id = contact_id AND c.workspace_id = get_contact_insights.workspace_id;

  IF target_contact IS NULL THEN
    RETURN;
  END IF;

  -- Calculate averages from similar contacts
  SELECT
    COUNT(*),
    AVG(c.ai_lifetime_value),
    AVG(c.ai_risk_score)
  INTO similar_contact_count, avg_lifetime_value, avg_risk_score
  FROM find_similar_contacts(contact_id, workspace_id, 10) sc
  JOIN contacts c ON c.id = sc.id;

  -- Generate insights based on comparisons
  IF target_contact.ai_lifetime_value IS NOT NULL AND avg_lifetime_value IS NOT NULL THEN
    IF target_contact.ai_lifetime_value > avg_lifetime_value * 1.2 THEN
      RETURN QUERY SELECT
        'high_value'::text,
        'This contact has significantly higher lifetime value potential than similar contacts'::text,
        0.8::float,
        jsonb_build_object(
          'contact_value', target_contact.ai_lifetime_value,
          'average_value', avg_lifetime_value,
          'difference_percent', ((target_contact.ai_lifetime_value - avg_lifetime_value) / avg_lifetime_value * 100)
        );
    END IF;
  END IF;

  IF target_contact.ai_risk_score IS NOT NULL AND avg_risk_score IS NOT NULL THEN
    IF target_contact.ai_risk_score > avg_risk_score + 20 THEN
      RETURN QUERY SELECT
        'high_risk'::text,
        'This contact shows higher risk indicators compared to similar profiles'::text,
        0.7::float,
        jsonb_build_object(
          'contact_risk', target_contact.ai_risk_score,
          'average_risk', avg_risk_score,
          'risk_difference', target_contact.ai_risk_score - avg_risk_score
        );
    END IF;
  END IF;

  -- Lifecycle stage insights
  IF target_contact.lifecycle_stage = 'lead' THEN
    RETURN QUERY SELECT
      'conversion_opportunity'::text,
      'Based on similar contacts, this lead has good conversion potential'::text,
      0.6::float,
      jsonb_build_object(
        'similar_contacts_count', similar_contact_count,
        'current_stage', target_contact.lifecycle_stage
      );
  END IF;

END;
$$;


--
-- Name: get_current_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_user_role() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$;


--
-- Name: get_dashboard_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dashboard_stats() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: FUNCTION get_dashboard_stats(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_dashboard_stats() IS 'Get real-time dashboard statistics';


--
-- Name: get_db_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_db_stats() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  stats JSONB;
BEGIN
  -- Only allow admins to view database statistics
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  SELECT jsonb_build_object(
    'active_connections', (
      SELECT count(*) 
      FROM pg_stat_activity 
      WHERE state = 'active'
    ),
    'total_connections', (
      SELECT count(*) 
      FROM pg_stat_activity
    ),
    'database_size', (
      SELECT pg_size_pretty(pg_database_size(current_database()))
    ),
    'cache_hit_ratio', (
      SELECT round(
        (sum(blks_hit) * 100.0 / sum(blks_hit + blks_read))::numeric, 2
      )
      FROM pg_stat_database
      WHERE datname = current_database()
    )
  ) INTO stats;

  RETURN stats;
END;
$$;


--
-- Name: FUNCTION get_db_stats(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_db_stats() IS 'Get database performance statistics (admin only)';


--
-- Name: get_default_pipeline(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_default_pipeline(lead_type_param text DEFAULT 'Personal'::text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: get_first_pipeline_status(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_first_pipeline_status(pipeline_id_param integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: get_lead_channels(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lead_channels(lead_id_param uuid) RETURNS text[]
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION get_lead_channels(lead_id_param uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_lead_channels(lead_id_param uuid) IS 'Get list of real-time channels for a specific lead';


--
-- Name: get_slow_queries(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_slow_queries(limit_count integer DEFAULT 10) RETURNS TABLE(query text, calls bigint, total_time double precision, mean_time double precision, rows bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Only allow admins to view query statistics
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    pss.query,
    pss.calls,
    pss.total_exec_time as total_time,
    pss.mean_exec_time as mean_time,
    pss.rows
  FROM pg_stat_statements pss
  ORDER BY pss.mean_exec_time DESC
  LIMIT limit_count;
END;
$$;


--
-- Name: FUNCTION get_slow_queries(limit_count integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_slow_queries(limit_count integer) IS 'Get slowest database queries for performance monitoring (admin only)';


--
-- Name: get_storage_path(text, text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_storage_path(bucket_name text, entity_type text, entity_id uuid, filename text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  user_id UUID;
  path TEXT;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Construct the path based on entity type
  CASE entity_type
    WHEN 'user' THEN
      path := user_id::text || '/' || filename;
    WHEN 'lead' THEN
      -- Verify user has access to the lead
      IF NOT EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = entity_id AND (l.created_by = user_id OR l.assigned_to = user_id)
      ) AND NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_id AND u.role IN ('admin', 'manager')
      ) THEN
        RAISE EXCEPTION 'Access denied to lead %', entity_id;
      END IF;
      path := user_id::text || '/' || entity_id::text || '/' || filename;
    WHEN 'client' THEN
      -- Verify user has access to the client
      IF NOT EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = entity_id AND c.created_by = user_id
      ) AND NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_id AND u.role IN ('admin', 'manager')
      ) THEN
        RAISE EXCEPTION 'Access denied to client %', entity_id;
      END IF;
      path := user_id::text || '/' || entity_id::text || '/' || filename;
    ELSE
      RAISE EXCEPTION 'Invalid entity type: %', entity_type;
  END CASE;

  RETURN path;
END;
$$;


--
-- Name: FUNCTION get_storage_path(bucket_name text, entity_type text, entity_id uuid, filename text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_storage_path(bucket_name text, entity_type text, entity_id uuid, filename text) IS 'Generates appropriate storage paths for documents based on entity type and user permissions';


--
-- Name: get_user_accessible_client_ids(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_accessible_client_ids() RETURNS uuid[]
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION get_user_accessible_client_ids(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_accessible_client_ids() IS 'Get array of client IDs accessible to current user';


--
-- Name: get_user_accessible_lead_ids(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_accessible_lead_ids() RETURNS uuid[]
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION get_user_accessible_lead_ids(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_accessible_lead_ids() IS 'Get array of lead IDs accessible to current user';


--
-- Name: get_user_workspace_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_workspace_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT workspace_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$;


--
-- Name: get_workspace_ai_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_workspace_ai_stats(workspace_id uuid) RETURNS TABLE(total_contacts bigint, contacts_with_embeddings bigint, total_interactions bigint, interactions_with_embeddings bigint, embedding_coverage_percent double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id),
    (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id AND summary_embedding IS NOT NULL),
    (SELECT COUNT(*) FROM interactions WHERE interactions.workspace_id = get_workspace_ai_stats.workspace_id),
    (SELECT COUNT(*) FROM interactions WHERE interactions.workspace_id = get_workspace_ai_stats.workspace_id AND embedding IS NOT NULL),
    CASE 
      WHEN (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id) > 0 
      THEN (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id AND summary_embedding IS NOT NULL)::float / 
           (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id)::float * 100
      ELSE 0
    END;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: increment_template_usage(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_template_usage() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: is_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_member(p_org uuid) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$;


--
-- Name: is_valid_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_valid_email(email text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public', 'pg_temp'
    AS $_$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$_$;


--
-- Name: is_workspace_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_workspace_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT role IN ('owner', 'manager')
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$;


--
-- Name: list_tables(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_tables() RETURNS text[]
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ BEGIN RETURN ARRAY(SELECT t.table_name FROM information_schema.tables t WHERE t.table_schema = 'public' ORDER BY t.table_name); END; $$;


--
-- Name: log_sensitive_data_access(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_sensitive_data_access() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: move_card(uuid, uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.move_card(p_card_id uuid, p_to_stage_id uuid, p_after_card_id uuid DEFAULT NULL::uuid, p_before_card_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: next_business_day(date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.next_business_day(input_date date, days_to_add integer DEFAULT 1) RETURNS date
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: notify_ai_interaction_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_ai_interaction_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: notify_call_log_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_call_log_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: notify_communication_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_communication_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: notify_lead_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_lead_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: notify_quote_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_quote_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: process_expired_quotes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_expired_quotes() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: repack_stage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.repack_stage(p_stage_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: schedule_reengagement(uuid, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.schedule_reengagement(p_contact_id uuid, p_hold_until timestamp with time zone, p_workspace_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    reengagement_campaign_id UUID;
    notification_dates TIMESTAMPTZ[];
BEGIN
    -- Find re-engagement campaign
    SELECT id INTO reengagement_campaign_id
    FROM campaigns 
    WHERE workspace_id = p_workspace_id 
    AND campaign_type = 'reengagement' 
    AND status = 'active'
    LIMIT 1;
    
    -- If no re-engagement campaign exists, create one
    IF reengagement_campaign_id IS NULL THEN
        INSERT INTO campaigns (workspace_id, name, description, campaign_type, objective, status, ai_optimization_enabled)
        VALUES (p_workspace_id, 'Auto Re-engagement', 'Automatically created re-engagement campaign', 'reengagement', 'reengagement', 'active', true)
        RETURNING id INTO reengagement_campaign_id;
    END IF;
    
    -- Calculate notification dates (7 days before, 1 day before, on date)
    notification_dates := ARRAY[
        p_hold_until - INTERVAL '7 days',
        p_hold_until - INTERVAL '1 day', 
        p_hold_until
    ];
    
    -- Create scheduled notifications
    INSERT INTO reengagement_schedule (workspace_id, contact_id, campaign_id, scheduled_for, notification_type, notification_data)
    SELECT 
        p_workspace_id,
        p_contact_id,
        reengagement_campaign_id,
        unnest(notification_dates),
        CASE 
            WHEN unnest(notification_dates) = p_hold_until THEN 'ai_notification'
            ELSE 'email_reminder'
        END,
        jsonb_build_object(
            'hold_expires', p_hold_until,
            'contact_id', p_contact_id,
            'message', CASE 
                WHEN unnest(notification_dates) = p_hold_until THEN 'Contact hold period has expired - ready for re-engagement'
                ELSE 'Contact hold period expires soon'
            END
        );
END;
$$;


--
-- Name: search_accounts_by_embedding(extensions.vector, uuid, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_accounts_by_embedding(query_embedding extensions.vector, workspace_id uuid, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10) RETURNS TABLE(id uuid, name text, industry text, employee_count integer, annual_revenue numeric, ai_risk_score integer, ai_lifetime_value numeric, similarity double precision, contact_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.industry,
    a.employee_count,
    a.annual_revenue,
    a.ai_risk_score,
    a.ai_lifetime_value,
    (a.summary_embedding <#> query_embedding) * -1 AS similarity,
    COUNT(c.id) AS contact_count
  FROM accounts a
  LEFT JOIN contacts c ON a.id = c.account_id
  WHERE 
    a.workspace_id = search_accounts_by_embedding.workspace_id
    AND a.summary_embedding IS NOT NULL
    AND (a.summary_embedding <#> query_embedding) * -1 > match_threshold
  GROUP BY a.id, a.name, a.industry, a.employee_count, a.annual_revenue, 
           a.ai_risk_score, a.ai_lifetime_value, a.summary_embedding
  ORDER BY a.summary_embedding <#> query_embedding
  LIMIT match_count;
END;
$$;


--
-- Name: search_agent_memory(uuid, extensions.vector, text, uuid, integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_agent_memory(agent_id_param uuid, query_embedding extensions.vector, entity_type_param text DEFAULT NULL::text, entity_id_param uuid DEFAULT NULL::uuid, limit_param integer DEFAULT 10, similarity_threshold numeric DEFAULT 0.7) RETURNS TABLE(id uuid, title text, content text, similarity numeric, memory_type text, importance_score integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: search_contacts_by_embedding(extensions.vector, uuid, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_contacts_by_embedding(query_embedding extensions.vector, workspace_id uuid, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10) RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, lifecycle_stage public.contact_lifecycle_stage, job_title text, ai_risk_score integer, ai_lifetime_value numeric, similarity double precision, account_name text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.lifecycle_stage,
    c.job_title,
    c.ai_risk_score,
    c.ai_lifetime_value,
    (c.summary_embedding <#> query_embedding) * -1 AS similarity,
    a.name AS account_name
  FROM contacts c
  LEFT JOIN accounts a ON c.account_id = a.id
  WHERE 
    c.workspace_id = search_contacts_by_embedding.workspace_id
    AND c.summary_embedding IS NOT NULL
    AND (c.summary_embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY c.summary_embedding <#> query_embedding
  LIMIT match_count;
END;
$$;


--
-- Name: search_documents_by_embedding(extensions.vector, uuid, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_documents_by_embedding(query_embedding extensions.vector, workspace_id uuid, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 15) RETURNS TABLE(id uuid, file_name text, document_type text, ai_summary text, contact_name text, account_name text, similarity double precision, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.file_name,
    d.document_type,
    d.ai_summary,
    CONCAT(c.first_name, ' ', c.last_name) AS contact_name,
    a.name AS account_name,
    (d.embedding <#> query_embedding) * -1 AS similarity,
    d.created_at
  FROM documents d
  LEFT JOIN contacts c ON d.contact_id = c.id
  LEFT JOIN accounts a ON d.account_id = a.id
  WHERE 
    d.workspace_id = search_documents_by_embedding.workspace_id
    AND d.embedding IS NOT NULL
    AND (d.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY d.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;


--
-- Name: search_interactions_by_embedding(extensions.vector, uuid, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_interactions_by_embedding(query_embedding extensions.vector, workspace_id uuid, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 20) RETURNS TABLE(id uuid, type public.interaction_type, subject text, content text, interacted_at timestamp with time zone, contact_name text, account_name text, similarity double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.type,
    i.subject,
    LEFT(i.content, 200) AS content, -- Truncate for display
    i.interacted_at,
    CONCAT(c.first_name, ' ', c.last_name) AS contact_name,
    a.name AS account_name,
    (i.embedding <#> query_embedding) * -1 AS similarity
  FROM interactions i
  LEFT JOIN contacts c ON i.contact_id = c.id
  LEFT JOIN accounts a ON i.account_id = a.id
  WHERE 
    i.workspace_id = search_interactions_by_embedding.workspace_id
    AND i.embedding IS NOT NULL
    AND (i.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY i.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;


--
-- Name: set_address_created_by(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_address_created_by() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_created_by(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_created_by() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_next_contact_date(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_next_contact_date() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


--
-- Name: subscribe_to_user_channels(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.subscribe_to_user_channels(user_id_param uuid) RETURNS text[]
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION subscribe_to_user_channels(user_id_param uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.subscribe_to_user_channels(user_id_param uuid) IS 'Get list of real-time channels for a specific user';


--
-- Name: suggest_next_action(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.suggest_next_action(lead_id_param uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION suggest_next_action(lead_id_param uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.suggest_next_action(lead_id_param uuid) IS 'Suggest next action for a lead based on status and history';


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin new.updated_at = now(); return new; end $$;


--
-- Name: track_lead_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_lead_status_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: track_memory_access(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_memory_access() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.access_count = OLD.access_count + 1;
  NEW.last_accessed_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_address_audit_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_address_audit_fields() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;


--
-- Name: update_agent_performance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_agent_performance() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_client_audit_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_client_audit_fields() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;


--
-- Name: update_formatted_address(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_formatted_address() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.formatted_address = public.format_address(
    NEW.street, NEW.street2, NEW.city, NEW.state, NEW.zip_code, NEW.country
  );
  RETURN NEW;
END;
$$;


--
-- Name: update_lead_audit_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_lead_audit_fields() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: update_lead_last_contact(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_lead_last_contact() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: update_policy_claims_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_policy_claims_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE insurance_policies 
        SET claims_count = claims_count + 1,
            last_claim_date = NEW.incident_date
        WHERE id = NEW.policy_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE insurance_policies 
        SET claims_count = claims_count - 1
        WHERE id = OLD.policy_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_user_presence(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_presence(status text DEFAULT 'online'::text, activity text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION update_user_presence(status text, activity text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_user_presence(status text, activity text) IS 'Update user presence status for real-time features';


--
-- Name: user_can_access_client(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_can_access_client(client_id_param uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION user_can_access_client(client_id_param uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_can_access_client(client_id_param uuid) IS 'Check if current user can access a specific client';


--
-- Name: user_can_access_lead(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_can_access_lead(lead_id_param uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: FUNCTION user_can_access_lead(lead_id_param uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_can_access_lead(lead_id_param uuid) IS 'Check if current user can access a specific lead';


--
-- Name: user_has_role(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_role(user_id uuid, required_role text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = required_role
  );
END;
$$;


--
-- Name: validate_client_lead_relationship(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_client_lead_relationship() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: validate_cors_origin(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_cors_origin(origin_url text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Basic URL validation
  IF origin_url IS NULL OR origin_url = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if it's a valid URL format
  IF origin_url !~ '^https?://[a-zA-Z0-9.-]+' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;


--
-- Name: FUNCTION validate_cors_origin(origin_url text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_cors_origin(origin_url text) IS 'Validate CORS origin URL format';


--
-- Name: validate_file_upload(text, text, bigint, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_file_upload(bucket_name text, file_path text, file_size bigint, mime_type text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  bucket_config RECORD;
  user_id UUID;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get bucket configuration
  SELECT file_size_limit, allowed_mime_types
  INTO bucket_config
  FROM storage.buckets
  WHERE id = bucket_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bucket % not found', bucket_name;
  END IF;

  -- Check file size limit
  IF file_size > bucket_config.file_size_limit THEN
    RAISE EXCEPTION 'File size % exceeds limit of %', file_size, bucket_config.file_size_limit;
  END IF;

  -- Check MIME type
  IF bucket_config.allowed_mime_types IS NOT NULL AND
     NOT (mime_type = ANY(bucket_config.allowed_mime_types)) THEN
    RAISE EXCEPTION 'MIME type % not allowed for bucket %', mime_type, bucket_name;
  END IF;

  RETURN TRUE;
END;
$$;


--
-- Name: FUNCTION validate_file_upload(bucket_name text, file_path text, file_size bigint, mime_type text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_file_upload(bucket_name text, file_path text, file_size bigint, mime_type text) IS 'Validates file uploads against bucket constraints and user permissions';


--
-- Name: validate_password_strength(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_password_strength(password text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
DECLARE
  result JSONB := '{"valid": true, "errors": []}'::jsonb;
  errors TEXT[] := '{}';
  score INTEGER := 0;
BEGIN
  -- Check minimum length
  IF LENGTH(password) < 8 THEN
    errors := array_append(errors, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check maximum length
  IF LENGTH(password) > 128 THEN
    errors := array_append(errors, 'Password must be no more than 128 characters long');
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password !~ '[^A-Za-z0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  -- Check against common passwords
  IF LOWER(password) IN (
    'password', 'password123', '123456', '123456789', 'qwerty',
    'abc123', 'password1', 'admin', 'letmein', 'welcome', '111111'
  ) THEN
    errors := array_append(errors, 'Password is too common, please choose a more secure password');
  END IF;
  
  -- Build result
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(errors),
      'score', 0
    );
  ELSE
    -- Calculate password strength score (0-100)
    score := 60; -- Base score for meeting requirements
    
    -- Bonus for length
    IF LENGTH(password) >= 12 THEN
      score := score + 10;
    ELSIF LENGTH(password) >= 10 THEN
      score := score + 5;
    END IF;
    
    -- Bonus for character variety
    IF password ~ '[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\?]' THEN
      score := score + 10;
    END IF;
    
    -- Bonus for mixed case and numbers
    IF password ~ '[A-Z]' AND password ~ '[a-z]' AND password ~ '[0-9]' THEN
      score := score + 10;
    END IF;
    
    -- Bonus for no repeated characters
    IF NOT (password ~ '(.)\1{2,}') THEN
      score := score + 10;
    END IF;
    
    result := jsonb_build_object(
      'valid', true,
      'errors', '[]'::jsonb,
      'score', LEAST(score, 100)
    );
  END IF;
  
  RETURN result;
END;
$_$;


--
-- Name: FUNCTION validate_password_strength(password text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_password_strength(password text) IS 'Validates password meets security requirements';


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
BEGIN
    RETURN query EXECUTE
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name || '/' AS name,
                    NULL::uuid AS id,
                    NULL::timestamptz AS updated_at,
                    NULL::timestamptz AS created_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
                ORDER BY prefixes.name COLLATE "C" LIMIT $3
            )
            UNION ALL
            (SELECT split_part(name, '/', $4) AS key,
                name,
                id,
                updated_at,
                created_at,
                metadata
            FROM storage.objects
            WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
            ORDER BY name COLLATE "C" LIMIT $3)
        ) obj
        ORDER BY name COLLATE "C" LIMIT $3;
        $sql$
        USING prefix, bucket_name, limits, levels, start_after;
END;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: ab_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ab_tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    name text NOT NULL,
    hypothesis text,
    test_type text,
    variants jsonb NOT NULL,
    traffic_allocation jsonb DEFAULT '{"control": 50, "variant_a": 50}'::jsonb,
    status text DEFAULT 'draft'::text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    success_metric text NOT NULL,
    minimum_sample_size integer DEFAULT 100,
    confidence_level numeric(5,2) DEFAULT 95.0,
    statistical_significance numeric(5,2),
    winner_variant text,
    results jsonb DEFAULT '{}'::jsonb,
    ai_analysis jsonb DEFAULT '{}'::jsonb,
    ai_recommendations jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ab_tests_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'running'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT ab_tests_test_type_check CHECK ((test_type = ANY (ARRAY['subject_line'::text, 'content'::text, 'send_time'::text, 'call_script'::text, 'landing_page'::text, 'offer'::text])))
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    name text NOT NULL,
    website text,
    industry text,
    employee_count integer,
    annual_revenue numeric(15,2),
    address text,
    city text,
    state text,
    zip_code text,
    business_type text,
    tax_id text,
    duns_number text,
    current_carriers jsonb DEFAULT '{}'::jsonb,
    policy_renewal_dates jsonb DEFAULT '{}'::jsonb,
    risk_profile jsonb DEFAULT '{}'::jsonb,
    summary_embedding extensions.vector(1024),
    ai_risk_score integer,
    ai_lifetime_value numeric(15,2),
    ai_insights jsonb DEFAULT '{}'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    tags text[],
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT accounts_ai_risk_score_check CHECK (((ai_risk_score >= 0) AND (ai_risk_score <= 100))),
    CONSTRAINT chk_accounts_valid_risk_score CHECK (((ai_risk_score IS NULL) OR ((ai_risk_score >= 0) AND (ai_risk_score <= 100))))
);


--
-- Name: campaign_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    ab_test_id uuid,
    contact_id uuid NOT NULL,
    account_id uuid,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    responded_at timestamp with time zone,
    converted_at timestamp with time zone,
    variant_shown text,
    conversion_value numeric(12,2),
    attribution_weight numeric(5,4) DEFAULT 1.0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: campaign_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    ab_test_id uuid,
    contact_id uuid NOT NULL,
    account_id uuid,
    variant_assigned text,
    assigned_at timestamp with time zone DEFAULT now(),
    is_current boolean DEFAULT true,
    ended_at timestamp with time zone,
    end_reason text,
    excluded boolean DEFAULT false,
    exclusion_reason text,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: campaign_transitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_transitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    from_campaign_id uuid,
    to_campaign_id uuid NOT NULL,
    transition_reason text NOT NULL,
    transition_data jsonb DEFAULT '{}'::jsonb,
    transitioned_at timestamp with time zone DEFAULT now(),
    transitioned_by uuid
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    campaign_type text NOT NULL,
    objective text,
    audience_criteria jsonb DEFAULT '{}'::jsonb,
    exclusion_criteria jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'draft'::text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    budget numeric(12,2),
    target_metrics jsonb DEFAULT '{}'::jsonb,
    ai_optimization_enabled boolean DEFAULT false,
    automation_rules jsonb DEFAULT '{}'::jsonb,
    total_targeted integer DEFAULT 0,
    total_sent integer DEFAULT 0,
    total_delivered integer DEFAULT 0,
    total_opened integer DEFAULT 0,
    total_clicked integer DEFAULT 0,
    total_converted integer DEFAULT 0,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaigns_campaign_type_check CHECK ((campaign_type = ANY (ARRAY['email'::text, 'sms'::text, 'phone'::text, 'social'::text, 'direct_mail'::text, 'multi_channel'::text, 'ai_automated'::text, 'ai_nurture'::text, 'on_hold'::text, 'reengagement'::text]))),
    CONSTRAINT campaigns_objective_check CHECK ((objective = ANY (ARRAY['lead_generation'::text, 'nurture'::text, 'conversion'::text, 'retention'::text, 'winback'::text, 'ai_qualification'::text, 'ai_nurture'::text, 'hold_management'::text, 'reengagement'::text]))),
    CONSTRAINT campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    account_id uuid,
    first_name text,
    last_name text,
    email text,
    phone text,
    mobile_phone text,
    address text,
    city text,
    state text,
    zip_code text,
    date_of_birth date,
    gender text,
    marital_status text,
    occupation text,
    job_title text,
    department text,
    drivers_license text,
    license_state text,
    ssn_last_four text,
    lifecycle_stage public.contact_lifecycle_stage DEFAULT 'lead'::public.contact_lifecycle_stage NOT NULL,
    lead_source text,
    referred_by uuid,
    summary_embedding extensions.vector(1024),
    ai_risk_score integer,
    ai_lifetime_value numeric(15,2),
    ai_churn_probability numeric(5,2),
    ai_insights jsonb DEFAULT '{}'::jsonb,
    preferred_contact_method text DEFAULT 'email'::text,
    communication_preferences jsonb DEFAULT '{}'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    tags text[],
    last_contact_at timestamp with time zone,
    next_contact_at timestamp with time zone,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    current_campaign_id uuid,
    campaign_assigned_at timestamp with time zone DEFAULT now(),
    hold_until timestamp with time zone,
    hold_reason text,
    hold_requested_by text,
    hold_notes text,
    auto_reengagement_enabled boolean DEFAULT true,
    CONSTRAINT chk_contacts_valid_churn_probability CHECK (((ai_churn_probability IS NULL) OR ((ai_churn_probability >= (0)::numeric) AND (ai_churn_probability <= (100)::numeric)))),
    CONSTRAINT chk_contacts_valid_risk_score CHECK (((ai_risk_score IS NULL) OR ((ai_risk_score >= 0) AND (ai_risk_score <= 100)))),
    CONSTRAINT contacts_ai_churn_probability_check CHECK (((ai_churn_probability >= (0)::numeric) AND (ai_churn_probability <= (100)::numeric))),
    CONSTRAINT contacts_ai_risk_score_check CHECK (((ai_risk_score >= 0) AND (ai_risk_score <= 100))),
    CONSTRAINT contacts_hold_requested_by_check CHECK ((hold_requested_by = ANY (ARRAY['customer'::text, 'agent'::text, 'compliance'::text]))),
    CONSTRAINT contacts_preferred_contact_method_check CHECK ((preferred_contact_method = ANY (ARRAY['email'::text, 'phone'::text, 'sms'::text, 'mail'::text])))
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size_bytes bigint,
    mime_type text,
    file_hash text,
    contact_id uuid,
    account_id uuid,
    opportunity_id uuid,
    uploaded_by_id uuid,
    document_type text,
    embedding extensions.vector(1024),
    ai_extracted_text text,
    ai_summary text,
    ai_document_classification jsonb DEFAULT '{}'::jsonb,
    ai_key_entities jsonb DEFAULT '[]'::jsonb,
    tags text[],
    is_confidential boolean DEFAULT false,
    retention_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT documents_document_type_check CHECK ((document_type = ANY (ARRAY['quote'::text, 'policy'::text, 'application'::text, 'claim'::text, 'correspondence'::text, 'other'::text])))
);


--
-- Name: insurance_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_types (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    is_active boolean DEFAULT true,
    description text,
    icon_name text,
    form_schema jsonb DEFAULT '{}'::jsonb,
    required_fields text[] DEFAULT '{}'::text[],
    optional_fields text[] DEFAULT '{}'::text[],
    ai_prompt_template text,
    ai_risk_factors jsonb DEFAULT '{}'::jsonb,
    ai_pricing_factors jsonb DEFAULT '{}'::jsonb,
    display_order integer,
    color_hex text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT insurance_types_category_check CHECK ((category = ANY (ARRAY['personal'::text, 'commercial'::text, 'specialty'::text])))
);


--
-- Name: insurance_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurance_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurance_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurance_types_id_seq OWNED BY public.insurance_types.id;


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    contact_id uuid,
    account_id uuid,
    opportunity_id uuid,
    user_id uuid,
    type public.interaction_type NOT NULL,
    subject text,
    content text,
    direction text,
    duration_minutes integer,
    outcome text,
    sentiment text,
    embedding extensions.vector(1024),
    ai_summary text,
    ai_sentiment_score numeric(3,2),
    ai_entities jsonb DEFAULT '[]'::jsonb,
    ai_action_items jsonb DEFAULT '[]'::jsonb,
    ai_follow_up_suggestions jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    external_id text,
    interacted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT interactions_ai_sentiment_score_check CHECK (((ai_sentiment_score >= ('-1'::integer)::numeric) AND (ai_sentiment_score <= (1)::numeric))),
    CONSTRAINT interactions_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
    CONSTRAINT interactions_sentiment_check CHECK ((sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])))
)
PARTITION BY RANGE (interacted_at);


--
-- Name: interactions_2025_08; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions_2025_08 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    contact_id uuid,
    account_id uuid,
    opportunity_id uuid,
    user_id uuid,
    type public.interaction_type NOT NULL,
    subject text,
    content text,
    direction text,
    duration_minutes integer,
    outcome text,
    sentiment text,
    embedding extensions.vector(1024),
    ai_summary text,
    ai_sentiment_score numeric(3,2),
    ai_entities jsonb DEFAULT '[]'::jsonb,
    ai_action_items jsonb DEFAULT '[]'::jsonb,
    ai_follow_up_suggestions jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    external_id text,
    interacted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT interactions_ai_sentiment_score_check CHECK (((ai_sentiment_score >= ('-1'::integer)::numeric) AND (ai_sentiment_score <= (1)::numeric))),
    CONSTRAINT interactions_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
    CONSTRAINT interactions_sentiment_check CHECK ((sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])))
);


--
-- Name: interactions_2025_09; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions_2025_09 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    contact_id uuid,
    account_id uuid,
    opportunity_id uuid,
    user_id uuid,
    type public.interaction_type NOT NULL,
    subject text,
    content text,
    direction text,
    duration_minutes integer,
    outcome text,
    sentiment text,
    embedding extensions.vector(1024),
    ai_summary text,
    ai_sentiment_score numeric(3,2),
    ai_entities jsonb DEFAULT '[]'::jsonb,
    ai_action_items jsonb DEFAULT '[]'::jsonb,
    ai_follow_up_suggestions jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    external_id text,
    interacted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT interactions_ai_sentiment_score_check CHECK (((ai_sentiment_score >= ('-1'::integer)::numeric) AND (ai_sentiment_score <= (1)::numeric))),
    CONSTRAINT interactions_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
    CONSTRAINT interactions_sentiment_check CHECK ((sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])))
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    contact_id uuid,
    account_id uuid,
    opportunity_id uuid,
    user_id uuid NOT NULL,
    title text,
    content text NOT NULL,
    note_type text DEFAULT 'general'::text,
    embedding extensions.vector(1024),
    ai_summary text,
    ai_tags text[],
    is_private boolean DEFAULT false,
    tags text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_note_has_target CHECK (((contact_id IS NOT NULL) OR (account_id IS NOT NULL) OR (opportunity_id IS NOT NULL))),
    CONSTRAINT notes_note_type_check CHECK ((note_type = ANY (ARRAY['general'::text, 'meeting'::text, 'call'::text, 'research'::text, 'follow_up'::text])))
);


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    name text NOT NULL,
    account_id uuid,
    contact_id uuid,
    stage public.opportunity_stage DEFAULT 'start'::public.opportunity_stage NOT NULL,
    amount numeric(12,2),
    probability integer DEFAULT 50,
    close_date date,
    insurance_types text[],
    policy_term integer DEFAULT 12,
    effective_date date,
    expiration_date date,
    premium_breakdown jsonb DEFAULT '{}'::jsonb,
    coverage_details jsonb DEFAULT '{}'::jsonb,
    competing_carriers text[],
    current_carrier text,
    current_premium numeric(10,2),
    ai_win_probability numeric(5,2),
    ai_recommended_actions jsonb DEFAULT '[]'::jsonb,
    ai_risk_factors jsonb DEFAULT '[]'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    tags text[],
    notes text,
    owner_id uuid,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    stage_changed_at timestamp with time zone DEFAULT now(),
    campaign_id uuid,
    ab_test_id uuid,
    variant_shown text,
    contact_attempts integer DEFAULT 0,
    max_contact_attempts integer DEFAULT 7,
    last_contact_attempt timestamp with time zone,
    next_contact_date timestamp with time zone,
    paused_until timestamp with time zone,
    pause_duration_days integer DEFAULT 49,
    quote_sent_at timestamp with time zone,
    quote_response_at timestamp with time zone,
    maybe_followup_days integer DEFAULT 7,
    CONSTRAINT chk_opportunity_has_target CHECK (((account_id IS NOT NULL) OR (contact_id IS NOT NULL))),
    CONSTRAINT opportunities_probability_check CHECK (((probability >= 0) AND (probability <= 100)))
);


--
-- Name: opportunity_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity_participants (
    opportunity_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    role text,
    influence_level integer DEFAULT 50,
    CONSTRAINT opportunity_participants_influence_level_check CHECK (((influence_level >= 0) AND (influence_level <= 100)))
);


--
-- Name: pipelines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipelines (
    id integer NOT NULL,
    workspace_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    pipeline_type text DEFAULT 'sales'::text,
    insurance_category text,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    stages jsonb DEFAULT '[]'::jsonb,
    automation_rules jsonb DEFAULT '{}'::jsonb,
    ai_optimization_enabled boolean DEFAULT false,
    target_conversion_rate numeric(5,2),
    average_cycle_days integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pipelines_insurance_category_check CHECK ((insurance_category = ANY (ARRAY['personal'::text, 'commercial'::text, 'specialty'::text]))),
    CONSTRAINT pipelines_pipeline_type_check CHECK ((pipeline_type = ANY (ARRAY['sales'::text, 'service'::text, 'claims'::text, 'renewal'::text])))
);


--
-- Name: pipelines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pipelines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pipelines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pipelines_id_seq OWNED BY public.pipelines.id;


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    property_type text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    county text,
    year_built integer,
    square_feet integer,
    lot_size_acres numeric(8,2),
    stories integer,
    bedrooms integer,
    bathrooms numeric(3,1),
    construction_type text,
    roof_type text,
    roof_age integer,
    foundation_type text,
    exterior_walls text,
    heating_type text,
    cooling_type text,
    electrical_type text,
    plumbing_type text,
    smoke_detectors boolean DEFAULT false,
    fire_extinguishers boolean DEFAULT false,
    security_system boolean DEFAULT false,
    sprinkler_system boolean DEFAULT false,
    ownership_type text,
    occupancy_type text,
    mortgage_company text,
    distance_to_fire_station_miles numeric(5,2),
    distance_to_coast_miles numeric(5,2),
    flood_zone text,
    wildfire_risk text,
    earthquake_risk text,
    current_coverage jsonb DEFAULT '{}'::jsonb,
    claims_history jsonb DEFAULT '[]'::jsonb,
    replacement_cost numeric(12,2),
    market_value numeric(12,2),
    ai_risk_score integer,
    ai_risk_factors jsonb DEFAULT '[]'::jsonb,
    ai_replacement_cost_estimate numeric(12,2),
    custom_fields jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT properties_ai_risk_score_check CHECK (((ai_risk_score >= 0) AND (ai_risk_score <= 100))),
    CONSTRAINT properties_earthquake_risk_check CHECK ((earthquake_risk = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text]))),
    CONSTRAINT properties_ownership_type_check CHECK ((ownership_type = ANY (ARRAY['owner_occupied'::text, 'rental'::text, 'vacant'::text, 'seasonal'::text]))),
    CONSTRAINT properties_property_type_check CHECK ((property_type = ANY (ARRAY['single_family'::text, 'condo'::text, 'townhouse'::text, 'mobile_home'::text, 'rental'::text, 'commercial'::text]))),
    CONSTRAINT properties_wildfire_risk_check CHECK ((wildfire_risk = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text])))
);


--
-- Name: reengagement_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reengagement_schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    notification_type text,
    status text DEFAULT 'scheduled'::text,
    executed_at timestamp with time zone,
    notification_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reengagement_schedule_notification_type_check CHECK ((notification_type = ANY (ARRAY['email_reminder'::text, 'task_creation'::text, 'calendar_event'::text, 'ai_notification'::text]))),
    CONSTRAINT reengagement_schedule_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'executed'::text, 'cancelled'::text, 'failed'::text])))
);


--
-- Name: schema_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_versions (
    id integer NOT NULL,
    version text NOT NULL,
    description text,
    applied_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


--
-- Name: schema_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schema_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schema_versions_id_seq OWNED BY public.schema_versions.id;


--
-- Name: specialty_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialty_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    item_type text,
    name text NOT NULL,
    description text,
    brand text,
    model text,
    serial_number text,
    appraised_value numeric(12,2),
    purchase_price numeric(12,2),
    purchase_date date,
    appraisal_date date,
    appraiser_name text,
    has_receipt boolean DEFAULT false,
    has_appraisal boolean DEFAULT false,
    has_photos boolean DEFAULT false,
    certificate_number text,
    storage_location text,
    security_measures jsonb DEFAULT '[]'::jsonb,
    current_coverage jsonb DEFAULT '{}'::jsonb,
    claims_history jsonb DEFAULT '[]'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT specialty_items_item_type_check CHECK ((item_type = ANY (ARRAY['jewelry'::text, 'art'::text, 'collectibles'::text, 'electronics'::text, 'musical_instruments'::text, 'firearms'::text, 'other'::text])))
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    contact_id uuid,
    account_id uuid,
    opportunity_id uuid,
    task_type text DEFAULT 'follow_up'::text,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date date,
    due_time time without time zone,
    estimated_duration_minutes integer,
    assigned_to_id uuid,
    created_by_id uuid,
    ai_generated boolean DEFAULT false,
    ai_priority_score integer,
    ai_suggested_actions jsonb DEFAULT '[]'::jsonb,
    tags text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT tasks_ai_priority_score_check CHECK (((ai_priority_score >= 0) AND (ai_priority_score <= 100))),
    CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT tasks_task_type_check CHECK ((task_type = ANY (ARRAY['follow_up'::text, 'quote'::text, 'meeting'::text, 'call'::text, 'email'::text, 'research'::text])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    role text DEFAULT 'agent'::text NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    license_number text,
    license_state text,
    license_expiration date,
    specializations text[],
    timezone text DEFAULT 'America/Chicago'::text,
    notification_preferences jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'manager'::text, 'agent'::text, 'csr'::text])))
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    vin text,
    year integer,
    make text,
    model text,
    "trim" text,
    body_style text,
    license_plate text,
    registration_state text,
    registration_expiration date,
    ownership_type text,
    lienholder_name text,
    lienholder_address text,
    annual_mileage integer,
    primary_use text,
    garage_type text,
    safety_features jsonb DEFAULT '[]'::jsonb,
    anti_theft_devices jsonb DEFAULT '[]'::jsonb,
    modifications jsonb DEFAULT '[]'::jsonb,
    current_coverage jsonb DEFAULT '{}'::jsonb,
    claims_history jsonb DEFAULT '[]'::jsonb,
    ai_risk_score integer,
    ai_risk_factors jsonb DEFAULT '[]'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vehicles_ai_risk_score_check CHECK (((ai_risk_score >= 0) AND (ai_risk_score <= 100))),
    CONSTRAINT vehicles_garage_type_check CHECK ((garage_type = ANY (ARRAY['garage'::text, 'carport'::text, 'driveway'::text, 'street'::text]))),
    CONSTRAINT vehicles_ownership_type_check CHECK ((ownership_type = ANY (ARRAY['owned'::text, 'financed'::text, 'leased'::text]))),
    CONSTRAINT vehicles_primary_use_check CHECK ((primary_use = ANY (ARRAY['pleasure'::text, 'commute'::text, 'business'::text, 'farm'::text])))
);


--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    agency_license text,
    agency_type text,
    primary_lines jsonb DEFAULT '[]'::jsonb,
    timezone text DEFAULT 'America/Chicago'::text,
    date_format text DEFAULT 'MM/DD/YYYY'::text,
    currency text DEFAULT 'USD'::text,
    subscription_tier text DEFAULT 'basic'::text,
    max_users integer DEFAULT 5,
    max_contacts integer DEFAULT 1000,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workspaces_agency_type_check CHECK ((agency_type = ANY (ARRAY['Independent'::text, 'Captive'::text, 'Direct'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2025_08_11; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_11 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_12; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_12 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_13; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_13 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_14; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_14 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_15; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_15 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_16; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_16 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_17; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_17 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: interactions_2025_08; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions ATTACH PARTITION public.interactions_2025_08 FOR VALUES FROM ('2025-08-01 00:00:00+00') TO ('2025-09-01 00:00:00+00');


--
-- Name: interactions_2025_09; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions ATTACH PARTITION public.interactions_2025_09 FOR VALUES FROM ('2025-09-01 00:00:00+00') TO ('2025-10-01 00:00:00+00');


--
-- Name: messages_2025_08_11; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_11 FOR VALUES FROM ('2025-08-11 00:00:00') TO ('2025-08-12 00:00:00');


--
-- Name: messages_2025_08_12; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_12 FOR VALUES FROM ('2025-08-12 00:00:00') TO ('2025-08-13 00:00:00');


--
-- Name: messages_2025_08_13; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_13 FOR VALUES FROM ('2025-08-13 00:00:00') TO ('2025-08-14 00:00:00');


--
-- Name: messages_2025_08_14; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_14 FOR VALUES FROM ('2025-08-14 00:00:00') TO ('2025-08-15 00:00:00');


--
-- Name: messages_2025_08_15; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_15 FOR VALUES FROM ('2025-08-15 00:00:00') TO ('2025-08-16 00:00:00');


--
-- Name: messages_2025_08_16; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_16 FOR VALUES FROM ('2025-08-16 00:00:00') TO ('2025-08-17 00:00:00');


--
-- Name: messages_2025_08_17; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_17 FOR VALUES FROM ('2025-08-17 00:00:00') TO ('2025-08-18 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: insurance_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_types ALTER COLUMN id SET DEFAULT nextval('public.insurance_types_id_seq'::regclass);


--
-- Name: pipelines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines ALTER COLUMN id SET DEFAULT nextval('public.pipelines_id_seq'::regclass);


--
-- Name: schema_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_versions ALTER COLUMN id SET DEFAULT nextval('public.schema_versions_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ab_tests ab_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ab_tests
    ADD CONSTRAINT ab_tests_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: campaign_metrics campaign_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_metrics
    ADD CONSTRAINT campaign_metrics_pkey PRIMARY KEY (id);


--
-- Name: campaign_participants campaign_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_pkey PRIMARY KEY (id);


--
-- Name: campaign_transitions campaign_transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_transitions
    ADD CONSTRAINT campaign_transitions_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: insurance_types insurance_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_types
    ADD CONSTRAINT insurance_types_name_key UNIQUE (name);


--
-- Name: insurance_types insurance_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_types
    ADD CONSTRAINT insurance_types_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id, interacted_at);


--
-- Name: interactions_2025_08 interactions_2025_08_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions_2025_08
    ADD CONSTRAINT interactions_2025_08_pkey PRIMARY KEY (id, interacted_at);


--
-- Name: interactions_2025_09 interactions_2025_09_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions_2025_09
    ADD CONSTRAINT interactions_2025_09_pkey PRIMARY KEY (id, interacted_at);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: opportunity_participants opportunity_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_participants
    ADD CONSTRAINT opportunity_participants_pkey PRIMARY KEY (opportunity_id, contact_id);


--
-- Name: pipelines pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: reengagement_schedule reengagement_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reengagement_schedule
    ADD CONSTRAINT reengagement_schedule_pkey PRIMARY KEY (id);


--
-- Name: schema_versions schema_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_versions
    ADD CONSTRAINT schema_versions_pkey PRIMARY KEY (id);


--
-- Name: schema_versions schema_versions_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_versions
    ADD CONSTRAINT schema_versions_version_key UNIQUE (version);


--
-- Name: specialty_items specialty_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialty_items
    ADD CONSTRAINT specialty_items_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: contacts unique_contact_email_in_workspace; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT unique_contact_email_in_workspace UNIQUE (workspace_id, email) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: campaign_participants unique_current_campaign_per_contact; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT unique_current_campaign_per_contact UNIQUE (contact_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_11 messages_2025_08_11_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_11
    ADD CONSTRAINT messages_2025_08_11_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_12 messages_2025_08_12_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_12
    ADD CONSTRAINT messages_2025_08_12_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_13 messages_2025_08_13_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_13
    ADD CONSTRAINT messages_2025_08_13_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_14 messages_2025_08_14_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_14
    ADD CONSTRAINT messages_2025_08_14_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_15 messages_2025_08_15_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_15
    ADD CONSTRAINT messages_2025_08_15_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_16 messages_2025_08_16_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_16
    ADD CONSTRAINT messages_2025_08_16_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_17 messages_2025_08_17_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_17
    ADD CONSTRAINT messages_2025_08_17_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_ab_tests_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ab_tests_campaign_id ON public.ab_tests USING btree (campaign_id);


--
-- Name: idx_ab_tests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ab_tests_status ON public.ab_tests USING btree (status);


--
-- Name: idx_ab_tests_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ab_tests_workspace_id ON public.ab_tests USING btree (workspace_id);


--
-- Name: idx_accounts_industry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_industry ON public.accounts USING btree (industry);


--
-- Name: idx_accounts_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_name ON public.accounts USING btree (workspace_id, name);


--
-- Name: idx_accounts_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_owner_id ON public.accounts USING btree (owner_id);


--
-- Name: idx_accounts_summary_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_summary_embedding_hnsw ON public.accounts USING hnsw (summary_embedding extensions.vector_ip_ops) WITH (m='32', ef_construction='128');


--
-- Name: idx_accounts_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_workspace_id ON public.accounts USING btree (workspace_id);


--
-- Name: idx_campaign_metrics_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_metrics_campaign_id ON public.campaign_metrics USING btree (campaign_id);


--
-- Name: idx_campaign_metrics_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_metrics_contact_id ON public.campaign_metrics USING btree (contact_id);


--
-- Name: idx_campaign_metrics_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_metrics_workspace_id ON public.campaign_metrics USING btree (workspace_id);


--
-- Name: idx_campaign_participants_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_participants_account_id ON public.campaign_participants USING btree (account_id);


--
-- Name: idx_campaign_participants_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_participants_campaign_id ON public.campaign_participants USING btree (campaign_id);


--
-- Name: idx_campaign_participants_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_participants_contact_id ON public.campaign_participants USING btree (contact_id);


--
-- Name: idx_campaign_participants_is_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_participants_is_current ON public.campaign_participants USING btree (contact_id) WHERE (is_current = true);


--
-- Name: idx_campaign_participants_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_participants_workspace_id ON public.campaign_participants USING btree (workspace_id);


--
-- Name: idx_campaign_transitions_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_transitions_contact_id ON public.campaign_transitions USING btree (contact_id);


--
-- Name: idx_campaign_transitions_from_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_transitions_from_campaign ON public.campaign_transitions USING btree (from_campaign_id);


--
-- Name: idx_campaign_transitions_to_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_transitions_to_campaign ON public.campaign_transitions USING btree (to_campaign_id);


--
-- Name: idx_campaign_transitions_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_transitions_workspace_id ON public.campaign_transitions USING btree (workspace_id);


--
-- Name: idx_campaigns_campaign_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_campaign_type ON public.campaigns USING btree (campaign_type);


--
-- Name: idx_campaigns_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_owner_id ON public.campaigns USING btree (owner_id);


--
-- Name: idx_campaigns_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_start_date ON public.campaigns USING btree (start_date);


--
-- Name: idx_campaigns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status);


--
-- Name: idx_campaigns_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_workspace_id ON public.campaigns USING btree (workspace_id);


--
-- Name: idx_contacts_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_account_id ON public.contacts USING btree (account_id);


--
-- Name: idx_contacts_campaign_assigned_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_campaign_assigned_at ON public.contacts USING btree (campaign_assigned_at);


--
-- Name: idx_contacts_current_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_current_campaign_id ON public.contacts USING btree (current_campaign_id);


--
-- Name: idx_contacts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_email ON public.contacts USING btree (workspace_id, email);


--
-- Name: idx_contacts_hold_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_hold_until ON public.contacts USING btree (hold_until) WHERE (lifecycle_stage = 'on_hold'::public.contact_lifecycle_stage);


--
-- Name: idx_contacts_lifecycle_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_lifecycle_stage ON public.contacts USING btree (lifecycle_stage);


--
-- Name: idx_contacts_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_name ON public.contacts USING btree (workspace_id, first_name, last_name);


--
-- Name: idx_contacts_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_owner_id ON public.contacts USING btree (owner_id);


--
-- Name: idx_contacts_summary_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_summary_embedding_hnsw ON public.contacts USING hnsw (summary_embedding extensions.vector_ip_ops) WITH (m='32', ef_construction='128');


--
-- Name: idx_contacts_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_workspace_id ON public.contacts USING btree (workspace_id);


--
-- Name: idx_contacts_workspace_lifecycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_workspace_lifecycle ON public.contacts USING btree (workspace_id, lifecycle_stage, created_at DESC);


--
-- Name: idx_documents_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_account_id ON public.documents USING btree (account_id, created_at DESC);


--
-- Name: idx_documents_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_contact_id ON public.documents USING btree (contact_id, created_at DESC);


--
-- Name: idx_documents_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_embedding_hnsw ON public.documents USING hnsw (embedding extensions.vector_ip_ops) WITH (m='32', ef_construction='128');


--
-- Name: idx_documents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_type ON public.documents USING btree (workspace_id, document_type, created_at DESC);


--
-- Name: idx_documents_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_workspace_id ON public.documents USING btree (workspace_id);


--
-- Name: idx_interactions_2025_08_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_2025_08_account ON public.interactions_2025_08 USING btree (account_id, interacted_at DESC);


--
-- Name: idx_interactions_2025_08_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_2025_08_embedding_hnsw ON public.interactions_2025_08 USING hnsw (embedding extensions.vector_ip_ops) WITH (m='32', ef_construction='128');


--
-- Name: idx_interactions_2025_08_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_2025_08_type ON public.interactions_2025_08 USING btree (workspace_id, type, interacted_at DESC);


--
-- Name: idx_interactions_2025_08_workspace_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_2025_08_workspace_contact ON public.interactions_2025_08 USING btree (workspace_id, contact_id, interacted_at DESC);


--
-- Name: idx_interactions_2025_09_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_2025_09_account ON public.interactions_2025_09 USING btree (account_id, interacted_at DESC);


--
-- Name: idx_interactions_2025_09_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_2025_09_embedding_hnsw ON public.interactions_2025_09 USING hnsw (embedding extensions.vector_ip_ops) WITH (m='32', ef_construction='128');


--
-- Name: idx_interactions_2025_09_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_2025_09_type ON public.interactions_2025_09 USING btree (workspace_id, type, interacted_at DESC);


--
-- Name: idx_interactions_2025_09_workspace_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_2025_09_workspace_contact ON public.interactions_2025_09 USING btree (workspace_id, contact_id, interacted_at DESC);


--
-- Name: idx_notes_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_account_id ON public.notes USING btree (account_id, created_at DESC);


--
-- Name: idx_notes_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_contact_id ON public.notes USING btree (contact_id, created_at DESC);


--
-- Name: idx_notes_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_embedding_hnsw ON public.notes USING hnsw (embedding extensions.vector_ip_ops) WITH (m='32', ef_construction='128');


--
-- Name: idx_notes_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_workspace_id ON public.notes USING btree (workspace_id);


--
-- Name: idx_opp_participants_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opp_participants_contact_id ON public.opportunity_participants USING btree (contact_id);


--
-- Name: idx_opp_participants_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opp_participants_workspace_id ON public.opportunity_participants USING btree (workspace_id);


--
-- Name: idx_opportunities_ab_test_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_ab_test_id ON public.opportunities USING btree (ab_test_id);


--
-- Name: idx_opportunities_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_account_id ON public.opportunities USING btree (account_id);


--
-- Name: idx_opportunities_amount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_amount ON public.opportunities USING btree (workspace_id, amount DESC);


--
-- Name: idx_opportunities_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_campaign_id ON public.opportunities USING btree (campaign_id);


--
-- Name: idx_opportunities_contact_attempts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_contact_attempts ON public.opportunities USING btree (contact_attempts);


--
-- Name: idx_opportunities_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_contact_id ON public.opportunities USING btree (contact_id);


--
-- Name: idx_opportunities_next_contact_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_next_contact_date ON public.opportunities USING btree (next_contact_date) WHERE (next_contact_date IS NOT NULL);


--
-- Name: idx_opportunities_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_owner_id ON public.opportunities USING btree (owner_id);


--
-- Name: idx_opportunities_paused_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_paused_until ON public.opportunities USING btree (paused_until) WHERE (paused_until IS NOT NULL);


--
-- Name: idx_opportunities_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_stage ON public.opportunities USING btree (workspace_id, stage, close_date);


--
-- Name: idx_opportunities_stage_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_stage_changed_at ON public.opportunities USING btree (stage_changed_at);


--
-- Name: idx_opportunities_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_workspace_id ON public.opportunities USING btree (workspace_id);


--
-- Name: idx_properties_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_address ON public.properties USING btree (workspace_id, address);


--
-- Name: idx_properties_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_contact_id ON public.properties USING btree (contact_id);


--
-- Name: idx_properties_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_workspace_id ON public.properties USING btree (workspace_id);


--
-- Name: idx_reengagement_schedule_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reengagement_schedule_contact_id ON public.reengagement_schedule USING btree (contact_id);


--
-- Name: idx_reengagement_schedule_scheduled_for; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reengagement_schedule_scheduled_for ON public.reengagement_schedule USING btree (scheduled_for) WHERE (status = 'scheduled'::text);


--
-- Name: idx_reengagement_schedule_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reengagement_schedule_workspace_id ON public.reengagement_schedule USING btree (workspace_id);


--
-- Name: idx_specialty_items_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_specialty_items_contact_id ON public.specialty_items USING btree (contact_id);


--
-- Name: idx_specialty_items_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_specialty_items_type ON public.specialty_items USING btree (workspace_id, item_type);


--
-- Name: idx_specialty_items_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_specialty_items_workspace_id ON public.specialty_items USING btree (workspace_id);


--
-- Name: idx_tasks_assigned_to_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_assigned_to_pending ON public.tasks USING btree (assigned_to_id, due_date) WHERE (status = 'pending'::text);


--
-- Name: idx_tasks_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_contact_id ON public.tasks USING btree (contact_id, created_at DESC);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (workspace_id, due_date) WHERE (status = ANY (ARRAY['pending'::text, 'in_progress'::text]));


--
-- Name: idx_tasks_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_workspace_id ON public.tasks USING btree (workspace_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_workspace_id ON public.users USING btree (workspace_id);


--
-- Name: idx_vehicles_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_contact_id ON public.vehicles USING btree (contact_id);


--
-- Name: idx_vehicles_vin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_vin ON public.vehicles USING btree (vin) WHERE (vin IS NOT NULL);


--
-- Name: idx_vehicles_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_workspace_id ON public.vehicles USING btree (workspace_id);


--
-- Name: idx_workspaces_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workspaces_name ON public.workspaces USING btree (name);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: interactions_2025_08_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.interactions_pkey ATTACH PARTITION public.interactions_2025_08_pkey;


--
-- Name: interactions_2025_09_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.interactions_pkey ATTACH PARTITION public.interactions_2025_09_pkey;


--
-- Name: messages_2025_08_11_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_11_pkey;


--
-- Name: messages_2025_08_12_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_12_pkey;


--
-- Name: messages_2025_08_13_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_13_pkey;


--
-- Name: messages_2025_08_14_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_14_pkey;


--
-- Name: messages_2025_08_15_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_15_pkey;


--
-- Name: messages_2025_08_16_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_16_pkey;


--
-- Name: messages_2025_08_17_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_17_pkey;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: contacts trigger_assign_lead_to_campaign; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_assign_lead_to_campaign BEFORE INSERT OR UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.assign_lead_to_campaign();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: ab_tests ab_tests_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ab_tests
    ADD CONSTRAINT ab_tests_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: ab_tests ab_tests_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ab_tests
    ADD CONSTRAINT ab_tests_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: accounts accounts_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: accounts accounts_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: campaign_metrics campaign_metrics_ab_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_metrics
    ADD CONSTRAINT campaign_metrics_ab_test_id_fkey FOREIGN KEY (ab_test_id) REFERENCES public.ab_tests(id);


--
-- Name: campaign_metrics campaign_metrics_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_metrics
    ADD CONSTRAINT campaign_metrics_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: campaign_metrics campaign_metrics_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_metrics
    ADD CONSTRAINT campaign_metrics_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_metrics campaign_metrics_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_metrics
    ADD CONSTRAINT campaign_metrics_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: campaign_metrics campaign_metrics_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_metrics
    ADD CONSTRAINT campaign_metrics_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: campaign_participants campaign_participants_ab_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_ab_test_id_fkey FOREIGN KEY (ab_test_id) REFERENCES public.ab_tests(id) ON DELETE SET NULL;


--
-- Name: campaign_participants campaign_participants_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: campaign_participants campaign_participants_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_participants campaign_participants_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: campaign_participants campaign_participants_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: campaign_transitions campaign_transitions_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_transitions
    ADD CONSTRAINT campaign_transitions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: campaign_transitions campaign_transitions_from_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_transitions
    ADD CONSTRAINT campaign_transitions_from_campaign_id_fkey FOREIGN KEY (from_campaign_id) REFERENCES public.campaigns(id);


--
-- Name: campaign_transitions campaign_transitions_to_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_transitions
    ADD CONSTRAINT campaign_transitions_to_campaign_id_fkey FOREIGN KEY (to_campaign_id) REFERENCES public.campaigns(id);


--
-- Name: campaign_transitions campaign_transitions_transitioned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_transitions
    ADD CONSTRAINT campaign_transitions_transitioned_by_fkey FOREIGN KEY (transitioned_by) REFERENCES public.users(id);


--
-- Name: campaign_transitions campaign_transitions_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_transitions
    ADD CONSTRAINT campaign_transitions_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: campaigns campaigns_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: campaigns campaigns_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.contacts(id);


--
-- Name: contacts contacts_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: documents documents_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: documents documents_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: documents documents_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: documents documents_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documents documents_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: contacts fk_contacts_current_campaign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT fk_contacts_current_campaign FOREIGN KEY (current_campaign_id) REFERENCES public.campaigns(id);


--
-- Name: notes notes_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: notes notes_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: notes notes_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notes notes_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_ab_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_ab_test_id_fkey FOREIGN KEY (ab_test_id) REFERENCES public.ab_tests(id);


--
-- Name: opportunities opportunities_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: opportunities opportunities_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: opportunities opportunities_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: opportunity_participants opportunity_participants_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_participants
    ADD CONSTRAINT opportunity_participants_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: opportunity_participants opportunity_participants_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_participants
    ADD CONSTRAINT opportunity_participants_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: opportunity_participants opportunity_participants_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_participants
    ADD CONSTRAINT opportunity_participants_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: pipelines pipelines_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: properties properties_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: properties properties_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: reengagement_schedule reengagement_schedule_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reengagement_schedule
    ADD CONSTRAINT reengagement_schedule_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: reengagement_schedule reengagement_schedule_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reengagement_schedule
    ADD CONSTRAINT reengagement_schedule_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: reengagement_schedule reengagement_schedule_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reengagement_schedule
    ADD CONSTRAINT reengagement_schedule_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: specialty_items specialty_items_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialty_items
    ADD CONSTRAINT specialty_items_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: specialty_items specialty_items_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialty_items
    ADD CONSTRAINT specialty_items_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: users users_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: pipelines Admins can manage pipelines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pipelines" ON public.pipelines USING (((workspace_id = public.get_user_workspace_id()) AND public.is_workspace_admin()));


--
-- Name: users Admins can manage workspace users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage workspace users" ON public.users USING (((workspace_id = public.get_user_workspace_id()) AND public.is_workspace_admin()));


--
-- Name: ab_tests Users can create ab_tests in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create ab_tests in their workspace" ON public.ab_tests FOR INSERT WITH CHECK ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: accounts Users can create accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create accounts" ON public.accounts FOR INSERT WITH CHECK ((workspace_id = public.get_user_workspace_id()));


--
-- Name: campaign_metrics Users can create campaign_metrics in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create campaign_metrics in their workspace" ON public.campaign_metrics FOR INSERT WITH CHECK ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaign_participants Users can create campaign_participants in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create campaign_participants in their workspace" ON public.campaign_participants FOR INSERT WITH CHECK ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaign_transitions Users can create campaign_transitions in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create campaign_transitions in their workspace" ON public.campaign_transitions FOR INSERT WITH CHECK ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaigns Users can create campaigns in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create campaigns in their workspace" ON public.campaigns FOR INSERT WITH CHECK ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: contacts Users can create contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create contacts" ON public.contacts FOR INSERT WITH CHECK ((workspace_id = public.get_user_workspace_id()));


--
-- Name: interactions Users can create interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create interactions" ON public.interactions FOR INSERT WITH CHECK ((workspace_id = public.get_user_workspace_id()));


--
-- Name: notes Users can create notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create notes" ON public.notes FOR INSERT WITH CHECK ((workspace_id = public.get_user_workspace_id()));


--
-- Name: opportunities Users can create opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create opportunities" ON public.opportunities FOR INSERT WITH CHECK ((workspace_id = public.get_user_workspace_id()));


--
-- Name: reengagement_schedule Users can create reengagement_schedule in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reengagement_schedule in their workspace" ON public.reengagement_schedule FOR INSERT WITH CHECK ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: tasks Users can create tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK ((workspace_id = public.get_user_workspace_id()));


--
-- Name: ab_tests Users can delete ab_tests in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete ab_tests in their workspace" ON public.ab_tests FOR DELETE USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaigns Users can delete campaigns in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete campaigns in their workspace" ON public.campaigns FOR DELETE USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: accounts Users can delete owned accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete owned accounts" ON public.accounts FOR DELETE USING (((workspace_id = public.get_user_workspace_id()) AND ((owner_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: contacts Users can delete owned contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete owned contacts" ON public.contacts FOR DELETE USING (((workspace_id = public.get_user_workspace_id()) AND ((owner_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: opportunities Users can delete owned opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete owned opportunities" ON public.opportunities FOR DELETE USING (((workspace_id = public.get_user_workspace_id()) AND ((owner_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: opportunity_participants Users can manage participants for owned opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage participants for owned opportunities" ON public.opportunity_participants USING (((workspace_id = public.get_user_workspace_id()) AND (opportunity_id IN ( SELECT opportunities.id
   FROM public.opportunities
  WHERE ((opportunities.owner_id = auth.uid()) OR public.is_workspace_admin())))));


--
-- Name: properties Users can manage properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage properties" ON public.properties USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: specialty_items Users can manage specialty items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage specialty items" ON public.specialty_items USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: vehicles Users can manage vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage vehicles" ON public.vehicles USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: ab_tests Users can update ab_tests in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update ab_tests in their workspace" ON public.ab_tests FOR UPDATE USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: tasks Users can update assigned tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update assigned tasks" ON public.tasks FOR UPDATE USING (((workspace_id = public.get_user_workspace_id()) AND ((assigned_to_id = auth.uid()) OR (created_by_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: campaign_metrics Users can update campaign_metrics in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update campaign_metrics in their workspace" ON public.campaign_metrics FOR UPDATE USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaign_participants Users can update campaign_participants in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update campaign_participants in their workspace" ON public.campaign_participants FOR UPDATE USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaigns Users can update campaigns in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update campaigns in their workspace" ON public.campaigns FOR UPDATE USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: documents Users can update own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (((workspace_id = public.get_user_workspace_id()) AND ((uploaded_by_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: interactions Users can update own interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own interactions" ON public.interactions FOR UPDATE USING (((workspace_id = public.get_user_workspace_id()) AND ((user_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: notes Users can update own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (((workspace_id = public.get_user_workspace_id()) AND ((user_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING ((id = auth.uid()));


--
-- Name: accounts Users can update owned accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update owned accounts" ON public.accounts FOR UPDATE USING (((workspace_id = public.get_user_workspace_id()) AND ((owner_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: contacts Users can update owned contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update owned contacts" ON public.contacts FOR UPDATE USING (((workspace_id = public.get_user_workspace_id()) AND ((owner_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: opportunities Users can update owned opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update owned opportunities" ON public.opportunities FOR UPDATE USING (((workspace_id = public.get_user_workspace_id()) AND ((owner_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: reengagement_schedule Users can update reengagement_schedule in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update reengagement_schedule in their workspace" ON public.reengagement_schedule FOR UPDATE USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: documents Users can upload documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload documents" ON public.documents FOR INSERT WITH CHECK ((workspace_id = public.get_user_workspace_id()));


--
-- Name: ab_tests Users can view ab_tests in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view ab_tests in their workspace" ON public.ab_tests FOR SELECT USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaign_metrics Users can view campaign_metrics in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view campaign_metrics in their workspace" ON public.campaign_metrics FOR SELECT USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaign_participants Users can view campaign_participants in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view campaign_participants in their workspace" ON public.campaign_participants FOR SELECT USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaign_transitions Users can view campaign_transitions in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view campaign_transitions in their workspace" ON public.campaign_transitions FOR SELECT USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: campaigns Users can view campaigns in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view campaigns in their workspace" ON public.campaigns FOR SELECT USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: insurance_types Users can view insurance types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view insurance types" ON public.insurance_types FOR SELECT USING (true);


--
-- Name: reengagement_schedule Users can view reengagement_schedule in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view reengagement_schedule in their workspace" ON public.reengagement_schedule FOR SELECT USING ((workspace_id = ( SELECT users.workspace_id
   FROM public.users
  WHERE (users.id = auth.uid()))));


--
-- Name: workspaces Users can view their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their workspace" ON public.workspaces FOR SELECT USING ((id = public.get_user_workspace_id()));


--
-- Name: accounts Users can view workspace accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace accounts" ON public.accounts FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: contacts Users can view workspace contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace contacts" ON public.contacts FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: documents Users can view workspace documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace documents" ON public.documents FOR SELECT USING (((workspace_id = public.get_user_workspace_id()) AND ((NOT is_confidential) OR (uploaded_by_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: interactions Users can view workspace interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace interactions" ON public.interactions FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: users Users can view workspace members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace members" ON public.users FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: notes Users can view workspace notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace notes" ON public.notes FOR SELECT USING (((workspace_id = public.get_user_workspace_id()) AND ((NOT is_private) OR (user_id = auth.uid()) OR public.is_workspace_admin())));


--
-- Name: opportunities Users can view workspace opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace opportunities" ON public.opportunities FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: opportunity_participants Users can view workspace opportunity participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace opportunity participants" ON public.opportunity_participants FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: pipelines Users can view workspace pipelines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace pipelines" ON public.pipelines FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: properties Users can view workspace properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace properties" ON public.properties FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: specialty_items Users can view workspace specialty items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace specialty items" ON public.specialty_items FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: tasks Users can view workspace tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace tasks" ON public.tasks FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: vehicles Users can view workspace vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace vehicles" ON public.vehicles FOR SELECT USING ((workspace_id = public.get_user_workspace_id()));


--
-- Name: workspaces Workspace owners can update workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Workspace owners can update workspace" ON public.workspaces FOR UPDATE USING (((id = public.get_user_workspace_id()) AND public.is_workspace_admin()));


--
-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: insurance_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.insurance_types ENABLE ROW LEVEL SECURITY;

--
-- Name: interactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunity_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunity_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: pipelines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

--
-- Name: properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

--
-- Name: specialty_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.specialty_items ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: workspaces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Anyone can view user avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Anyone can view user avatars" ON storage.objects FOR SELECT USING ((bucket_id = 'user-avatars'::text));


--
-- Name: objects Users can delete their own avatar; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Users can update their own avatar; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Users can upload their own avatar; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]) AND (auth.role() = 'authenticated'::text)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

