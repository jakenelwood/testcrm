-- Add lead_id column to other_insureds table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'other_insureds' 
    AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE public.other_insureds ADD COLUMN lead_id UUID REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added lead_id column to other_insureds table';
  ELSE
    RAISE NOTICE 'lead_id column already exists in other_insureds table';
  END IF;
END
$$;

-- Add client_id column to other_insureds table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'other_insureds' 
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.other_insureds ADD COLUMN client_id UUID REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added client_id column to other_insureds table';
  ELSE
    RAISE NOTICE 'client_id column already exists in other_insureds table';
  END IF;
END
$$;

-- Add first_name and last_name columns to other_insureds table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'other_insureds' 
    AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.other_insureds ADD COLUMN first_name TEXT;
    RAISE NOTICE 'Added first_name column to other_insureds table';
  ELSE
    RAISE NOTICE 'first_name column already exists in other_insureds table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'other_insureds' 
    AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.other_insureds ADD COLUMN last_name TEXT;
    RAISE NOTICE 'Added last_name column to other_insureds table';
  ELSE
    RAISE NOTICE 'last_name column already exists in other_insureds table';
  END IF;
END
$$;

-- Add additional columns to other_insureds table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'other_insureds' 
    AND column_name = 'drivers_license'
  ) THEN
    ALTER TABLE public.other_insureds ADD COLUMN drivers_license TEXT;
    RAISE NOTICE 'Added drivers_license column to other_insureds table';
  ELSE
    RAISE NOTICE 'drivers_license column already exists in other_insureds table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'other_insureds' 
    AND column_name = 'license_state'
  ) THEN
    ALTER TABLE public.other_insureds ADD COLUMN license_state TEXT;
    RAISE NOTICE 'Added license_state column to other_insureds table';
  ELSE
    RAISE NOTICE 'license_state column already exists in other_insureds table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'other_insureds' 
    AND column_name = 'marital_status'
  ) THEN
    ALTER TABLE public.other_insureds ADD COLUMN marital_status TEXT;
    RAISE NOTICE 'Added marital_status column to other_insureds table';
  ELSE
    RAISE NOTICE 'marital_status column already exists in other_insureds table';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'other_insureds' 
    AND column_name = 'education_occupation'
  ) THEN
    ALTER TABLE public.other_insureds ADD COLUMN education_occupation TEXT;
    RAISE NOTICE 'Added education_occupation column to other_insureds table';
  ELSE
    RAISE NOTICE 'education_occupation column already exists in other_insureds table';
  END IF;
END
$$;

-- Create index on lead_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'other_insureds' 
    AND indexname = 'other_insureds_lead_id_idx'
  ) THEN
    CREATE INDEX other_insureds_lead_id_idx ON public.other_insureds(lead_id);
    RAISE NOTICE 'Created index on lead_id column in other_insureds table';
  ELSE
    RAISE NOTICE 'Index on lead_id column already exists in other_insureds table';
  END IF;
END
$$;
