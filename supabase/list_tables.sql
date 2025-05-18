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
COMMENT ON FUNCTION list_tables() IS 'Returns an array of all table names in the public schema'; 