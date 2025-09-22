"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { useState, useRef, useEffect } from "react"
import { authService } from "@/lib/auth"
import Image from "next/image"

interface EmailVerificationProps {
  email: string
  onVerified: () => void
  onResend: () => void
}

export function EmailVerification({ email, onVerified, onResend }: EmailVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    
    if (!/^\d+$/.test(pastedData)) return

    const newCode = [...code]
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i]
    }
    setCode(newCode)

    // Focus next empty input or last input
    const nextEmptyIndex = newCode.findIndex(c => c === "")
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const verificationCode = code.join("")
    
    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      console.log('🔍 Starting OTP verification for:', { email, code: verificationCode })
      const result = await authService.verifyOTP(email, verificationCode)
      console.log('🔍 OTP verification result:', result)
      
      if (result.success) {
        console.log('✅ OTP verification successful, calling onVerified()')
        onVerified()
      } else {
        console.log('❌ OTP verification failed:', result.error)
        setError(result.error || "Invalid verification code")
      }
    } catch (error) {
      console.error('💥 Verification error:', error)
      setError("Failed to verify code. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError("")
    
    try {
      await onResend()
    } catch (error) {
      setError("Failed to resend code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const isCodeComplete = code.every(digit => digit !== "")

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[520px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3 min-h-screen flex items-center">
        <div className="w-full">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <div className="relative w-48 h-16">
              <Image 
                src="/zuma-dark.svg" 
                alt="Zuma Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          
          {/* Header */}
          <div 
            className="text-center mb-10"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}
          >
            <h1 
              className="text-[32px] font-semibold text-foreground mb-4"
              style={{ letterSpacing: '-0.03em' }}
            >
              Check your email
            </h1>
            <p className="text-[16px] text-foreground/60">
              We sent a 6-digit code to <br />
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          {/* Code Input */}
          <div 
            className="mb-8"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
          >
            <Label className="text-center block mb-4">Verification code</Label>
            <div className="flex justify-center gap-3 mb-4">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl font-semibold"
                  style={{ letterSpacing: '0.1em' }}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="text-red-500 text-[14px] font-medium text-center mb-6"
              style={{ animation: 'fadeInUp 0.3s ease-out both' }}
            >
              {error}
            </div>
          )}

          {/* Verify Button */}
          <div 
            className="mb-6"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
          >
            <Button
              onClick={handleVerify}
              disabled={!isCodeComplete || isVerifying}
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Verify code'}
            </Button>
          </div>

          {/* Resend Code */}
          <div 
            className="text-center"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
          >
            <p className="text-[14px] text-foreground/60 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-[14px] text-foreground underline hover:no-underline disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}