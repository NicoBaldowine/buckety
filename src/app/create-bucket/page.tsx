"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"

export default function CreateBucketPage() {
  const router = useRouter()
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
    
    // Create bucket using hybrid storage (localStorage + database + activity logging)
    const bucketId = await HybridStorage.createBucket({
      title: bucketName,
      targetAmount: parseFloat(targetAmount.replace(/,/g, '')) || 0,
      backgroundColor: selectedColor,
      apy: 3.5 // Default APY for new buckets
    })
    
    if (bucketId) {
      console.log('✅ Bucket created successfully:', bucketName)
      // Navigate to home to see the new bucket
      router.push('/home')
    } else {
      console.error('❌ Failed to create bucket')
      // Could show an error toast here
    }
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6">
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
            >
              Create bucket
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}