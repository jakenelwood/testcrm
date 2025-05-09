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

      // Redirect to the callback URL or dashboard
      router.push(callbackUrl)
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

        // Fallback: Direct DOM manipulation to ensure the error is displayed
        setTimeout(() => {
          if (typeof document !== 'undefined') {
            const errorContainer = document.getElementById('error-container');
            if (errorContainer && !errorContainer.textContent?.includes(userFriendlyMessage)) {
              console.log('Using DOM fallback to display error message');
              const errorAlert = document.createElement('div');
              errorAlert.className = 'bg-red-50 text-red-800 border border-red-200 rounded-md p-4 mb-4';
              errorAlert.innerHTML = `
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  <span>${userFriendlyMessage}</span>
                </div>
              `;
              errorContainer.appendChild(errorAlert);
            }
          }
        }, 100);

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
        setError('Too many login attempts. Please try again.');
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
          emailRedirectTo: `${window.location.origin}/auth/callback?callbackUrl=${encodeURIComponent(callbackUrl)}`,
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
    <div className="min-h-screen bg-white">
      {/* Top navigation */}
      <nav className="container mx-auto py-6 px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#0047AB]">Gonzigo</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/pricing">
            <Button className="bg-[#0047AB] hover:bg-[#003d91] text-white font-medium">Get Started</Button>
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
              <div id="error-container" className="mb-6 max-w-md w-full">
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
                    <span className="text-sm">{error}</span>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <form className="space-y-4 max-w-md w-full" onSubmit={handlePasswordLogin}>
              <div className="space-y-2">
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

              <div className="space-y-2">
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
                className="w-full h-12 bg-[#0047AB] hover:bg-[#003d91] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
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
                className="w-full h-12 bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 rounded-lg shadow-sm"
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
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              {/* Browser-like top bar with dots */}
              <div className="bg-gray-50 border-b border-gray-100 h-10 flex items-center px-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto text-sm text-gray-500">Gonzigo Dashboard</div>
              </div>

              {/* Dashboard content */}
              <div className="p-6">
                {/* Gonzigo's been listening */}
                <div className="mb-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <span className="text-[#0047AB] mr-2">🧠</span> Gonzigo's been listening.
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
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                  <p className="text-gray-700 italic mb-2">"This one's ready. You'll want your 'yes' voice."</p>
                  <p className="text-sm text-gray-500">— Gonzigo, your AI assistant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto py-8 px-4 text-center text-gray-500 text-sm border-t border-gray-100 mt-8">
        <div className="flex justify-center mb-3">
          <span className="text-xl font-bold text-[#0047AB]">Gonzigo</span>
        </div>
        <p>© {new Date().getFullYear()} Gonzigo. All rights reserved.</p>
      </footer>
    </div>
  )
}
