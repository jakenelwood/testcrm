'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon, Mail, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Conzigo</h1>
            <p className="mt-2 text-lg text-gray-600">
              The AI that remembers everything, so you don't have to.
            </p>
          </div>
          
          <Card className="border-none shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <Alert variant={error.includes("Magic link sent") ? "default" : "destructive"} 
                       className={error.includes("Magic link sent") ? "bg-green-50 text-green-800 border-green-200" : ""}>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form className="space-y-4" onSubmit={handlePasswordLogin}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:border-blue-500"
                      required
                    />
                    <button 
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-black text-white hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2" 
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
              </form>
              
              <div className="text-sm text-center">
                <span className="text-gray-500">Don't have an account?</span>{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col pt-0">
              <div className="relative w-full mb-4">
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
                className="w-full h-11 border-gray-200 hover:bg-gray-50 transition-all duration-200"
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
                    <Mail className="h-4 w-4" />
                    <span>Magic Link</span>
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Right side - Image/Illustration */}
      <div className="hidden md:flex md:flex-1 bg-gradient-to-br from-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20"></div>
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Welcome to Conzigo</h2>
              <p className="mt-4 text-lg text-blue-200">
                The intelligent CRM that helps you manage leads, track opportunities, and close deals faster.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">JD</span>
                </div>
                <div>
                  <p className="text-sm text-blue-100">"Conzigo has transformed how we manage our sales pipeline. The AI remembers every detail so our team can focus on building relationships."</p>
                  <p className="mt-2 text-sm font-medium">Jane Doe, Sales Director</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <div className="h-2 w-2 rounded-full bg-white"></div>
              <div className="h-2 w-2 rounded-full bg-white/50"></div>
              <div className="h-2 w-2 rounded-full bg-white/50"></div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-blue-600/30 blur-3xl"></div>
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-indigo-600/30 blur-3xl"></div>
      </div>
    </div>
  )
}
