'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon, Mail, Lock, User, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null)
  const router = useRouter()

  // Check password match whenever either password changes
  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword)
    } else {
      setPasswordsMatch(null)
    }
  }, [password, confirmPassword])

  // Check password strength whenever password changes
  useEffect(() => {
    if (password) {
      if (password.length < 8) {
        setPasswordStrength('weak')
      } else if (password.length >= 8 && password.length < 12) {
        setPasswordStrength('medium')
      } else {
        setPasswordStrength('strong')
      }
    } else {
      setPasswordStrength(null)
    }
  }, [password])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate display name
    if (!displayName.trim()) {
      setError("Display name is required")
      setLoading(false)
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        throw signUpError
      }
      
      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists.")
        return
      }
      
      // Show success message
      setError("Success! Check your email for the confirmation link.")
      
      // Optionally redirect to login page after a delay
      setTimeout(() => {
        router.push('/auth/login')
      }, 5000)
      
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || "An error occurred during sign up")
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  // Get password strength color
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      case 'strong':
        return 'text-green-500'
      default:
        return ''
    }
  }

  // Get password strength text
  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'Weak'
      case 'medium':
        return 'Medium'
      case 'strong':
        return 'Strong'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Signup form */}
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
              <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
              <CardDescription className="text-center">
                Enter your details to get started
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <Alert variant={error.includes("Success") ? "default" : "destructive"} 
                       className={error.includes("Success") ? "bg-green-50 text-green-800 border-green-200" : ""}>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
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
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
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
                  {passwordStrength && (
                    <div className="flex items-center mt-1 text-xs">
                      <div className={`h-1 w-16 rounded ${
                        passwordStrength === 'weak' ? 'bg-red-500' : 
                        passwordStrength === 'medium' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      } mr-2`}></div>
                      <span className={getPasswordStrengthColor()}>
                        {getPasswordStrengthText()} password
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:border-blue-500 ${
                        passwordsMatch === false ? 'border-red-500' : 
                        passwordsMatch === true ? 'border-green-500' : ''
                      }`}
                      required
                    />
                    <button 
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                    {passwordsMatch !== null && (
                      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                        {passwordsMatch ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {passwordsMatch === false && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-black text-white hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2" 
                  disabled={loading || passwordsMatch === false || passwordStrength === 'weak' || !displayName.trim()}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign up</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
              
              <div className="text-sm text-center">
                <span className="text-gray-500">Already have an account?</span>{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Right side - Image/Illustration */}
      <div className="hidden md:flex md:flex-1 bg-gradient-to-br from-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20"></div>
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Join Conzigo Today</h2>
              <p className="mt-4 text-lg text-blue-200">
                Create your account and start managing your leads more efficiently with AI-powered assistance.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-blue-100">AI-powered lead management</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-blue-100">Customizable pipelines and workflows</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-blue-100">Real-time collaboration and updates</p>
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
