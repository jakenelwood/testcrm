-- Create a comprehensive lead view that includes all necessary information
-- This view will join leads_ins_info with leads_contact_info and addresses

-- First, check if the lead_details view exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'lead_details'
  ) THEN
    DROP VIEW lead_details;
    RAISE NOTICE 'Dropped existing lead_details view';
  END IF;
END
$$;

-- Create the comprehensive lead_details view
CREATE VIEW lead_details AS
SELECT 
  l.id,
  l.status_id,
  l.insurance_type_id,
  l.assigned_to,
  l.notes,
  l.current_carrier,
  l.premium,
  l.auto_premium,
  l.home_premium,
  l.specialty_premium,
  l.umbrella_value,
  l.auto_current_insurance_carrier,
  l.auto_months_with_current_carrier,
  l.auto_data,
  l.auto_data_schema_version,
  l.home_data,
  l.home_data_schema_version,
  l.specialty_data,
  l.specialty_data_schema_version,
  l.additional_insureds,
  l.pipeline_id,
  l.address_id,
  l.mailing_address_id,
  l.leads_contact_info_id,
  l.created_at,
  l.updated_at,
  l.status_changed_at,
  
  -- Status information
  s.value AS status_value,
  s.description AS status_description,
  s.is_final AS status_is_final,
  s.display_order AS status_display_order,
  
  -- Insurance type information
  it.name AS insurance_type_name,
  it.description AS insurance_type_description,
  
  -- Pipeline information
  p.name AS pipeline_name,
  p.description AS pipeline_description,
  p.is_default AS pipeline_is_default,
  p.display_order AS pipeline_display_order,
  
  -- Client information from leads_contact_info
  c.id AS client_id,
  c.name AS client_name,
  c.email AS client_email,
  c.phone_number AS client_phone_number,
  c.lead_type AS client_type,
  c.date_of_birth AS client_date_of_birth,
  c.gender AS client_gender,
  c.marital_status AS client_marital_status,
  c.drivers_license AS client_drivers_license,
  c.license_state AS client_license_state,
  c.education_occupation AS client_education_occupation,
  c.referred_by AS client_referred_by,
  
  -- Physical address information
  a.street AS address_street,
  a.city AS address_city,
  a.state AS address_state,
  a.zip_code AS address_zip_code,
  a.type AS address_type,
  a.is_verified AS address_is_verified,
  a.geocode_lat AS address_geocode_lat,
  a.geocode_lng AS address_geocode_lng,
  
  -- Mailing address information
  ma.street AS mailing_address_street,
  ma.city AS mailing_address_city,
  ma.state AS mailing_address_state,
  ma.zip_code AS mailing_address_zip_code,
  ma.type AS mailing_address_type,
  ma.is_verified AS mailing_address_is_verified,
  ma.geocode_lat AS mailing_address_geocode_lat,
  ma.geocode_lng AS mailing_address_geocode_lng
FROM 
  leads_ins_info l
LEFT JOIN 
  lead_statuses s ON l.status_id = s.id
LEFT JOIN 
  insurance_types it ON l.insurance_type_id = it.id
LEFT JOIN 
  pipelines p ON l.pipeline_id = p.id
LEFT JOIN 
  leads_contact_info c ON l.leads_contact_info_id = c.id
LEFT JOIN 
  addresses a ON l.address_id = a.id
LEFT JOIN 
  addresses ma ON l.mailing_address_id = ma.id;

-- Create a view for the leads table for backward compatibility
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'leads'
  ) THEN
    DROP VIEW leads;
    RAISE NOTICE 'Dropped existing leads view';
  END IF;
END
$$;

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

-- Verify the views were created
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'lead_details'
  ) THEN
    RAISE NOTICE 'lead_details view created successfully';
  ELSE
    RAISE WARNING 'Failed to create lead_details view';
  END IF;
  
  IF EXISTS (
    SELECT FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'leads'
  ) THEN
    RAISE NOTICE 'leads view created successfully';
  ELSE
    RAISE WARNING 'Failed to create leads view';
  END IF;
END
$$;
