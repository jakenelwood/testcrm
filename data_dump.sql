SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."campaigns" ("id", "name", "description", "campaign_type", "status", "start_date", "end_date", "budget", "target_audience", "goals", "success_metrics", "audience_filters", "geographic_targeting", "demographic_targeting", "total_sent", "total_delivered", "total_opened", "total_clicked", "total_converted", "total_cost", "ai_optimization_enabled", "ai_insights", "ai_recommendations", "metadata", "tags", "created_by", "updated_by", "created_at", "updated_at") VALUES
	('3905852a-3fa1-47b4-a036-e8a8833eceb9', 'New Lead Welcome Series', 'Automated email series for new insurance leads', 'Email', 'Active', '2025-08-12 02:15:58.003175+00', '2026-08-12 02:15:58.003175+00', 5000.00, '{"lead_status": ["New", "Contacted"], "demographics": "all", "insurance_types": ["Auto", "Home"]}', '{"kpis": ["open_rate", "click_rate", "response_rate"], "primary": "engagement", "secondary": "conversion"}', '{}', '{}', '{}', '{}', 0, 0, 0, 0, 0, 0.00, false, '{}', '{}', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	('d7fc1d53-60b1-49a6-94ce-cb469f029849', 'Quote Follow-up Campaign', 'Multi-channel follow-up for delivered quotes', 'Email', 'Active', '2025-08-12 02:15:58.003175+00', '2026-02-12 02:15:58.003175+00', 3000.00, '{"lead_status": ["Quoted"], "days_since_quote": [3, 7, 14]}', '{"kpis": ["conversion_rate", "response_rate"], "primary": "conversion", "secondary": "objection_handling"}', '{}', '{}', '{}', '{}', 0, 0, 0, 0, 0, 0.00, false, '{}', '{}', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	('26c12c6c-5cbc-4474-a967-64692407a99b', 'Referral Incentive Program', 'Campaign to encourage client referrals', 'Email', 'Draft', '2025-09-12 02:15:58.003175+00', '2026-08-12 02:15:58.003175+00', 10000.00, '{"policy_age": ">6 months", "client_status": "Active", "satisfaction_score": ">8"}', '{"kpis": ["referral_count", "referral_conversion"], "primary": "referrals", "secondary": "retention"}', '{}', '{}', '{}', '{}', 0, 0, 0, 0, 0, 0.00, false, '{}', '{}', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00');


--
-- Data for Name: ab_tests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ai_agents" ("id", "name", "description", "role", "agent_type", "model_provider", "model_name", "temperature", "max_tokens", "capabilities", "tools", "system_prompt", "config", "settings", "total_interactions", "successful_interactions", "average_response_time", "last_performance_review", "is_active", "is_learning", "version", "metadata", "tags", "created_by", "updated_by", "created_at", "updated_at", "last_used_at") VALUES
	('27f0d141-f4ab-4355-b8da-737d6cd61994', 'Lead Follow-up Assistant', 'Automated follow-up agent for lead nurturing and engagement', 'follow_up', 'assistant', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.70, 4000, '{"scheduling": true, "sms_generation": true, "email_generation": true, "call_script_generation": true}', '[]', 'You are a professional insurance follow-up assistant. Your role is to help agents maintain consistent communication with leads through personalized, timely follow-ups. Always maintain a professional, helpful tone while being persistent but not pushy.', '{"max_follow_ups": 5, "follow_up_intervals": [1, 3, 7, 14, 30], "personalization_level": "high"}', '{}', 0, 0, NULL, NULL, true, true, '1.0.0', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00', NULL),
	('cac75161-6a6f-4679-b1dc-a228e737cdab', 'Lead Insight Analyzer', 'AI agent that analyzes lead data to provide insights and recommendations', 'insight', 'analyzer', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.30, 4000, '{"data_analysis": true, "risk_assessment": true, "pattern_recognition": true, "recommendation_generation": true}', '[]', 'You are an insurance data analyst AI. Analyze lead information, communication history, and behavioral patterns to provide actionable insights for agents. Focus on conversion probability, risk factors, and optimization opportunities.', '{"analysis_depth": "comprehensive", "update_frequency": "daily", "confidence_threshold": 0.8}', '{}', 0, 0, NULL, NULL, true, true, '1.0.0', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00', NULL),
	('b282bc9b-3d7b-4ab0-bf6e-63b83fe27405', 'Quote Recommendation Engine', 'AI agent specialized in generating personalized insurance quote recommendations', 'sales', 'generator', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.50, 4000, '{"pricing_strategy": true, "quote_generation": true, "competitive_analysis": true, "coverage_optimization": true}', '[]', 'You are an insurance quote specialist AI. Generate personalized quote recommendations based on customer needs, risk profile, and market conditions. Always prioritize appropriate coverage while considering budget constraints.', '{"quote_accuracy": "high", "competitive_pricing": true, "coverage_optimization": true}', '{}', 0, 0, NULL, NULL, true, true, '1.0.0', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00', NULL),
	('fe98ef32-2ac6-4733-aae8-c72c2eda205a', 'Customer Support Assistant', 'AI agent for handling customer inquiries and support requests', 'support', 'assistant', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.60, 4000, '{"claims_guidance": true, "inquiry_handling": true, "policy_information": true, "escalation_management": true}', '[]', 'You are a helpful insurance customer support assistant. Provide accurate information about policies, coverage, and procedures. Always be empathetic and solution-focused when helping customers with their insurance needs.', '{"response_time": "immediate", "knowledge_base": "comprehensive", "escalation_threshold": "complex_issues"}', '{}', 0, 0, NULL, NULL, true, true, '1.0.0', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00', NULL),
	('819c0aab-deb5-4d30-983c-a276bc80182b', 'Marketing Campaign Optimizer', 'AI agent for optimizing marketing campaigns and content performance', 'marketing', 'analyzer', 'deepinfra', 'deepseek-ai/DeepSeek-V3-0324', 0.40, 4000, '{"campaign_analysis": true, "content_optimization": true, "performance_tracking": true, "audience_segmentation": true}', '[]', 'You are a marketing optimization AI for insurance campaigns. Analyze campaign performance, optimize content for better engagement, and provide recommendations for improving conversion rates and ROI.', '{"testing_framework": "ab_testing", "optimization_focus": "conversion_rate", "reporting_frequency": "weekly"}', '{}', 0, 0, NULL, NULL, true, true, '1.0.0', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00', NULL);


--
-- Data for Name: agent_memory; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: insurance_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."insurance_types" ("id", "name", "is_personal", "is_commercial", "description", "icon_name", "form_schema", "required_fields", "optional_fields", "ai_prompt_template", "ai_risk_factors", "display_order", "is_active", "created_at", "updated_at") VALUES
	(17, 'Auto', true, false, 'Personal automobile insurance coverage', 'truck', '{"optional_fields": ["current_carrier", "policy_expiry"], "required_fields": ["vehicles", "drivers", "coverage_preferences"]}', '{}', '{}', 'Focus on vehicle safety features, driving history, and coverage needs. Ask about current coverage gaps and desired protection levels.', '{}', NULL, true, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(18, 'Home', true, false, 'Homeowners and dwelling insurance', 'home', '{"optional_fields": ["mortgage_info", "home_security"], "required_fields": ["property_details", "coverage_amount", "deductible_preference"]}', '{}', '{}', 'Assess property value, replacement cost, and liability needs. Consider location-specific risks like floods or earthquakes.', '{}', NULL, true, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(19, 'Renters', true, false, 'Renters insurance for personal property and liability', 'building-office', '{"optional_fields": ["additional_living_expenses"], "required_fields": ["personal_property_value", "liability_coverage"]}', '{}', '{}', 'Focus on personal property protection and liability coverage. Explain the importance of coverage for temporary living expenses.', '{}', NULL, true, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(20, 'Specialty', true, false, 'High-value items and specialty coverage', 'sparkles', '{"optional_fields": ["storage_location", "security_measures"], "required_fields": ["item_details", "appraisal_values"]}', '{}', '{}', 'Identify valuable items requiring special coverage. Discuss appraisal requirements and coverage options for collectibles, jewelry, art.', '{}', NULL, true, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(21, 'Commercial Auto', false, true, 'Business vehicle insurance coverage', 'truck', '{"optional_fields": ["cargo_coverage", "hired_auto"], "required_fields": ["fleet_details", "business_use", "driver_info"]}', '{}', '{}', 'Assess business vehicle needs, driver qualifications, and commercial use patterns. Consider cargo and hired auto coverage.', '{}', NULL, true, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(22, 'General Liability', false, true, 'Business general liability insurance', 'shield-check', '{"optional_fields": ["professional_services", "product_liability"], "required_fields": ["business_type", "revenue", "employee_count"]}', '{}', '{}', 'Evaluate business operations, liability exposures, and industry-specific risks. Consider professional liability needs.', '{}', NULL, true, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(23, 'Commercial Property', false, true, 'Business property and equipment coverage', 'building-office-2', '{"optional_fields": ["business_interruption", "equipment_breakdown"], "required_fields": ["property_value", "business_personal_property", "location_details"]}', '{}', '{}', 'Assess property values, business interruption needs, and equipment coverage requirements. Consider location-specific risks.', '{}', NULL, true, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(24, 'Workers Compensation', false, true, 'Workers compensation insurance for employees', 'user-group', '{"optional_fields": ["safety_programs", "claims_history"], "required_fields": ["employee_count", "job_classifications", "payroll"]}', '{}', '{}', 'Review employee classifications, payroll information, and safety programs. Assess experience modification factors.', '{}', NULL, true, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00');


--
-- Data for Name: lead_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lead_statuses" ("id", "value", "description", "is_final", "is_active", "display_order", "color_hex", "icon_name", "badge_variant", "ai_action_template", "ai_follow_up_suggestions", "ai_next_steps", "auto_actions", "notification_settings", "metadata", "created_at", "updated_at") VALUES
	(17, 'New', 'Newly created lead requiring initial contact', false, true, 1, '#3B82F6', 'user-plus', 'default', 'Make initial contact within 24 hours. Introduce yourself and gather basic information about their insurance needs.', '[]', '[]', '{}', '{}', '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(18, 'Contacted', 'Initial contact has been made', false, true, 2, '#F59E0B', 'phone', 'default', 'Follow up within 3 days. Ask qualifying questions and schedule a detailed needs assessment.', '[]', '[]', '{}', '{}', '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(19, 'Qualified', 'Lead has been qualified and shows genuine interest', false, true, 3, '#8B5CF6', 'check-circle', 'default', 'Prepare a customized quote based on their specific needs and risk profile.', '[]', '[]', '{}', '{}', '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(20, 'Quoted', 'Quote has been provided to the prospect', false, true, 4, '#06B6D4', 'document-text', 'default', 'Follow up within 7 days to discuss the quote and address any questions or concerns.', '[]', '[]', '{}', '{}', '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(21, 'Negotiating', 'In active negotiations about terms or pricing', false, true, 5, '#F97316', 'chat-bubble-left-right', 'default', 'Work with the prospect to find mutually acceptable terms. Consider alternative coverage options.', '[]', '[]', '{}', '{}', '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(22, 'Sold', 'Lead has been successfully converted to a client', true, true, 6, '#10B981', 'check-badge', 'default', 'Process the policy, send welcome materials, and schedule onboarding call.', '[]', '[]', '{}', '{}', '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(23, 'Lost', 'Lead was not converted - no longer pursuing', true, true, 7, '#EF4444', 'x-circle', 'default', 'Document the reason for loss and add to nurture campaign for future opportunities.', '[]', '[]', '{}', '{}', '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(24, 'Hibernated', 'Lead is temporarily inactive but may be revisited', false, true, 8, '#6B7280', 'pause', 'default', 'Set reminder to follow up in 3-6 months. Keep in nurture campaign.', '[]', '[]', '{}', '{}', '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00');


--
-- Data for Name: pipelines; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pipelines" ("id", "name", "description", "is_default", "is_active", "display_order", "lead_type", "insurance_types", "conversion_goals", "target_conversion_rate", "average_cycle_time", "ai_optimization_enabled", "ai_scoring_model", "ai_automation_rules", "metadata", "created_by", "updated_by", "created_at", "updated_at") VALUES
	(7, 'Personal Insurance Pipeline', 'Standard pipeline for individual insurance prospects', true, true, 1, 'Personal', '{1,2,3,4}', '{"primary_goal": "policy_sale", "secondary_goals": ["cross_sell", "referral"]}', 25.00, NULL, false, '{}', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(8, 'Commercial Insurance Pipeline', 'Pipeline for business insurance prospects', false, true, 2, 'Business', '{5,6,7,8}', '{"primary_goal": "policy_sale", "secondary_goals": ["multi_line", "renewal"]}', 20.00, NULL, false, '{}', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(9, 'High-Value Personal Pipeline', 'Specialized pipeline for high-net-worth individuals', false, true, 3, 'Personal', '{2,4}', '{"primary_goal": "comprehensive_coverage", "secondary_goals": ["umbrella_policy", "trust_services"]}', 35.00, NULL, false, '{}', '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00');


--
-- Data for Name: pipeline_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pipeline_statuses" ("id", "pipeline_id", "name", "description", "is_final", "is_active", "display_order", "color_hex", "icon_name", "badge_variant", "stage_type", "required_fields", "optional_fields", "target_duration", "max_duration", "ai_action_template", "ai_follow_up_suggestions", "ai_next_steps", "ai_exit_criteria", "auto_actions", "notification_settings", "escalation_rules", "conversion_probability", "metadata", "created_at", "updated_at") VALUES
	(28, 7, 'New Lead', 'Fresh prospect in the system', false, true, 1, '#3B82F6', 'user-plus', 'default', 'active', '{}', '{}', 1, NULL, 'Contact within 24 hours to introduce services and schedule needs assessment.', '[]', '[]', '{}', '{}', '{}', '{}', 15.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(29, 7, 'Initial Contact', 'First contact made, gathering information', false, true, 2, '#F59E0B', 'phone', 'default', 'active', '{}', '{}', 2, NULL, 'Complete needs assessment and gather detailed information about current coverage.', '[]', '[]', '{}', '{}', '{}', '{}', 25.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(30, 7, 'Needs Assessment', 'Understanding coverage requirements', false, true, 3, '#8B5CF6', 'clipboard-document-list', 'default', 'active', '{}', '{}', 3, NULL, 'Analyze coverage gaps and prepare customized quote recommendations.', '[]', '[]', '{}', '{}', '{}', '{}', 40.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(31, 7, 'Quote Preparation', 'Preparing customized quote', false, true, 4, '#06B6D4', 'document-text', 'default', 'active', '{}', '{}', 2, NULL, 'Present quote options and explain coverage benefits and value proposition.', '[]', '[]', '{}', '{}', '{}', '{}', 60.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(32, 7, 'Quote Presented', 'Quote delivered to prospect', false, true, 5, '#10B981', 'presentation-chart-line', 'default', 'waiting', '{}', '{}', 7, NULL, 'Follow up to address questions and guide toward decision.', '[]', '[]', '{}', '{}', '{}', '{}', 75.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(33, 7, 'Policy Sold', 'Successfully converted to client', true, true, 6, '#059669', 'check-badge', 'default', 'final', '{}', '{}', 0, NULL, 'Process policy and begin onboarding. Look for cross-sell opportunities.', '[]', '[]', '{}', '{}', '{}', '{}', 100.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(34, 7, 'Lost', 'Prospect decided not to proceed', true, true, 7, '#EF4444', 'x-circle', 'default', 'final', '{}', '{}', 0, NULL, 'Document loss reason and add to nurture campaign for future opportunities.', '[]', '[]', '{}', '{}', '{}', '{}', 0.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(35, 8, 'Business Inquiry', 'Initial business insurance inquiry', false, true, 1, '#3B82F6', 'building-office', 'default', 'active', '{}', '{}', 2, NULL, 'Schedule business review meeting to understand operations and risk exposures.', '[]', '[]', '{}', '{}', '{}', '{}', 10.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(36, 8, 'Risk Assessment', 'Evaluating business risks and exposures', false, true, 2, '#F59E0B', 'shield-exclamation', 'default', 'active', '{}', '{}', 5, NULL, 'Complete comprehensive risk assessment and identify coverage needs.', '[]', '[]', '{}', '{}', '{}', '{}', 20.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(37, 8, 'Proposal Development', 'Creating comprehensive insurance proposal', false, true, 3, '#8B5CF6', 'document-duplicate', 'default', 'active', '{}', '{}', 7, NULL, 'Develop multi-line proposal with competitive pricing and comprehensive coverage.', '[]', '[]', '{}', '{}', '{}', '{}', 35.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(38, 8, 'Proposal Presented', 'Formal proposal delivered', false, true, 4, '#06B6D4', 'presentation-chart-bar', 'default', 'waiting', '{}', '{}', 14, NULL, 'Schedule follow-up meeting to review proposal and address any concerns.', '[]', '[]', '{}', '{}', '{}', '{}', 50.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(39, 8, 'Negotiation', 'Discussing terms and adjustments', false, true, 5, '#F97316', 'chat-bubble-left-right', 'default', 'active', '{}', '{}', 10, NULL, 'Work with prospect to refine coverage and terms to meet their needs and budget.', '[]', '[]', '{}', '{}', '{}', '{}', 70.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(40, 8, 'Policy Bound', 'Commercial policy successfully bound', true, true, 6, '#059669', 'check-badge', 'default', 'final', '{}', '{}', 0, NULL, 'Complete policy setup and schedule risk management consultation.', '[]', '[]', '{}', '{}', '{}', '{}', 100.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(41, 8, 'Lost', 'Business decided not to proceed', true, true, 7, '#EF4444', 'x-circle', 'default', 'final', '{}', '{}', 0, NULL, 'Document loss reason and maintain relationship for future opportunities.', '[]', '[]', '{}', '{}', '{}', '{}', 0.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(42, 9, 'Referral Received', 'High-value prospect referral', false, true, 1, '#3B82F6', 'user-group', 'default', 'active', '{}', '{}', 1, NULL, 'Contact within 24 hours. Acknowledge referral source and schedule private consultation.', '[]', '[]', '{}', '{}', '{}', '{}', 20.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(43, 9, 'Private Consultation', 'Detailed wealth protection review', false, true, 2, '#F59E0B', 'academic-cap', 'default', 'active', '{}', '{}', 7, NULL, 'Conduct comprehensive wealth and asset review. Identify protection gaps.', '[]', '[]', '{}', '{}', '{}', '{}', 35.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(44, 9, 'Asset Appraisal', 'Valuing high-value assets', false, true, 3, '#8B5CF6', 'currency-dollar', 'default', 'active', '{}', '{}', 14, NULL, 'Coordinate professional appraisals and document asset values for coverage.', '[]', '[]', '{}', '{}', '{}', '{}', 50.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(45, 9, 'Custom Proposal', 'Tailored high-value coverage proposal', false, true, 4, '#06B6D4', 'document-chart-bar', 'default', 'active', '{}', '{}', 10, NULL, 'Present comprehensive protection strategy with specialized coverage options.', '[]', '[]', '{}', '{}', '{}', '{}', 65.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(46, 9, 'Coverage Bound', 'High-value policy successfully bound', true, true, 5, '#059669', 'shield-check', 'default', 'final', '{}', '{}', 0, NULL, 'Implement coverage and establish ongoing wealth protection relationship.', '[]', '[]', '{}', '{}', '{}', '{}', 100.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	(47, 9, 'Lost', 'Prospect decided not to proceed', true, true, 6, '#EF4444', 'x-circle', 'default', 'final', '{}', '{}', 0, NULL, 'Maintain relationship and continue to provide value through market insights.', '[]', '[]', '{}', '{}', '{}', '{}', 0.00, '{}', '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00');


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: content_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."content_templates" ("id", "name", "description", "template_type", "category", "subject", "content", "variables", "personalization_fields", "dynamic_content", "usage_count", "performance_score", "conversion_rate", "engagement_rate", "ai_optimized", "ai_suggestions", "ai_performance_insights", "is_active", "tags", "metadata", "created_by", "updated_by", "created_at", "updated_at") VALUES
	('0c7af6ae-649f-4cdb-8da9-adafdb25be7a', 'Welcome Email - New Lead', 'Initial welcome email for new insurance leads', 'Email', 'Lead Nurturing', 'Welcome to {{company_name}} - Your Insurance Protection Starts Here', 'Dear {{first_name}},

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
{{agent_email}} | {{agent_phone}}', '{"agent_name": "Agent full name", "first_name": "Lead first name", "agent_email": "Agent email", "agent_phone": "Agent phone number", "company_name": "Insurance company name"}', '{first_name,company_name,agent_name}', '{}', 0, NULL, NULL, NULL, false, '{}', '{}', true, '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	('1274ad37-0541-48c3-8e1d-1763f6057ec2', 'Quote Follow-up SMS', 'SMS template for following up on delivered quotes', 'SMS', 'Quote Follow-up', NULL, 'Hi {{first_name}}! This is {{agent_name}} from {{company_name}}. I wanted to follow up on the insurance quote I sent you. Do you have any questions? Reply STOP to opt out.', '{"agent_name": "Agent first name", "first_name": "Lead first name", "company_name": "Company name"}', '{first_name,agent_name}', '{}', 0, NULL, NULL, NULL, false, '{}', '{}', true, '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00'),
	('4afc813b-7d23-455c-82ed-85ab7efc56e4', 'Initial Contact Call Script', 'Script for making initial contact with new leads', 'Call Script', 'Lead Contact', NULL, 'Hi {{first_name}}, this is {{agent_name}} from {{company_name}}. Thank you for your interest in insurance coverage.

I have about 5 minutes to learn about your current insurance situation and see how we might be able to help you save money or improve your coverage.

Is now a good time to chat, or would you prefer I call back at a more convenient time?

[If yes, continue with needs assessment questions]
[If no, schedule callback]

Key questions to ask:
1. What type of insurance are you looking for?
2. Do you currently have coverage?
3. When does your current policy expire?
4. What''s most important to you - price, coverage, or service?
5. Have you had any claims in the past 3 years?', '{"agent_name": "Agent full name", "first_name": "Lead first name", "company_name": "Company name"}', '{first_name,agent_name}', '{}', 0, NULL, NULL, NULL, false, '{}', '{}', true, '{}', '{}', NULL, NULL, '2025-08-12 02:15:58.003175+00', '2025-08-12 02:15:58.003175+00');


--
-- Data for Name: communications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: call_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: conversation_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: customer_touchpoints; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: homes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: lead_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ringcentral_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schema_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."schema_versions" ("id", "version", "description", "applied_at") VALUES
	(1, '1.0.0', 'Initial insurance CRM schema with comprehensive seed data - Production ready', '2025-08-12 02:15:58.003175+00');


--
-- Data for Name: sms_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: specialty_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_phone_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: insurance_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."insurance_types_id_seq"', 24, true);


--
-- Name: lead_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."lead_statuses_id_seq"', 24, true);


--
-- Name: pipeline_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."pipeline_statuses_id_seq"', 47, true);


--
-- Name: pipelines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."pipelines_id_seq"', 9, true);


--
-- Name: schema_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."schema_versions_id_seq"', 1, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
