-- Function to list all tables in the public schema
-- This avoids the issue with accessing information_schema directly

CREATE OR REPLACE FUNCTION list_tables()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  RETURN table_names;
END;
$$;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION list_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION list_tables() TO anon;
GRANT EXECUTE ON FUNCTION list_tables() TO service_role;

-- Add a comment to the function
COMMENT ON FUNCTION list_tables() IS 'Returns an array of all table names in the public schema'; -- Create a simple view to get database version
CREATE OR REPLACE VIEW _version_info AS
SELECT version() as version;

-- Grant access to the view
GRANT SELECT ON _version_info TO authenticated;
GRANT SELECT ON _version_info TO anon;
GRANT SELECT ON _version_info TO service_role;

-- Create a simple function to test connection
CREATE OR REPLACE FUNCTION test_connection()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION test_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION test_connection() TO anon;
GRANT EXECUTE ON FUNCTION test_connection() TO service_role;
-- Create missing tables mentioned in the error logs

-- Check if ringcentral_tokens table exists, create if not
CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for ringcentral_tokens
DROP POLICY IF EXISTS "Users can only access their own tokens" ON ringcentral_tokens;
CREATE POLICY "Users can only access their own tokens"
ON ringcentral_tokens
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on ringcentral_tokens
ALTER TABLE ringcentral_tokens ENABLE ROW LEVEL SECURITY;

-- Check if specialty_items table exists, create if not
CREATE TABLE IF NOT EXISTS specialty_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  value NUMERIC,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for specialty_items
DROP POLICY IF EXISTS "Users can only access their own specialty items" ON specialty_items;
CREATE POLICY "Users can only access their own specialty items"
ON specialty_items
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on specialty_items
ALTER TABLE specialty_items ENABLE ROW LEVEL SECURITY;

-- Check if other_insureds table exists, create if not
CREATE TABLE IF NOT EXISTS other_insureds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth DATE,
  gender TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for other_insureds
DROP POLICY IF EXISTS "Users can only access their own other insureds" ON other_insureds;
CREATE POLICY "Users can only access their own other insureds"
ON other_insureds
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on other_insureds
ALTER TABLE other_insureds ENABLE ROW LEVEL SECURITY;

-- Check if vehicles table exists, create if not
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  state TEXT,
  primary_use TEXT,
  annual_mileage INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for vehicles
DROP POLICY IF EXISTS "Users can only access their own vehicles" ON vehicles;
CREATE POLICY "Users can only access their own vehicles"
ON vehicles
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Check if homes table exists, create if not
CREATE TABLE IF NOT EXISTS homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  year_built INTEGER,
  square_feet INTEGER,
  construction_type TEXT,
  roof_type TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for homes
DROP POLICY IF EXISTS "Users can only access their own homes" ON homes;
CREATE POLICY "Users can only access their own homes"
ON homes
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on homes
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;

-- Grant access to all tables for authenticated users
GRANT ALL ON ringcentral_tokens TO authenticated;
GRANT ALL ON specialty_items TO authenticated;
GRANT ALL ON other_insureds TO authenticated;
GRANT ALL ON vehicles TO authenticated;
GRANT ALL ON homes TO authenticated;

-- Grant select access to anon users (for public data if needed)
GRANT SELECT ON ringcentral_tokens TO anon;
GRANT SELECT ON specialty_items TO anon;
GRANT SELECT ON other_insureds TO anon;
GRANT SELECT ON vehicles TO anon;
GRANT SELECT ON homes TO anon;
-- Create RingCentral tokens table
CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS ringcentral_tokens_user_id_idx ON ringcentral_tokens(user_id);

-- Add RLS policies
ALTER TABLE ringcentral_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view their own tokens" 
  ON ringcentral_tokens FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own tokens
CREATE POLICY "Users can insert their own tokens" 
  ON ringcentral_tokens FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tokens
CREATE POLICY "Users can update their own tokens" 
  ON ringcentral_tokens FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own tokens
CREATE POLICY "Users can delete their own tokens" 
  ON ringcentral_tokens FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_ringcentral_tokens_updated_at
BEFORE UPDATE ON ringcentral_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- Create a simple view to get database version
CREATE OR REPLACE VIEW _version_info AS
SELECT version() as version;

-- Grant access to the view
GRANT SELECT ON _version_info TO authenticated;
GRANT SELECT ON _version_info TO anon;
GRANT SELECT ON _version_info TO service_role;

-- Create a function to execute SQL statements (for admin operations)
-- This requires security definer for proper execution rights
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Uses the privileges of the function creator
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Add a comment to the function
COMMENT ON FUNCTION exec_sql(text) IS 'Executes arbitrary SQL. USE WITH CAUTION. Only available to authenticated users.';

-- Note: This should be run by a database admin user since it requires elevated privileges.
-- In production, consider implementing more restricted versions of this function.

-- Update the list_tables function to handle the case when schema doesn't exist
CREATE OR REPLACE FUNCTION list_tables()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permission to users
GRANT EXECUTE ON FUNCTION list_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION list_tables() TO anon;
GRANT EXECUTE ON FUNCTION list_tables() TO service_role; -- Function to get database information
CREATE OR REPLACE FUNCTION get_database_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Get database version
  WITH version_info AS (
    SELECT version() as version
  ),
  
  -- Get table counts
  table_counts AS (
    SELECT count(*) as table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
  ),
  
  -- Get row counts for each table
  row_counts AS (
    SELECT 
      table_name,
      (SELECT count(*) FROM "public"."" || table_name || "") as row_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
  ),
  
  -- Get schema information
  schema_info AS (
    SELECT 
      table_schema,
      count(*) as schema_table_count
    FROM information_schema.tables
    GROUP BY table_schema
  )
  
  -- Combine all information
  SELECT 
    jsonb_build_object(
      'version', (SELECT version FROM version_info),
      'table_count', (SELECT table_count FROM table_counts),
      'schemas', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', table_schema,
            'table_count', schema_table_count
          )
        )
        FROM schema_info
      ),
      'tables', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', table_name,
            'row_count', row_count
          )
        )
        FROM row_counts
      )
    ) INTO result;
    
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_database_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_info() TO anon;
GRANT EXECUTE ON FUNCTION get_database_info() TO service_role;

-- Comment on function
COMMENT ON FUNCTION get_database_info() IS 'Returns information about the database, including version, table counts, and schema information';
-- Direct SQL to create missing tables
-- Run this script directly in the Supabase SQL editor

-- Create specialty_items table
CREATE TABLE IF NOT EXISTS specialty_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  value NUMERIC,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for specialty_items
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can only access their own specialty items" ON specialty_items;
  
  CREATE POLICY "Users can only access their own specialty items"
  ON specialty_items
  FOR ALL
  USING (auth.uid() = user_id);
  
  -- Enable RLS
  ALTER TABLE specialty_items ENABLE ROW LEVEL SECURITY;
END
$$;

-- Create other_insureds table
CREATE TABLE IF NOT EXISTS other_insureds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth DATE,
  gender TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for other_insureds
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can only access their own other insureds" ON other_insureds;
  
  CREATE POLICY "Users can only access their own other insureds"
  ON other_insureds
  FOR ALL
  USING (auth.uid() = user_id);
  
  -- Enable RLS
  ALTER TABLE other_insureds ENABLE ROW LEVEL SECURITY;
END
$$;

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  state TEXT,
  primary_use TEXT,
  annual_mileage INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for vehicles
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can only access their own vehicles" ON vehicles;
  
  CREATE POLICY "Users can only access their own vehicles"
  ON vehicles
  FOR ALL
  USING (auth.uid() = user_id);
  
  -- Enable RLS
  ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
END
$$;

-- Create homes table
CREATE TABLE IF NOT EXISTS homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  year_built INTEGER,
  square_feet INTEGER,
  construction_type TEXT,
  roof_type TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for homes
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can only access their own homes" ON homes;
  
  CREATE POLICY "Users can only access their own homes"
  ON homes
  FOR ALL
  USING (auth.uid() = user_id);
  
  -- Enable RLS
  ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
END
$$;

-- Grant appropriate permissions
GRANT ALL ON specialty_items TO authenticated;
GRANT ALL ON other_insureds TO authenticated;
GRANT ALL ON vehicles TO authenticated;
GRANT ALL ON homes TO authenticated;

-- Add comment
COMMENT ON TABLE specialty_items IS 'Stores specialty items for insurance';
COMMENT ON TABLE other_insureds IS 'Stores information about other insureds';
COMMENT ON TABLE vehicles IS 'Stores vehicle information';
COMMENT ON TABLE homes IS 'Stores home information'; -- Create the ringcentral_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for ringcentral_tokens
DROP POLICY IF EXISTS "Users can only access their own tokens" ON ringcentral_tokens;
CREATE POLICY "Users can only access their own tokens"
ON ringcentral_tokens
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on ringcentral_tokens
ALTER TABLE ringcentral_tokens ENABLE ROW LEVEL SECURITY;

-- Grant access to the table
GRANT ALL ON ringcentral_tokens TO authenticated;
GRANT SELECT ON ringcentral_tokens TO anon;
GRANT ALL ON ringcentral_tokens TO service_role;
