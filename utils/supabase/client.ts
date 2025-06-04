import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

// Try to get from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a function to initialize the Supabase client
export const createClient = () => {
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
