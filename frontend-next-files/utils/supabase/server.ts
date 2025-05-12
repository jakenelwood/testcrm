import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Hardcoded values as fallback (same as in client.ts)
const FALLBACK_SUPABASE_URL = 'https://vpwvdfrxvvuxojejnegm.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd3ZkZnJ4dnZ1eG9qZWpuZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTcxOTIsImV4cCI6MjA2MTQ3MzE5Mn0.hyIFaAyppndjilhPXaaWf7GJoOsJfRRDp7LubigyB3Q';

// Try to get from environment variables first, fall back to hardcoded values if not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const createClient = async () => {
  // In Next.js 15.3.2, cookies() returns a Promise that needs to be awaited
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: async (name: string) => {
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        set: async (name: string, value: string, options: any) => {
          await cookieStore.set({ name, value, ...options })
        },
        remove: async (name: string, options: any) => {
          await cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
