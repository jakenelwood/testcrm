-- Fix Drivers Table (PostgreSQL compatible)

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),
  entity_id UUID NOT NULL,
  
  -- Personal information
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  marital_status TEXT CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
  
  -- License information
  license_number TEXT,
  license_state TEXT,
  license_class TEXT,
  license_issue_date DATE,
  license_expiration_date DATE,
  years_licensed INTEGER,
  
  -- Driving history
  violations JSONB, -- Array of violations with dates, types, points
  accidents JSONB,  -- Array of accidents with dates, fault, claims
  claims_history JSONB,
  
  -- Education and training
  drivers_education BOOLEAN DEFAULT FALSE,
  defensive_driving_course BOOLEAN DEFAULT FALSE,
  training_courses JSONB,
  
  -- Status and qualifications
  good_student BOOLEAN DEFAULT FALSE,
  good_driver BOOLEAN DEFAULT TRUE,
  sr22_required BOOLEAN DEFAULT FALSE,
  
  -- Employment and occupation
  occupation TEXT,
  employer_name TEXT,
  employment_status TEXT CHECK (employment_status IN ('Employed', 'Unemployed', 'Retired', 'Student')),
  
  -- Relationship to primary insured
  relationship_to_primary TEXT CHECK (relationship_to_primary IN ('Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Other')),
  
  -- Exclusions and restrictions
  is_excluded BOOLEAN DEFAULT FALSE,
  exclusion_reason TEXT,
  driving_restrictions JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver-Vehicle Assignments with detailed usage
CREATE TABLE driver_vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Assignment details
  assignment_type TEXT CHECK (assignment_type IN ('Primary', 'Secondary', 'Occasional')),
  usage_percentage INTEGER CHECK (usage_percentage >= 0 AND usage_percentage <= 100),
  
  -- Usage patterns
  primary_use TEXT CHECK (primary_use IN ('Commute', 'Pleasure', 'Business', 'School')),
  commute_distance INTEGER, -- miles per day
  
  -- Date range
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(driver_id, vehicle_id)
);

-- Create missing indexes
CREATE INDEX idx_drivers_entity ON drivers(entity_type, entity_id);
CREATE INDEX idx_driver_vehicle_assignments_driver_id ON driver_vehicle_assignments(driver_id);
CREATE INDEX idx_driver_vehicle_assignments_vehicle_id ON driver_vehicle_assignments(vehicle_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON drivers TO crm_user;
GRANT ALL PRIVILEGES ON driver_vehicle_assignments TO crm_user;
