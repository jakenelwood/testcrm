-- =============================================================================
-- CAMPAIGN SYSTEM RLS POLICIES AND SEED DATA
-- =============================================================================

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all campaign tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reengagement_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Users can view campaigns in their workspace" ON campaigns
    FOR SELECT USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create campaigns in their workspace" ON campaigns
    FOR INSERT WITH CHECK (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update campaigns in their workspace" ON campaigns
    FOR UPDATE USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete campaigns in their workspace" ON campaigns
    FOR DELETE USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

-- A/B Tests policies
CREATE POLICY "Users can view ab_tests in their workspace" ON ab_tests
    FOR SELECT USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create ab_tests in their workspace" ON ab_tests
    FOR INSERT WITH CHECK (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update ab_tests in their workspace" ON ab_tests
    FOR UPDATE USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete ab_tests in their workspace" ON ab_tests
    FOR DELETE USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

-- Campaign Participants policies
CREATE POLICY "Users can view campaign_participants in their workspace" ON campaign_participants
    FOR SELECT USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create campaign_participants in their workspace" ON campaign_participants
    FOR INSERT WITH CHECK (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update campaign_participants in their workspace" ON campaign_participants
    FOR UPDATE USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

-- Campaign Transitions policies
CREATE POLICY "Users can view campaign_transitions in their workspace" ON campaign_transitions
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create campaign_transitions in their workspace" ON campaign_transitions
    FOR INSERT WITH CHECK (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

-- Re-engagement Schedule policies
CREATE POLICY "Users can view reengagement_schedule in their workspace" ON reengagement_schedule
    FOR SELECT USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create reengagement_schedule in their workspace" ON reengagement_schedule
    FOR INSERT WITH CHECK (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update reengagement_schedule in their workspace" ON reengagement_schedule
    FOR UPDATE USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

-- Campaign Metrics policies
CREATE POLICY "Users can view campaign_metrics in their workspace" ON campaign_metrics
    FOR SELECT USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create campaign_metrics in their workspace" ON campaign_metrics
    FOR INSERT WITH CHECK (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update campaign_metrics in their workspace" ON campaign_metrics
    FOR UPDATE USING (
        workspace_id = (
            SELECT workspace_id FROM users
            WHERE id = auth.uid()
        )
    );

-- =============================================================================
-- SEED DATA - DEFAULT CAMPAIGNS FOR EXISTING WORKSPACES
-- =============================================================================

-- Create default AI campaigns for all existing workspaces
INSERT INTO campaigns (workspace_id, name, description, campaign_type, objective, status, ai_optimization_enabled, automation_rules)
SELECT 
    w.id as workspace_id,
    'AI Default Lead Nurture' as name,
    'Fully automated AI-driven lead nurturing and interaction campaign for new leads' as description,
    'ai_automated' as campaign_type,
    'ai_nurture' as objective,
    'active' as status,
    true as ai_optimization_enabled,
    jsonb_build_object(
        'auto_assign_new_leads', true,
        'ai_interaction_frequency', 'smart',
        'interaction_rules', jsonb_build_object(
            'initial_contact_delay', '2_hours',
            'follow_up_sequence', jsonb_build_array('email', 'sms', 'phone'),
            'follow_up_intervals', jsonb_build_array('1_day', '3_days', '1_week'),
            'max_attempts', 7
        ),
        'escalation_rules', jsonb_build_object(
            'high_intent_signals', jsonb_build_array('quote_request', 'pricing_inquiry', 'demo_request'),
            'escalation_action', 'human_handoff',
            'escalation_priority', 'high'
        ),
        'transition_rules', jsonb_build_object(
            'no_response_30_days', 'winback_campaign',
            'converted', 'customer_onboarding_campaign',
            'unqualified', 'long_term_nurture_campaign'
        )
    ) as automation_rules
FROM workspaces w
WHERE NOT EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.workspace_id = w.id 
    AND c.campaign_type = 'ai_automated'
);

-- Create hold management campaigns for all existing workspaces
INSERT INTO campaigns (workspace_id, name, description, campaign_type, objective, status, ai_optimization_enabled, automation_rules)
SELECT 
    w.id as workspace_id,
    'Hold Management' as name,
    'Manages contacts who are on hold and schedules re-engagement notifications' as description,
    'on_hold' as campaign_type,
    'hold_management' as objective,
    'active' as status,
    true as ai_optimization_enabled,
    jsonb_build_object(
        'hold_monitoring', true,
        'auto_reengagement', true,
        'reengagement_buffer', '1_day',
        'notification_schedule', jsonb_build_array('7_days_before', '1_day_before', 'on_date'),
        'escalation_rules', jsonb_build_object(
            'hold_expired', 'reengagement_campaign',
            'customer_initiated_contact', 'immediate_response'
        )
    ) as automation_rules
FROM workspaces w
WHERE NOT EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.workspace_id = w.id 
    AND c.campaign_type = 'on_hold'
);

-- Create re-engagement campaigns for all existing workspaces
INSERT INTO campaigns (workspace_id, name, description, campaign_type, objective, status, ai_optimization_enabled, automation_rules)
SELECT 
    w.id as workspace_id,
    'Auto Re-engagement' as name,
    'Automatically re-engages contacts coming off hold periods' as description,
    'reengagement' as campaign_type,
    'reengagement' as objective,
    'active' as status,
    true as ai_optimization_enabled,
    jsonb_build_object(
        'gentle_reintroduction', true,
        'respect_previous_preferences', true,
        'interaction_rules', jsonb_build_object(
            'initial_contact_delay', '1_day',
            'preferred_channels', jsonb_build_array('email', 'sms'),
            'max_attempts', 3,
            'follow_up_intervals', jsonb_build_array('3_days', '1_week')
        )
    ) as automation_rules
FROM workspaces w
WHERE NOT EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.workspace_id = w.id 
    AND c.campaign_type = 'reengagement'
);

-- =============================================================================
-- ASSIGN EXISTING LEADS TO DEFAULT CAMPAIGNS
-- =============================================================================

-- Update existing leads to be assigned to the default AI campaign
UPDATE contacts 
SET 
    current_campaign_id = (
        SELECT c.id 
        FROM campaigns c 
        WHERE c.workspace_id = contacts.workspace_id 
        AND c.campaign_type = 'ai_automated' 
        AND c.status = 'active'
        LIMIT 1
    ),
    campaign_assigned_at = now()
WHERE lifecycle_stage = 'lead' 
AND current_campaign_id IS NULL;

-- Create campaign participant records for existing leads
INSERT INTO campaign_participants (workspace_id, campaign_id, contact_id, assigned_at, is_current)
SELECT 
    c.workspace_id,
    c.current_campaign_id,
    c.id,
    c.campaign_assigned_at,
    true
FROM contacts c
WHERE c.current_campaign_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM campaign_participants cp 
    WHERE cp.contact_id = c.id 
    AND cp.is_current = true
);

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to get campaign performance summary
CREATE OR REPLACE FUNCTION get_campaign_performance(p_campaign_id UUID)
RETURNS TABLE (
    total_participants BIGINT,
    total_sent BIGINT,
    total_delivered BIGINT,
    total_opened BIGINT,
    total_clicked BIGINT,
    total_converted BIGINT,
    open_rate DECIMAL,
    click_rate DECIMAL,
    conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT cp.contact_id) as total_participants,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.sent_at IS NOT NULL) as total_sent,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.delivered_at IS NOT NULL) as total_delivered,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.opened_at IS NOT NULL) as total_opened,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.clicked_at IS NOT NULL) as total_clicked,
        COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.converted_at IS NOT NULL) as total_converted,
        CASE 
            WHEN COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.delivered_at IS NOT NULL) > 0 
            THEN ROUND(
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.opened_at IS NOT NULL)::DECIMAL / 
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.delivered_at IS NOT NULL) * 100, 2
            )
            ELSE 0
        END as open_rate,
        CASE 
            WHEN COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.opened_at IS NOT NULL) > 0 
            THEN ROUND(
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.clicked_at IS NOT NULL)::DECIMAL / 
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.opened_at IS NOT NULL) * 100, 2
            )
            ELSE 0
        END as click_rate,
        CASE 
            WHEN COUNT(DISTINCT cp.contact_id) > 0 
            THEN ROUND(
                COUNT(DISTINCT cm.contact_id) FILTER (WHERE cm.converted_at IS NOT NULL)::DECIMAL / 
                COUNT(DISTINCT cp.contact_id) * 100, 2
            )
            ELSE 0
        END as conversion_rate
    FROM campaign_participants cp
    LEFT JOIN campaign_metrics cm ON cp.contact_id = cm.contact_id AND cp.campaign_id = cm.campaign_id
    WHERE cp.campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
