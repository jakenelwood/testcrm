import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Fallback values if environment variables are not set (should match your actual Supabase config)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpwvdfrxvvuxojejnegm.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd3ZkZnJ4dnZ1eG9qZWpuZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTcxOTIsImV4cCI6MjA2MTQ3MzE5Mn0.hyIFaAyppndjilhPXaaWf7GJoOsJfRRDp7LubigyB3Q';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Ensure the request object is updated with the new cookie before creating a new response
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Create a new response to attach the cookie to
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Ensure the request object is updated by deleting the cookie before creating a new response
          request.cookies.set({ // Effectively deleting by setting an empty value or using delete if available and preferred
            name,
            value: '',
            ...options,
          });
           // Create a new response to attach the cookie deletion instruction
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '', // Or use response.cookies.delete(name, options) if you prefer and it works as expected
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};