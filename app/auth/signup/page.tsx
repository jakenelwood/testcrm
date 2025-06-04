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
import BrandLogo from '@/components/brand-logo'
import { brand } from '@/lib/brand'
import { ThemeToggle } from '@/components/theme-toggle'

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

      // Handle signup errors without throwing
      if (signUpError) {
        // Handle expected authentication errors
        if (signUpError.name === 'AuthApiError') {
          if (signUpError.message.includes('email')) {
            setError("Invalid email address. Please check and try again.");
          } else if (signUpError.message.includes('password')) {
            setError("Password is too weak. Please use a stronger password.");
          } else if (signUpError.message.includes('rate limit')) {
            setError("Too many signup attempts. Please try again later.");
          } else {
            setError(signUpError.message || "Authentication failed. Please try again.");
          }
        } else {
          // Handle unexpected errors
          console.warn('Unexpected signup error:', signUpError);
          setError("An error occurred during signup. Please try again.");
        }
        return; // Exit early without throwing
      }

      // Check if user already exists
      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists.");
        return;
      }

      // Show success message
      setError("Success! Check your email for the confirmation link.");

      // Optionally redirect to login page after a delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 5000);

    } catch (error: any) {
      // This should only catch unexpected errors, not auth errors
      console.error('Unexpected error during signup:', error);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Top navigation */}
      <nav className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="lg" className="h-10 flex items-center" />
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-12 items-start justify-between">
          {/* Left side - Signup form */}
          <div className="w-full max-w-sm">
            <div className="text-center md:text-left mb-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">Create an account</h1>
              <p className="text-lg text-muted-foreground">
                Join {brand.name} and start closing more deals
              </p>
            </div>

            <Card className="border-none shadow-xl bg-card overflow-hidden">
              {/* Decorative top bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/60"></div>

              <CardHeader className="space-y-1 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-card-foreground">Sign up</CardTitle>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardDescription className="text-muted-foreground">
                  Enter your details to get started
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {error && (
                  <Alert variant={error.includes("Success") ? "default" : "destructive"}
                         className={error.includes("Success") ? "bg-green-50 text-green-800 border-green-200" : ""}>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form className="space-y-5" onSubmit={handleSignUp}>
                  <div className="space-y-3">
                    <Label htmlFor="displayName" className="text-sm font-medium text-card-foreground">Display Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors h-4 w-4" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10 h-12 bg-background border-border rounded-lg focus:border-primary focus:ring-primary transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium text-card-foreground">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-background border-border rounded-lg focus:border-primary focus:ring-primary transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-medium text-card-foreground">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors h-4 w-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-12 bg-background border-border rounded-lg focus:border-primary focus:ring-primary transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
                      >
                        {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                      </button>
                    </div>
                    {passwordStrength && (
                      <div className="flex items-center mt-1 text-xs">
                        <div className={`h-1.5 w-20 rounded-full ${
                          passwordStrength === 'weak' ? 'bg-red-500' :
                          passwordStrength === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        } mr-2`}></div>
                        <span className={getPasswordStrengthColor()}>
                          {getPasswordStrengthText()} password
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-card-foreground">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors h-4 w-4" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pl-10 h-12 bg-background border-border rounded-lg focus:border-primary focus:ring-primary transition-all ${
                          passwordsMatch === false ? 'border-red-500' :
                          passwordsMatch === true ? 'border-green-500' : ''
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
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
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-2"
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
                        <span>Create account</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-sm text-center">
                  <span className="text-muted-foreground">Already have an account?</span>{' '}
                  <Link href="/auth/login" className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors">
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Illustration */}
          <div className="hidden md:block w-full max-w-md">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl overflow-hidden shadow-xl relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>

              <div className="relative z-10 p-8 md:p-10">
                <div className="text-primary-foreground mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">The Pipeline Whisperer</h2>
                  <p className="text-primary-foreground/80 mb-6">
                    CRM with brains, not baggage. Smart. Automated. Actually affordable.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground">🔄</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-foreground">The Gentle Nudge</p>
                        <p className="text-xs text-primary-foreground/70">Already sent. Soft touch. Big win.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground">🧠</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-foreground">Deal Memory</p>
                        <p className="text-xs text-primary-foreground/70">I never forget a lead. You're welcome.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground">🤖</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-foreground">Street-Smart AI</p>
                        <p className="text-xs text-primary-foreground/70">They opened it twice. Want to nudge again?</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-primary-foreground/80 italic">"Where your pipeline goes to close."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto py-6 px-4 text-center text-muted-foreground text-sm">
        <div className="flex justify-center mb-3">
          <BrandLogo size="sm" className="h-6 flex items-center opacity-50" />
        </div>
        <p>{brand.copyrightText}</p>
      </footer>
    </div>
  )
}
