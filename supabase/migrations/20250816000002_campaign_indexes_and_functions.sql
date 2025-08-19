-- =============================================================================
-- CAMPAIGN SYSTEM INDEXES, CONSTRAINTS, AND FUNCTIONS
-- =============================================================================

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_current_campaign_id ON contacts(current_campaign_id);
CREATE INDEX IF NOT EXISTS idx_contacts_hold_until ON contacts(hold_until) WHERE lifecycle_stage = 'on_hold';
CREATE INDEX IF NOT EXISTS idx_contacts_campaign_assigned_at ON contacts(campaign_assigned_at);

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);

-- A/B Tests indexes
CREATE INDEX IF NOT EXISTS idx_ab_tests_workspace_id ON ab_tests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_campaign_id ON ab_tests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);

-- Campaign Participants indexes
CREATE INDEX IF NOT EXISTS idx_campaign_participants_workspace_id ON campaign_participants(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign_id ON campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_contact_id ON campaign_participants(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_account_id ON campaign_participants(account_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_is_current ON campaign_participants(contact_id) WHERE is_current = true;

-- Campaign Transitions indexes
CREATE INDEX IF NOT EXISTS idx_campaign_transitions_workspace_id ON campaign_transitions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_transitions_contact_id ON campaign_transitions(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_transitions_from_campaign ON campaign_transitions(from_campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_transitions_to_campaign ON campaign_transitions(to_campaign_id);

-- Re-engagement Schedule indexes
CREATE INDEX IF NOT EXISTS idx_reengagement_schedule_workspace_id ON reengagement_schedule(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reengagement_schedule_contact_id ON reengagement_schedule(contact_id);
CREATE INDEX IF NOT EXISTS idx_reengagement_schedule_scheduled_for ON reengagement_schedule(scheduled_for) WHERE status = 'scheduled';

-- Campaign Metrics indexes
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_workspace_id ON campaign_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_contact_id ON campaign_metrics(contact_id);

-- Opportunities campaign indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_campaign_id ON opportunities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_ab_test_id ON opportunities(ab_test_id);

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- Add foreign key constraint for contacts.current_campaign_id (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_contacts_current_campaign'
    ) THEN
        ALTER TABLE contacts
        ADD CONSTRAINT fk_contacts_current_campaign
        FOREIGN KEY (current_campaign_id) REFERENCES campaigns(id);
    END IF;
END $$;

-- Unique constraint for current campaign participation (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_current_campaign_per_contact'
    ) THEN
        ALTER TABLE campaign_participants
        ADD CONSTRAINT unique_current_campaign_per_contact
        UNIQUE (contact_id) DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- =============================================================================
-- FUNCTIONS FOR CAMPAIGN MANAGEMENT
-- =============================================================================

-- Function to schedule re-engagement notifications
CREATE OR REPLACE FUNCTION schedule_reengagement(
    p_contact_id UUID,
    p_hold_until TIMESTAMPTZ,
    p_workspace_id UUID
) RETURNS VOID AS $$
DECLARE
    reengagement_campaign_id UUID;
    notification_dates TIMESTAMPTZ[];
BEGIN
    -- Find re-engagement campaign
    SELECT id INTO reengagement_campaign_id
    FROM campaigns 
    WHERE workspace_id = p_workspace_id 
    AND campaign_type = 'reengagement' 
    AND status = 'active'
    LIMIT 1;
    
    -- If no re-engagement campaign exists, create one
    IF reengagement_campaign_id IS NULL THEN
        INSERT INTO campaigns (workspace_id, name, description, campaign_type, objective, status, ai_optimization_enabled)
        VALUES (p_workspace_id, 'Auto Re-engagement', 'Automatically created re-engagement campaign', 'reengagement', 'reengagement', 'active', true)
        RETURNING id INTO reengagement_campaign_id;
    END IF;
    
    -- Calculate notification dates (7 days before, 1 day before, on date)
    notification_dates := ARRAY[
        p_hold_until - INTERVAL '7 days',
        p_hold_until - INTERVAL '1 day', 
        p_hold_until
    ];
    
    -- Create scheduled notifications
    INSERT INTO reengagement_schedule (workspace_id, contact_id, campaign_id, scheduled_for, notification_type, notification_data)
    SELECT 
        p_workspace_id,
        p_contact_id,
        reengagement_campaign_id,
        unnest(notification_dates),
        CASE 
            WHEN unnest(notification_dates) = p_hold_until THEN 'ai_notification'
            ELSE 'email_reminder'
        END,
        jsonb_build_object(
            'hold_expires', p_hold_until,
            'contact_id', p_contact_id,
            'message', CASE 
                WHEN unnest(notification_dates) = p_hold_until THEN 'Contact hold period has expired - ready for re-engagement'
                ELSE 'Contact hold period expires soon'
            END
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign leads to campaigns automatically
CREATE OR REPLACE FUNCTION assign_lead_to_campaign()
RETURNS TRIGGER AS $$
DECLARE
    default_campaign_id UUID;
    hold_campaign_id UUID;
    previous_campaign_id UUID;
BEGIN
    -- Store previous campaign for transition tracking
    IF TG_OP = 'UPDATE' THEN
        previous_campaign_id := OLD.current_campaign_id;
    END IF;
    
    -- Handle hold state assignment
    IF NEW.lifecycle_stage = 'on_hold' THEN
        -- Find or create hold management campaign
        SELECT c.id INTO NEW.current_campaign_id
        FROM campaigns c
        WHERE c.workspace_id = NEW.workspace_id
        AND c.campaign_type = 'on_hold'
        AND c.status = 'active'
        LIMIT 1;
        
        -- Create hold campaign if it doesn't exist
        IF NEW.current_campaign_id IS NULL THEN
            INSERT INTO campaigns (workspace_id, name, description, campaign_type, objective, status, ai_optimization_enabled, automation_rules)
            VALUES (NEW.workspace_id, 'Hold Management', 'Manages contacts who are on hold and schedules re-engagement', 'on_hold', 'hold_management', 'active', true, 
                    '{"hold_monitoring": true, "auto_reengagement": true}')
            RETURNING id INTO NEW.current_campaign_id;
        END IF;
        
        -- Set assignment timestamp
        NEW.campaign_assigned_at = now();
        
        -- Schedule re-engagement if hold_until is set
        IF NEW.hold_until IS NOT NULL THEN
            PERFORM schedule_reengagement(NEW.id, NEW.hold_until, NEW.workspace_id);
        END IF;
        
        -- Create campaign participant record
        INSERT INTO campaign_participants (workspace_id, campaign_id, contact_id, assigned_at, metadata)
        VALUES (NEW.workspace_id, NEW.current_campaign_id, NEW.id, now(), 
                jsonb_build_object('hold_until', NEW.hold_until, 'hold_reason', NEW.hold_reason))
        ON CONFLICT (contact_id) WHERE is_current = true 
        DO UPDATE SET 
            campaign_id = NEW.current_campaign_id,
            metadata = jsonb_build_object('hold_until', NEW.hold_until, 'hold_reason', NEW.hold_reason),
            assigned_at = now();
            
        -- Record transition if changing campaigns
        IF previous_campaign_id IS NOT NULL AND previous_campaign_id != NEW.current_campaign_id THEN
            INSERT INTO campaign_transitions (workspace_id, contact_id, from_campaign_id, to_campaign_id, transition_reason)
            VALUES (NEW.workspace_id, NEW.id, previous_campaign_id, NEW.current_campaign_id, 'moved_to_hold');
        END IF;
            
        RETURN NEW;
    END IF;
    
    -- Handle coming off hold - transition to re-engagement
    IF TG_OP = 'UPDATE' AND OLD.lifecycle_stage = 'on_hold' AND NEW.lifecycle_stage != 'on_hold' THEN
        -- Find appropriate re-engagement campaign
        SELECT c.id INTO NEW.current_campaign_id
        FROM campaigns c
        WHERE c.workspace_id = NEW.workspace_id
        AND c.campaign_type = 'reengagement'
        AND c.status = 'active'
        ORDER BY c.created_at DESC
        LIMIT 1;
        
        -- If no specific re-engagement campaign, use AI default
        IF NEW.current_campaign_id IS NULL THEN
            SELECT c.id INTO NEW.current_campaign_id
            FROM campaigns c
            WHERE c.workspace_id = NEW.workspace_id
            AND c.campaign_type = 'ai_automated'
            AND c.status = 'active'
            LIMIT 1;
        END IF;
        
        -- Record the transition
        INSERT INTO campaign_transitions (workspace_id, contact_id, from_campaign_id, to_campaign_id, transition_reason, transition_data)
        VALUES (NEW.workspace_id, NEW.id, OLD.current_campaign_id, NEW.current_campaign_id, 'hold_expired', 
                jsonb_build_object('hold_duration_days', EXTRACT(days FROM now() - OLD.campaign_assigned_at)));
    END IF;
    
    -- For new leads (not on hold), find the appropriate campaign
    IF NEW.lifecycle_stage = 'lead' AND (TG_OP = 'INSERT' OR OLD.lifecycle_stage IS DISTINCT FROM 'lead') AND NEW.lifecycle_stage != 'on_hold' THEN
        
        -- First, check for active targeted campaigns that match this lead
        SELECT c.id INTO NEW.current_campaign_id
        FROM campaigns c
        WHERE c.workspace_id = NEW.workspace_id
        AND c.status = 'active'
        AND c.objective IN ('lead_generation', 'ai_qualification')
        -- TODO: Add logic here to check audience_criteria JSONB matching
        ORDER BY c.created_at DESC
        LIMIT 1;
        
        -- If no targeted campaign found, assign to default AI campaign
        IF NEW.current_campaign_id IS NULL THEN
            SELECT c.id INTO NEW.current_campaign_id
            FROM campaigns c
            WHERE c.workspace_id = NEW.workspace_id
            AND c.campaign_type = 'ai_automated'
            AND c.status = 'active'
            LIMIT 1;
            
            -- Create default AI campaign if it doesn't exist
            IF NEW.current_campaign_id IS NULL THEN
                INSERT INTO campaigns (workspace_id, name, description, campaign_type, objective, status, ai_optimization_enabled, automation_rules)
                VALUES (NEW.workspace_id, 'AI Default Lead Nurture', 'Fully automated AI-driven lead nurturing and interaction campaign', 'ai_automated', 'ai_nurture', 'active', true, 
                        '{"auto_assign_new_leads": true, "ai_interaction_frequency": "smart"}')
                RETURNING id INTO NEW.current_campaign_id;
            END IF;
        END IF;
        
        -- Set assignment timestamp
        NEW.campaign_assigned_at = now();
        
        -- Create campaign participant record
        INSERT INTO campaign_participants (workspace_id, campaign_id, contact_id, assigned_at)
        VALUES (NEW.workspace_id, NEW.current_campaign_id, NEW.id, now())
        ON CONFLICT (contact_id) WHERE is_current = true 
        DO UPDATE SET 
            campaign_id = NEW.current_campaign_id,
            assigned_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic campaign assignment
DROP TRIGGER IF EXISTS trigger_assign_lead_to_campaign ON contacts;
CREATE TRIGGER trigger_assign_lead_to_campaign
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION assign_lead_to_campaign();
