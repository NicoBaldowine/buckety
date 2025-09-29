"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function FeedbackPage() {
  return (
    <ProtectedRoute>
      <FeedbackContent />
    </ProtectedRoute>
  )
}

function FeedbackContent() {
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
            Give feedback
          </h1>
          <p className="text-foreground/60 text-[16px] leading-relaxed">
            Help us improve Buckety by sharing your thoughts and suggestions
          </p>
        </div>

        {/* Content */}
        <div 
          className="bg-card rounded-2xl p-6 mb-6"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">
            We'd love to hear from you!
          </h2>
          <p className="text-foreground/70 mb-6">
            Your feedback helps us make Buckety better for everyone. Whether it's a bug report, 
            feature request, or general suggestion, we appreciate your input.
          </p>
          
          <div className="space-y-4">
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => window.open('mailto:feedback@buckety.app?subject=Buckety Feedback', '_blank')}
            >
              Send Email Feedback
            </Button>
            
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => window.open('https://github.com/buckety/feedback/issues', '_blank')}
            >
              Report on GitHub
            </Button>
          </div>
        </div>

        {/* Placeholder note */}
        <div 
          className="text-center text-foreground/50 text-sm"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
        >
          <p>This is a placeholder page. Real feedback system coming soon!</p>
        </div>

      </div>
    </div>
  )
}