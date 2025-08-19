# 🔍 Database Schema Discovery Report

Generated: 2025-08-14T04:17:58.146Z

## 📊 Summary
- **Total Constraints**: 187
- **Total Triggers**: 51
- **Total Enums**: 0
- **Total Conflicts**: 1
- **Critical Conflicts**: 1

## 🚨 Critical Conflicts


### CRITICAL_TRIGGER_CONSTRAINT_CONFLICT
- **Severity**: HIGH
- **Table**: communications
- **Issue**: Trigger sets status to 'Completed' but constraint only allows: Pending, Sent, Delivered, Opened, Clicked, Replied, Failed, Bounced
- **Impact**: Data insertion failures when call logs create communication records
- **Recommendation**: Either add 'Completed' to constraint or change trigger to use 'Delivered'


## 📋 Constraint Summary by Table


### _version_info
- **_version_info_pkey** (p): PRIMARY KEY (id)


### ab_tests
- **ab_tests_status_check** (c): CHECK ((status = ANY (ARRAY['Draft'::text, 'Running'::text, 'Completed'::text, 'Cancelled'::text])))
- **ab_tests_test_type_check** (c): CHECK ((test_type = ANY (ARRAY['Subject Line'::text, 'Content'::text, 'Send Time'::text, 'Call Script'::text, 'Landing Page'::text, 'Offer'::text, 'CTA'::text])))
- **ab_tests_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **ab_tests_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **ab_tests_campaign_id_fkey** (f): FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
- **ab_tests_pkey** (p): PRIMARY KEY (id)


### addresses
- **addresses_type_check** (c): CHECK ((type = ANY (ARRAY['Physical'::text, 'Mailing'::text, 'Business'::text, 'Location'::text, 'Billing'::text, 'Shipping'::text])))
- **addresses_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **addresses_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **addresses_pkey** (p): PRIMARY KEY (id)


### agent_memory
- **agent_memory_importance_score_check** (c): CHECK (((importance_score >= 1) AND (importance_score <= 10)))
- **agent_memory_memory_type_check** (c): CHECK ((memory_type = ANY (ARRAY['conversation'::text, 'insight'::text, 'preference'::text, 'fact'::text, 'pattern'::text, 'feedback'::text])))
- **agent_memory_confidence_score_check** (c): CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (100)::numeric)))
- **agent_memory_entity_type_check** (c): CHECK ((entity_type = ANY (ARRAY['client'::text, 'lead'::text, 'user'::text, 'global'::text, 'conversation'::text, 'task'::text])))
- **agent_memory_agent_id_fkey** (f): FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE
- **agent_memory_pkey** (p): PRIMARY KEY (id)


### ai_agents
- **ai_agents_model_provider_check** (c): CHECK ((model_provider = ANY (ARRAY['openai'::text, 'anthropic'::text, 'deepinfra'::text, 'local'::text])))
- **ai_agents_agent_type_check** (c): CHECK ((agent_type = ANY (ARRAY['assistant'::text, 'workflow'::text, 'analyzer'::text, 'generator'::text])))
- **ai_agents_role_check** (c): CHECK ((role = ANY (ARRAY['follow_up'::text, 'insight'::text, 'design'::text, 'support'::text, 'marketing'::text, 'sales'::text, 'analysis'::text])))
- **ai_agents_temperature_check** (c): CHECK (((temperature >= (0)::numeric) AND (temperature <= (2)::numeric)))
- **ai_agents_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **ai_agents_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **ai_agents_pkey** (p): PRIMARY KEY (id)


### ai_interactions
- **ai_interactions_user_feedback_check** (c): CHECK ((user_feedback = ANY (ARRAY['positive'::text, 'negative'::text, 'neutral'::text])))
- **ai_interactions_source_check** (c): CHECK ((source = ANY (ARRAY['Agent UI'::text, 'Marketing Automation'::text, 'AI Assistant'::text, 'Backend Middleware'::text, 'API'::text, 'Webhook'::text])))
- **ai_interactions_type_check** (c): CHECK ((type = ANY (ARRAY['Chat'::text, 'Follow-Up'::text, 'Summary'::text, 'Prediction'::text, 'PromptResponse'::text, 'Analysis'::text, 'Recommendation'::text])))
- **ai_interactions_quality_score_check** (c): CHECK (((quality_score >= (0)::numeric) AND (quality_score <= (5)::numeric)))
- **ai_interactions_agent_id_fkey** (f): FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
- **ai_interactions_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES users(id)
- **ai_interactions_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id)
- **ai_interactions_client_id_fkey** (f): FOREIGN KEY (client_id) REFERENCES clients(id)
- **ai_interactions_pkey** (p): PRIMARY KEY (id)


### api_rate_limits
- **api_rate_limits_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES users(id)
- **api_rate_limits_pkey** (p): PRIMARY KEY (id)


### audit_logs
- **audit_logs_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES auth.users(id)
- **audit_logs_pkey** (p): PRIMARY KEY (id)


### call_logs
- **call_logs_direction_check** (c): CHECK ((direction = ANY (ARRAY['Inbound'::text, 'Outbound'::text])))
- **call_logs_quality_score_check** (c): CHECK (((quality_score >= 1) AND (quality_score <= 5)))
- **call_logs_ai_sentiment_check** (c): CHECK ((ai_sentiment = ANY (ARRAY['Positive'::text, 'Neutral'::text, 'Negative'::text])))
- **call_logs_result_check** (c): CHECK ((result = ANY (ARRAY['Call connected'::text, 'Voicemail'::text, 'Busy'::text, 'No Answer'::text, 'Rejected'::text, 'Failed'::text])))
- **call_logs_status_check** (c): CHECK ((status = ANY (ARRAY['Ringing'::text, 'Connected'::text, 'Disconnected'::text, 'Busy'::text, 'NoAnswer'::text, 'Rejected'::text, 'VoiceMail'::text])))
- **call_logs_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id)
- **call_logs_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES users(id)
- **call_logs_client_id_fkey** (f): FOREIGN KEY (client_id) REFERENCES clients(id)
- **call_logs_communication_id_fkey** (f): FOREIGN KEY (communication_id) REFERENCES communications(id)
- **call_logs_pkey** (p): PRIMARY KEY (id)
- **call_logs_ringcentral_call_id_key** (u): UNIQUE (ringcentral_call_id)


### campaigns
- **campaigns_status_check** (c): CHECK ((status = ANY (ARRAY['Draft'::text, 'Active'::text, 'Paused'::text, 'Completed'::text, 'Cancelled'::text])))
- **campaigns_campaign_type_check** (c): CHECK ((campaign_type = ANY (ARRAY['Email'::text, 'SMS'::text, 'Phone'::text, 'Social'::text, 'Direct Mail'::text, 'Digital Ads'::text, 'Webinar'::text, 'Event'::text])))
- **campaigns_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **campaigns_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **campaigns_pkey** (p): PRIMARY KEY (id)


### clients
- **clients_status_check** (c): CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text, 'Prospect'::text, 'Lost'::text])))
- **clients_client_type_check** (c): CHECK ((client_type = ANY (ARRAY['Individual'::text, 'Business'::text])))
- **clients_ai_risk_score_check** (c): CHECK (((ai_risk_score >= 0) AND (ai_risk_score <= 100)))
- **clients_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **clients_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **clients_address_id_fkey** (f): FOREIGN KEY (address_id) REFERENCES addresses(id)
- **clients_mailing_address_id_fkey** (f): FOREIGN KEY (mailing_address_id) REFERENCES addresses(id)
- **clients_pkey** (p): PRIMARY KEY (id)


### communications
- **communications_direction_check** (c): CHECK ((direction = ANY (ARRAY['Inbound'::text, 'Outbound'::text])))
- **communications_status_check** (c): CHECK ((status = ANY (ARRAY['Pending'::text, 'Sent'::text, 'Delivered'::text, 'Opened'::text, 'Clicked'::text, 'Replied'::text, 'Failed'::text, 'Bounced'::text])))
- **communications_call_quality_score_check** (c): CHECK (((call_quality_score >= 1) AND (call_quality_score <= 5)))
- **communications_ai_sentiment_check** (c): CHECK ((ai_sentiment = ANY (ARRAY['Positive'::text, 'Neutral'::text, 'Negative'::text])))
- **communications_type_check** (c): CHECK ((type = ANY (ARRAY['call'::text, 'email'::text, 'sms'::text, 'meeting'::text, 'note'::text, 'voicemail'::text, 'social'::text, 'letter'::text])))
- **communications_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **communications_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
- **communications_client_id_fkey** (f): FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
- **communications_campaign_id_fkey** (f): FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
- **communications_ab_test_id_fkey** (f): FOREIGN KEY (ab_test_id) REFERENCES ab_tests(id)
- **communications_content_template_id_fkey** (f): FOREIGN KEY (content_template_id) REFERENCES content_templates(id)
- **communications_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **communications_pkey** (p): PRIMARY KEY (id)


### content_templates
- **content_templates_template_type_check** (c): CHECK ((template_type = ANY (ARRAY['Email'::text, 'SMS'::text, 'Call Script'::text, 'Social Post'::text, 'Ad Copy'::text, 'Letter'::text, 'Proposal'::text])))
- **content_templates_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **content_templates_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **content_templates_pkey** (p): PRIMARY KEY (id)


### conversation_sessions
- **conversation_sessions_status_check** (c): CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'paused'::text, 'error'::text])))
- **conversation_sessions_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id)
- **conversation_sessions_agent_id_fkey** (f): FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
- **conversation_sessions_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES users(id)
- **conversation_sessions_client_id_fkey** (f): FOREIGN KEY (client_id) REFERENCES clients(id)
- **conversation_sessions_pkey** (p): PRIMARY KEY (id)


### customer_touchpoints
- **customer_touchpoints_touchpoint_type_check** (c): CHECK ((touchpoint_type = ANY (ARRAY['Email Open'::text, 'Email Click'::text, 'SMS Click'::text, 'Phone Call'::text, 'Website Visit'::text, 'Form Submit'::text, 'Ad Click'::text, 'Social Engagement'::text, 'Download'::text, 'Purchase'::text])))
- **customer_touchpoints_attribution_model_check** (c): CHECK ((attribution_model = ANY (ARRAY['first_touch'::text, 'last_touch'::text, 'linear'::text, 'time_decay'::text, 'position_based'::text])))
- **customer_touchpoints_campaign_id_fkey** (f): FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
- **customer_touchpoints_client_id_fkey** (f): FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
- **customer_touchpoints_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
- **customer_touchpoints_communication_id_fkey** (f): FOREIGN KEY (communication_id) REFERENCES communications(id)
- **customer_touchpoints_ab_test_id_fkey** (f): FOREIGN KEY (ab_test_id) REFERENCES ab_tests(id)
- **customer_touchpoints_pkey** (p): PRIMARY KEY (id)


### file_deletions
- **file_deletions_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
- **file_deletions_pkey** (p): PRIMARY KEY (id)


### file_uploads
- **file_uploads_entity_type_check** (c): CHECK ((entity_type = ANY (ARRAY['user'::text, 'lead'::text, 'client'::text])))
- **file_uploads_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
- **file_uploads_pkey** (p): PRIMARY KEY (id)


### homes
- **homes_client_id_fkey** (f): FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
- **homes_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **homes_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **homes_address_id_fkey** (f): FOREIGN KEY (address_id) REFERENCES addresses(id)
- **homes_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
- **homes_pkey** (p): PRIMARY KEY (id)


### insurance_types
- **insurance_types_pkey** (p): PRIMARY KEY (id)
- **insurance_types_name_key** (u): UNIQUE (name)


### lead_status_history
- **lead_status_history_from_pipeline_status_id_fkey** (f): FOREIGN KEY (from_pipeline_status_id) REFERENCES pipeline_statuses(id)
- **lead_status_history_to_pipeline_status_id_fkey** (f): FOREIGN KEY (to_pipeline_status_id) REFERENCES pipeline_statuses(id)
- **lead_status_history_changed_by_fkey** (f): FOREIGN KEY (changed_by) REFERENCES users(id)
- **lead_status_history_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
- **lead_status_history_pkey** (p): PRIMARY KEY (id)


### lead_statuses
- **lead_statuses_pkey** (p): PRIMARY KEY (id)
- **lead_statuses_value_key** (u): UNIQUE (value)


### leads
- **leads_ai_follow_up_priority_check** (c): CHECK (((ai_follow_up_priority >= 1) AND (ai_follow_up_priority <= 10)))
- **leads_ai_conversion_probability_check** (c): CHECK (((ai_conversion_probability >= (0)::numeric) AND (ai_conversion_probability <= (100)::numeric)))
- **leads_priority_check** (c): CHECK ((priority = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Urgent'::text])))
- **leads_status_check** (c): CHECK ((status = ANY (ARRAY['New'::text, 'Contacted'::text, 'Qualified'::text, 'Quoted'::text, 'Sold'::text, 'Lost'::text, 'Hibernated'::text])))
- **leads_lead_type_check** (c): CHECK ((lead_type = ANY (ARRAY['Personal'::text, 'Business'::text])))
- **leads_converted_to_client_id_fkey** (f): FOREIGN KEY (converted_to_client_id) REFERENCES clients(id) ON DELETE SET NULL
- **leads_pipeline_id_fkey** (f): FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)
- **leads_pipeline_status_id_fkey** (f): FOREIGN KEY (pipeline_status_id) REFERENCES pipeline_statuses(id)
- **leads_lead_status_id_fkey** (f): FOREIGN KEY (lead_status_id) REFERENCES lead_statuses(id)
- **leads_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **leads_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **leads_assigned_to_fkey** (f): FOREIGN KEY (assigned_to) REFERENCES users(id)
- **leads_insurance_type_id_fkey** (f): FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id)
- **leads_pkey** (p): PRIMARY KEY (id)


### password_history
- **password_history_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
- **password_history_pkey** (p): PRIMARY KEY (id)


### permissions
- **permissions_pkey** (p): PRIMARY KEY (id)
- **permissions_name_key** (u): UNIQUE (name)


### pipeline_statuses
- **pipeline_statuses_stage_type_check** (c): CHECK ((stage_type = ANY (ARRAY['active'::text, 'waiting'::text, 'final'::text])))
- **pipeline_statuses_pipeline_id_fkey** (f): FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
- **pipeline_statuses_pkey** (p): PRIMARY KEY (id)
- **pipeline_statuses_pipeline_id_name_key** (u): UNIQUE (pipeline_id, name)
- **pipeline_statuses_pipeline_id_display_order_key** (u): UNIQUE (pipeline_id, display_order)


### pipelines
- **pipelines_lead_type_check** (c): CHECK ((lead_type = ANY (ARRAY['Personal'::text, 'Business'::text, 'Both'::text])))
- **pipelines_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **pipelines_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **pipelines_pkey** (p): PRIMARY KEY (id)


### quotes
- **quotes_contract_term_check** (c): CHECK ((contract_term = ANY (ARRAY['6mo'::text, '12mo'::text, '24mo'::text])))
- **quotes_status_check** (c): CHECK ((status = ANY (ARRAY['Draft'::text, 'Pending'::text, 'Approved'::text, 'Declined'::text, 'Expired'::text, 'Bound'::text])))
- **quotes_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
- **quotes_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **quotes_insurance_type_id_fkey** (f): FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id)
- **quotes_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **quotes_pkey** (p): PRIMARY KEY (id)


### ringcentral_tokens
- **ringcentral_tokens_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- **ringcentral_tokens_pkey** (p): PRIMARY KEY (id)
- **ringcentral_tokens_user_id_key** (u): UNIQUE (user_id)


### schema_versions
- **schema_versions_pkey** (p): PRIMARY KEY (id)
- **schema_versions_version_key** (u): UNIQUE (version)


### sms_logs
- **sms_logs_ai_sentiment_check** (c): CHECK ((ai_sentiment = ANY (ARRAY['Positive'::text, 'Neutral'::text, 'Negative'::text])))
- **sms_logs_status_check** (c): CHECK ((status = ANY (ARRAY['Queued'::text, 'Sent'::text, 'Delivered'::text, 'DeliveryFailed'::text, 'SendingFailed'::text, 'Received'::text])))
- **sms_logs_direction_check** (c): CHECK ((direction = ANY (ARRAY['Inbound'::text, 'Outbound'::text])))
- **sms_logs_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES users(id)
- **sms_logs_communication_id_fkey** (f): FOREIGN KEY (communication_id) REFERENCES communications(id)
- **sms_logs_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id)
- **sms_logs_client_id_fkey** (f): FOREIGN KEY (client_id) REFERENCES clients(id)
- **sms_logs_pkey** (p): PRIMARY KEY (id)
- **sms_logs_ringcentral_message_id_key** (u): UNIQUE (ringcentral_message_id)


### specialty_items
- **specialty_items_client_id_fkey** (f): FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
- **specialty_items_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **specialty_items_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **specialty_items_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
- **specialty_items_pkey** (p): PRIMARY KEY (id)


### user_invitations
- **user_invitations_status_check** (c): CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'cancelled'::text])))
- **user_invitations_role_check** (c): CHECK ((role = ANY (ARRAY['user'::text, 'agent'::text, 'manager'::text, 'admin'::text, 'owner'::text])))
- **user_invitations_invited_by_fkey** (f): FOREIGN KEY (invited_by) REFERENCES auth.users(id)
- **user_invitations_accepted_by_fkey** (f): FOREIGN KEY (accepted_by) REFERENCES auth.users(id)
- **user_invitations_pkey** (p): PRIMARY KEY (id)
- **user_invitations_invitation_token_key** (u): UNIQUE (invitation_token)


### user_phone_preferences
- **user_phone_preferences_phone_number_type_check** (c): CHECK ((phone_number_type = ANY (ARRAY['Direct'::text, 'Main'::text, 'Toll-Free'::text, 'Local'::text])))
- **user_phone_preferences_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- **user_phone_preferences_pkey** (p): PRIMARY KEY (id)
- **user_phone_preferences_user_id_selected_phone_number_key** (u): UNIQUE (user_id, selected_phone_number)


### user_sessions
- **user_sessions_user_id_fkey** (f): FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
- **user_sessions_pkey** (p): PRIMARY KEY (id)
- **user_sessions_session_token_key** (u): UNIQUE (session_token)


### users
- **users_role_check** (c): CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'agent'::text, 'manager'::text])))
- **users_id_fkey** (f): FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
- **users_pkey** (p): PRIMARY KEY (id)
- **users_email_key** (u): UNIQUE (email)


### vehicles
- **vehicles_created_by_fkey** (f): FOREIGN KEY (created_by) REFERENCES users(id)
- **vehicles_updated_by_fkey** (f): FOREIGN KEY (updated_by) REFERENCES users(id)
- **vehicles_lead_id_fkey** (f): FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
- **vehicles_client_id_fkey** (f): FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
- **vehicles_pkey** (p): PRIMARY KEY (id)


## ⚡ Trigger Summary by Table


### ab_tests
- **set_ab_tests_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_ab_tests_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...


### addresses
- **set_addresses_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_addresses_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...
- **update_addresses_formatted_address**: 
BEGIN
  NEW.formatted_address = public.format_address(
    NEW.street, NEW.street2, NEW.city, NEW.s...


### agent_memory
- **update_agent_memory_updated_at**: 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
...


### ai_agents
- **set_ai_agents_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_ai_agents_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...


### ai_interactions
- **notify_ai_interactions_changes**: 
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Only notify on INSERT and UPD...
- **update_agent_performance_on_interaction**: 
BEGIN
  -- Update agent statistics when interaction is completed
  IF NEW.completed_at IS NOT NULL ...


### call_logs
- **create_communication_from_call_log**: 
BEGIN
  -- Only create communication record if call was connected and has client/lead
  IF NEW.stat...
- **notify_call_logs_changes**: 
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Build notification payload
  ...
- **update_call_logs_updated_at**: 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
...


### campaigns
- **set_campaigns_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_campaigns_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...


### clients
- **set_clients_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_clients_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...


### communications
- **increment_template_usage_on_communication**: 
BEGIN
  IF NEW.content_template_id IS NOT NULL THEN
    UPDATE public.content_templates
    SET usa...
- **notify_communications_changes**: 
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Build notification payload
  ...
- **set_communications_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_communications_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...
- **update_last_contact_on_communication**: 
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads 
    SET last_contact_at = NEW.crea...
- **validate_communications_client_lead_relationship**: 
BEGIN
  -- Ensure that if both client_id and lead_id are provided, they are related
  IF NEW.client...


### content_templates
- **set_content_templates_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_content_templates_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...


### conversation_sessions
- **update_conversation_sessions_updated_at**: 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
...


### homes
- **set_homes_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_homes_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...
- **validate_homes_client_lead_relationship**: 
BEGIN
  -- Ensure that if both client_id and lead_id are provided, they are related
  IF NEW.client...


### leads
- **notify_leads_changes**: 
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Determine the operation type
...
- **set_lead_next_contact_date**: 
BEGIN
  -- Set next contact date based on status
  CASE NEW.status
    WHEN 'New' THEN
      NEW.ne...
- **set_leads_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **track_lead_status_changes**: 
DECLARE
  duration_hours INTEGER;
  previous_history RECORD;
BEGIN
  -- Calculate duration in previ...
- **update_leads_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  
  -- Update status_changed_at if ...


### pipelines
- **ensure_single_default_pipeline**: 
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Remove default flag from other pipelines of the same l...
- **set_pipelines_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_pipelines_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...


### quotes
- **notify_quotes_changes**: 
DECLARE
  notification_payload JSONB;
  channel_name TEXT;
BEGIN
  -- Build notification payload
  ...
- **set_quotes_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_quotes_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...


### ringcentral_tokens
- **update_ringcentral_tokens_updated_at**: 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
...


### sms_logs
- **update_sms_logs_updated_at**: 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
...


### specialty_items
- **set_specialty_items_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_specialty_items_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...
- **validate_specialty_items_client_lead_relationship**: 
BEGIN
  -- Ensure that if both client_id and lead_id are provided, they are related
  IF NEW.client...


### user_phone_preferences
- **ensure_single_default_phone_preference**: 
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Remove default flag from other phone preferences for t...
- **update_user_phone_preferences_updated_at**: 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
...


### users
- **update_users_updated_at**: 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
...


### vehicles
- **set_vehicles_created_by**: 
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END...
- **update_vehicles_audit_fields**: 
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
...
- **validate_vehicles_client_lead_relationship**: 
BEGIN
  -- Ensure that if both client_id and lead_id are provided, they are related
  IF NEW.client...


## 🎯 Next Steps

1. **Fix Critical Conflicts**: Address all HIGH severity conflicts immediately
2. **Update Drizzle Schema**: Align schema definitions with database reality
3. **Test Data Operations**: Validate all CRUD operations work correctly
4. **Update Documentation**: Document all constraints and business rules
