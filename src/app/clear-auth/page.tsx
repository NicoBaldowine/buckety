"use client"

import { Button } from "@/components/ui/button"
import { clearAllAuthData } from "@/lib/clear-auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ClearAuthPage() {
  const router = useRouter()
  const [cleared, setCleared] = useState(false)
  
  const handleClearAuth = () => {
    clearAllAuthData()
    setCleared(true)
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-secondary rounded-[24px] p-8 text-center">
          <h1 className="text-[24px] font-semibold text-foreground mb-4">
            Authentication Issue?
          </h1>
          
          {!cleared ? (
            <>
              <p className="text-[14px] text-foreground/60 mb-6">
                If you&apos;re experiencing authentication errors or can&apos;t sign in, 
                you can clear your authentication data and start fresh.
              </p>
              
              <Button 
                variant="primary"
                onClick={handleClearAuth}
                className="w-full"
              >
                Clear Authentication & Start Fresh
              </Button>
              
              <p className="text-[12px] text-foreground/40 mt-4">
                This will log you out and clear all stored authentication data.
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] text-foreground/60 mb-6">
                ✓ Authentication data cleared successfully!
              </p>
              <p className="text-[14px] text-foreground/60">
                Redirecting to login page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}