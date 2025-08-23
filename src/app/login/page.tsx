"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [checkingAuth, setCheckingAuth] = useState(false) // Changed to false to skip the check
  const [showPassword, setShowPassword] = useState(false)
  
  // Check if user is already logged in
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const checkSession = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.log('Session check timed out, proceeding to login')
          setCheckingAuth(false)
        }, 3000) // 3 second timeout
        
        const session = await authService.getSession()
        clearTimeout(timeoutId)
        
        if (session) {
          console.log('User already logged in, redirecting to home...')
          router.push('/home')
        } else {
          setCheckingAuth(false)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        clearTimeout(timeoutId)
        setCheckingAuth(false)
      }
    }
    
    checkSession()
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsSubmitting(true)
    setError("")

    try {
      console.log('Attempting to sign in with email:', email)
      const result = await authService.signIn(email, password)
      console.log('Sign in result:', result)
      
      if (result.success) {
        console.log('Sign in successful, redirecting to home...')
        // Set a flag to prevent redirect loop
        localStorage.setItem('just_logged_in', 'true')
        // Force a hard navigation to ensure auth state updates
        window.location.href = '/home'
      } else {
        console.error('Sign in failed:', result.error)
        setError(result.error || "Failed to sign in")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true)
    setError("")
    
    try {
      const result = await authService.signInWithGoogle()
      if (result.success) {
        console.log('Google sign in successful')
        // Google auth redirects automatically
      } else {
        setError(result.error || "Failed to sign in with Google")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error during Google sign in:', error)
      setError("Failed to sign in with Google")
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return email && password
  }
  
  // Show loading while checking if user is already authenticated
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/50">Checking authentication...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[520px] mx-auto px-12 py-6 min-h-screen flex items-center">
        <div className="w-full">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <div className="relative w-48 h-16">
              <Image 
                src="/zuma-light.svg" 
                alt="Zuma Logo" 
                fill
                className="object-contain dark:hidden"
              />
              <Image 
                src="/zuma-dark.svg" 
                alt="Zuma Logo" 
                fill
                className="object-contain hidden dark:block"
              />
            </div>
          </div>
          
          {/* Header */}
          <div 
            className="text-center mb-10"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}
          >
            <h1 
              className="text-[40px] font-semibold text-foreground"
              style={{ letterSpacing: '-0.03em' }}
            >
              Welcome back
            </h1>
          </div>

          {/* Google Sign In Button */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.15s both' }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 h-12 text-[16px] font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          {/* OR Divider */}
          <div className="relative my-8" style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-foreground/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-foreground/50">or</span>
            </div>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.25s both' }}
          >
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.35s both' }}
          >
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pr-10"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {/* Forgot Password Link */}
            <div className="text-right mt-2">
              <button 
                type="button"
                onClick={() => {
                  // TODO: Implement forgot password
                  alert("Forgot password functionality coming soon!")
                }}
                className="text-[14px] text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="text-red-500 text-[14px] font-medium text-center"
              style={{ animation: 'fadeInUp 0.3s ease-out both' }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.45s both' }}
          >
            <Button 
              type="submit"
              variant="primary"
              disabled={!isFormValid() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>

        {/* Sign Up Link */}
        <div 
          className="text-center mt-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
        >
          <p className="text-[14px] text-foreground/60">
            Don't have an account?{' '}
            <button 
              type="button"
              onClick={() => router.push('/sign-up')}
              className="text-foreground font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            >
              Create account
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}