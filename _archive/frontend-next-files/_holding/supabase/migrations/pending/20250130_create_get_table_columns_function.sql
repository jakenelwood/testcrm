-- Migration: Create get_table_columns RPC function
-- This function returns column information for a given table

BEGIN;

-- Create the get_table_columns function
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Get column information from information_schema
  SELECT jsonb_agg(
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable,
      'column_default', column_default,
      'ordinal_position', ordinal_position
    ) ORDER BY ordinal_position
  )
  INTO result
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = get_table_columns.table_name;
  
  -- Return empty array if no columns found
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant execute permission to users
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO anon;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_table_columns(text) IS 'Returns column information for a given table in JSON format';

-- Record this migration
INSERT INTO schema_versions (version, description)
VALUES ('20250130_create_get_table_columns_function', 'Create get_table_columns RPC function for table introspection');

COMMIT;
