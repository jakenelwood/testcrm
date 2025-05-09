# Authentication Implementation Backup

This folder contains the essential authentication files and implementation details needed to restore the authentication functionality in a fresh codebase.

## Key Files

1. `app/auth/callback/route.ts` - Handles OAuth/magic link callback
2. `app/auth/login/page.tsx` - Login page implementation
3. `utils/supabase/server.ts` - Server-side Supabase client
4. `utils/supabase/client.ts` - Client-side Supabase client

## Implementation Details

### Authentication Flow

1. User enters email/password or requests magic link on login page
2. On successful authentication, user is redirected to `/dashboard`
3. The callback route handles OAuth or magic link redirects
4. Error handling redirects back to login with appropriate error messages

### Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Required Dependencies

```json
{
  "@supabase/ssr": "latest",
  "@supabase/supabase-js": "latest"
}
```

## Restoration Steps

1. Create a fresh Next.js project
2. Install the required dependencies
3. Copy the files from this backup to their respective locations
4. Set up the environment variables
5. Test the authentication flow

## Authentication Implementation Code

### 1. app/auth/callback/route.ts
```typescript
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
```

### 2. utils/supabase/server.ts
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set: (name: string, value: string, options: any) => {
          cookieStore.set({ name, value, ...options })
        },
        remove: (name: string, options: any) => {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### 3. utils/supabase/client.ts
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 4. app/auth/login/page.tsx (simplified version)
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }
      
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || "An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
        },
      })

      if (error) throw error
      
      // Show success message for magic link
      setError("Magic link sent! Check your email.")
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || "Failed to send magic link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Sign in to your account
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleMagicLinkLogin}
              disabled={loading}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
            >
              {loading ? 'Sending...' : 'Magic Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 5. Dashboard Authentication Check
```typescript
// Add this to your dashboard page to check authentication
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function Dashboard() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data?.user) {
      return redirect('/auth/login');
    }
    
    // Your dashboard UI here
    return (
      <div>
        <h1>Dashboard</h1>
        {/* Dashboard content */}
      </div>
    );
  } catch (error) {
    console.error('Authentication error:', error);
    return redirect('/auth/login');
  }
}
```