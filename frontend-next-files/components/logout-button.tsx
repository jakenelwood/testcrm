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
    await logout()
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
          className="relative"
        >
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
            {user && displayName.charAt(0).toUpperCase()}
          </div>
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2" disabled>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
