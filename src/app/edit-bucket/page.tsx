"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"
import { useAuth } from "@/contexts/auth-context"

function EditBucketContent() {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [bucketName, setBucketName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [selectedColor, setSelectedColor] = useState("#B6F3AD")

  // Get bucket data from URL parameters and populate form
  useEffect(() => {
    const title = searchParams.get('title')
    const target = searchParams.get('targetAmount')
    const backgroundColor = searchParams.get('backgroundColor')
    
    if (title) setBucketName(title)
    if (target) setTargetAmount(target)
    if (backgroundColor) setSelectedColor(backgroundColor)
  }, [searchParams])

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '')
    
    if (!numericValue) return ""
    
    // Parse as number and format with commas
    const num = parseFloat(numericValue)
    if (isNaN(num)) return ""
    
    return num.toLocaleString('en-US')
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow typing digits, decimal point, and commas
    const cleanValue = value.replace(/[^\d.]/g, '')
    setTargetAmount(cleanValue)
  }

  const handleAmountBlur = () => {
    if (targetAmount) {
      const formatted = formatAmount(targetAmount)
      setTargetAmount(formatted)
    }
  }

  const colorOptions = [
    // Greens
    { color: "#B6F3AD", name: "Light Green" },
    { color: "#99FFCC", name: "Mint Green" },
    { color: "#96CEB4", name: "Sage Green" },
    { color: "#4ECDC4", name: "Teal" },
    // Purples & Blues
    { color: "#BFB0FF", name: "Light Purple" },
    { color: "#CC99FF", name: "Lavender" },
    { color: "#A3D5FF", name: "Light Blue" },
    { color: "#99CCFF", name: "Sky Blue" },
    { color: "#54A0FF", name: "Blue" },
    { color: "#45B7D1", name: "Ocean Blue" },
    // Oranges & Yellows
    { color: "#FDB86A", name: "Peach" },
    { color: "#FFB366", name: "Orange" },
    { color: "#FFCC99", name: "Light Orange" },
    { color: "#FFE066", name: "Yellow" },
    { color: "#FECA57", name: "Golden" },
    { color: "#FFD700", name: "Gold" },
    // Pinks & Reds
    { color: "#FF97D0", name: "Pink" },
    { color: "#FF9FF3", name: "Light Pink" },
    { color: "#FF9999", name: "Light Red" },
    { color: "#FF6B6B", name: "Red" },
    // Grays & Neutrals
    { color: "#E5E7EB", name: "Light Gray" },
    { color: "#9CA3AF", name: "Medium Gray" },
    { color: "#4B5563", name: "Dark Gray" }
  ]

  const getSelectedColorName = () => {
    const selected = colorOptions.find(option => option.color === selectedColor)
    return selected ? selected.name : ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const bucketId = searchParams.get('id')
    if (!bucketId) {
      console.error('❌ No bucket ID provided')
      alert('No bucket ID provided.')
      return
    }
    
    // Handle demo mode (only on client side)
    const isDemoMode = typeof window !== 'undefined' ? localStorage.getItem('demo_mode') === 'true' : false
    const effectiveUser = user || (isDemoMode && typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('demo_user') || '{}') : null)
    
    if (!effectiveUser?.id) {
      console.error('❌ User not authenticated')
      alert('Please log in to edit bucket.')
      return
    }
    
    const parsedAmount = parseFloat(targetAmount.replace(/,/g, ''))
    if (!parsedAmount || parsedAmount <= 0) {
      console.error('❌ Invalid target amount:', parsedAmount)
      alert('Please enter a valid target amount.')
      return
    }
    
    try {
      // For demo mode, update bucket in localStorage only
      if (isDemoMode) {
        const buckets = HybridStorage.getLocalBuckets(effectiveUser.id)
        const bucketIndex = buckets.findIndex(b => b.id === bucketId)
        
        if (bucketIndex !== -1) {
          buckets[bucketIndex] = {
            ...buckets[bucketIndex],
            title: bucketName,
            targetAmount: parsedAmount,
            backgroundColor: selectedColor
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem(`buckets_${effectiveUser.id}`, JSON.stringify(buckets))
          }
          
          console.log('✅ Bucket updated successfully in demo mode:', bucketName)
          
          // Navigate to home page
          router.push('/home')
        } else {
          console.error('❌ Bucket not found in localStorage')
          alert('Bucket not found.')
        }
      } else {
        // Database first approach - update in Supabase first, then localStorage
        console.log('🚀 Updating bucket in database first:', {
          bucketId,
          title: bucketName,
          targetAmount: parsedAmount,
          backgroundColor: selectedColor
        })
        
        const { bucketService } = await import('@/lib/supabase')
        
        // Update bucket in database
        const updatedBucket = await bucketService.updateBucket(bucketId, {
          title: bucketName,
          target_amount: parsedAmount,
          background_color: selectedColor
        })
        
        if (updatedBucket) {
          console.log('✅ Bucket updated successfully in database:', updatedBucket)
          
          // Update localStorage to match database
          const buckets = HybridStorage.getLocalBuckets(effectiveUser.id)
          const bucketIndex = buckets.findIndex(b => b.id === bucketId)
          
          if (bucketIndex !== -1) {
            buckets[bucketIndex] = {
              ...buckets[bucketIndex],
              title: bucketName,
              targetAmount: parsedAmount,
              backgroundColor: selectedColor
            }
            localStorage.setItem(`buckets_${effectiveUser.id}`, JSON.stringify(buckets))
            console.log('✅ localStorage updated to match database')
          }
          
          // Navigate to home page
          router.push('/home')
        } else {
          console.error('❌ Failed to update bucket in database')
          alert('Failed to update bucket in database. Please check your connection.')
        }
      }
    } catch (error) {
      console.error('❌ Error updating bucket:', error)
      alert('An error occurred while updating the bucket. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header with back button */}
        <div 
          className="flex items-center justify-between mb-6"
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
            className="text-[32px] font-semibold text-foreground"
            style={{ letterSpacing: '-0.03em' }}
          >
            Edit bucket
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Bucket Name */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
          >
            <Label htmlFor="bucketName">Bucket name</Label>
            <Input
              id="bucketName"
              type="text"
              placeholder="Enter bucket name"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              required
            />
          </div>

          {/* Target Amount */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
          >
            <Label htmlFor="targetAmount">Target amount</Label>
            <Input
              id="targetAmount"
              type="text"
              placeholder="$0.00"
              value={targetAmount}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              required
            />
          </div>

          {/* Color Picker */}
          <div 
            style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
          >
            <div className="flex items-center justify-between mb-3">
              <Label>Bucket color</Label>
              <span className="text-[14px] font-medium text-foreground/50" style={{ letterSpacing: '-0.03em' }}>
                {getSelectedColorName()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.color}
                  type="button"
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                    selectedColor === option.color 
                      ? 'border-foreground border-3' 
                      : 'border-foreground/20'
                  }`}
                  style={{ backgroundColor: option.color }}
                  onClick={() => setSelectedColor(option.color)}
                />
              ))}
            </div>
          </div>

          {/* Submit Button - Desktop */}
          <div 
            className="pt-6 flex justify-end max-sm:hidden"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
          >
            <Button 
              type="submit" 
              variant="primary" 
              disabled={!bucketName || !targetAmount}
            >
              Save bucket
            </Button>
          </div>
        </form>
        
        {/* Add padding at bottom for mobile to account for sticky button */}
        <div className="h-24 sm:hidden"></div>
      </div>
      
      {/* Sticky Submit Button - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground/10 sm:hidden">
        <Button 
          type="submit" 
          variant="primary" 
          disabled={!bucketName || !targetAmount}
          onClick={handleSubmit}
          className="w-full"
        >
          Save bucket
        </Button>
      </div>
    </div>
  )
}

export default function EditBucketPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <EditBucketContent />
      </Suspense>
    </ProtectedRoute>
  )
}