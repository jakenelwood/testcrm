'use client'

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useLogout } from "@/utils/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

export function LogoutButton() {
  const logout = useLogout()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
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
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error in handleLogout:', error)
      // Fallback direct navigation if the hook fails
      window.location.href = '/auth/login'
    }
  }

  // Get display name from user metadata or email
  const displayName = user?.user_metadata?.display_name ||
                     (user?.email ? user.email.split('@')[0] : 'User')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-blue-50 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium shadow-sm">
            {user && displayName.charAt(0).toUpperCase()}
          </div>
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] p-0 overflow-hidden rounded-lg border border-gray-200 shadow-lg">
        <DropdownMenuLabel className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100 py-3 px-4">
          <span className="font-semibold text-gray-900">My Account</span>
        </DropdownMenuLabel>
        <div className="p-4 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium shadow-sm">
              {user && displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="py-3 px-4 focus:bg-red-50 text-red-600 hover:text-red-700 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
