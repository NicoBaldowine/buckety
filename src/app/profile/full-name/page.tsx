"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { authService } from "@/lib/auth"

export default function FullNamePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState("")

  useEffect(() => {
    if (user) {
      // Check localStorage first for the most recent name
      const savedProfile = localStorage.getItem(`profile_${user.id}`)
      if (savedProfile) {
        try {
          const profileData = JSON.parse(savedProfile)
          setName(profileData.name || user.name || "")
        } catch {
          setName(user.name || "")
        }
      } else {
        setName(user.name || "")
      }
    }
  }, [user])

  const handleSave = () => {
    if (!name.trim()) return

    // Save to localStorage immediately
    if (user?.id) {
      const profileData = {
        name: name.trim(),
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData))
    }
    
    // Update database in background (fire and forget)
    authService.updateUserProfile({ name: name.trim() }).catch(error => {
      console.error("Background save error:", error)
    })
    
    // Navigate back immediately
    router.push('/profile')
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
          className="mb-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-extrabold text-foreground"
            style={{ letterSpacing: '-0.05em' }}
          >
            Full name
          </h1>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name Field */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
          >
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              maxLength={100}
            />
          </div>

          {/* Save Button */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
          >
            <Button 
              variant="primary"
              disabled={!name.trim() || name.trim() === (user?.name || "")}
              className="w-full"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}