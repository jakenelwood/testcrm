import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const callbackUrl = requestUrl.searchParams.get('callbackUrl')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    await supabase.auth.exchangeCodeForSession(code)
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
