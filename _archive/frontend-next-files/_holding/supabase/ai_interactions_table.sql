-- AI Interactions Table
-- This table stores all conversations between the AI and end users (whether users or leads)
-- It enables prompt-response logging, AI auditing, and memory-driven suggestions or summaries

CREATE TABLE ai_interactions (
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

-- Create indexes for faster queries
CREATE INDEX ai_interactions_lead_id_idx ON ai_interactions (lead_id);
CREATE INDEX ai_interactions_client_id_idx ON ai_interactions (client_id);
CREATE INDEX ai_interactions_type_idx ON ai_interactions (type);
CREATE INDEX ai_interactions_created_at_idx ON ai_interactions (created_at);
