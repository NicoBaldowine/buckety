"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import Image from "next/image"

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          {/* Logo - switches based on theme */}
          <Image 
            src="/zuma-dark.svg" 
            alt="Zuma" 
            width={32}
            height={32}
            className="h-8 dark:hidden"
          />
          <Image 
            src="/zuma-light.svg" 
            alt="Zuma" 
            width={32}
            height={32}
            className="h-8 hidden dark:block"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary"
            onClick={() => router.push('/login')}
            className="text-foreground"
          >
            Log in
          </Button>
          <Button 
            variant="primary"
            onClick={() => router.push('/sign-up')}
            className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            Sign in
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 
            className="text-[96px] font-medium text-foreground leading-none mb-6"
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: 500,
              letterSpacing: '-0.07em' 
            }}
          >
            Smarter Saving,<br />
            Simplified.
          </h1>

          {/* Subtitle */}
          <p className="text-[14px] text-foreground/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Organize your money into flexible buckets, earn yield on your balance, and reach your goals faster. One account, multiple purposes, all with a seamless, modern experience.
          </p>

          {/* CTA Button */}
          <Button 
            variant="primary"
            onClick={() => router.push('/sign-up')}
            className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-8 py-3 text-[16px] font-medium rounded-lg"
          >
            Get Started
          </Button>
        </div>
      </main>
    </div>
  )
}
