-- Developer Notes Table
-- This table stores development-related notes, decisions, and documentation
-- It helps track the evolution of the application and preserve institutional knowledge

CREATE TABLE developer_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,  -- e.g., 'bug', 'feature', 'decision', 'architecture', 'refactor'
  tags TEXT[] DEFAULT '{}',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT CHECK (status IN ('open', 'in-progress', 'resolved', 'documented')),
  
  -- Structured content
  summary TEXT NOT NULL,
  description TEXT,
  solution TEXT,
  
  -- Related entities
  related_table TEXT,  -- e.g., 'leads', 'clients', etc.
  related_feature TEXT, -- e.g., 'authentication', 'reporting', 'dashboard'
  related_files TEXT[],
  
  -- Flexible content in JSONB
  technical_details JSONB,  -- For code snippets, error messages, stack traces
  decision_context JSONB,   -- For decision records (problem, options, decision, consequences)
  implementation_notes JSONB, -- For implementation details that might change
  
  -- Metadata
  created_by TEXT NOT NULL,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX developer_notes_category_idx ON developer_notes (category);
CREATE INDEX developer_notes_tags_idx ON developer_notes USING GIN (tags);
CREATE INDEX developer_notes_status_idx ON developer_notes (status);
CREATE INDEX developer_notes_created_by_idx ON developer_notes (created_by);
CREATE INDEX developer_notes_related_table_idx ON developer_notes (related_table);
CREATE INDEX developer_notes_related_feature_idx ON developer_notes (related_feature);

-- Enable Row Level Security
ALTER TABLE developer_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Everyone can view developer notes" 
  ON developer_notes FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create developer notes" 
  ON developer_notes FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own developer notes" 
  ON developer_notes FOR UPDATE 
  USING (auth.uid()::text = created_by OR auth.uid()::text = assigned_to);

-- Add a comment to the table
COMMENT ON TABLE developer_notes IS 'Stores development-related notes, decisions, and documentation to track the evolution of the application and preserve institutional knowledge.';
