"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"
import { useAuth } from "@/contexts/auth-context"

export default function CreateBucketPage() {
  return (
    <ProtectedRoute>
      <CreateBucketContent />
    </ProtectedRoute>
  )
}

function CreateBucketContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [bucketName, setBucketName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [selectedColor, setSelectedColor] = useState("#B6F3AD")

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
    { color: "#FF6B6B", name: "Red" }
  ]

  const getSelectedColorName = () => {
    const selected = colorOptions.find(option => option.color === selectedColor)
    return selected ? selected.name : ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 Starting bucket creation...', {
      bucketName,
      targetAmount,
      selectedColor,
      user: user?.id,
      parsedAmount: parseFloat(targetAmount.replace(/,/g, ''))
    })
    
    // Handle demo mode
    const isDemoMode = localStorage.getItem('demo_mode') === 'true'
    const effectiveUser = user || (isDemoMode ? JSON.parse(localStorage.getItem('demo_user') || '{}') : null)
    
    if (!effectiveUser?.id) {
      console.error('❌ User not authenticated')
      alert('Please log in to create a bucket.')
      return
    }
    
    console.log('👤 Using user:', effectiveUser.id, 'Demo mode:', isDemoMode)
    
    if (!bucketName.trim()) {
      console.error('❌ Bucket name is empty')
      alert('Please enter a bucket name.')
      return
    }
    
    const parsedAmount = parseFloat(targetAmount.replace(/,/g, ''))
    if (!parsedAmount || parsedAmount <= 0) {
      console.error('❌ Invalid target amount:', parsedAmount)
      alert('Please enter a valid target amount.')
      return
    }
    
    try {
      // Create bucket using hybrid storage (localStorage + database + activity logging)
      console.log('📝 Creating bucket with data:', {
        title: bucketName,
        targetAmount: parsedAmount,
        backgroundColor: selectedColor,
        apy: 3.5,
        userId: effectiveUser.id
      })
      
      // For demo mode, create bucket in localStorage only
      if (isDemoMode) {
        const buckets = HybridStorage.getLocalBuckets(effectiveUser.id)
        const newBucket = {
          id: `bucket-${Date.now()}`,
          title: bucketName,
          currentAmount: 0,
          targetAmount: parsedAmount,
          backgroundColor: selectedColor,
          apy: 3.5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        buckets.push(newBucket)
        localStorage.setItem(`buckets_${effectiveUser.id}`, JSON.stringify(buckets))
        
        console.log('✅ Bucket created successfully in demo mode:', bucketName)
        router.push('/home')
      } else {
        const bucketId = await HybridStorage.createBucket({
          title: bucketName,
          targetAmount: parsedAmount,
          backgroundColor: selectedColor,
          apy: 3.5 // Default APY for new buckets
        }, effectiveUser.id)
        
        if (bucketId) {
          console.log('✅ Bucket created successfully:', bucketName, 'with ID:', bucketId)
          // Navigate to home to see the new bucket
          router.push('/home')
        } else {
          console.error('❌ Failed to create bucket - no ID returned')
          alert('Failed to create bucket. Please try again.')
        }
      }
    } catch (error) {
      console.error('❌ Error creating bucket:', error)
      alert('An error occurred while creating the bucket. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header with back button */}
        <div 
          className="flex items-center justify-between mb-15"
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
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[40px] font-semibold text-foreground"
            style={{ letterSpacing: '-0.03em' }}
          >
            Create new bucket
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

          {/* Submit Button */}
          <div 
            className="pt-6 flex justify-end"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
          >
            <Button 
              type="submit" 
              variant="primary" 
              disabled={!bucketName || !targetAmount}
              onClick={() => console.log('🔘 Create bucket button clicked!', { bucketName, targetAmount })}
            >
              Create bucket
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}