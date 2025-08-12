-- =============================================================================
-- MIGRATION: Address and Location Management
-- =============================================================================
-- Description: Creates addresses table with geocoding support and validation
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- ADDRESSES TABLE
-- =============================================================================

CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Address components
  street TEXT,
  street2 TEXT, -- Apartment, suite, etc.
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Address type and classification
  type TEXT CHECK (type IN ('Physical', 'Mailing', 'Business', 'Location', 'Billing', 'Shipping')),
  
  -- Validation and verification
  is_verified BOOLEAN DEFAULT FALSE,
  verification_source TEXT, -- 'USPS', 'Google', 'Manual', etc.
  verification_date TIMESTAMP WITH TIME ZONE,
  
  -- Geocoding data
  geocode_lat DECIMAL(10,8),
  geocode_lng DECIMAL(11,8),
  geocode_accuracy TEXT, -- 'ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE'
  geocode_source TEXT, -- 'Google', 'MapBox', 'Manual', etc.
  geocode_date TIMESTAMP WITH TIME ZONE,
  
  -- Formatted address (standardized)
  formatted_address TEXT,
  
  -- Additional location data
  plus_code TEXT, -- Google Plus Code
  place_id TEXT, -- Google Place ID or similar
  
  -- Metadata and custom fields
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Basic lookup indexes
CREATE INDEX idx_addresses_type ON public.addresses(type);
CREATE INDEX idx_addresses_city_state ON public.addresses(city, state);
CREATE INDEX idx_addresses_zip_code ON public.addresses(zip_code);
CREATE INDEX idx_addresses_is_verified ON public.addresses(is_verified);

-- Geographic indexes
CREATE INDEX idx_addresses_geocode ON public.addresses(geocode_lat, geocode_lng) 
  WHERE geocode_lat IS NOT NULL AND geocode_lng IS NOT NULL;

-- Full-text search index for address components
CREATE INDEX idx_addresses_search ON public.addresses 
  USING GIN (to_tsvector('english', 
    COALESCE(street, '') || ' ' || 
    COALESCE(street2, '') || ' ' || 
    COALESCE(city, '') || ' ' || 
    COALESCE(state, '') || ' ' || 
    COALESCE(zip_code, '')
  ));

-- JSONB index for metadata
CREATE INDEX idx_addresses_metadata ON public.addresses USING GIN (metadata);

-- Audit indexes
CREATE INDEX idx_addresses_created_by ON public.addresses(created_by);
CREATE INDEX idx_addresses_created_at ON public.addresses(created_at);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on addresses table
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view addresses they created or are associated with
CREATE POLICY "Users can view own addresses" ON public.addresses
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Policy: Users can insert addresses
CREATE POLICY "Users can insert addresses" ON public.addresses
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Policy: Users can update addresses they created
CREATE POLICY "Users can update own addresses" ON public.addresses
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Policy: Admins can delete addresses
CREATE POLICY "Admins can delete addresses" ON public.addresses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at and updated_by
CREATE OR REPLACE FUNCTION public.update_address_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update audit fields
CREATE TRIGGER update_addresses_audit_fields
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

-- Function to set created_by on insert
CREATE OR REPLACE FUNCTION public.set_address_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set created_by
CREATE TRIGGER set_addresses_created_by
  BEFORE INSERT ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_address_created_by();

-- Function to format address components into a single string
CREATE OR REPLACE FUNCTION public.format_address(
  street TEXT DEFAULT NULL,
  street2 TEXT DEFAULT NULL,
  city TEXT DEFAULT NULL,
  state TEXT DEFAULT NULL,
  zip_code TEXT DEFAULT NULL,
  country TEXT DEFAULT 'US'
)
RETURNS TEXT AS $$
BEGIN
  RETURN TRIM(
    CONCAT_WS(', ',
      NULLIF(TRIM(CONCAT_WS(' ', street, street2)), ''),
      NULLIF(TRIM(city), ''),
      NULLIF(TRIM(CONCAT_WS(' ', state, zip_code)), ''),
      CASE WHEN country != 'US' THEN NULLIF(TRIM(country), '') ELSE NULL END
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update formatted_address automatically
CREATE OR REPLACE FUNCTION public.update_formatted_address()
RETURNS TRIGGER AS $$
BEGIN
  NEW.formatted_address = public.format_address(
    NEW.street, NEW.street2, NEW.city, NEW.state, NEW.zip_code, NEW.country
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update formatted_address
CREATE TRIGGER update_addresses_formatted_address
  BEFORE INSERT OR UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_formatted_address();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate distance between two addresses (in miles)
CREATE OR REPLACE FUNCTION public.address_distance_miles(
  lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN (
    3959 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find addresses within a radius
CREATE OR REPLACE FUNCTION public.addresses_within_radius(
  center_lat DECIMAL, 
  center_lng DECIMAL, 
  radius_miles DECIMAL DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  formatted_address TEXT,
  distance_miles DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.formatted_address,
    public.address_distance_miles(center_lat, center_lng, a.geocode_lat, a.geocode_lng) as distance_miles
  FROM public.addresses a
  WHERE a.geocode_lat IS NOT NULL 
    AND a.geocode_lng IS NOT NULL
    AND public.address_distance_miles(center_lat, center_lng, a.geocode_lat, a.geocode_lng) <= radius_miles
  ORDER BY distance_miles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.addresses IS 'Address management with geocoding and verification support';
COMMENT ON COLUMN public.addresses.type IS 'Address type: Physical, Mailing, Business, Location, Billing, or Shipping';
COMMENT ON COLUMN public.addresses.is_verified IS 'Whether the address has been verified against a postal service';
COMMENT ON COLUMN public.addresses.geocode_lat IS 'Latitude coordinate from geocoding service';
COMMENT ON COLUMN public.addresses.geocode_lng IS 'Longitude coordinate from geocoding service';
COMMENT ON COLUMN public.addresses.formatted_address IS 'Standardized formatted address string';
COMMENT ON COLUMN public.addresses.metadata IS 'Additional address metadata stored as JSONB';

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT EXECUTE ON FUNCTION public.format_address(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.address_distance_miles(DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.addresses_within_radius(DECIMAL, DECIMAL, DECIMAL) TO authenticated;
