"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor, Settings, DollarSign, MessageSquare, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

export interface AccountMenuProps {
  className?: string
}

export function AccountMenu({ className }: AccountMenuProps) {
  const { user, signOut } = useAuth()
  const [selectedTheme, setSelectedTheme] = React.useState<'light' | 'dark' | 'system'>('system')

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    
    if (savedTheme) {
      setSelectedTheme(savedTheme)
    } else {
      setSelectedTheme('system')
    }
    
    // Apply theme without causing re-render
    const themeToApply = savedTheme || systemTheme
    document.documentElement.setAttribute("data-theme", themeToApply)
  }, [])

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSelectedTheme(theme)
    
    if (theme === 'system') {
      localStorage.removeItem("theme")
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      document.documentElement.setAttribute("data-theme", systemTheme)
    } else {
      localStorage.setItem("theme", theme)
      document.documentElement.setAttribute("data-theme", theme)
    }
  }

  const handleSignOut = async () => {
    try {
      // Clear demo mode if it exists
      localStorage.removeItem('demo_mode')
      localStorage.removeItem('demo_user')
      localStorage.removeItem('just_logged_in')
      
      // Sign out from auth service
      await signOut()
      
      // Force navigation to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if there's an error, try to redirect to login
      window.location.href = '/login'
    }
  }

  return (
    <div 
      className={cn("w-80 p-6 rounded-[20px]", className)}
      style={{ backgroundColor: '#414141' }}
    >
      {/* User Info Section */}
      <div className="mb-4">
        <h3 
          className="text-white text-[15px] font-semibold mb-0.5"
          style={{ letterSpacing: '-0.03em' }}
        >
          {user?.name || 'User'}
        </h3>
        <p 
          className="text-white/50 text-[15px] font-semibold"
          style={{ letterSpacing: '-0.03em' }}
        >
          {user?.email || 'user@example.com'}
        </p>
      </div>

      {/* View Profile Button */}
      <div className="mb-4">
        <Button 
          variant="primary" 
          className="w-full !bg-white !text-black hover:!bg-white/90"
        >
          View profile
        </Button>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/10 mb-4" />

      {/* Theme Selector */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-white text-[15px] font-semibold" style={{ letterSpacing: '-0.03em' }}>
          Theme
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleThemeChange('light')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              selectedTheme === 'light' ? "bg-white/20" : "hover:bg-white/10"
            )}
          >
            <Sun className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              selectedTheme === 'dark' ? "bg-white/20" : "hover:bg-white/10"
            )}
          >
            <Moon className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              selectedTheme === 'system' ? "bg-white/20" : "hover:bg-white/10"
            )}
          >
            <Monitor className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/10 mb-4" />

      {/* Menu Items */}
      <div className="space-y-1 mb-4">
        <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-white text-[15px] font-semibold hover:bg-white/10 rounded-lg transition-colors" style={{ letterSpacing: '-0.03em' }}>
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-white text-[15px] font-semibold hover:bg-white/10 rounded-lg transition-colors" style={{ letterSpacing: '-0.03em' }}>
          <DollarSign className="w-4 h-4" />
          Pricing
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-white text-[15px] font-semibold hover:bg-white/10 rounded-lg transition-colors" style={{ letterSpacing: '-0.03em' }}>
          <MessageSquare className="w-4 h-4" />
          Give feedback
        </button>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-3 text-left text-white text-[15px] font-semibold hover:bg-white/10 rounded-lg transition-colors" 
          style={{ letterSpacing: '-0.03em' }}
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/10 mb-4" />

      {/* Terms and Privacy */}
      <div className="flex items-center gap-4">
        <button className="text-white/70 text-[12px] font-medium hover:text-white transition-colors">
          Terms
        </button>
        <button className="text-white/70 text-[12px] font-medium hover:text-white transition-colors">
          Privacy
        </button>
      </div>
    </div>
  )
}