'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export const useLogout = () => {
  const router = useRouter()
  
  const logout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
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
