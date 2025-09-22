"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft, Check, Link2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { HybridStorage } from "@/lib/hybrid-storage"

const BUCKET_COLORS = [
  // Greens
  { name: "Light Green", value: "#B6F3AD" },
  { name: "Mint Green", value: "#99FFCC" },
  { name: "Sage Green", value: "#96CEB4" },
  { name: "Teal", value: "#4ECDC4" },
  // Purples & Blues
  { name: "Light Purple", value: "#BFB0FF" },
  { name: "Lavender", value: "#CC99FF" },
  { name: "Light Blue", value: "#A3D5FF" },
  { name: "Sky Blue", value: "#99CCFF" },
  { name: "Blue", value: "#54A0FF" },
  { name: "Ocean Blue", value: "#45B7D1" },
  // Oranges & Yellows
  { name: "Peach", value: "#FDB86A" },
  { name: "Orange", value: "#FFB366" },
  { name: "Light Orange", value: "#FFCC99" },
  { name: "Yellow", value: "#FFE066" },
  { name: "Golden", value: "#FECA57" },
  { name: "Gold", value: "#FFD700" },
  // Pinks & Reds
  { name: "Pink", value: "#FF97D0" },
  { name: "Light Pink", value: "#FF9FF3" },
  { name: "Light Red", value: "#FF9999" },
  { name: "Red", value: "#FF6B6B" },
  // Grays & Neutrals
  { name: "Light Gray", value: "#E5E7EB" },
  { name: "Medium Gray", value: "#9CA3AF" },
  { name: "Dark Gray", value: "#4B5563" }
]

const WHY_ZUMA_OPTIONS = [
  { title: "Save for specific goals" },
  { title: "Better spending control" },
  { title: "Access exclusive discounts" },
  { title: "Organize my finances" },
  { title: "Get saving reports" },
]


export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [bucketName, setBucketName] = useState("")
  const [bucketTarget, setBucketTarget] = useState("")
  const [bucketColor, setBucketColor] = useState(BUCKET_COLORS[0].value)
  const [isCreatingBucket, setIsCreatingBucket] = useState(false)
  const [bankConnected, setBankConnected] = useState(false)
  const [isCheckingUserStatus, setIsCheckingUserStatus] = useState(true)

  // Check if user should see onboarding
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user?.id) {
        setIsCheckingUserStatus(false)
        return
      }

      try {
        // Check if this is from email confirmation
        const urlParams = new URLSearchParams(window.location.search)
        const isFromEmailConfirmation = urlParams.get('from') === 'email_confirmation'
        
        // FIRST: Quick check localStorage for immediate response
        const userBuckets = HybridStorage.getLocalBuckets(user.id)
        const hasBucketsLocally = userBuckets && userBuckets.length > 0
        const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`)
        
        // If user has buckets locally and NOT from email confirmation -> redirect immediately
        if (hasBucketsLocally && !isFromEmailConfirmation) {
          console.log('🚀 Quick redirect: User has buckets locally - going to home')
          router.replace('/home')
          return
        }
        
        // If user completed onboarding and has local buckets -> redirect immediately  
        if (hasCompletedOnboarding === 'true' && hasBucketsLocally) {
          console.log('🚀 Quick redirect: User completed onboarding with buckets - going to home')
          router.replace('/home')
          return
        }
        
        // SECOND: Check database for definitive answer
        let hasBucketsInDB = false
        try {
          const dbBuckets = await HybridStorage.getAllBuckets(user.id)
          hasBucketsInDB = dbBuckets && dbBuckets.length > 0
        } catch (error) {
          console.warn('Could not check database buckets:', error)
          hasBucketsInDB = false
        }
        
        const hasBuckets = hasBucketsInDB || hasBucketsLocally
        
        console.log('🎯 Onboarding check:', {
          hasBucketsInDB,
          hasBucketsLocally,
          hasBuckets,
          hasCompletedOnboarding,
          isFromEmailConfirmation,
          userId: user.id
        })
        
        // If user has buckets in database -> redirect to home
        if (hasBucketsInDB) {
          console.log('User has buckets in database - existing user, redirecting to home')
          router.replace('/home')
          return
        }
        
        // If user came from email confirmation but already has buckets -> redirect to home
        if (isFromEmailConfirmation && hasBuckets) {
          console.log('User came from email confirmation but already has buckets - redirecting to home')
          router.replace('/home')
          return
        }
        
        // If user came from email confirmation and has no buckets -> show onboarding
        if (isFromEmailConfirmation && !hasBuckets) {
          console.log('User came from email confirmation and has no buckets - showing onboarding')
          localStorage.removeItem(`onboarding_completed_${user.id}`)
          setIsCheckingUserStatus(false)
          return
        }
        
        // If user has completed onboarding but has no buckets -> show onboarding
        if (hasCompletedOnboarding === 'true' && !hasBuckets) {
          console.log('User completed onboarding but has no buckets - showing onboarding again')
          localStorage.removeItem(`onboarding_completed_${user.id}`)
          setIsCheckingUserStatus(false)
          return
        }
        
        // If we get here, user needs onboarding
        console.log('User needs onboarding - staying on onboarding page')
        setIsCheckingUserStatus(false)
        
      } catch (error) {
        console.error('Error checking user status:', error)
        setIsCheckingUserStatus(false)
      }
    }
    
    checkUserStatus()
  }, [user, router])

  const handleReasonToggle = (title: string) => {
    setSelectedReasons(prev => 
      prev.includes(title) 
        ? prev.filter(r => r !== title)
        : [...prev, title]
    )
  }


  const handleConnectBank = () => {
    // Simulate bank connection (in real app, would integrate with Plaid)
    setBankConnected(true)
    alert("Bank connection would be handled by Plaid integration here. For demo purposes, marking as connected.")
  }

  const handleCreateBucket = async () => {
    if (!bucketName || !bucketTarget) return

    setIsCreatingBucket(true)
    try {
      // Create bucket using HybridStorage
      const bucketId = await HybridStorage.createBucket(
        bucketName,
        parseFloat(bucketTarget),
        bucketColor,
        user?.id
      )
      
      if (!bucketId) {
        alert('Failed to create bucket. Please try again.')
        setIsCreatingBucket(false)
        return
      }

      // HybridStorage.createBucket already handles database creation
      console.log('✅ Bucket created successfully:', { bucketId, bucketName })

      // Mark onboarding as completed
      if (user?.id) {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true')
        localStorage.setItem(`user_reasons_${user.id}`, JSON.stringify(selectedReasons))
        localStorage.setItem(`bank_connected_${user.id}`, bankConnected.toString())
      }

      // Navigate to home
      router.push('/home')
    } catch (error) {
      console.error('Error creating bucket:', error)
      alert('Failed to create bucket. Please try again.')
    } finally {
      setIsCreatingBucket(false)
    }
  }

  const canContinueStep1 = selectedReasons.length > 0
  const canContinueStep3 = bucketName && bucketTarget

  // Show loading screen while checking user status
  if (isCheckingUserStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-foreground/60 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3 min-h-screen flex flex-col">
        
        {/* Header with user initial */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {currentStep > 1 && (
              <Button 
                variant="secondary-icon" 
                icon={<ArrowLeft />}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              />
            )}
          </div>
          <Button 
            variant="avatar" 
            initial={user?.email?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'} 
          />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-foreground/10 rounded-full h-1 mb-12">
          <div 
            className="bg-foreground rounded-full h-1 transition-all duration-500"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Step 1: Why are you using Zuma? */}
        {currentStep === 1 && (
          <div className="flex-1 flex flex-col" style={{ animation: 'fadeIn 0.3s ease-out both' }}>
            <div className="mb-8">
              <h1 className="text-[32px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                Why are you using Zuma?
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              {WHY_ZUMA_OPTIONS.map((option) => (
                <button
                  key={option.title}
                  onClick={() => handleReasonToggle(option.title)}
                  className={`px-4 py-3 rounded-full border transition-all text-sm font-medium ${
                    selectedReasons.includes(option.title)
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-foreground/30 text-foreground hover:border-foreground/60'
                  }`}
                >
                  {option.title}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-4 mt-12">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto"
              >
                Skip
              </Button>
              
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!canContinueStep1}
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Link your account */}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col" style={{ animation: 'fadeIn 0.3s ease-out both' }}>
            <div className="mb-8">
              {bankConnected ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-6 w-6 text-green-500" />
                    <span className="text-[18px] font-semibold text-foreground">Account Connected</span>
                  </div>
                  <p className="text-[14px] text-foreground/60 mb-8">
                    Your bank account has been successfully linked.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-[32px] font-semibold text-foreground mb-4" style={{ letterSpacing: '-0.03em' }}>
                    Connect your bank account
                  </h3>
                  <p className="text-[16px] text-foreground/60 mb-8">
                    We use Plaid to securely connect to your bank account. This creates a mirror of your account so you can see your balance and move money between your buckets.
                  </p>
                </div>
              )}
              
              {/* Illustration placeholder */}
              <div className="w-full h-48 bg-foreground/5 rounded-2xl border border-foreground/10 flex items-center justify-center mb-12">
                <span className="text-foreground/30 text-sm">Illustration placeholder</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(3)}
                className="w-full sm:w-auto"
              >
                Skip
              </Button>
              
              {!bankConnected && (
                <Button
                  onClick={handleConnectBank}
                  className="w-full sm:w-auto"
                  icon={<Link2 />}
                >
                  Connect Bank Account
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Create your first bucket */}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col" style={{ animation: 'fadeIn 0.3s ease-out both' }}>
            <div className="mb-8">
              <h1 className="text-[32px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                Create your first bucket
              </h1>
            </div>

            {/* Custom bucket form */}
            <div className="space-y-8">
              <div>
                <Label htmlFor="bucketName">Bucket name</Label>
                <Input
                  id="bucketName"
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
                  placeholder="e.g. Emergency Fund"
                />
              </div>

              <div>
                <Label htmlFor="bucketTarget">Target amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/60">$</span>
                  <Input
                    id="bucketTarget"
                    type="number"
                    value={bucketTarget}
                    onChange={(e) => setBucketTarget(e.target.value)}
                    placeholder="2000"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Bucket color</Label>
                  <span className="text-[14px] font-medium text-foreground/50" style={{ letterSpacing: '-0.03em' }}>
                    {BUCKET_COLORS.find(color => color.value === bucketColor)?.name || ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {BUCKET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        bucketColor === color.value
                          ? 'border-foreground border-3'
                          : 'border-foreground/20'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setBucketColor(color.value)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-12">
              <Button
                onClick={handleCreateBucket}
                disabled={!canContinueStep3 || isCreatingBucket}
                className="w-full sm:w-auto"
              >
  {isCreatingBucket ? 'Creating bucket...' : 'Get started'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}