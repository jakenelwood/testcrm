'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export const signOut = async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  // The auth state change listener in useAuth will handle the redirect
}

export const useSignOut = () => {
  const router = useRouter()
  
  return async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }
}
