"use client"

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    // Check for demo mode only after component mounts
    const demoMode = window.location?.search?.includes('demo=true') || 
                     localStorage?.getItem('demo_mode') === 'true'
    setIsDemoMode(demoMode)
  }, [])

  useEffect(() => {
    // Skip protection in demo mode
    if (isDemoMode) {
      localStorage.setItem('demo_mode', 'true')
      return
    }
    
    // Only redirect if we're not loading and definitely don't have a user
    if (!loading && !user) {
      console.log('ProtectedRoute: No user found, redirecting to login')
      router.push(redirectTo)
    } else if (user) {
      console.log('ProtectedRoute: User authenticated:', user.email)
    }
  }, [user, loading, router, redirectTo, isDemoMode])

  // Show loading state while mounting or checking auth
  if (!mounted || (!isDemoMode && loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/50">Loading...</div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated (skip in demo mode)
  if (!isDemoMode && !user) {
    return null
  }

  return <>{children}</>
}