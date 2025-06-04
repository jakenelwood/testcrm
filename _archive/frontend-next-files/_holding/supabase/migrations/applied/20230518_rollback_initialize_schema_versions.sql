-- Rollback: Initialize schema_versions table and record consolidated schema
BEGIN;

-- Remove all records from schema_versions
TRUNCATE schema_versions;

-- Note: We don't drop the schema_versions table as it's needed for migration tracking
-- If you really want to completely roll back, uncomment the following line:
-- DROP TABLE IF EXISTS schema_versions;

COMMIT;
