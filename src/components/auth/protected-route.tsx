"use client"

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Check for demo mode
  const isDemoMode = typeof window !== 'undefined' && 
    (window.location.search.includes('demo=true') || localStorage.getItem('demo_mode') === 'true')

  useEffect(() => {
    // Skip protection in demo mode
    if (isDemoMode) {
      localStorage.setItem('demo_mode', 'true')
      return
    }
    
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo, isDemoMode])

  // Show loading state (skip in demo mode)
  if (!isDemoMode && loading) {
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