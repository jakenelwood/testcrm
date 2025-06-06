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
GRANT EXECUTE ON FUNCTION list_tables() TO service_role; 