-- Function to get database information
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
