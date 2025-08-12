-- =============================================================================
-- MIGRATION: Comprehensive RLS Policies
-- =============================================================================
-- Description: Create Row Level Security policies for all tables ensuring proper multi-tenant data isolation
-- Version: 1.0.0
-- Created: 2025-01-12

-- =============================================================================
-- ADDITIONAL RLS POLICIES FOR COMPREHENSIVE SECURITY
-- =============================================================================

-- Update leads table to reference pipeline tables
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS pipeline_id INTEGER REFERENCES public.pipelines(id),
ADD COLUMN IF NOT EXISTS pipeline_status_id INTEGER REFERENCES public.pipeline_statuses(id),
ADD COLUMN IF NOT EXISTS insurance_type_id INTEGER REFERENCES public.insurance_types(id),
ADD COLUMN IF NOT EXISTS lead_status_id INTEGER REFERENCES public.lead_statuses(id);

-- Update leads table to reference marketing tables
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id),
ADD COLUMN IF NOT EXISTS ab_test_id UUID REFERENCES public.ab_tests(id),
ADD COLUMN IF NOT EXISTS content_template_id UUID REFERENCES public.content_templates(id);

-- =============================================================================
-- ENHANCED RLS POLICIES FOR EXISTING TABLES
-- =============================================================================

-- Enhanced policies for vehicles, homes, specialty_items with proper access control
DROP POLICY IF EXISTS "Users can view vehicles they have access to" ON public.vehicles;
CREATE POLICY "Users can view vehicles they have access to" ON public.vehicles
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = vehicles.client_id 
      AND (c.created_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.leads l WHERE l.client_id = c.id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())))
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = vehicles.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update vehicles they have access to" ON public.vehicles
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = vehicles.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = vehicles.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Similar enhanced policies for homes
DROP POLICY IF EXISTS "Users can view homes they have access to" ON public.homes;
CREATE POLICY "Users can view homes they have access to" ON public.homes
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = homes.client_id 
      AND (c.created_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.leads l WHERE l.client_id = c.id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())))
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = homes.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update homes they have access to" ON public.homes
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = homes.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = homes.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Enhanced policies for specialty_items
DROP POLICY IF EXISTS "Users can view specialty items they have access to" ON public.specialty_items;
CREATE POLICY "Users can view specialty items they have access to" ON public.specialty_items
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = specialty_items.client_id 
      AND (c.created_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.leads l WHERE l.client_id = c.id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())))
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = specialty_items.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update specialty items they have access to" ON public.specialty_items
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = specialty_items.client_id AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = specialty_items.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Enhanced policies for quotes
DROP POLICY IF EXISTS "Users can view quotes they have access to" ON public.quotes;
CREATE POLICY "Users can view quotes they have access to" ON public.quotes
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = quotes.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update quotes they have access to" ON public.quotes
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = quotes.lead_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- =============================================================================
-- ROLE-BASED ACCESS CONTROL FUNCTIONS
-- =============================================================================

-- Function to check if user can access a specific client
CREATE OR REPLACE FUNCTION public.user_can_access_client(client_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id_param
    AND (
      c.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.leads l 
        WHERE l.client_id = c.id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access a specific lead
CREATE OR REPLACE FUNCTION public.user_can_access_lead(lead_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id_param
    AND (
      l.created_by = auth.uid() OR
      l.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible client IDs
CREATE OR REPLACE FUNCTION public.get_user_accessible_client_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT c.id 
    FROM public.clients c
    WHERE c.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.leads l 
            WHERE l.client_id = c.id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
          ) OR
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
          )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible lead IDs
CREATE OR REPLACE FUNCTION public.get_user_accessible_lead_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT l.id 
    FROM public.leads l
    WHERE l.created_by = auth.uid() OR
          l.assigned_to = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
          )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DATA ISOLATION POLICIES
-- =============================================================================

-- Policy to prevent data leakage through foreign key relationships
CREATE OR REPLACE FUNCTION public.validate_client_lead_relationship()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure that if both client_id and lead_id are provided, they are related
  IF NEW.client_id IS NOT NULL AND NEW.lead_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = NEW.lead_id AND l.client_id = NEW.client_id
    ) THEN
      RAISE EXCEPTION 'Client and lead are not related';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply relationship validation to relevant tables
CREATE TRIGGER validate_vehicles_client_lead_relationship
  BEFORE INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.validate_client_lead_relationship();

CREATE TRIGGER validate_homes_client_lead_relationship
  BEFORE INSERT OR UPDATE ON public.homes
  FOR EACH ROW EXECUTE FUNCTION public.validate_client_lead_relationship();

CREATE TRIGGER validate_specialty_items_client_lead_relationship
  BEFORE INSERT OR UPDATE ON public.specialty_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_client_lead_relationship();

CREATE TRIGGER validate_communications_client_lead_relationship
  BEFORE INSERT OR UPDATE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.validate_client_lead_relationship();

-- =============================================================================
-- AUDIT AND COMPLIANCE POLICIES
-- =============================================================================

-- Function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive tables for compliance
  INSERT INTO public.ai_interactions (
    type,
    source,
    content,
    user_id,
    metadata,
    created_at
  ) VALUES (
    'Data Access',
    'RLS Policy',
    'Accessed ' || TG_TABLE_NAME || ' record: ' || NEW.id::TEXT,
    auth.uid(),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', NEW.id
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to sensitive tables (optional - can be enabled for compliance)
-- CREATE TRIGGER log_clients_access
--   AFTER SELECT ON public.clients
--   FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_data_access();

-- =============================================================================
-- PERFORMANCE OPTIMIZATION FOR RLS
-- =============================================================================

-- Create indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_leads_created_by_assigned_to ON public.leads(created_by, assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Composite indexes for common RLS queries
CREATE INDEX IF NOT EXISTS idx_vehicles_client_lead_created_by ON public.vehicles(client_id, lead_id, created_by);
CREATE INDEX IF NOT EXISTS idx_homes_client_lead_created_by ON public.homes(client_id, lead_id, created_by);
CREATE INDEX IF NOT EXISTS idx_specialty_items_client_lead_created_by ON public.specialty_items(client_id, lead_id, created_by);
CREATE INDEX IF NOT EXISTS idx_communications_client_lead_created_by ON public.communications(client_id, lead_id, created_by);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.user_can_access_client(UUID) IS 'Check if current user can access a specific client';
COMMENT ON FUNCTION public.user_can_access_lead(UUID) IS 'Check if current user can access a specific lead';
COMMENT ON FUNCTION public.get_user_accessible_client_ids() IS 'Get array of client IDs accessible to current user';
COMMENT ON FUNCTION public.get_user_accessible_lead_ids() IS 'Get array of lead IDs accessible to current user';

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.user_can_access_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_lead(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_accessible_client_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_accessible_lead_ids() TO authenticated;
