# 🔍 Enum and Check Constraint Validation Report

Generated: 2025-08-14T04:32:05.623Z

## 📊 Summary
- **Total Enum Constraints**: 42
- **Total Check Constraints**: 9
- **Total Issues**: 0
- **Critical Issues**: 0
- **High Priority Issues**: 0
- **Medium Priority Issues**: 0
- **Low Priority Issues**: 0

## 🚨 Critical Issues



## ⚠️ High Priority Issues



## 📋 Enum Constraints Summary


### ab_tests.status
- **Constraint**: ab_tests_status_check
- **Values**: Draft, Running, Completed, Cancelled


### ab_tests.test_type
- **Constraint**: ab_tests_test_type_check
- **Values**: Subject Line, Content, Send Time, Call Script, Landing Page, Offer, CTA


### addresses.type
- **Constraint**: addresses_type_check
- **Values**: Physical, Mailing, Business, Location, Billing, Shipping


### agent_memory.entity_type
- **Constraint**: agent_memory_entity_type_check
- **Values**: client, lead, user, global, conversation, task


### agent_memory.memory_type
- **Constraint**: agent_memory_memory_type_check
- **Values**: conversation, insight, preference, fact, pattern, feedback


### ai_agents.agent_type
- **Constraint**: ai_agents_agent_type_check
- **Values**: assistant, workflow, analyzer, generator


### ai_agents.model_provider
- **Constraint**: ai_agents_model_provider_check
- **Values**: openai, anthropic, deepinfra, local


### ai_agents.role
- **Constraint**: ai_agents_role_check
- **Values**: follow_up, insight, design, support, marketing, sales, analysis


### ai_interactions.source
- **Constraint**: ai_interactions_source_check
- **Values**: Agent UI, Marketing Automation, AI Assistant, Backend Middleware, API, Webhook


### ai_interactions.type
- **Constraint**: ai_interactions_type_check
- **Values**: Chat, Follow-Up, Summary, Prediction, PromptResponse, Analysis, Recommendation


### ai_interactions.user_feedback
- **Constraint**: ai_interactions_user_feedback_check
- **Values**: positive, negative, neutral


### call_logs.ai_sentiment
- **Constraint**: call_logs_ai_sentiment_check
- **Values**: Positive, Neutral, Negative


### call_logs.direction
- **Constraint**: call_logs_direction_check
- **Values**: Inbound, Outbound


### call_logs.result
- **Constraint**: call_logs_result_check
- **Values**: Call connected, Voicemail, Busy, No Answer, Rejected, Failed


### call_logs.status
- **Constraint**: call_logs_status_check
- **Values**: Ringing, Connected, Disconnected, Busy, NoAnswer, Rejected, VoiceMail


### campaigns.campaign_type
- **Constraint**: campaigns_campaign_type_check
- **Values**: Email, SMS, Phone, Social, Direct Mail, Digital Ads, Webinar, Event


### campaigns.status
- **Constraint**: campaigns_status_check
- **Values**: Draft, Active, Paused, Completed, Cancelled


### clients.client_type
- **Constraint**: clients_client_type_check
- **Values**: Individual, Business


### clients.status
- **Constraint**: clients_status_check
- **Values**: Active, Inactive, Prospect, Lost


### communications.ai_sentiment
- **Constraint**: communications_ai_sentiment_check
- **Values**: Positive, Neutral, Negative


### communications.direction
- **Constraint**: communications_direction_check
- **Values**: Inbound, Outbound


### communications.status
- **Constraint**: communications_status_check
- **Values**: Pending, Sent, Delivered, Opened, Clicked, Replied, Failed, Bounced


### communications.type
- **Constraint**: communications_type_check
- **Values**: call, email, sms, meeting, note, voicemail, social, letter


### content_templates.template_type
- **Constraint**: content_templates_template_type_check
- **Values**: Email, SMS, Call Script, Social Post, Ad Copy, Letter, Proposal


### conversation_sessions.status
- **Constraint**: conversation_sessions_status_check
- **Values**: active, completed, paused, error


### customer_touchpoints.attribution_model
- **Constraint**: customer_touchpoints_attribution_model_check
- **Values**: first_touch, last_touch, linear, time_decay, position_based


### customer_touchpoints.touchpoint_type
- **Constraint**: customer_touchpoints_touchpoint_type_check
- **Values**: Email Open, Email Click, SMS Click, Phone Call, Website Visit, Form Submit, Ad Click, Social Engagement, Download, Purchase


### file_uploads.entity_type
- **Constraint**: file_uploads_entity_type_check
- **Values**: user, lead, client


### leads.lead_type
- **Constraint**: leads_lead_type_check
- **Values**: Personal, Business


### leads.priority
- **Constraint**: leads_priority_check
- **Values**: Low, Medium, High, Urgent


### leads.status
- **Constraint**: leads_status_check
- **Values**: New, Contacted, Qualified, Quoted, Sold, Lost, Hibernated


### pipeline_statuses.stage_type
- **Constraint**: pipeline_statuses_stage_type_check
- **Values**: active, waiting, final


### pipelines.lead_type
- **Constraint**: pipelines_lead_type_check
- **Values**: Personal, Business, Both


### quotes.contract_term
- **Constraint**: quotes_contract_term_check
- **Values**: 6mo, 12mo, 24mo


### quotes.status
- **Constraint**: quotes_status_check
- **Values**: Draft, Pending, Approved, Declined, Expired, Bound


### sms_logs.ai_sentiment
- **Constraint**: sms_logs_ai_sentiment_check
- **Values**: Positive, Neutral, Negative


### sms_logs.direction
- **Constraint**: sms_logs_direction_check
- **Values**: Inbound, Outbound


### sms_logs.status
- **Constraint**: sms_logs_status_check
- **Values**: Queued, Sent, Delivered, DeliveryFailed, SendingFailed, Received


### user_invitations.role
- **Constraint**: user_invitations_role_check
- **Values**: user, agent, manager, admin, owner


### user_invitations.status
- **Constraint**: user_invitations_status_check
- **Values**: pending, accepted, expired, cancelled


### user_phone_preferences.phone_number_type
- **Constraint**: user_phone_preferences_phone_number_type_check
- **Values**: Direct, Main, Toll-Free, Local


### users.role
- **Constraint**: users_role_check
- **Values**: user, admin, agent, manager


## 🔧 Check Constraints Summary


### agent_memory.confidence_score
- **Constraint**: agent_memory_confidence_score_check
- **Type**: RANGE
- **Definition**: CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (100)::numeric)))...


### agent_memory.importance_score
- **Constraint**: agent_memory_importance_score_check
- **Type**: RANGE
- **Definition**: CHECK (((importance_score >= 1) AND (importance_score <= 10)))...


### ai_agents.temperature
- **Constraint**: ai_agents_temperature_check
- **Type**: RANGE
- **Definition**: CHECK (((temperature >= (0)::numeric) AND (temperature <= (2)::numeric)))...


### ai_interactions.quality_score
- **Constraint**: ai_interactions_quality_score_check
- **Type**: RANGE
- **Definition**: CHECK (((quality_score >= (0)::numeric) AND (quality_score <= (5)::numeric)))...


### call_logs.quality_score
- **Constraint**: call_logs_quality_score_check
- **Type**: RANGE
- **Definition**: CHECK (((quality_score >= 1) AND (quality_score <= 5)))...


### clients.ai_risk_score
- **Constraint**: clients_ai_risk_score_check
- **Type**: RANGE
- **Definition**: CHECK (((ai_risk_score >= 0) AND (ai_risk_score <= 100)))...


### communications.call_quality_score
- **Constraint**: communications_call_quality_score_check
- **Type**: RANGE
- **Definition**: CHECK (((call_quality_score >= 1) AND (call_quality_score <= 5)))...


### leads.ai_conversion_probability
- **Constraint**: leads_ai_conversion_probability_check
- **Type**: RANGE
- **Definition**: CHECK (((ai_conversion_probability >= (0)::numeric) AND (ai_conversion_probability <= (100)::numeric...


### leads.ai_follow_up_priority
- **Constraint**: leads_ai_follow_up_priority_check
- **Type**: RANGE
- **Definition**: CHECK (((ai_follow_up_priority >= 1) AND (ai_follow_up_priority <= 10)))...


## 🎯 Next Steps

1. **No Critical Issues**: All critical constraints are properly aligned

2. **No High Priority Issues**: High priority constraints are working correctly

3. **Review Medium Priority**: Consider addressing medium priority issues
4. **Enhance Documentation**: Document all constraint requirements
5. **Automate Validation**: Integrate constraint validation into CI/CD pipeline
