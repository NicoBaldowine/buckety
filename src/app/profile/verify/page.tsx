"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const type = searchParams.get('type') // 'email' or 'password'
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const verificationCode = code.join("")
    
    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code")
      return
    }
    
    setIsVerifying(true)
    setError("")
    
    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Navigate to the appropriate edit page
      if (type === 'email') {
        router.push('/profile/email')
      } else if (type === 'password') {
        router.push('/profile/password')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError("Invalid verification code")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setIsVerifying(true)
    setError("")
    
    try {
      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert("A new verification code has been sent to your email")
    } catch (error) {
      console.error('Error resending code:', error)
      setError("Failed to resend code. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const getTitle = () => {
    if (type === 'email') return 'Verify your email'
    if (type === 'password') return 'Verify your email'
    return 'Verify your email'
  }

  const getSubtitle = () => {
    if (type === 'email') return 'We sent a verification code to your current email before you can change it'
    if (type === 'password') return 'We sent a verification code to your email before you can change your password'
    return 'We sent a verification code to your email'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[520px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-6"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon" 
            icon={<ArrowLeft />} 
            onClick={() => router.back()}
          />
          <div></div> {/* Empty div for spacing */}
        </div>

        {/* Title */}
        <div 
          className="mb-10 text-center"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-semibold text-foreground mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            {getTitle()}
          </h1>
          <p className="text-[16px] text-foreground/60">
            {getSubtitle()}
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            className="mb-8"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
          >
            <Label className="text-center block mb-4">Verification code</Label>
            <div className="flex justify-center gap-3 mb-4">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={el => { inputRefs.current[index] = el }}
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
              disabled={isVerifying || !code.every(digit => digit !== "")}
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Verify code'}
            </Button>
          </div>

          {/* Resend Link */}
          <div 
            className="text-center"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
          >
            <p className="text-[14px] text-foreground/60 mb-2">
              Didn't receive a code?
            </p>
            <button 
              type="button"
              onClick={handleResend}
              disabled={isVerifying}
              className="text-[14px] text-foreground underline hover:no-underline disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}