'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon, Mail, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import GonzigoBrand from '@/components/gonzigo-brand'

// ELABORATE VERSION - Full-page design with navigation, dashboard preview, and footer
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState<string>('/dashboard')
  const router = useRouter()

  // Get the callback URL from the query parameters
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const callback = params.get('callbackUrl')
      if (callback) {
        setCallbackUrl(decodeURIComponent(callback))
      }
    }
  }, [])

  // Debug: Log error state changes (only in development)
  useEffect(() => {
    if (error && process.env.NODE_ENV === 'development') {
      console.log('Error state updated:', error)

      // Log when error container is rendered
      setTimeout(() => {
        if (typeof document !== 'undefined') {
          const errorContainer = document.getElementById('error-container');
          console.log('Error container found:', !!errorContainer);
          if (errorContainer) {
            console.log('Error container content:', errorContainer.textContent);
          }
        }
      }, 100);
    }
  }, [error])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create the Supabase client
      const supabase = createClient()

      // Attempt to sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Handle authentication errors without throwing
      if (error) {
        // Handle expected authentication errors without throwing
        if (error.name === 'AuthApiError') {
          // This is an expected authentication error
          if (error.message === 'Invalid login credentials') {
            // Handle invalid credentials (wrong email or password)
            setError('The email or password you entered is incorrect. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            // Handle unconfirmed email
            setError('Please verify your email address before logging in. Check your inbox for a confirmation email.');
          } else if (error.message.includes('rate limit')) {
            // Handle rate limiting
            setError('Too many login attempts. Please try again later.');
          } else {
            // Handle other auth errors
            setError('Authentication failed. Please check your credentials and try again.');
          }
        } else {
          // Handle unexpected errors
          console.warn('Unexpected auth error:', error);
          setError('An error occurred during login. Please try again.');
        }
        return; // Exit early without throwing
      }

      // If we get here, login was successful
      router.push(callbackUrl)
      router.refresh()
    } catch (error: any) {
      // This should only catch unexpected errors, not auth errors
      console.error('Unexpected error during login:', error);
      setError('An unexpected error occurred. Please try again later.');
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
          emailRedirectTo: `${window.location.origin}/auth/callback?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        },
      })

      // Handle authentication errors without throwing
      if (error) {
        // Handle expected authentication errors
        if (error.name === 'AuthApiError') {
          // This is an expected authentication error
          if (error.message.includes('rate limit')) {
            setError('Too many requests. Please try again later.')
          } else if (error.message.includes('Invalid email')) {
            setError('Please enter a valid email address.')
          } else {
            // Generic auth error message
            setError('Unable to send magic link. Please check your email and try again.')
          }
        } else {
          // Handle unexpected errors
          console.warn('Unexpected magic link error:', error);
          setError('An error occurred while sending the magic link. Please try again.');
        }
        return; // Exit early without throwing
      }

      // Show success message for magic link
      setError("Magic link sent! Check your email.")
    } catch (error: any) {
      // This should only catch unexpected errors, not auth errors
      console.error('Unexpected error during magic link login:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Top navigation */}
      <nav className="container mx-auto py-6 px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <GonzigoBrand size="lg" className="h-10 flex items-center" />
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/pricing">
            <Button className="bg-black hover:bg-gray-800 text-white font-medium rounded-sm">Let's Close</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
          {/* Left side - Login form */}
          <div className="w-full flex flex-col items-center md:items-start">
            <div className="text-center md:text-left mb-8 max-w-md w-full">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">Welcome back</h1>
              <p className="text-xl text-gray-600 mb-6">
                Sign in to continue to your dashboard
              </p>
            </div>

            {error && (
              <div id="error-container" className="mb-6 max-w-md w-full relative">
                <Alert
                  variant={error.includes("Magic link sent") ? "success" : "error"}
                  className="shadow-sm relative"
                >
                  <AlertDescription>
                    <div className="flex items-center">
                      {error.includes("Magic link sent") ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <form className="space-y-4 max-w-md w-full relative" onSubmit={handlePasswordLogin}>
              <div className="space-y-2 relative">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors h-4 w-4" />
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
                    className="pl-10 h-10 bg-white border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors h-4 w-4" />
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
                    className="pl-10 h-10 bg-white border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 transition-all shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="relative w-full my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleMagicLinkLogin}
                disabled={loading || !email}
                className="w-full h-12 bg-white border-gray-300 hover:bg-gray-50 transition-all duration-200 rounded-sm shadow-sm"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>Magic Link</span>
                  </div>
                )}
              </Button>

              <div className="text-sm text-center mt-6">
                <span className="text-gray-500">Don't have an account?</span>{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                  Sign up
                </Link>
              </div>
            </form>
          </div>

          {/* Right side - Dashboard Preview */}
          <div className="hidden md:block w-full">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Browser-like top bar with dots */}
              <div className="bg-gray-50 border-b border-gray-100 h-12 flex items-center px-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto text-sm text-gray-500">gonzigo dashboard</div>
              </div>

              {/* Dashboard content */}
              <div className="p-6">
                {/* Gonzigo's been listening */}
                <div className="mb-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <span className="text-[#3B28CC] mr-2">🧠</span> gonzigo's been listening.
                  </h3>
                </div>

                {/* Checklist items */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">Nudges already sent</p>
                  </div>

                  <div className="flex items-center gap-3 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">Memory loaded</p>
                  </div>

                  <div className="flex items-center gap-3 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">No dashboard chaos</p>
                  </div>
                </div>

                {/* Quote */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 relative overflow-hidden animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                  <p className="text-gray-700 italic mb-2">"This one's ready. You'll want your 'yes' voice."</p>
                  <p className="text-sm text-gray-500">— gonzigo, your AI assistant</p>
                  <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-blue-100/50 rounded-full blur-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto py-8 px-4 text-center text-gray-500 text-sm border-t border-gray-100 mt-8">
        <div className="flex justify-center mb-3">
          <GonzigoBrand size="md" className="h-8 flex items-center" />
        </div>
        <p>© {new Date().getFullYear()} gonzigo. All rights reserved.</p>
      </footer>
    </div>
  )
}
