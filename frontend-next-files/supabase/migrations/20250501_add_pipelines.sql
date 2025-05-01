-- Migration to add pipeline management functionality
-- This adds support for multiple pipelines, each with their own set of statuses

-- Create pipelines table
CREATE TABLE pipelines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pipeline_statuses table
CREATE TABLE pipeline_statuses (
  id SERIAL PRIMARY KEY,
  pipeline_id INT REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  display_order INT NOT NULL,
  color_hex TEXT,                      -- For UI display (e.g., #FF5733)
  icon_name TEXT,                      -- For UI display (e.g., 'phone', 'document')
  ai_action_template TEXT,             -- Template for AI-suggested actions at this status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique status names within a pipeline
  UNIQUE(pipeline_id, name)
);

-- Add pipeline_id to leads table
ALTER TABLE leads ADD COLUMN pipeline_id INT REFERENCES pipelines(id);

-- Create a default pipeline
INSERT INTO pipelines (name, description, is_default, display_order)
VALUES ('Default Sales Pipeline', 'Standard sales pipeline for insurance leads', TRUE, 1);

-- Migrate existing lead_statuses to pipeline_statuses for the default pipeline
INSERT INTO pipeline_statuses (
  pipeline_id, 
  name, 
  description, 
  is_final, 
  display_order, 
  color_hex, 
  icon_name, 
  ai_action_template
)
SELECT 
  1 as pipeline_id, -- Default pipeline ID
  value as name, 
  description, 
  is_final, 
  display_order, 
  color_hex, 
  icon_name, 
  ai_action_template
FROM lead_statuses;

-- Update leads to use the default pipeline
UPDATE leads SET pipeline_id = 1;

-- Make pipeline_id NOT NULL after migration
ALTER TABLE leads ALTER COLUMN pipeline_id SET NOT NULL;

-- Create index for faster lookups
CREATE INDEX idx_leads_pipeline_id ON leads(pipeline_id);
CREATE INDEX idx_pipeline_statuses_pipeline_id ON pipeline_statuses(pipeline_id);
