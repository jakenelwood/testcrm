-- Direct SQL to create missing tables
-- Run this script directly in the Supabase SQL editor

-- Create specialty_items table
CREATE TABLE IF NOT EXISTS specialty_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  value NUMERIC,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for specialty_items
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can only access their own specialty items" ON specialty_items;
  
  CREATE POLICY "Users can only access their own specialty items"
  ON specialty_items
  FOR ALL
  USING (auth.uid() = user_id);
  
  -- Enable RLS
  ALTER TABLE specialty_items ENABLE ROW LEVEL SECURITY;
END
$$;

-- Create other_insureds table
CREATE TABLE IF NOT EXISTS other_insureds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth DATE,
  gender TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for other_insureds
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can only access their own other insureds" ON other_insureds;
  
  CREATE POLICY "Users can only access their own other insureds"
  ON other_insureds
  FOR ALL
  USING (auth.uid() = user_id);
  
  -- Enable RLS
  ALTER TABLE other_insureds ENABLE ROW LEVEL SECURITY;
END
$$;

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  state TEXT,
  primary_use TEXT,
  annual_mileage INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for vehicles
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can only access their own vehicles" ON vehicles;
  
  CREATE POLICY "Users can only access their own vehicles"
  ON vehicles
  FOR ALL
  USING (auth.uid() = user_id);
  
  -- Enable RLS
  ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
END
$$;

-- Create homes table
CREATE TABLE IF NOT EXISTS homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  year_built INTEGER,
  square_feet INTEGER,
  construction_type TEXT,
  roof_type TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for homes
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can only access their own homes" ON homes;
  
  CREATE POLICY "Users can only access their own homes"
  ON homes
  FOR ALL
  USING (auth.uid() = user_id);
  
  -- Enable RLS
  ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
END
$$;

-- Grant appropriate permissions
GRANT ALL ON specialty_items TO authenticated;
GRANT ALL ON other_insureds TO authenticated;
GRANT ALL ON vehicles TO authenticated;
GRANT ALL ON homes TO authenticated;

-- Add comment
COMMENT ON TABLE specialty_items IS 'Stores specialty items for insurance';
COMMENT ON TABLE other_insureds IS 'Stores information about other insureds';
COMMENT ON TABLE vehicles IS 'Stores vehicle information';
COMMENT ON TABLE homes IS 'Stores home information'; 