-- Create user account for Brian Berge
-- Run this in Supabase Dashboard > SQL Editor

-- Method 1: Try to create user using Supabase's auth functions
-- This is the preferred method but may require admin privileges

-- First, let's check if the user already exists
SELECT id, email FROM auth.users WHERE email = 'brian.h.berge@gmail.com';

-- If no user exists, we'll create one manually
-- Note: This is a development/testing approach

-- Simple approach: Create a test user directly
-- This bypasses normal auth flow for development testing

-- Generate a UUID for the user
DO $$
DECLARE
  user_uuid UUID := gen_random_uuid();
BEGIN
  -- Insert directly into public.users table for testing
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    user_uuid,
    'brian.h.berge@gmail.com',
    'Brian',
    'Berge',
    'admin',
    true,
    now(),
    now()
  ) ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  RAISE NOTICE 'User created/updated with ID: %', user_uuid;
  RAISE NOTICE 'Note: This user can only be used for database testing, not for actual login';
  RAISE NOTICE 'For login functionality, please use the Sign Up feature in the app';
END $$;
