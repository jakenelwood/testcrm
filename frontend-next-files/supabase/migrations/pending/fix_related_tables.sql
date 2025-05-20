-- Fix related tables to work with the renamed leads table and add missing columns
-- This script adds lead_id and client_id columns to vehicles, homes, and specialty_items tables

-- Step 1: Add lead_id and client_id columns to vehicles table if they don't exist
DO $$
BEGIN
  -- Check if lead_id column exists in vehicles table
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN lead_id UUID REFERENCES leads_ins_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added lead_id column to vehicles table';
  END IF;

  -- Check if client_id column exists in vehicles table
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN client_id UUID REFERENCES leads_contact_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added client_id column to vehicles table';
  END IF;
END
$$;

-- Step 2: Add lead_id and client_id columns to homes table if they don't exist
DO $$
BEGIN
  -- Check if lead_id column exists in homes table
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'homes' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE homes ADD COLUMN lead_id UUID REFERENCES leads_ins_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added lead_id column to homes table';
  END IF;

  -- Check if client_id column exists in homes table
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'homes' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE homes ADD COLUMN client_id UUID REFERENCES leads_contact_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added client_id column to homes table';
  END IF;
END
$$;

-- Step 3: Add lead_id and client_id columns to specialty_items table if they don't exist
DO $$
BEGIN
  -- Check if lead_id column exists in specialty_items table
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'specialty_items' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE specialty_items ADD COLUMN lead_id UUID REFERENCES leads_ins_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added lead_id column to specialty_items table';
  END IF;

  -- Check if client_id column exists in specialty_items table
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'specialty_items' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE specialty_items ADD COLUMN client_id UUID REFERENCES leads_contact_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added client_id column to specialty_items table';
  END IF;
END
$$;

-- Step 4: Create a view to handle the renamed leads table
DO $$
BEGIN
  -- Drop the view if it exists
  DROP VIEW IF EXISTS leads;

  -- Create a view that maps to the renamed leads_ins_info table
  CREATE VIEW leads AS
  SELECT * FROM leads_ins_info;

  RAISE NOTICE 'Created leads view that maps to leads_ins_info table';
END
$$;

-- Step 5: Associate vehicles with leads and clients
DO $$
DECLARE
  vehicle_record RECORD;
  lead_record RECORD;
BEGIN
  -- Loop through all vehicles in our test data
  FOR vehicle_record IN
    SELECT v.id, v.make, v.model, v.year, v.vin
    FROM vehicles v
    WHERE v.lead_id IS NULL
  LOOP
    -- Try to find a matching lead based on the vehicle data
    FOR lead_record IN
      SELECT l.id, l.client_id, l.auto_data
      FROM leads_ins_info l
      WHERE l.auto_data IS NOT NULL
    LOOP
      -- Check if this vehicle matches any in the lead's auto_data
      IF lead_record.auto_data::jsonb @> jsonb_build_object('vehicles',
        jsonb_build_array(
          jsonb_build_object(
            'make', vehicle_record.make,
            'model', vehicle_record.model,
            'year', vehicle_record.year::text,
            'vin', vehicle_record.vin
          )
        )
      ) THEN
        -- Update the vehicle with the lead_id and client_id
        UPDATE vehicles
        SET
          lead_id = lead_record.id,
          client_id = lead_record.client_id
        WHERE id = vehicle_record.id;

        RAISE NOTICE 'Associated vehicle % % % with lead %',
          vehicle_record.year, vehicle_record.make, vehicle_record.model, lead_record.id;

        -- Exit the inner loop once we've found a match
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END
$$;

-- Step 6: Associate homes with leads and clients
DO $$
DECLARE
  home_record RECORD;
  lead_record RECORD;
BEGIN
  -- Loop through all homes in our test data
  FOR home_record IN
    SELECT h.id, h.address, h.city, h.state, h.zip, h.year_built, h.square_feet
    FROM homes h
    WHERE h.lead_id IS NULL
  LOOP
    -- Try to find a matching lead based on the home data
    FOR lead_record IN
      SELECT l.id, l.client_id, l.home_data
      FROM leads_ins_info l
      WHERE l.home_data IS NOT NULL
    LOOP
      -- Check if this home matches any in the lead's home_data
      IF (
        (lead_record.home_data::jsonb->>'year_built' = home_record.year_built::text OR
         lead_record.home_data::jsonb->>'square_feet' = home_record.square_feet::text) AND
        (lead_record.home_data::jsonb->>'property_type' IS NOT NULL)
      ) THEN
        -- Update the home with the lead_id and client_id
        UPDATE homes
        SET
          lead_id = lead_record.id,
          client_id = lead_record.client_id
        WHERE id = home_record.id;

        RAISE NOTICE 'Associated home at % with lead %',
          home_record.address, lead_record.id;

        -- Exit the inner loop once we've found a match
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END
$$;

-- Step 7: Associate specialty items with leads and clients
DO $$
DECLARE
  item_record RECORD;
  lead_record RECORD;
BEGIN
  -- Loop through all specialty items in our test data
  FOR item_record IN
    SELECT s.id, s.name, s.value, s.description
    FROM specialty_items s
    WHERE s.lead_id IS NULL
  LOOP
    -- Try to find a matching lead based on the specialty item data
    FOR lead_record IN
      SELECT l.id, l.client_id, l.specialty_data
      FROM leads_ins_info l
      WHERE l.specialty_data IS NOT NULL
    LOOP
      -- Check if this specialty item matches any in the lead's specialty_data
      IF (
        (lead_record.specialty_data::jsonb->>'type' IS NOT NULL) AND
        (
          item_record.name ILIKE '%' || lead_record.specialty_data::jsonb->>'type' || '%' OR
          item_record.name ILIKE '%' || lead_record.specialty_data::jsonb->>'make' || '%' OR
          item_record.name ILIKE '%' || lead_record.specialty_data::jsonb->>'model' || '%'
        )
      ) THEN
        -- Update the specialty item with the lead_id and client_id
        UPDATE specialty_items
        SET
          lead_id = lead_record.id,
          client_id = lead_record.client_id
        WHERE id = item_record.id;

        RAISE NOTICE 'Associated specialty item % with lead %',
          item_record.name, lead_record.id;

        -- Exit the inner loop once we've found a match
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END
$$;

-- Step 8: Verify the updates
SELECT
  'vehicles' AS table_name,
  COUNT(*) AS total_count,
  COUNT(lead_id) AS with_lead_id,
  COUNT(client_id) AS with_client_id
FROM
  vehicles
UNION ALL
SELECT
  'homes' AS table_name,
  COUNT(*) AS total_count,
  COUNT(lead_id) AS with_lead_id,
  COUNT(client_id) AS with_client_id
FROM
  homes
UNION ALL
SELECT
  'specialty_items' AS table_name,
  COUNT(*) AS total_count,
  COUNT(lead_id) AS with_lead_id,
  COUNT(client_id) AS with_client_id
FROM
  specialty_items;