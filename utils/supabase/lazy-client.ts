// Lazy-loaded Supabase client to reduce initial bundle size
import { createBrowserClient } from '@supabase/ssr';

// Cache the client instance
let supabaseClient: any = null;

// Lazy load Supabase only when needed
export async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Dynamic import to reduce initial bundle
  const { createBrowserClient } = await import('@supabase/ssr');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// Lightweight wrapper for common operations
export const supabaseLazy = {
  auth: {
    getUser: async () => {
      const client = await getSupabaseClient();
      return client.auth.getUser();
    },
    signOut: async () => {
      const client = await getSupabaseClient();
      return client.auth.signOut();
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const client = await getSupabaseClient();
      return client.auth.signInWithPassword(credentials);
    }
  },
  
  from: async (table: string) => {
    const client = await getSupabaseClient();
    return client.from(table);
  },

  storage: {
    from: async (bucket: string) => {
      const client = await getSupabaseClient();
      return client.storage.from(bucket);
    }
  }
};
