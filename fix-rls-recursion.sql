-- Quick fix for RLS infinite recursion in users table ONLY
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Temporarily disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Step 3: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simplified policies without recursion
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Step 5: Allow authenticated users to view other users (temporary - can be restricted later)
CREATE POLICY "Authenticated users can view users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Verification query (optional - run to check if policies are working)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'users' AND schemaname = 'public';
