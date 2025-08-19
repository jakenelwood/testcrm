-- 🔍 Vector Search Functions for AI-Native CRM
-- Implements semantic search capabilities using pgvector

BEGIN;

-- =============================================================================
-- VECTOR SEARCH FUNCTIONS
-- =============================================================================

-- Function to search contacts by embedding similarity
CREATE OR REPLACE FUNCTION search_contacts_by_embedding(
  query_embedding vector(1024),
  workspace_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  lifecycle_stage contact_lifecycle_stage,
  job_title text,
  ai_risk_score integer,
  ai_lifetime_value decimal,
  similarity float,
  account_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.lifecycle_stage,
    c.job_title,
    c.ai_risk_score,
    c.ai_lifetime_value,
    (c.summary_embedding <#> query_embedding) * -1 AS similarity,
    a.name AS account_name
  FROM contacts c
  LEFT JOIN accounts a ON c.account_id = a.id
  WHERE 
    c.workspace_id = search_contacts_by_embedding.workspace_id
    AND c.summary_embedding IS NOT NULL
    AND (c.summary_embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY c.summary_embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search interactions by embedding similarity
CREATE OR REPLACE FUNCTION search_interactions_by_embedding(
  query_embedding vector(1024),
  workspace_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  type interaction_type,
  subject text,
  content text,
  interacted_at timestamptz,
  contact_name text,
  account_name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.type,
    i.subject,
    LEFT(i.content, 200) AS content, -- Truncate for display
    i.interacted_at,
    CONCAT(c.first_name, ' ', c.last_name) AS contact_name,
    a.name AS account_name,
    (i.embedding <#> query_embedding) * -1 AS similarity
  FROM interactions i
  LEFT JOIN contacts c ON i.contact_id = c.id
  LEFT JOIN accounts a ON i.account_id = a.id
  WHERE 
    i.workspace_id = search_interactions_by_embedding.workspace_id
    AND i.embedding IS NOT NULL
    AND (i.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY i.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search accounts by embedding similarity
CREATE OR REPLACE FUNCTION search_accounts_by_embedding(
  query_embedding vector(1024),
  workspace_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  industry text,
  employee_count integer,
  annual_revenue decimal,
  ai_risk_score integer,
  ai_lifetime_value decimal,
  similarity float,
  contact_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.industry,
    a.employee_count,
    a.annual_revenue,
    a.ai_risk_score,
    a.ai_lifetime_value,
    (a.summary_embedding <#> query_embedding) * -1 AS similarity,
    COUNT(c.id) AS contact_count
  FROM accounts a
  LEFT JOIN contacts c ON a.id = c.account_id
  WHERE 
    a.workspace_id = search_accounts_by_embedding.workspace_id
    AND a.summary_embedding IS NOT NULL
    AND (a.summary_embedding <#> query_embedding) * -1 > match_threshold
  GROUP BY a.id, a.name, a.industry, a.employee_count, a.annual_revenue, 
           a.ai_risk_score, a.ai_lifetime_value, a.summary_embedding
  ORDER BY a.summary_embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search documents by embedding similarity
CREATE OR REPLACE FUNCTION search_documents_by_embedding(
  query_embedding vector(1024),
  workspace_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 15
)
RETURNS TABLE (
  id uuid,
  file_name text,
  document_type text,
  ai_summary text,
  contact_name text,
  account_name text,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.file_name,
    d.document_type,
    d.ai_summary,
    CONCAT(c.first_name, ' ', c.last_name) AS contact_name,
    a.name AS account_name,
    (d.embedding <#> query_embedding) * -1 AS similarity,
    d.created_at
  FROM documents d
  LEFT JOIN contacts c ON d.contact_id = c.id
  LEFT JOIN accounts a ON d.account_id = a.id
  WHERE 
    d.workspace_id = search_documents_by_embedding.workspace_id
    AND d.embedding IS NOT NULL
    AND (d.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY d.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to find similar contacts (for recommendations)
CREATE OR REPLACE FUNCTION find_similar_contacts(
  contact_id uuid,
  workspace_id uuid,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  lifecycle_stage contact_lifecycle_stage,
  ai_risk_score integer,
  similarity float,
  account_name text
)
LANGUAGE plpgsql
AS $$
DECLARE
  target_embedding vector(1024);
BEGIN
  -- Get the embedding of the target contact
  SELECT summary_embedding INTO target_embedding
  FROM contacts
  WHERE contacts.id = contact_id AND contacts.workspace_id = find_similar_contacts.workspace_id;
  
  IF target_embedding IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.lifecycle_stage,
    c.ai_risk_score,
    (c.summary_embedding <#> target_embedding) * -1 AS similarity,
    a.name AS account_name
  FROM contacts c
  LEFT JOIN accounts a ON c.account_id = a.id
  WHERE 
    c.workspace_id = find_similar_contacts.workspace_id
    AND c.id != contact_id
    AND c.summary_embedding IS NOT NULL
  ORDER BY c.summary_embedding <#> target_embedding
  LIMIT match_count;
END;
$$;

-- Function to get contact insights based on similar contacts
CREATE OR REPLACE FUNCTION get_contact_insights(
  contact_id uuid,
  workspace_id uuid
)
RETURNS TABLE (
  insight_type text,
  insight_text text,
  confidence_score float,
  supporting_data jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
  target_contact record;
  similar_contact_count integer;
  avg_lifetime_value decimal;
  avg_risk_score integer;
BEGIN
  -- Get target contact data
  SELECT * INTO target_contact
  FROM contacts c
  WHERE c.id = contact_id AND c.workspace_id = get_contact_insights.workspace_id;

  IF target_contact IS NULL THEN
    RETURN;
  END IF;

  -- Calculate averages from similar contacts
  SELECT
    COUNT(*),
    AVG(c.ai_lifetime_value),
    AVG(c.ai_risk_score)
  INTO similar_contact_count, avg_lifetime_value, avg_risk_score
  FROM find_similar_contacts(contact_id, workspace_id, 10) sc
  JOIN contacts c ON c.id = sc.id;

  -- Generate insights based on comparisons
  IF target_contact.ai_lifetime_value IS NOT NULL AND avg_lifetime_value IS NOT NULL THEN
    IF target_contact.ai_lifetime_value > avg_lifetime_value * 1.2 THEN
      RETURN QUERY SELECT
        'high_value'::text,
        'This contact has significantly higher lifetime value potential than similar contacts'::text,
        0.8::float,
        jsonb_build_object(
          'contact_value', target_contact.ai_lifetime_value,
          'average_value', avg_lifetime_value,
          'difference_percent', ((target_contact.ai_lifetime_value - avg_lifetime_value) / avg_lifetime_value * 100)
        );
    END IF;
  END IF;

  IF target_contact.ai_risk_score IS NOT NULL AND avg_risk_score IS NOT NULL THEN
    IF target_contact.ai_risk_score > avg_risk_score + 20 THEN
      RETURN QUERY SELECT
        'high_risk'::text,
        'This contact shows higher risk indicators compared to similar profiles'::text,
        0.7::float,
        jsonb_build_object(
          'contact_risk', target_contact.ai_risk_score,
          'average_risk', avg_risk_score,
          'risk_difference', target_contact.ai_risk_score - avg_risk_score
        );
    END IF;
  END IF;

  -- Lifecycle stage insights
  IF target_contact.lifecycle_stage = 'lead' THEN
    RETURN QUERY SELECT
      'conversion_opportunity'::text,
      'Based on similar contacts, this lead has good conversion potential'::text,
      0.6::float,
      jsonb_build_object(
        'similar_contacts_count', similar_contact_count,
        'current_stage', target_contact.lifecycle_stage
      );
  END IF;

END;
$$;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to calculate embedding similarity between two entities
CREATE OR REPLACE FUNCTION calculate_similarity(
  embedding1 vector(1024),
  embedding2 vector(1024)
)
RETURNS float
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (embedding1 <#> embedding2) * -1;
$$;

-- Function to get workspace statistics
CREATE OR REPLACE FUNCTION get_workspace_ai_stats(workspace_id uuid)
RETURNS TABLE (
  total_contacts bigint,
  contacts_with_embeddings bigint,
  total_interactions bigint,
  interactions_with_embeddings bigint,
  embedding_coverage_percent float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id),
    (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id AND summary_embedding IS NOT NULL),
    (SELECT COUNT(*) FROM interactions WHERE interactions.workspace_id = get_workspace_ai_stats.workspace_id),
    (SELECT COUNT(*) FROM interactions WHERE interactions.workspace_id = get_workspace_ai_stats.workspace_id AND embedding IS NOT NULL),
    CASE 
      WHEN (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id) > 0 
      THEN (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id AND summary_embedding IS NOT NULL)::float / 
           (SELECT COUNT(*) FROM contacts WHERE contacts.workspace_id = get_workspace_ai_stats.workspace_id)::float * 100
      ELSE 0
    END;
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_contacts_by_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION search_interactions_by_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION search_accounts_by_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION search_documents_by_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_contacts TO authenticated;
GRANT EXECUTE ON FUNCTION get_contact_insights TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_similarity TO authenticated;
GRANT EXECUTE ON FUNCTION get_workspace_ai_stats TO authenticated;

COMMIT;
