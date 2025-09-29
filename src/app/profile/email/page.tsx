"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export default function EmailPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setEmail(user.email || "")
    }
  }, [user])

  const handleSave = async () => {
    if (!email.trim() || !isValidEmail(email)) return

    setIsSaving(true)
    
    try {
      // Save email to localStorage for now
      // In production, this would update the user profile in the database
      const profileData = {
        email: email.trim(),
        updatedAt: new Date().toISOString()
      }
      
      if (user?.id) {
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData))
      }
      
      // Navigate back to profile
      router.push('/profile')
    } catch (error) {
      console.error("Error saving email:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isEmailChanged = email.trim() !== (user?.email || "")

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
          className="mb-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-extrabold text-foreground"
            style={{ letterSpacing: '-0.05em' }}
          >
            Email
          </h1>
        </div>

        {/* Form */}
        <div className="space-y-6">
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
              autoComplete="email"
            />
          </div>

          {/* Save Button */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
          >
            <Button 
              variant="primary"
              disabled={!email.trim() || !isValidEmail(email) || isSaving || !isEmailChanged}
              className="w-full"
              onClick={handleSave}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}