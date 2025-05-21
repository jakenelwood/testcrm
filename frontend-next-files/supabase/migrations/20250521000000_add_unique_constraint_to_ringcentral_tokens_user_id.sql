-- Add UNIQUE constraint to user_id in ringcentral_tokens table
-- This ensures that each user can only have one set of RingCentral tokens.

-- Before adding the constraint, we need to ensure there are no duplicate user_ids.
-- This step is crucial. If duplicates exist, the ALTER TABLE command will fail.
-- We will keep the most recently updated row for each user and delete older duplicates.

-- Step 1: Identify duplicate user_ids and the id of the row to keep (most recent updated_at)
CREATE TEMP TABLE rows_to_keep AS
SELECT id
FROM (
    SELECT id, user_id, updated_at,
           ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC, id DESC) as rn
    FROM public.ringcentral_tokens
) t
WHERE rn = 1;

-- Step 2: Delete rows that are not the ones to keep (i.e., are duplicates)
-- Make sure RLS is temporarily bypassed if needed, or run as a superuser.
-- Consider the implications of RLS policies before running delete operations.
-- For a migration, this is typically run with elevated privileges.
DELETE FROM public.ringcentral_tokens
WHERE id NOT IN (SELECT id FROM rows_to_keep);

-- Step 3: Now that duplicates are removed, add the UNIQUE constraint
ALTER TABLE public.ringcentral_tokens
ADD CONSTRAINT ringcentral_tokens_user_id_unique UNIQUE (user_id);

-- Step 4: Clean up the temporary table
DROP TABLE rows_to_keep;

-- Optional: Re-create the index on user_id if it was somehow dropped or if a unique index is preferred.
-- A UNIQUE constraint typically creates an index automatically, but explicit creation can be done if specific index parameters are needed.
-- CREATE UNIQUE INDEX IF NOT EXISTS ringcentral_tokens_user_id_unique_idx ON public.ringcentral_tokens(user_id);
-- The above is usually not needed as ADD CONSTRAINT ... UNIQUE creates an index.

COMMENT ON CONSTRAINT ringcentral_tokens_user_id_unique ON public.ringcentral_tokens IS 'Ensures each user_id is unique, allowing only one set of RingCentral tokens per user.';

-- Record this migration (example, adjust to your schema_versions table if you have one)
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_versions') THEN
--     INSERT INTO schema_versions (version, description, applied_at)
--     VALUES ('20250521000000_add_unique_constraint_to_ringcentral_tokens_user_id', 'Add UNIQUE constraint to user_id in ringcentral_tokens', NOW());
--   END IF;
-- END $$; 