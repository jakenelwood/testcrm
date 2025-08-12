import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

// Try to get from environment variables with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Validate environment variables at runtime (not build time)
const validateEnvironment = () => {
  if (typeof window !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return false;
    }
  }
  return true;
};

// Create a function to initialize the Supabase client
export const createClient = () => {
  // Only validate in browser environment
  if (typeof window !== 'undefined') {
    validateEnvironment();
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
};

// Create a default client for backward compatibility
const supabase = createClient();

// Log for debugging
if (typeof window !== 'undefined') {
  console.log('Supabase client initialized with URL:', supabaseUrl ? 'Available' : 'Not available');
}

export default supabase;
