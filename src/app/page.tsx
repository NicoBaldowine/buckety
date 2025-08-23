"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Check for demo mode first
    const isDemoMode = localStorage.getItem('demo_mode') === 'true'
    if (isDemoMode) {
      router.push('/home?demo=true')
      return
    }
    
    // If user is already authenticated, redirect to home
    if (!loading && user) {
      router.push('/home')
    }
  }, [user, loading, router])

  // Don't show loading state forever - timeout after 2 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Auth loading timeout, showing landing page')
      }
    }, 2000)
    return () => clearTimeout(timeout)
  }, [loading])

  // Skip loading state to prevent getting stuck
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-foreground/50">Loading...</div>
  //     </div>
  //   )
  // }

  // Don't show landing page if user is authenticated
  if (!loading && user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center transition-all duration-500 ease-out">
      <div className="w-full max-w-[500px] px-8 py-6 text-center">
        {/* Logo/Title */}
        <div 
          className="mb-12"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}
        >
          <h1 
            className="text-[48px] font-bold text-foreground mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            Buckety
          </h1>
          <p 
            className="text-[20px] text-foreground/70"
            style={{ letterSpacing: '-0.03em' }}
          >
            Smart savings with goal-based buckets
          </p>
        </div>

        {/* Features */}
        <div 
          className="mb-12 space-y-4"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <div className="text-[16px] text-foreground/60">
            ✨ Create personalized savings goals
          </div>
          <div className="text-[16px] text-foreground/60">
            🚀 Auto-deposit to reach your targets
          </div>
          <div className="text-[16px] text-foreground/60">
            📈 Track progress with beautiful visuals
          </div>
        </div>

        {/* CTA Buttons */}
        <div 
          className="space-y-4"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <Button 
            variant="primary"
            onClick={() => router.push('/sign-up')}
            className="w-full"
          >
            Get started for free
          </Button>
          
          <div className="text-[14px] text-foreground/60">
            Already have an account?{' '}
            <button 
              onClick={() => router.push('/login')}
              className="text-foreground font-semibold hover:opacity-80 transition-opacity"
            >
              Sign in
            </button>
          </div>
          
          {/* Demo Mode Button */}
          <div className="mt-8 pt-8 border-t border-foreground/10">
            <Button 
              variant="secondary"
              onClick={() => router.push('/demo')}
              className="w-full"
            >
              Try Demo Mode (No Sign-in Required)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
