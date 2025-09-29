"use client"

import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <ProtectedRoute>
      <TermsContent />
    </ProtectedRoute>
  )
}

function TermsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const userInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || "U"

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-4"
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
            className="text-[32px] font-extrabold text-foreground mb-3"
            style={{ letterSpacing: '-0.05em' }}
          >
            Terms of Service
          </h1>
          <p className="text-foreground/60 text-[16px] leading-relaxed">
            Terms and conditions for using Buckety
          </p>
        </div>

        {/* Content */}
        <div 
          className="bg-card rounded-2xl p-6 mb-6 space-y-6"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-foreground/70">
              By using Buckety, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Description of Service
            </h2>
            <p className="text-foreground/70">
              Buckety is a digital savings bucket application that helps users 
              organize and track their financial goals through virtual savings buckets.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. User Responsibilities
            </h2>
            <p className="text-foreground/70">
              Users are responsible for maintaining the confidentiality of their 
              account information and for all activities that occur under their account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Privacy
            </h2>
            <p className="text-foreground/70">
              Your privacy is important to us. Please review our Privacy Policy 
              to understand how we collect and use your information.
            </p>
          </div>
        </div>

        {/* Placeholder note */}
        <div 
          className="text-center text-foreground/50 text-sm"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
        >
          <p>This is a placeholder page. Complete terms of service coming soon!</p>
        </div>

      </div>
    </div>
  )
}