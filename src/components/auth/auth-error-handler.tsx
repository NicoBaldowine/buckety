"use client"

import { useEffect } from 'react'
import { clearAllAuthData } from '@/lib/clear-auth'

export function AuthErrorHandler() {
  useEffect(() => {
    // Listen for unhandled promise rejections that might be auth-related
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      if (error?.message?.includes('Invalid Refresh Token') || 
          error?.message?.includes('Refresh Token Not Found') ||
          error?.message?.includes('JWT expired')) {
        console.warn('Auth token error detected, clearing auth data...')
        clearAllAuthData()
        // Reload the page to get a fresh start
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
  
  return null
}