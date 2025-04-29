import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a client only if both URL and key are available
let supabase: ReturnType<typeof createClient<Database>> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
} else {
  // During build time, provide a mock client that will be replaced at runtime
  console.warn('Supabase URL or key not available. Using mock client.');

  // Create a mock client that will throw a more helpful error if used
  const mockClient = new Proxy({} as ReturnType<typeof createClient<Database>>, {
    get: (target, prop) => {
      if (typeof window !== 'undefined') {
        // Only throw in browser, not during SSR/build
        throw new Error('Supabase client not properly initialized. Check your environment variables.');
      }
      // Return a no-op function during build
      return () => ({});
    }
  });

  supabase = mockClient;
}

export default supabase;
