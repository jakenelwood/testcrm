'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUser(user)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          router.refresh()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/auth/login')
        }
      }
    )

    checkUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return { user, loading }
}
