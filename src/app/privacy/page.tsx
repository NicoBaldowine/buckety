"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  return (
    <ProtectedRoute>
      <PrivacyContent />
    </ProtectedRoute>
  )
}

function PrivacyContent() {
  const router = useRouter()

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
            Privacy Policy
          </h1>
          <p className="text-foreground/60 text-[16px] leading-relaxed">
            How we collect, use, and protect your information
          </p>
        </div>

        {/* Content */}
        <div 
          className="bg-card rounded-2xl p-6 mb-6 space-y-6"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Information We Collect
            </h2>
            <p className="text-foreground/70">
              We collect information you provide when creating an account, including 
              your email address and savings bucket data. All financial information 
              is stored securely and encrypted.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              How We Use Your Information
            </h2>
            <p className="text-foreground/70">
              Your information is used to provide and improve our services, 
              sync your data across devices, and send you important updates 
              about your account and savings goals.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Data Security
            </h2>
            <p className="text-foreground/70">
              We implement industry-standard security measures to protect your 
              personal information. Your data is encrypted both in transit and at rest.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Your Rights
            </h2>
            <p className="text-foreground/70">
              You have the right to access, update, or delete your personal information. 
              You can also export your data or close your account at any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Contact Us
            </h2>
            <p className="text-foreground/70">
              If you have questions about this Privacy Policy, please contact us 
              at privacy@buckety.app.
            </p>
          </div>
        </div>

        {/* Placeholder note */}
        <div 
          className="text-center text-foreground/50 text-sm"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
        >
          <p>This is a placeholder page. Complete privacy policy coming soon!</p>
        </div>

      </div>
    </div>
  )
}