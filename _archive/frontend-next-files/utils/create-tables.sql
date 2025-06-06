-- Function to create tables if they don't exist
CREATE OR REPLACE FUNCTION create_table_if_not_exists(table_name text, table_definition text)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = table_name
    ) THEN
        EXECUTE 'CREATE TABLE ' || table_name || ' (' || table_definition || ')';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
