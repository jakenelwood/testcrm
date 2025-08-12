import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

const ALLOWED_ORIGINS = [
  'https://agentictinkering.com',
  'https://www.agentictinkering.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Add your Vercel preview URLs pattern
  /^https:\/\/.*\.vercel\.app$/,
];

// =============================================================================
// RATE LIMITING CONFIGURATION
// =============================================================================

const RATE_LIMITS = {
  '/api/auth': { maxRequests: 10, windowMinutes: 15 }, // Auth endpoints
  '/api/leads': { maxRequests: 100, windowMinutes: 60 }, // Lead management
  '/api/communications': { maxRequests: 50, windowMinutes: 60 }, // Communications
  '/api/quotes': { maxRequests: 30, windowMinutes: 60 }, // Quote generation
  '/api/ai': { maxRequests: 20, windowMinutes: 60 }, // AI endpoints
  '/api/ringcentral': { maxRequests: 100, windowMinutes: 60 }, // RingCentral webhooks
  default: { maxRequests: 200, windowMinutes: 60 }, // Default for other APIs
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false

  return ALLOWED_ORIGINS.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed
    }
    // Handle regex patterns
    return allowed.test(origin)
  })
}

function getCorsHeaders(origin: string | null) {
  const headers = new Headers()

  if (isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin!)
  }

  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  headers.set('Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name'
  )
  headers.set('Access-Control-Max-Age', '86400') // 24 hours

  return headers
}

async function checkRateLimit(
  request: NextRequest,
  endpoint: string,
  supabase: any
): Promise<{ allowed: boolean; headers: Headers }> {
  const headers = new Headers()

  try {
    // Get rate limit configuration for this endpoint
    const rateLimitConfig = RATE_LIMITS[endpoint] || RATE_LIMITS.default

    // Get client IP
    const clientIP = request.ip ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    // Check rate limit using our database function
    const { data: rateLimitResult, error } = await supabase.rpc('check_rate_limit', {
      endpoint_param: endpoint,
      ip_address_param: clientIP,
      max_requests: rateLimitConfig.maxRequests,
      window_minutes: rateLimitConfig.windowMinutes
    })

    if (error) {
      console.error('Rate limit check error:', error)
      // Allow request if rate limit check fails
      return { allowed: true, headers }
    }

    // Add rate limit headers
    headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString())
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset_time).toISOString())

    if (!rateLimitResult.allowed) {
      headers.set('Retry-After', Math.ceil(
        (new Date(rateLimitResult.reset_time).getTime() - Date.now()) / 1000
      ).toString())
    }

    return {
      allowed: rateLimitResult.allowed,
      headers
    }

  } catch (error) {
    console.error('Rate limiting error:', error)
    // Allow request if rate limiting fails
    return { allowed: true, headers }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(origin)
    return new NextResponse(null, { status: 200, headers: corsHeaders })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Secure environment variable access - no fallbacks for security
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate required environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required Supabase environment variables');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

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

  // Add CORS headers to all responses
  const corsHeaders = getCorsHeaders(origin)
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value)
  })

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    try {
      // Determine endpoint for rate limiting
      const endpoint = pathname.split('/').slice(0, 3).join('/') // e.g., '/api/leads'

      const { allowed, headers: rateLimitHeaders } = await checkRateLimit(
        request,
        endpoint,
        supabase
      )

      // Add rate limit headers
      rateLimitHeaders.forEach((value, key) => {
        response.headers.set(key, value)
      })

      // Return 429 if rate limit exceeded
      if (!allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...Object.fromEntries(corsHeaders.entries()),
              ...Object.fromEntries(rateLimitHeaders.entries())
            }
          }
        )
      }

    } catch (error) {
      console.error('Middleware rate limiting error:', error)
      // Continue with request if rate limiting fails
    }
  }

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