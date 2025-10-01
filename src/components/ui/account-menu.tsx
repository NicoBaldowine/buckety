"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor, Settings, DollarSign, MessageSquare, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export interface AccountMenuProps {
  className?: string
}

export function AccountMenu({ className }: AccountMenuProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [selectedTheme, setSelectedTheme] = React.useState<'light' | 'dark' | 'system'>('system')
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [displayName, setDisplayName] = React.useState<string>('')

  // Load user name from localStorage
  const loadUserName = React.useCallback(() => {
    if (user) {
      const savedProfile = localStorage.getItem(`profile_${user.id}`)
      if (savedProfile) {
        try {
          const profileData = JSON.parse(savedProfile)
          setDisplayName(profileData.name || user.name || 'User')
        } catch {
          setDisplayName(user.name || 'User')
        }
      } else {
        setDisplayName(user.name || 'User')
      }
    }
  }, [user])

  React.useEffect(() => {
    loadUserName()
    
    // Just read the current theme state, don't set it (ThemeInitializer handles that)
    const getCurrentTheme = () => {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (savedTheme) {
        setSelectedTheme(savedTheme)
      } else {
        setSelectedTheme('system')
      }
    }

    getCurrentTheme()
  }, [user?.id, loadUserName])
  
  // Listen for storage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      loadUserName()
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also listen for focus to catch updates from same tab
    window.addEventListener('focus', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [loadUserName])

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    console.log('🎨 Changing theme to:', theme)
    setSelectedTheme(theme)
    
    // Apply theme immediately
    if (theme === 'system') {
      localStorage.removeItem("theme")
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      document.documentElement.setAttribute("data-theme", systemTheme)
    } else {
      localStorage.setItem("theme", theme)
      document.documentElement.setAttribute("data-theme", theme)
    }

    // Save to database if user is logged in
    if (user?.id) {
      try {
        console.log('💾 Saving theme to database for user:', user.id)
        const { userPreferencesService } = await import('@/lib/supabase')
        const result = await userPreferencesService.updateUserTheme(user.id, theme)
        
        if (result) {
          console.log('✅ Theme saved successfully in database')
        } else {
          console.warn('⚠️ Failed to save theme to database, but localStorage updated')
        }
      } catch (error) {
        console.error('❌ Error saving theme to database:', error)
        // Theme is still applied locally via localStorage
      }
    }
  }

  const handleSignOut = async () => {
    if (isLoggingOut) return // Prevent multiple clicks
    
    setIsLoggingOut(true)
    console.log('Starting logout process...')
    
    // Set a timeout to force logout after 3 seconds if it hangs
    const forceLogout = setTimeout(() => {
      console.log('Logout timeout, forcing redirect...')
      localStorage.clear()
      window.location.href = '/login'
    }, 3000)
    
    try {
      // Clear demo mode if it exists
      localStorage.removeItem('demo_mode')
      localStorage.removeItem('demo_user')
      localStorage.removeItem('just_logged_in')
      
      // Try to sign out from auth service with timeout
      console.log('Calling signOut...')
      const signOutPromise = signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SignOut timeout')), 2000)
      )
      
      await Promise.race([signOutPromise, timeoutPromise])
      
      console.log('SignOut completed, redirecting...')
      clearTimeout(forceLogout)
      
      // Immediate redirect
      window.location.href = '/login'
      
    } catch (error) {
      console.error('Error signing out:', error)
      clearTimeout(forceLogout)
      
      // Clear local state manually and redirect
      localStorage.clear()
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
          {displayName || 'User'}
        </h3>
        <p 
          className="text-white/50 text-[15px] font-semibold"
          style={{ letterSpacing: '-0.03em', pointerEvents: 'none', userSelect: 'none' }}
        >
          {user?.email || 'user@example.com'}
        </p>
      </div>

      {/* View Profile Button */}
      <div className="mb-4">
        <Button 
          variant="primary" 
          className="w-full !bg-white !text-black hover:!bg-white/90"
          onClick={() => router.push('/profile')}
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
        <button 
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-3 px-3 py-3 text-left text-white text-[15px] font-semibold hover:bg-white/10 rounded-lg transition-colors" 
          style={{ letterSpacing: '-0.03em' }}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button 
          onClick={() => router.push('/pricing')}
          className="w-full flex items-center gap-3 px-3 py-3 text-left text-white text-[15px] font-semibold hover:bg-white/10 rounded-lg transition-colors" 
          style={{ letterSpacing: '-0.03em' }}
        >
          <DollarSign className="w-4 h-4" />
          Pricing
        </button>
        <button 
          onClick={() => router.push('/feedback')}
          className="w-full flex items-center gap-3 px-3 py-3 text-left text-white text-[15px] font-semibold hover:bg-white/10 rounded-lg transition-colors" 
          style={{ letterSpacing: '-0.03em' }}
        >
          <MessageSquare className="w-4 h-4" />
          Give feedback
        </button>
        <button 
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={`w-full flex items-center gap-3 px-3 py-3 text-left text-white text-[15px] font-semibold rounded-lg transition-colors ${
            isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
          }`}
          style={{ letterSpacing: '-0.03em' }}
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? 'Logging out...' : 'Log out'}
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/10 mb-4" />

      {/* Terms and Privacy */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/terms')}
          className="text-white/70 text-[12px] font-medium hover:text-white transition-colors"
        >
          Terms
        </button>
        <button 
          onClick={() => router.push('/privacy')}
          className="text-white/70 text-[12px] font-medium hover:text-white transition-colors"
        >
          Privacy
        </button>
      </div>
    </div>
  )
}