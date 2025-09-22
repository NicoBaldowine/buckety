"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { EmailVerification } from "@/components/auth/email-verification"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  
  // Detect current theme
  useEffect(() => {
    const detectTheme = () => {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (savedTheme) {
        setCurrentTheme(savedTheme)
      } else {
        // Use system theme
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        setCurrentTheme(systemTheme)
      }
    }
    
    detectTheme()
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const savedTheme = localStorage.getItem("theme")
      if (!savedTheme) {
        setCurrentTheme(mediaQuery.matches ? "dark" : "light")
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const validatePassword = (password: string): string => {
    const errors = []
    
    if (password.length < 8) {
      errors.push("at least 8 characters")
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("one lowercase letter")
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("one uppercase letter")
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("one number")
    }
    
    if (errors.length === 0) return ""
    
    return `Password must contain ${errors.join(", ")}`
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    
    if (newPassword) {
      const error = validatePassword(newPassword)
      setPasswordError(error)
    } else {
      setPasswordError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    // Validate password before submitting
    const passwordValidationError = validatePassword(password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      return
    }

    setIsSubmitting(true)
    setError("")
    setPasswordError("")

    const result = await authService.signUp(email, password, name)
    
    if (result.success) {
      // Check if email verification is required
      if (result.session) {
        // User is automatically signed in - redirect to onboarding for new users
        router.push('/onboarding')
      } else {
        // Email verification required - show OTP verification screen
        setShowEmailVerification(true)
      }
    } else {
      setError(result.error || "Failed to create account")
    }

    setIsSubmitting(false)
  }

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true)
    setError("")
    
    try {
      const result = await authService.signInWithGoogle()
      if (result.success) {
        console.log('Google sign up successful')
        // Google auth redirects automatically
      } else {
        setError(result.error || "Failed to sign up with Google")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error during Google sign up:', error)
      setError("Failed to sign up with Google")
      setIsSubmitting(false)
    }
  }

  const handleVerificationComplete = () => {
    // User has successfully verified their email - redirect to onboarding
    router.push('/onboarding')
  }

  const handleResendCode = async () => {
    if (!email || !password) return
    
    try {
      // Call sign up again to resend verification code
      const result = await authService.signUp(email, password, name)
      if (!result.success) {
        throw new Error(result.error || "Failed to resend code")
      }
    } catch (error) {
      console.error('Error resending code:', error)
      throw error // Let EmailVerification component handle the error display
    }
  }

  const isFormValid = () => {
    return email && password && password.length >= 6
  }

  // Show email verification screen if needed
  if (showEmailVerification) {
    return (
      <EmailVerification
        email={email}
        onVerified={handleVerificationComplete}
        onResend={handleResendCode}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[520px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3 min-h-screen flex items-center">
        <div className="w-full">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <Link href="/" className="relative w-48 h-16 cursor-pointer hover:opacity-80 transition-opacity">
              <Image 
                src={currentTheme === 'light' ? "/zuma-light.svg" : "/zuma-dark.svg"}
                alt="Zuma Logo" 
                fill
                className="object-contain"
                priority
              />
            </Link>
          </div>
          
          {/* Header */}
          <div 
            className="text-center mb-10"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}
          >
            <h1 
              className="text-[32px] font-extrabold text-foreground"
              style={{ letterSpacing: '-0.05em' }}
            >
              Create account
            </h1>
          </div>

          {/* Google Sign Up Button */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.15s both' }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={handleGoogleSignUp}
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
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name Field */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.25s both' }}
          >
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
            />
          </div>

          {/* Email Field */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.35s both' }}
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
            style={{ animation: 'fadeInUp 0.5s ease-out 0.45s both' }}
          >
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Create a password"
                className="pr-10"
                required
                autoComplete="new-password"
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
            {/* Password Error */}
            {passwordError && (
              <div className="text-red-500 text-[14px] mt-2">
                {passwordError}
              </div>
            )}
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
            style={{ animation: 'fadeInUp 0.5s ease-out 0.55s both' }}
          >
            <Button 
              type="submit"
              variant="primary"
              disabled={!isFormValid() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <div 
          className="text-center mt-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.6s both' }}
        >
          <p className="text-[14px] text-foreground/60">
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => router.push('/login')}
              className="text-foreground font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}