-- Create missing tables mentioned in the error logs

-- Check if ringcentral_tokens table exists, create if not
CREATE TABLE IF NOT EXISTS ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policy for ringcentral_tokens
DROP POLICY IF EXISTS "Users can only access their own tokens" ON ringcentral_tokens;
CREATE POLICY "Users can only access their own tokens"
ON ringcentral_tokens
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on ringcentral_tokens
ALTER TABLE ringcentral_tokens ENABLE ROW LEVEL SECURITY;

-- Check if specialty_items table exists, create if not
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
DROP POLICY IF EXISTS "Users can only access their own specialty items" ON specialty_items;
CREATE POLICY "Users can only access their own specialty items"
ON specialty_items
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on specialty_items
ALTER TABLE specialty_items ENABLE ROW LEVEL SECURITY;

-- Check if other_insureds table exists, create if not
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
DROP POLICY IF EXISTS "Users can only access their own other insureds" ON other_insureds;
CREATE POLICY "Users can only access their own other insureds"
ON other_insureds
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on other_insureds
ALTER TABLE other_insureds ENABLE ROW LEVEL SECURITY;

-- Check if vehicles table exists, create if not
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
DROP POLICY IF EXISTS "Users can only access their own vehicles" ON vehicles;
CREATE POLICY "Users can only access their own vehicles"
ON vehicles
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Check if homes table exists, create if not
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
DROP POLICY IF EXISTS "Users can only access their own homes" ON homes;
CREATE POLICY "Users can only access their own homes"
ON homes
FOR ALL
USING (auth.uid() = user_id);

-- Enable RLS on homes
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;

-- Grant access to all tables for authenticated users
GRANT ALL ON ringcentral_tokens TO authenticated;
GRANT ALL ON specialty_items TO authenticated;
GRANT ALL ON other_insureds TO authenticated;
GRANT ALL ON vehicles TO authenticated;
GRANT ALL ON homes TO authenticated;

-- Grant select access to anon users (for public data if needed)
GRANT SELECT ON ringcentral_tokens TO anon;
GRANT SELECT ON specialty_items TO anon;
GRANT SELECT ON other_insureds TO anon;
GRANT SELECT ON vehicles TO anon;
GRANT SELECT ON homes TO anon;
