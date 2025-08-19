-- Migration 003: Migrate Existing Data to Modular Structure
-- Migrates data from old leads/clients structure to new modular CRM

BEGIN;

-- =====================================================
-- STEP 1: Migrate Clients to Contacts
-- =====================================================

INSERT INTO contacts (
    id,
    name,
    email,
    phone_number,
    contact_type,
    status,
    address_id,
    mailing_address_id,
    
    -- Business fields (assuming clients can be businesses)
    industry,
    annual_revenue,
    
    -- AI fields
    ai_risk_score,
    ai_lifetime_value,
    ai_churn_probability,
    ai_insights,
    
    -- Metadata
    metadata,
    
    -- Audit fields
    created_by,
    created_at,
    updated_at
)
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone_number,
    COALESCE(c.client_type, 'individual')::TEXT as contact_type,
    'client'::TEXT as status, -- All existing clients become 'client' status
    c.address_id,
    c.mailing_address_id,
    
    -- Business fields
    c.industry,
    c.annual_revenue,
    
    -- AI fields
    c.ai_risk_score,
    c.ai_lifetime_value,
    c.ai_churn_probability,
    COALESCE(c.ai_insights, '{}'::jsonb),
    
    -- Metadata
    COALESCE(c.metadata, '{}'::jsonb),
    
    -- Audit fields
    c.created_by,
    c.created_at,
    c.updated_at
FROM clients c
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE contacts.id = c.id);

-- =====================================================
-- STEP 2: Migrate Leads to Contacts
-- =====================================================

-- First, let's check what fields actually exist in the leads table
-- and migrate what we can to the contacts table

INSERT INTO contacts (
    id,
    name,
    email,
    phone_number,
    contact_type,
    status,
    address_id,
    
    -- Personal fields (if they exist in leads)
    date_of_birth,
    occupation,
    
    -- AI fields
    ai_risk_score,
    ai_insights,
    
    -- CRM fields
    source,
    last_contact_at,
    
    -- Metadata
    metadata,
    
    -- Audit fields
    created_by,
    created_at,
    updated_at
)
SELECT 
    l.id,
    -- Construct name from available fields
    CASE 
        WHEN l.first_name IS NOT NULL AND l.last_name IS NOT NULL 
        THEN l.first_name || ' ' || l.last_name
        WHEN l.company_name IS NOT NULL 
        THEN l.company_name
        ELSE COALESCE(l.first_name, l.last_name, 'Unknown Lead')
    END as name,
    l.email,
    l.phone_number,
    CASE 
        WHEN l.company_name IS NOT NULL THEN 'business'
        ELSE 'individual'
    END as contact_type,
    COALESCE(l.status, 'lead')::TEXT as status,
    l.address_id,
    
    -- Personal fields
    l.date_of_birth,
    l.occupation,
    
    -- AI fields
    l.ai_risk_score,
    COALESCE(l.ai_insights, '{}'::jsonb),
    
    -- CRM fields
    l.lead_source as source,
    l.last_contact_at,
    
    -- Metadata - combine various lead fields into metadata
    jsonb_build_object(
        'original_lead_type', l.lead_type,
        'priority', l.priority,
        'company_name', l.company_name,
        'job_title', l.job_title,
        'notes', l.notes,
        'migrated_from', 'leads_table'
    ) as metadata,
    
    -- Audit fields
    l.created_by,
    l.created_at,
    l.updated_at
FROM leads l
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE contacts.id = l.id);

-- =====================================================
-- STEP 3: Create Insurance Profiles for Contacts with Insurance Data
-- =====================================================

-- Create insurance profiles for contacts that have insurance-related data
INSERT INTO insurance_profiles (
    contact_id,
    current_carrier,
    current_policy_expiry,
    
    -- Extract insurance data from leads table if it exists
    auto_data,
    home_data,
    commercial_data,
    
    -- Risk and preferences
    risk_factors,
    coverage_preferences,
    
    -- AI insights
    ai_risk_assessment,
    ai_coverage_recommendations,
    
    -- Metadata
    metadata,
    notes,
    
    -- Audit fields
    created_by,
    created_at,
    updated_at
)
SELECT 
    c.id as contact_id,
    
    -- Extract current carrier info if available
    (c.metadata->>'current_carrier')::TEXT as current_carrier,
    (c.metadata->>'policy_expiry')::DATE as current_policy_expiry,
    
    -- Build insurance data structures from available fields
    CASE 
        WHEN c.metadata ? 'vehicle_info' OR c.metadata ? 'auto_info'
        THEN jsonb_build_object(
            'vehicles', COALESCE(c.metadata->'vehicle_info', c.metadata->'auto_info', '[]'::jsonb),
            'drivers', COALESCE(c.metadata->'drivers', '[]'::jsonb)
        )
        ELSE '{}'::jsonb
    END as auto_data,
    
    CASE 
        WHEN c.metadata ? 'property_info' OR c.metadata ? 'home_info'
        THEN jsonb_build_object(
            'properties', COALESCE(c.metadata->'property_info', c.metadata->'home_info', '[]'::jsonb)
        )
        ELSE '{}'::jsonb
    END as home_data,
    
    CASE 
        WHEN c.contact_type = 'business' AND c.metadata ? 'business_info'
        THEN c.metadata->'business_info'
        ELSE '{}'::jsonb
    END as commercial_data,
    
    -- Risk factors
    jsonb_build_object(
        'credit_score', c.metadata->'credit_score',
        'driving_record', c.metadata->'driving_record',
        'claims_history', c.metadata->'claims_history'
    ) as risk_factors,
    
    -- Coverage preferences
    jsonb_build_object(
        'preferred_deductible', c.metadata->'preferred_deductible',
        'coverage_limits', c.metadata->'coverage_limits'
    ) as coverage_preferences,
    
    -- AI insights
    COALESCE(c.ai_insights->'insurance', '{}'::jsonb) as ai_risk_assessment,
    COALESCE(c.ai_insights->'recommendations', '{}'::jsonb) as ai_coverage_recommendations,
    
    -- Metadata
    jsonb_build_object(
        'migrated_from', 'contacts_metadata',
        'original_data', c.metadata
    ) as metadata,
    
    (c.metadata->>'insurance_notes')::TEXT as notes,
    
    -- Audit fields
    c.created_by,
    c.created_at,
    c.updated_at
FROM contacts c
WHERE 
    -- Only create insurance profiles for contacts that have insurance-related data
    (c.metadata ? 'vehicle_info' OR 
     c.metadata ? 'auto_info' OR 
     c.metadata ? 'property_info' OR 
     c.metadata ? 'home_info' OR 
     c.metadata ? 'business_info' OR
     c.metadata ? 'current_carrier')
    AND NOT EXISTS (SELECT 1 FROM insurance_profiles WHERE contact_id = c.id);

-- =====================================================
-- STEP 4: Create Opportunities for Active Leads/Prospects
-- =====================================================

-- Create opportunities for contacts that are in active sales stages
INSERT INTO opportunities (
    contact_id,
    pipeline_id,
    stage_id,
    name,
    description,
    value,
    probability,
    expected_close_date,
    status,
    ai_insights,
    metadata,
    created_by,
    created_at,
    updated_at
)
SELECT 
    c.id as contact_id,
    
    -- Try to map to existing pipelines based on contact type
    (SELECT id FROM pipelines 
     WHERE (c.contact_type = 'individual' AND lead_type = 'Personal') 
        OR (c.contact_type = 'business' AND lead_type = 'Business')
        OR lead_type = 'Both'
     LIMIT 1) as pipeline_id,
    
    -- Map to appropriate pipeline stage based on contact status
    (SELECT ps.id FROM pipeline_statuses ps 
     JOIN pipelines p ON ps.pipeline_id = p.id
     WHERE ps.name ILIKE '%' || c.status || '%' 
        OR (c.status = 'lead' AND ps.name ILIKE '%new%')
        OR (c.status = 'prospect' AND ps.name ILIKE '%qualified%')
     LIMIT 1) as stage_id,
    
    -- Generate opportunity name
    CASE 
        WHEN c.contact_type = 'business' THEN c.name || ' - Business Insurance'
        ELSE c.name || ' - Personal Insurance'
    END as name,
    
    'Migrated opportunity from ' || c.status || ' status' as description,
    
    -- Estimate value based on AI lifetime value or default
    COALESCE(c.ai_lifetime_value, 2000.00) as value,
    
    -- Set probability based on status
    CASE 
        WHEN c.status = 'lead' THEN 25
        WHEN c.status = 'prospect' THEN 50
        WHEN c.status = 'client' THEN 100
        ELSE 10
    END as probability,
    
    -- Set expected close date
    CASE 
        WHEN c.status = 'client' THEN CURRENT_DATE
        WHEN c.next_contact_at IS NOT NULL THEN c.next_contact_at::DATE
        ELSE CURRENT_DATE + INTERVAL '30 days'
    END as expected_close_date,
    
    -- Set opportunity status
    CASE 
        WHEN c.status = 'client' THEN 'closed-won'
        WHEN c.status = 'inactive' THEN 'closed-lost'
        ELSE 'open'
    END as status,
    
    -- AI insights
    COALESCE(c.ai_insights, '{}'::jsonb) as ai_insights,
    
    -- Metadata
    jsonb_build_object(
        'migrated_from', 'contact_status',
        'original_status', c.status,
        'contact_type', c.contact_type
    ) as metadata,
    
    -- Audit fields
    c.created_by,
    c.created_at,
    c.updated_at
FROM contacts c
WHERE c.status IN ('lead', 'prospect', 'client')
    AND NOT EXISTS (SELECT 1 FROM opportunities WHERE contact_id = c.id);

-- =====================================================
-- STEP 5: Migrate Communications to Activities
-- =====================================================

INSERT INTO activities (
    id,
    contact_id,
    opportunity_id,
    type,
    direction,
    subject,
    content,
    duration,
    call_quality_score,
    status,
    completed_at,
    ai_summary,
    ai_sentiment,
    ai_insights,
    metadata,
    created_by,
    created_at,
    updated_at
)
SELECT 
    comm.id,
    
    -- Link to contact (prefer lead_id, fallback to client_id)
    COALESCE(comm.lead_id, comm.client_id) as contact_id,
    
    -- Link to opportunity if one exists for this contact
    (SELECT id FROM opportunities 
     WHERE contact_id = COALESCE(comm.lead_id, comm.client_id) 
     LIMIT 1) as opportunity_id,
    
    comm.type,
    comm.direction,
    comm.subject,
    comm.content,
    comm.duration,
    comm.call_quality_score,
    
    -- Map communication status to activity status
    CASE 
        WHEN comm.status IN ('Delivered', 'Sent', 'Opened', 'Replied') THEN 'completed'
        WHEN comm.status IN ('Failed', 'Bounced') THEN 'failed'
        ELSE 'completed'
    END as status,
    
    COALESCE(comm.completed_at, comm.created_at) as completed_at,
    comm.ai_summary,
    comm.ai_sentiment,
    COALESCE(comm.ai_insights, '{}'::jsonb) as ai_insights,
    
    -- Metadata
    jsonb_build_object(
        'original_status', comm.status,
        'migrated_from', 'communications',
        'campaign_id', comm.campaign_id,
        'template_id', comm.content_template_id
    ) as metadata,
    
    comm.created_by,
    comm.created_at,
    comm.updated_at
FROM communications comm
WHERE COALESCE(comm.lead_id, comm.client_id) IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM activities WHERE activities.id = comm.id);

-- =====================================================
-- STEP 6: Migrate Quotes to Insurance Quotes
-- =====================================================

INSERT INTO insurance_quotes (
    id,
    opportunity_id,
    insurance_type_id,
    quote_number,
    premium_amount,
    deductible,
    contract_term,
    effective_date,
    expiration_date,
    coverage_details,
    status,
    ai_risk_assessment,
    ai_pricing_factors,
    ai_recommendations,
    metadata,
    notes,
    created_by,
    created_at,
    updated_at
)
SELECT 
    q.id,
    
    -- Link to opportunity for this lead
    (SELECT id FROM opportunities 
     WHERE contact_id = q.lead_id 
     LIMIT 1) as opportunity_id,
    
    q.insurance_type_id,
    q.quote_number,
    q.premium_amount,
    q.deductible,
    q.contract_term,
    q.effective_date,
    q.expiration_date,
    
    -- Build coverage details from existing quote data
    jsonb_build_object(
        'coverage_limits', COALESCE(q.coverage_limits, '{}'::jsonb),
        'policy_details', COALESCE(q.metadata->'policy_details', '{}'::jsonb)
    ) as coverage_details,
    
    q.status,
    COALESCE(q.ai_risk_assessment, '{}'::jsonb) as ai_risk_assessment,
    COALESCE(q.ai_pricing_factors, '{}'::jsonb) as ai_pricing_factors,
    COALESCE(q.ai_recommendations, '{}'::jsonb) as ai_recommendations,
    
    -- Metadata
    jsonb_build_object(
        'migrated_from', 'quotes',
        'original_metadata', COALESCE(q.metadata, '{}'::jsonb)
    ) as metadata,
    
    q.notes,
    q.created_by,
    q.created_at,
    q.updated_at
FROM quotes q
WHERE q.lead_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM contacts WHERE id = q.lead_id)
    AND NOT EXISTS (SELECT 1 FROM insurance_quotes WHERE insurance_quotes.id = q.id);

COMMIT;

-- Add migration tracking
INSERT INTO schema_migrations (version, description, executed_at) 
VALUES ('003', 'Migrate existing data to modular structure', NOW())
ON CONFLICT (version) DO NOTHING;
