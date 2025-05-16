-- Create a simple view to get database version
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
