-- Migration to rename tables:
-- 1. 'leads' to 'leads_ins_info'
-- 2. 'clients' to 'leads_contact_info'

-- Step 1: Drop views that depend on these tables
DROP VIEW IF EXISTS public.lead_details;
DROP VIEW IF EXISTS public.user_profiles;

-- Step 2: Rename tables
ALTER TABLE public.leads RENAME TO leads_ins_info;
ALTER TABLE public.clients RENAME TO leads_contact_info;

-- Step 3: Update foreign key constraints

-- Update references in lead_notes
ALTER TABLE public.lead_notes 
DROP CONSTRAINT IF EXISTS lead_notes_lead_id_fkey,
ADD CONSTRAINT lead_notes_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;

-- Update references in lead_communications
ALTER TABLE public.lead_communications 
DROP CONSTRAINT IF EXISTS lead_communications_lead_id_fkey,
ADD CONSTRAINT lead_communications_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;

-- Update references in lead_marketing_settings
ALTER TABLE public.lead_marketing_settings 
DROP CONSTRAINT IF EXISTS lead_marketing_settings_lead_id_fkey,
ADD CONSTRAINT lead_marketing_settings_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;

-- Update references in opportunities
ALTER TABLE public.opportunities 
DROP CONSTRAINT IF EXISTS opportunities_lead_id_fkey,
ADD CONSTRAINT opportunities_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;

-- Update references in support_tickets for lead_id
ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_lead_id_fkey,
ADD CONSTRAINT support_tickets_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;

-- Update references in support_tickets for client_id
ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_client_id_fkey,
ADD CONSTRAINT support_tickets_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;

-- Update references in contacts
ALTER TABLE public.contacts 
DROP CONSTRAINT IF EXISTS contacts_client_id_fkey,
ADD CONSTRAINT contacts_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;

-- Update references in ai_interactions for lead_id
ALTER TABLE public.ai_interactions 
DROP CONSTRAINT IF EXISTS ai_interactions_lead_id_fkey,
ADD CONSTRAINT ai_interactions_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;

-- Update references in ai_interactions for client_id
ALTER TABLE public.ai_interactions 
DROP CONSTRAINT IF EXISTS ai_interactions_client_id_fkey,
ADD CONSTRAINT ai_interactions_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;

-- Update client_id reference in leads_ins_info
ALTER TABLE public.leads_ins_info 
DROP CONSTRAINT IF EXISTS leads_client_id_fkey,
ADD CONSTRAINT leads_ins_info_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.leads_contact_info(id) ON DELETE CASCADE;

-- Update converted_from_lead_id reference in leads_contact_info
ALTER TABLE public.leads_contact_info 
DROP CONSTRAINT IF EXISTS clients_converted_from_lead_id_fkey,
ADD CONSTRAINT leads_contact_info_converted_from_lead_id_fkey 
FOREIGN KEY (converted_from_lead_id) REFERENCES public.leads_ins_info(id) ON DELETE CASCADE;

-- Step 4: Recreate views with updated table names

-- Recreate lead_details view
CREATE OR REPLACE VIEW public.lead_details AS
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
  l.commercial_premium,
  l.umbrella_value,
  l.umbrella_uninsured_underinsured,
  l.auto_current_insurance_carrier,
  l.auto_months_with_current_carrier,
  l.specialty_type,
  l.specialty_make,
  l.specialty_model,
  l.specialty_year,
  l.commercial_coverage_type,
  l.commercial_industry,
  l.auto_data,
  l.auto_data_schema_version,
  l.home_data,
  l.home_data_schema_version,
  l.specialty_data,
  l.specialty_data_schema_version,
  l.commercial_data,
  l.commercial_data_schema_version,
  l.liability_data,
  l.liability_data_schema_version,
  l.additional_insureds,
  l.additional_locations,
  l.ai_summary,
  l.ai_next_action,
  l.ai_quote_recommendation,
  l.ai_follow_up_priority,
  l.metadata,
  l.tags,
  l.created_at,
  l.updated_at,
  l.status_changed_at,
  l.last_contact_at,
  l.next_contact_at,
  l.quote_generated_at,
  l.sold_at,
  l.lost_at,
  l.pipeline_id,
  l.address_id,
  l.mailing_address_id,
  l.client_id,
  l.first_name,
  l.last_name,
  l.email,
  l.phone_number,
  a.street AS address_street,
  a.city AS address_city,
  a.state AS address_state,
  a.zip_code AS address_zip_code,
  a.type AS address_type,
  a.is_verified AS address_is_verified,
  a.geocode_lat AS address_geocode_lat,
  a.geocode_lng AS address_geocode_lng,
  ma.street AS mailing_address_street,
  ma.city AS mailing_address_city,
  ma.state AS mailing_address_state,
  ma.zip_code AS mailing_address_zip_code,
  ma.type AS mailing_address_type,
  ma.is_verified AS mailing_address_is_verified,
  ma.geocode_lat AS mailing_address_geocode_lat,
  ma.geocode_lng AS mailing_address_geocode_lng
FROM 
  public.leads_ins_info l
LEFT JOIN 
  public.addresses a ON l.address_id = a.id
LEFT JOIN 
  public.addresses ma ON l.mailing_address_id = ma.id;

COMMENT ON VIEW public.lead_details IS 'View that joins leads with their addresses for easier querying';

-- Recreate user_profiles view
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.avatar_url,
  u.role,
  u.created_at,
  u.updated_at,
  (SELECT count(*) AS count FROM public.leads_ins_info WHERE leads_ins_info.assigned_to = (u.id)::text) AS assigned_leads_count
FROM 
  public.users u;

-- Step 5: Update any functions that reference these tables
-- (No functions directly reference these tables in the schema)

-- Step 6: Add comments to the renamed tables
COMMENT ON TABLE public.leads_ins_info IS 'Stores insurance information for leads (renamed from leads)';
COMMENT ON TABLE public.leads_contact_info IS 'Stores contact information for leads (renamed from clients)';
