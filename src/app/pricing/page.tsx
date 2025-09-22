"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
      "Up to 3 savings buckets",
      "Basic auto deposits",
      "Monthly reports",
      "3.5% APY on all buckets"
    ],
    current: true
  },
  {
    name: "Plus",
    price: "$4.99/mo",
    description: "For serious savers",
    features: [
      "Unlimited savings buckets",
      "Advanced auto deposits",
      "Weekly & monthly reports",
      "4.5% APY on all buckets",
      "Priority support",
      "Custom bucket themes"
    ],
    recommended: true
  },
  {
    name: "Premium",
    price: "$9.99/mo",
    description: "Maximum savings power",
    features: [
      "Everything in Plus",
      "5.5% APY on all buckets",
      "Investment recommendations",
      "Tax optimization tips",
      "Personal finance advisor",
      "Early access to features",
      "Family sharing (up to 5)"
    ]
  }
]

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const getPrice = (plan: PricingPlan) => {
    if (plan.name === "Free") return "$0"
    
    const monthlyPrice = parseFloat(plan.price.replace("$", "").replace("/mo", ""))
    if (billingCycle === 'yearly') {
      const yearlyPrice = monthlyPrice * 10 // 2 months free
      return `$${yearlyPrice.toFixed(2)}/yr`
    }
    return plan.price
  }

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.current) {
      alert("You're already on this plan!")
    } else {
      alert(`Upgrade to ${plan.name} coming soon!`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-12"
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
          className="text-center mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-extrabold text-foreground"
            style={{ letterSpacing: '-0.05em' }}
          >
            Choose your plan
          </h1>
        </div>

        {/* Billing Toggle */}
        <div 
          className="flex justify-center mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-foreground/5">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly' 
                  ? 'bg-foreground text-background' 
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'yearly' 
                  ? 'bg-foreground text-background' 
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <div 
              key={plan.name}
              className={`relative rounded-2xl p-6 border-2 transition-all hover:scale-[1.02] flex flex-col h-full ${
                plan.recommended 
                  ? 'border-foreground bg-foreground/5' 
                  : 'border-foreground/10 bg-background'
              }`}
              style={{ animation: `fadeInUp 0.5s ease-out ${0.4 + index * 0.1}s both` }}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-foreground text-background text-xs font-semibold">
                    <Sparkles className="w-3 h-3" />
                    RECOMMENDED
                  </span>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 left-6 z-10">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
                    CURRENT PLAN
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-foreground">
                    {getPrice(plan).split('/')[0]}
                  </span>
                  {plan.name !== "Free" && (
                    <span className="text-foreground/60">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/60">{plan.description}</p>
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
              >
                {plan.current ? "Current plan" : `Get ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}