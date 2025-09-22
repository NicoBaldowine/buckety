"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { authService } from "@/lib/auth"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showVerification, setShowVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError("Please enter your email")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const result = await authService.requestPasswordReset(email)
      
      if (result.success) {
        setShowVerification(true)
        // Store email for verification step
        sessionStorage.setItem('reset_email', email)
      } else {
        setError(result.error || "Failed to send reset email")
      }
    } catch (error) {
      console.error('Error requesting password reset:', error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const result = await authService.verifyPasswordResetOTP(email, verificationCode)
      
      if (result.success) {
        // Store session for password update
        if (result.session) {
          sessionStorage.setItem('reset_session', JSON.stringify(result.session))
        }
        router.push('/reset-password')
      } else {
        setError(result.error || "Invalid verification code")
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setIsSubmitting(true)
    setError("")
    
    try {
      const result = await authService.requestPasswordReset(email)
      
      if (result.success) {
        setError("") // Clear any errors
        alert("A new verification code has been sent to your email")
      } else {
        setError(result.error || "Failed to resend code")
      }
    } catch (error) {
      console.error('Error resending code:', error)
      setError("Failed to resend code. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show verification screen
  if (showVerification) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[520px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
          {/* Header with back button */}
          <div 
            className="flex items-center justify-between mb-6"
            style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
          >
            <Button 
              variant="secondary-icon" 
              icon={<ArrowLeft />} 
              onClick={() => setShowVerification(false)}
            />
            <div></div> {/* Empty div for spacing */}
          </div>

          {/* Header */}
          <div 
            className="mb-10"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
          >
            <h1 
              className="text-[32px] font-extrabold text-foreground"
              style={{ letterSpacing: '-0.05em' }}
            >
              Check your email
            </h1>
            <p className="text-foreground/60 mt-2">
              We sent a verification code to {email}
            </p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerification} className="space-y-6">
            <div 
              style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
            >
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                required
                autoComplete="one-time-code"
                className="text-center text-xl font-mono tracking-wider"
              />
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
                disabled={isSubmitting || verificationCode.length !== 6}
                className="w-full"
              >
                {isSubmitting ? 'Verifying...' : 'Verify code'}
              </Button>
            </div>

            {/* Resend Link */}
            <div 
              className="text-center"
              style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
            >
              <p className="text-[14px] text-foreground/60">
                Didn't receive a code?{' '}
                <button 
                  type="button"
                  onClick={handleResend}
                  disabled={isSubmitting}
                  className="text-foreground font-semibold hover:opacity-80 transition-opacity"
                >
                  Resend
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Show email input screen
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[520px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header with back button */}
        <div 
          className="flex items-center justify-between mb-6"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon" 
            icon={<ArrowLeft />} 
            onClick={() => router.push('/login')}
          />
          <div></div> {/* Empty div for spacing */}
        </div>

        {/* Header */}
        <div 
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-extrabold text-foreground"
            style={{ letterSpacing: '-0.05em' }}
          >
            Reset password
          </h1>
          <p className="text-foreground/60 mt-2">
            Enter your email and we'll send you a verification code
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
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
              disabled={!email || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Sending...' : 'Send verification code'}
            </Button>
          </div>
        </form>

        {/* Back to login link */}
        <div 
          className="text-center mt-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
        >
          <p className="text-[14px] text-foreground/60">
            Remember your password?{' '}
            <button 
              type="button"
              onClick={() => router.push('/login')}
              className="text-foreground font-semibold hover:opacity-80 transition-opacity"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}