"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"

function VerifyPromptContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const type = searchParams.get('type') // 'email' or 'password'
  
  const handleContinue = () => {
    // Navigate to the actual verification page
    router.push(`/profile/verify?type=${type}`)
  }
  
  const getTitle = () => {
    if (type === 'email') return 'Verify to change email'
    if (type === 'password') return 'Verify to change password'
    return 'Verify your identity'
  }
  
  const getDescription = () => {
    const userEmail = user?.email || 'your email'
    if (type === 'email') {
      return (
        <>
          For your security, we need to verify your current email address{' '}
          <span className="font-semibold text-foreground">{userEmail}</span>{' '}
          before you can change it to a new one.
        </>
      )
    }
    if (type === 'password') {
      return (
        <>
          For your security, we need to verify your identity by sending a code to{' '}
          <span className="font-semibold text-foreground">{userEmail}</span>{' '}
          before you can change your password.
        </>
      )
    }
    return 'We need to verify your identity before making changes to your account.'
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
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-extrabold text-foreground mb-3"
            style={{ letterSpacing: '-0.05em' }}
          >
            {getTitle()}
          </h1>
          <p className="text-foreground/60 text-[16px] leading-relaxed">
            {getDescription()}
          </p>
        </div>

        {/* Continue Button */}
        <div 
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <Button 
            variant="primary"
            className="w-full"
            onClick={handleContinue}
          >
            Send verification code
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPromptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPromptContent />
    </Suspense>
  )
}