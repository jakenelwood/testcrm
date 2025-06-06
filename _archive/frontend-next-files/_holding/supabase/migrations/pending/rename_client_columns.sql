-- Rename client_type to lead_type in leads_contact_info table and
-- rename client_id to leads_contact_info_id in related tables

-- Step 1: Rename client_type to lead_type in leads_contact_info table
DO $$
BEGIN
  -- Check if client_type column exists in leads_contact_info table
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_contact_info' AND column_name = 'client_type'
  ) THEN
    -- Rename the column
    ALTER TABLE leads_contact_info RENAME COLUMN client_type TO lead_type;
    RAISE NOTICE 'Renamed client_type to lead_type in leads_contact_info table';
  ELSE
    RAISE NOTICE 'Column client_type does not exist in leads_contact_info table';
  END IF;
END
$$;

-- Step 2: Rename client_id to leads_contact_info_id in ai_interactions table
DO $$
BEGIN
  -- Check if client_id column exists in ai_interactions table
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_interactions' AND column_name = 'client_id'
  ) THEN
    -- Rename the column
    ALTER TABLE ai_interactions RENAME COLUMN client_id TO leads_contact_info_id;
    RAISE NOTICE 'Renamed client_id to leads_contact_info_id in ai_interactions table';
  ELSE
    RAISE NOTICE 'Column client_id does not exist in ai_interactions table';
  END IF;
END
$$;

-- Step 3: Rename client_id to leads_contact_info_id in contacts table
DO $$
BEGIN
  -- Check if client_id column exists in contacts table
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'client_id'
  ) THEN
    -- Rename the column
    ALTER TABLE contacts RENAME COLUMN client_id TO leads_contact_info_id;
    RAISE NOTICE 'Renamed client_id to leads_contact_info_id in contacts table';
  ELSE
    RAISE NOTICE 'Column client_id does not exist in contacts table';
  END IF;
END
$$;

-- Step 4: Rename client_id to leads_contact_info_id in homes table
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Check if client_id column exists in homes table
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'homes' AND column_name = 'client_id'
  ) THEN
    -- Get the name of the foreign key constraint if it exists
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'homes'::regclass
    AND contype = 'f'
    AND conkey[1] = (
      SELECT attnum
      FROM pg_attribute
      WHERE attrelid = 'homes'::regclass
      AND attname = 'client_id'
    );

    -- Drop the foreign key constraint if it exists
    IF constraint_name IS NOT NULL THEN
      EXECUTE 'ALTER TABLE homes DROP CONSTRAINT ' || constraint_name;
      RAISE NOTICE 'Dropped foreign key constraint % on homes.client_id', constraint_name;
    END IF;

    -- Rename the column
    ALTER TABLE homes RENAME COLUMN client_id TO leads_contact_info_id;
    RAISE NOTICE 'Renamed client_id to leads_contact_info_id in homes table';

    -- Add the foreign key constraint with the new column name
    ALTER TABLE homes
    ADD CONSTRAINT homes_leads_contact_info_id_fkey
    FOREIGN KEY (leads_contact_info_id)
    REFERENCES leads_contact_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint on homes.leads_contact_info_id';
  ELSE
    RAISE NOTICE 'Column client_id does not exist in homes table';
  END IF;
END
$$;

-- Step 5: Rename client_id to leads_contact_info_id in lead_details table
DO $$
BEGIN
  -- Check if lead_details table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lead_details'
  ) THEN
    -- Check if client_id column exists in lead_details table
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'lead_details' AND column_name = 'client_id'
    ) THEN
      -- Rename the column
      ALTER TABLE lead_details RENAME COLUMN client_id TO leads_contact_info_id;
      RAISE NOTICE 'Renamed client_id to leads_contact_info_id in lead_details table';
    ELSE
      RAISE NOTICE 'Column client_id does not exist in lead_details table';
    END IF;
  ELSE
    RAISE NOTICE 'Table lead_details does not exist';
  END IF;
END
$$;

-- Step 6: Rename client_id to leads_contact_info_id in leads_ins_info table
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Check if client_id column exists in leads_ins_info table
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_ins_info' AND column_name = 'client_id'
  ) THEN
    -- Get the name of the foreign key constraint if it exists
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'leads_ins_info'::regclass
    AND contype = 'f'
    AND conkey[1] = (
      SELECT attnum
      FROM pg_attribute
      WHERE attrelid = 'leads_ins_info'::regclass
      AND attname = 'client_id'
    );

    -- Drop the foreign key constraint if it exists
    IF constraint_name IS NOT NULL THEN
      EXECUTE 'ALTER TABLE leads_ins_info DROP CONSTRAINT ' || constraint_name;
      RAISE NOTICE 'Dropped foreign key constraint % on leads_ins_info.client_id', constraint_name;
    END IF;

    -- Rename the column
    ALTER TABLE leads_ins_info RENAME COLUMN client_id TO leads_contact_info_id;
    RAISE NOTICE 'Renamed client_id to leads_contact_info_id in leads_ins_info table';

    -- Add the foreign key constraint with the new column name
    ALTER TABLE leads_ins_info
    ADD CONSTRAINT leads_ins_info_leads_contact_info_id_fkey
    FOREIGN KEY (leads_contact_info_id)
    REFERENCES leads_contact_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint on leads_ins_info.leads_contact_info_id';
  ELSE
    RAISE NOTICE 'Column client_id does not exist in leads_ins_info table';
  END IF;
END
$$;

-- Step 7: Rename client_id to leads_contact_info_id in specialty_items table
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Check if client_id column exists in specialty_items table
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'specialty_items' AND column_name = 'client_id'
  ) THEN
    -- Get the name of the foreign key constraint if it exists
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'specialty_items'::regclass
    AND contype = 'f'
    AND conkey[1] = (
      SELECT attnum
      FROM pg_attribute
      WHERE attrelid = 'specialty_items'::regclass
      AND attname = 'client_id'
    );

    -- Drop the foreign key constraint if it exists
    IF constraint_name IS NOT NULL THEN
      EXECUTE 'ALTER TABLE specialty_items DROP CONSTRAINT ' || constraint_name;
      RAISE NOTICE 'Dropped foreign key constraint % on specialty_items.client_id', constraint_name;
    END IF;

    -- Rename the column
    ALTER TABLE specialty_items RENAME COLUMN client_id TO leads_contact_info_id;
    RAISE NOTICE 'Renamed client_id to leads_contact_info_id in specialty_items table';

    -- Add the foreign key constraint with the new column name
    ALTER TABLE specialty_items
    ADD CONSTRAINT specialty_items_leads_contact_info_id_fkey
    FOREIGN KEY (leads_contact_info_id)
    REFERENCES leads_contact_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint on specialty_items.leads_contact_info_id';
  ELSE
    RAISE NOTICE 'Column client_id does not exist in specialty_items table';
  END IF;
END
$$;

-- Step 8: Rename client_id to leads_contact_info_id in support_tickets table
DO $$
BEGIN
  -- Check if support_tickets table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'support_tickets'
  ) THEN
    -- Check if client_id column exists in support_tickets table
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'client_id'
    ) THEN
      -- Rename the column
      ALTER TABLE support_tickets RENAME COLUMN client_id TO leads_contact_info_id;
      RAISE NOTICE 'Renamed client_id to leads_contact_info_id in support_tickets table';
    ELSE
      RAISE NOTICE 'Column client_id does not exist in support_tickets table';
    END IF;
  ELSE
    RAISE NOTICE 'Table support_tickets does not exist';
  END IF;
END
$$;

-- Step 9: Rename client_id to leads_contact_info_id in vehicles table
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Check if client_id column exists in vehicles table
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'client_id'
  ) THEN
    -- Get the name of the foreign key constraint if it exists
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'vehicles'::regclass
    AND contype = 'f'
    AND conkey[1] = (
      SELECT attnum
      FROM pg_attribute
      WHERE attrelid = 'vehicles'::regclass
      AND attname = 'client_id'
    );

    -- Drop the foreign key constraint if it exists
    IF constraint_name IS NOT NULL THEN
      EXECUTE 'ALTER TABLE vehicles DROP CONSTRAINT ' || constraint_name;
      RAISE NOTICE 'Dropped foreign key constraint % on vehicles.client_id', constraint_name;
    END IF;

    -- Rename the column
    ALTER TABLE vehicles RENAME COLUMN client_id TO leads_contact_info_id;
    RAISE NOTICE 'Renamed client_id to leads_contact_info_id in vehicles table';

    -- Add the foreign key constraint with the new column name
    ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_leads_contact_info_id_fkey
    FOREIGN KEY (leads_contact_info_id)
    REFERENCES leads_contact_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint on vehicles.leads_contact_info_id';
  ELSE
    RAISE NOTICE 'Column client_id does not exist in vehicles table';
  END IF;
END
$$;

-- Step 10: Update the leads view to reflect the column name change
DO $$
BEGIN
  -- Drop the view if it exists
  DROP VIEW IF EXISTS leads;

  -- Create a view that maps to the renamed leads_ins_info table with updated column name
  CREATE VIEW leads AS
  SELECT
    id,
    status_id,
    insurance_type_id,
    assigned_to,
    notes,
    current_carrier,
    premium,
    auto_premium,
    home_premium,
    specialty_premium,
    umbrella_value,
    auto_current_insurance_carrier,
    auto_months_with_current_carrier,
    auto_data,
    auto_data_schema_version,
    home_data,
    home_data_schema_version,
    specialty_data,
    specialty_data_schema_version,
    additional_insureds,
    pipeline_id,
    address_id,
    mailing_address_id,
    leads_contact_info_id,
    created_at,
    updated_at,
    status_changed_at
  FROM leads_ins_info;

  RAISE NOTICE 'Updated leads view to reflect column name change';
END
$$;

-- Step 11: Verify the column renames
DO $$
DECLARE
  table_record RECORD;
  has_client_id BOOLEAN;
  has_client_type BOOLEAN;
  has_leads_contact_info_id BOOLEAN;
  has_lead_type BOOLEAN;
BEGIN
  -- Check each table for the old and new column names
  FOR table_record IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name IN ('leads_contact_info', 'ai_interactions', 'contacts', 'homes',
                      'leads_ins_info', 'specialty_items', 'support_tickets', 'vehicles')
  LOOP
    -- Check for client_id column
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = table_record.table_name AND column_name = 'client_id'
    ) INTO has_client_id;

    -- Check for leads_contact_info_id column
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = table_record.table_name AND column_name = 'leads_contact_info_id'
    ) INTO has_leads_contact_info_id;

    -- Output results for client_id/leads_contact_info_id
    IF table_record.table_name != 'leads_contact_info' THEN
      IF has_client_id THEN
        RAISE WARNING 'Table % still has client_id column', table_record.table_name;
      END IF;

      IF has_leads_contact_info_id THEN
        RAISE NOTICE 'Table % has leads_contact_info_id column', table_record.table_name;
      ELSE
        RAISE WARNING 'Table % does not have leads_contact_info_id column', table_record.table_name;
      END IF;
    END IF;
  END LOOP;

  -- Special check for leads_contact_info table
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_contact_info' AND column_name = 'client_type'
  ) INTO has_client_type;

  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_contact_info' AND column_name = 'lead_type'
  ) INTO has_lead_type;

  -- Output results for client_type/lead_type
  IF has_client_type THEN
    RAISE WARNING 'Table leads_contact_info still has client_type column';
  END IF;

  IF has_lead_type THEN
    RAISE NOTICE 'Table leads_contact_info has lead_type column';
  ELSE
    RAISE WARNING 'Table leads_contact_info does not have lead_type column';
  END IF;
END
$$;
