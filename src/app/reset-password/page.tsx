"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, Check, X } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  
  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false
  })
  
  // Detect current theme
  useEffect(() => {
    const detectTheme = () => {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (savedTheme) {
        setCurrentTheme(savedTheme)
      } else {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        setCurrentTheme(systemTheme)
      }
    }
    
    detectTheme()
    
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

  // Check if user is authorized to reset password
  useEffect(() => {
    const resetSession = sessionStorage.getItem('reset_session')
    const resetEmail = sessionStorage.getItem('reset_email')
    
    if (!resetSession && !resetEmail) {
      // No reset session, redirect to forgot password
      router.push('/forgot-password')
    }
  }, [router])

  const validatePassword = (pass: string, confirmPass: string) => {
    const validation = {
      minLength: pass.length >= 8,
      hasUppercase: /[A-Z]/.test(pass),
      hasLowercase: /[a-z]/.test(pass),
      hasNumber: /\d/.test(pass),
      hasSpecial: /[!@#$%^&*]/.test(pass),
      passwordsMatch: pass === confirmPass && confirmPass.length > 0
    }
    
    setPasswordValidation(validation)
    
    // Check if all requirements are met
    const allRequirementsMet = validation.minLength && 
                               validation.hasUppercase && 
                               validation.hasLowercase && 
                               validation.hasNumber && 
                               validation.hasSpecial
    
    if (!allRequirementsMet && pass.length > 0) {
      setPasswordError("Password must meet all requirements")
    } else if (confirmPass && pass !== confirmPass) {
      setPasswordError("Passwords do not match")
    } else {
      setPasswordError("")
    }
    
    return allRequirementsMet && validation.passwordsMatch
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    validatePassword(newPassword, confirmPassword)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value
    setConfirmPassword(newConfirmPassword)
    validatePassword(password, newConfirmPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePassword(password, confirmPassword)) {
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const result = await authService.updatePassword(password)
      
      if (result.success) {
        // Clear reset session
        sessionStorage.removeItem('reset_session')
        sessionStorage.removeItem('reset_email')
        
        alert("Password updated successfully! Please sign in with your new password.")
        router.push('/login')
      } else {
        setError(result.error || "Failed to update password")
      }
    } catch (error) {
      console.error('Error updating password:', error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return password && 
           confirmPassword && 
           password === confirmPassword &&
           passwordValidation.minLength &&
           passwordValidation.hasUppercase &&
           passwordValidation.hasLowercase &&
           passwordValidation.hasNumber &&
           passwordValidation.hasSpecial
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
              Create new password
            </h1>
            <p className="text-foreground/60 mt-2">
              Choose a strong password for your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div 
              style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
            >
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Password Requirements */}
              <div className="mt-3 space-y-1">
                <div className={`flex items-center gap-2 text-[12px] ${passwordValidation.minLength ? 'text-green-500' : 'text-foreground/50'}`}>
                  {passwordValidation.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-2 text-[12px] ${passwordValidation.hasUppercase ? 'text-green-500' : 'text-foreground/50'}`}>
                  {passwordValidation.hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One uppercase letter
                </div>
                <div className={`flex items-center gap-2 text-[12px] ${passwordValidation.hasLowercase ? 'text-green-500' : 'text-foreground/50'}`}>
                  {passwordValidation.hasLowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One lowercase letter
                </div>
                <div className={`flex items-center gap-2 text-[12px] ${passwordValidation.hasNumber ? 'text-green-500' : 'text-foreground/50'}`}>
                  {passwordValidation.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One number
                </div>
                <div className={`flex items-center gap-2 text-[12px] ${passwordValidation.hasSpecial ? 'text-green-500' : 'text-foreground/50'}`}>
                  {passwordValidation.hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One special character (!@#$%^&*)
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div 
              style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
            >
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm new password"
                  className="pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && (
                <div className={`mt-2 text-[12px] ${passwordValidation.passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                  {passwordValidation.passwordsMatch ? (
                    <div className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      Passwords match
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <X className="h-3 w-3" />
                      Passwords do not match
                    </div>
                  )}
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
              style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
            >
              <Button 
                type="submit"
                variant="primary"
                disabled={!isFormValid() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Updating...' : 'Update password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}