import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a Supabase client configured to use cookies
    const supabase = await createClient()

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
    const { data: { session } } = await supabase.auth.getSession()

    // Define public paths that don't require authentication
    const publicPaths = [
      '/',
      '/auth/login',
      '/auth/signup',
      '/auth/callback',
      '/auth/forgot-password',
      '/auth/reset-password'
    ]

    // Check if the current path is public
    const isPublicPath = publicPaths.some(path =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(path)
    )

    // Also consider static assets as public
    const isStaticAsset = request.nextUrl.pathname.match(
      /\.(js|css|svg|png|jpg|jpeg|gif|ico|json)$/
    )

    // If there's no session and the user is trying to access a protected route
    if (!session && !isPublicPath && !isStaticAsset) {
      // Store the original URL to redirect back after login
      const callbackUrl = encodeURIComponent(request.nextUrl.pathname)
      const redirectUrl = new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If there is a session and the user is trying to access auth pages (except callback)
    if (session && isPublicPath && !request.nextUrl.pathname.startsWith('/auth/callback')) {
      // Redirect to dashboard if already logged in and trying to access auth pages
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  } catch (e) {
    // If there's an error, redirect to login
    console.error('Middleware error:', e)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Apply to all routes except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
  ],
}
