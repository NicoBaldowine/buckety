"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, type AuthUser } from '@/lib/auth'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Set client flag after component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Emergency timeout to prevent infinite loading
    const emergencyTimeout = setTimeout(() => {
      // Silently force loading to false if initialization takes too long
      setLoading(false)
    }, 3000) // Increased to 3 seconds to allow proper auth initialization

    // Get initial session
    const initializeAuth = async () => {
      try {
        // Silently initialize authentication
        
        // Handle invalid refresh tokens by clearing auth state
        if (typeof window !== 'undefined') {
          // Clear any invalid Supabase tokens that are causing errors
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.includes('auth-token')) {
              try {
                const tokenData = localStorage.getItem(key)
                if (tokenData) {
                  const parsed = JSON.parse(tokenData)
                  // Clear if refresh token is missing or expired
                  if (!parsed.refresh_token || !parsed.access_token) {
                    localStorage.removeItem(key)
                    console.log('🧹 Cleared invalid auth token:', key)
                  }
                  // Let expired tokens be handled by Supabase refresh mechanism
                }
              } catch {
                // If we can't parse it, it's definitely corrupted - remove it silently
                localStorage.removeItem(key)
              }
            }
          })
        }
        
        const initialSession = await authService.getSession()
        setSession(initialSession)
        
        if (initialSession) {
          const currentUser = await authService.getUser()
          setUser(currentUser)
        }
      } catch (error) {
        // Handle refresh token errors specifically - silently
        if (error instanceof Error && error.message.includes('Refresh Token Not Found')) {
          console.log('🧹 Clearing invalid session due to refresh token error')
          // Clear all Supabase auth tokens
          if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-')) {
                localStorage.removeItem(key)
              }
            })
          }
        }
        
        setUser(null)
        setSession(null)
      } finally {
        clearTimeout(emergencyTimeout)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }
        
        setSession(session)
        
        if (session) {
          try {
            const currentUser = await authService.getUser()
            setUser(currentUser)
          } catch (error) {
            // Clear auth state on error - silently
            setUser(null)
            setSession(null)
          }
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(emergencyTimeout)
      subscription.unsubscribe()
    }
  }, [isClient])

  const signOut = async () => {
    const currentUser = user
    
    try {
      // Call Supabase signOut silently
      await authService.signOut()
      
      // Clear user-specific localStorage data (only on client side)
      if (typeof window !== 'undefined') {
        if (currentUser) {
          localStorage.removeItem(`buckets_${currentUser.id}`)
          localStorage.removeItem(`mainBucket_${currentUser.id}`)
        }
        
        // Clear old global localStorage keys (legacy cleanup)
        localStorage.removeItem('buckets')
        localStorage.removeItem('mainBucket')
      }
      
      setUser(null)
      setSession(null)
    } catch (error) {
      // Even if there's an error, clear the local state silently
      setUser(null)
      setSession(null)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}