'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLogout } from '@/utils/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/sidebar-context'

interface UserProfileProps {
  showText?: boolean
}

export function UserProfile({ showText = true }: UserProfileProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const logout = useLogout()
  const { isCollapsed } = useSidebar()

  // Get the actual showText value based on sidebar state
  const shouldShowText = showText && !isCollapsed

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          throw error
        }

        if (data?.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error in UserProfile handleLogout:', error)
      // Fallback direct navigation if the hook fails
      window.location.href = '/auth/login'
    }
  }

  // Get display name from user metadata or email
  const displayName = user?.user_metadata?.display_name ||
                     (user?.email ? user.email.split('@')[0] : 'User')

  return (
    <div className={cn(
      "border-t border-gray-100 bg-gradient-to-r from-blue-600/5 to-indigo-600/5",
      shouldShowText ? "p-4" : "p-2"
    )}>
      <div className={cn(
        "flex items-center",
        shouldShowText ? "gap-3" : "justify-center"
      )}>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-medium shadow-sm">
          {!loading && displayName.charAt(0).toUpperCase()}
        </div>
        {shouldShowText && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{loading ? 'Loading...' : displayName}</p>
            <p className="text-xs text-gray-500 truncate">{loading ? '' : user?.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "h-8 w-8 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors",
            !shouldShowText && "ml-0"
          )}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </div>
  )
}
