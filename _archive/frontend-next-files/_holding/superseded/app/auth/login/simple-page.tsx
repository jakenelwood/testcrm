'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// SIMPLE VERSION - Card-based login with improved error handling
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Debug: Log error state changes
  useEffect(() => {
    if (error) {
      console.log('Error state updated:', error)
    }
  }, [error])

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
      // Log the full error object to see its structure
      console.error('Login Error:', error)
      console.error('Error type:', typeof error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)

      // Direct check for the specific error we're seeing
      if (error.name === 'AuthApiError' && error.message === 'Invalid login credentials') {
        const userFriendlyMessage = 'The email or password you entered is incorrect. Please try again.';
        console.log('Setting user-friendly error message:', userFriendlyMessage);
        setError(userFriendlyMessage);
        return; // Exit early after setting the error
      }

      // Check for AuthApiError which is the Supabase auth error type
      const isAuthError = error.name === 'AuthApiError' ||
                         (error.message && error.message.includes('AuthApiError'));
      const errorMessage = error.message || '';

      // Provide more user-friendly error messages
      if (errorMessage.includes('Invalid login credentials')) {
        const userFriendlyMessage = 'The email or password you entered is incorrect. Please try again.';
        console.log('Setting user-friendly error message (fallback):', userFriendlyMessage);
        setError(userFriendlyMessage);
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in. Check your inbox for a confirmation email.');
      } else if (errorMessage.includes('rate limit')) {
        setError('Too many login attempts. Please try again later.');
      } else if (isAuthError) {
        // Generic auth error message
        setError('Authentication failed. Please check your credentials and try again.');
      } else {
        // Fallback error message
        setError(errorMessage || "An error occurred during login");
      }
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Show success message for magic link
      setError("Magic link sent! Check your email.")
    } catch (error: any) {
      // Log the full error object to see its structure
      console.error('Magic Link Error:', error)
      console.error('Error type:', typeof error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)

      // Check for AuthApiError which is the Supabase auth error type
      const isAuthError = error.name === 'AuthApiError' ||
                         error.message?.includes('AuthApiError') ||
                         (error.toString && error.toString().includes('AuthApiError'))
      const errorMessage = error.message || error.toString() || ''

      // Provide more user-friendly error messages for magic link
      if (errorMessage.includes('rate limit')) {
        setError('Too many requests. Please try again later.')
      } else if (errorMessage.includes('Invalid email')) {
        setError('Please enter a valid email address.')
      } else if (isAuthError) {
        // Generic auth error message
        setError('Unable to send magic link. Please check your email and try again.')
      } else {
        // Fallback error message
        setError(errorMessage || "Failed to send magic link")
      }
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Gonzigo</CardTitle>
          <CardDescription className="text-center">
            The AI that remembers everything, so you don't have to.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div id="error-container">
          {error && (
            <Alert
              variant={error.includes("Magic link sent") ? "default" : "destructive"}
              className={error.includes("Magic link sent")
                ? "bg-green-50 text-green-800 border-green-200 shadow-sm"
                : "bg-red-50 text-red-800 border-red-200 font-medium shadow-sm"
              }
            >
              <AlertDescription className="flex items-center">
                {error.includes("Magic link sent") ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{error}</span>
              </AlertDescription>
            </Alert>
          )}
          </div>

          <form className="space-y-4" onSubmit={handlePasswordLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  // Clear error when user starts typing
                  if (error && !error.includes("Magic link sent")) {
                    setError(null)
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    // Clear error when user starts typing
                    if (error && !error.includes("Magic link sent")) {
                      setError(null)
                    }
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col">
          <div className="relative w-full mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleMagicLinkLogin}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
