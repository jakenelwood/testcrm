-- Check current database status
-- Run this to see what tables exist and what migrations have been applied

-- Check if basic tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check migration history if it exists
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 20;
