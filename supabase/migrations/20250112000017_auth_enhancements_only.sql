-- =============================================================================
-- AUTHENTICATION ENHANCEMENTS FOR EXISTING SCHEMA
-- =============================================================================
-- This migration adds authentication enhancements to the existing database
-- without modifying existing tables.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PERMISSIONS SYSTEM
-- =============================================================================

-- Define standard permissions for insurance CRM
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'leads', 'clients', 'quotes', 'admin', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard permissions
INSERT INTO public.permissions (name, description, category) VALUES
-- Lead management
('leads.view', 'View leads', 'leads'),
('leads.create', 'Create new leads', 'leads'),
('leads.edit', 'Edit lead information', 'leads'),
('leads.delete', 'Delete leads', 'leads'),
('leads.assign', 'Assign leads to agents', 'leads'),
('leads.view_all', 'View all organization leads', 'leads'),

-- Client management
('clients.view', 'View clients', 'clients'),
('clients.create', 'Create new clients', 'clients'),
('clients.edit', 'Edit client information', 'clients'),
('clients.delete', 'Delete clients', 'clients'),
('clients.view_all', 'View all organization clients', 'clients'),

-- Quote management
('quotes.view', 'View quotes', 'quotes'),
('quotes.create', 'Create new quotes', 'quotes'),
('quotes.edit', 'Edit quotes', 'quotes'),
('quotes.delete', 'Delete quotes', 'quotes'),
('quotes.approve', 'Approve quotes', 'quotes'),

-- Communication
('communications.view', 'View communications', 'communications'),
('communications.create', 'Create communications', 'communications'),
('communications.edit', 'Edit communications', 'communications'),
('communications.delete', 'Delete communications', 'communications'),

-- Reporting
('reports.view', 'View reports', 'reports'),
('reports.create', 'Create custom reports', 'reports'),
('reports.export', 'Export report data', 'reports'),

-- User management
('users.view', 'View organization users', 'users'),
('users.invite', 'Invite new users', 'users'),
('users.edit', 'Edit user information', 'users'),
('users.deactivate', 'Deactivate users', 'users'),
('users.manage_roles', 'Manage user roles', 'users'),

-- Organization management
('organization.view', 'View organization settings', 'organization'),
('organization.edit', 'Edit organization settings', 'organization'),
('organization.billing', 'Manage billing and subscriptions', 'organization'),
('organization.integrations', 'Manage integrations', 'organization'),

-- System administration
('system.admin', 'Full system administration', 'system'),
('system.audit', 'View audit logs', 'system'),
('system.backup', 'Manage backups', 'system')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- ORGANIZATION ROLES (if organizations table exists)
-- =============================================================================

-- Create organization roles table (only if organizations exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
    CREATE TABLE IF NOT EXISTS public.organization_roles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      permissions JSONB NOT NULL DEFAULT '{}',
      is_system_role BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(organization_id, name)
    );
  END IF;
END $$;

-- =============================================================================
-- USER ORGANIZATION MEMBERSHIPS (if organizations table exists)
-- =============================================================================

-- Create user organization memberships table
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
    CREATE TABLE IF NOT EXISTS public.user_organization_memberships (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      role_id UUID REFERENCES public.organization_roles(id) ON DELETE SET NULL,
      
      -- Direct role assignment (fallback if role_id is null)
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'agent', 'manager', 'admin', 'owner')),
      
      -- Membership status
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
      
      -- Invitation details
      invited_by UUID REFERENCES auth.users(id),
      invited_at TIMESTAMP WITH TIME ZONE,
      joined_at TIMESTAMP WITH TIME ZONE,
      
      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(user_id, organization_id)
    );
  END IF;
END $$;

-- =============================================================================
-- AUDIT LOGGING SYSTEM
-- =============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event details
  event_type TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'permission_change'
  table_name TEXT,
  record_id UUID,
  
  -- User context
  user_id UUID REFERENCES auth.users(id),
  
  -- Event data
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PASSWORD SECURITY
-- =============================================================================

-- Create password history table to prevent reuse
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SESSION MANAGEMENT
-- =============================================================================

-- Create active sessions table for tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  
  -- Session details
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  
  -- Location (optional)
  country TEXT,
  city TEXT,
  
  -- Session status
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- =============================================================================
-- USER INVITATIONS
-- =============================================================================

-- Create user invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User details
  email TEXT NOT NULL,
  
  -- Role assignment
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent', 'manager', 'admin', 'owner')),
  
  -- Invitation details
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token TEXT UNIQUE NOT NULL,
  custom_message TEXT,
  
  -- Status and timing
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Acceptance details
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to validate password strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{"valid": true, "errors": []}'::jsonb;
  errors TEXT[] := '{}';
  score INTEGER := 0;
BEGIN
  -- Check minimum length
  IF LENGTH(password) < 8 THEN
    errors := array_append(errors, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check maximum length
  IF LENGTH(password) > 128 THEN
    errors := array_append(errors, 'Password must be no more than 128 characters long');
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password !~ '[^A-Za-z0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  -- Check against common passwords
  IF LOWER(password) IN (
    'password', 'password123', '123456', '123456789', 'qwerty',
    'abc123', 'password1', 'admin', 'letmein', 'welcome', '111111'
  ) THEN
    errors := array_append(errors, 'Password is too common, please choose a more secure password');
  END IF;
  
  -- Build result
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(errors),
      'score', 0
    );
  ELSE
    -- Calculate password strength score (0-100)
    score := 60; -- Base score for meeting requirements
    
    -- Bonus for length
    IF LENGTH(password) >= 12 THEN
      score := score + 10;
    ELSIF LENGTH(password) >= 10 THEN
      score := score + 5;
    END IF;
    
    -- Bonus for character variety
    IF password ~ '[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\?]' THEN
      score := score + 10;
    END IF;
    
    -- Bonus for mixed case and numbers
    IF password ~ '[A-Z]' AND password ~ '[a-z]' AND password ~ '[0-9]' THEN
      score := score + 10;
    END IF;
    
    -- Bonus for no repeated characters
    IF NOT (password ~ '(.)\1{2,}') THEN
      score := score + 10;
    END IF;
    
    result := jsonb_build_object(
      'valid', true,
      'errors', '[]'::jsonb,
      'score', LEAST(score, 100)
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Basic policies for permissions (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Basic policies for audit logs (users can view their own)
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Basic policies for password history (users can view their own)
CREATE POLICY "Users can view their own password history" ON public.password_history
  FOR SELECT USING (user_id = auth.uid());

-- Basic policies for user sessions (users can view their own)
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Basic policies for user invitations (authenticated users can view)
CREATE POLICY "Authenticated users can view invitations" ON public.user_invitations
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Password history indexes
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON public.password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON public.password_history(created_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- User invitations indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON public.user_invitations(expires_at);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.permissions IS 'System-wide permission definitions';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit logging for all system events';
COMMENT ON TABLE public.password_history IS 'Password history to prevent reuse';
COMMENT ON TABLE public.user_sessions IS 'Active user session tracking';
COMMENT ON TABLE public.user_invitations IS 'User invitations for system access';
COMMENT ON FUNCTION public.validate_password_strength IS 'Validates password meets security requirements';
