"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ActivityListItem } from "@/components/ui/activity-list-item"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ArrowLeft, MoreVertical, Edit, Trash2, Plus, ArrowUpFromLine, Repeat } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect } from "react"

function BucketDetailsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [newActivity, setNewActivity] = useState<any>(null)

  const handleDeleteBucket = () => {
    const bucketId = searchParams.get('id')
    if (bucketId) {
      // Get current buckets from localStorage
      const savedBuckets = localStorage.getItem('buckets')
      if (savedBuckets) {
        const buckets = JSON.parse(savedBuckets)
        // Filter out the bucket to delete
        const updatedBuckets = buckets.filter((bucket: any) => bucket.id !== bucketId)
        // Save back to localStorage
        localStorage.setItem('buckets', JSON.stringify(updatedBuckets))
      }
    }
    // Navigate back to home
    router.push('/home')
  }
  
  // Get bucket data from URL parameters
  const bucketData = {
    title: searchParams.get('title') || "Vacation Fund",
    currentAmount: parseInt(searchParams.get('currentAmount') || '1250'),
    targetAmount: parseInt(searchParams.get('targetAmount') || '3000'),
    backgroundColor: searchParams.get('backgroundColor') || "#B6F3AD",
    apy: parseFloat(searchParams.get('apy') || '3.8'),
    activities: [
      {
        id: 1,
        title: "Monthly transfer",
        date: "Dec 15, 2024",
        amount: "+$200"
      },
      {
        id: 2,
        title: "Bonus allocation",
        date: "Dec 10, 2024", 
        amount: "+$500"
      },
      {
        id: 3,
        title: "Weekly savings",
        date: "Dec 8, 2024",
        amount: "+$50"
      },
      {
        id: 4,
        title: "Initial deposit",
        date: "Dec 1, 2024",
        amount: "+$500"
      }
    ]
  }

  const [animatedCurrentAmount, setAnimatedCurrentAmount] = useState(0)
  const [animatedProgress, setAnimatedProgress] = useState(0)
  
  const finalProgress = Math.min((bucketData.currentAmount / bucketData.targetAmount) * 100, 100)

  // Check for transfer and add new activity
  useEffect(() => {
    const showTransfer = searchParams.get('showTransfer')
    const transferAmountParam = searchParams.get('transferAmount')
    
    if (showTransfer === 'true' && transferAmountParam) {
      const transferAmount = parseFloat(transferAmountParam)
      const now = new Date()
      const formattedDate = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
      
      // Create new activity for the transfer
      const activity = {
        id: Date.now(),
        title: "Money transfer",
        date: formattedDate,
        amount: `+$${transferAmount.toLocaleString()}`
      }
      
      setNewActivity(activity)
      
      // Clean up the URL parameters after showing animation
      setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('showTransfer')
        params.delete('transferAmount')
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
      }, 100)
    }
  }, [searchParams])

  // Animate numbers and progress together
  useEffect(() => {
    const animateTogether = (start: number, endAmount: number, endProgress: number, duration: number) => {
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        const currentAmount = Math.floor(start + (endAmount - start) * easeOut)
        const currentProgress = start + (endProgress - start) * easeOut
        
        setAnimatedCurrentAmount(currentAmount)
        setAnimatedProgress(currentProgress)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }

    // Start synchronized animation
    setTimeout(() => {
      animateTogether(0, bucketData.currentAmount, finalProgress, 1500)
    }, 600)
  }, [bucketData.currentAmount, finalProgress])

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: bucketData.backgroundColor
      }}
    >
      <div className="max-w-[660px] mx-auto px-12 py-6">
        {/* Header with navigation and actions */}
        <div 
          className="flex items-center justify-between mb-15"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon" 
            icon={<ArrowLeft />} 
            onClick={() => router.back()}
            className="!bg-black/10 !text-black"
          />
          <div className="flex items-center gap-3">
            <DropdownMenu
              trigger={
                <Button 
                  variant="secondary-icon" 
                  icon={<MoreVertical />}
                  className="!bg-black/10 !text-black"
                />
              }
            >
              <DropdownMenuItem onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                router.push(`/edit-bucket?${params.toString()}`)
              }}>
                <Edit className="h-4 w-4" />
                Edit bucket
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArrowUpFromLine className="h-4 w-4" />
                Withdraw money
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Repeat className="h-4 w-4" />
                Auto deposit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteBucket}>
                <Trash2 className="h-4 w-4" />
                Delete bucket
              </DropdownMenuItem>
            </DropdownMenu>
            <Button 
              variant="primary" 
              icon={<Plus />} 
              iconPosition="left"
              className="!bg-black !text-white"
              onClick={() => router.push('/add-money')}
            >
              Add money
            </Button>
          </div>
        </div>

        {/* Bucket title */}
        <div 
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[40px] font-semibold text-black"
            style={{ letterSpacing: '-0.03em' }}
          >
            {bucketData.title}
          </h1>
          <div className="flex items-baseline mt-2">
            <div className="flex items-baseline gap-1">
              <span 
                className="text-[32px] font-semibold text-black"
                style={{ letterSpacing: '-0.05em' }}
              >
                ${animatedCurrentAmount.toLocaleString()}
              </span>
              <span 
                className="text-[32px] font-semibold text-black/40"
                style={{ letterSpacing: '-0.05em' }}
              >
                of ${bucketData.targetAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div 
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <Progress 
            value={animatedProgress} 
            max={100} 
            backgroundColor={bucketData.backgroundColor}
            className="w-full" 
          />
        </div>


        {/* Activity list */}
        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}>
          {/* New transfer activity (if exists) */}
          {newActivity && (
            <div 
              style={{ animation: 'fadeInUp 0.4s ease-out 0.1s both' }}
            >
              <ActivityListItem
                title={newActivity.title}
                date={newActivity.date}
                amount={newActivity.amount}
              />
            </div>
          )}
          
          {/* Existing activities */}
          {bucketData.activities.map((activity, index) => (
            <div 
              key={activity.id}
              style={{ animation: `fadeInUp 0.4s ease-out ${newActivity ? 0.5 + index * 0.05 : 0.5 + index * 0.05}s both` }}
            >
              <ActivityListItem
                title={activity.title}
                date={activity.date}
                amount={activity.amount}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BucketDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BucketDetailsContent />
    </Suspense>
  )
}