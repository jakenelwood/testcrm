-- Support Tickets Table
-- This table stores customer service issues and resolutions
-- It allows AI to triage, summarize, or escalate based on history

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_by TEXT,
  issue_type TEXT,
  issue_description TEXT,
  resolution_summary TEXT,
  status TEXT CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Escalated')),
  assigned_to TEXT,
  notes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX support_tickets_client_id_idx ON support_tickets (client_id);
CREATE INDEX support_tickets_lead_id_idx ON support_tickets (lead_id);
CREATE INDEX support_tickets_status_idx ON support_tickets (status);
CREATE INDEX support_tickets_assigned_to_idx ON support_tickets (assigned_to);
CREATE INDEX support_tickets_created_at_idx ON support_tickets (created_at);
