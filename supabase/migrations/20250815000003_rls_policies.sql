-- 🔒 Row Level Security Policies for Unified AI-Native Schema
-- Implements workspace-based multi-tenant isolation

BEGIN;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialty_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get current user's workspace_id
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT workspace_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is workspace owner/admin
CREATE OR REPLACE FUNCTION is_workspace_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('owner', 'manager')
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- WORKSPACE POLICIES
-- =============================================================================

-- Users can only see their own workspace
CREATE POLICY "Users can view their workspace" ON workspaces
  FOR SELECT USING (
    id = get_user_workspace_id()
  );

-- Only workspace owners can update workspace settings
CREATE POLICY "Workspace owners can update workspace" ON workspaces
  FOR UPDATE USING (
    id = get_user_workspace_id() AND is_workspace_admin()
  );

-- =============================================================================
-- USER POLICIES
-- =============================================================================

-- Users can view other users in their workspace
CREATE POLICY "Users can view workspace members" ON users
  FOR SELECT USING (
    workspace_id = get_user_workspace_id()
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    id = auth.uid()
  );

-- Workspace admins can manage users
CREATE POLICY "Admins can manage workspace users" ON users
  FOR ALL USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

-- =============================================================================
-- ACCOUNT POLICIES
-- =============================================================================

-- Users can view accounts in their workspace
CREATE POLICY "Users can view workspace accounts" ON accounts
  FOR SELECT USING (
    workspace_id = get_user_workspace_id()
  );

-- Users can create accounts in their workspace
CREATE POLICY "Users can create accounts" ON accounts
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id()
  );

-- Users can update accounts they own or if they're admin
CREATE POLICY "Users can update owned accounts" ON accounts
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND 
    (owner_id = auth.uid() OR is_workspace_admin())
  );

-- Users can delete accounts they own or if they're admin
CREATE POLICY "Users can delete owned accounts" ON accounts
  FOR DELETE USING (
    workspace_id = get_user_workspace_id() AND 
    (owner_id = auth.uid() OR is_workspace_admin())
  );

-- =============================================================================
-- CONTACT POLICIES
-- =============================================================================

-- Users can view contacts in their workspace
CREATE POLICY "Users can view workspace contacts" ON contacts
  FOR SELECT USING (
    workspace_id = get_user_workspace_id()
  );

-- Users can create contacts in their workspace
CREATE POLICY "Users can create contacts" ON contacts
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id()
  );

-- Users can update contacts they own or if they're admin
CREATE POLICY "Users can update owned contacts" ON contacts
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND 
    (owner_id = auth.uid() OR is_workspace_admin())
  );

-- Users can delete contacts they own or if they're admin
CREATE POLICY "Users can delete owned contacts" ON contacts
  FOR DELETE USING (
    workspace_id = get_user_workspace_id() AND 
    (owner_id = auth.uid() OR is_workspace_admin())
  );

-- =============================================================================
-- OPPORTUNITY POLICIES
-- =============================================================================

-- Users can view opportunities in their workspace
CREATE POLICY "Users can view workspace opportunities" ON opportunities
  FOR SELECT USING (
    workspace_id = get_user_workspace_id()
  );

-- Users can create opportunities in their workspace
CREATE POLICY "Users can create opportunities" ON opportunities
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id()
  );

-- Users can update opportunities they own or if they're admin
CREATE POLICY "Users can update owned opportunities" ON opportunities
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND 
    (owner_id = auth.uid() OR is_workspace_admin())
  );

-- Users can delete opportunities they own or if they're admin
CREATE POLICY "Users can delete owned opportunities" ON opportunities
  FOR DELETE USING (
    workspace_id = get_user_workspace_id() AND 
    (owner_id = auth.uid() OR is_workspace_admin())
  );

-- =============================================================================
-- OPPORTUNITY PARTICIPANTS POLICIES
-- =============================================================================

-- Users can view participants in their workspace
CREATE POLICY "Users can view workspace opportunity participants" ON opportunity_participants
  FOR SELECT USING (
    workspace_id = get_user_workspace_id()
  );

-- Users can manage participants for opportunities they own
CREATE POLICY "Users can manage participants for owned opportunities" ON opportunity_participants
  FOR ALL USING (
    workspace_id = get_user_workspace_id() AND 
    (
      opportunity_id IN (
        SELECT id FROM opportunities 
        WHERE owner_id = auth.uid() OR is_workspace_admin()
      )
    )
  );

-- =============================================================================
-- ACTIVITY STREAM POLICIES
-- =============================================================================

-- Interactions policies
CREATE POLICY "Users can view workspace interactions" ON interactions
  FOR SELECT USING (
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "Users can create interactions" ON interactions
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "Users can update own interactions" ON interactions
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND 
    (user_id = auth.uid() OR is_workspace_admin())
  );

-- Notes policies
CREATE POLICY "Users can view workspace notes" ON notes
  FOR SELECT USING (
    workspace_id = get_user_workspace_id() AND 
    (NOT is_private OR user_id = auth.uid() OR is_workspace_admin())
  );

CREATE POLICY "Users can create notes" ON notes
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND 
    (user_id = auth.uid() OR is_workspace_admin())
  );

-- Tasks policies
CREATE POLICY "Users can view workspace tasks" ON tasks
  FOR SELECT USING (
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "Users can update assigned tasks" ON tasks
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND 
    (assigned_to_id = auth.uid() OR created_by_id = auth.uid() OR is_workspace_admin())
  );

-- Documents policies
CREATE POLICY "Users can view workspace documents" ON documents
  FOR SELECT USING (
    workspace_id = get_user_workspace_id() AND 
    (NOT is_confidential OR uploaded_by_id = auth.uid() OR is_workspace_admin())
  );

CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT WITH CHECK (
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (
    workspace_id = get_user_workspace_id() AND 
    (uploaded_by_id = auth.uid() OR is_workspace_admin())
  );

-- =============================================================================
-- INSURANCE-SPECIFIC POLICIES
-- =============================================================================

-- Insurance types (global lookup table)
CREATE POLICY "Users can view insurance types" ON insurance_types
  FOR SELECT USING (true);

-- Pipelines policies
CREATE POLICY "Users can view workspace pipelines" ON pipelines
  FOR SELECT USING (
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "Admins can manage pipelines" ON pipelines
  FOR ALL USING (
    workspace_id = get_user_workspace_id() AND is_workspace_admin()
  );

-- Asset table policies (vehicles, properties, specialty_items)
CREATE POLICY "Users can view workspace vehicles" ON vehicles
  FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage vehicles" ON vehicles
  FOR ALL USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can view workspace properties" ON properties
  FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage properties" ON properties
  FOR ALL USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can view workspace specialty items" ON specialty_items
  FOR SELECT USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can manage specialty items" ON specialty_items
  FOR ALL USING (workspace_id = get_user_workspace_id());

COMMIT;
