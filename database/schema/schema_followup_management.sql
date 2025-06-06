-- 📅 Comprehensive Follow-up Management System
-- Handles scheduled lead reactivation, pipeline management, and automated workflows

-- =============================================================================
-- FOLLOW-UP SCHEDULING SYSTEM
-- =============================================================================

-- Main follow-up scheduling table
CREATE TABLE follow_up_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Entity being scheduled
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'winback')),
  entity_id UUID NOT NULL,
  
  -- Organization context
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assigned_to UUID REFERENCES users(id),
  
  -- Follow-up details
  follow_up_type TEXT NOT NULL CHECK (follow_up_type IN (
    'Quote_Follow_Up',           -- After quote provided
    'Future_Contact',            -- General future contact
    'Renewal_Reminder',          -- Policy renewal
    'Rate_Review',               -- Annual rate review
    'Life_Event_Check',          -- Marriage, new car, etc.
    'Seasonal_Contact',          -- Seasonal insurance needs
    'Win_Back_Campaign',         -- Re-engagement attempt
    'Custom'                     -- User-defined
  )),
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  
  -- Context and instructions
  follow_up_reason TEXT NOT NULL,
  follow_up_instructions TEXT,
  context_notes TEXT,
  
  -- Pipeline management
  target_pipeline_id INTEGER REFERENCES pipelines(id),
  target_status_id INTEGER REFERENCES lead_statuses(id),
  should_reactivate_lead BOOLEAN DEFAULT TRUE,
  
  -- Priority and urgency
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  urgency TEXT DEFAULT 'Normal' CHECK (urgency IN ('Low', 'Normal', 'High', 'Critical')),
  
  -- Automation settings
  auto_create_task BOOLEAN DEFAULT TRUE,
  auto_send_reminder BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER DEFAULT 1,
  
  -- Execution tracking
  status TEXT DEFAULT 'Scheduled' CHECK (status IN (
    'Scheduled',     -- Waiting for scheduled date
    'Due',          -- Past scheduled date, needs action
    'In_Progress',  -- Currently being worked
    'Completed',    -- Follow-up completed
    'Cancelled',    -- Cancelled before execution
    'Rescheduled'   -- Moved to different date
  )),
  
  executed_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID REFERENCES users(id),
  execution_notes TEXT,
  outcome TEXT CHECK (outcome IN ('Contacted', 'No_Answer', 'Rescheduled', 'Converted', 'Lost')),
  
  -- Rescheduling
  original_schedule_id UUID REFERENCES follow_up_schedules(id),
  reschedule_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB,
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================================================
-- LEAD HIBERNATION SYSTEM
-- =============================================================================

-- Track when leads are "hidden" and should reappear
CREATE TABLE lead_hibernation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Hibernation details
  hibernated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hibernated_by UUID NOT NULL REFERENCES users(id),
  hibernation_reason TEXT NOT NULL,
  
  -- Reactivation settings
  reactivation_date DATE NOT NULL,
  reactivation_pipeline_id INTEGER REFERENCES pipelines(id),
  reactivation_status_id INTEGER REFERENCES lead_statuses(id),
  reactivation_instructions TEXT,
  
  -- Current state preservation
  original_pipeline_id INTEGER REFERENCES pipelines(id),
  original_status_id INTEGER REFERENCES lead_statuses(id),
  original_assigned_to UUID REFERENCES users(id),
  
  -- Reactivation tracking
  is_reactivated BOOLEAN DEFAULT FALSE,
  reactivated_at TIMESTAMP WITH TIME ZONE,
  reactivated_by UUID REFERENCES users(id),
  
  -- Follow-up schedule link
  follow_up_schedule_id UUID REFERENCES follow_up_schedules(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AUTOMATED TASK GENERATION
-- =============================================================================

-- Tasks generated from follow-up schedules
CREATE TABLE follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follow_up_schedule_id UUID NOT NULL REFERENCES follow_up_schedules(id) ON DELETE CASCADE,
  
  -- Task details
  task_type TEXT NOT NULL CHECK (task_type IN (
    'Phone_Call',
    'Email',
    'Meeting',
    'Quote_Update',
    'Rate_Review',
    'Document_Send',
    'Custom'
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Assignment
  assigned_to UUID NOT NULL REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  
  -- Scheduling
  due_date DATE NOT NULL,
  due_time TIME,
  estimated_duration INTEGER, -- minutes
  
  -- Priority
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  urgency TEXT DEFAULT 'Normal' CHECK (urgency IN ('Low', 'Normal', 'High', 'Critical')),
  
  -- Status tracking
  status TEXT DEFAULT 'Open' CHECK (status IN (
    'Open',
    'In_Progress', 
    'Completed',
    'Cancelled',
    'Overdue'
  )),
  
  -- Completion tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  
  -- Results
  outcome TEXT,
  next_action_needed BOOLEAN DEFAULT FALSE,
  next_action_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- FOLLOW-UP TEMPLATES AND AUTOMATION
-- =============================================================================

-- Predefined follow-up templates for common scenarios
CREATE TABLE follow_up_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'Quote_Follow_Up',
    'Future_Contact',
    'Renewal_Reminder',
    'Rate_Review',
    'Life_Event',
    'Seasonal',
    'Win_Back',
    'Custom'
  )),
  
  -- Default settings
  default_days_offset INTEGER NOT NULL, -- Days from trigger event
  default_priority INTEGER DEFAULT 5,
  default_instructions TEXT,
  
  -- Pipeline settings
  target_pipeline_id INTEGER REFERENCES pipelines(id),
  target_status_id INTEGER REFERENCES lead_statuses(id),
  
  -- Automation settings
  auto_create_task BOOLEAN DEFAULT TRUE,
  auto_send_reminder BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER DEFAULT 1,
  
  -- Template content
  email_template TEXT,
  sms_template TEXT,
  call_script TEXT,
  
  -- Conditions for auto-application
  trigger_conditions JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================================================
-- PIPELINE AUTOMATION RULES
-- =============================================================================

-- Rules for automatic pipeline and status changes
CREATE TABLE pipeline_automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Rule identification
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'Follow_Up_Reactivation',
    'Time_Based_Movement',
    'Activity_Based_Movement',
    'Status_Auto_Change',
    'Assignment_Change'
  )),
  
  -- Trigger conditions
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'Follow_Up_Due',
    'Days_In_Status',
    'No_Activity_Days',
    'Quote_Expired',
    'Specific_Date',
    'Manual_Trigger'
  )),
  
  trigger_conditions JSONB NOT NULL,
  
  -- Source criteria
  source_pipeline_id INTEGER REFERENCES pipelines(id),
  source_status_id INTEGER REFERENCES lead_statuses(id),
  
  -- Target changes
  target_pipeline_id INTEGER REFERENCES pipelines(id),
  target_status_id INTEGER REFERENCES lead_statuses(id),
  target_assigned_to UUID REFERENCES users(id),
  
  -- Actions to take
  actions JSONB, -- Array of actions like create_task, send_email, etc.
  
  -- Rule settings
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 5,
  
  -- Execution tracking
  last_executed_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================================================
-- FOLLOW-UP EXECUTION LOG
-- =============================================================================

-- Track all follow-up executions for reporting and analysis
CREATE TABLE follow_up_execution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follow_up_schedule_id UUID REFERENCES follow_up_schedules(id),
  follow_up_task_id UUID REFERENCES follow_up_tasks(id),
  
  -- Execution details
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_by UUID NOT NULL REFERENCES users(id),
  execution_method TEXT CHECK (execution_method IN ('Manual', 'Automated', 'Triggered')),
  
  -- Results
  outcome TEXT NOT NULL,
  contact_successful BOOLEAN,
  lead_response TEXT,
  next_steps TEXT,
  
  -- Pipeline changes made
  pipeline_changed BOOLEAN DEFAULT FALSE,
  old_pipeline_id INTEGER REFERENCES pipelines(id),
  new_pipeline_id INTEGER REFERENCES pipelines(id),
  old_status_id INTEGER REFERENCES lead_statuses(id),
  new_status_id INTEGER REFERENCES lead_statuses(id),
  
  -- Follow-up scheduling
  new_follow_up_scheduled BOOLEAN DEFAULT FALSE,
  new_follow_up_date DATE,
  
  -- Metadata
  execution_notes TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Follow-up schedules indexes
CREATE INDEX idx_follow_up_schedules_entity ON follow_up_schedules(entity_type, entity_id);
CREATE INDEX idx_follow_up_schedules_organization ON follow_up_schedules(organization_id);
CREATE INDEX idx_follow_up_schedules_assigned_to ON follow_up_schedules(assigned_to);
CREATE INDEX idx_follow_up_schedules_scheduled_date ON follow_up_schedules(scheduled_date);
CREATE INDEX idx_follow_up_schedules_status ON follow_up_schedules(status);
CREATE INDEX idx_follow_up_schedules_due ON follow_up_schedules(scheduled_date, status) WHERE status IN ('Scheduled', 'Due');

-- Lead hibernation indexes
CREATE INDEX idx_lead_hibernation_lead_id ON lead_hibernation(lead_id);
CREATE INDEX idx_lead_hibernation_reactivation_date ON lead_hibernation(reactivation_date);
CREATE INDEX idx_lead_hibernation_is_reactivated ON lead_hibernation(is_reactivated);

-- Follow-up tasks indexes
CREATE INDEX idx_follow_up_tasks_assigned_to ON follow_up_tasks(assigned_to);
CREATE INDEX idx_follow_up_tasks_due_date ON follow_up_tasks(due_date);
CREATE INDEX idx_follow_up_tasks_status ON follow_up_tasks(status);
CREATE INDEX idx_follow_up_tasks_overdue ON follow_up_tasks(due_date, status) WHERE status = 'Open' AND due_date < CURRENT_DATE;

-- Templates and automation indexes
CREATE INDEX idx_follow_up_templates_organization ON follow_up_templates(organization_id);
CREATE INDEX idx_follow_up_templates_type ON follow_up_templates(template_type);
CREATE INDEX idx_pipeline_automation_rules_organization ON pipeline_automation_rules(organization_id);
CREATE INDEX idx_pipeline_automation_rules_active ON pipeline_automation_rules(is_active);

-- Execution log indexes
CREATE INDEX idx_follow_up_execution_log_executed_at ON follow_up_execution_log(executed_at);
CREATE INDEX idx_follow_up_execution_log_executed_by ON follow_up_execution_log(executed_by);

-- =============================================================================
-- SAMPLE FOLLOW-UP TEMPLATES
-- =============================================================================

-- Insert common follow-up templates
INSERT INTO follow_up_templates (organization_id, name, description, template_type, default_days_offset, default_instructions) 
SELECT 
  id,
  'Quote Follow-up (3 days)',
  'Follow up 3 days after quote is provided',
  'Quote_Follow_Up',
  3,
  'Contact lead to discuss the quote provided and answer any questions'
FROM organizations
UNION ALL
SELECT 
  id,
  'Quote Follow-up (1 week)',
  'Follow up 1 week after quote if no response',
  'Quote_Follow_Up',
  7,
  'Second follow-up on quote - check if they need more time or have questions'
FROM organizations
UNION ALL
SELECT 
  id,
  'Future Contact (30 days)',
  'General future contact in 30 days',
  'Future_Contact',
  30,
  'Check back with lead about their insurance needs'
FROM organizations
UNION ALL
SELECT 
  id,
  'Future Contact (90 days)',
  'Quarterly check-in with lead',
  'Future_Contact',
  90,
  'Quarterly follow-up to see if insurance needs have changed'
FROM organizations;
