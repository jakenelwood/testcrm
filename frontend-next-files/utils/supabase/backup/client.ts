import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Hardcoded values as fallback (same as in .env.local)
const FALLBACK_SUPABASE_URL = 'https://vpwvdfrxvvuxojejnegm.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd3ZkZnJ4dnZ1eG9qZWpuZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTcxOTIsImV4cCI6MjA2MTQ3MzE5Mn0.hyIFaAyppndjilhPXaaWf7GJoOsJfRRDp7LubigyB3Q';

// Try to get from environment variables first, fall back to hardcoded values if not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

// Create the Supabase client
let supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Log for debugging
if (typeof window !== 'undefined') {
  console.log('Supabase client initialized with URL:', supabaseUrl ? 'Available' : 'Not available');
}

export default supabase;
