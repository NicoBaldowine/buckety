"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Modal } from "@/components/ui/modal"

interface PricingPlan {
  name: string
  price: string
  description: string
  features: string[]
  recommended?: boolean
  current?: boolean
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Unlimited buckets",
      "2 auto deposits",
      "Connected with Plaid"
    ],
    current: true
  },
  {
    name: "Premium",
    price: "$9.99/mo",
    description: "Maximum savings power",
    features: [
      "Unlimited buckets",
      "Unlimited auto deposits",
      "Connected with Plaid",
      "Special discounts",
      "Weekly and monthly reports"
    ],
    recommended: true
  }
]

export default function PricingPage() {
  const router = useRouter()
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.current) {
      // Do nothing - button is disabled
      return
    } else if (plan.name === "Premium") {
      setShowWaitlistModal(true)
    } else {
      alert(`Upgrade to ${plan.name} coming soon!`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-8"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon" 
            icon={<ArrowLeft />} 
            onClick={() => router.back()}
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
            Choose your plan
          </h1>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {plans.map((plan, index) => (
            <div 
              key={plan.name}
              className="relative rounded-2xl p-6 border-2 transition-all hover:scale-[1.02] flex flex-col h-full border-foreground/10 bg-background"
              style={{ animation: `fadeInUp 0.5s ease-out ${0.4 + index * 0.1}s both` }}
            >

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price.split('/')[0]}
                  </span>
                  {plan.price.includes('/mo') && (
                    <span className="text-foreground/60">
                      /mo
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.recommended ? "primary" : "secondary"}
                className="w-full mt-auto"
                onClick={() => handleSelectPlan(plan)}
                disabled={plan.current}
              >
                {plan.current ? "Current plan" : plan.name === "Premium" ? "Join waitlist" : `Get ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>

        {/* Waitlist Modal */}
        <Modal
          isOpen={showWaitlistModal}
          onClose={() => setShowWaitlistModal(false)}
          className="max-w-md"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">You've been added to the waitlist</h2>
            <p className="text-foreground/60 mb-6">
              We'll notify you when the Premium plan becomes available for users. You'll be among the first to know about our new features and special launch pricing.
            </p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setShowWaitlistModal(false)}
            >
              Got it
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}