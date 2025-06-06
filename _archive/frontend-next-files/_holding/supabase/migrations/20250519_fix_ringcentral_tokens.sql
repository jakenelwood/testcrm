-- Migration to fix the ringcentral_tokens table
-- This addresses issues with the table structure that affect RingCentral authentication

-- First, backup the existing data
CREATE TABLE IF NOT EXISTS ringcentral_tokens_backup AS
SELECT * FROM ringcentral_tokens;

-- Check if there are any NULL values in critical columns before adding NOT NULL constraints
DO $$
DECLARE
  null_user_ids INTEGER;
  null_token_types INTEGER;
  null_expires_at INTEGER;
BEGIN
  -- Count NULL values
  SELECT COUNT(*) INTO null_user_ids FROM ringcentral_tokens WHERE user_id IS NULL;
  SELECT COUNT(*) INTO null_token_types FROM ringcentral_tokens WHERE token_type IS NULL;
  SELECT COUNT(*) INTO null_expires_at FROM ringcentral_tokens WHERE expires_at IS NULL;

  -- Report findings
  RAISE NOTICE 'Found % rows with NULL user_id', null_user_ids;
  RAISE NOTICE 'Found % rows with NULL token_type', null_token_types;
  RAISE NOTICE 'Found % rows with NULL expires_at', null_expires_at;

  -- Delete rows with NULL values in critical columns
  DELETE FROM ringcentral_tokens WHERE user_id IS NULL OR token_type IS NULL OR expires_at IS NULL;
END $$;

-- Add NOT NULL constraints to critical columns
ALTER TABLE ringcentral_tokens
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN token_type SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL;

-- Add foreign key constraint to user_id
-- First check if the constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ringcentral_tokens_user_id_fkey'
    AND table_name = 'ringcentral_tokens'
  ) THEN
    ALTER TABLE ringcentral_tokens
      ADD CONSTRAINT ringcentral_tokens_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add refresh_token_expires_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ringcentral_tokens'
    AND column_name = 'refresh_token_expires_at'
  ) THEN
    ALTER TABLE ringcentral_tokens
      ADD COLUMN refresh_token_expires_at TIMESTAMP WITH TIME ZONE;

    COMMENT ON COLUMN ringcentral_tokens.refresh_token_expires_at IS 'Timestamp when the RingCentral refresh token itself expires';
  END IF;
END $$;

-- Before adding the unique constraint, clean up any duplicate user_id entries
-- Keep only the most recently updated row for each user_id
CREATE TEMP TABLE rows_to_keep AS
SELECT id
FROM (
    SELECT id, user_id, updated_at,
           ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC, id DESC) as rn
    FROM ringcentral_tokens
) t
WHERE rn = 1;

-- Delete rows that are not the ones to keep (i.e., are duplicates)
DELETE FROM ringcentral_tokens
WHERE id NOT IN (SELECT id FROM rows_to_keep);

-- Add unique constraint to user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ringcentral_tokens_user_id_unique'
    AND table_name = 'ringcentral_tokens'
  ) THEN
    ALTER TABLE ringcentral_tokens
      ADD CONSTRAINT ringcentral_tokens_user_id_unique UNIQUE (user_id);

    COMMENT ON CONSTRAINT ringcentral_tokens_user_id_unique ON ringcentral_tokens
      IS 'Ensures each user_id is unique, allowing only one set of RingCentral tokens per user.';
  END IF;
END $$;

-- Ensure Row Level Security is enabled
ALTER TABLE ringcentral_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tokens" ON ringcentral_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON ringcentral_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON ringcentral_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON ringcentral_tokens;
DROP POLICY IF EXISTS "Users can only access their own tokens" ON ringcentral_tokens;

-- Recreate RLS policies
CREATE POLICY "Users can view their own tokens"
  ON ringcentral_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON ringcentral_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON ringcentral_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON ringcentral_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Record this migration in the schema_versions table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_versions') THEN
    INSERT INTO schema_versions (version, description, applied_at)
    VALUES ('20250519_fix_ringcentral_tokens', 'Fix RingCentral tokens table structure and constraints', NOW());
  END IF;
END $$;
