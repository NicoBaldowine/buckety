"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight, User, Mail, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const loadProfileData = () => {
    if (user) {
      // First check localStorage for updated profile data
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
      setEmail(user.email || "")
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [user])

  // Reload data when page becomes visible (returning from edit pages)
  useEffect(() => {
    const handleFocus = () => {
      loadProfileData()
    }

    window.addEventListener('focus', handleFocus)
    // Also check when visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        loadProfileData()
      }
    })

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])



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
            onClick={() => router.push('/home')}
          />
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
            Profile
          </h1>
        </div>


        {/* Profile Settings List */}
        <div className="space-y-6">
          {/* Full Name */}
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-foreground/5 -mx-4 px-4 rounded-lg transition-colors"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
            onClick={() => router.push('/profile/full-name')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[16px] font-medium text-foreground">Full name</p>
                <p className="text-[14px] text-foreground/60">{name || "Not set"}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/40" />
          </div>

          {/* Email */}
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-foreground/5 -mx-4 px-4 rounded-lg transition-colors"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
            onClick={() => router.push('/profile/verify-prompt?type=email')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[16px] font-medium text-foreground">Email</p>
                <p className="text-[14px] text-foreground/60">{email || "Not set"}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/40" />
          </div>

          {/* Password */}
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-foreground/5 -mx-4 px-4 rounded-lg transition-colors"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
            onClick={() => router.push('/profile/verify-prompt?type=password')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[16px] font-medium text-foreground">Password</p>
                <p className="text-[14px] text-foreground/60">••••••••</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/40" />
          </div>
        </div>

      </div>
    </div>
  )
}