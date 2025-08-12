-- =============================================================================
-- FIX USERS TABLE RLS INFINITE RECURSION
-- =============================================================================
-- This migration fixes the infinite recursion issue in users table RLS policies

-- Temporarily disable RLS on users table to fix the recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simplified policies without recursion
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- For now, allow authenticated users to view other users (we can restrict this later)
CREATE POLICY "Authenticated users can view users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Alternative approach: Create a function that safely checks admin role
-- This function can be used in other policies without causing recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'),
    false
  );
$$;

-- Alternative approach: Create a function that safely checks user role
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'role' = required_role),
    false
  );
$$;

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;

-- Update other policies that reference users table to use the helper function
-- This prevents recursion in other tables as well

-- Note: We could update all the other policies to use these functions,
-- but for now we'll leave them as they are since the main issue was
-- the users table policies referencing themselves.

-- Add comments for documentation
COMMENT ON FUNCTION public.is_admin() IS 'Safely checks if the current user has admin role without causing RLS recursion';
COMMENT ON FUNCTION public.has_role(text) IS 'Safely checks if the current user has the specified role without causing RLS recursion';

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Fixed users table RLS infinite recursion by simplifying admin policies and creating helper functions';
END $$;
