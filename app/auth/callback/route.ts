import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const callbackUrl = requestUrl.searchParams.get('callbackUrl')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // If there's an error in the URL, redirect to login with the error
  if (error || error_description) {
    const errorMessage = error_description || error || 'Authentication error'
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent(errorMessage)}`
    )
  }

  // Exchange the code for a session if present
  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = await createClient()

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      // If there's an error exchanging the code, redirect to login with the error
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/login?error=${encodeURIComponent(error.message)}`
        )
      }
    } catch (err) {
      console.error('Unexpected error in auth callback:', err)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent('An unexpected error occurred')}`
      )
    }
  }

  // URL to redirect to after sign in process completes
  // If a callback URL was provided, use it, otherwise redirect to dashboard
  const redirectTo = callbackUrl
    ? decodeURIComponent(callbackUrl)
    : '/dashboard'

  // Make sure the redirect URL is relative to prevent open redirect vulnerabilities
  const safeRedirect = redirectTo.startsWith('/')
    ? redirectTo
    : '/dashboard'

  return NextResponse.redirect(requestUrl.origin + safeRedirect)
}
