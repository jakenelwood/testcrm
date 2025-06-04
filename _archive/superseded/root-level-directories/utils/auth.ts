'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export const useLogout = () => {
  const router = useRouter()

  const logout = async () => {
    try {
      const supabase = createClient()

      // First navigate to login page, then sign out
      // This ensures we're on the login page before the auth state changes
      router.push('/auth/login')

      // Wait a moment for navigation to complete before signing out
      setTimeout(async () => {
        await supabase.auth.signOut()
        // No need to call router.refresh() here as we're already on the login page
      }, 100)
    } catch (error) {
      console.error('Error signing out:', error)
      // If there's an error, still try to redirect to login
      window.location.href = '/auth/login'
    }
  }

  return logout
}

export const useGetUser = () => {
  const getUser = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        throw error
      }

      return data.user
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  }

  return getUser
}
