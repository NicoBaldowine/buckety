"use client"

import * as React from "react"
import { useAuth } from "@/contexts/auth-context"

export function ThemeInitializer() {
  const { user } = useAuth()
  const [initialized, setInitialized] = React.useState(false)

  React.useEffect(() => {
    const initializeTheme = async () => {
      if (initialized) return

      try {
        if (user?.id) {
          // User is logged in - load theme from database
          console.log('🎨 Loading theme from database for authenticated user:', user.id)
          
          const { userPreferencesService } = await import('@/lib/supabase')
          const preferences = await userPreferencesService.getUserPreferences(user.id)
          
          if (preferences?.theme) {
            console.log('✅ Theme loaded from database:', preferences.theme)
            
            if (preferences.theme === 'system') {
              localStorage.removeItem("theme")
              const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
              document.documentElement.setAttribute("data-theme", systemTheme)
            } else {
              localStorage.setItem("theme", preferences.theme)
              document.documentElement.setAttribute("data-theme", preferences.theme)
            }
          } else {
            // Fallback to localStorage if database fails
            console.log('⚠️ No database theme, using localStorage fallback')
            applyLocalStorageTheme()
          }
        } else {
          // User not logged in - use localStorage
          console.log('🔄 User not logged in, using localStorage theme')
          applyLocalStorageTheme()
        }
        
        setInitialized(true)
      } catch (error) {
        console.error('❌ Error initializing theme:', error)
        // Fallback to localStorage
        applyLocalStorageTheme()
        setInitialized(true)
      }
    }

    const applyLocalStorageTheme = () => {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      const themeToApply = savedTheme || systemTheme
      
      document.documentElement.setAttribute("data-theme", themeToApply)
      console.log('🎨 Applied theme from localStorage:', themeToApply)
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeTheme, 100)
    
    return () => clearTimeout(timer)
  }, [user?.id, initialized])

  // Listen for system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      const savedTheme = localStorage.getItem("theme")
      if (!savedTheme) {
        // Only apply system theme if no saved preference
        const systemTheme = mediaQuery.matches ? "dark" : "light"
        document.documentElement.setAttribute("data-theme", systemTheme)
        console.log('🌙 System theme changed to:', systemTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return null // This component doesn't render anything
}