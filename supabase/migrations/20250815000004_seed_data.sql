-- 🌱 Seed Data for Unified AI-Native Insurance CRM
-- Provides essential lookup data and sample workspace

BEGIN;

-- =============================================================================
-- INSURANCE TYPES SEED DATA
-- =============================================================================

INSERT INTO insurance_types (id, name, category, description, icon_name, form_schema, ai_prompt_template, display_order) VALUES
-- Personal Lines
(1, 'Auto Insurance', 'personal', 'Vehicle insurance coverage', 'car', 
 '{"fields": [{"name": "vehicles", "type": "array"}, {"name": "drivers", "type": "array"}, {"name": "coverage_limits", "type": "object"}]}',
 'Analyze auto insurance needs based on vehicles, drivers, and usage patterns. Consider safety features, driving history, and coverage preferences.',
 1),

(2, 'Homeowners Insurance', 'personal', 'Home and property coverage', 'home',
 '{"fields": [{"name": "property_details", "type": "object"}, {"name": "coverage_amounts", "type": "object"}, {"name": "deductibles", "type": "object"}]}',
 'Evaluate homeowners insurance requirements based on property characteristics, location risks, and personal property values.',
 2),

(3, 'Renters Insurance', 'personal', 'Tenant property and liability coverage', 'apartment',
 '{"fields": [{"name": "personal_property", "type": "object"}, {"name": "liability_limits", "type": "number"}, {"name": "additional_living_expenses", "type": "number"}]}',
 'Assess renters insurance needs focusing on personal property protection and liability coverage.',
 3),

(4, 'Umbrella Insurance', 'personal', 'Excess liability protection', 'umbrella',
 '{"fields": [{"name": "underlying_policies", "type": "array"}, {"name": "coverage_amount", "type": "number"}, {"name": "risk_factors", "type": "array"}]}',
 'Determine umbrella insurance requirements based on asset protection needs and liability exposure.',
 4),

(5, 'Motorcycle Insurance', 'personal', 'Motorcycle coverage', 'motorcycle',
 '{"fields": [{"name": "motorcycle_details", "type": "object"}, {"name": "usage_type", "type": "string"}, {"name": "safety_course", "type": "boolean"}]}',
 'Analyze motorcycle insurance needs considering bike type, usage, and rider experience.',
 5),

(6, 'Boat Insurance', 'personal', 'Watercraft coverage', 'boat',
 '{"fields": [{"name": "boat_details", "type": "object"}, {"name": "navigation_area", "type": "string"}, {"name": "storage_type", "type": "string"}]}',
 'Evaluate boat insurance requirements based on vessel type, usage, and navigation areas.',
 6),

(7, 'RV Insurance', 'personal', 'Recreational vehicle coverage', 'rv',
 '{"fields": [{"name": "rv_details", "type": "object"}, {"name": "usage_frequency", "type": "string"}, {"name": "full_timer", "type": "boolean"}]}',
 'Assess RV insurance needs considering vehicle type, usage patterns, and living arrangements.',
 7),

-- Commercial Lines
(10, 'General Liability', 'commercial', 'Business liability protection', 'shield',
 '{"fields": [{"name": "business_type", "type": "string"}, {"name": "revenue", "type": "number"}, {"name": "employees", "type": "number"}]}',
 'Analyze general liability insurance needs based on business operations, revenue, and risk exposure.',
 10),

(11, 'Commercial Property', 'commercial', 'Business property coverage', 'building',
 '{"fields": [{"name": "property_locations", "type": "array"}, {"name": "business_personal_property", "type": "object"}, {"name": "business_income", "type": "object"}]}',
 'Evaluate commercial property insurance requirements for buildings, equipment, and business income protection.',
 11),

(12, 'Workers Compensation', 'commercial', 'Employee injury coverage', 'hard-hat',
 '{"fields": [{"name": "employee_classes", "type": "array"}, {"name": "payroll", "type": "object"}, {"name": "safety_programs", "type": "array"}]}',
 'Determine workers compensation needs based on employee classifications, payroll, and safety measures.',
 12),

(13, 'Commercial Auto', 'commercial', 'Business vehicle coverage', 'truck',
 '{"fields": [{"name": "fleet_details", "type": "array"}, {"name": "driver_requirements", "type": "object"}, {"name": "usage_radius", "type": "string"}]}',
 'Assess commercial auto insurance for business vehicles, considering fleet size, usage, and driver qualifications.',
 13),

(14, 'Professional Liability', 'commercial', 'Errors and omissions coverage', 'briefcase',
 '{"fields": [{"name": "profession", "type": "string"}, {"name": "services_provided", "type": "array"}, {"name": "prior_acts_coverage", "type": "boolean"}]}',
 'Analyze professional liability insurance needs based on services provided and professional risk exposure.',
 14),

(15, 'Cyber Liability', 'commercial', 'Data breach and cyber attack coverage', 'shield-check',
 '{"fields": [{"name": "data_types", "type": "array"}, {"name": "security_measures", "type": "array"}, {"name": "revenue_dependency", "type": "string"}]}',
 'Evaluate cyber liability insurance requirements based on data handling, technology dependence, and security measures.',
 15),

-- Specialty Lines
(20, 'Valuable Items', 'specialty', 'High-value personal property', 'diamond',
 '{"fields": [{"name": "item_categories", "type": "array"}, {"name": "appraisal_values", "type": "object"}, {"name": "security_measures", "type": "array"}]}',
 'Assess valuable items insurance for jewelry, art, collectibles, and other high-value personal property.',
 20),

(21, 'Life Insurance', 'specialty', 'Life insurance protection', 'heart',
 '{"fields": [{"name": "coverage_amount", "type": "number"}, {"name": "beneficiaries", "type": "array"}, {"name": "health_status", "type": "object"}]}',
 'Determine life insurance needs based on financial obligations, dependents, and protection goals.',
 21),

(22, 'Disability Insurance', 'specialty', 'Income protection coverage', 'user-injured',
 '{"fields": [{"name": "occupation", "type": "string"}, {"name": "income", "type": "number"}, {"name": "benefit_period", "type": "string"}]}',
 'Analyze disability insurance requirements for income protection based on occupation and financial needs.',
 22);

-- =============================================================================
-- SAMPLE WORKSPACE AND USER
-- =============================================================================

-- Create a sample workspace for development/testing
INSERT INTO workspaces (id, name, agency_license, agency_type, primary_lines, timezone, subscription_tier, max_users, max_contacts) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Insurance Agency', 'INS-12345', 'Independent', 
 '["auto", "home", "commercial"]', 'America/Chicago', 'professional', 25, 10000);

-- =============================================================================
-- SAMPLE PIPELINES
-- =============================================================================

INSERT INTO pipelines (id, workspace_id, name, description, pipeline_type, insurance_category, is_default, stages) VALUES
(1, '550e8400-e29b-41d4-a716-446655440000', 'Personal Lines Sales', 'Standard personal insurance sales process', 'sales', 'personal', true,
 '[
   {"name": "Lead", "order": 1, "color": "#3B82F6"},
   {"name": "Qualified", "order": 2, "color": "#8B5CF6"},
   {"name": "Quote Requested", "order": 3, "color": "#F59E0B"},
   {"name": "Quote Presented", "order": 4, "color": "#EF4444"},
   {"name": "Negotiation", "order": 5, "color": "#EC4899"},
   {"name": "Sold", "order": 6, "color": "#10B981"},
   {"name": "Lost", "order": 7, "color": "#6B7280"}
 ]'),

(2, '550e8400-e29b-41d4-a716-446655440000', 'Commercial Lines Sales', 'Commercial insurance sales process', 'sales', 'commercial', false,
 '[
   {"name": "Prospect", "order": 1, "color": "#3B82F6"},
   {"name": "Needs Analysis", "order": 2, "color": "#8B5CF6"},
   {"name": "Risk Assessment", "order": 3, "color": "#F59E0B"},
   {"name": "Quote Development", "order": 4, "color": "#EF4444"},
   {"name": "Proposal", "order": 5, "color": "#EC4899"},
   {"name": "Negotiation", "order": 6, "color": "#F97316"},
   {"name": "Bound", "order": 7, "color": "#10B981"},
   {"name": "Declined", "order": 8, "color": "#6B7280"}
 ]'),

(3, '550e8400-e29b-41d4-a716-446655440000', 'Policy Renewal', 'Existing policy renewal process', 'service', 'personal', false,
 '[
   {"name": "Renewal Notice", "order": 1, "color": "#3B82F6"},
   {"name": "Review Needed", "order": 2, "color": "#F59E0B"},
   {"name": "Quote Updated", "order": 3, "color": "#8B5CF6"},
   {"name": "Customer Review", "order": 4, "color": "#EC4899"},
   {"name": "Renewed", "order": 5, "color": "#10B981"},
   {"name": "Non-Renewed", "order": 6, "color": "#6B7280"}
 ]');

-- =============================================================================
-- SAMPLE TASKS FOR DEVELOPMENT
-- =============================================================================

-- Note: These will be created when users are added to the system
-- The tasks reference user IDs which will be created during user registration

-- =============================================================================
-- CONFIGURATION AND SETTINGS
-- =============================================================================

-- Update schema version tracking
INSERT INTO schema_versions (version, description) VALUES
('2.0.0', 'Unified AI-Native Insurance CRM Schema - Complete rebuild with vector embeddings and multi-tenancy')
ON CONFLICT (version) DO UPDATE SET 
  description = EXCLUDED.description,
  applied_at = now();

-- Set up default configuration
UPDATE workspaces 
SET settings = jsonb_build_object(
  'ai_features_enabled', true,
  'embedding_model', 'voyage-3-large',
  'embedding_dimensions', 1024,
  'auto_generate_summaries', true,
  'risk_scoring_enabled', true,
  'default_pipeline_id', 1,
  'require_license_verification', true,
  'enable_real_time_updates', true
)
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

COMMIT;
