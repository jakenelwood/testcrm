-- =============================================================================
-- MIGRATION: Core Authentication and User Management
-- =============================================================================
-- Description: Creates users table with proper auth integration, roles, and RLS policies
-- Version: 1.0.0
-- Created: 2025-01-12

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS TABLE
-- =============================================================================

-- Create users table that extends Supabase auth.users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent', 'manager')),
  
  -- Profile information
  phone_number TEXT,
  timezone TEXT DEFAULT 'America/Chicago',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  
  -- Preferences
  preferences JSONB DEFAULT '{}',
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- JSONB indexes for preferences and metadata
CREATE INDEX idx_users_preferences ON public.users USING GIN (preferences);
CREATE INDEX idx_users_metadata ON public.users USING GIN (metadata);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can insert new users
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to handle user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has specific role
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.user_has_role(auth.uid(), required_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users with role-based access control';
COMMENT ON COLUMN public.users.role IS 'User role: user, admin, agent, or manager';
COMMENT ON COLUMN public.users.preferences IS 'User preferences stored as JSONB';
COMMENT ON COLUMN public.users.metadata IS 'Additional user metadata stored as JSONB';

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
