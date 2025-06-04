'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon, Mail, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DevLoginPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('dev123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Store user data in localStorage for client-side access
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Development Login</CardTitle>
          <CardDescription>
            Connect to your Hetzner database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError(null)
                  }}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="dev123"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Development Credentials:</h4>
            <p className="text-sm text-muted-foreground mb-1">
              Email: admin@example.com
            </p>
            <p className="text-sm text-muted-foreground">
              Password: dev123
            </p>
          </div>

          <div className="text-center mt-4">
            <Link href="/auth/login" className="text-sm text-primary hover:underline">
              Back to Supabase Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
