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
      console.warn('Emergency timeout - forcing loading to false')
      setLoading(false)
    }, 500) // Reduced from 2000ms to 500ms for faster response

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Starting auth initialization...')
        
        const initialSession = await authService.getSession()
        console.log('Got initial session:', !!initialSession)
        setSession(initialSession)
        
        if (initialSession) {
          console.log('Getting current user...')
          const currentUser = await authService.getUser()
          console.log('Got current user:', !!currentUser)
          setUser(currentUser)
        }
        console.log('Auth initialization completed')
      } catch (error) {
        console.error('Error initializing auth:', error)
        
        // Handle refresh token errors specifically
        if (error instanceof Error && 
            (error.message?.includes('Invalid Refresh Token') || 
             error.message?.includes('Refresh Token Not Found'))) {
          console.warn('Invalid refresh token during initialization, clearing storage')
          // Clear all auth-related localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('supabase.auth.token')
            // Clear any other Supabase auth keys
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
        console.log('Auth state changed:', event, session)
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, clearing auth state')
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
            console.error('Error getting user on auth state change:', error)
            // Clear auth state on error
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
      console.log('AuthContext: Starting signOut...')
      
      // Call Supabase signOut
      await authService.signOut()
      console.log('AuthContext: Supabase signOut completed')
      
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
      
      console.log('AuthContext: Clearing user state...')
      setUser(null)
      setSession(null)
      
      console.log('AuthContext: SignOut process completed')
    } catch (error) {
      console.error('AuthContext: Error during signOut:', error)
      // Even if there's an error, clear the local state
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