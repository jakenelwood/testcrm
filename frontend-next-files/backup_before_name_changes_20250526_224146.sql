--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

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

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
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


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
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


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
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


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
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


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
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


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
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


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO postgres;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
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


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO postgres;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
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


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: exec_sql(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.exec_sql(query text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE query;
END;
$$;


ALTER FUNCTION public.exec_sql(query text) OWNER TO postgres;

--
-- Name: FUNCTION exec_sql(query text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.exec_sql(query text) IS 'Executes arbitrary SQL. USE WITH CAUTION. Only available to authenticated users.';


--
-- Name: get_lead_with_details(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_lead_with_details(lead_id uuid) RETURNS TABLE(id uuid, status_id integer, insurance_type_id integer, assigned_to text, notes text, current_carrier text, premium numeric, auto_premium numeric, home_premium numeric, specialty_premium numeric, commercial_premium numeric, umbrella_value numeric, umbrella_uninsured_underinsured text, auto_current_insurance_carrier text, auto_months_with_current_carrier integer, specialty_type text, specialty_make text, specialty_model text, specialty_year integer, commercial_coverage_type text, commercial_industry text, auto_data jsonb, auto_data_schema_version text, home_data jsonb, home_data_schema_version text, specialty_data jsonb, specialty_data_schema_version text, commercial_data jsonb, commercial_data_schema_version text, liability_data jsonb, liability_data_schema_version text, additional_insureds jsonb, additional_locations jsonb, ai_summary text, ai_next_action text, ai_quote_recommendation text, ai_follow_up_priority text, metadata jsonb, tags text[], created_at timestamp with time zone, updated_at timestamp with time zone, status_changed_at timestamp with time zone, last_contact_at timestamp with time zone, next_contact_at timestamp with time zone, quote_generated_at timestamp with time zone, sold_at timestamp with time zone, lost_at timestamp with time zone, pipeline_id integer, address_id uuid, mailing_address_id uuid, client_id uuid, first_name text, last_name text, email text, phone_number text, address_street text, address_city text, address_state text, address_zip_code text, address_type text, address_is_verified boolean, address_geocode_lat numeric, address_geocode_lng numeric, mailing_address_street text, mailing_address_city text, mailing_address_state text, mailing_address_zip_code text, mailing_address_type text, mailing_address_is_verified boolean, mailing_address_geocode_lat numeric, mailing_address_geocode_lng numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM lead_details WHERE lead_details.id = lead_id;
END;
$$;


ALTER FUNCTION public.get_lead_with_details(lead_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_lead_with_details(lead_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_lead_with_details(lead_id uuid) IS 'Function to get lead details with address information';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: increment(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment(row_id text, table_name text, column_name text) RETURNS integer
    LANGUAGE plpgsql
    AS $_$
DECLARE
  current_value INTEGER;
BEGIN
  EXECUTE format('SELECT %I FROM %I WHERE code = $1', column_name, table_name)
  INTO current_value
  USING row_id;
  
  RETURN current_value + 1;
END;
$_$;


ALTER FUNCTION public.increment(row_id text, table_name text, column_name text) OWNER TO postgres;

--
-- Name: increment_code_usage(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_code_usage(code_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE discount_codes
  SET current_uses = current_uses + 1
  WHERE id = code_id;
END;
$$;


ALTER FUNCTION public.increment_code_usage(code_id uuid) OWNER TO postgres;

--
-- Name: list_tables(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.list_tables() RETURNS text[]
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  table_names text[];
BEGIN
  -- Query information_schema correctly to get all table names in the public schema
  SELECT array_agg(table_name ORDER BY table_name)
  INTO table_names
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
  
  -- Return empty array if null
  RETURN COALESCE(table_names, '{}');
END;
$$;


ALTER FUNCTION public.list_tables() OWNER TO postgres;

--
-- Name: FUNCTION list_tables(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.list_tables() IS 'Returns an array of all table names in the public schema';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    role text DEFAULT 'user'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'agent'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: update_user_profile(uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_profile(user_id uuid, full_name text, avatar_url text) RETURNS SETOF public.users
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  UPDATE public.users
  SET 
    full_name = COALESCE(update_user_profile.full_name, users.full_name),
    avatar_url = COALESCE(update_user_profile.avatar_url, users.avatar_url),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING *;
END;
$$;


ALTER FUNCTION public.update_user_profile(user_id uuid, full_name text, avatar_url text) OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
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


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
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


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
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


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
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


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: _version_info; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public._version_info AS
 SELECT version() AS version;


ALTER VIEW public._version_info OWNER TO postgres;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    street text,
    city text,
    state text,
    zip_code text,
    type text,
    is_verified boolean DEFAULT false,
    geocode_lat numeric(10,8),
    geocode_lng numeric(11,8),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    verified_at timestamp without time zone,
    CONSTRAINT addresses_type_check CHECK ((type = ANY (ARRAY['Physical'::text, 'Mailing'::text, 'Business'::text, 'Location'::text])))
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- Name: ai_interactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_interactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    lead_id uuid,
    leads_contact_info_id uuid,
    type text,
    source text,
    content text,
    ai_response text,
    summary text,
    model_used text,
    temperature double precision,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_interactions_source_check CHECK ((source = ANY (ARRAY['Agent UI'::text, 'Marketing Automation'::text, 'AI Assistant'::text, 'Backend Middleware'::text]))),
    CONSTRAINT ai_interactions_type_check CHECK ((type = ANY (ARRAY['Chat'::text, 'Follow-Up'::text, 'Summary'::text, 'Prediction'::text, 'PromptResponse'::text])))
);


ALTER TABLE public.ai_interactions OWNER TO postgres;

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaigns (
    id text NOT NULL,
    name text,
    description text,
    start_date date,
    end_date date,
    campaign_type text,
    target_audience jsonb,
    content_template jsonb,
    metrics jsonb,
    ai_optimization_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.campaigns OWNER TO postgres;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    client_type text NOT NULL,
    name text NOT NULL,
    email text,
    phone_number text,
    street_address text,
    city text,
    state text,
    zip_code text,
    mailing_address text,
    referred_by text,
    date_of_birth text,
    gender text,
    marital_status text,
    drivers_license text,
    license_state text,
    education_occupation text,
    business_type text,
    industry text,
    tax_id text,
    year_established text,
    annual_revenue numeric(15,2),
    number_of_employees integer,
    contact_first_name text,
    contact_last_name text,
    contact_title text,
    contact_email text,
    contact_phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    prior_address text,
    rent_or_own text,
    effective_date date,
    sr22_required boolean DEFAULT false,
    military_status boolean DEFAULT false,
    accident_description text,
    accident_date date,
    CONSTRAINT clients_client_type_check1 CHECK ((client_type = ANY (ARRAY['Individual'::text, 'Business'::text])))
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: code_redemptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.code_redemptions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    discount_code_id uuid,
    user_id uuid,
    redeemed_at timestamp with time zone DEFAULT now(),
    order_id text
);


ALTER TABLE public.code_redemptions OWNER TO postgres;

--
-- Name: communication_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communication_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    icon_name text,
    requires_follow_up boolean DEFAULT false,
    ai_summary_template text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.communication_types OWNER TO postgres;

--
-- Name: communication_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.communication_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.communication_types_id_seq OWNER TO postgres;

--
-- Name: communication_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.communication_types_id_seq OWNED BY public.communication_types.id;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    leads_contact_info_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    title text,
    email text,
    phone_number text,
    is_primary_contact boolean DEFAULT false,
    notes text,
    department text,
    linkedin_url text,
    preferred_contact_method text,
    ai_summary text,
    ai_relationship_strength integer,
    metadata jsonb,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_contact_at timestamp with time zone,
    next_contact_at timestamp with time zone
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: developer_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.developer_notes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    priority text,
    status text,
    summary text NOT NULL,
    description text,
    solution text,
    related_table text,
    related_feature text,
    related_files text[],
    technical_details jsonb,
    decision_context jsonb,
    implementation_notes jsonb,
    created_by text NOT NULL,
    assigned_to text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    CONSTRAINT developer_notes_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT developer_notes_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in-progress'::text, 'resolved'::text, 'documented'::text])))
);


ALTER TABLE public.developer_notes OWNER TO postgres;

--
-- Name: TABLE developer_notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.developer_notes IS 'Stores development-related notes, decisions, and documentation to track the evolution of the application and preserve institutional knowledge.';


--
-- Name: discount_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discount_codes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    discount_percent integer NOT NULL,
    max_uses integer,
    current_uses integer DEFAULT 0,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    description text,
    discount_type text DEFAULT 'percentage'::text,
    discount_amount numeric(10,2),
    is_one_time_use boolean DEFAULT false,
    specific_user_id uuid,
    campaign_id text,
    min_purchase_amount numeric(10,2),
    applicable_plan text[],
    CONSTRAINT discount_codes_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed_amount'::text, 'free_trial'::text]))),
    CONSTRAINT discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed_amount'::text, 'free_trial'::text])))
);


ALTER TABLE public.discount_codes OWNER TO postgres;

--
-- Name: homes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.homes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    year_built integer,
    square_feet integer,
    construction_type text,
    roof_type text,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lead_id uuid,
    leads_contact_info_id uuid
);


ALTER TABLE public.homes OWNER TO postgres;

--
-- Name: TABLE homes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.homes IS 'Stores home information';


--
-- Name: insurance_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.insurance_types (
    id integer NOT NULL,
    name text NOT NULL,
    is_personal boolean,
    is_commercial boolean,
    description text,
    icon_name text,
    form_schema jsonb,
    ai_prompt_template text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.insurance_types OWNER TO postgres;

--
-- Name: insurance_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.insurance_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.insurance_types_id_seq OWNER TO postgres;

--
-- Name: insurance_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.insurance_types_id_seq OWNED BY public.insurance_types.id;


--
-- Name: invite_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invite_codes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    description text,
    max_uses integer DEFAULT 1,
    current_uses integer DEFAULT 0,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    is_active boolean DEFAULT true,
    plan_id text
);


ALTER TABLE public.invite_codes OWNER TO postgres;

--
-- Name: lead_communications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_communications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    lead_id uuid,
    contact_id uuid,
    type_id integer,
    direction text,
    content text,
    status text,
    created_by text,
    subject text,
    channel text,
    duration integer,
    outcome text,
    ai_summary text,
    ai_sentiment text,
    ai_entities jsonb,
    ai_action_items jsonb,
    ai_follow_up_suggestion text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    scheduled_at timestamp with time zone,
    completed_at timestamp with time zone,
    follow_up_at timestamp with time zone,
    CONSTRAINT lead_communications_direction_check CHECK ((direction = ANY (ARRAY['Inbound'::text, 'Outbound'::text])))
);


ALTER TABLE public.lead_communications OWNER TO postgres;

--
-- Name: lead_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_statuses (
    id integer NOT NULL,
    value text NOT NULL,
    description text,
    is_final boolean DEFAULT false,
    display_order integer,
    color_hex text,
    icon_name text,
    ai_action_template text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lead_statuses OWNER TO postgres;

--
-- Name: leads_contact_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads_contact_info (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    lead_type text NOT NULL,
    name text NOT NULL,
    email text,
    phone_number text,
    address_id uuid,
    mailing_address_id uuid,
    referred_by text,
    date_of_birth text,
    gender text,
    marital_status text,
    drivers_license text,
    license_state text,
    education_occupation text,
    business_type text,
    industry text,
    tax_id text,
    year_established text,
    annual_revenue numeric(15,2),
    number_of_employees integer,
    ai_summary text,
    ai_next_action text,
    ai_risk_score integer,
    ai_lifetime_value numeric(15,2),
    metadata jsonb,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_contact_at timestamp with time zone,
    next_contact_at timestamp with time zone,
    converted_from_lead_id uuid,
    CONSTRAINT clients_client_type_check CHECK ((lead_type = ANY (ARRAY['Individual'::text, 'Business'::text])))
);


ALTER TABLE public.leads_contact_info OWNER TO postgres;

--
-- Name: TABLE leads_contact_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leads_contact_info IS 'Stores contact information for leads (renamed from clients)';


--
-- Name: leads_ins_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads_ins_info (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    status_id integer,
    insurance_type_id integer,
    assigned_to text,
    notes text,
    current_carrier text,
    premium numeric(10,2),
    auto_premium numeric(10,2),
    home_premium numeric(10,2),
    specialty_premium numeric(10,2),
    commercial_premium numeric(10,2),
    umbrella_value numeric(10,2),
    umbrella_uninsured_underinsured text,
    auto_current_insurance_carrier text,
    auto_months_with_current_carrier integer,
    specialty_type text,
    specialty_make text,
    specialty_model text,
    specialty_year integer,
    commercial_coverage_type text,
    commercial_industry text,
    auto_data jsonb,
    auto_data_schema_version text,
    home_data jsonb,
    home_data_schema_version text,
    specialty_data jsonb,
    specialty_data_schema_version text,
    commercial_data jsonb,
    commercial_data_schema_version text,
    liability_data jsonb,
    liability_data_schema_version text,
    additional_insureds jsonb,
    additional_locations jsonb,
    ai_summary text,
    ai_next_action text,
    ai_quote_recommendation text,
    ai_follow_up_priority integer,
    metadata jsonb,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status_changed_at timestamp with time zone,
    last_contact_at timestamp with time zone,
    next_contact_at timestamp with time zone,
    quote_generated_at timestamp with time zone,
    sold_at timestamp with time zone,
    lost_at timestamp with time zone,
    pipeline_id integer NOT NULL,
    address_id uuid,
    mailing_address_id uuid,
    leads_contact_info_id uuid,
    first_name text,
    last_name text,
    email text,
    phone_number text
);


ALTER TABLE public.leads_ins_info OWNER TO postgres;

--
-- Name: TABLE leads_ins_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leads_ins_info IS 'Stores insurance information for leads (renamed from leads)';


--
-- Name: pipelines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pipelines (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    display_order integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.pipelines OWNER TO postgres;

--
-- Name: lead_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.lead_details AS
 SELECT l.id,
    l.status_id,
    l.insurance_type_id,
    l.assigned_to,
    l.notes,
    l.current_carrier,
    l.premium,
    l.auto_premium,
    l.home_premium,
    l.specialty_premium,
    l.umbrella_value,
    l.auto_current_insurance_carrier,
    l.auto_months_with_current_carrier,
    l.auto_data,
    l.auto_data_schema_version,
    l.home_data,
    l.home_data_schema_version,
    l.specialty_data,
    l.specialty_data_schema_version,
    l.additional_insureds,
    l.pipeline_id,
    l.address_id,
    l.mailing_address_id,
    l.leads_contact_info_id,
    l.created_at,
    l.updated_at,
    l.status_changed_at,
    s.value AS status_value,
    s.description AS status_description,
    s.is_final AS status_is_final,
    s.display_order AS status_display_order,
    it.name AS insurance_type_name,
    it.description AS insurance_type_description,
    p.name AS pipeline_name,
    p.description AS pipeline_description,
    p.is_default AS pipeline_is_default,
    p.display_order AS pipeline_display_order,
    c.id AS client_id,
    c.name AS client_name,
    c.email AS client_email,
    c.phone_number AS client_phone_number,
    c.lead_type AS client_type,
    c.date_of_birth AS client_date_of_birth,
    c.gender AS client_gender,
    c.marital_status AS client_marital_status,
    c.drivers_license AS client_drivers_license,
    c.license_state AS client_license_state,
    c.education_occupation AS client_education_occupation,
    c.referred_by AS client_referred_by,
    a.street AS address_street,
    a.city AS address_city,
    a.state AS address_state,
    a.zip_code AS address_zip_code,
    a.type AS address_type,
    a.is_verified AS address_is_verified,
    a.geocode_lat AS address_geocode_lat,
    a.geocode_lng AS address_geocode_lng,
    ma.street AS mailing_address_street,
    ma.city AS mailing_address_city,
    ma.state AS mailing_address_state,
    ma.zip_code AS mailing_address_zip_code,
    ma.type AS mailing_address_type,
    ma.is_verified AS mailing_address_is_verified,
    ma.geocode_lat AS mailing_address_geocode_lat,
    ma.geocode_lng AS mailing_address_geocode_lng,
        CASE
            WHEN (c.lead_type = 'Business'::text) THEN c.name
            ELSE split_part(c.name, ' '::text, 1)
        END AS first_name,
        CASE
            WHEN (c.lead_type = 'Business'::text) THEN NULL::text
            ELSE SUBSTRING(c.name FROM (POSITION((' '::text) IN (c.name)) + 1))
        END AS last_name,
    c.email,
    c.phone_number
   FROM ((((((public.leads_ins_info l
     LEFT JOIN public.lead_statuses s ON ((l.status_id = s.id)))
     LEFT JOIN public.insurance_types it ON ((l.insurance_type_id = it.id)))
     LEFT JOIN public.pipelines p ON ((l.pipeline_id = p.id)))
     LEFT JOIN public.leads_contact_info c ON ((l.leads_contact_info_id = c.id)))
     LEFT JOIN public.addresses a ON ((l.address_id = a.id)))
     LEFT JOIN public.addresses ma ON ((l.mailing_address_id = ma.id)));


ALTER VIEW public.lead_details OWNER TO postgres;

--
-- Name: lead_marketing_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_marketing_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    lead_id uuid,
    campaign_id text,
    is_active boolean DEFAULT true,
    settings jsonb,
    opt_in_status text,
    engagement_score integer,
    segment text[],
    ai_campaign_fit_score integer,
    ai_recommended_campaigns jsonb,
    ai_content_preferences jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_engagement_at timestamp with time zone,
    opt_in_at timestamp with time zone,
    opt_out_at timestamp with time zone
);


ALTER TABLE public.lead_marketing_settings OWNER TO postgres;

--
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_notes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    lead_id uuid,
    note_content text NOT NULL,
    created_by text,
    note_type text,
    is_pinned boolean DEFAULT false,
    ai_summary text,
    ai_sentiment text,
    ai_entities jsonb,
    ai_action_items jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lead_notes OWNER TO postgres;

--
-- Name: lead_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lead_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_statuses_id_seq OWNER TO postgres;

--
-- Name: lead_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lead_statuses_id_seq OWNED BY public.lead_statuses.id;


--
-- Name: leads; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.leads AS
 SELECT leads_ins_info.id,
    leads_ins_info.status_id,
    leads_ins_info.insurance_type_id,
    leads_ins_info.assigned_to,
    leads_ins_info.notes,
    leads_ins_info.current_carrier,
    leads_ins_info.premium,
    leads_ins_info.auto_premium,
    leads_ins_info.home_premium,
    leads_ins_info.specialty_premium,
    leads_ins_info.umbrella_value,
    leads_ins_info.auto_current_insurance_carrier,
    leads_ins_info.auto_months_with_current_carrier,
    leads_ins_info.auto_data,
    leads_ins_info.auto_data_schema_version,
    leads_ins_info.home_data,
    leads_ins_info.home_data_schema_version,
    leads_ins_info.specialty_data,
    leads_ins_info.specialty_data_schema_version,
    leads_ins_info.additional_insureds,
    leads_ins_info.pipeline_id,
    leads_ins_info.address_id,
    leads_ins_info.mailing_address_id,
    leads_ins_info.leads_contact_info_id,
    leads_ins_info.created_at,
    leads_ins_info.updated_at,
    leads_ins_info.status_changed_at
   FROM public.leads_ins_info;


ALTER VIEW public.leads OWNER TO postgres;

--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opportunities (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    lead_id uuid,
    name text NOT NULL,
    stage text NOT NULL,
    amount numeric(15,2),
    probability integer,
    expected_close_date date,
    actual_close_date date,
    notes text,
    source text,
    type text,
    competitors text[],
    decision_makers text[],
    ai_win_probability integer,
    ai_suggested_actions jsonb,
    ai_risk_factors jsonb,
    ai_summary text,
    metadata jsonb,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    stage_changed_at timestamp with time zone,
    last_activity_at timestamp with time zone
);


ALTER TABLE public.opportunities OWNER TO postgres;

--
-- Name: other_insureds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.other_insureds (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    relationship text,
    date_of_birth date,
    gender text,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lead_id uuid,
    client_id uuid,
    first_name text,
    last_name text,
    drivers_license text,
    license_state text,
    marital_status text,
    education_occupation text
);


ALTER TABLE public.other_insureds OWNER TO postgres;

--
-- Name: TABLE other_insureds; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.other_insureds IS 'Stores information about other insureds';


--
-- Name: pipeline_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pipeline_statuses (
    id integer NOT NULL,
    pipeline_id integer,
    name text NOT NULL,
    description text,
    is_final boolean DEFAULT false,
    display_order integer NOT NULL,
    color_hex text,
    icon_name text,
    ai_action_template text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.pipeline_statuses OWNER TO postgres;

--
-- Name: pipeline_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pipeline_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pipeline_statuses_id_seq OWNER TO postgres;

--
-- Name: pipeline_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pipeline_statuses_id_seq OWNED BY public.pipeline_statuses.id;


--
-- Name: pipelines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pipelines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pipelines_id_seq OWNER TO postgres;

--
-- Name: pipelines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pipelines_id_seq OWNED BY public.pipelines.id;


--
-- Name: ringcentral_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ringcentral_tokens (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    token_type text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    scope text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    refresh_token_expires_at timestamp with time zone
);


ALTER TABLE public.ringcentral_tokens OWNER TO postgres;

--
-- Name: COLUMN ringcentral_tokens.refresh_token_expires_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ringcentral_tokens.refresh_token_expires_at IS 'Timestamp when the RingCentral refresh token itself expires';


--
-- Name: ringcentral_tokens_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ringcentral_tokens_backup (
    id uuid,
    user_id uuid,
    access_token text,
    refresh_token text,
    token_type text,
    expires_at timestamp with time zone,
    scope text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    refresh_token_expires_at timestamp with time zone
);


ALTER TABLE public.ringcentral_tokens_backup OWNER TO postgres;

--
-- Name: schema_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_versions (
    id integer NOT NULL,
    version text NOT NULL,
    applied_at timestamp with time zone DEFAULT now(),
    description text,
    is_active boolean DEFAULT true,
    rolled_back_at timestamp with time zone
);


ALTER TABLE public.schema_versions OWNER TO postgres;

--
-- Name: schema_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schema_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schema_versions_id_seq OWNER TO postgres;

--
-- Name: schema_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schema_versions_id_seq OWNED BY public.schema_versions.id;


--
-- Name: specialty_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specialty_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    value numeric,
    description text,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lead_id uuid,
    leads_contact_info_id uuid
);


ALTER TABLE public.specialty_items OWNER TO postgres;

--
-- Name: TABLE specialty_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.specialty_items IS 'Stores specialty items for insurance';


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    leads_contact_info_id uuid,
    lead_id uuid,
    created_by text,
    issue_type text,
    issue_description text,
    resolution_summary text,
    status text,
    assigned_to text,
    notes jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['Open'::text, 'In Progress'::text, 'Resolved'::text, 'Escalated'::text])))
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: user_profiles; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_profiles AS
 SELECT u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.role,
    u.created_at,
    u.updated_at,
    ( SELECT count(*) AS count
           FROM public.leads_ins_info
          WHERE (leads_ins_info.assigned_to = (u.id)::text)) AS assigned_leads_count
   FROM public.users u;


ALTER VIEW public.user_profiles OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text, 'manager'::text])))
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    make text NOT NULL,
    model text NOT NULL,
    year integer,
    vin text,
    license_plate text,
    state text,
    primary_use text,
    annual_mileage integer,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lead_id uuid,
    leads_contact_info_id uuid
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: TABLE vehicles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.vehicles IS 'Stores vehicle information';


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
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


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: messages_2025_05_24; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_05_24 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_05_24 OWNER TO supabase_admin;

--
-- Name: messages_2025_05_25; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_05_25 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_05_25 OWNER TO supabase_admin;

--
-- Name: messages_2025_05_26; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_05_26 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_05_26 OWNER TO supabase_admin;

--
-- Name: messages_2025_05_27; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_05_27 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_05_27 OWNER TO supabase_admin;

--
-- Name: messages_2025_05_28; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_05_28 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_05_28 OWNER TO supabase_admin;

--
-- Name: messages_2025_05_29; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_05_29 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_05_29 OWNER TO supabase_admin;

--
-- Name: messages_2025_05_30; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_05_30 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_05_30 OWNER TO supabase_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
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


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
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
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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
    owner_id text
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
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


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: messages_2025_05_24; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_24 FOR VALUES FROM ('2025-05-24 00:00:00') TO ('2025-05-25 00:00:00');


--
-- Name: messages_2025_05_25; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_25 FOR VALUES FROM ('2025-05-25 00:00:00') TO ('2025-05-26 00:00:00');


--
-- Name: messages_2025_05_26; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_26 FOR VALUES FROM ('2025-05-26 00:00:00') TO ('2025-05-27 00:00:00');


--
-- Name: messages_2025_05_27; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_27 FOR VALUES FROM ('2025-05-27 00:00:00') TO ('2025-05-28 00:00:00');


--
-- Name: messages_2025_05_28; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_28 FOR VALUES FROM ('2025-05-28 00:00:00') TO ('2025-05-29 00:00:00');


--
-- Name: messages_2025_05_29; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_29 FOR VALUES FROM ('2025-05-29 00:00:00') TO ('2025-05-30 00:00:00');


--
-- Name: messages_2025_05_30; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_30 FOR VALUES FROM ('2025-05-30 00:00:00') TO ('2025-05-31 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: communication_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_types ALTER COLUMN id SET DEFAULT nextval('public.communication_types_id_seq'::regclass);


--
-- Name: insurance_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_types ALTER COLUMN id SET DEFAULT nextval('public.insurance_types_id_seq'::regclass);


--
-- Name: lead_statuses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_statuses ALTER COLUMN id SET DEFAULT nextval('public.lead_statuses_id_seq'::regclass);


--
-- Name: pipeline_statuses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_statuses ALTER COLUMN id SET DEFAULT nextval('public.pipeline_statuses_id_seq'::regclass);


--
-- Name: pipelines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipelines ALTER COLUMN id SET DEFAULT nextval('public.pipelines_id_seq'::regclass);


--
-- Name: schema_versions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_versions ALTER COLUMN id SET DEFAULT nextval('public.schema_versions_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
00000000-0000-0000-0000-000000000000	b4e5bb9c-9868-4ae5-8ec5-dd88d61c48c4	{"action":"user_confirmation_requested","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-05-08 02:12:33.180646+00	
00000000-0000-0000-0000-000000000000	dd9d14f0-23bf-4fd7-a2c2-935510bdc693	{"action":"user_signedup","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"team"}	2025-05-08 02:13:55.833733+00	
00000000-0000-0000-0000-000000000000	214bcd9a-f8ce-4d8f-b2b8-a4fad2bb0636	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"email"}}	2025-05-08 02:13:57.648171+00	
00000000-0000-0000-0000-000000000000	5343e795-bdad-49a2-b2c2-3d073956063b	{"action":"user_recovery_requested","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"user"}	2025-05-08 02:47:31.208069+00	
00000000-0000-0000-0000-000000000000	1eaa6204-025b-4879-841a-7957242d46a5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 02:48:14.619752+00	
00000000-0000-0000-0000-000000000000	0ee9fe8a-ced8-4306-a33d-da1e40c04e27	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 02:55:54.744135+00	
00000000-0000-0000-0000-000000000000	cb1a5110-1a12-4238-872f-8420a196f26a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 03:00:56.300714+00	
00000000-0000-0000-0000-000000000000	b2cc552e-3e3e-4913-b1e9-078a691caa9b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 03:04:09.784902+00	
00000000-0000-0000-0000-000000000000	4ca4d9d7-8831-4599-8902-1c562e0b6898	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 03:07:10.859312+00	
00000000-0000-0000-0000-000000000000	3d8bd554-1706-4346-b6c7-8a6691bb822b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 03:12:26.633037+00	
00000000-0000-0000-0000-000000000000	9fd9e82f-3350-408b-9153-b0167ce587d6	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 03:13:16.964389+00	
00000000-0000-0000-0000-000000000000	373cc57a-9f5f-4556-8170-5fc4e54b9a42	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 03:14:35.590311+00	
00000000-0000-0000-0000-000000000000	06c19228-899c-499e-b015-5ab4789cf9a0	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 03:16:40.116223+00	
00000000-0000-0000-0000-000000000000	a7c36151-e83f-4bd9-ac97-3b7b4f7b1ca8	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 03:21:27.890809+00	
00000000-0000-0000-0000-000000000000	4f2af6fc-6522-45d5-b6c6-cce6c6f1e53a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 03:31:20.62477+00	
00000000-0000-0000-0000-000000000000	df67dced-d33c-4ab9-beee-2b3538c25c46	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 04:09:20.252525+00	
00000000-0000-0000-0000-000000000000	40ecc3b0-2d3f-45d6-9ddf-70aebca5ff5e	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 04:19:05.574795+00	
00000000-0000-0000-0000-000000000000	f020af57-1f9a-46c0-bcc9-53e298f0373f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 04:21:54.040208+00	
00000000-0000-0000-0000-000000000000	d2dddb11-c848-4820-bfe7-5575e1ee854d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 04:25:58.755884+00	
00000000-0000-0000-0000-000000000000	edf0815c-89fe-40ea-ba76-e4b63193f37a	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 04:26:11.637472+00	
00000000-0000-0000-0000-000000000000	117c2826-5c82-4010-bfbe-a7e857caf8b2	{"action":"user_confirmation_requested","actor_id":"9d942072-ab09-4739-a6f2-14f1c8d3f9c6","actor_username":"brian@bergeinsurance.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-05-08 04:31:12.139047+00	
00000000-0000-0000-0000-000000000000	5a8ab885-8a4a-415d-88bb-7c11f90ece2d	{"action":"user_signedup","actor_id":"9d942072-ab09-4739-a6f2-14f1c8d3f9c6","actor_username":"brian@bergeinsurance.com","actor_via_sso":false,"log_type":"team"}	2025-05-08 04:31:25.855773+00	
00000000-0000-0000-0000-000000000000	fa227299-bdd7-404b-9161-26d25987e6bf	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"brian@bergeinsurance.com","user_id":"9d942072-ab09-4739-a6f2-14f1c8d3f9c6","user_phone":""}}	2025-05-08 04:36:37.507091+00	
00000000-0000-0000-0000-000000000000	833fac2e-6425-48a6-b7bd-f6766e3523da	{"action":"user_confirmation_requested","actor_id":"a38a4eb9-8d2f-4176-9eae-17bec173c521","actor_username":"brian@bergeinsurance.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-05-08 04:40:17.308688+00	
00000000-0000-0000-0000-000000000000	21e2b778-0e99-4e55-9727-eb85de94f6c7	{"action":"user_signedup","actor_id":"a38a4eb9-8d2f-4176-9eae-17bec173c521","actor_username":"brian@bergeinsurance.com","actor_via_sso":false,"log_type":"team"}	2025-05-08 04:40:24.825144+00	
00000000-0000-0000-0000-000000000000	6b9f2899-459b-49ee-8201-60161fb9791d	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"brian@bergeinsurance.com","user_id":"a38a4eb9-8d2f-4176-9eae-17bec173c521","user_phone":""}}	2025-05-08 04:42:42.064552+00	
00000000-0000-0000-0000-000000000000	b0d43e13-4a86-4232-9384-45fd40a0cf30	{"action":"user_confirmation_requested","actor_id":"7be6492f-592f-4d83-ad3d-95dbddbd68cf","actor_username":"brian@bergeinsurance.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-05-08 04:43:26.258779+00	
00000000-0000-0000-0000-000000000000	f1b5108d-f58d-41ab-b972-2c3279f927e1	{"action":"user_signedup","actor_id":"7be6492f-592f-4d83-ad3d-95dbddbd68cf","actor_username":"brian@bergeinsurance.com","actor_via_sso":false,"log_type":"team"}	2025-05-08 04:43:36.789995+00	
00000000-0000-0000-0000-000000000000	47226748-c441-4061-a440-6932996906fb	{"action":"login","actor_id":"7be6492f-592f-4d83-ad3d-95dbddbd68cf","actor_username":"brian@bergeinsurance.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"email"}}	2025-05-08 04:43:38.082315+00	
00000000-0000-0000-0000-000000000000	2d94f251-2a51-48c5-9dbb-689bf713b560	{"action":"logout","actor_id":"7be6492f-592f-4d83-ad3d-95dbddbd68cf","actor_username":"brian@bergeinsurance.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 04:47:52.127026+00	
00000000-0000-0000-0000-000000000000	66ea5eea-ac32-457c-9eb3-87e62d16513b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 04:48:05.730874+00	
00000000-0000-0000-0000-000000000000	b0a02661-043f-420c-9cdb-af505dd76db5	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 04:48:13.097581+00	
00000000-0000-0000-0000-000000000000	b51368f2-21db-4855-8b95-373b467338cb	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 04:59:07.36083+00	
00000000-0000-0000-0000-000000000000	a274cbfa-0bbe-4d26-ae08-e9c2e5734b13	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 04:59:26.698544+00	
00000000-0000-0000-0000-000000000000	9551e5af-f5ab-4e24-a73c-80b55e37dd81	{"action":"user_confirmation_requested","actor_id":"84aea900-ddfd-42de-9eb4-a355b6d53df0","actor_username":"bhberge@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-05-08 05:00:54.415789+00	
00000000-0000-0000-0000-000000000000	b201a0c0-ca71-4dec-bfa6-0f9e4ee34687	{"action":"user_signedup","actor_id":"84aea900-ddfd-42de-9eb4-a355b6d53df0","actor_username":"bhberge@gmail.com","actor_via_sso":false,"log_type":"team"}	2025-05-08 05:01:38.495577+00	
00000000-0000-0000-0000-000000000000	5cbc858c-d827-40a0-91b7-26319e8a9c0b	{"action":"login","actor_id":"84aea900-ddfd-42de-9eb4-a355b6d53df0","actor_username":"bhberge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 05:01:51.087641+00	
00000000-0000-0000-0000-000000000000	9a05713e-4f61-444a-8c42-17a899a3a91c	{"action":"logout","actor_id":"84aea900-ddfd-42de-9eb4-a355b6d53df0","actor_username":"bhberge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 05:02:39.442479+00	
00000000-0000-0000-0000-000000000000	4b3aeb50-bb0c-4950-ab9c-ddd88317011a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 06:52:20.566786+00	
00000000-0000-0000-0000-000000000000	3b503833-eb6d-457f-8c98-09be8e8c7699	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-08 08:17:49.826328+00	
00000000-0000-0000-0000-000000000000	99d5ea01-fc8e-4b1f-b6f2-219324034cb7	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-08 08:17:49.827901+00	
00000000-0000-0000-0000-000000000000	44e392e7-8ca9-42b1-863f-8ade99f2b7fa	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-08 09:19:02.099119+00	
00000000-0000-0000-0000-000000000000	4850da1d-2ec2-4bdf-ade7-a6ade89e0981	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-08 09:19:02.100907+00	
00000000-0000-0000-0000-000000000000	d085480f-4215-4a25-b868-033d9514e59d	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-08 17:30:17.566917+00	
00000000-0000-0000-0000-000000000000	587723ce-d3b7-4fd6-bf7f-7bc889fcea54	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-08 17:30:17.579043+00	
00000000-0000-0000-0000-000000000000	53c1ea5b-2c92-4242-b823-0f836721ee4f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 19:49:36.6188+00	
00000000-0000-0000-0000-000000000000	98cbb857-2942-4a66-b2a4-fe5056b706e5	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 19:49:54.11806+00	
00000000-0000-0000-0000-000000000000	de20dc10-bbb4-4e97-9613-77684ef7a213	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 20:11:26.470843+00	
00000000-0000-0000-0000-000000000000	45ea8ad2-842d-49ac-b0e6-4f475fcd5959	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 20:44:56.986768+00	
00000000-0000-0000-0000-000000000000	6cd980a9-c1d4-4931-b14e-425d74e355bd	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 20:51:57.279059+00	
00000000-0000-0000-0000-000000000000	d7d2a40a-0d56-4df6-b0c0-82bddf424fc5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 20:54:45.11285+00	
00000000-0000-0000-0000-000000000000	4a3d5124-63e2-4937-8f65-aad3ec882d24	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 21:01:54.850508+00	
00000000-0000-0000-0000-000000000000	0fb73a63-30f2-424a-99c7-b1a274099255	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-08 22:16:35.58727+00	
00000000-0000-0000-0000-000000000000	5c5c60c7-793c-4a17-b66b-6c4bfce1f8d2	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-08 22:17:17.643748+00	
00000000-0000-0000-0000-000000000000	0195d06d-3a5d-4c9b-b3b9-53fe4d923f23	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-09 05:41:41.715022+00	
00000000-0000-0000-0000-000000000000	5eecef95-8669-4a05-8d87-e8d6360f1fb6	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-09 05:46:49.336251+00	
00000000-0000-0000-0000-000000000000	2a1d7658-1d39-4e3d-b374-d45f604c3a15	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-09 05:49:32.169283+00	
00000000-0000-0000-0000-000000000000	e4972f69-5ad8-4fda-8f82-09fa995bb61d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-09 05:51:04.869759+00	
00000000-0000-0000-0000-000000000000	2a9e5179-0358-4303-98d0-dde0109ee016	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-09 05:52:22.051119+00	
00000000-0000-0000-0000-000000000000	21b8c194-774f-4301-b0fb-5342174f513f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-09 06:02:25.054896+00	
00000000-0000-0000-0000-000000000000	0019bd7c-5ecf-4484-b08c-221fbad31057	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-09 06:04:01.944413+00	
00000000-0000-0000-0000-000000000000	2cf8df8b-ab16-4502-9d6d-3c3c43248b74	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-09 06:11:16.924464+00	
00000000-0000-0000-0000-000000000000	94e5adc8-10fa-4159-9fb6-11eae832ced3	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-09 06:12:49.437997+00	
00000000-0000-0000-0000-000000000000	9094a0ed-6fa3-49d3-99ec-e14b09404a96	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-09 06:51:52.40386+00	
00000000-0000-0000-0000-000000000000	d6037407-4ed0-4a4b-97fc-96d570ddcbcd	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-09 06:51:56.822762+00	
00000000-0000-0000-0000-000000000000	f4719296-cf42-4698-aa2a-0305738f7e99	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-09 15:12:19.56003+00	
00000000-0000-0000-0000-000000000000	5f5f0378-b01f-4882-aec3-eada91d96e3f	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-09 15:24:54.38252+00	
00000000-0000-0000-0000-000000000000	c0d24032-52ab-41ce-9437-bd22e2e5606c	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-09 15:24:54.384566+00	
00000000-0000-0000-0000-000000000000	66deadba-afa0-4199-9052-2501dda98d57	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-09 16:48:55.837869+00	
00000000-0000-0000-0000-000000000000	b8b36c0a-87ab-40ed-9626-d42c406331ed	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-09 17:11:55.571536+00	
00000000-0000-0000-0000-000000000000	6da4b343-dd01-411d-9bdd-72ee2b557951	{"action":"user_confirmation_requested","actor_id":"4cc92b12-b5ca-4e14-9312-e281519f04d6","actor_username":"vince@vincehunt.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-05-09 19:27:51.775173+00	
00000000-0000-0000-0000-000000000000	84a9459b-415b-4787-8684-826c38a30386	{"action":"user_signedup","actor_id":"4cc92b12-b5ca-4e14-9312-e281519f04d6","actor_username":"vince@vincehunt.com","actor_via_sso":false,"log_type":"team"}	2025-05-09 19:28:03.900767+00	
00000000-0000-0000-0000-000000000000	dc4fc1ca-81f5-44f2-bed6-65f03cbd7d31	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-12 02:26:10.61974+00	
00000000-0000-0000-0000-000000000000	31eb4703-8b3a-455c-b5e6-c5b99e946a35	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-12 02:27:12.284248+00	
00000000-0000-0000-0000-000000000000	dde3d5f0-0d8d-44c0-93b2-e4b2fd30486f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-12 17:06:56.375255+00	
00000000-0000-0000-0000-000000000000	fce9a266-86a0-4065-a397-38fc360f4e75	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-12 17:12:14.916035+00	
00000000-0000-0000-0000-000000000000	2c64f8b1-8e8a-42a1-949f-2d3a0e71644a	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-12 17:15:48.573157+00	
00000000-0000-0000-0000-000000000000	ead0043a-6edc-4724-8ffd-9d08fce85d80	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-12 17:31:38.813501+00	
00000000-0000-0000-0000-000000000000	1fc0eefe-74c6-432f-bbe6-dc852f0b8edc	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-12 17:38:32.658587+00	
00000000-0000-0000-0000-000000000000	de1fd3c9-502d-4676-aa62-55c4ae3b15a5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-12 17:39:23.351055+00	
00000000-0000-0000-0000-000000000000	9163808e-38c2-40c3-8131-01b5813cb4e0	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-12 17:42:39.344+00	
00000000-0000-0000-0000-000000000000	2ee1944c-3315-4c72-a035-2f3e790290a8	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-12 22:19:41.028868+00	
00000000-0000-0000-0000-000000000000	83b76898-9ef1-4511-a31f-5415ff7b6e8e	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-12 22:19:41.046024+00	
00000000-0000-0000-0000-000000000000	104fbcbd-1778-479f-82a8-f1ec27f1a820	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-13 01:07:25.343286+00	
00000000-0000-0000-0000-000000000000	c7829d5c-4849-4847-940c-e623b5342925	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-13 01:07:25.344824+00	
00000000-0000-0000-0000-000000000000	abaf1ac7-685f-4cbd-bc55-3c1ba1ae892c	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-13 01:25:36.935247+00	
00000000-0000-0000-0000-000000000000	ce0aa19c-3e72-4901-864b-7bf409a7664e	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-13 02:39:57.148327+00	
00000000-0000-0000-0000-000000000000	0df3641f-0dcd-4dd5-8fb8-2d7b44fb1546	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-13 02:39:57.151827+00	
00000000-0000-0000-0000-000000000000	59c074e4-0013-4d70-b671-73002876dc05	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-13 17:07:18.54831+00	
00000000-0000-0000-0000-000000000000	a15230f1-0c75-44c1-a930-efed6a310a35	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-13 19:17:42.677401+00	
00000000-0000-0000-0000-000000000000	f63f2247-7d04-4d9a-8d82-3a0ffe62b2f8	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-13 19:17:42.678261+00	
00000000-0000-0000-0000-000000000000	49750501-a127-4a39-821e-def943a52748	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-13 23:45:21.365852+00	
00000000-0000-0000-0000-000000000000	a688d4d9-431d-455d-830c-abb998ded5f5	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-13 23:45:21.366791+00	
00000000-0000-0000-0000-000000000000	00062628-866c-4b12-9016-10b1ec6018b9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 00:39:32.671495+00	
00000000-0000-0000-0000-000000000000	8ca30ee1-2ac1-4291-88c5-5df7ef769dd6	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 00:50:45.476628+00	
00000000-0000-0000-0000-000000000000	1381aa1c-5052-42e4-bed3-420318b58846	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 00:51:06.158965+00	
00000000-0000-0000-0000-000000000000	de45b0d4-a0bc-4ce9-a77e-d6260a903f99	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 00:58:10.00828+00	
00000000-0000-0000-0000-000000000000	a1efcd7d-4971-41d0-a6c3-b1205b0cbefe	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 01:02:13.321747+00	
00000000-0000-0000-0000-000000000000	2f9d33bb-f43f-4dac-9619-109cb5736e31	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 01:07:39.555626+00	
00000000-0000-0000-0000-000000000000	a59b0dce-e0a4-41e0-8afc-ba9bb4761563	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 01:26:29.346184+00	
00000000-0000-0000-0000-000000000000	8c501213-425a-460c-b4b5-c46ef89369f4	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 01:34:12.617171+00	
00000000-0000-0000-0000-000000000000	3a3d79b2-e488-4c85-9a8a-91b23a849aba	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 01:41:14.452387+00	
00000000-0000-0000-0000-000000000000	de952e18-a601-41cd-b8d5-442b42ffec19	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 01:49:28.480957+00	
00000000-0000-0000-0000-000000000000	53c97b97-468c-4bac-b3f9-54b3911d5757	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 01:51:30.386787+00	
00000000-0000-0000-0000-000000000000	cd243f8c-769c-45b2-8af3-b8e00381e9fe	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 02:06:23.659032+00	
00000000-0000-0000-0000-000000000000	abb23909-d0e6-4ab6-a1b9-9925c0b7faae	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 02:10:29.841411+00	
00000000-0000-0000-0000-000000000000	c8c4d9c6-be88-4e71-befa-181b62cd2961	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 02:22:17.473669+00	
00000000-0000-0000-0000-000000000000	2ce2550e-418f-4354-b36f-5ab92d37c4c6	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 02:50:40.668783+00	
00000000-0000-0000-0000-000000000000	05a68eca-27bf-4c00-9dea-e57e22f61690	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 02:53:53.788434+00	
00000000-0000-0000-0000-000000000000	ea71f3d8-c0a2-4bc1-aa01-762d3b305903	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 02:55:00.33462+00	
00000000-0000-0000-0000-000000000000	2e47051f-e85e-4e00-8896-1c48df4f7c63	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 03:03:06.396166+00	
00000000-0000-0000-0000-000000000000	235e1051-5537-4cb8-9cdc-0813c6cb4c9b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 03:13:11.67045+00	
00000000-0000-0000-0000-000000000000	46de30e8-db8a-4786-ab03-98ef3f5ce796	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 03:32:33.994665+00	
00000000-0000-0000-0000-000000000000	3e498e27-de20-42f7-8e48-6f65854c89c7	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 03:37:24.292418+00	
00000000-0000-0000-0000-000000000000	7ed78e80-afe0-4de7-9c28-a4d4ebbcf022	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 03:40:58.555836+00	
00000000-0000-0000-0000-000000000000	55ba2546-885b-4ddb-a1cb-02c147b81456	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 03:57:40.628689+00	
00000000-0000-0000-0000-000000000000	7f73d403-0c2b-4004-9589-ab9a96e30d21	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 03:59:15.528497+00	
00000000-0000-0000-0000-000000000000	c5345216-362e-45ae-9a44-6380e39861e8	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 04:10:57.388256+00	
00000000-0000-0000-0000-000000000000	4fc37b53-6dec-42ee-a40a-bca73f0286b0	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 04:42:40.394257+00	
00000000-0000-0000-0000-000000000000	43f8b63a-a83e-4179-9515-223f75508914	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 04:46:35.035814+00	
00000000-0000-0000-0000-000000000000	f10260c1-13a9-4d24-a928-97f2fe9f5413	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-14 21:12:01.080428+00	
00000000-0000-0000-0000-000000000000	4c16e67a-157d-443d-85ac-7c899cb34c67	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-15 20:31:06.103126+00	
00000000-0000-0000-0000-000000000000	82b88598-816a-4167-a14e-6d329936534e	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-15 20:31:06.113346+00	
00000000-0000-0000-0000-000000000000	a71d4be2-33c3-4683-a9f4-68b4f8e38dbe	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-15 20:31:08.755527+00	
00000000-0000-0000-0000-000000000000	5e61a033-1b2a-4a38-b48c-5e220603dacf	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-15 20:33:19.613002+00	
00000000-0000-0000-0000-000000000000	f89559d0-ce48-4c3e-b97f-b92c0256e220	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-15 21:35:09.136851+00	
00000000-0000-0000-0000-000000000000	f2686460-8659-4382-a169-b879c5b21f80	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-15 21:35:09.138502+00	
00000000-0000-0000-0000-000000000000	4ccd4a74-ae5d-4525-a1d3-73f72b10b71b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-15 22:22:07.338774+00	
00000000-0000-0000-0000-000000000000	9fe696b9-869c-4ec3-b490-f137f052cc64	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-15 22:24:13.328589+00	
00000000-0000-0000-0000-000000000000	769d94f7-7d66-4a34-be09-e03685925fff	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-15 23:17:59.217392+00	
00000000-0000-0000-0000-000000000000	97639b8e-2fc5-41a3-b658-3b57aa0641ed	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-15 23:34:09.50551+00	
00000000-0000-0000-0000-000000000000	eace6f7e-c787-4db5-9199-8a69da3266f9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-15 23:36:43.523927+00	
00000000-0000-0000-0000-000000000000	9e9a97dc-c826-4f66-b69f-9abf2b352e04	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 00:11:17.489316+00	
00000000-0000-0000-0000-000000000000	aa920f75-84bc-4af7-adfd-c3c9fb085f4c	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 00:28:21.150436+00	
00000000-0000-0000-0000-000000000000	83c9c718-efb6-4283-958c-f255400edca6	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 00:34:12.492422+00	
00000000-0000-0000-0000-000000000000	50ff10d7-c8bc-4830-964a-87b084535f79	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 00:43:08.406867+00	
00000000-0000-0000-0000-000000000000	15adfe6f-f9fb-4e52-b66d-a3bcf957c2fa	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 00:59:57.720405+00	
00000000-0000-0000-0000-000000000000	cb672a4d-fffe-4496-84b7-1f641523f0d9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:01:40.61098+00	
00000000-0000-0000-0000-000000000000	e971e1d0-8d31-4eaf-ba8e-0f83e0532ad5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:02:56.698024+00	
00000000-0000-0000-0000-000000000000	f98773df-b6c6-47e6-819a-8e8b5404e8c6	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:04:07.118866+00	
00000000-0000-0000-0000-000000000000	b1458e1c-67ba-405a-84af-26d2a2118fca	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 01:08:57.616357+00	
00000000-0000-0000-0000-000000000000	90ba4896-0b77-422b-b3a3-dd685ad91adc	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 01:08:57.619346+00	
00000000-0000-0000-0000-000000000000	80aa7a03-4c81-4650-8a7c-e4bfaefd9bf2	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:12:12.312733+00	
00000000-0000-0000-0000-000000000000	615ab9e9-b703-443b-a979-e68082db9437	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:15:03.661842+00	
00000000-0000-0000-0000-000000000000	0efa3851-ba84-4fbc-8859-2a06a7e02659	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:19:24.781139+00	
00000000-0000-0000-0000-000000000000	1f266ec4-77f6-4556-9ff4-1e84cbd1aba3	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:23:47.125934+00	
00000000-0000-0000-0000-000000000000	22138709-702b-41eb-a8ab-48df2a6b00f3	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:26:03.757967+00	
00000000-0000-0000-0000-000000000000	ec82aafb-27a5-42f3-9c2c-1c2758f8c921	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:30:41.040207+00	
00000000-0000-0000-0000-000000000000	c4e8075d-4462-4cc5-a0c8-0560226dadef	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:32:48.612964+00	
00000000-0000-0000-0000-000000000000	b5987892-54fe-4c1f-8db3-1c23468eee3f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:47:38.757426+00	
00000000-0000-0000-0000-000000000000	2f6c6155-7dce-4118-a478-7bf0b1be28ef	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 01:53:22.102328+00	
00000000-0000-0000-0000-000000000000	bb7b83dc-864b-4f6b-b81b-242bf189d189	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:05:38.615544+00	
00000000-0000-0000-0000-000000000000	92090965-c34a-4696-a70c-28a2d766b084	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:11:48.657957+00	
00000000-0000-0000-0000-000000000000	62dd39f3-4b3a-4c1e-b291-b6f3e7377403	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:15:48.419479+00	
00000000-0000-0000-0000-000000000000	a334c34c-b168-4a67-b547-65ab8bffe19a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:21:08.217759+00	
00000000-0000-0000-0000-000000000000	7072620f-99ec-40af-8d5c-1076bacd0533	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 02:25:06.021758+00	
00000000-0000-0000-0000-000000000000	8471996d-cfab-41f7-8667-778a117f5967	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 02:25:06.0233+00	
00000000-0000-0000-0000-000000000000	72445298-2b89-4532-bf16-0d6c14628da1	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 02:25:09.292336+00	
00000000-0000-0000-0000-000000000000	6675b007-5fdc-4c7b-84e6-cd05ed5108d0	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 02:25:09.544627+00	
00000000-0000-0000-0000-000000000000	860184ae-bba8-495a-9b0e-57bc0c36230d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:25:28.766348+00	
00000000-0000-0000-0000-000000000000	b7604253-88a0-4d8c-949d-f2c091ff46c0	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:35:24.542022+00	
00000000-0000-0000-0000-000000000000	d7aad5a8-1a46-4488-8ddd-6b0fc539aa9d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:36:31.410545+00	
00000000-0000-0000-0000-000000000000	d8afc2d3-7d72-441a-a72a-ae10a0a82024	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:37:27.10011+00	
00000000-0000-0000-0000-000000000000	8f2a57ab-6992-4809-addc-510c8b06236f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:47:25.742595+00	
00000000-0000-0000-0000-000000000000	4459b3df-6d1b-4bc2-826c-d356b354c59b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 02:55:31.067895+00	
00000000-0000-0000-0000-000000000000	1b51d904-8006-46aa-bbe2-b22ecb50c56b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 16:57:44.969521+00	
00000000-0000-0000-0000-000000000000	07154a62-ad17-4ecd-ab9d-7a9794cd639d	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 19:03:24.786402+00	
00000000-0000-0000-0000-000000000000	02a885bb-5bc0-461f-a173-cddad59e00b8	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 19:03:24.789704+00	
00000000-0000-0000-0000-000000000000	7e20a1cb-42be-4aae-b702-b17b2e7d2faf	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 19:03:37.369832+00	
00000000-0000-0000-0000-000000000000	dca50229-372c-41d9-b70c-f97c2ed6fc93	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 19:15:50.656131+00	
00000000-0000-0000-0000-000000000000	8eecabe5-635c-412d-ac23-8208cb4b846c	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 19:51:26.669041+00	
00000000-0000-0000-0000-000000000000	92a6da71-17d3-4ffb-be31-643510a1638a	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 22:58:00.131702+00	
00000000-0000-0000-0000-000000000000	26b2b5e3-360a-4441-811c-6f8547bc53b3	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-16 22:58:00.140739+00	
00000000-0000-0000-0000-000000000000	f1dfddde-c668-4d1e-ae7f-0a8e9c975019	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 22:58:15.541729+00	
00000000-0000-0000-0000-000000000000	938f62c2-aaaa-402b-975d-ad0254d2566a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 23:11:29.168028+00	
00000000-0000-0000-0000-000000000000	9d2093af-d4ba-4725-9c9e-f49780d99831	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-16 23:15:49.424338+00	
00000000-0000-0000-0000-000000000000	be5c916c-c1bb-48ae-9eda-981a176bdf66	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-17 21:03:58.295105+00	
00000000-0000-0000-0000-000000000000	d1d9cb44-9d1d-46b8-8bc5-a6f86d13baef	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-17 21:03:58.304139+00	
00000000-0000-0000-0000-000000000000	06d4659d-e56b-4ab5-a30b-5e8856c0b673	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-17 21:15:16.903083+00	
00000000-0000-0000-0000-000000000000	1f11f67f-f462-41b6-8f26-cca2af745f01	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 00:12:28.881068+00	
00000000-0000-0000-0000-000000000000	7f06b850-8e67-43a0-a879-c93dbbec51d8	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 00:24:38.59882+00	
00000000-0000-0000-0000-000000000000	a224d043-bef7-4d07-ad79-26ae95087558	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 00:31:34.656202+00	
00000000-0000-0000-0000-000000000000	c8e273b0-0983-4fca-a750-91589370bd9b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 00:41:43.102086+00	
00000000-0000-0000-0000-000000000000	5b7adcce-f44f-4abf-8418-8dea2e1550c4	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 00:57:57.096655+00	
00000000-0000-0000-0000-000000000000	d930524e-22db-4d6f-9f6a-c2b208cc7aaf	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 01:03:06.322808+00	
00000000-0000-0000-0000-000000000000	511f0f75-a125-44c9-8fc3-751b2c616705	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 01:03:08.682576+00	
00000000-0000-0000-0000-000000000000	8a2309e4-fa34-4319-955a-77c57a0e604d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 01:06:28.319768+00	
00000000-0000-0000-0000-000000000000	4654aa6a-a321-4984-be95-e326b8aee425	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 01:36:20.056987+00	
00000000-0000-0000-0000-000000000000	1cd2cda1-9da0-4d00-9ee1-722971abf4fe	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 02:22:34.199371+00	
00000000-0000-0000-0000-000000000000	dcd97f71-2300-43a4-a79c-fd715b1b0864	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 02:22:34.205674+00	
00000000-0000-0000-0000-000000000000	b89256f3-4c3d-4205-8637-a57538db424d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 02:22:51.128528+00	
00000000-0000-0000-0000-000000000000	e2f28877-c5b0-4717-b652-cd561e168a11	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 02:28:54.996251+00	
00000000-0000-0000-0000-000000000000	7d1a36a9-37d6-4b13-b8d7-11c3554bda1e	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 02:33:28.420828+00	
00000000-0000-0000-0000-000000000000	ca456069-64a2-45ca-bd54-084113c11498	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 02:39:55.617064+00	
00000000-0000-0000-0000-000000000000	da877ecf-5b83-41f8-92aa-3a87d1b6c769	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 02:44:02.202988+00	
00000000-0000-0000-0000-000000000000	652d4647-1e79-4d1d-939c-b59f8509a7da	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 02:50:17.982801+00	
00000000-0000-0000-0000-000000000000	4eac6eec-85d1-4ea7-9dac-26a79aa95d75	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 02:53:09.790971+00	
00000000-0000-0000-0000-000000000000	ef6c8ef9-e697-4110-a1fb-fe391db7b795	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 02:59:30.99893+00	
00000000-0000-0000-0000-000000000000	0e653d1d-7121-4f4e-b9c3-85320ccc996e	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 03:00:52.623245+00	
00000000-0000-0000-0000-000000000000	a0bbbd59-0d28-4eb4-8bc4-7d8ea9a0c02d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 03:05:27.378266+00	
00000000-0000-0000-0000-000000000000	cf36151b-d3a2-40e1-9427-d57bc890fec6	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 03:07:47.333888+00	
00000000-0000-0000-0000-000000000000	e0ae76d3-0f70-48ec-847e-fad3c4c3feb9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 03:12:39.252506+00	
00000000-0000-0000-0000-000000000000	a2a1ea00-e16a-4dcf-a218-a7640b99d353	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 03:18:21.866364+00	
00000000-0000-0000-0000-000000000000	beddea3e-6f01-45f4-a56a-0af271ad2fbf	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 03:19:07.529632+00	
00000000-0000-0000-0000-000000000000	2673d598-e5e2-4020-bb10-68ca50052e67	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 03:19:07.530302+00	
00000000-0000-0000-0000-000000000000	a35dc5b6-e572-4543-9f4e-6db42711666d	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 07:50:35.818836+00	
00000000-0000-0000-0000-000000000000	77b83d6f-611e-4dc2-af42-bca014d733c7	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 07:50:35.829715+00	
00000000-0000-0000-0000-000000000000	aa361c77-17a7-4dce-abef-125b38615139	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 07:50:49.94939+00	
00000000-0000-0000-0000-000000000000	86479c47-e5d3-43f7-948a-c051d630ae8a	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 18:01:18.747782+00	
00000000-0000-0000-0000-000000000000	a605494e-2070-4d87-8b17-c6e2954636dc	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 18:01:18.75035+00	
00000000-0000-0000-0000-000000000000	f9b9638d-34c5-4b2d-9067-fedaa23e9d97	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 18:01:31.505885+00	
00000000-0000-0000-0000-000000000000	e01afde6-f605-4031-8bf1-4442542fc4f4	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 18:09:32.828293+00	
00000000-0000-0000-0000-000000000000	f1178055-0830-46bb-97fb-15476a9627e3	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 18:13:55.735438+00	
00000000-0000-0000-0000-000000000000	6e0231fa-991d-4837-af08-7024591bc2fd	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 18:23:24.421859+00	
00000000-0000-0000-0000-000000000000	baea1a76-2d1f-4d42-86f9-8e3c6a0588a6	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 18:35:24.525286+00	
00000000-0000-0000-0000-000000000000	ad9139ea-2b2c-495f-97cd-234357ff44eb	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 18:42:34.782799+00	
00000000-0000-0000-0000-000000000000	9305ec4d-43b1-41bb-8ee4-ce74204df919	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 18:46:12.024326+00	
00000000-0000-0000-0000-000000000000	687e74a5-4e47-4e3a-a23d-f038d3b36b60	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 18:51:02.313591+00	
00000000-0000-0000-0000-000000000000	6808403f-9217-4ca0-aeda-ba000b813523	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 18:55:13.481336+00	
00000000-0000-0000-0000-000000000000	b851f103-c473-4584-873c-b3f3d203d25e	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 19:03:01.493592+00	
00000000-0000-0000-0000-000000000000	923d203a-acd0-47fb-9192-b2fa5d49ebfc	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 19:10:08.405453+00	
00000000-0000-0000-0000-000000000000	b0303f6c-ac6f-4980-929d-8aa5e99d06e1	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 19:14:58.247005+00	
00000000-0000-0000-0000-000000000000	4effef8a-a509-465a-8991-b4707085f419	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 19:18:02.333064+00	
00000000-0000-0000-0000-000000000000	8e02db46-3f44-475e-8f32-c51e2afe32dc	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-18 19:18:02.333964+00	
00000000-0000-0000-0000-000000000000	442736ea-6c62-4f78-94f6-3abebe0b6bdc	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 19:21:18.129421+00	
00000000-0000-0000-0000-000000000000	94e01ee5-768e-4a0a-8aec-6d229ff49fd5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 19:24:37.652395+00	
00000000-0000-0000-0000-000000000000	c4316982-635e-43bf-a54f-3ceafd03c093	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 19:38:28.267118+00	
00000000-0000-0000-0000-000000000000	c53690cf-4395-4423-b986-b6265eab4026	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 19:48:56.776669+00	
00000000-0000-0000-0000-000000000000	3eee4ce1-d302-41e7-b470-75cfb8a6305e	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 19:57:27.562633+00	
00000000-0000-0000-0000-000000000000	044d43e9-d0aa-4bbc-a6b4-09b9579b59fb	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 20:00:08.445662+00	
00000000-0000-0000-0000-000000000000	203e9512-0c05-4f55-8c15-e3f4405080d3	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 20:02:51.4075+00	
00000000-0000-0000-0000-000000000000	6b50db6b-7ed0-4c52-935e-0179835b309c	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 20:16:05.012323+00	
00000000-0000-0000-0000-000000000000	4d748693-069f-487e-9ca6-cb33cd7608ac	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 20:23:56.616432+00	
00000000-0000-0000-0000-000000000000	3bfc47f1-e6a8-44ba-973a-da9b508f1a2f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 20:30:21.001815+00	
00000000-0000-0000-0000-000000000000	af30e74b-8022-4609-950e-0f0be8da23ac	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 20:34:54.058124+00	
00000000-0000-0000-0000-000000000000	281a46be-4d21-4465-9da3-f7fd7b249c51	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 22:47:15.684405+00	
00000000-0000-0000-0000-000000000000	21ce4049-1fbd-44bc-b1ee-713ef6fe6ce1	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-18 22:49:15.458401+00	
00000000-0000-0000-0000-000000000000	a031c998-7abb-4da5-8595-93359df80bd8	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-18 22:54:07.306115+00	
00000000-0000-0000-0000-000000000000	8ae4a7c4-4b43-4a07-bd83-01a0a1911490	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 01:13:15.990125+00	
00000000-0000-0000-0000-000000000000	7f581f16-c6a7-452d-ac28-cedc04bcacec	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-19 02:56:14.485089+00	
00000000-0000-0000-0000-000000000000	95ad9452-0005-48fc-918c-918b9d135d6c	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-19 02:56:14.489932+00	
00000000-0000-0000-0000-000000000000	34b2a390-c5f6-4491-be64-885eb8a8c51b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 02:56:34.21838+00	
00000000-0000-0000-0000-000000000000	16155f53-176d-4b62-be53-8c8cc363e453	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 02:59:37.478486+00	
00000000-0000-0000-0000-000000000000	bcf64455-769f-49c0-9432-f2c74370597f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 03:12:55.410884+00	
00000000-0000-0000-0000-000000000000	235a0b88-c777-4fa6-b941-1512d8555c12	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 03:25:37.595857+00	
00000000-0000-0000-0000-000000000000	10f3391d-1599-470f-b78f-9d49aacb0028	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 03:35:12.093087+00	
00000000-0000-0000-0000-000000000000	d7bb7c4b-c9af-48bf-93c8-2fd2c71c8ddb	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 03:45:18.597208+00	
00000000-0000-0000-0000-000000000000	ced7ac5c-a3c1-48e4-b37f-9049b843b926	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 03:49:01.261187+00	
00000000-0000-0000-0000-000000000000	39c79716-f167-441b-a48f-62d7776ab39d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 03:56:49.852604+00	
00000000-0000-0000-0000-000000000000	2e90797c-4bb0-409b-b00c-aa9ea005e0b5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 04:11:05.191973+00	
00000000-0000-0000-0000-000000000000	5e4534c1-9cbe-458e-b12f-8c9f47ca666c	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 04:13:37.081545+00	
00000000-0000-0000-0000-000000000000	a0f27953-21c2-49c9-9969-82e5c9bec4f8	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 04:22:21.550892+00	
00000000-0000-0000-0000-000000000000	73c1db26-da3c-4720-ab28-7a06898bf25f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 04:27:57.975269+00	
00000000-0000-0000-0000-000000000000	8453161d-3b5a-43c6-a6e5-ff68f3cd9d70	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 04:42:24.360354+00	
00000000-0000-0000-0000-000000000000	5b2ab3a3-554c-407b-b539-0a8bab9d8542	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 04:55:19.961814+00	
00000000-0000-0000-0000-000000000000	e0937286-452a-4d49-a6e2-3b680ec9f423	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 05:03:18.454431+00	
00000000-0000-0000-0000-000000000000	a4cd3efb-62d0-4735-b306-9e84d2d40ed9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 05:27:23.370484+00	
00000000-0000-0000-0000-000000000000	e2e8e190-d52c-4726-98ab-9f6faa43ed94	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 05:38:29.773317+00	
00000000-0000-0000-0000-000000000000	5cfd6d71-7a09-4b69-ba16-a71a1ff5d09f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 05:48:43.813061+00	
00000000-0000-0000-0000-000000000000	bb9e0d2e-f081-4202-8e4b-7e7039e0c5c7	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 05:53:00.255755+00	
00000000-0000-0000-0000-000000000000	6b192d5c-0f62-4fbb-ab38-aaa97394ace2	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 06:13:54.362363+00	
00000000-0000-0000-0000-000000000000	10249ec0-a3b0-4334-85d4-d0f1d563b839	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 06:18:12.025472+00	
00000000-0000-0000-0000-000000000000	85c8335f-85a7-4f26-8fa1-93a3f7ca3ebd	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 06:18:16.035633+00	
00000000-0000-0000-0000-000000000000	d710651f-140d-4a88-90cf-c9f2c6094af3	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 06:19:48.502432+00	
00000000-0000-0000-0000-000000000000	996e7c1d-153e-4135-96f0-9924df7d7cd5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 06:29:21.102739+00	
00000000-0000-0000-0000-000000000000	461b9a32-1ea4-4c1c-b52c-4029aab3045e	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 06:35:17.535248+00	
00000000-0000-0000-0000-000000000000	38f76708-d1e7-4eb8-befb-813ee7c78868	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 06:43:54.148327+00	
00000000-0000-0000-0000-000000000000	e9ab276b-f4ce-4007-be88-05d85eb5c0af	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-19 06:50:00.210984+00	
00000000-0000-0000-0000-000000000000	eea8bd2f-c543-4eee-91c4-274f04afdabf	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 16:34:18.586228+00	
00000000-0000-0000-0000-000000000000	af2a9a34-4155-4339-8f8a-c9a9c424161c	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 21:18:53.372488+00	
00000000-0000-0000-0000-000000000000	60a73735-ecd1-48e7-9de8-cdbe0df95505	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-19 21:24:07.796844+00	
00000000-0000-0000-0000-000000000000	10c399f0-be95-47b6-81ef-0a2a48723a98	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-19 21:24:16.789379+00	
00000000-0000-0000-0000-000000000000	923c20d2-9c53-4875-83db-e85d1e990c56	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 02:11:27.414579+00	
00000000-0000-0000-0000-000000000000	74114a93-0eec-4919-ad34-0371333c3ec1	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 02:19:56.111127+00	
00000000-0000-0000-0000-000000000000	72e6fffe-ef30-4c02-8990-6e2d76a5eb18	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 02:32:46.809707+00	
00000000-0000-0000-0000-000000000000	5096a586-0e4f-4894-92da-4509339575e6	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 02:40:27.411743+00	
00000000-0000-0000-0000-000000000000	6e6d96ef-5b01-4091-a4a2-1d40fd2e3673	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 02:52:10.302394+00	
00000000-0000-0000-0000-000000000000	c3f41ab4-cd50-4b57-b54f-2e79ec187d8f	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 03:00:02.96718+00	
00000000-0000-0000-0000-000000000000	6d59c44a-5439-4b0b-908e-53e11d3fe8c1	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 03:38:27.382185+00	
00000000-0000-0000-0000-000000000000	3dfedaa1-1bc2-4676-8170-d313395acfce	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 03:42:29.650569+00	
00000000-0000-0000-0000-000000000000	2b6f7912-8ab6-4ea7-bed7-ef636a526d7d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 03:58:13.851238+00	
00000000-0000-0000-0000-000000000000	d9d1ce97-1f2a-4078-ac28-9a4f570927cc	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 04:37:54.267654+00	
00000000-0000-0000-0000-000000000000	0ff932e1-2373-4bed-a8e0-1cd493e0aedd	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 04:58:27.441813+00	
00000000-0000-0000-0000-000000000000	c26f98ed-15a3-42d7-a6ac-9159fcf3ee48	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 05:11:04.258625+00	
00000000-0000-0000-0000-000000000000	c7708e64-7b24-45e7-926e-5bae14e9c304	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 05:28:44.161959+00	
00000000-0000-0000-0000-000000000000	6aacf02d-11ae-44b9-b0a7-3d41ea262d06	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 05:28:44.162906+00	
00000000-0000-0000-0000-000000000000	4a86e7a3-6b81-4159-8a0e-aa3f653cb76b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 05:33:43.171503+00	
00000000-0000-0000-0000-000000000000	5bbb84a8-c73b-4ef2-bace-56d55d7ee82c	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 05:41:39.376805+00	
00000000-0000-0000-0000-000000000000	82db6576-b0ea-4098-a578-c45c985b6eb9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 05:42:24.531007+00	
00000000-0000-0000-0000-000000000000	e510f67b-02b3-40dc-adaf-0d336981e9fe	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 20:09:59.647006+00	
00000000-0000-0000-0000-000000000000	f4e7e40a-218f-41bf-8ec8-59f14c43909b	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 20:09:59.656103+00	
00000000-0000-0000-0000-000000000000	305ad551-214b-4a98-bee1-933029951518	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 20:10:00.632253+00	
00000000-0000-0000-0000-000000000000	cb0e5f04-58f2-4c0f-b1be-49c7c6fde8d7	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 20:10:01.561244+00	
00000000-0000-0000-0000-000000000000	2b53594d-bf34-49f6-865e-952141b945ed	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 20:10:02.717884+00	
00000000-0000-0000-0000-000000000000	59ce0f02-e794-41be-9e63-1dc8391d7eb3	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 20:10:02.78741+00	
00000000-0000-0000-0000-000000000000	b6f2277f-1811-44c6-a1d1-936c825f6e9b	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 20:10:02.880276+00	
00000000-0000-0000-0000-000000000000	d0b6543b-9dfa-4791-b55c-9ec772447152	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 20:10:08.718563+00	
00000000-0000-0000-0000-000000000000	5f2ea83d-da5a-4316-8a57-3a52d625ebe8	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-20 20:38:10.906239+00	
00000000-0000-0000-0000-000000000000	86e82076-01c7-43d1-b1ce-b8b1fbe1e67e	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 20:38:18.519782+00	
00000000-0000-0000-0000-000000000000	ea5cbaaa-1515-4e92-8935-23091121f40a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 20:39:24.660629+00	
00000000-0000-0000-0000-000000000000	957da911-6461-4b36-a2a4-8774c5698ee0	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 20:45:57.55869+00	
00000000-0000-0000-0000-000000000000	1697bdd6-03a8-4fab-afc3-a18f3946c543	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 20:53:41.565045+00	
00000000-0000-0000-0000-000000000000	cc68695d-8852-4855-bcb5-a28beb5bf5e0	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 21:07:41.320289+00	
00000000-0000-0000-0000-000000000000	d1f6363f-303a-406a-92b4-42ff64fe16dd	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 21:31:12.155495+00	
00000000-0000-0000-0000-000000000000	d67726ab-c281-4fc0-991e-e5bdda3e3174	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 21:45:52.810643+00	
00000000-0000-0000-0000-000000000000	12feb8ed-f283-4b09-b3bc-77c55562b2fa	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 22:00:54.09308+00	
00000000-0000-0000-0000-000000000000	7d3f7c6b-686c-4f27-9e64-2e30cf698e81	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 22:29:51.038088+00	
00000000-0000-0000-0000-000000000000	2c6ecd0a-fafb-4385-ad17-4464ff5851bb	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-20 22:29:51.041749+00	
00000000-0000-0000-0000-000000000000	0fb08a4d-3f3b-48b7-92c4-d38895b4a2e2	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 22:37:23.072758+00	
00000000-0000-0000-0000-000000000000	c0997497-71bb-47fe-8499-92629e16a638	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 22:43:46.168419+00	
00000000-0000-0000-0000-000000000000	5965e78a-08f6-4dfc-b29d-a12023dd7c69	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 22:51:50.079659+00	
00000000-0000-0000-0000-000000000000	f7c61d3b-2d44-4883-be53-702555e8e256	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 23:09:58.563838+00	
00000000-0000-0000-0000-000000000000	a6cc6f7a-4e1b-4c6c-918f-d242ee799236	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 23:10:27.433482+00	
00000000-0000-0000-0000-000000000000	0bb18bb3-3b2a-4818-ba33-5f529e701f71	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 23:19:20.071803+00	
00000000-0000-0000-0000-000000000000	3ed8527c-0f9a-410c-a492-5aeb3efd3188	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 23:31:30.556682+00	
00000000-0000-0000-0000-000000000000	b9b4f98d-8441-4a37-ad1e-fdcfda2bb776	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 23:38:39.181269+00	
00000000-0000-0000-0000-000000000000	c14547f3-54b1-41e7-936a-440f304662e7	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-20 23:59:57.38938+00	
00000000-0000-0000-0000-000000000000	e7f9927f-80cb-4cba-86bc-dca9e344fe4a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 00:21:54.994512+00	
00000000-0000-0000-0000-000000000000	601ebc12-bcd1-438f-8caa-a0fe0099316d	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 00:42:08.124877+00	
00000000-0000-0000-0000-000000000000	b6f3b2aa-1f78-4100-a5f3-bae0800a7dc1	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 00:42:08.126701+00	
00000000-0000-0000-0000-000000000000	11e7a805-15bb-4905-acf8-de571de637a9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 00:59:08.026476+00	
00000000-0000-0000-0000-000000000000	ee49cf00-d58a-405c-881f-a88188cf63b3	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 01:05:29.667549+00	
00000000-0000-0000-0000-000000000000	b53c082d-ec26-4b56-8f09-d59374fa2726	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 01:18:12.675574+00	
00000000-0000-0000-0000-000000000000	51590b62-24ff-41cc-bc03-788aa514ace7	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 01:19:30.505629+00	
00000000-0000-0000-0000-000000000000	73771f75-8e1c-4474-a27a-0437b0d75460	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 01:30:26.648191+00	
00000000-0000-0000-0000-000000000000	3fb59c32-c75c-419c-a218-57589e1159bf	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 01:30:50.475171+00	
00000000-0000-0000-0000-000000000000	de4bc5ee-21f2-4120-ac67-5f9fba4b9d29	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 01:30:50.477887+00	
00000000-0000-0000-0000-000000000000	5f0e76cf-7b7b-4025-b389-965a0aae99c8	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 01:35:49.856833+00	
00000000-0000-0000-0000-000000000000	67f58523-f85a-4023-b6a2-e1b024f44213	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 01:36:27.041894+00	
00000000-0000-0000-0000-000000000000	aa7d2b9c-3d27-4c28-989e-51c7b3ab0739	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 01:37:46.626014+00	
00000000-0000-0000-0000-000000000000	74942450-f093-4197-aa8b-1b9676985e46	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 01:40:16.587098+00	
00000000-0000-0000-0000-000000000000	e4a014c6-ab8f-4384-80fb-e41cad9b2085	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 01:43:19.905105+00	
00000000-0000-0000-0000-000000000000	4fad5f15-ed2c-45d6-a666-514c7527f432	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 04:32:16.540285+00	
00000000-0000-0000-0000-000000000000	daba96be-131b-46c7-b65b-cbd45bc93de8	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 04:32:50.603026+00	
00000000-0000-0000-0000-000000000000	b5273197-04c5-4c4c-bd20-5a9f1fc83906	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 04:36:29.228697+00	
00000000-0000-0000-0000-000000000000	bbfe2e05-1766-4055-acac-a9b26695d9c2	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 04:37:32.90478+00	
00000000-0000-0000-0000-000000000000	1d171fb9-c333-4d51-955c-387d392227e7	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 04:42:44.995898+00	
00000000-0000-0000-0000-000000000000	7496aa0e-ead7-4949-9e89-f9649d67c920	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 05:12:00.376966+00	
00000000-0000-0000-0000-000000000000	fce42abf-594c-49f5-9878-e9f17ee17e9d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 05:17:17.648145+00	
00000000-0000-0000-0000-000000000000	5ee31585-f9eb-4ddf-8df7-c83878063a79	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 05:30:04.946553+00	
00000000-0000-0000-0000-000000000000	f38e135b-1ebd-4d81-a24c-fd2d1b05feb0	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 05:34:38.283541+00	
00000000-0000-0000-0000-000000000000	82889b85-ff1c-4144-a679-5f1f39b9b164	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 05:38:07.293605+00	
00000000-0000-0000-0000-000000000000	fc4c2ea2-9d10-4319-93f7-cd7c100758ec	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 05:41:44.573082+00	
00000000-0000-0000-0000-000000000000	6e0f27b0-a7a1-43e1-923b-9b1942cbe3a9	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 05:41:44.574295+00	
00000000-0000-0000-0000-000000000000	500b1a42-85bc-429b-8248-10329eab63a9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 06:00:37.865386+00	
00000000-0000-0000-0000-000000000000	0417de95-2d6a-4964-9cba-a3c23bb006c4	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 07:08:19.166034+00	
00000000-0000-0000-0000-000000000000	2ce1a56d-dfe1-4a52-8936-239187972eda	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 16:51:05.220974+00	
00000000-0000-0000-0000-000000000000	4199a7d4-efbf-4126-9657-0836765baabc	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 17:06:07.503663+00	
00000000-0000-0000-0000-000000000000	5d4959b3-9578-4d10-b65c-1de332505c29	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 17:07:12.271918+00	
00000000-0000-0000-0000-000000000000	c681982a-a29c-47a1-8380-2a61e54900df	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 17:07:12.272529+00	
00000000-0000-0000-0000-000000000000	29e7f03b-ddc7-4af6-8b76-6e34b9474380	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 17:07:36.34617+00	
00000000-0000-0000-0000-000000000000	829409ba-9b78-4c54-b9e3-067a781505c0	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 17:12:34.869544+00	
00000000-0000-0000-0000-000000000000	a40741f3-d526-4c64-9112-a6d4b1f98380	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 17:18:29.502129+00	
00000000-0000-0000-0000-000000000000	ced7372e-f5e6-48a2-b8c6-c1e10fc136b2	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 17:30:51.81922+00	
00000000-0000-0000-0000-000000000000	9f85c63a-ef8b-4b47-8aee-c2178e0806b6	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 18:34:16.582057+00	
00000000-0000-0000-0000-000000000000	1936eb1c-3a99-41a5-9943-7be6ea8b68bc	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 18:34:16.585519+00	
00000000-0000-0000-0000-000000000000	652259c3-e25c-48db-8bcd-09c9562bb603	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 18:34:27.802173+00	
00000000-0000-0000-0000-000000000000	00401fb5-1f50-4bde-bc8b-b5fb195f0f74	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 18:49:09.121505+00	
00000000-0000-0000-0000-000000000000	6ad4fa45-0e2b-4143-97d4-cdfda4951ccf	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 18:52:47.905185+00	
00000000-0000-0000-0000-000000000000	25162243-4ba6-4319-9f48-8a9f1cbcd1e7	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 19:08:41.935087+00	
00000000-0000-0000-0000-000000000000	2b5e0136-6c55-4c64-be02-11fb4fd5d0b3	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 19:11:08.625508+00	
00000000-0000-0000-0000-000000000000	9f9e9bff-2e2f-491e-9b9c-9ec149b343bf	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 19:11:08.628661+00	
00000000-0000-0000-0000-000000000000	0a09ca42-3b26-4b82-8c74-f19b87fd5a46	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 19:11:20.819182+00	
00000000-0000-0000-0000-000000000000	83a44ab8-3b36-41b1-82e7-47a58f2df643	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 19:13:44.552693+00	
00000000-0000-0000-0000-000000000000	668ad545-ddab-4891-a4db-9afe6b60c112	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 19:19:47.318765+00	
00000000-0000-0000-0000-000000000000	6ef2a510-1a3f-484b-be7e-3b0ff30bcd14	{"action":"logout","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-05-21 19:32:34.834056+00	
00000000-0000-0000-0000-000000000000	f65f2b15-fd15-4fa8-ab06-40cb9a47dd72	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 19:32:41.426542+00	
00000000-0000-0000-0000-000000000000	dc9889e1-e390-4be1-9fec-62d80117ac48	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 19:41:07.565446+00	
00000000-0000-0000-0000-000000000000	9d199691-8b74-47ce-ba05-b607cac8d4ed	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 19:47:56.699305+00	
00000000-0000-0000-0000-000000000000	26a3ee5e-58fd-45ff-ae84-67498e7c2717	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 20:08:46.284593+00	
00000000-0000-0000-0000-000000000000	85aef349-a189-4026-8ffa-8ae794945742	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 20:34:10.174424+00	
00000000-0000-0000-0000-000000000000	abe9fb09-32cf-41ed-8a20-bf5e00992d5b	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 21:07:21.011017+00	
00000000-0000-0000-0000-000000000000	de139c42-13b6-41b8-a611-1af21bc84c6c	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 21:07:21.013853+00	
00000000-0000-0000-0000-000000000000	fd2d7cc3-719f-4437-922d-26660c73cc90	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 22:06:40.631137+00	
00000000-0000-0000-0000-000000000000	5ea8dce7-d393-4e71-9e5f-6dac22d546ef	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 22:06:40.632018+00	
00000000-0000-0000-0000-000000000000	aa0d4f51-a8e3-47dd-a499-2c95a6867180	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 23:05:26.695625+00	
00000000-0000-0000-0000-000000000000	f61aed27-ea0b-41af-af63-a49771a902db	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-21 23:05:26.700176+00	
00000000-0000-0000-0000-000000000000	afca0ca7-ec56-4df0-aa39-54949258c599	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 23:44:11.339832+00	
00000000-0000-0000-0000-000000000000	180035f4-9ee3-4adb-aae8-e608354dad5b	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-21 23:54:05.839915+00	
00000000-0000-0000-0000-000000000000	5cca4e75-7196-4d4b-a65a-0031836bf4aa	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-22 00:02:00.388177+00	
00000000-0000-0000-0000-000000000000	bfda52ac-5687-4b98-8aea-fa582df48ae5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-22 00:10:39.509214+00	
00000000-0000-0000-0000-000000000000	77ec411e-eebc-4b97-a355-8898f2366fd2	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-22 00:16:41.779314+00	
00000000-0000-0000-0000-000000000000	6b6df9b2-715e-47ce-9492-250830a4a518	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-22 00:25:36.996399+00	
00000000-0000-0000-0000-000000000000	7620e149-1304-4dd5-90dd-3252c92c0e0d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-22 00:36:18.481392+00	
00000000-0000-0000-0000-000000000000	b602ebdb-62fc-4621-b0de-c2822da74ace	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-22 00:41:08.285371+00	
00000000-0000-0000-0000-000000000000	76e5961d-c53a-4775-a3dd-a28d6bfe5780	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 01:39:25.95769+00	
00000000-0000-0000-0000-000000000000	d2e3809e-432d-4e3f-b505-3894118896f8	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 01:39:25.961343+00	
00000000-0000-0000-0000-000000000000	a96cdcd1-7915-41dd-9ffc-ed2adfb4d736	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 02:37:26.0731+00	
00000000-0000-0000-0000-000000000000	9c8c656a-5cf3-485b-b648-7f8c88b0d927	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 02:37:26.07792+00	
00000000-0000-0000-0000-000000000000	6200bfc2-845c-4fc0-867a-f160aeda5f7e	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 03:35:55.978122+00	
00000000-0000-0000-0000-000000000000	8fdfd6fd-c125-46b4-bb66-7b416b739349	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 03:35:55.980575+00	
00000000-0000-0000-0000-000000000000	9c2a884a-94f8-4305-a3b7-e70e77c6d73c	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 04:33:55.883804+00	
00000000-0000-0000-0000-000000000000	0b7710d4-f751-4293-91e9-1429f8874170	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 04:33:55.889592+00	
00000000-0000-0000-0000-000000000000	7b8c4c61-260e-425a-be87-bbe02a1b4daf	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 05:31:55.878195+00	
00000000-0000-0000-0000-000000000000	960af252-7f99-4c08-a5e1-d0f6d6440262	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 05:31:55.881198+00	
00000000-0000-0000-0000-000000000000	941f3d3f-128c-4399-b8df-57cfdcc2af7b	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 05:40:38.693599+00	
00000000-0000-0000-0000-000000000000	0277a5ae-2515-4a01-9294-b3848b0949b9	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 05:40:38.697823+00	
00000000-0000-0000-0000-000000000000	4770160a-73e6-480f-95d7-d597b58c39f9	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 06:29:56.056616+00	
00000000-0000-0000-0000-000000000000	99758afd-0262-46ae-b67a-c75c10184e35	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 06:29:56.063179+00	
00000000-0000-0000-0000-000000000000	36fa93c4-15be-4a3a-a814-abcaafadaccd	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 07:28:26.069856+00	
00000000-0000-0000-0000-000000000000	d653f97f-82be-4e32-a164-966be596d3af	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 07:28:26.071867+00	
00000000-0000-0000-0000-000000000000	7e89e0a9-aac8-40bc-9aa2-cc66d955d7b0	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 08:26:55.942074+00	
00000000-0000-0000-0000-000000000000	98376ec7-f72c-476e-8834-13e6111d58eb	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 08:26:55.944871+00	
00000000-0000-0000-0000-000000000000	b0a593c2-41e1-41b6-a73b-9af14c29385c	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 09:24:55.957235+00	
00000000-0000-0000-0000-000000000000	b7bb66ca-c613-4bcf-b09b-dab4f97af5a0	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 09:24:55.959569+00	
00000000-0000-0000-0000-000000000000	5f01272e-62b9-4769-98b3-49e494f23e32	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 10:22:56.03382+00	
00000000-0000-0000-0000-000000000000	df4b24f4-86ea-4a56-a0f7-792b0e1b74cc	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 10:22:56.03619+00	
00000000-0000-0000-0000-000000000000	f5407186-8c49-4cff-88b2-32abe72337d9	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 11:21:25.893778+00	
00000000-0000-0000-0000-000000000000	a4f86a8e-7277-47ec-a08a-88034835f3c7	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 11:21:25.897153+00	
00000000-0000-0000-0000-000000000000	512e2b6e-badc-4b77-993f-2c852359b9e7	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 12:19:26.274161+00	
00000000-0000-0000-0000-000000000000	6fcc4df1-5b51-4608-82e1-8b7623ded8e6	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 12:19:26.277036+00	
00000000-0000-0000-0000-000000000000	8172cc56-b05a-448c-9200-f19f036a32bc	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 13:17:55.903998+00	
00000000-0000-0000-0000-000000000000	19fa82a5-6df4-4154-a6b4-3483baf5f614	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 13:17:55.907623+00	
00000000-0000-0000-0000-000000000000	f223bd7e-268a-46a9-80d6-4e0fae13bf26	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 14:15:55.944518+00	
00000000-0000-0000-0000-000000000000	5ff159fc-fb8d-4de1-9e9e-3e7b891415aa	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 14:15:55.947249+00	
00000000-0000-0000-0000-000000000000	d4140c0b-b7bb-411a-a303-ab999fe21cbe	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-22 14:56:25.453509+00	
00000000-0000-0000-0000-000000000000	a0fba958-2469-4a73-b76a-be36b5871de0	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 21:39:13.532743+00	
00000000-0000-0000-0000-000000000000	ef657f7f-1602-4f49-a40c-3ddd0204cda5	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 21:39:13.545737+00	
00000000-0000-0000-0000-000000000000	1a1d8c25-2213-4671-ae4d-2eaae6a84a66	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 21:39:14.420505+00	
00000000-0000-0000-0000-000000000000	8a1cb86d-65a3-4ff3-b1ee-c39bed3961a1	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 21:39:15.18921+00	
00000000-0000-0000-0000-000000000000	bc2c4129-6945-4e3b-8bef-d8586275387c	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 21:39:15.771987+00	
00000000-0000-0000-0000-000000000000	e92a3f4b-a6ac-4282-af46-f5a490e388e6	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 22:54:15.336456+00	
00000000-0000-0000-0000-000000000000	dfa8d6c3-cdba-42ee-bb16-d2544e12d081	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-22 22:54:15.339917+00	
00000000-0000-0000-0000-000000000000	30670131-0002-4b0f-ad33-52ff496cd071	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-23 03:49:23.896983+00	
00000000-0000-0000-0000-000000000000	4dcbd5fc-c786-4288-892f-f5601de3b306	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-23 03:49:23.913116+00	
00000000-0000-0000-0000-000000000000	2c70b13e-ab68-476d-af54-ef3abe4a629e	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-25 22:15:15.910533+00	
00000000-0000-0000-0000-000000000000	22a35387-2816-4410-b588-cc7d1a79d307	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-25 22:15:15.92164+00	
00000000-0000-0000-0000-000000000000	e25fe8e3-fe8b-4cae-98cd-16da3a867b31	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-25 22:15:45.735167+00	
00000000-0000-0000-0000-000000000000	e28657bf-111c-449d-9452-8a0f77326b35	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-25 23:14:22.814724+00	
00000000-0000-0000-0000-000000000000	f696f359-25ca-493c-bffb-a25eb8599d0a	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-25 23:14:22.819018+00	
00000000-0000-0000-0000-000000000000	33c87cd0-9510-4fc1-bc9d-7bc0e97de1bd	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 00:13:04.825545+00	
00000000-0000-0000-0000-000000000000	cd392a9a-486b-4014-b391-e4246732509e	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 00:13:04.83172+00	
00000000-0000-0000-0000-000000000000	9deeb904-4e8a-40d8-aa74-29c7d07c6560	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 01:11:06.321863+00	
00000000-0000-0000-0000-000000000000	d5204ad8-9557-43a1-bd3c-8c8c514e781a	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 01:11:06.325193+00	
00000000-0000-0000-0000-000000000000	bc020ff5-1c8f-4452-ba37-29109d94cb2c	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 01:20:01.002063+00	
00000000-0000-0000-0000-000000000000	148362c3-f4a2-4451-8145-0399fe63599d	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 01:20:01.005039+00	
00000000-0000-0000-0000-000000000000	01e589de-e3ef-41c6-8155-5d8ecbb18d4d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 01:20:13.249028+00	
00000000-0000-0000-0000-000000000000	a733b1f9-440e-4ecc-811b-0bda0c0b961a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 01:57:58.975686+00	
00000000-0000-0000-0000-000000000000	1afb60be-22e7-4ff7-bf97-99a9bdaa22ec	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 02:03:14.38663+00	
00000000-0000-0000-0000-000000000000	8d888a14-d386-4821-b930-9cbfad3e0717	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 02:18:43.684595+00	
00000000-0000-0000-0000-000000000000	7743d255-b64b-4288-9741-94716d28bcaf	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 02:18:43.68797+00	
00000000-0000-0000-0000-000000000000	0b2d5082-55ab-4bc5-8ce9-56f0423dd9d0	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 02:57:30.019807+00	
00000000-0000-0000-0000-000000000000	1ad23d67-3680-4afb-8dcf-452464abf366	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 03:14:31.062685+00	
00000000-0000-0000-0000-000000000000	efb5f3b2-bbd5-4e97-aa98-12e592d58741	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 03:17:28.745839+00	
00000000-0000-0000-0000-000000000000	a82f719d-c678-4d5f-b6d6-b00be0fc3a32	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 03:17:28.747435+00	
00000000-0000-0000-0000-000000000000	49bb1b1c-8092-4b06-bf92-92df95b1fd66	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 03:29:22.767817+00	
00000000-0000-0000-0000-000000000000	c82cae68-979f-4d65-919c-1a16f5dcb0bf	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 03:43:22.186733+00	
00000000-0000-0000-0000-000000000000	2db7cb13-560e-442d-b36c-225a5e076621	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 03:53:33.48907+00	
00000000-0000-0000-0000-000000000000	5bdc841e-1d56-4978-a2f0-478edb72c843	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 03:54:40.46771+00	
00000000-0000-0000-0000-000000000000	01dfb9f1-fea1-4171-88ff-24ffcd2a88e8	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 04:17:34.338134+00	
00000000-0000-0000-0000-000000000000	c1981226-a958-4670-a003-a1ca3c891374	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 05:07:32.075227+00	
00000000-0000-0000-0000-000000000000	f967a935-e0ca-4e96-b9bd-3a85267501ad	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 05:07:32.078117+00	
00000000-0000-0000-0000-000000000000	27051de6-09a9-4603-8db7-8f0f4ca57406	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 05:16:28.758759+00	
00000000-0000-0000-0000-000000000000	af8a2dad-1728-470f-acc3-4b3a34b5cdfc	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 05:16:28.761389+00	
00000000-0000-0000-0000-000000000000	4bf1d79f-bc14-4371-aae4-7f4d0ffc5806	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 05:37:01.55984+00	
00000000-0000-0000-0000-000000000000	6ab93ca4-f1f1-4c96-84a9-977ab1e55d6d	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 05:40:18.770965+00	
00000000-0000-0000-0000-000000000000	7e82198a-0f2a-4151-9816-4a339fdda816	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 05:58:39.473521+00	
00000000-0000-0000-0000-000000000000	756ac59d-ad9a-4cff-ae6e-f63adcaa2f78	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 06:15:16.873972+00	
00000000-0000-0000-0000-000000000000	13e68fdd-661e-42c5-8c21-f9ee8f607f06	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 06:15:16.87858+00	
00000000-0000-0000-0000-000000000000	4cd8ccff-616b-45cd-9faf-960611e71fd2	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 06:16:24.962758+00	
00000000-0000-0000-0000-000000000000	d2f2a59f-51a3-403d-b5bd-9bb492433f90	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 06:28:43.894304+00	
00000000-0000-0000-0000-000000000000	4cfc4b72-d72f-47d2-bf0a-080f2bd558d5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 06:37:09.32987+00	
00000000-0000-0000-0000-000000000000	22e63d7e-ff1a-44fe-ab81-d689d81c7be9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 06:44:55.669981+00	
00000000-0000-0000-0000-000000000000	525b0043-3bb9-4359-9dad-fd63fb4f5714	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 06:48:36.390865+00	
00000000-0000-0000-0000-000000000000	ad3c5809-faa9-4718-be3e-c0f6f742569a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 07:09:01.767404+00	
00000000-0000-0000-0000-000000000000	019593a8-1456-4652-a87d-872f007ba61f	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 07:14:04.93934+00	
00000000-0000-0000-0000-000000000000	76d01ce0-2ef2-4ece-b3b2-d300b3a07a6e	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 07:14:04.941575+00	
00000000-0000-0000-0000-000000000000	30710537-9f0a-4a01-af74-8d02541da7ff	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 07:47:19.931741+00	
00000000-0000-0000-0000-000000000000	9baf2b51-4f99-49a2-a83a-1a4502886cc5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 07:52:03.842197+00	
00000000-0000-0000-0000-000000000000	7fff46ef-e449-4d6b-b895-65a73d011566	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 08:12:52.763625+00	
00000000-0000-0000-0000-000000000000	1d2e6ff4-6330-4f2e-bc17-0d10864e099f	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 08:12:52.766964+00	
00000000-0000-0000-0000-000000000000	931f74a9-583d-4450-870d-525d6c2f5846	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 08:50:16.677772+00	
00000000-0000-0000-0000-000000000000	35340433-9bf4-49a8-80bf-dc5037cf4e4a	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 08:50:16.679354+00	
00000000-0000-0000-0000-000000000000	c5b39409-4ba7-4ead-8025-db1e3a258748	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 09:11:40.75125+00	
00000000-0000-0000-0000-000000000000	a423a440-077d-4c9b-b063-d0b1fff193de	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 09:11:40.755117+00	
00000000-0000-0000-0000-000000000000	73b54358-45ed-4501-b7c6-66f6caba9560	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 09:48:16.601857+00	
00000000-0000-0000-0000-000000000000	55d19b0e-7a27-4ca3-adaa-82f22f341785	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 09:48:16.606351+00	
00000000-0000-0000-0000-000000000000	83412a46-33c6-42e2-9d98-23a4413feb9c	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 10:10:25.706522+00	
00000000-0000-0000-0000-000000000000	bc0b7831-e2ed-4246-9068-ddf880631851	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 10:10:25.710809+00	
00000000-0000-0000-0000-000000000000	fff0a642-a024-4071-bc2c-1f562644ea3d	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 10:46:16.645347+00	
00000000-0000-0000-0000-000000000000	a914cd84-bb74-4f9c-84a4-e07af97fe249	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 10:46:16.648221+00	
00000000-0000-0000-0000-000000000000	e169af63-7ee6-4f37-b375-19ce8947eaef	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 11:09:10.772957+00	
00000000-0000-0000-0000-000000000000	c1400190-6eb4-4546-a4d8-5bcbe53e5ced	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 11:09:10.774671+00	
00000000-0000-0000-0000-000000000000	74dd1053-e84c-4b30-918e-3292c0b797fc	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 11:44:16.603237+00	
00000000-0000-0000-0000-000000000000	d5c16a5d-6a1f-416d-a1f6-85cc99466709	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 11:44:16.605958+00	
00000000-0000-0000-0000-000000000000	268b64db-ebf6-4cdf-aa12-3bf276cc307c	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 12:07:58.84039+00	
00000000-0000-0000-0000-000000000000	74e91a20-862d-40bf-887c-22d651bc81df	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 12:07:58.844771+00	
00000000-0000-0000-0000-000000000000	6f36dc6a-f422-460a-94d0-8a99acbead7b	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 12:42:16.621615+00	
00000000-0000-0000-0000-000000000000	fd3cecce-d9aa-4098-b94f-f4b19df68475	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 12:42:16.624936+00	
00000000-0000-0000-0000-000000000000	c1348cda-5780-4aad-b228-666b5d21b4cf	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 13:06:43.829594+00	
00000000-0000-0000-0000-000000000000	9452297a-44e9-4c27-91bb-6104ad11e379	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 13:06:43.832328+00	
00000000-0000-0000-0000-000000000000	84924c0e-e2c5-4e8c-b625-5872aaaddce9	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 13:40:16.644341+00	
00000000-0000-0000-0000-000000000000	40765fc9-b624-47ea-8427-7bd3c0f6ddf1	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 13:40:16.647523+00	
00000000-0000-0000-0000-000000000000	3e70ac63-67c3-436c-9cc6-55071626513a	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 14:05:31.803223+00	
00000000-0000-0000-0000-000000000000	7a81dbc5-ce48-4b1c-adb9-26b6e8e5fdb1	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 14:05:31.806537+00	
00000000-0000-0000-0000-000000000000	3f7508ea-e1d2-4f68-b7c5-b229e86f175c	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 14:38:16.612631+00	
00000000-0000-0000-0000-000000000000	1f0aaaa3-1cb3-4136-93d5-e4d56757a8e4	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 14:38:16.615649+00	
00000000-0000-0000-0000-000000000000	0fba2bde-6881-424b-9f76-e9f9e2147e13	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 15:04:16.841007+00	
00000000-0000-0000-0000-000000000000	5b6de7a5-400c-4f12-b164-cd67a7662564	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 15:04:16.844845+00	
00000000-0000-0000-0000-000000000000	3bd91616-4fd5-40fa-964c-e266400f4747	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 15:36:16.508792+00	
00000000-0000-0000-0000-000000000000	720b617c-dc63-4bd3-ad23-0b7b67d9f60d	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 15:36:16.512735+00	
00000000-0000-0000-0000-000000000000	8270f492-9055-4e6f-8902-36a8c1344a82	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 16:02:52.771102+00	
00000000-0000-0000-0000-000000000000	97d959f9-bd1a-493c-a8c4-3b6645ba3f47	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 16:02:52.776178+00	
00000000-0000-0000-0000-000000000000	33acbba4-8f49-41ba-9a24-f870be85fe12	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 16:34:16.601936+00	
00000000-0000-0000-0000-000000000000	c95db3a2-7f3c-4240-9e9d-5c8f8fef6b79	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 16:34:16.607713+00	
00000000-0000-0000-0000-000000000000	5e3b82eb-3d16-42f6-9b7c-3f733bdb69d6	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 17:01:37.786253+00	
00000000-0000-0000-0000-000000000000	e436f10d-6fe2-4216-80b4-20b62572e181	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 17:01:37.789786+00	
00000000-0000-0000-0000-000000000000	9a6ee15b-9a2a-495e-8808-2b436ec21ba6	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 17:32:16.4619+00	
00000000-0000-0000-0000-000000000000	0bfe93b4-7963-42f7-b90c-c3e25b81d644	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 17:32:16.464893+00	
00000000-0000-0000-0000-000000000000	ce4a2994-926a-4f5b-b21a-2faa8d4e6b5b	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 18:00:22.667006+00	
00000000-0000-0000-0000-000000000000	ed26af8f-622e-479d-b838-04469466b569	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 18:00:22.669354+00	
00000000-0000-0000-0000-000000000000	b21b6738-6a7d-4222-920c-07f68ae69573	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 18:25:27.437888+00	
00000000-0000-0000-0000-000000000000	129b177c-3ed9-498b-bafe-19fa8fb64f48	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 18:49:41.95911+00	
00000000-0000-0000-0000-000000000000	34c669dd-fafe-45b7-bd1e-e2b518547aaa	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 18:59:16.80505+00	
00000000-0000-0000-0000-000000000000	00d3fc18-7c3e-4a5a-b5f7-14d6471e32f0	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 18:59:16.807793+00	
00000000-0000-0000-0000-000000000000	183c8765-a349-4fc4-a8e7-500a5ed0720f	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 19:58:04.743173+00	
00000000-0000-0000-0000-000000000000	91161fef-1afd-4095-be3d-42172f731fa9	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 19:58:04.744817+00	
00000000-0000-0000-0000-000000000000	ba084029-a675-459c-bb4e-d6212598b569	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 20:56:52.816397+00	
00000000-0000-0000-0000-000000000000	52823fcd-28cc-4eff-bb19-813bdbf192a1	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 20:56:52.818088+00	
00000000-0000-0000-0000-000000000000	1bf506d7-7fa1-496e-a2c0-c38d764c4b40	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 21:15:56.857557+00	
00000000-0000-0000-0000-000000000000	b262c1d8-6e99-46c4-a022-20ce299c13b1	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 21:15:56.859493+00	
00000000-0000-0000-0000-000000000000	832a6b2b-a76c-461a-9d48-59eede5dd28c	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 21:16:14.30007+00	
00000000-0000-0000-0000-000000000000	6ed83456-1194-4c71-b3ce-195dce3e9c06	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 21:27:17.658675+00	
00000000-0000-0000-0000-000000000000	c7930e47-673e-4936-99a8-d0a33568b152	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 21:33:55.497657+00	
00000000-0000-0000-0000-000000000000	46d43d6f-47c0-4e98-99dc-e83190fb9370	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 21:56:40.693975+00	
00000000-0000-0000-0000-000000000000	f70b35b4-83c0-4979-81aa-ab28cd63b813	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 21:56:40.695586+00	
00000000-0000-0000-0000-000000000000	a0e57769-daaf-4526-abc4-2964389ee92a	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 22:04:22.604928+00	
00000000-0000-0000-0000-000000000000	bc0c066e-0501-41a1-980d-e436380a59d1	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 22:24:32.141784+00	
00000000-0000-0000-0000-000000000000	0fa72f23-e5b6-44b1-a3d0-3dd6af88c4e5	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 22:29:48.990411+00	
00000000-0000-0000-0000-000000000000	0e555b22-3017-4e8f-bc3b-82c0a28582d4	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 22:55:28.765676+00	
00000000-0000-0000-0000-000000000000	c1c6336e-9c72-4276-b544-5412de60d766	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 22:55:28.767936+00	
00000000-0000-0000-0000-000000000000	bdb0f5b6-de07-48c9-975f-d6a3b5b027b3	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 23:29:48.172585+00	
00000000-0000-0000-0000-000000000000	077b9c28-676d-46d6-8567-d50b62ad9d34	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 23:29:48.175311+00	
00000000-0000-0000-0000-000000000000	702f144b-500e-4662-aed3-ff857eede940	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-26 23:29:48.219051+00	
00000000-0000-0000-0000-000000000000	b10438e2-cc88-4d15-8612-f0a18f8c0ca8	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 23:34:20.314952+00	
00000000-0000-0000-0000-000000000000	b00039cc-a2d0-4b90-aea4-99813212d2f9	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 23:45:35.767973+00	
00000000-0000-0000-0000-000000000000	eb2bc50e-85d3-4062-9489-d425e88251bf	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-26 23:53:57.101421+00	
00000000-0000-0000-0000-000000000000	8d80dee0-cbf6-40ca-83ff-df5ebbc312a2	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-27 00:02:53.540004+00	
00000000-0000-0000-0000-000000000000	2b89c461-e1c7-4b2e-9cba-b6168e17104a	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-27 01:01:46.83642+00	
00000000-0000-0000-0000-000000000000	b8d49076-5a73-470e-8d97-3b9c239107de	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-27 01:01:46.839645+00	
00000000-0000-0000-0000-000000000000	a78d910a-f323-49d0-9d40-957d2014db89	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-27 01:13:01.718751+00	
00000000-0000-0000-0000-000000000000	a7e6c5bc-196a-4ebc-bc4e-fceed6f6d0d3	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-27 01:46:08.887948+00	
00000000-0000-0000-0000-000000000000	b3460969-294c-4602-90fd-c7e7026675d8	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-27 01:48:55.205386+00	
00000000-0000-0000-0000-000000000000	dab4d56e-9319-4d50-8148-448d500b2922	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-27 02:01:51.687101+00	
00000000-0000-0000-0000-000000000000	b7998e9f-e209-490b-af43-9bc76b4640b7	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-27 02:18:42.872167+00	
00000000-0000-0000-0000-000000000000	24066b82-cb87-4f68-b3ce-e41390841987	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-27 02:18:42.874986+00	
00000000-0000-0000-0000-000000000000	26677f15-b922-4285-a5fb-d3d0e99aae68	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-27 02:19:16.018405+00	
00000000-0000-0000-0000-000000000000	118e6eb9-e14d-4a3d-aa70-5e53a918eb18	{"action":"login","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-05-27 02:31:02.704993+00	
00000000-0000-0000-0000-000000000000	c80b3f22-fc89-4b72-b084-59060c5cd206	{"action":"token_refreshed","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-27 03:29:28.153565+00	
00000000-0000-0000-0000-000000000000	33825783-5784-4e63-8ded-8250382dd0db	{"action":"token_revoked","actor_id":"0066229f-b528-4390-b546-cf5211302a98","actor_name":"Brian Berge","actor_username":"brian.h.berge@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-05-27 03:29:28.160514+00	
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
87293897-a3e2-453d-9010-b6fcde3dc13c	9d942072-ab09-4739-a6f2-14f1c8d3f9c6	959e3de8-d464-46fd-ac67-27f5f94b34e8	s256	huGrnuQWR9Sk92zAmXTdSHUzB2Z4X1pbsG_7Q8Rmv_s	email			2025-05-08 04:31:12.140565+00	2025-05-08 04:31:25.862507+00	email/signup	2025-05-08 04:31:25.862443+00
a63e6b50-7892-4490-a6ee-4065b9137e5a	a38a4eb9-8d2f-4176-9eae-17bec173c521	2167cb9b-d4be-4af6-a58e-b4427210dc62	s256	1Y3KMO5HSBkzeQDtx_V5Cs9wAypfWJgV-I3aBQ2jC8A	email			2025-05-08 04:40:17.309559+00	2025-05-08 04:40:24.83117+00	email/signup	2025-05-08 04:40:24.831133+00
9af0667b-f456-4f63-b797-44d83cbdb011	84aea900-ddfd-42de-9eb4-a355b6d53df0	4afa11cd-91c6-46a7-99e5-b7f6106cd923	s256	Fk9rgFIa7Qcn4UFVdUa7LirNev7uuynPGMWmmeT2pPU	email			2025-05-08 05:00:54.417179+00	2025-05-08 05:01:38.504581+00	email/signup	2025-05-08 05:01:38.504541+00
b45f1ab5-68aa-4001-81e6-cf3ddad0184c	4cc92b12-b5ca-4e14-9312-e281519f04d6	851072fe-6872-4319-9d96-5e663fb8c404	s256	rfyae4AB_wQU8ha7ad19ZPht9GXPz9iyiqX4-PTBlcs	email			2025-05-09 19:27:51.783796+00	2025-05-09 19:28:03.912813+00	email/signup	2025-05-09 19:28:03.912768+00
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
0066229f-b528-4390-b546-cf5211302a98	0066229f-b528-4390-b546-cf5211302a98	{"sub": "0066229f-b528-4390-b546-cf5211302a98", "email": "brian.h.berge@gmail.com", "full_name": "Brian Berge", "email_verified": true, "phone_verified": false}	email	2025-05-08 02:12:33.170697+00	2025-05-08 02:12:33.170756+00	2025-05-08 02:12:33.170756+00	eb5c6bbd-de53-440c-97a0-eb31eaf1b8bd
7be6492f-592f-4d83-ad3d-95dbddbd68cf	7be6492f-592f-4d83-ad3d-95dbddbd68cf	{"sub": "7be6492f-592f-4d83-ad3d-95dbddbd68cf", "email": "brian@bergeinsurance.com", "display_name": "Hal", "email_verified": true, "phone_verified": false}	email	2025-05-08 04:43:26.25577+00	2025-05-08 04:43:26.255817+00	2025-05-08 04:43:26.255817+00	c211382c-6368-48fd-ac15-9cb4c6b1cfcc
84aea900-ddfd-42de-9eb4-a355b6d53df0	84aea900-ddfd-42de-9eb4-a355b6d53df0	{"sub": "84aea900-ddfd-42de-9eb4-a355b6d53df0", "email": "bhberge@gmail.com", "display_name": "Von Hanson", "email_verified": true, "phone_verified": false}	email	2025-05-08 05:00:54.411859+00	2025-05-08 05:00:54.411924+00	2025-05-08 05:00:54.411924+00	58313383-dda2-4b9e-9bc0-95f005089edf
4cc92b12-b5ca-4e14-9312-e281519f04d6	4cc92b12-b5ca-4e14-9312-e281519f04d6	{"sub": "4cc92b12-b5ca-4e14-9312-e281519f04d6", "email": "vince@vincehunt.com", "email_verified": true, "phone_verified": false}	email	2025-05-09 19:27:51.766998+00	2025-05-09 19:27:51.767063+00	2025-05-09 19:27:51.767063+00	13fbef48-3160-497f-bab0-ddb0faa178e9
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
26876be3-1411-4811-84f8-6d65bfdf4d79	2025-05-21 19:41:07.579567+00	2025-05-21 19:41:07.579567+00	password	68921937-2c42-403b-b125-85d2436da7d8
9322bbbe-2cfb-4bca-860b-f91010d7b5c9	2025-05-21 19:47:56.720386+00	2025-05-21 19:47:56.720386+00	password	eee5fa49-7e43-42cb-9bde-3012f01337ab
5d7f2327-1ce7-41e1-87db-2556c20c82ff	2025-05-21 20:08:46.339226+00	2025-05-21 20:08:46.339226+00	password	47fb2fb5-3868-4b7c-8a9a-7b8a14138ed8
a2f5eed9-8604-44b5-b1cc-ac5f922bf28d	2025-05-21 20:34:10.187118+00	2025-05-21 20:34:10.187118+00	password	13abd292-d728-4971-8e7a-fdbd915b9158
74f64b7d-5549-4040-bd5b-e5a4f5730c37	2025-05-21 23:44:11.354472+00	2025-05-21 23:44:11.354472+00	password	fe6f4e61-22b9-4944-beda-a35e9c8c9d9c
8ac97083-16dd-41e5-925a-0cebf068f50e	2025-05-21 23:54:05.860233+00	2025-05-21 23:54:05.860233+00	password	a5671ea2-0b9b-4872-a57e-73981790141f
abef003e-ef79-4898-a5b8-6c9b18e0931c	2025-05-22 00:02:00.396077+00	2025-05-22 00:02:00.396077+00	password	43d3f6ac-5288-497f-a903-7aa90a885a30
af5388f5-b4ba-485b-83e1-a43f7fdcc012	2025-05-22 00:10:39.515965+00	2025-05-22 00:10:39.515965+00	password	7ffa38ee-7ad7-462f-ab7d-c6431426f003
137a7798-5ce0-4540-9f1c-df34eb767ae8	2025-05-22 00:16:41.786778+00	2025-05-22 00:16:41.786778+00	password	c923736d-f9d5-47da-bd7f-5b76c46c9bdb
76dcf0b4-559a-454c-81a6-302ce6f3f338	2025-05-22 00:25:37.004632+00	2025-05-22 00:25:37.004632+00	password	340a5f53-cf2c-41eb-8f60-c4a3975c924d
350c53f0-7099-46c5-b83d-67b1ed176925	2025-05-22 00:36:18.486685+00	2025-05-22 00:36:18.486685+00	password	737c07e8-b97c-4e48-b4b0-3422500d235f
bda12296-b25c-4b49-8263-fa1729f10fa8	2025-05-22 00:41:08.291682+00	2025-05-22 00:41:08.291682+00	password	945cd365-e3bb-4240-9fd6-f1504fe09865
66b4e73b-e88b-4613-9714-111db32a7383	2025-05-22 14:56:25.478103+00	2025-05-22 14:56:25.478103+00	password	75ef3b2c-b071-4a9b-ba5e-6678b46c548e
4f1e8aad-041c-430e-87c4-cf302d218715	2025-05-25 22:15:45.74691+00	2025-05-25 22:15:45.74691+00	password	00a8ba2c-4620-4295-a06b-6f2fb6b75473
346a347d-29dd-47fc-a369-3bf0401d8ce7	2025-05-26 01:20:13.262313+00	2025-05-26 01:20:13.262313+00	password	69d8318b-901e-4591-90ae-dfd003f5e3c0
1db6ab54-c1ac-475f-99d7-f68d16e73ad8	2025-05-26 01:57:58.997371+00	2025-05-26 01:57:58.997371+00	password	f79b0f9f-5913-4924-bd9c-ef2be3c9ea3b
35070197-ec2f-4ce0-b467-71f2bb809617	2025-05-26 02:03:14.396269+00	2025-05-26 02:03:14.396269+00	password	eaa3be4c-83bf-484b-ac65-85aeb876b63c
187890bd-879e-4825-875a-4f2b1766bde3	2025-05-26 02:57:30.055937+00	2025-05-26 02:57:30.055937+00	password	82b88603-e70d-42e0-8845-433390d89f2f
8cc857bc-a878-43a0-b51a-a3c9281756c2	2025-05-26 03:14:31.073903+00	2025-05-26 03:14:31.073903+00	password	ec6f77a6-cabd-4328-ac1a-4681cad5a6ce
818b9077-fdc9-4a36-adab-bb0103e34ba0	2025-05-26 03:29:22.78025+00	2025-05-26 03:29:22.78025+00	password	6923cfc0-b4b4-487e-94cf-9716b5c57ed6
a485b8ca-a7af-4896-b22b-2d408da19583	2025-05-26 03:43:22.194531+00	2025-05-26 03:43:22.194531+00	password	8d83b342-1299-463f-8584-5c1c21bb8200
409a3353-00f3-4bf8-8d86-cfbdd7fdd852	2025-05-26 03:53:33.500298+00	2025-05-26 03:53:33.500298+00	password	b9f82a75-0c29-442f-88ef-a9ca33336c81
32f782c9-f676-4e2b-828a-0a437489c8b4	2025-05-26 03:54:40.475695+00	2025-05-26 03:54:40.475695+00	password	3c35dc8b-abc0-4666-8bcf-f7b59aca8764
6620a600-8cc8-4ec9-879f-d18e1878c483	2025-05-26 04:17:34.351912+00	2025-05-26 04:17:34.351912+00	password	b4cb2173-5a57-4d07-b69e-8f36331fcade
051a5bfc-df95-45b7-a844-def8ba292d32	2025-05-26 05:37:01.571785+00	2025-05-26 05:37:01.571785+00	password	bfec0b3c-230e-45ca-8a2b-1b39ada84775
07c7301d-82b1-48a7-af8f-8dbae544d378	2025-05-26 05:40:18.778946+00	2025-05-26 05:40:18.778946+00	password	b7545972-e893-49d7-9835-bbe96db01bb9
22188e0a-826d-49df-8767-b8dd2cc27dfb	2025-05-26 05:58:39.494748+00	2025-05-26 05:58:39.494748+00	password	d0b30426-3978-4b51-9271-d27f92d31d93
5f8d4915-1997-439f-8fa2-d80f6c79b3cc	2025-05-26 06:16:24.966146+00	2025-05-26 06:16:24.966146+00	password	0bc5912f-3fef-489e-9d12-3eeb8842d8c9
7d0332bd-c079-45bd-80cc-6d9b5520afdd	2025-05-26 06:28:43.915329+00	2025-05-26 06:28:43.915329+00	password	07fb8d0e-f694-4746-b469-d9af423dba5f
c42484d2-fd0d-4e17-b540-4b9e8038c415	2025-05-26 06:37:09.340357+00	2025-05-26 06:37:09.340357+00	password	f6b8eb0b-fc12-4ed5-9a64-5e92d8bf8b04
69bc3a45-eb48-4713-9755-f5012c84967a	2025-05-26 06:44:55.683006+00	2025-05-26 06:44:55.683006+00	password	a7a0270a-a1f9-446d-bb1c-b1d8a129a20c
9f8725e2-5a7b-4455-a143-a772bb0c9833	2025-05-26 06:48:36.401095+00	2025-05-26 06:48:36.401095+00	password	749c0d58-bd0c-4a2b-bbbc-ef8e6250cb93
c0969125-9b4f-4cb5-ab89-67c502fbf2c3	2025-05-26 07:09:01.79077+00	2025-05-26 07:09:01.79077+00	password	bd0dda6d-5812-4e10-a6c7-38ba87ea1cd0
4f1ea97a-2114-4c83-b196-ff7cc87b8bd1	2025-05-26 07:47:19.9417+00	2025-05-26 07:47:19.9417+00	password	efa21c49-5eb7-4126-bcab-0d390d55da0c
a20bc14d-f664-424d-aaa7-3545c55e6400	2025-05-26 07:52:03.853035+00	2025-05-26 07:52:03.853035+00	password	8f2e8b2b-a63e-4406-b772-60b80fd5a90f
83c69cb8-a738-4f2d-bf61-25022b5d98e9	2025-05-26 18:25:27.460682+00	2025-05-26 18:25:27.460682+00	password	e0de9874-1273-4c84-8fd7-9d3c7a3b209a
aaf70eab-f37f-4b07-bc3d-e133c3935ef7	2025-05-26 18:49:41.969925+00	2025-05-26 18:49:41.969925+00	password	baeff3c3-2c1d-4701-bf46-0b90faac892c
1b544550-6ccd-433b-9bce-1dbb5f4a34e0	2025-05-26 21:16:14.305075+00	2025-05-26 21:16:14.305075+00	password	9c4d554f-0ea7-48fe-b57b-0a59e8b5d00b
9d584137-9452-4c52-83ab-d058e9c42f53	2025-05-26 21:27:17.667069+00	2025-05-26 21:27:17.667069+00	password	5b971987-7f9b-40fa-81a1-744b6bf5a973
decb9974-c519-4242-b728-cc5cb4b1863b	2025-05-26 21:33:55.504223+00	2025-05-26 21:33:55.504223+00	password	d66fc6c3-bc21-482e-90bd-b7b40a8b9edb
d0f9a3a0-460a-4337-ac24-9530c6a7259f	2025-05-26 22:04:22.611653+00	2025-05-26 22:04:22.611653+00	password	f8d5c9cf-9e13-4166-a01f-6dfc53261d1b
b9baab1b-f333-4bfd-b258-507c2f1d3e72	2025-05-26 22:24:32.153921+00	2025-05-26 22:24:32.153921+00	password	b5808afa-3327-4b20-9be9-fdb25f3ad148
62ea0864-5f38-43c0-a471-e11003e550d6	2025-05-26 22:29:49.003585+00	2025-05-26 22:29:49.003585+00	password	fd7f72f7-dba4-43ca-a6fb-527f946ef5b3
accc07e8-f499-44bc-bc32-b0903acaaafa	2025-05-26 23:34:20.326181+00	2025-05-26 23:34:20.326181+00	password	b6b7d1fe-01b2-4a2a-a70c-20b97b28c0a7
906aeee9-a87b-4005-9df3-4687fa666601	2025-05-26 23:45:35.779073+00	2025-05-26 23:45:35.779073+00	password	dcc16ba9-3036-44bf-bdc2-bc8d545609d3
cfb32697-8896-44be-b8a2-94d7cc16342e	2025-05-26 23:53:57.116472+00	2025-05-26 23:53:57.116472+00	password	d89f45b2-7176-480c-8ddd-07b015d260ff
1bd52306-ccd9-411a-89cd-5d04a87f33cb	2025-05-27 00:02:53.553631+00	2025-05-27 00:02:53.553631+00	password	8fe1c4fd-f57d-4601-83fb-48ad90d4c3f5
12799a8a-ffd4-4f2f-9cc3-8058273bb7ee	2025-05-27 01:13:01.733553+00	2025-05-27 01:13:01.733553+00	password	d8f0377c-2cd1-42d3-bb2c-841a433c1a5c
91bc89b1-5bc7-46bb-aebb-f50828bd9b31	2025-05-27 01:46:08.915952+00	2025-05-27 01:46:08.915952+00	password	38821776-4b17-473b-aeb0-efb88bb5345e
2c4249b9-ff58-4d4e-8007-135b05e32b78	2025-05-27 01:48:55.213007+00	2025-05-27 01:48:55.213007+00	password	baee010b-f82f-4303-bba0-aafa1d78f7e4
be051c4b-a48c-45dc-896a-2fab0fae8784	2025-05-27 02:01:51.695784+00	2025-05-27 02:01:51.695784+00	password	b87cd8fe-fadd-4287-adf7-fbef5fc1bdd0
2a4c7216-5e44-46cf-896c-a4f69580bd00	2025-05-27 02:19:16.021383+00	2025-05-27 02:19:16.021383+00	password	ee140cce-ae53-42b6-8002-137b7bfb3074
724a28b6-5006-4ff0-9038-2d1b0a03dd2f	2025-05-27 02:31:02.722356+00	2025-05-27 02:31:02.722356+00	password	a459a472-e45d-49b6-9748-567b81e44f69
0dc747ad-c3d0-4199-90c6-c277751d7bb7	2025-05-21 19:32:41.437248+00	2025-05-21 19:32:41.437248+00	password	ea943ab4-b3dd-450a-a7bc-eddc93e2f7b8
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	292	orjdsnipzitt	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-21 19:41:07.576682+00	2025-05-21 19:41:07.576682+00	\N	26876be3-1411-4811-84f8-6d65bfdf4d79
00000000-0000-0000-0000-000000000000	293	45jsm4rfnd3a	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-21 19:47:56.713744+00	2025-05-21 19:47:56.713744+00	\N	9322bbbe-2cfb-4bca-860b-f91010d7b5c9
00000000-0000-0000-0000-000000000000	297	5xvin7ylbdom	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-21 22:06:40.634598+00	2025-05-21 23:05:26.700784+00	fpasdaoyzuc4	5d7f2327-1ce7-41e1-87db-2556c20c82ff
00000000-0000-0000-0000-000000000000	299	yrdtvdips3e2	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-21 23:44:11.35153+00	2025-05-21 23:44:11.35153+00	\N	74f64b7d-5549-4040-bd5b-e5a4f5730c37
00000000-0000-0000-0000-000000000000	301	rwlxyhkvlydb	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-22 00:02:00.393403+00	2025-05-22 00:02:00.393403+00	\N	abef003e-ef79-4898-a5b8-6c9b18e0931c
00000000-0000-0000-0000-000000000000	303	ss2vnnczipbx	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-22 00:16:41.784025+00	2025-05-22 00:16:41.784025+00	\N	137a7798-5ce0-4540-9f1c-df34eb767ae8
00000000-0000-0000-0000-000000000000	307	dknxy2sppefz	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 01:39:25.963182+00	2025-05-22 02:37:26.079256+00	xntgs3hsratp	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	309	gsq5wrzn4s25	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 03:35:55.984498+00	2025-05-22 04:33:55.890854+00	l4w3ffppjk3h	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	295	jupnwe4bkxyq	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-21 20:34:10.181755+00	2025-05-22 05:40:38.699112+00	\N	a2f5eed9-8604-44b5-b1cc-ac5f922bf28d
00000000-0000-0000-0000-000000000000	311	y7hrul5pk4n6	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 05:31:55.882501+00	2025-05-22 06:29:56.064458+00	zuayth4i2yac	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	313	khkuehel7kor	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 06:29:56.068527+00	2025-05-22 07:28:26.073679+00	y7hrul5pk4n6	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	315	rh7vhyfwy4at	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 08:26:55.948131+00	2025-05-22 09:24:55.960178+00	citqzslm3usn	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	317	syy6uhrslab6	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 10:22:56.039024+00	2025-05-22 11:21:25.897886+00	tm7xjgowf3gi	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	319	6dechcizymcf	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 12:19:26.284469+00	2025-05-22 13:17:55.908899+00	nusajdcvzckw	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	321	6oed5rfwp55a	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-22 14:15:55.951009+00	2025-05-22 14:15:55.951009+00	h34udjw4cfb2	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	323	wlgimoyakgip	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 21:39:13.559121+00	2025-05-22 22:54:15.340627+00	oswp2evcoaqz	66b4e73b-e88b-4613-9714-111db32a7383
00000000-0000-0000-0000-000000000000	325	it6cg3z3jyzz	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-23 03:49:23.932964+00	2025-05-23 03:49:23.932964+00	7gxgtbp322os	a2f5eed9-8604-44b5-b1cc-ac5f922bf28d
00000000-0000-0000-0000-000000000000	305	ep7mloqzhrvw	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 00:36:18.48404+00	2025-05-25 22:15:15.92358+00	\N	350c53f0-7099-46c5-b83d-67b1ed176925
00000000-0000-0000-0000-000000000000	328	w65n2vf7pdg6	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-25 23:14:22.82668+00	2025-05-26 00:13:04.834216+00	6sgvgtkzu6be	4f1e8aad-041c-430e-87c4-cf302d218715
00000000-0000-0000-0000-000000000000	330	drkhr5vj76mb	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 01:11:06.328637+00	2025-05-26 01:11:06.328637+00	wb3m5bxu4d5g	4f1e8aad-041c-430e-87c4-cf302d218715
00000000-0000-0000-0000-000000000000	333	iciifqnqam5s	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 01:57:58.989505+00	2025-05-26 01:57:58.989505+00	\N	1db6ab54-c1ac-475f-99d7-f68d16e73ad8
00000000-0000-0000-0000-000000000000	337	vfa63nzincjf	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 03:14:31.067921+00	2025-05-26 03:14:31.067921+00	\N	8cc857bc-a878-43a0-b51a-a3c9281756c2
00000000-0000-0000-0000-000000000000	335	rfdbkaei5sgy	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 02:18:43.692644+00	2025-05-26 03:17:28.748746+00	t5xnso6krsto	346a347d-29dd-47fc-a369-3bf0401d8ce7
00000000-0000-0000-0000-000000000000	339	cmflsbttgazp	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 03:29:22.77504+00	2025-05-26 03:29:22.77504+00	\N	818b9077-fdc9-4a36-adab-bb0103e34ba0
00000000-0000-0000-0000-000000000000	341	liu64735q2fh	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 03:53:33.493241+00	2025-05-26 03:53:33.493241+00	\N	409a3353-00f3-4bf8-8d86-cfbdd7fdd852
00000000-0000-0000-0000-000000000000	342	takddgpzjln5	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 03:54:40.46931+00	2025-05-26 05:07:32.079436+00	\N	32f782c9-f676-4e2b-828a-0a437489c8b4
00000000-0000-0000-0000-000000000000	344	irfxftdmwg7h	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 05:07:32.084827+00	2025-05-26 05:07:32.084827+00	takddgpzjln5	32f782c9-f676-4e2b-828a-0a437489c8b4
00000000-0000-0000-0000-000000000000	346	jhjsoqc7kl3j	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 05:37:01.566799+00	2025-05-26 05:37:01.566799+00	\N	051a5bfc-df95-45b7-a844-def8ba292d32
00000000-0000-0000-0000-000000000000	348	cabnyigdh6qy	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 05:58:39.487636+00	2025-05-26 05:58:39.487636+00	\N	22188e0a-826d-49df-8767-b8dd2cc27dfb
00000000-0000-0000-0000-000000000000	351	34xlumdollmh	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 06:28:43.909891+00	2025-05-26 06:28:43.909891+00	\N	7d0332bd-c079-45bd-80cc-6d9b5520afdd
00000000-0000-0000-0000-000000000000	353	2xwlij74elpx	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 06:44:55.676165+00	2025-05-26 06:44:55.676165+00	\N	69bc3a45-eb48-4713-9755-f5012c84967a
00000000-0000-0000-0000-000000000000	355	tuh4bor6m63k	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 07:09:01.779081+00	2025-05-26 07:09:01.779081+00	\N	c0969125-9b4f-4cb5-ab89-67c502fbf2c3
00000000-0000-0000-0000-000000000000	357	zwna5dlzx2ua	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 07:47:19.937663+00	2025-05-26 07:47:19.937663+00	\N	4f1ea97a-2114-4c83-b196-ff7cc87b8bd1
00000000-0000-0000-0000-000000000000	359	yguyp2jyjgcp	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 08:12:52.774667+00	2025-05-26 09:11:40.755695+00	2darwbzztms5	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	361	mq2ms7r4b2xn	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 09:11:40.758992+00	2025-05-26 10:10:25.711416+00	yguyp2jyjgcp	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	363	v5jevyun5s5b	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 10:10:25.713619+00	2025-05-26 11:09:10.778399+00	mq2ms7r4b2xn	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	365	euhxaedv5wcj	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 11:09:10.779849+00	2025-05-26 12:07:58.846224+00	v5jevyun5s5b	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	367	u6trbvy4vsmo	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 12:07:58.848989+00	2025-05-26 13:06:43.832893+00	euhxaedv5wcj	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	369	zuem6qmaa6kw	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 13:06:43.835964+00	2025-05-26 14:05:31.807854+00	u6trbvy4vsmo	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	371	bxeevb5fde3m	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 14:05:31.811001+00	2025-05-26 15:04:16.845395+00	zuem6qmaa6kw	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	373	bj5rrieo7rha	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 15:04:16.849081+00	2025-05-26 16:02:52.776848+00	bxeevb5fde3m	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	375	ckjssnas6dhf	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 16:02:52.781107+00	2025-05-26 17:01:37.79039+00	bj5rrieo7rha	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	377	j5e4mopjr4rg	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 17:01:37.793804+00	2025-05-26 18:00:22.669926+00	ckjssnas6dhf	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	379	qj4glntkxgn4	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 18:00:22.672084+00	2025-05-26 18:59:16.808402+00	j5e4mopjr4rg	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	383	xweb2uq63dib	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 19:58:04.746856+00	2025-05-26 20:56:52.818737+00	byudore6ijc7	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	381	vz6p2sxm4chy	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 18:49:41.966377+00	2025-05-26 21:15:56.860097+00	\N	aaf70eab-f37f-4b07-bc3d-e133c3935ef7
00000000-0000-0000-0000-000000000000	385	tdbaq4ttjm7f	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 21:15:56.861678+00	2025-05-26 21:15:56.861678+00	vz6p2sxm4chy	aaf70eab-f37f-4b07-bc3d-e133c3935ef7
00000000-0000-0000-0000-000000000000	386	rm7vsjqbf4ky	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 21:16:14.30382+00	2025-05-26 21:16:14.30382+00	\N	1b544550-6ccd-433b-9bce-1dbb5f4a34e0
00000000-0000-0000-0000-000000000000	388	4e2luuf5v4qw	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 21:33:55.500616+00	2025-05-26 21:33:55.500616+00	\N	decb9974-c519-4242-b728-cc5cb4b1863b
00000000-0000-0000-0000-000000000000	390	sitxneign3ee	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 22:04:22.607934+00	2025-05-26 22:04:22.607934+00	\N	d0f9a3a0-460a-4337-ac24-9530c6a7259f
00000000-0000-0000-0000-000000000000	294	sg6kygw77km3	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-21 20:08:46.321841+00	2025-05-21 21:07:21.014421+00	\N	5d7f2327-1ce7-41e1-87db-2556c20c82ff
00000000-0000-0000-0000-000000000000	296	fpasdaoyzuc4	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-21 21:07:21.015865+00	2025-05-21 22:06:40.633277+00	sg6kygw77km3	5d7f2327-1ce7-41e1-87db-2556c20c82ff
00000000-0000-0000-0000-000000000000	298	hv472qg4crog	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-21 23:05:26.702129+00	2025-05-21 23:05:26.702129+00	5xvin7ylbdom	5d7f2327-1ce7-41e1-87db-2556c20c82ff
00000000-0000-0000-0000-000000000000	300	ryvuwhajuiiv	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-21 23:54:05.850414+00	2025-05-21 23:54:05.850414+00	\N	8ac97083-16dd-41e5-925a-0cebf068f50e
00000000-0000-0000-0000-000000000000	302	ixa66fpqj6ht	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-22 00:10:39.512967+00	2025-05-22 00:10:39.512967+00	\N	af5388f5-b4ba-485b-83e1-a43f7fdcc012
00000000-0000-0000-0000-000000000000	291	7aymmfe5oeet	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-21 19:32:41.433533+00	2025-05-21 19:32:41.433533+00	\N	0dc747ad-c3d0-4199-90c6-c277751d7bb7
00000000-0000-0000-0000-000000000000	304	n5skbkwgapuj	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-22 00:25:37.001715+00	2025-05-22 00:25:37.001715+00	\N	76dcf0b4-559a-454c-81a6-302ce6f3f338
00000000-0000-0000-0000-000000000000	306	xntgs3hsratp	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 00:41:08.289029+00	2025-05-22 01:39:25.961894+00	\N	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	308	l4w3ffppjk3h	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 02:37:26.080733+00	2025-05-22 03:35:55.981811+00	dknxy2sppefz	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	310	zuayth4i2yac	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 04:33:55.892765+00	2025-05-22 05:31:55.881776+00	gsq5wrzn4s25	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	314	citqzslm3usn	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 07:28:26.076011+00	2025-05-22 08:26:55.945465+00	khkuehel7kor	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	316	tm7xjgowf3gi	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 09:24:55.961567+00	2025-05-22 10:22:56.037484+00	rh7vhyfwy4at	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	318	nusajdcvzckw	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 11:21:25.899449+00	2025-05-22 12:19:26.278331+00	syy6uhrslab6	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	320	h34udjw4cfb2	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 13:17:55.911257+00	2025-05-22 14:15:55.948428+00	6dechcizymcf	bda12296-b25c-4b49-8263-fa1729f10fa8
00000000-0000-0000-0000-000000000000	322	oswp2evcoaqz	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 14:56:25.474336+00	2025-05-22 21:39:13.54708+00	\N	66b4e73b-e88b-4613-9714-111db32a7383
00000000-0000-0000-0000-000000000000	312	7gxgtbp322os	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 05:40:38.699899+00	2025-05-23 03:49:23.917149+00	jupnwe4bkxyq	a2f5eed9-8604-44b5-b1cc-ac5f922bf28d
00000000-0000-0000-0000-000000000000	326	2zffiyv3n24a	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-25 22:15:15.934418+00	2025-05-25 22:15:15.934418+00	ep7mloqzhrvw	350c53f0-7099-46c5-b83d-67b1ed176925
00000000-0000-0000-0000-000000000000	327	6sgvgtkzu6be	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-25 22:15:45.744857+00	2025-05-25 23:14:22.819618+00	\N	4f1e8aad-041c-430e-87c4-cf302d218715
00000000-0000-0000-0000-000000000000	329	wb3m5bxu4d5g	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 00:13:04.838584+00	2025-05-26 01:11:06.325761+00	w65n2vf7pdg6	4f1e8aad-041c-430e-87c4-cf302d218715
00000000-0000-0000-0000-000000000000	324	k5ikmoyqgfjm	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-22 22:54:15.343292+00	2025-05-26 01:20:01.006532+00	wlgimoyakgip	66b4e73b-e88b-4613-9714-111db32a7383
00000000-0000-0000-0000-000000000000	331	yuhnpfc776v6	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 01:20:01.009914+00	2025-05-26 01:20:01.009914+00	k5ikmoyqgfjm	66b4e73b-e88b-4613-9714-111db32a7383
00000000-0000-0000-0000-000000000000	334	zrwwyx6ahzxg	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 02:03:14.392156+00	2025-05-26 02:03:14.392156+00	\N	35070197-ec2f-4ce0-b467-71f2bb809617
00000000-0000-0000-0000-000000000000	332	t5xnso6krsto	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 01:20:13.260165+00	2025-05-26 02:18:43.689257+00	\N	346a347d-29dd-47fc-a369-3bf0401d8ce7
00000000-0000-0000-0000-000000000000	336	nump4sl2ux3t	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 02:57:30.040412+00	2025-05-26 02:57:30.040412+00	\N	187890bd-879e-4825-875a-4f2b1766bde3
00000000-0000-0000-0000-000000000000	338	tosa2ovmcasl	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 03:17:28.749498+00	2025-05-26 03:17:28.749498+00	rfdbkaei5sgy	346a347d-29dd-47fc-a369-3bf0401d8ce7
00000000-0000-0000-0000-000000000000	340	2fnogkqbxc67	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 03:43:22.191593+00	2025-05-26 03:43:22.191593+00	\N	a485b8ca-a7af-4896-b22b-2d408da19583
00000000-0000-0000-0000-000000000000	343	mignevxohfqb	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 04:17:34.345316+00	2025-05-26 05:16:28.763311+00	\N	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	347	3ciyfq2b2i7n	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 05:40:18.775356+00	2025-05-26 05:40:18.775356+00	\N	07c7301d-82b1-48a7-af8f-8dbae544d378
00000000-0000-0000-0000-000000000000	345	xjlwj5lld6ve	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 05:16:28.765466+00	2025-05-26 06:15:16.88032+00	mignevxohfqb	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	350	x5gaznqil5wh	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 06:16:24.964988+00	2025-05-26 06:16:24.964988+00	\N	5f8d4915-1997-439f-8fa2-d80f6c79b3cc
00000000-0000-0000-0000-000000000000	352	pcdiyeykjoon	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 06:37:09.336336+00	2025-05-26 06:37:09.336336+00	\N	c42484d2-fd0d-4e17-b540-4b9e8038c415
00000000-0000-0000-0000-000000000000	354	vqb4cweng4ci	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 06:48:36.396464+00	2025-05-26 06:48:36.396464+00	\N	9f8725e2-5a7b-4455-a143-a772bb0c9833
00000000-0000-0000-0000-000000000000	349	zuw32bwqwiu6	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 06:15:16.887298+00	2025-05-26 07:14:04.942293+00	xjlwj5lld6ve	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	356	2darwbzztms5	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 07:14:04.946544+00	2025-05-26 08:12:52.768872+00	zuw32bwqwiu6	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	358	msaz5dekzfge	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 07:52:03.846766+00	2025-05-26 08:50:16.68054+00	\N	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	360	tdo7uwegkoun	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 08:50:16.682376+00	2025-05-26 09:48:16.606938+00	msaz5dekzfge	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	362	bzhf7qxj563k	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 09:48:16.613382+00	2025-05-26 10:46:16.64946+00	tdo7uwegkoun	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	364	vf4mtsobo2uf	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 10:46:16.652261+00	2025-05-26 11:44:16.607149+00	bzhf7qxj563k	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	366	eoqdcn7w55lj	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 11:44:16.609781+00	2025-05-26 12:42:16.625557+00	vf4mtsobo2uf	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	368	yvdpp6pnhg3o	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 12:42:16.62971+00	2025-05-26 13:40:16.648714+00	eoqdcn7w55lj	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	370	lhw4tabem53j	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 13:40:16.652349+00	2025-05-26 14:38:16.6163+00	yvdpp6pnhg3o	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	372	fpftw6lbumxq	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 14:38:16.621421+00	2025-05-26 15:36:16.513389+00	lhw4tabem53j	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	374	xkaebkvei4wy	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 15:36:16.516591+00	2025-05-26 16:34:16.609715+00	fpftw6lbumxq	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	376	motqapbc5x3v	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 16:34:16.613783+00	2025-05-26 17:32:16.465446+00	xkaebkvei4wy	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	378	f5rdsnnszlvi	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 17:32:16.467999+00	2025-05-26 17:32:16.467999+00	motqapbc5x3v	a20bc14d-f664-424d-aaa7-3545c55e6400
00000000-0000-0000-0000-000000000000	380	hqquaoj4ynjk	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 18:25:27.455071+00	2025-05-26 18:25:27.455071+00	\N	83c69cb8-a738-4f2d-bf61-25022b5d98e9
00000000-0000-0000-0000-000000000000	382	byudore6ijc7	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 18:59:16.810453+00	2025-05-26 19:58:04.745415+00	qj4glntkxgn4	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	387	3vodcf2xcpbh	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 21:27:17.662956+00	2025-05-26 21:27:17.662956+00	\N	9d584137-9452-4c52-83ab-d058e9c42f53
00000000-0000-0000-0000-000000000000	384	4seuk64qbgpj	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 20:56:52.820276+00	2025-05-26 21:56:40.696182+00	xweb2uq63dib	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	391	mhnt34pexini	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 22:24:32.147222+00	2025-05-26 22:24:32.147222+00	\N	b9baab1b-f333-4bfd-b258-507c2f1d3e72
00000000-0000-0000-0000-000000000000	389	za26f7sv7dp7	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 21:56:40.698276+00	2025-05-26 22:55:28.768566+00	4seuk64qbgpj	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	392	lvbwop64q7n7	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 22:29:48.996331+00	2025-05-26 23:29:48.175887+00	\N	62ea0864-5f38-43c0-a471-e11003e550d6
00000000-0000-0000-0000-000000000000	394	7iamy4avt5xk	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 23:29:48.180276+00	2025-05-26 23:29:48.180276+00	lvbwop64q7n7	62ea0864-5f38-43c0-a471-e11003e550d6
00000000-0000-0000-0000-000000000000	395	wiwqbhjc7t33	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 23:34:20.321223+00	2025-05-26 23:34:20.321223+00	\N	accc07e8-f499-44bc-bc32-b0903acaaafa
00000000-0000-0000-0000-000000000000	396	7zqgqizuqa6y	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 23:45:35.773213+00	2025-05-26 23:45:35.773213+00	\N	906aeee9-a87b-4005-9df3-4687fa666601
00000000-0000-0000-0000-000000000000	397	w2wywhpwpztu	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-26 23:53:57.109562+00	2025-05-26 23:53:57.109562+00	\N	cfb32697-8896-44be-b8a2-94d7cc16342e
00000000-0000-0000-0000-000000000000	398	t76g5r6py4c5	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-27 00:02:53.546604+00	2025-05-27 01:01:46.841622+00	\N	1bd52306-ccd9-411a-89cd-5d04a87f33cb
00000000-0000-0000-0000-000000000000	399	gzxkhce6hby6	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-27 01:01:46.845967+00	2025-05-27 01:01:46.845967+00	t76g5r6py4c5	1bd52306-ccd9-411a-89cd-5d04a87f33cb
00000000-0000-0000-0000-000000000000	400	ola646ooky4t	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-27 01:13:01.72593+00	2025-05-27 01:13:01.72593+00	\N	12799a8a-ffd4-4f2f-9cc3-8058273bb7ee
00000000-0000-0000-0000-000000000000	401	zhyzlbjflxbz	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-27 01:46:08.907824+00	2025-05-27 01:46:08.907824+00	\N	91bc89b1-5bc7-46bb-aebb-f50828bd9b31
00000000-0000-0000-0000-000000000000	402	ufkctcby22as	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-27 01:48:55.209847+00	2025-05-27 01:48:55.209847+00	\N	2c4249b9-ff58-4d4e-8007-135b05e32b78
00000000-0000-0000-0000-000000000000	403	epg5ewol3e4i	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-27 02:01:51.691462+00	2025-05-27 02:01:51.691462+00	\N	be051c4b-a48c-45dc-896a-2fab0fae8784
00000000-0000-0000-0000-000000000000	393	47kucytauhsw	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-26 22:55:28.772592+00	2025-05-27 02:18:42.877399+00	za26f7sv7dp7	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	404	7tfnyyswb4uu	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-27 02:18:42.882556+00	2025-05-27 02:18:42.882556+00	47kucytauhsw	6620a600-8cc8-4ec9-879f-d18e1878c483
00000000-0000-0000-0000-000000000000	405	zxpbo2bz7tlg	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-27 02:19:16.020064+00	2025-05-27 02:19:16.020064+00	\N	2a4c7216-5e44-46cf-896c-a4f69580bd00
00000000-0000-0000-0000-000000000000	406	wnbsjp6raxzh	0066229f-b528-4390-b546-cf5211302a98	t	2025-05-27 02:31:02.713595+00	2025-05-27 03:29:28.161924+00	\N	724a28b6-5006-4ff0-9038-2d1b0a03dd2f
00000000-0000-0000-0000-000000000000	407	j3gnqr3p3hcb	0066229f-b528-4390-b546-cf5211302a98	f	2025-05-27 03:29:28.168367+00	2025-05-27 03:29:28.168367+00	wnbsjp6raxzh	724a28b6-5006-4ff0-9038-2d1b0a03dd2f
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
26876be3-1411-4811-84f8-6d65bfdf4d79	0066229f-b528-4390-b546-cf5211302a98	2025-05-21 19:41:07.575115+00	2025-05-21 19:41:07.575115+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	24.118.188.50	\N
9322bbbe-2cfb-4bca-860b-f91010d7b5c9	0066229f-b528-4390-b546-cf5211302a98	2025-05-21 19:47:56.705737+00	2025-05-21 19:47:56.705737+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	24.118.188.50	\N
8ac97083-16dd-41e5-925a-0cebf068f50e	0066229f-b528-4390-b546-cf5211302a98	2025-05-21 23:54:05.843249+00	2025-05-21 23:54:05.843249+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
af5388f5-b4ba-485b-83e1-a43f7fdcc012	0066229f-b528-4390-b546-cf5211302a98	2025-05-22 00:10:39.51186+00	2025-05-22 00:10:39.51186+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
76dcf0b4-559a-454c-81a6-302ce6f3f338	0066229f-b528-4390-b546-cf5211302a98	2025-05-22 00:25:36.998095+00	2025-05-22 00:25:36.998095+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
c0969125-9b4f-4cb5-ab89-67c502fbf2c3	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 07:09:01.772349+00	2025-05-26 07:09:01.772349+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
1bd52306-ccd9-411a-89cd-5d04a87f33cb	0066229f-b528-4390-b546-cf5211302a98	2025-05-27 00:02:53.542944+00	2025-05-27 01:01:46.84931+00	\N	aal1	\N	2025-05-27 01:01:46.84924	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
91bc89b1-5bc7-46bb-aebb-f50828bd9b31	0066229f-b528-4390-b546-cf5211302a98	2025-05-27 01:46:08.898605+00	2025-05-27 01:46:08.898605+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
be051c4b-a48c-45dc-896a-2fab0fae8784	0066229f-b528-4390-b546-cf5211302a98	2025-05-27 02:01:51.689531+00	2025-05-27 02:01:51.689531+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
724a28b6-5006-4ff0-9038-2d1b0a03dd2f	0066229f-b528-4390-b546-cf5211302a98	2025-05-27 02:31:02.708614+00	2025-05-27 03:29:28.178443+00	\N	aal1	\N	2025-05-27 03:29:28.177754	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
a20bc14d-f664-424d-aaa7-3545c55e6400	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 07:52:03.845161+00	2025-05-26 17:32:16.471026+00	\N	aal1	\N	2025-05-26 17:32:16.470946	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
aaf70eab-f37f-4b07-bc3d-e133c3935ef7	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 18:49:41.961603+00	2025-05-26 21:15:56.864433+00	\N	aal1	\N	2025-05-26 21:15:56.864355	Next.js Middleware	150.195.16.9	\N
bda12296-b25c-4b49-8263-fa1729f10fa8	0066229f-b528-4390-b546-cf5211302a98	2025-05-22 00:41:08.287992+00	2025-05-22 14:15:55.955582+00	\N	aal1	\N	2025-05-22 14:15:55.955498	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
a2f5eed9-8604-44b5-b1cc-ac5f922bf28d	0066229f-b528-4390-b546-cf5211302a98	2025-05-21 20:34:10.176158+00	2025-05-23 03:49:23.956659+00	\N	aal1	\N	2025-05-23 03:49:23.956574	Vercel Edge Functions	3.80.78.175	\N
9d584137-9452-4c52-83ab-d058e9c42f53	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 21:27:17.660541+00	2025-05-26 21:27:17.660541+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
d0f9a3a0-460a-4337-ac24-9530c6a7259f	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 22:04:22.606263+00	2025-05-26 22:04:22.606263+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
4f1e8aad-041c-430e-87c4-cf302d218715	0066229f-b528-4390-b546-cf5211302a98	2025-05-25 22:15:45.737618+00	2025-05-26 01:11:06.339745+00	\N	aal1	\N	2025-05-26 01:11:06.334298	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
1db6ab54-c1ac-475f-99d7-f68d16e73ad8	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 01:57:58.983637+00	2025-05-26 01:57:58.983637+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
187890bd-879e-4825-875a-4f2b1766bde3	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 02:57:30.034543+00	2025-05-26 02:57:30.034543+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
818b9077-fdc9-4a36-adab-bb0103e34ba0	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 03:29:22.770817+00	2025-05-26 03:29:22.770817+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
409a3353-00f3-4bf8-8d86-cfbdd7fdd852	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 03:53:33.492086+00	2025-05-26 03:53:33.492086+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
32f782c9-f676-4e2b-828a-0a437489c8b4	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 03:54:40.46857+00	2025-05-26 05:07:32.091558+00	\N	aal1	\N	2025-05-26 05:07:32.09148	Next.js Middleware	150.195.16.9	\N
051a5bfc-df95-45b7-a844-def8ba292d32	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 05:37:01.563539+00	2025-05-26 05:37:01.563539+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
22188e0a-826d-49df-8767-b8dd2cc27dfb	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 05:58:39.483101+00	2025-05-26 05:58:39.483101+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
7d0332bd-c079-45bd-80cc-6d9b5520afdd	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 06:28:43.905452+00	2025-05-26 06:28:43.905452+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
69bc3a45-eb48-4713-9755-f5012c84967a	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 06:44:55.673095+00	2025-05-26 06:44:55.673095+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
62ea0864-5f38-43c0-a471-e11003e550d6	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 22:29:48.992231+00	2025-05-26 23:29:48.220456+00	\N	aal1	\N	2025-05-26 23:29:48.220378	Next.js Middleware	150.195.16.9	\N
906aeee9-a87b-4005-9df3-4687fa666601	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 23:45:35.769705+00	2025-05-26 23:45:35.769705+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
5d7f2327-1ce7-41e1-87db-2556c20c82ff	0066229f-b528-4390-b546-cf5211302a98	2025-05-21 20:08:46.306989+00	2025-05-21 23:05:26.705242+00	\N	aal1	\N	2025-05-21 23:05:26.705163	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
74f64b7d-5549-4040-bd5b-e5a4f5730c37	0066229f-b528-4390-b546-cf5211302a98	2025-05-21 23:44:11.34901+00	2025-05-21 23:44:11.34901+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
abef003e-ef79-4898-a5b8-6c9b18e0931c	0066229f-b528-4390-b546-cf5211302a98	2025-05-22 00:02:00.39055+00	2025-05-22 00:02:00.39055+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
137a7798-5ce0-4540-9f1c-df34eb767ae8	0066229f-b528-4390-b546-cf5211302a98	2025-05-22 00:16:41.781832+00	2025-05-22 00:16:41.781832+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
83c69cb8-a738-4f2d-bf61-25022b5d98e9	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 18:25:27.444106+00	2025-05-26 18:25:27.444106+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
350c53f0-7099-46c5-b83d-67b1ed176925	0066229f-b528-4390-b546-cf5211302a98	2025-05-22 00:36:18.483109+00	2025-05-25 22:15:15.951631+00	\N	aal1	\N	2025-05-25 22:15:15.950878	Next.js Middleware	150.195.16.9	\N
66b4e73b-e88b-4613-9714-111db32a7383	0066229f-b528-4390-b546-cf5211302a98	2025-05-22 14:56:25.463924+00	2025-05-26 01:20:01.014783+00	\N	aal1	\N	2025-05-26 01:20:01.014704	Vercel Edge Functions	34.224.101.137	\N
0dc747ad-c3d0-4199-90c6-c277751d7bb7	0066229f-b528-4390-b546-cf5211302a98	2025-05-21 19:32:41.431253+00	2025-05-21 19:32:41.431253+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	24.118.188.50	\N
35070197-ec2f-4ce0-b467-71f2bb809617	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 02:03:14.389698+00	2025-05-26 02:03:14.389698+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
8cc857bc-a878-43a0-b51a-a3c9281756c2	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 03:14:31.065609+00	2025-05-26 03:14:31.065609+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
346a347d-29dd-47fc-a369-3bf0401d8ce7	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 01:20:13.252363+00	2025-05-26 03:17:28.752578+00	\N	aal1	\N	2025-05-26 03:17:28.752507	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
a485b8ca-a7af-4896-b22b-2d408da19583	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 03:43:22.189177+00	2025-05-26 03:43:22.189177+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
07c7301d-82b1-48a7-af8f-8dbae544d378	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 05:40:18.772822+00	2025-05-26 05:40:18.772822+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
1b544550-6ccd-433b-9bce-1dbb5f4a34e0	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 21:16:14.301446+00	2025-05-26 21:16:14.301446+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
5f8d4915-1997-439f-8fa2-d80f6c79b3cc	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 06:16:24.963519+00	2025-05-26 06:16:24.963519+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
c42484d2-fd0d-4e17-b540-4b9e8038c415	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 06:37:09.33336+00	2025-05-26 06:37:09.33336+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
9f8725e2-5a7b-4455-a143-a772bb0c9833	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 06:48:36.393622+00	2025-05-26 06:48:36.393622+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
decb9974-c519-4242-b728-cc5cb4b1863b	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 21:33:55.498887+00	2025-05-26 21:33:55.498887+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
4f1ea97a-2114-4c83-b196-ff7cc87b8bd1	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 07:47:19.935442+00	2025-05-26 07:47:19.935442+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
b9baab1b-f333-4bfd-b258-507c2f1d3e72	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 22:24:32.144915+00	2025-05-26 22:24:32.144915+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
accc07e8-f499-44bc-bc32-b0903acaaafa	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 23:34:20.317489+00	2025-05-26 23:34:20.317489+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
cfb32697-8896-44be-b8a2-94d7cc16342e	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 23:53:57.105987+00	2025-05-26 23:53:57.105987+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
12799a8a-ffd4-4f2f-9cc3-8058273bb7ee	0066229f-b528-4390-b546-cf5211302a98	2025-05-27 01:13:01.723261+00	2025-05-27 01:13:01.723261+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
2c4249b9-ff58-4d4e-8007-135b05e32b78	0066229f-b528-4390-b546-cf5211302a98	2025-05-27 01:48:55.20743+00	2025-05-27 01:48:55.20743+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
6620a600-8cc8-4ec9-879f-d18e1878c483	0066229f-b528-4390-b546-cf5211302a98	2025-05-26 04:17:34.341075+00	2025-05-27 02:18:42.885957+00	\N	aal1	\N	2025-05-27 02:18:42.885886	Vercel Edge Functions	3.90.114.178	\N
2a4c7216-5e44-46cf-896c-a4f69580bd00	0066229f-b528-4390-b546-cf5211302a98	2025-05-27 02:19:16.019169+00	2025-05-27 02:19:16.019169+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36	150.195.16.9	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	0066229f-b528-4390-b546-cf5211302a98	authenticated	authenticated	brian.h.berge@gmail.com	$2a$10$4g8gkzXOkK67vTmUkGWVE.CUU5vNOEE28IGEOVhDeu05LeFc7911e	2025-05-08 02:13:55.834769+00	\N		2025-05-08 02:12:33.19354+00		2025-05-08 02:47:31.208909+00			\N	2025-05-27 02:31:02.708528+00	{"provider": "email", "providers": ["email"]}	{"sub": "0066229f-b528-4390-b546-cf5211302a98", "email": "brian.h.berge@gmail.com", "full_name": "Brian Berge", "email_verified": true, "phone_verified": false}	\N	2025-05-08 02:12:33.142651+00	2025-05-27 03:29:28.170917+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	84aea900-ddfd-42de-9eb4-a355b6d53df0	authenticated	authenticated	bhberge@gmail.com	$2a$10$ZkLV.5AzKxdzeiBSaf3VveF4zun4d1Iq9XuIbf8vWQC/QG9d7B5wS	2025-05-08 05:01:38.498904+00	\N		2025-05-08 05:00:54.418914+00		\N			\N	2025-05-08 05:01:51.088389+00	{"provider": "email", "providers": ["email"]}	{"sub": "84aea900-ddfd-42de-9eb4-a355b6d53df0", "email": "bhberge@gmail.com", "display_name": "Von Hanson", "email_verified": true, "phone_verified": false}	\N	2025-05-08 05:00:54.398103+00	2025-05-08 05:01:51.092488+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7be6492f-592f-4d83-ad3d-95dbddbd68cf	authenticated	authenticated	brian@bergeinsurance.com	$2a$10$1bDXxZrUG0uV9rki5omgGOYdLatc58WqMhcaUMODL3hahhs2rElzC	2025-05-08 04:43:36.790621+00	\N		2025-05-08 04:43:26.26012+00		\N			\N	2025-05-08 04:43:38.084343+00	{"provider": "email", "providers": ["email"]}	{"sub": "7be6492f-592f-4d83-ad3d-95dbddbd68cf", "email": "brian@bergeinsurance.com", "display_name": "Hal", "email_verified": true, "phone_verified": false}	\N	2025-05-08 04:43:26.249391+00	2025-05-08 04:43:38.087316+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4cc92b12-b5ca-4e14-9312-e281519f04d6	authenticated	authenticated	vince@vincehunt.com	$2a$10$I9NL/GwaSZn87VRus.gO1.6zcWem0f0luUehdJB8aLbNOxw8jW9xm	2025-05-09 19:28:03.90337+00	\N		2025-05-09 19:27:51.798206+00		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"sub": "4cc92b12-b5ca-4e14-9312-e281519f04d6", "email": "vince@vincehunt.com", "email_verified": true, "phone_verified": false}	\N	2025-05-09 19:27:51.72071+00	2025-05-09 19:28:03.908361+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addresses (id, street, city, state, zip_code, type, is_verified, geocode_lat, geocode_lng, metadata, created_at, updated_at, verified_at) FROM stdin;
a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d	123 Main St	Minneapolis	MN	55401	Physical	t	44.97780000	-93.26500000	\N	2025-05-20 20:53:14.571377	2025-05-20 20:53:14.571377	\N
b2c3d4e5-f6a7-5b6c-9d0e-2f3a4b5c6d7e	456 Oak Ave	St. Paul	MN	55102	Physical	t	44.95370000	-93.09000000	\N	2025-05-20 20:53:14.571377	2025-05-20 20:53:14.571377	\N
d4e5f6a7-b8c9-7d0e-1f2a-4b5c6d7e8f9a	101 Cedar Ln	Bloomington	MN	55420	Physical	t	44.84080000	-93.29830000	\N	2025-05-20 20:53:14.571377	2025-05-20 20:53:14.571377	\N
e5f6a7b8-c9d0-8e1f-2a3b-5c6d7e8f9a0b	202 Maple Dr	Plymouth	MN	55441	Physical	t	45.01050000	-93.45550000	\N	2025-05-20 20:53:14.571377	2025-05-20 20:53:14.571377	\N
f6a7b8c9-d0e1-9f2a-3b4c-6d7e8f9a0b1c	123 Main St	Minneapolis	MN	55401	Mailing	t	44.97780000	-93.26500000	\N	2025-05-20 20:53:14.571377	2025-05-20 20:53:14.571377	\N
a7b8c9d0-e1f2-0a3b-4c5d-7e8f9a0b1c2d	PO Box 1234	Minneapolis	MN	55402	Mailing	t	44.97780000	-93.26500000	\N	2025-05-20 20:53:14.571377	2025-05-20 20:53:14.571377	\N
b8c9d0e1-f2a3-1b4c-5d6e-8f9a0b1c2d3e	456 Oak Ave	St. Paul	MN	55102	Mailing	t	44.95370000	-93.09000000	\N	2025-05-20 20:53:14.571377	2025-05-20 20:53:14.571377	\N
d0e1f2a3-b4c5-3d6e-7f8a-0b1c2d3e4f5a	101 Cedar Ln	Bloomington	MN	55420	Mailing	t	44.84080000	-93.29830000	\N	2025-05-20 20:53:14.571377	2025-05-20 20:53:14.571377	\N
c3d4e5f6-a7b8-6c7d-0e1f-3a4b5c6d7e8f	789 Pine Rd	Edina	MN	55424	Physical	t	44.88970000	-93.35010000	\N	2025-05-20 20:53:14.571377	2025-05-21 05:40:57.033	\N
c9d0e1f2-a3b4-2c5d-6e7f-9a0b1c2d3e4f	PO Box 5678	Edina	MN	55424	Mailing	t	44.88970000	-93.35010000	\N	2025-05-20 20:53:14.571377	2025-05-21 05:40:57.572	\N
\.


--
-- Data for Name: ai_interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_interactions (id, lead_id, leads_contact_info_id, type, source, content, ai_response, summary, model_used, temperature, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campaigns (id, name, description, start_date, end_date, campaign_type, target_audience, content_template, metrics, ai_optimization_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, client_type, name, email, phone_number, street_address, city, state, zip_code, mailing_address, referred_by, date_of_birth, gender, marital_status, drivers_license, license_state, education_occupation, business_type, industry, tax_id, year_established, annual_revenue, number_of_employees, contact_first_name, contact_last_name, contact_title, contact_email, contact_phone, created_at, updated_at, prior_address, rent_or_own, effective_date, sr22_required, military_status, accident_description, accident_date) FROM stdin;
\.


--
-- Data for Name: code_redemptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.code_redemptions (id, discount_code_id, user_id, redeemed_at, order_id) FROM stdin;
\.


--
-- Data for Name: communication_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communication_types (id, name, description, icon_name, requires_follow_up, ai_summary_template, created_at, updated_at) FROM stdin;
1	Email	Email communication with client	mail	t	Email about {topic}: {key_points}	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
2	SMS	Text message communication	message-square	t	Text message about {topic}: {key_points}	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
3	Call	Phone call with client	phone	t	{duration} minute call about {topic}: {key_points}	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
4	Note	Internal note about client	file-text	f	Note about {topic}: {key_points}	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
5	Meeting	In-person or virtual meeting	users	t	{duration} minute meeting about {topic}: {key_points}	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
6	Video Call	Video conference with client	video	t	{duration} minute video call about {topic}: {key_points}	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
7	Social Media	Interaction via social media	instagram	f	Social media interaction on {platform}: {key_points}	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
8	Mail	Physical mail sent to client	mail	f	Mail sent about {topic}: {key_points}	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, leads_contact_info_id, first_name, last_name, title, email, phone_number, is_primary_contact, notes, department, linkedin_url, preferred_contact_method, ai_summary, ai_relationship_strength, metadata, tags, created_at, updated_at, last_contact_at, next_contact_at) FROM stdin;
\.


--
-- Data for Name: developer_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.developer_notes (id, title, category, tags, priority, status, summary, description, solution, related_table, related_feature, related_files, technical_details, decision_context, implementation_notes, created_by, assigned_to, created_at, updated_at, resolved_at) FROM stdin;
49286352-c6dd-4d20-8ba9-30bb4f47023e	Database Schema Update for Normalized Structure	architecture	{database,schema,normalization}	high	documented	Updated database schema to use normalized structure with client-lead relationship	The original schema had leads with direct fields for name, email, etc. The new schema separates clients and leads, with leads referencing clients through client_id.	\N	leads, clients	data-modeling	{database.types.ts,normalized_schema.sql}	{"changes": ["Created clients table", "Updated leads table to reference clients", "Added lookup tables for statuses and insurance types"]}	{"options": ["Keep flat structure", "Normalize with client-lead relationship", "Use completely separate tables"], "problem": "The original schema did not support B2B clients well and had redundant data", "decision": "Normalize with client-lead relationship", "consequences": "Better data organization but requires frontend code updates"}	{"frontend_updates": ["Update forms to create client first, then lead", "Update queries to join clients and leads", "Update UI components to display client data"]}	system	\N	2025-05-01 20:57:07.161731+00	2025-05-01 20:57:07.161731+00	\N
e3500fc0-3881-4b8d-95f3-fbf149e3b03c	Alpha Page Performance Optimization	Performance	{performance,optimization,database,indexes,realtime}	high	documented	Alpha Page Performance Optimization (ROLLED BACK)	The Alpha page was experiencing longer load times compared to other pages in the application due to inefficient database queries and excessive realtime subscription load.\n\nUPDATE: These optimizations were rolled back due to issues with adding new leads and minimal performance improvement. The rollback was completed on 2025-05-02 02:51:42.570778+00.	Implemented database indexes for efficient filtering and sorting, optimized realtime subscriptions to reduce database load, and improved client-side state management.	leads, clients	Alpha Pipeline Kanban Board	{frontend-next-files/app/dashboard/leads/page.tsx,frontend-next-files/utils/lead-api.ts,frontend-next-files/docs/alpha_page_optimization.md,frontend-next-files/supabase/migrations/20250503_optimize_alpha_page.sql}	{"git_commit": "6b1a132", "database_indexes": ["idx_leads_pipeline_created_at", "idx_leads_client_id", "idx_leads_status_id", "idx_leads_insurance_type_id", "idx_clients_name_trgm", "idx_clients_email_trgm", "idx_clients_phone_trgm"], "query_execution_time": "0.383 ms"}	{"problem": "The Alpha page was loading slowly, especially with larger datasets", "decision_factors": ["Performance impact", "Implementation complexity", "Maintainability"], "alternatives_considered": ["Client-side filtering", "Pagination", "Materialized views"]}	{"key_changes": ["Added composite index for pipeline_id and created_at", "Added foreign key indexes", "Added trigram indexes for text search", "Optimized realtime subscription to filter by pipeline_id", "Improved state management for realtime updates"], "rollback_plan": "Created rollback script in case of issues", "rollback_status": "completed", "testing_approach": "Measured query execution time before and after changes"}	Brian Berg	Brian Berg	2025-05-02 02:28:36.681577+00	2025-05-02 02:51:42.570778+00	\N
0489e87e-6c42-4e06-81b3-02982e27868e	Form Initialization Error and Dependency Hell Fiasco	Bug Fix	{form,dependency,vercel,deployment,react-hook-form,date-fns}	high	resolved	Fixed circular dependency in ClientInfoForm and resolved date-fns version conflict that sucked ass	This was a complete nightmare. Two critical issues were breaking the app: 1) A "Cannot access form before initialization" error when clicking the New Leads button, and 2) Vercel deployment failures due to a dependency conflict between date-fns and react-day-picker. The form error was caused by a circular dependency where the useEffect hook was trying to use the form variable before it was initialized. The deployment error was due to date-fns@4.1.0 being incompatible with react-day-picker@8.10.1 which requires date-fns@^2.28.0 || ^3.0.0. This dependency hell sucked ass and wasted hours of development time. IMPORTANT: These issues were introduced as part of the Alpha Page Performance Optimization (ID: e3500fc0-3881-4b8d-95f3-fbf149e3b03c) which broke the application functionality.	After much frustration, we fixed this mess with two key changes: 1) Moved the form initialization before the useEffect hook that was using it (seems obvious in hindsight), and 2) Updated the date-fns dependency from version 4.1.0 to 3.6.0 to be compatible with react-day-picker. Also improved the SQL rollback script for the Alpha page optimization by adding a commented line for dropping the pg_trgm extension if needed in the future. Lesson learned: always check dependency compatibility before upgrading packages.	clients	Lead Management	{frontend-next-files/components/forms/client-info-form.tsx,frontend-next-files/package.json,frontend-next-files/supabase/migrations/20250503_rollback_optimize_alpha_page.sql}	{"root_cause": "Circular dependency in React component", "code_changes": {"package_json": "Updated date-fns to version 3.6.0", "form_submission": "Fixed type issues with form submission handler", "form_initialization": "Moved form initialization before useEffect"}, "error_message": "Cannot access form before initialization", "dependency_conflict": {"package": "date-fns", "required_by": "react-day-picker@8.10.1", "required_version": "^2.28.0 || ^3.0.0", "installed_version": "4.1.0"}}	{"optimization_impact": "The Alpha Page Performance Optimization introduced these issues by updating dependencies and modifying form components without proper testing.", "related_optimization_id": "e3500fc0-3881-4b8d-95f3-fbf149e3b03c"}	\N	brian.h.berge@gmail.com	\N	2025-05-02 03:25:33.685112+00	2025-05-02 03:25:33.685112+00	\N
\.


--
-- Data for Name: discount_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discount_codes (id, code, discount_percent, max_uses, current_uses, expires_at, is_active, created_at, description, discount_type, discount_amount, is_one_time_use, specific_user_id, campaign_id, min_purchase_amount, applicable_plan) FROM stdin;
5ee63e05-3226-4711-8330-681836840800	GONZIGODEV	100	\N	0	\N	t	2025-05-08 21:49:43.363532+00	Development only discount code for free access during development	percentage	\N	f	\N	\N	\N	\N
\.


--
-- Data for Name: homes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.homes (id, address, city, state, zip, year_built, square_feet, construction_type, roof_type, user_id, created_at, updated_at, lead_id, leads_contact_info_id) FROM stdin;
\.


--
-- Data for Name: insurance_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insurance_types (id, name, is_personal, is_commercial, description, icon_name, form_schema, ai_prompt_template, created_at, updated_at) FROM stdin;
1	Auto	t	f	Automobile insurance for personal vehicles	car	\N	Ask about: vehicle details (year, make, model), drivers, current coverage, driving history, and desired coverage levels	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
2	Home	t	f	Homeowners and renters insurance	home	\N	Ask about: property details, value, construction type, safety features, current coverage, and desired coverage levels	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
3	Specialty	t	f	Specialty items like boats, RVs, motorcycles	umbrella	\N	Ask about: item details, usage, storage, value, and desired coverage levels	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
4	Commercial	f	t	Business insurance for commercial entities	briefcase	\N	Ask about: business type, size, revenue, employees, assets, operations, and risk exposures	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
5	Liability	t	t	Liability coverage for individuals and businesses	shield	\N	Ask about: assets to protect, current coverage, risk factors, and desired coverage levels	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
\.


--
-- Data for Name: invite_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invite_codes (id, code, description, max_uses, current_uses, expires_at, created_at, created_by, is_active, plan_id) FROM stdin;
\.


--
-- Data for Name: lead_communications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_communications (id, lead_id, contact_id, type_id, direction, content, status, created_by, subject, channel, duration, outcome, ai_summary, ai_sentiment, ai_entities, ai_action_items, ai_follow_up_suggestion, metadata, created_at, updated_at, scheduled_at, completed_at, follow_up_at) FROM stdin;
\.


--
-- Data for Name: lead_marketing_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_marketing_settings (id, lead_id, campaign_id, is_active, settings, opt_in_status, engagement_score, segment, ai_campaign_fit_score, ai_recommended_campaigns, ai_content_preferences, metadata, created_at, updated_at, last_engagement_at, opt_in_at, opt_out_at) FROM stdin;
\.


--
-- Data for Name: lead_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_notes (id, lead_id, note_content, created_by, note_type, is_pinned, ai_summary, ai_sentiment, ai_entities, ai_action_items, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lead_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_statuses (id, value, description, is_final, display_order, color_hex, icon_name, ai_action_template, created_at, updated_at) FROM stdin;
1	New	Lead has been created but no action taken	f	1	#3498db	plus-circle	Review lead information and make initial contact via {preferred_contact_method}	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
2	Contacted	Initial contact has been made	f	2	#f39c12	phone	Follow up on initial contact and gather additional information about insurance needs	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
3	Quoted	Quote has been provided	f	3	#2ecc71	file-text	Follow up on quote, address any questions, and discuss next steps	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
4	Sold	Policy has been sold	t	4	#27ae60	check-circle	Confirm policy details, schedule welcome call, and explore cross-selling opportunities	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
5	Lost	Lead did not convert	t	5	#e74c3c	x-circle	Analyze reason for loss, document feedback, and consider for future remarketing	2025-05-01 06:22:41.323766	2025-05-01 06:22:41.323766
\.


--
-- Data for Name: leads_contact_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads_contact_info (id, lead_type, name, email, phone_number, address_id, mailing_address_id, referred_by, date_of_birth, gender, marital_status, drivers_license, license_state, education_occupation, business_type, industry, tax_id, year_established, annual_revenue, number_of_employees, ai_summary, ai_next_action, ai_risk_score, ai_lifetime_value, metadata, tags, created_at, updated_at, last_contact_at, next_contact_at, converted_from_lead_id) FROM stdin;
d3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a	Individual	Emily Wilson	emily.wilson@example.com	952-555-3456	d4e5f6a7-b8c9-7d0e-1f2a-4b5c6d7e8f9a	d0e1f2a3-b4c5-3d6e-7f8a-0b1c2d3e4f5a	\N	1990-11-28	Female	Married	W34567890	MN	Physician	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N
a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d	Individual	John Smith	john.smith@example.com	612-555-1234	a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d	f6a7b8c9-d0e1-9f2a-3b4c-6d7e8f9a0b1c	\N	1980-05-15	Male	Married	S12345678	MN	Software Engineer	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N
b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e	Individual	Jane Doe	jane.doe@example.com	651-555-5678	b2c3d4e5-f6a7-5b6c-9d0e-2f3a4b5c6d7e	a7b8c9d0-e1f2-0a3b-4c5d-7e8f9a0b1c2d	\N	1985-08-22	Female	Single	D87654321	MN	Marketing Director	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N
e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b	Individual	Michael Brown	michael.brown@example.com	612-555-7890	e5f6a7b8-c9d0-8e1f-2a3b-5c6d7e8f9a0b	b8c9d0e1-f2a3-1b4c-5d6e-8f9a0b1c2d3e	\N	1982-07-04	Male	Married	B45678901	MN	Construction Manager	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N
c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f	Individual	Robert Johnson	robert.johnson@example.com	6127996380	c3d4e5f6-a7b8-6c7d-0e1f-3a4b5c6d7e8f	c9d0e1f2-a3b4-2c5d-6e7f-9a0b1c2d3e4f	\N	1975-03-10	Male	Divorced	J23456789	MN	Financial Analyst	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-20 20:53:14.571377+00	2025-05-21 05:40:56.703+00	\N	\N	\N
\.


--
-- Data for Name: leads_ins_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads_ins_info (id, status_id, insurance_type_id, assigned_to, notes, current_carrier, premium, auto_premium, home_premium, specialty_premium, commercial_premium, umbrella_value, umbrella_uninsured_underinsured, auto_current_insurance_carrier, auto_months_with_current_carrier, specialty_type, specialty_make, specialty_model, specialty_year, commercial_coverage_type, commercial_industry, auto_data, auto_data_schema_version, home_data, home_data_schema_version, specialty_data, specialty_data_schema_version, commercial_data, commercial_data_schema_version, liability_data, liability_data_schema_version, additional_insureds, additional_locations, ai_summary, ai_next_action, ai_quote_recommendation, ai_follow_up_priority, metadata, tags, created_at, updated_at, status_changed_at, last_contact_at, next_contact_at, quote_generated_at, sold_at, lost_at, pipeline_id, address_id, mailing_address_id, leads_contact_info_id, first_name, last_name, email, phone_number) FROM stdin;
\.


--
-- Data for Name: opportunities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opportunities (id, lead_id, name, stage, amount, probability, expected_close_date, actual_close_date, notes, source, type, competitors, decision_makers, ai_win_probability, ai_suggested_actions, ai_risk_factors, ai_summary, metadata, tags, created_at, updated_at, stage_changed_at, last_activity_at) FROM stdin;
\.


--
-- Data for Name: other_insureds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.other_insureds (id, name, relationship, date_of_birth, gender, user_id, created_at, updated_at, lead_id, client_id, first_name, last_name, drivers_license, license_state, marital_status, education_occupation) FROM stdin;
f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c	Mary Smith	Spouse	1982-09-20	Female	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N	\N	\N	\N	\N	\N
a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d	James Smith	Child	2010-03-15	Male	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N	\N	\N	\N	\N	\N
b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e	Emma Smith	Child	2012-07-10	Female	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N	\N	\N	\N	\N	\N
c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f	Sarah Johnson	Spouse	1978-11-05	Female	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N	\N	\N	\N	\N	\N
d5e6f7a8-b9c0-1d2e-3f4a-5b6c7d8e9f0a	David Wilson	Spouse	1988-04-12	Male	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N	\N	\N	\N	\N	\N
e6f7a8b9-c0d1-2e3f-4a5b-6c7d8e9f0a1b	Jennifer Brown	Spouse	1984-02-18	Female	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: pipeline_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pipeline_statuses (id, pipeline_id, name, description, is_final, display_order, color_hex, icon_name, ai_action_template, created_at, updated_at) FROM stdin;
1	1	New	Lead has been created but no action taken	f	1	#3498db	plus-circle	Review lead information and make initial contact via {preferred_contact_method}	2025-05-01 23:49:25.122436+00	2025-05-05 12:09:44.036+00
2	1	Contacted	Initial contact has been made	f	2	#f39c12	phone	Follow up on initial contact and gather additional information about insurance needs	2025-05-01 23:49:25.122436+00	2025-05-05 12:09:44.111+00
3	1	Quoted	Quote has been provided	f	3	#2ecc71	file-text	Follow up on quote, address any questions, and discuss next steps	2025-05-01 23:49:25.122436+00	2025-05-05 12:09:44.181+00
4	1	Sold	Policy has been sold	t	4	#27ae60	check-circle	Confirm policy details, schedule welcome call, and explore cross-selling opportunities	2025-05-01 23:49:25.122436+00	2025-05-05 12:09:44.25+00
5	1	Lost	Lead did not convert	t	5	#e74c3c	x-circle	Analyze reason for loss, document feedback, and consider for future remarketing	2025-05-01 23:49:25.122436+00	2025-05-05 12:09:44.333+00
6	2	New	Business lead has been created but no action taken	f	1	#3498db	plus-circle	Review business lead information and make initial contact via {preferred_contact_method}	2025-05-20 03:51:14.961417+00	2025-05-20 03:51:14.961417+00
7	2	Contacted	Initial contact has been made with business	f	2	#f39c12	phone	Follow up on initial contact and gather additional information about business insurance needs	2025-05-20 03:51:14.961417+00	2025-05-20 03:51:14.961417+00
8	2	Quoted	Quote has been provided to business	f	3	#2ecc71	file-text	Follow up on quote, address any questions, and discuss next steps with business decision makers	2025-05-20 03:51:14.961417+00	2025-05-20 03:51:14.961417+00
9	2	Sold	Policy has been sold to business	t	4	#27ae60	check-circle	Confirm policy details, schedule welcome call with business stakeholders, and explore cross-selling opportunities	2025-05-20 03:51:14.961417+00	2025-05-20 03:51:14.961417+00
10	2	Lost	Business lead did not convert	t	5	#e74c3c	x-circle	Analyze reason for loss, document feedback, and consider for future business remarketing	2025-05-20 03:51:14.961417+00	2025-05-20 03:51:14.961417+00
\.


--
-- Data for Name: pipelines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pipelines (id, name, description, is_default, display_order, created_at, updated_at) FROM stdin;
1	Alpha	Standard sales pipeline for insurance leads	t	1	2025-05-01 23:49:25.122436+00	2025-05-05 12:09:47.749+00
2	Bravo	Business client pipeline for commercial and corporate accounts	f	2	2025-05-20 03:50:23.18135+00	2025-05-20 03:50:23.18135+00
\.


--
-- Data for Name: ringcentral_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ringcentral_tokens (id, user_id, access_token, refresh_token, token_type, expires_at, scope, created_at, updated_at, refresh_token_expires_at) FROM stdin;
946f5e4c-a467-4b5f-b4e8-1327311e125f	0066229f-b528-4390-b546-cf5211302a98	U0pDMDFQMDFQQVMwMHxBQUFoYTR0d1h4Z0RRQ3VHQmZmOFVxazN0eEQ0LVNORzhCTGgtT0d3Rmd3a3prNjhoVWtRQ0RYZmtwV2Fjb0xSQ09FdWo4dlFxNHB4VjZsVEJuaVd2YlJVR1pqemV6T09hdXo4SE0wZWxGQ19RVHZZZnU1NndiNWs5QmVBVks0Y2UwOERLZVJDeXJoNzJBUGN1UkliaWtPRFd3MmtMWjR2OV80eE9mNU9HeFh6blRGanhqTzBJUVlfeWZoNUxMM1NUMm02NUhRN1lfSXJ0R2pXNm1KenBSU2FOM0R6ZWd8QnZEWHJRfFh0RUtSUXpUNV93eGltWVVPNUF2Tnd8QVF8QUF8QUFBQUFMdWZYazA	U0pDMDFQMDFQQVMwMHxBQURIa19ZSTdTMmdqaDRWMkZzMzgzbXcxd0JYYmJUZF9zMlFEbldlckVUby1LYUxiTEVGUjRwUWhacU54ekcxR2YyM2NKN1VzclZ6T24tTGY0NnlYRElTUEEzM2ZkeTBpcWNMTzk0YnVoSE8xeFFNbnNGOUlLd0ZLbU1xTmo2WllJXzJWeFRCbkRQOEpKN3AzbWpla29fZnVwbWZabmUzRUU0amZCVFMwdV9UbHZRdFc0VWVGWVBjeVBQUndqbk1KM25HaXRmY0daejRfN3owcms1QlBDLUNRbHlyOFF8QnZEWHJRfFhnSGlMck10TjU2VXN3ejQtZnpHVVF8QVF8QUF8QUFBQUFFaUcxZlE	bearer	2025-05-27 03:13:56.302+00	ReadAccounts RingOut SMS	2025-05-27 02:13:56.451+00	2025-05-27 02:13:56.303+00	2025-06-03 02:13:56.302+00
\.


--
-- Data for Name: ringcentral_tokens_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ringcentral_tokens_backup (id, user_id, access_token, refresh_token, token_type, expires_at, scope, created_at, updated_at, refresh_token_expires_at) FROM stdin;
\.


--
-- Data for Name: schema_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_versions (id, version, applied_at, description, is_active, rolled_back_at) FROM stdin;
1	20250519_fix_ringcentral_tokens	2025-05-21 20:06:36.436048+00	Fix RingCentral tokens table structure and constraints	t	\N
\.


--
-- Data for Name: specialty_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.specialty_items (id, name, value, description, user_id, created_at, updated_at, lead_id, leads_contact_info_id) FROM stdin;
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_tickets (id, leads_contact_info_id, lead_id, created_by, issue_type, issue_description, resolution_summary, status, assigned_to, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, full_name, avatar_url, role, created_at, updated_at) FROM stdin;
0066229f-b528-4390-b546-cf5211302a98	brian.h.berge@gmail.com	Brian Berge	\N	user	2025-05-08 02:12:33.142239+00	2025-05-08 02:12:33.142239+00
7be6492f-592f-4d83-ad3d-95dbddbd68cf	brian@bergeinsurance.com	\N	\N	user	2025-05-08 04:43:26.249087+00	2025-05-08 04:43:26.249087+00
84aea900-ddfd-42de-9eb4-a355b6d53df0	bhberge@gmail.com	\N	\N	user	2025-05-08 05:00:54.397764+00	2025-05-08 05:00:54.397764+00
4cc92b12-b5ca-4e14-9312-e281519f04d6	vince@vincehunt.com	\N	\N	user	2025-05-09 19:27:51.720344+00	2025-05-09 19:27:51.720344+00
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, make, model, year, vin, license_plate, state, primary_use, annual_mileage, user_id, created_at, updated_at, lead_id, leads_contact_info_id) FROM stdin;
f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c	Toyota	Highlander	2020	1HGCM82633A123456	ABC-123	MN	Commute	12000	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N
a8b9c0d1-e2f3-4a5b-6c7d-8e9f0a1b2c3d	Honda	Civic	2018	2HGFC2F52JH123456	XYZ-789	MN	Pleasure	8000	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N
b9c0d1e2-f3a4-5b6c-7d8e-9f0a1b2c3d4e	Subaru	Outback	2019	4S3BNAC61J3123456	DEF-456	MN	Commute	15000	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N
c0d1e2f3-a4b5-6c7d-8e9f-0a1b2c3d4e5f	Tesla	Model Y	2021	5YJ3E1EA1MF123456	GHI-789	MN	Commute	10000	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N
d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a	Jeep	Grand Cherokee	2017	1C4RJFAG5HC123456	JKL-012	MN	Pleasure	5000	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N
e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b	Ford	F-150	2019	1FTEW1E53JFA12345	MNO-345	MN	Commute	18000	\N	2025-05-20 20:53:14.571377+00	2025-05-20 20:53:14.571377+00	\N	\N
\.


--
-- Data for Name: messages_2025_05_24; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_05_24 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_05_25; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_05_25 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_05_26; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_05_26 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_05_27; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_05_27 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_05_28; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_05_28 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_05_29; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_05_29 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_05_30; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_05_30 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-04-29 03:27:22
20211116045059	2025-04-29 03:27:23
20211116050929	2025-04-29 03:27:23
20211116051442	2025-04-29 03:27:23
20211116212300	2025-04-29 03:27:23
20211116213355	2025-04-29 03:27:23
20211116213934	2025-04-29 03:27:24
20211116214523	2025-04-29 03:27:24
20211122062447	2025-04-29 03:27:24
20211124070109	2025-04-29 03:27:24
20211202204204	2025-04-29 03:27:25
20211202204605	2025-04-29 03:27:25
20211210212804	2025-04-29 03:27:26
20211228014915	2025-04-29 03:27:26
20220107221237	2025-04-29 03:27:26
20220228202821	2025-04-29 03:27:26
20220312004840	2025-04-29 03:27:26
20220603231003	2025-04-29 03:27:27
20220603232444	2025-04-29 03:27:27
20220615214548	2025-04-29 03:27:27
20220712093339	2025-04-29 03:27:27
20220908172859	2025-04-29 03:27:27
20220916233421	2025-04-29 03:27:28
20230119133233	2025-04-29 03:27:28
20230128025114	2025-04-29 03:27:28
20230128025212	2025-04-29 03:27:28
20230227211149	2025-04-29 03:27:29
20230228184745	2025-04-29 03:27:29
20230308225145	2025-04-29 03:27:29
20230328144023	2025-04-29 03:27:29
20231018144023	2025-04-29 03:27:29
20231204144023	2025-04-29 03:27:30
20231204144024	2025-04-29 03:27:30
20231204144025	2025-04-29 03:27:30
20240108234812	2025-04-29 03:27:30
20240109165339	2025-04-29 03:27:31
20240227174441	2025-04-29 03:27:31
20240311171622	2025-04-29 03:27:31
20240321100241	2025-04-29 03:27:32
20240401105812	2025-04-29 03:27:32
20240418121054	2025-04-29 03:27:33
20240523004032	2025-04-29 03:27:33
20240618124746	2025-04-29 03:27:34
20240801235015	2025-04-29 03:27:34
20240805133720	2025-04-29 03:27:34
20240827160934	2025-04-29 03:27:34
20240919163303	2025-04-29 03:27:34
20240919163305	2025-04-29 03:27:35
20241019105805	2025-04-29 03:27:35
20241030150047	2025-04-29 03:27:35
20241108114728	2025-04-29 03:27:36
20241121104152	2025-04-29 03:27:36
20241130184212	2025-04-29 03:27:36
20241220035512	2025-04-29 03:27:36
20241220123912	2025-04-29 03:27:36
20241224161212	2025-04-29 03:27:37
20250107150512	2025-04-29 03:27:37
20250110162412	2025-04-29 03:27:37
20250123174212	2025-04-29 03:27:37
20250128220012	2025-04-29 03:27:37
20250506224012	2025-05-21 22:39:38
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-04-29 03:27:21.368568
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-04-29 03:27:21.375421
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-04-29 03:27:21.379748
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-04-29 03:27:21.405281
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-04-29 03:27:21.43248
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-04-29 03:27:21.437361
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-04-29 03:27:21.442877
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-04-29 03:27:21.447876
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-04-29 03:27:21.452477
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-04-29 03:27:21.457425
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-04-29 03:27:21.46258
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-04-29 03:27:21.468832
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-04-29 03:27:21.476753
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-04-29 03:27:21.482621
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-04-29 03:27:21.487656
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-04-29 03:27:21.517235
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-04-29 03:27:21.522119
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-04-29 03:27:21.527109
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-04-29 03:27:21.53329
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-04-29 03:27:21.540425
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-04-29 03:27:21.546914
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-04-29 03:27:21.557219
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-04-29 03:27:21.589989
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-04-29 03:27:21.616073
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-04-29 03:27:21.621053
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-04-29 03:27:21.626119
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 407, true);


--
-- Name: communication_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.communication_types_id_seq', 8, true);


--
-- Name: insurance_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.insurance_types_id_seq', 5, true);


--
-- Name: lead_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lead_statuses_id_seq', 5, true);


--
-- Name: pipeline_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pipeline_statuses_id_seq', 10, true);


--
-- Name: pipelines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pipelines_id_seq', 2, true);


--
-- Name: schema_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schema_versions_id_seq', 1, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: ai_interactions ai_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_interactions
    ADD CONSTRAINT ai_interactions_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: leads_contact_info clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_contact_info
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey1 PRIMARY KEY (id);


--
-- Name: code_redemptions code_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.code_redemptions
    ADD CONSTRAINT code_redemptions_pkey PRIMARY KEY (id);


--
-- Name: communication_types communication_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_types
    ADD CONSTRAINT communication_types_name_key UNIQUE (name);


--
-- Name: communication_types communication_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_types
    ADD CONSTRAINT communication_types_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: developer_notes developer_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developer_notes
    ADD CONSTRAINT developer_notes_pkey PRIMARY KEY (id);


--
-- Name: discount_codes discount_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_code_key UNIQUE (code);


--
-- Name: discount_codes discount_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);


--
-- Name: homes homes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.homes
    ADD CONSTRAINT homes_pkey PRIMARY KEY (id);


--
-- Name: insurance_types insurance_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_types
    ADD CONSTRAINT insurance_types_name_key UNIQUE (name);


--
-- Name: insurance_types insurance_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_types
    ADD CONSTRAINT insurance_types_pkey PRIMARY KEY (id);


--
-- Name: invite_codes invite_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_code_key UNIQUE (code);


--
-- Name: invite_codes invite_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_pkey PRIMARY KEY (id);


--
-- Name: lead_communications lead_communications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_communications
    ADD CONSTRAINT lead_communications_pkey PRIMARY KEY (id);


--
-- Name: lead_marketing_settings lead_marketing_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_marketing_settings
    ADD CONSTRAINT lead_marketing_settings_pkey PRIMARY KEY (id);


--
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- Name: lead_statuses lead_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_statuses
    ADD CONSTRAINT lead_statuses_pkey PRIMARY KEY (id);


--
-- Name: lead_statuses lead_statuses_value_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_statuses
    ADD CONSTRAINT lead_statuses_value_key UNIQUE (value);


--
-- Name: leads_ins_info leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_ins_info
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: other_insureds other_insureds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_insureds
    ADD CONSTRAINT other_insureds_pkey PRIMARY KEY (id);


--
-- Name: pipeline_statuses pipeline_statuses_pipeline_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_statuses
    ADD CONSTRAINT pipeline_statuses_pipeline_id_name_key UNIQUE (pipeline_id, name);


--
-- Name: pipeline_statuses pipeline_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_statuses
    ADD CONSTRAINT pipeline_statuses_pkey PRIMARY KEY (id);


--
-- Name: pipelines pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);


--
-- Name: ringcentral_tokens ringcentral_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ringcentral_tokens
    ADD CONSTRAINT ringcentral_tokens_pkey PRIMARY KEY (id);


--
-- Name: ringcentral_tokens ringcentral_tokens_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ringcentral_tokens
    ADD CONSTRAINT ringcentral_tokens_user_id_key UNIQUE (user_id);


--
-- Name: ringcentral_tokens ringcentral_tokens_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ringcentral_tokens
    ADD CONSTRAINT ringcentral_tokens_user_id_unique UNIQUE (user_id);


--
-- Name: CONSTRAINT ringcentral_tokens_user_id_unique ON ringcentral_tokens; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT ringcentral_tokens_user_id_unique ON public.ringcentral_tokens IS 'Ensures each user_id is unique, allowing only one set of RingCentral tokens per user.';


--
-- Name: schema_versions schema_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_versions
    ADD CONSTRAINT schema_versions_pkey PRIMARY KEY (id);


--
-- Name: schema_versions schema_versions_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_versions
    ADD CONSTRAINT schema_versions_version_key UNIQUE (version);


--
-- Name: specialty_items specialty_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialty_items
    ADD CONSTRAINT specialty_items_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_24 messages_2025_05_24_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_05_24
    ADD CONSTRAINT messages_2025_05_24_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_25 messages_2025_05_25_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_05_25
    ADD CONSTRAINT messages_2025_05_25_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_26 messages_2025_05_26_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_05_26
    ADD CONSTRAINT messages_2025_05_26_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_27 messages_2025_05_27_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_05_27
    ADD CONSTRAINT messages_2025_05_27_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_28 messages_2025_05_28_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_05_28
    ADD CONSTRAINT messages_2025_05_28_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_29 messages_2025_05_29_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_05_29
    ADD CONSTRAINT messages_2025_05_29_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_30 messages_2025_05_30_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_05_30
    ADD CONSTRAINT messages_2025_05_30_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: addresses_zip_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX addresses_zip_idx ON public.addresses USING btree (zip_code);


--
-- Name: ai_interactions_client_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_interactions_client_id_idx ON public.ai_interactions USING btree (leads_contact_info_id);


--
-- Name: ai_interactions_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_interactions_created_at_idx ON public.ai_interactions USING btree (created_at);


--
-- Name: ai_interactions_lead_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_interactions_lead_id_idx ON public.ai_interactions USING btree (lead_id);


--
-- Name: ai_interactions_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ai_interactions_type_idx ON public.ai_interactions USING btree (type);


--
-- Name: campaigns_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX campaigns_name_idx ON public.campaigns USING btree (name);


--
-- Name: clients_ai_risk_score_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_ai_risk_score_idx ON public.leads_contact_info USING btree (ai_risk_score);


--
-- Name: clients_converted_from_lead_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_converted_from_lead_id_idx ON public.leads_contact_info USING btree (converted_from_lead_id);


--
-- Name: clients_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_email_idx ON public.leads_contact_info USING btree (email);


--
-- Name: clients_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_name_idx ON public.leads_contact_info USING btree (name);


--
-- Name: clients_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_phone_idx ON public.leads_contact_info USING btree (phone_number);


--
-- Name: clients_tags_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_tags_idx ON public.leads_contact_info USING gin (tags);


--
-- Name: clients_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_type_idx ON public.leads_contact_info USING btree (lead_type);


--
-- Name: contacts_ai_relationship_strength_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX contacts_ai_relationship_strength_idx ON public.contacts USING btree (ai_relationship_strength);


--
-- Name: contacts_client_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX contacts_client_id_idx ON public.contacts USING btree (leads_contact_info_id);


--
-- Name: contacts_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX contacts_name_idx ON public.contacts USING btree (first_name, last_name);


--
-- Name: contacts_primary_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX contacts_primary_idx ON public.contacts USING btree (leads_contact_info_id, is_primary_contact);


--
-- Name: developer_notes_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX developer_notes_category_idx ON public.developer_notes USING btree (category);


--
-- Name: developer_notes_created_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX developer_notes_created_by_idx ON public.developer_notes USING btree (created_by);


--
-- Name: developer_notes_related_feature_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX developer_notes_related_feature_idx ON public.developer_notes USING btree (related_feature);


--
-- Name: developer_notes_related_table_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX developer_notes_related_table_idx ON public.developer_notes USING btree (related_table);


--
-- Name: developer_notes_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX developer_notes_status_idx ON public.developer_notes USING btree (status);


--
-- Name: developer_notes_tags_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX developer_notes_tags_idx ON public.developer_notes USING gin (tags);


--
-- Name: discount_codes_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX discount_codes_code_idx ON public.discount_codes USING btree (code);


--
-- Name: homes_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX homes_user_id_idx ON public.homes USING btree (user_id);


--
-- Name: idx_leads_pipeline_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_pipeline_id ON public.leads_ins_info USING btree (pipeline_id);


--
-- Name: idx_pipeline_statuses_pipeline_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pipeline_statuses_pipeline_id ON public.pipeline_statuses USING btree (pipeline_id);


--
-- Name: invite_codes_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invite_codes_code_idx ON public.invite_codes USING btree (code);


--
-- Name: lead_communications_contact_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lead_communications_contact_id_idx ON public.lead_communications USING btree (contact_id);


--
-- Name: lead_communications_follow_up_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lead_communications_follow_up_at_idx ON public.lead_communications USING btree (follow_up_at);


--
-- Name: lead_communications_lead_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lead_communications_lead_id_idx ON public.lead_communications USING btree (lead_id);


--
-- Name: lead_marketing_settings_lead_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lead_marketing_settings_lead_id_idx ON public.lead_marketing_settings USING btree (lead_id);


--
-- Name: lead_notes_is_pinned_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lead_notes_is_pinned_idx ON public.lead_notes USING btree (is_pinned);


--
-- Name: lead_notes_lead_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lead_notes_lead_id_idx ON public.lead_notes USING btree (lead_id);


--
-- Name: leads_additional_insureds_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_additional_insureds_idx ON public.leads_ins_info USING gin (additional_insureds);


--
-- Name: leads_additional_locations_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_additional_locations_idx ON public.leads_ins_info USING gin (additional_locations);


--
-- Name: leads_address_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_address_id_idx ON public.leads_ins_info USING btree (address_id);


--
-- Name: leads_ai_follow_up_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_ai_follow_up_priority_idx ON public.leads_ins_info USING btree (ai_follow_up_priority);


--
-- Name: leads_assigned_to_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_assigned_to_idx ON public.leads_ins_info USING btree (assigned_to);


--
-- Name: leads_auto_data_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_auto_data_idx ON public.leads_ins_info USING gin (auto_data);


--
-- Name: leads_client_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_client_id_idx ON public.leads_ins_info USING btree (leads_contact_info_id);


--
-- Name: leads_commercial_data_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_commercial_data_idx ON public.leads_ins_info USING gin (commercial_data);


--
-- Name: leads_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_email_idx ON public.leads_ins_info USING btree (email);


--
-- Name: leads_first_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_first_name_idx ON public.leads_ins_info USING btree (first_name);


--
-- Name: leads_home_data_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_home_data_idx ON public.leads_ins_info USING gin (home_data);


--
-- Name: leads_insurance_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_insurance_type_idx ON public.leads_ins_info USING btree (insurance_type_id);


--
-- Name: leads_last_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_last_name_idx ON public.leads_ins_info USING btree (last_name);


--
-- Name: leads_mailing_address_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_mailing_address_id_idx ON public.leads_ins_info USING btree (mailing_address_id);


--
-- Name: leads_next_contact_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_next_contact_at_idx ON public.leads_ins_info USING btree (next_contact_at);


--
-- Name: leads_phone_number_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_phone_number_idx ON public.leads_ins_info USING btree (phone_number);


--
-- Name: leads_specialty_data_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_specialty_data_idx ON public.leads_ins_info USING gin (specialty_data);


--
-- Name: leads_status_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_status_id_idx ON public.leads_ins_info USING btree (status_id);


--
-- Name: leads_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_status_idx ON public.leads_ins_info USING btree (status_id);


--
-- Name: leads_tags_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leads_tags_idx ON public.leads_ins_info USING gin (tags);


--
-- Name: opportunities_ai_win_probability_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX opportunities_ai_win_probability_idx ON public.opportunities USING btree (ai_win_probability);


--
-- Name: opportunities_lead_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX opportunities_lead_id_idx ON public.opportunities USING btree (lead_id);


--
-- Name: other_insureds_lead_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX other_insureds_lead_id_idx ON public.other_insureds USING btree (lead_id);


--
-- Name: other_insureds_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX other_insureds_user_id_idx ON public.other_insureds USING btree (user_id);


--
-- Name: pipeline_statuses_pipeline_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pipeline_statuses_pipeline_id_idx ON public.pipeline_statuses USING btree (pipeline_id);


--
-- Name: ringcentral_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ringcentral_tokens_user_id_idx ON public.ringcentral_tokens USING btree (user_id);


--
-- Name: specialty_items_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX specialty_items_user_id_idx ON public.specialty_items USING btree (user_id);


--
-- Name: support_tickets_assigned_to_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX support_tickets_assigned_to_idx ON public.support_tickets USING btree (assigned_to);


--
-- Name: support_tickets_client_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX support_tickets_client_id_idx ON public.support_tickets USING btree (leads_contact_info_id);


--
-- Name: support_tickets_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX support_tickets_created_at_idx ON public.support_tickets USING btree (created_at);


--
-- Name: support_tickets_lead_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX support_tickets_lead_id_idx ON public.support_tickets USING btree (lead_id);


--
-- Name: support_tickets_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX support_tickets_status_idx ON public.support_tickets USING btree (status);


--
-- Name: user_roles_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_roles_user_id_idx ON public.user_roles USING btree (user_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: vehicles_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX vehicles_user_id_idx ON public.vehicles USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: messages_2025_05_24_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_24_pkey;


--
-- Name: messages_2025_05_25_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_25_pkey;


--
-- Name: messages_2025_05_26_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_26_pkey;


--
-- Name: messages_2025_05_27_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_27_pkey;


--
-- Name: messages_2025_05_28_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_28_pkey;


--
-- Name: messages_2025_05_29_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_29_pkey;


--
-- Name: messages_2025_05_30_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_30_pkey;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: ringcentral_tokens update_ringcentral_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ringcentral_tokens_updated_at BEFORE UPDATE ON public.ringcentral_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: ai_interactions ai_interactions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_interactions
    ADD CONSTRAINT ai_interactions_client_id_fkey FOREIGN KEY (leads_contact_info_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;


--
-- Name: ai_interactions ai_interactions_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_interactions
    ADD CONSTRAINT ai_interactions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: leads_contact_info clients_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_contact_info
    ADD CONSTRAINT clients_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id);


--
-- Name: leads_contact_info clients_mailing_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_contact_info
    ADD CONSTRAINT clients_mailing_address_id_fkey FOREIGN KEY (mailing_address_id) REFERENCES public.addresses(id);


--
-- Name: code_redemptions code_redemptions_discount_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.code_redemptions
    ADD CONSTRAINT code_redemptions_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id);


--
-- Name: code_redemptions code_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.code_redemptions
    ADD CONSTRAINT code_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: contacts contacts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_client_id_fkey FOREIGN KEY (leads_contact_info_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;


--
-- Name: discount_codes discount_codes_specific_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_specific_user_id_fkey FOREIGN KEY (specific_user_id) REFERENCES auth.users(id);


--
-- Name: homes homes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.homes
    ADD CONSTRAINT homes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: homes homes_leads_contact_info_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.homes
    ADD CONSTRAINT homes_leads_contact_info_id_fkey FOREIGN KEY (leads_contact_info_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;


--
-- Name: homes homes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.homes
    ADD CONSTRAINT homes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invite_codes invite_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: lead_communications lead_communications_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_communications
    ADD CONSTRAINT lead_communications_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: lead_communications lead_communications_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_communications
    ADD CONSTRAINT lead_communications_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: lead_communications lead_communications_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_communications
    ADD CONSTRAINT lead_communications_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.communication_types(id);


--
-- Name: lead_marketing_settings lead_marketing_settings_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_marketing_settings
    ADD CONSTRAINT lead_marketing_settings_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: lead_marketing_settings lead_marketing_settings_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_marketing_settings
    ADD CONSTRAINT lead_marketing_settings_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: lead_notes lead_notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: leads_ins_info leads_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_ins_info
    ADD CONSTRAINT leads_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id);


--
-- Name: leads_contact_info leads_contact_info_converted_from_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_contact_info
    ADD CONSTRAINT leads_contact_info_converted_from_lead_id_fkey FOREIGN KEY (converted_from_lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: leads_ins_info leads_ins_info_leads_contact_info_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_ins_info
    ADD CONSTRAINT leads_ins_info_leads_contact_info_id_fkey FOREIGN KEY (leads_contact_info_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;


--
-- Name: leads_ins_info leads_insurance_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_ins_info
    ADD CONSTRAINT leads_insurance_type_id_fkey FOREIGN KEY (insurance_type_id) REFERENCES public.insurance_types(id);


--
-- Name: leads_ins_info leads_mailing_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_ins_info
    ADD CONSTRAINT leads_mailing_address_id_fkey FOREIGN KEY (mailing_address_id) REFERENCES public.addresses(id);


--
-- Name: leads_ins_info leads_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_ins_info
    ADD CONSTRAINT leads_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id);


--
-- Name: leads_ins_info leads_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_ins_info
    ADD CONSTRAINT leads_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.lead_statuses(id);


--
-- Name: opportunities opportunities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: other_insureds other_insureds_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_insureds
    ADD CONSTRAINT other_insureds_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;


--
-- Name: other_insureds other_insureds_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_insureds
    ADD CONSTRAINT other_insureds_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: other_insureds other_insureds_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_insureds
    ADD CONSTRAINT other_insureds_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pipeline_statuses pipeline_statuses_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_statuses
    ADD CONSTRAINT pipeline_statuses_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: ringcentral_tokens ringcentral_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ringcentral_tokens
    ADD CONSTRAINT ringcentral_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: specialty_items specialty_items_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialty_items
    ADD CONSTRAINT specialty_items_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: specialty_items specialty_items_leads_contact_info_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialty_items
    ADD CONSTRAINT specialty_items_leads_contact_info_id_fkey FOREIGN KEY (leads_contact_info_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;


--
-- Name: specialty_items specialty_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialty_items
    ADD CONSTRAINT specialty_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_client_id_fkey FOREIGN KEY (leads_contact_info_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_leads_contact_info_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_leads_contact_info_id_fkey FOREIGN KEY (leads_contact_info_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles Admins can view all user roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT USING (((auth.uid() IN ( SELECT user_roles_1.user_id
   FROM public.user_roles user_roles_1
  WHERE (user_roles_1.role = 'admin'::text))) OR (auth.uid() = user_id)));


--
-- Name: invite_codes Anyone can check if a specific code is valid; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can check if a specific code is valid" ON public.invite_codes FOR SELECT USING (((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now())) AND (current_uses < max_uses)));


--
-- Name: developer_notes Authenticated users can create developer notes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create developer notes" ON public.developer_notes FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: invite_codes Authenticated users can create invite codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create invite codes" ON public.invite_codes FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: invite_codes Authenticated users can view invite codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can view invite codes" ON public.invite_codes FOR SELECT TO authenticated USING (true);


--
-- Name: developer_notes Everyone can view developer notes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Everyone can view developer notes" ON public.developer_notes FOR SELECT USING (true);


--
-- Name: user_roles Only admins can create user roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Only admins can create user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((auth.uid() IN ( SELECT user_roles_1.user_id
   FROM public.user_roles user_roles_1
  WHERE (user_roles_1.role = 'admin'::text))));


--
-- Name: user_roles Only admins can update user roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Only admins can update user roles" ON public.user_roles FOR UPDATE USING ((auth.uid() IN ( SELECT user_roles_1.user_id
   FROM public.user_roles user_roles_1
  WHERE (user_roles_1.role = 'admin'::text))));


--
-- Name: ringcentral_tokens Users can delete their own tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own tokens" ON public.ringcentral_tokens FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ringcentral_tokens Users can insert their own tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own tokens" ON public.ringcentral_tokens FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: homes Users can only access their own homes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can only access their own homes" ON public.homes USING ((auth.uid() = user_id));


--
-- Name: other_insureds Users can only access their own other insureds; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can only access their own other insureds" ON public.other_insureds USING ((auth.uid() = user_id));


--
-- Name: specialty_items Users can only access their own specialty items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can only access their own specialty items" ON public.specialty_items USING ((auth.uid() = user_id));


--
-- Name: vehicles Users can only access their own vehicles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can only access their own vehicles" ON public.vehicles USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can update their assigned support tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their assigned support tickets" ON public.support_tickets FOR UPDATE USING ((((auth.uid())::text = assigned_to) OR (assigned_to IS NULL)));


--
-- Name: developer_notes Users can update their own developer notes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own developer notes" ON public.developer_notes FOR UPDATE USING ((((auth.uid())::text = created_by) OR ((auth.uid())::text = assigned_to)));


--
-- Name: invite_codes Users can update their own invite codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own invite codes" ON public.invite_codes FOR UPDATE USING ((auth.uid() = created_by));


--
-- Name: users Users can update their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: ringcentral_tokens Users can update their own tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own tokens" ON public.ringcentral_tokens FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ai_interactions Users can view all AI interactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all AI interactions" ON public.ai_interactions FOR SELECT USING (true);


--
-- Name: support_tickets Users can view their assigned support tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their assigned support tickets" ON public.support_tickets FOR SELECT USING ((((auth.uid())::text = assigned_to) OR ((auth.uid())::text = created_by) OR (assigned_to IS NULL)));


--
-- Name: users Users can view their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: ringcentral_tokens Users can view their own tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own tokens" ON public.ringcentral_tokens FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_interactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: developer_notes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.developer_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: homes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;

--
-- Name: invite_codes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: other_insureds; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.other_insureds ENABLE ROW LEVEL SECURITY;

--
-- Name: ringcentral_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ringcentral_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: specialty_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.specialty_items ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime_messages_publication OWNER TO supabase_admin;

--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT ALL ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT ALL ON SCHEMA storage TO postgres;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION halfvec_in(cstring, oid, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_in(cstring, oid, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_out(extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_out(extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_recv(internal, oid, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_recv(internal, oid, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_send(extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_send(extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_typmod_in(cstring[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_typmod_in(cstring[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_in(cstring, oid, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_in(cstring, oid, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_out(extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_out(extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_recv(internal, oid, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_recv(internal, oid, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_send(extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_send(extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_typmod_in(cstring[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_typmod_in(cstring[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_in(cstring, oid, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_in(cstring, oid, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_out(extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_out(extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_recv(internal, oid, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_recv(internal, oid, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_send(extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_send(extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_typmod_in(cstring[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_typmod_in(cstring[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gtrgm_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO service_role;


--
-- Name: FUNCTION gtrgm_out(public.gtrgm); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO service_role;


--
-- Name: FUNCTION array_to_halfvec(real[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_halfvec(real[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_sparsevec(real[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_sparsevec(real[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_vector(real[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_vector(real[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_halfvec(double precision[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_halfvec(double precision[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_sparsevec(double precision[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_sparsevec(double precision[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_vector(double precision[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_vector(double precision[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_halfvec(integer[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_halfvec(integer[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_sparsevec(integer[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_sparsevec(integer[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_vector(integer[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_vector(integer[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_halfvec(numeric[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_halfvec(numeric[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_sparsevec(numeric[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_sparsevec(numeric[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION array_to_vector(numeric[], integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.array_to_vector(numeric[], integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_to_float4(extensions.halfvec, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_to_float4(extensions.halfvec, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec(extensions.halfvec, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec(extensions.halfvec, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_to_sparsevec(extensions.halfvec, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_to_sparsevec(extensions.halfvec, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_to_vector(extensions.halfvec, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_to_vector(extensions.halfvec, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_to_halfvec(extensions.sparsevec, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_to_halfvec(extensions.sparsevec, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec(extensions.sparsevec, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec(extensions.sparsevec, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_to_vector(extensions.sparsevec, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_to_vector(extensions.sparsevec, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_to_float4(extensions.vector, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_to_float4(extensions.vector, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_to_halfvec(extensions.vector, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_to_halfvec(extensions.vector, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_to_sparsevec(extensions.vector, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_to_sparsevec(extensions.vector, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector(extensions.vector, integer, boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector(extensions.vector, integer, boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION algorithm_sign(signables text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) FROM postgres;
GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION binary_quantize(extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.binary_quantize(extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION binary_quantize(extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.binary_quantize(extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION cosine_distance(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.cosine_distance(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION cosine_distance(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.cosine_distance(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION cosine_distance(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.cosine_distance(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION halfvec_accum(double precision[], extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_accum(double precision[], extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_add(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_add(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_avg(double precision[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_avg(double precision[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_cmp(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_cmp(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_combine(double precision[], double precision[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_combine(double precision[], double precision[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_concat(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_concat(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_eq(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_eq(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_ge(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_ge(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_gt(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_gt(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_l2_squared_distance(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_l2_squared_distance(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_le(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_le(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_lt(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_lt(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_mul(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_mul(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_ne(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_ne(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_negative_inner_product(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_negative_inner_product(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_spherical_distance(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_spherical_distance(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION halfvec_sub(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.halfvec_sub(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hamming_distance(bit, bit); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hamming_distance(bit, bit) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION hnsw_bit_support(internal); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hnsw_bit_support(internal) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hnsw_halfvec_support(internal); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hnsw_halfvec_support(internal) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hnsw_sparsevec_support(internal); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hnsw_sparsevec_support(internal) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hnswhandler(internal); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hnswhandler(internal) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION inner_product(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.inner_product(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION inner_product(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.inner_product(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION inner_product(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.inner_product(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION ivfflat_bit_support(internal); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.ivfflat_bit_support(internal) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION ivfflat_halfvec_support(internal); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.ivfflat_halfvec_support(internal) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION ivfflathandler(internal); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.ivfflathandler(internal) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION jaccard_distance(bit, bit); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.jaccard_distance(bit, bit) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l1_distance(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l1_distance(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l1_distance(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l1_distance(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l1_distance(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l1_distance(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l2_distance(extensions.halfvec, extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l2_distance(extensions.halfvec, extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l2_distance(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l2_distance(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l2_distance(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l2_distance(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l2_norm(extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l2_norm(extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l2_norm(extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l2_norm(extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l2_normalize(extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l2_normalize(extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l2_normalize(extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l2_normalize(extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION l2_normalize(extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.l2_normalize(extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sign(payload json, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) FROM postgres;
GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO dashboard_user;


--
-- Name: FUNCTION sparsevec_cmp(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_cmp(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_eq(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_eq(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_ge(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_ge(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_gt(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_gt(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_l2_squared_distance(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_l2_squared_distance(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_le(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_le(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_lt(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_lt(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_ne(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_ne(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sparsevec_negative_inner_product(extensions.sparsevec, extensions.sparsevec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sparsevec_negative_inner_product(extensions.sparsevec, extensions.sparsevec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION subvector(extensions.halfvec, integer, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.subvector(extensions.halfvec, integer, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION subvector(extensions.vector, integer, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.subvector(extensions.vector, integer, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION try_cast_double(inp text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.try_cast_double(inp text) FROM postgres;
GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO dashboard_user;


--
-- Name: FUNCTION url_decode(data text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.url_decode(data text) FROM postgres;
GRANT ALL ON FUNCTION extensions.url_decode(data text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.url_decode(data text) TO dashboard_user;


--
-- Name: FUNCTION url_encode(data bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.url_encode(data bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION vector_accum(double precision[], extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_accum(double precision[], extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_add(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_add(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_avg(double precision[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_avg(double precision[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_cmp(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_cmp(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_combine(double precision[], double precision[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_combine(double precision[], double precision[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_concat(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_concat(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_dims(extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_dims(extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_dims(extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_dims(extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_eq(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_eq(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_ge(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_ge(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_gt(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_gt(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_l2_squared_distance(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_l2_squared_distance(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_le(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_le(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_lt(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_lt(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_mul(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_mul(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_ne(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_ne(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_negative_inner_product(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_negative_inner_product(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_norm(extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_norm(extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_spherical_distance(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_spherical_distance(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION vector_sub(extensions.vector, extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.vector_sub(extensions.vector, extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION verify(token text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) FROM postgres;
GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO postgres;


--
-- Name: FUNCTION exec_sql(query text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.exec_sql(query text) TO anon;
GRANT ALL ON FUNCTION public.exec_sql(query text) TO authenticated;
GRANT ALL ON FUNCTION public.exec_sql(query text) TO service_role;


--
-- Name: FUNCTION get_lead_with_details(lead_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_lead_with_details(lead_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_lead_with_details(lead_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_lead_with_details(lead_id uuid) TO service_role;


--
-- Name: FUNCTION gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gin_extract_value_trgm(text, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO service_role;


--
-- Name: FUNCTION gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_consistent(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_decompress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_distance(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_options(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_same(public.gtrgm, public.gtrgm, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION increment(row_id text, table_name text, column_name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment(row_id text, table_name text, column_name text) TO anon;
GRANT ALL ON FUNCTION public.increment(row_id text, table_name text, column_name text) TO authenticated;
GRANT ALL ON FUNCTION public.increment(row_id text, table_name text, column_name text) TO service_role;


--
-- Name: FUNCTION increment_code_usage(code_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_code_usage(code_id uuid) TO anon;
GRANT ALL ON FUNCTION public.increment_code_usage(code_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.increment_code_usage(code_id uuid) TO service_role;


--
-- Name: FUNCTION list_tables(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.list_tables() TO anon;
GRANT ALL ON FUNCTION public.list_tables() TO authenticated;
GRANT ALL ON FUNCTION public.list_tables() TO service_role;


--
-- Name: FUNCTION set_limit(real); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.set_limit(real) TO postgres;
GRANT ALL ON FUNCTION public.set_limit(real) TO anon;
GRANT ALL ON FUNCTION public.set_limit(real) TO authenticated;
GRANT ALL ON FUNCTION public.set_limit(real) TO service_role;


--
-- Name: FUNCTION show_limit(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_limit() TO postgres;
GRANT ALL ON FUNCTION public.show_limit() TO anon;
GRANT ALL ON FUNCTION public.show_limit() TO authenticated;
GRANT ALL ON FUNCTION public.show_limit() TO service_role;


--
-- Name: FUNCTION show_trgm(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_trgm(text) TO postgres;
GRANT ALL ON FUNCTION public.show_trgm(text) TO anon;
GRANT ALL ON FUNCTION public.show_trgm(text) TO authenticated;
GRANT ALL ON FUNCTION public.show_trgm(text) TO service_role;


--
-- Name: FUNCTION similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity(text, text) TO service_role;


--
-- Name: FUNCTION similarity_dist(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO service_role;


--
-- Name: FUNCTION similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: FUNCTION update_user_profile(user_id uuid, full_name text, avatar_url text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_user_profile(user_id uuid, full_name text, avatar_url text) TO anon;
GRANT ALL ON FUNCTION public.update_user_profile(user_id uuid, full_name text, avatar_url text) TO authenticated;
GRANT ALL ON FUNCTION public.update_user_profile(user_id uuid, full_name text, avatar_url text) TO service_role;


--
-- Name: FUNCTION word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION avg(extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.avg(extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION avg(extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.avg(extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sum(extensions.halfvec); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sum(extensions.halfvec) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sum(extensions.vector); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sum(extensions.vector) TO postgres WITH GRANT OPTION;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.schema_migrations TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.schema_migrations TO postgres;
GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE _version_info; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._version_info TO anon;
GRANT ALL ON TABLE public._version_info TO authenticated;
GRANT ALL ON TABLE public._version_info TO service_role;


--
-- Name: TABLE addresses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.addresses TO anon;
GRANT ALL ON TABLE public.addresses TO authenticated;
GRANT ALL ON TABLE public.addresses TO service_role;


--
-- Name: TABLE ai_interactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_interactions TO anon;
GRANT ALL ON TABLE public.ai_interactions TO authenticated;
GRANT ALL ON TABLE public.ai_interactions TO service_role;


--
-- Name: TABLE campaigns; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.campaigns TO anon;
GRANT ALL ON TABLE public.campaigns TO authenticated;
GRANT ALL ON TABLE public.campaigns TO service_role;


--
-- Name: TABLE clients; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.clients TO anon;
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;


--
-- Name: TABLE code_redemptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.code_redemptions TO anon;
GRANT ALL ON TABLE public.code_redemptions TO authenticated;
GRANT ALL ON TABLE public.code_redemptions TO service_role;


--
-- Name: TABLE communication_types; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.communication_types TO anon;
GRANT ALL ON TABLE public.communication_types TO authenticated;
GRANT ALL ON TABLE public.communication_types TO service_role;


--
-- Name: SEQUENCE communication_types_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.communication_types_id_seq TO anon;
GRANT ALL ON SEQUENCE public.communication_types_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.communication_types_id_seq TO service_role;


--
-- Name: TABLE contacts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contacts TO anon;
GRANT ALL ON TABLE public.contacts TO authenticated;
GRANT ALL ON TABLE public.contacts TO service_role;


--
-- Name: TABLE developer_notes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.developer_notes TO anon;
GRANT ALL ON TABLE public.developer_notes TO authenticated;
GRANT ALL ON TABLE public.developer_notes TO service_role;


--
-- Name: TABLE discount_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.discount_codes TO anon;
GRANT ALL ON TABLE public.discount_codes TO authenticated;
GRANT ALL ON TABLE public.discount_codes TO service_role;


--
-- Name: TABLE homes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.homes TO anon;
GRANT ALL ON TABLE public.homes TO authenticated;
GRANT ALL ON TABLE public.homes TO service_role;


--
-- Name: TABLE insurance_types; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.insurance_types TO anon;
GRANT ALL ON TABLE public.insurance_types TO authenticated;
GRANT ALL ON TABLE public.insurance_types TO service_role;


--
-- Name: SEQUENCE insurance_types_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.insurance_types_id_seq TO anon;
GRANT ALL ON SEQUENCE public.insurance_types_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.insurance_types_id_seq TO service_role;


--
-- Name: TABLE invite_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.invite_codes TO anon;
GRANT ALL ON TABLE public.invite_codes TO authenticated;
GRANT ALL ON TABLE public.invite_codes TO service_role;


--
-- Name: TABLE lead_communications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lead_communications TO anon;
GRANT ALL ON TABLE public.lead_communications TO authenticated;
GRANT ALL ON TABLE public.lead_communications TO service_role;


--
-- Name: TABLE lead_statuses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lead_statuses TO anon;
GRANT ALL ON TABLE public.lead_statuses TO authenticated;
GRANT ALL ON TABLE public.lead_statuses TO service_role;


--
-- Name: TABLE leads_contact_info; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.leads_contact_info TO anon;
GRANT ALL ON TABLE public.leads_contact_info TO authenticated;
GRANT ALL ON TABLE public.leads_contact_info TO service_role;


--
-- Name: TABLE leads_ins_info; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.leads_ins_info TO anon;
GRANT ALL ON TABLE public.leads_ins_info TO authenticated;
GRANT ALL ON TABLE public.leads_ins_info TO service_role;


--
-- Name: TABLE pipelines; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pipelines TO anon;
GRANT ALL ON TABLE public.pipelines TO authenticated;
GRANT ALL ON TABLE public.pipelines TO service_role;


--
-- Name: TABLE lead_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lead_details TO anon;
GRANT ALL ON TABLE public.lead_details TO authenticated;
GRANT ALL ON TABLE public.lead_details TO service_role;


--
-- Name: TABLE lead_marketing_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lead_marketing_settings TO anon;
GRANT ALL ON TABLE public.lead_marketing_settings TO authenticated;
GRANT ALL ON TABLE public.lead_marketing_settings TO service_role;


--
-- Name: TABLE lead_notes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lead_notes TO anon;
GRANT ALL ON TABLE public.lead_notes TO authenticated;
GRANT ALL ON TABLE public.lead_notes TO service_role;


--
-- Name: SEQUENCE lead_statuses_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.lead_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.lead_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.lead_statuses_id_seq TO service_role;


--
-- Name: TABLE leads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.leads TO anon;
GRANT ALL ON TABLE public.leads TO authenticated;
GRANT ALL ON TABLE public.leads TO service_role;


--
-- Name: TABLE opportunities; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.opportunities TO anon;
GRANT ALL ON TABLE public.opportunities TO authenticated;
GRANT ALL ON TABLE public.opportunities TO service_role;


--
-- Name: TABLE other_insureds; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.other_insureds TO anon;
GRANT ALL ON TABLE public.other_insureds TO authenticated;
GRANT ALL ON TABLE public.other_insureds TO service_role;


--
-- Name: TABLE pipeline_statuses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pipeline_statuses TO anon;
GRANT ALL ON TABLE public.pipeline_statuses TO authenticated;
GRANT ALL ON TABLE public.pipeline_statuses TO service_role;


--
-- Name: SEQUENCE pipeline_statuses_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.pipeline_statuses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.pipeline_statuses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.pipeline_statuses_id_seq TO service_role;


--
-- Name: SEQUENCE pipelines_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.pipelines_id_seq TO anon;
GRANT ALL ON SEQUENCE public.pipelines_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.pipelines_id_seq TO service_role;


--
-- Name: TABLE ringcentral_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ringcentral_tokens TO anon;
GRANT ALL ON TABLE public.ringcentral_tokens TO authenticated;
GRANT ALL ON TABLE public.ringcentral_tokens TO service_role;


--
-- Name: TABLE ringcentral_tokens_backup; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ringcentral_tokens_backup TO anon;
GRANT ALL ON TABLE public.ringcentral_tokens_backup TO authenticated;
GRANT ALL ON TABLE public.ringcentral_tokens_backup TO service_role;


--
-- Name: TABLE schema_versions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.schema_versions TO anon;
GRANT ALL ON TABLE public.schema_versions TO authenticated;
GRANT ALL ON TABLE public.schema_versions TO service_role;


--
-- Name: SEQUENCE schema_versions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.schema_versions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.schema_versions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.schema_versions_id_seq TO service_role;


--
-- Name: TABLE specialty_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.specialty_items TO anon;
GRANT ALL ON TABLE public.specialty_items TO authenticated;
GRANT ALL ON TABLE public.specialty_items TO service_role;


--
-- Name: TABLE support_tickets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_tickets TO anon;
GRANT ALL ON TABLE public.support_tickets TO authenticated;
GRANT ALL ON TABLE public.support_tickets TO service_role;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_profiles TO anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;


--
-- Name: TABLE vehicles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.vehicles TO anon;
GRANT ALL ON TABLE public.vehicles TO authenticated;
GRANT ALL ON TABLE public.vehicles TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE messages_2025_05_24; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_05_24 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_05_24 TO dashboard_user;


--
-- Name: TABLE messages_2025_05_25; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_05_25 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_05_25 TO dashboard_user;


--
-- Name: TABLE messages_2025_05_26; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_05_26 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_05_26 TO dashboard_user;


--
-- Name: TABLE messages_2025_05_27; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_05_27 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_05_27 TO dashboard_user;


--
-- Name: TABLE messages_2025_05_28; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_05_28 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_05_28 TO dashboard_user;


--
-- Name: TABLE messages_2025_05_29; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_05_29 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_05_29 TO dashboard_user;


--
-- Name: TABLE messages_2025_05_30; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_05_30 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_05_30 TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres;


--
-- Name: TABLE migrations; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.migrations TO anon;
GRANT ALL ON TABLE storage.migrations TO authenticated;
GRANT ALL ON TABLE storage.migrations TO service_role;
GRANT ALL ON TABLE storage.migrations TO postgres;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO postgres;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

