'use client'

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useLogout } from "@/utils/auth"

export function LogoutButton() {
  const logout = useLogout()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error in handleLogout:', error)
      // Fallback direct navigation if the hook fails
      window.location.href = '/auth/login'
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors px-3 py-2"
    >
      <LogOut className="h-4 w-4" />
      <span className="text-sm font-medium">Logout</span>
    </Button>
  )
}
