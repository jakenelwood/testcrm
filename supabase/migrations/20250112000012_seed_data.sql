-- =============================================================================
-- MIGRATION: Seed Data
-- =============================================================================
-- Description: Create migration with initial lookup data for statuses, insurance types, pipelines, and AI agents
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- LEAD STATUSES SEED DATA
-- =============================================================================

INSERT INTO public.lead_statuses (value, description, is_final, display_order, color_hex, icon_name, ai_action_template) VALUES
('New', 'Newly created lead requiring initial contact', FALSE, 1, '#3B82F6', 'user-plus', 'Make initial contact within 24 hours. Introduce yourself and gather basic information about their insurance needs.'),
('Contacted', 'Initial contact has been made', FALSE, 2, '#F59E0B', 'phone', 'Follow up within 3 days. Ask qualifying questions and schedule a detailed needs assessment.'),
('Qualified', 'Lead has been qualified and shows genuine interest', FALSE, 3, '#8B5CF6', 'check-circle', 'Prepare a customized quote based on their specific needs and risk profile.'),
('Quoted', 'Quote has been provided to the prospect', FALSE, 4, '#06B6D4', 'document-text', 'Follow up within 7 days to discuss the quote and address any questions or concerns.'),
('Negotiating', 'In active negotiations about terms or pricing', FALSE, 5, '#F97316', 'chat-bubble-left-right', 'Work with the prospect to find mutually acceptable terms. Consider alternative coverage options.'),
('Sold', 'Lead has been successfully converted to a client', TRUE, 6, '#10B981', 'check-badge', 'Process the policy, send welcome materials, and schedule onboarding call.'),
('Lost', 'Lead was not converted - no longer pursuing', TRUE, 7, '#EF4444', 'x-circle', 'Document the reason for loss and add to nurture campaign for future opportunities.'),
('Hibernated', 'Lead is temporarily inactive but may be revisited', FALSE, 8, '#6B7280', 'pause', 'Set reminder to follow up in 3-6 months. Keep in nurture campaign.');

-- =============================================================================
-- INSURANCE TYPES SEED DATA
-- =============================================================================

INSERT INTO public.insurance_types (name, is_personal, is_commercial, description, icon_name, form_schema, ai_prompt_template) VALUES
('Auto', TRUE, FALSE, 'Personal automobile insurance coverage', 'truck', 
'{"required_fields": ["vehicles", "drivers", "coverage_preferences"], "optional_fields": ["current_carrier", "policy_expiry"]}',
'Focus on vehicle safety features, driving history, and coverage needs. Ask about current coverage gaps and desired protection levels.'),

('Home', TRUE, FALSE, 'Homeowners and dwelling insurance', 'home', 
'{"required_fields": ["property_details", "coverage_amount", "deductible_preference"], "optional_fields": ["mortgage_info", "home_security"]}',
'Assess property value, replacement cost, and liability needs. Consider location-specific risks like floods or earthquakes.'),

('Renters', TRUE, FALSE, 'Renters insurance for personal property and liability', 'building-office', 
'{"required_fields": ["personal_property_value", "liability_coverage"], "optional_fields": ["additional_living_expenses"]}',
'Focus on personal property protection and liability coverage. Explain the importance of coverage for temporary living expenses.'),

('Specialty', TRUE, FALSE, 'High-value items and specialty coverage', 'sparkles', 
'{"required_fields": ["item_details", "appraisal_values"], "optional_fields": ["storage_location", "security_measures"]}',
'Identify valuable items requiring special coverage. Discuss appraisal requirements and coverage options for collectibles, jewelry, art.'),

('Commercial Auto', FALSE, TRUE, 'Business vehicle insurance coverage', 'truck', 
'{"required_fields": ["fleet_details", "business_use", "driver_info"], "optional_fields": ["cargo_coverage", "hired_auto"]}',
'Assess business vehicle needs, driver qualifications, and commercial use patterns. Consider cargo and hired auto coverage.'),

('General Liability', FALSE, TRUE, 'Business general liability insurance', 'shield-check', 
'{"required_fields": ["business_type", "revenue", "employee_count"], "optional_fields": ["professional_services", "product_liability"]}',
'Evaluate business operations, liability exposures, and industry-specific risks. Consider professional liability needs.'),

('Commercial Property', FALSE, TRUE, 'Business property and equipment coverage', 'building-office-2', 
'{"required_fields": ["property_value", "business_personal_property", "location_details"], "optional_fields": ["business_interruption", "equipment_breakdown"]}',
'Assess property values, business interruption needs, and equipment coverage requirements. Consider location-specific risks.'),

('Workers Compensation', FALSE, TRUE, 'Workers compensation insurance for employees', 'user-group', 
'{"required_fields": ["employee_count", "job_classifications", "payroll"], "optional_fields": ["safety_programs", "claims_history"]}',
'Review employee classifications, payroll information, and safety programs. Assess experience modification factors.');

-- =============================================================================
-- PIPELINES SEED DATA
-- =============================================================================

INSERT INTO public.pipelines (name, description, is_default, display_order, lead_type, insurance_types, conversion_goals, target_conversion_rate) VALUES
('Personal Insurance Pipeline', 'Standard pipeline for individual insurance prospects', TRUE, 1, 'Personal', 
ARRAY[1, 2, 3, 4], -- Auto, Home, Renters, Specialty
'{"primary_goal": "policy_sale", "secondary_goals": ["cross_sell", "referral"]}', 25.0),

('Commercial Insurance Pipeline', 'Pipeline for business insurance prospects', FALSE, 2, 'Business', 
ARRAY[5, 6, 7, 8], -- Commercial Auto, General Liability, Commercial Property, Workers Comp
'{"primary_goal": "policy_sale", "secondary_goals": ["multi_line", "renewal"]}', 20.0),

('High-Value Personal Pipeline', 'Specialized pipeline for high-net-worth individuals', FALSE, 3, 'Personal', 
ARRAY[2, 4], -- Home, Specialty
'{"primary_goal": "comprehensive_coverage", "secondary_goals": ["umbrella_policy", "trust_services"]}', 35.0);

-- =============================================================================
-- PIPELINE STATUSES SEED DATA
-- =============================================================================

-- Personal Insurance Pipeline Statuses
INSERT INTO public.pipeline_statuses (pipeline_id, name, description, is_final, display_order, color_hex, icon_name, stage_type, target_duration, ai_action_template, conversion_probability) VALUES
((SELECT id FROM public.pipelines WHERE name = 'Personal Insurance Pipeline'), 'New Lead', 'Fresh prospect in the system', FALSE, 1, '#3B82F6', 'user-plus', 'active', 1, 'Contact within 24 hours to introduce services and schedule needs assessment.', 15.0),
((SELECT id FROM public.pipelines WHERE name = 'Personal Insurance Pipeline'), 'Initial Contact', 'First contact made, gathering information', FALSE, 2, '#F59E0B', 'phone', 'active', 2, 'Complete needs assessment and gather detailed information about current coverage.', 25.0),
((SELECT id FROM public.pipelines WHERE name = 'Personal Insurance Pipeline'), 'Needs Assessment', 'Understanding coverage requirements', FALSE, 3, '#8B5CF6', 'clipboard-document-list', 'active', 3, 'Analyze coverage gaps and prepare customized quote recommendations.', 40.0),
((SELECT id FROM public.pipelines WHERE name = 'Personal Insurance Pipeline'), 'Quote Preparation', 'Preparing customized quote', FALSE, 4, '#06B6D4', 'document-text', 'active', 2, 'Present quote options and explain coverage benefits and value proposition.', 60.0),
((SELECT id FROM public.pipelines WHERE name = 'Personal Insurance Pipeline'), 'Quote Presented', 'Quote delivered to prospect', FALSE, 5, '#10B981', 'presentation-chart-line', 'waiting', 7, 'Follow up to address questions and guide toward decision.', 75.0),
((SELECT id FROM public.pipelines WHERE name = 'Personal Insurance Pipeline'), 'Policy Sold', 'Successfully converted to client', TRUE, 6, '#059669', 'check-badge', 'final', 0, 'Process policy and begin onboarding. Look for cross-sell opportunities.', 100.0),
((SELECT id FROM public.pipelines WHERE name = 'Personal Insurance Pipeline'), 'Lost', 'Prospect decided not to proceed', TRUE, 7, '#EF4444', 'x-circle', 'final', 0, 'Document loss reason and add to nurture campaign for future opportunities.', 0.0);

-- Commercial Insurance Pipeline Statuses
INSERT INTO public.pipeline_statuses (pipeline_id, name, description, is_final, display_order, color_hex, icon_name, stage_type, target_duration, ai_action_template, conversion_probability) VALUES
((SELECT id FROM public.pipelines WHERE name = 'Commercial Insurance Pipeline'), 'Business Inquiry', 'Initial business insurance inquiry', FALSE, 1, '#3B82F6', 'building-office', 'active', 2, 'Schedule business review meeting to understand operations and risk exposures.', 10.0),
((SELECT id FROM public.pipelines WHERE name = 'Commercial Insurance Pipeline'), 'Risk Assessment', 'Evaluating business risks and exposures', FALSE, 2, '#F59E0B', 'shield-exclamation', 'active', 5, 'Complete comprehensive risk assessment and identify coverage needs.', 20.0),
((SELECT id FROM public.pipelines WHERE name = 'Commercial Insurance Pipeline'), 'Proposal Development', 'Creating comprehensive insurance proposal', FALSE, 3, '#8B5CF6', 'document-duplicate', 'active', 7, 'Develop multi-line proposal with competitive pricing and comprehensive coverage.', 35.0),
((SELECT id FROM public.pipelines WHERE name = 'Commercial Insurance Pipeline'), 'Proposal Presented', 'Formal proposal delivered', FALSE, 4, '#06B6D4', 'presentation-chart-bar', 'waiting', 14, 'Schedule follow-up meeting to review proposal and address any concerns.', 50.0),
((SELECT id FROM public.pipelines WHERE name = 'Commercial Insurance Pipeline'), 'Negotiation', 'Discussing terms and adjustments', FALSE, 5, '#F97316', 'chat-bubble-left-right', 'active', 10, 'Work with prospect to refine coverage and terms to meet their needs and budget.', 70.0),
((SELECT id FROM public.pipelines WHERE name = 'Commercial Insurance Pipeline'), 'Policy Bound', 'Commercial policy successfully bound', TRUE, 6, '#059669', 'check-badge', 'final', 0, 'Complete policy setup and schedule risk management consultation.', 100.0),
((SELECT id FROM public.pipelines WHERE name = 'Commercial Insurance Pipeline'), 'Lost', 'Business decided not to proceed', TRUE, 7, '#EF4444', 'x-circle', 'final', 0, 'Document loss reason and maintain relationship for future opportunities.', 0.0);

-- High-Value Personal Pipeline Statuses
INSERT INTO public.pipeline_statuses (pipeline_id, name, description, is_final, display_order, color_hex, icon_name, stage_type, target_duration, ai_action_template, conversion_probability) VALUES
((SELECT id FROM public.pipelines WHERE name = 'High-Value Personal Pipeline'), 'Referral Received', 'High-value prospect referral', FALSE, 1, '#3B82F6', 'user-group', 'active', 1, 'Contact within 24 hours. Acknowledge referral source and schedule private consultation.', 20.0),
((SELECT id FROM public.pipelines WHERE name = 'High-Value Personal Pipeline'), 'Private Consultation', 'Detailed wealth protection review', FALSE, 2, '#F59E0B', 'academic-cap', 'active', 7, 'Conduct comprehensive wealth and asset review. Identify protection gaps.', 35.0),
((SELECT id FROM public.pipelines WHERE name = 'High-Value Personal Pipeline'), 'Asset Appraisal', 'Valuing high-value assets', FALSE, 3, '#8B5CF6', 'currency-dollar', 'active', 14, 'Coordinate professional appraisals and document asset values for coverage.', 50.0),
((SELECT id FROM public.pipelines WHERE name = 'High-Value Personal Pipeline'), 'Custom Proposal', 'Tailored high-value coverage proposal', FALSE, 4, '#06B6D4', 'document-chart-bar', 'active', 10, 'Present comprehensive protection strategy with specialized coverage options.', 65.0),
((SELECT id FROM public.pipelines WHERE name = 'High-Value Personal Pipeline'), 'Coverage Bound', 'High-value policy successfully bound', TRUE, 5, '#059669', 'shield-check', 'final', 0, 'Implement coverage and establish ongoing wealth protection relationship.', 100.0),
((SELECT id FROM public.pipelines WHERE name = 'High-Value Personal Pipeline'), 'Lost', 'Prospect decided not to proceed', TRUE, 6, '#EF4444', 'x-circle', 'final', 0, 'Maintain relationship and continue to provide value through market insights.', 0.0);

-- =============================================================================
-- AI AGENTS SEED DATA
-- =============================================================================

INSERT INTO public.ai_agents (name, description, role, agent_type, model_provider, model_name, temperature, capabilities, system_prompt, config) VALUES
('Lead Follow-up Assistant', 'Automated follow-up agent for lead nurturing and engagement', 'follow_up', 'assistant', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.7,
'{"email_generation": true, "sms_generation": true, "call_script_generation": true, "scheduling": true}',
'You are a professional insurance follow-up assistant. Your role is to help agents maintain consistent communication with leads through personalized, timely follow-ups. Always maintain a professional, helpful tone while being persistent but not pushy.',
'{"max_follow_ups": 5, "follow_up_intervals": [1, 3, 7, 14, 30], "personalization_level": "high"}'),

('Lead Insight Analyzer', 'AI agent that analyzes lead data to provide insights and recommendations', 'insight', 'analyzer', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.3,
'{"data_analysis": true, "pattern_recognition": true, "risk_assessment": true, "recommendation_generation": true}',
'You are an insurance data analyst AI. Analyze lead information, communication history, and behavioral patterns to provide actionable insights for agents. Focus on conversion probability, risk factors, and optimization opportunities.',
'{"analysis_depth": "comprehensive", "confidence_threshold": 0.8, "update_frequency": "daily"}'),

('Quote Recommendation Engine', 'AI agent specialized in generating personalized insurance quote recommendations', 'sales', 'generator', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.5,
'{"quote_generation": true, "coverage_optimization": true, "competitive_analysis": true, "pricing_strategy": true}',
'You are an insurance quote specialist AI. Generate personalized quote recommendations based on customer needs, risk profile, and market conditions. Always prioritize appropriate coverage while considering budget constraints.',
'{"quote_accuracy": "high", "coverage_optimization": true, "competitive_pricing": true}'),

('Customer Support Assistant', 'AI agent for handling customer inquiries and support requests', 'support', 'assistant', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.6,
'{"inquiry_handling": true, "policy_information": true, "claims_guidance": true, "escalation_management": true}',
'You are a helpful insurance customer support assistant. Provide accurate information about policies, coverage, and procedures. Always be empathetic and solution-focused when helping customers with their insurance needs.',
'{"response_time": "immediate", "escalation_threshold": "complex_issues", "knowledge_base": "comprehensive"}'),

('Marketing Campaign Optimizer', 'AI agent for optimizing marketing campaigns and content performance', 'marketing', 'analyzer', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.4,
'{"campaign_analysis": true, "content_optimization": true, "audience_segmentation": true, "performance_tracking": true}',
'You are a marketing optimization AI for insurance campaigns. Analyze campaign performance, optimize content for better engagement, and provide recommendations for improving conversion rates and ROI.',
'{"optimization_focus": "conversion_rate", "testing_framework": "ab_testing", "reporting_frequency": "weekly"}');

-- =============================================================================
-- CONTENT TEMPLATES SEED DATA
-- =============================================================================

INSERT INTO public.content_templates (name, description, template_type, category, subject, content, variables, personalization_fields) VALUES
('Welcome Email - New Lead', 'Initial welcome email for new insurance leads', 'Email', 'Lead Nurturing', 
'Welcome to {{company_name}} - Your Insurance Protection Starts Here',
'Dear {{first_name}},

Thank you for your interest in insurance coverage with {{company_name}}. We''re excited to help you find the perfect protection for your needs.

As your dedicated insurance advisor, I''m here to:
• Understand your unique coverage needs
• Provide personalized quote options
• Explain coverage benefits in simple terms
• Answer any questions you may have

I''ll be reaching out within 24 hours to schedule a brief consultation. In the meantime, feel free to reply to this email or call me directly at {{agent_phone}}.

Looking forward to protecting what matters most to you!

Best regards,
{{agent_name}}
{{company_name}}
{{agent_email}} | {{agent_phone}}',
'{"first_name": "Lead first name", "company_name": "Insurance company name", "agent_name": "Agent full name", "agent_phone": "Agent phone number", "agent_email": "Agent email"}',
ARRAY['first_name', 'company_name', 'agent_name']),

('Quote Follow-up SMS', 'SMS template for following up on delivered quotes', 'SMS', 'Quote Follow-up',
NULL,
'Hi {{first_name}}! This is {{agent_name}} from {{company_name}}. I wanted to follow up on the insurance quote I sent you. Do you have any questions? Reply STOP to opt out.',
'{"first_name": "Lead first name", "agent_name": "Agent first name", "company_name": "Company name"}',
ARRAY['first_name', 'agent_name']),

('Initial Contact Call Script', 'Script for making initial contact with new leads', 'Call Script', 'Lead Contact',
NULL,
'Hi {{first_name}}, this is {{agent_name}} from {{company_name}}. Thank you for your interest in insurance coverage.

I have about 5 minutes to learn about your current insurance situation and see how we might be able to help you save money or improve your coverage.

Is now a good time to chat, or would you prefer I call back at a more convenient time?

[If yes, continue with needs assessment questions]
[If no, schedule callback]

Key questions to ask:
1. What type of insurance are you looking for?
2. Do you currently have coverage?
3. When does your current policy expire?
4. What''s most important to you - price, coverage, or service?
5. Have you had any claims in the past 3 years?',
'{"first_name": "Lead first name", "agent_name": "Agent full name", "company_name": "Company name"}',
ARRAY['first_name', 'agent_name']);

-- =============================================================================
-- CAMPAIGNS SEED DATA
-- =============================================================================

INSERT INTO public.campaigns (name, description, campaign_type, status, start_date, end_date, budget, target_audience, goals) VALUES
('New Lead Welcome Series', 'Automated email series for new insurance leads', 'Email', 'Active', 
NOW(), NOW() + INTERVAL '1 year', 5000.00,
'{"lead_status": ["New", "Contacted"], "insurance_types": ["Auto", "Home"], "demographics": "all"}',
'{"primary": "engagement", "secondary": "conversion", "kpis": ["open_rate", "click_rate", "response_rate"]}'),

('Quote Follow-up Campaign', 'Multi-channel follow-up for delivered quotes', 'Email', 'Active',
NOW(), NOW() + INTERVAL '6 months', 3000.00,
'{"lead_status": ["Quoted"], "days_since_quote": [3, 7, 14]}',
'{"primary": "conversion", "secondary": "objection_handling", "kpis": ["conversion_rate", "response_rate"]}'),

('Referral Incentive Program', 'Campaign to encourage client referrals', 'Email', 'Draft',
NOW() + INTERVAL '1 month', NOW() + INTERVAL '1 year', 10000.00,
'{"client_status": "Active", "policy_age": ">6 months", "satisfaction_score": ">8"}',
'{"primary": "referrals", "secondary": "retention", "kpis": ["referral_count", "referral_conversion"]}');

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Create schema_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.schema_versions (version, description) VALUES
('1.0.0', 'Initial insurance CRM schema with comprehensive seed data - Production ready')
ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.lead_statuses IS 'Seeded with standard insurance sales process statuses';
COMMENT ON TABLE public.insurance_types IS 'Seeded with common personal and commercial insurance types';
COMMENT ON TABLE public.pipelines IS 'Seeded with standard insurance sales pipelines';
COMMENT ON TABLE public.pipeline_statuses IS 'Seeded with pipeline-specific status progressions';
COMMENT ON TABLE public.ai_agents IS 'Seeded with specialized AI agents for insurance operations';
