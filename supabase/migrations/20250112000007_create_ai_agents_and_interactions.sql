-- =============================================================================
-- MIGRATION: AI Agents and Interactions
-- =============================================================================
-- Description: Creates ai_agents, agent_memory, ai_interactions with vector embeddings and proper indexing
-- Version: 1.0.0
-- Created: 2025-01-12

-- Enable required extensions for vector operations
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- AI AGENTS TABLE
-- =============================================================================

CREATE TABLE public.ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Agent configuration
  role TEXT NOT NULL CHECK (role IN ('follow_up', 'insight', 'design', 'support', 'marketing', 'sales', 'analysis')),
  agent_type TEXT DEFAULT 'assistant' CHECK (agent_type IN ('assistant', 'workflow', 'analyzer', 'generator')),
  
  -- AI model configuration
  model_provider TEXT DEFAULT 'deepinfra' CHECK (model_provider IN ('openai', 'anthropic', 'deepinfra', 'local')),
  model_name TEXT DEFAULT 'deepseek-ai/DeepSeek-V3-0324',
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 4000,
  
  -- Agent capabilities
  capabilities JSONB DEFAULT '{}',
  tools JSONB DEFAULT '[]',
  system_prompt TEXT,
  
  -- Configuration and settings
  config JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  
  -- Performance tracking
  total_interactions INTEGER DEFAULT 0,
  successful_interactions INTEGER DEFAULT 0,
  average_response_time DECIMAL(8,2), -- in milliseconds
  last_performance_review TIMESTAMP WITH TIME ZONE,
  
  -- Status and lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  is_learning BOOLEAN DEFAULT TRUE,
  version TEXT DEFAULT '1.0.0',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- AGENT MEMORY TABLE
-- =============================================================================

CREATE TABLE public.agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  
  -- Memory context
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'lead', 'user', 'global', 'conversation', 'task')),
  entity_id UUID,
  
  -- Memory classification
  memory_type TEXT NOT NULL CHECK (memory_type IN ('conversation', 'insight', 'preference', 'fact', 'pattern', 'feedback')),
  importance_score INTEGER DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
  
  -- Memory content
  title TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  
  -- Vector embedding for semantic search
  embedding VECTOR(1536), -- OpenAI embedding dimension
  
  -- Context and relationships
  related_memories UUID[] DEFAULT '{}',
  conversation_id UUID,
  session_id UUID,
  
  -- Memory lifecycle
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  confidence_score DECIMAL(5,2) DEFAULT 100.0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Expiration and cleanup
  expires_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AI INTERACTIONS TABLE
-- =============================================================================

CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  agent_id UUID REFERENCES public.ai_agents(id),
  client_id UUID REFERENCES public.clients(id),
  lead_id UUID REFERENCES public.leads(id),
  user_id UUID REFERENCES public.users(id),
  
  -- Interaction classification
  type TEXT CHECK (type IN ('Chat', 'Follow-Up', 'Summary', 'Prediction', 'PromptResponse', 'Analysis', 'Recommendation')),
  source TEXT CHECK (source IN ('Agent UI', 'Marketing Automation', 'AI Assistant', 'Backend Middleware', 'API', 'Webhook')),
  
  -- Interaction content
  prompt TEXT,
  content TEXT,
  ai_response TEXT,
  summary TEXT,
  
  -- AI model details
  model_used TEXT,
  model_provider TEXT,
  temperature DOUBLE PRECISION,
  tokens_used INTEGER,
  
  -- Performance metrics
  response_time_ms INTEGER,
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 5),
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
  
  -- Context and session
  conversation_id UUID,
  session_id UUID,
  context JSONB DEFAULT '{}',
  
  -- Results and actions
  actions_taken JSONB DEFAULT '[]',
  results JSONB DEFAULT '{}',
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- CONVERSATION SESSIONS TABLE
-- =============================================================================

CREATE TABLE public.conversation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  agent_id UUID REFERENCES public.ai_agents(id),
  user_id UUID REFERENCES public.users(id),
  client_id UUID REFERENCES public.clients(id),
  lead_id UUID REFERENCES public.leads(id),
  
  -- Session details
  title TEXT,
  purpose TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'error')),
  
  -- Session metrics
  total_interactions INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  average_response_time DECIMAL(8,2),
  
  -- Session context
  context JSONB DEFAULT '{}',
  summary TEXT,
  
  -- Outcomes
  goals_achieved JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  next_steps JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- AI agents indexes
CREATE INDEX idx_ai_agents_role ON public.ai_agents(role);
CREATE INDEX idx_ai_agents_agent_type ON public.ai_agents(agent_type);
CREATE INDEX idx_ai_agents_is_active ON public.ai_agents(is_active);
CREATE INDEX idx_ai_agents_model_provider ON public.ai_agents(model_provider);
CREATE INDEX idx_ai_agents_created_by ON public.ai_agents(created_by);
CREATE INDEX idx_ai_agents_last_used_at ON public.ai_agents(last_used_at);

-- Agent memory indexes
CREATE INDEX idx_agent_memory_agent_id ON public.agent_memory(agent_id);
CREATE INDEX idx_agent_memory_entity ON public.agent_memory(entity_type, entity_id);
CREATE INDEX idx_agent_memory_memory_type ON public.agent_memory(memory_type);
CREATE INDEX idx_agent_memory_importance ON public.agent_memory(importance_score);
CREATE INDEX idx_agent_memory_created_at ON public.agent_memory(created_at);
CREATE INDEX idx_agent_memory_expires_at ON public.agent_memory(expires_at);
CREATE INDEX idx_agent_memory_is_archived ON public.agent_memory(is_archived);

-- Vector similarity search index
CREATE INDEX idx_agent_memory_embedding ON public.agent_memory 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- AI interactions indexes
CREATE INDEX idx_ai_interactions_agent_id ON public.ai_interactions(agent_id);
CREATE INDEX idx_ai_interactions_client_id ON public.ai_interactions(client_id);
CREATE INDEX idx_ai_interactions_lead_id ON public.ai_interactions(lead_id);
CREATE INDEX idx_ai_interactions_user_id ON public.ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_type ON public.ai_interactions(type);
CREATE INDEX idx_ai_interactions_source ON public.ai_interactions(source);
CREATE INDEX idx_ai_interactions_conversation_id ON public.ai_interactions(conversation_id);
CREATE INDEX idx_ai_interactions_created_at ON public.ai_interactions(created_at);
CREATE INDEX idx_ai_interactions_follow_up_required ON public.ai_interactions(follow_up_required);
CREATE INDEX idx_ai_interactions_follow_up_date ON public.ai_interactions(follow_up_date);

-- Conversation sessions indexes
CREATE INDEX idx_conversation_sessions_agent_id ON public.conversation_sessions(agent_id);
CREATE INDEX idx_conversation_sessions_user_id ON public.conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_client_id ON public.conversation_sessions(client_id);
CREATE INDEX idx_conversation_sessions_lead_id ON public.conversation_sessions(lead_id);
CREATE INDEX idx_conversation_sessions_status ON public.conversation_sessions(status);
CREATE INDEX idx_conversation_sessions_created_at ON public.conversation_sessions(created_at);

-- JSONB indexes
CREATE INDEX idx_ai_agents_config ON public.ai_agents USING GIN (config);
CREATE INDEX idx_ai_agents_capabilities ON public.ai_agents USING GIN (capabilities);
CREATE INDEX idx_agent_memory_metadata ON public.agent_memory USING GIN (metadata);
CREATE INDEX idx_ai_interactions_context ON public.ai_interactions USING GIN (context);
CREATE INDEX idx_ai_interactions_results ON public.ai_interactions USING GIN (results);
CREATE INDEX idx_conversation_sessions_context ON public.conversation_sessions USING GIN (context);

-- Full-text search indexes
CREATE INDEX idx_agent_memory_content_search ON public.agent_memory 
  USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(summary, '')));

CREATE INDEX idx_ai_interactions_content_search ON public.ai_interactions 
  USING GIN (to_tsvector('english', COALESCE(prompt, '') || ' ' || COALESCE(ai_response, '') || ' ' || COALESCE(summary, '')));

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

-- AI agents - viewable by all authenticated users, manageable by admins
CREATE POLICY "AI agents are viewable by all users" ON public.ai_agents
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage AI agents" ON public.ai_agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Agent memory - users can view memory for entities they have access to
CREATE POLICY "Users can view agent memory they have access to" ON public.agent_memory
  FOR SELECT USING (
    -- Global memory is viewable by all
    entity_type = 'global' OR
    -- User-specific memory
    (entity_type = 'user' AND entity_id = auth.uid()) OR
    -- Client memory - if user has access to client
    (entity_type = 'client' AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = agent_memory.entity_id AND c.created_by = auth.uid()
    )) OR
    -- Lead memory - if user has access to lead
    (entity_type = 'lead' AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = agent_memory.entity_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    )) OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert agent memory" ON public.agent_memory
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- AI interactions - users can view interactions for entities they have access to
CREATE POLICY "Users can view AI interactions they have access to" ON public.ai_interactions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = ai_interactions.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = ai_interactions.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert AI interactions" ON public.ai_interactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Conversation sessions - similar access pattern
CREATE POLICY "Users can view conversation sessions they have access to" ON public.conversation_sessions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = conversation_sessions.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = conversation_sessions.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert conversation sessions" ON public.conversation_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Apply standard audit triggers
CREATE TRIGGER update_ai_agents_audit_fields
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_address_audit_fields();

CREATE TRIGGER update_agent_memory_updated_at
  BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversation_sessions_updated_at
  BEFORE UPDATE ON public.conversation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Set created_by triggers
CREATE TRIGGER set_ai_agents_created_by
  BEFORE INSERT ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Function to update agent performance metrics
CREATE OR REPLACE FUNCTION public.update_agent_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update agent statistics when interaction is completed
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE public.ai_agents
    SET
      total_interactions = total_interactions + 1,
      successful_interactions = CASE
        WHEN NEW.error_message IS NULL THEN successful_interactions + 1
        ELSE successful_interactions
      END,
      last_used_at = NEW.completed_at,
      updated_at = NOW()
    WHERE id = NEW.agent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update agent performance
CREATE TRIGGER update_agent_performance_on_interaction
  AFTER UPDATE ON public.ai_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_agent_performance();

-- Function to update memory access tracking
CREATE OR REPLACE FUNCTION public.track_memory_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.access_count = OLD.access_count + 1;
  NEW.last_accessed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for semantic memory search
CREATE OR REPLACE FUNCTION public.search_agent_memory(
  agent_id_param UUID,
  query_embedding VECTOR(1536),
  entity_type_param TEXT DEFAULT NULL,
  entity_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 10,
  similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  content TEXT,
  similarity DECIMAL,
  memory_type TEXT,
  importance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.content,
    (1 - (m.embedding <=> query_embedding))::DECIMAL as similarity,
    m.memory_type,
    m.importance_score
  FROM public.agent_memory m
  WHERE m.agent_id = agent_id_param
    AND m.is_archived = FALSE
    AND (entity_type_param IS NULL OR m.entity_type = entity_type_param)
    AND (entity_id_param IS NULL OR m.entity_id = entity_id_param)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND (1 - (m.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY similarity DESC, m.importance_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.ai_agents IS 'AI agents with configurable models and capabilities';
COMMENT ON TABLE public.agent_memory IS 'Agent memory storage with vector embeddings for semantic search';
COMMENT ON TABLE public.ai_interactions IS 'AI interaction logging with performance metrics and context';
COMMENT ON TABLE public.conversation_sessions IS 'Conversation session management for multi-turn interactions';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON public.ai_agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_memory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_agent_memory(UUID, VECTOR(1536), TEXT, UUID, INTEGER, DECIMAL) TO authenticated;
