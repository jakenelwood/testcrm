import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  if (error) {
    console.error('Auth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`, 
      request.url)
    )
  }
  
  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Session exchange error:', error)
        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
        )
      }
      
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (err) {
      console.error('Error exchanging code for session:', err)
      return NextResponse.redirect(
        new URL('/auth/login?error=Failed+to+sign+in', request.url)
      )
    }
  }
  
  return NextResponse.redirect(new URL('/auth/login', request.url))
}
