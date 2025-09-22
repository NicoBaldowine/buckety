"use client"

import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TabBar } from "@/components/ui/tab-bar"
import { useAuth } from "@/contexts/auth-context"

export default function ReferPage() {
  return (
    <ProtectedRoute>
      <ReferContent />
    </ProtectedRoute>
  )
}

function ReferContent() {
  const { user } = useAuth()
  
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || 
                     "U"
  
  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-4"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <div></div> {/* Empty div for spacing */}
          <AvatarDropdown initial={userInitial} />
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
            Refer a Friend
          </h1>
        </div>

        {/* Content placeholder */}
        <div 
          className="text-center py-20"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <p className="text-foreground/60 text-[16px]">
            Share Buckety with friends and earn rewards
          </p>
        </div>

        {/* Add bottom padding to account for tab bar */}
        <div className="h-20"></div>
      </div>

      {/* Tab Bar Navigation */}
      <TabBar />
    </div>
  )
}