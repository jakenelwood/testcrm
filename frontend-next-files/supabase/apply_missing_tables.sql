-- Script to apply missing tables to the Supabase database
-- This script combines the AI Interactions and Support Tickets tables

-- AI Interactions Table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('Chat', 'Follow-Up', 'Summary', 'Prediction', 'PromptResponse')),
  source TEXT CHECK (source IN ('Agent UI', 'Marketing Automation', 'AI Assistant', 'Backend Middleware')),
  content TEXT,
  ai_response TEXT,
  summary TEXT,
  model_used TEXT,
  temperature FLOAT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AI Interactions
CREATE INDEX IF NOT EXISTS ai_interactions_lead_id_idx ON ai_interactions (lead_id);
CREATE INDEX IF NOT EXISTS ai_interactions_client_id_idx ON ai_interactions (client_id);
CREATE INDEX IF NOT EXISTS ai_interactions_type_idx ON ai_interactions (type);
CREATE INDEX IF NOT EXISTS ai_interactions_created_at_idx ON ai_interactions (created_at);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
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

-- Create indexes for Support Tickets
CREATE INDEX IF NOT EXISTS support_tickets_client_id_idx ON support_tickets (client_id);
CREATE INDEX IF NOT EXISTS support_tickets_lead_id_idx ON support_tickets (lead_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_assigned_to_idx ON support_tickets (assigned_to);
CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON support_tickets (created_at);

-- Enable Row Level Security (RLS) for both tables
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_interactions
CREATE POLICY "Users can view their own AI interactions" 
  ON ai_interactions FOR SELECT 
  USING (auth.uid() = created_by::uuid);

-- Create RLS policies for support_tickets
CREATE POLICY "Users can view their assigned support tickets" 
  ON support_tickets FOR SELECT 
  USING (auth.uid() = assigned_to::uuid OR auth.uid() = created_by::uuid);

CREATE POLICY "Users can update their assigned support tickets" 
  ON support_tickets FOR UPDATE 
  USING (auth.uid() = assigned_to::uuid);
