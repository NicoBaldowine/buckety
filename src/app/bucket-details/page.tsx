"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ActivityListItem } from "@/components/ui/activity-list-item"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ArrowLeft, MoreVertical, Edit, Trash2, Plus, ArrowUpFromLine, Repeat } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"
import { type Activity } from "@/lib/supabase"

// Determine if activity should show an amount
function shouldShowAmount(activity: Activity): boolean {
  // Non-monetary activities that shouldn't show amounts
  const nonMonetaryActivityTypes = ['bucket_created']
  const nonMonetaryTitles = ['Bucket created', 'Account opened', 'Settings updated']
  
  return !nonMonetaryActivityTypes.includes(activity.activity_type) && 
         !nonMonetaryTitles.includes(activity.title) &&
         activity.amount !== 0
}

// Transform activity titles to simple "From X To Y" format
function transformActivityTitle(activity: Activity): string {
  // If already using new format, return as-is
  if (activity.title.startsWith('From ') && activity.title.includes(' To ')) {
    return activity.title
  }
  
  // Transform based on activity type and available data
  switch (activity.title) {
    case 'Money transfer':
    case 'Received from Main Bucket':
      if (activity.from_source) {
        return `From ${activity.from_source}`
      }
      return activity.title
    
    case 'Money transfer out':
    case 'Transfer to savings bucket':
      if (activity.to_destination) {
        return `To ${activity.to_destination}`
      }
      return activity.title
    
    // Handle new format activities that might have "Received from" or "Moved to"
    default:
      if (activity.title.startsWith('Received from ')) {
        const source = activity.title.replace('Received from ', '')
        return `From ${source}`
      }
      if (activity.title.startsWith('Moved to ')) {
        const destination = activity.title.replace('Moved to ', '')
        return `To ${destination}`
      }
      
      return activity.title
  }
}

function BucketDetailsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [newActivity, setNewActivity] = useState<any>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [actualCurrentAmount, setActualCurrentAmount] = useState<number | null>(null)

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
    id: searchParams.get('id') || '',
    title: searchParams.get('title') || "Vacation Fund",
    currentAmount: parseFloat(searchParams.get('currentAmount') || '1250'),
    targetAmount: parseFloat(searchParams.get('targetAmount') || '3000'),
    backgroundColor: searchParams.get('backgroundColor') || "#B6F3AD",
    apy: parseFloat(searchParams.get('apy') || '3.8')
  }

  // Load actual current amount from localStorage/hybrid storage
  useEffect(() => {
    const loadActualAmount = () => {
      if (bucketData.id === 'main-bucket') {
        const mainBucket = HybridStorage.getLocalMainBucket()
        setActualCurrentAmount(mainBucket.currentAmount)
      } else {
        const buckets = HybridStorage.getLocalBuckets()
        const bucket = buckets.find((b: any) => b.id === bucketData.id)
        if (bucket) {
          setActualCurrentAmount(bucket.currentAmount)
        }
      }
    }
    
    loadActualAmount()
  }, [bucketData.id])

  // Load activities from database
  useEffect(() => {
    const loadActivities = async () => {
      if (bucketData.id) {
        setLoadingActivities(true)
        try {
          const bucketActivities = await HybridStorage.getBucketActivities(bucketData.id)
          setActivities(bucketActivities)
        } catch (error) {
          console.error('Error loading activities:', error)
          setActivities([])
        } finally {
          setLoadingActivities(false)
        }
      }
    }
    
    loadActivities()
  }, [bucketData.id])

  const [animatedCurrentAmount, setAnimatedCurrentAmount] = useState(0)
  const [animatedProgress, setAnimatedProgress] = useState(0)
  
  // Use actual current amount if available, otherwise fall back to URL parameter
  const displayCurrentAmount = actualCurrentAmount !== null ? actualCurrentAmount : bucketData.currentAmount
  const finalProgress = Math.min((displayCurrentAmount / bucketData.targetAmount) * 100, 100)

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
        amount: `+$${transferAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      animateTogether(0, displayCurrentAmount, finalProgress, 1500)
    }, 600)
  }, [displayCurrentAmount, finalProgress])

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
            onClick={() => {
              // If coming from a transfer (fromTransfer param), go to home instead of back
              const fromTransfer = searchParams.get('fromTransfer')
              if (fromTransfer === 'true') {
                router.push('/home')
              } else {
                router.back()
              }
            }}
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
              {bucketData.id !== 'main-bucket' && (
                <DropdownMenuItem onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  router.push(`/edit-bucket?${params.toString()}`)
                }}>
                  <Edit className="h-4 w-4" />
                  Edit bucket
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <ArrowUpFromLine className="h-4 w-4" />
                Withdraw money
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Repeat className="h-4 w-4" />
                Auto deposit
              </DropdownMenuItem>
              {bucketData.id !== 'main-bucket' && (
                <DropdownMenuItem onClick={handleDeleteBucket}>
                  <Trash2 className="h-4 w-4" />
                  Delete bucket
                </DropdownMenuItem>
              )}
            </DropdownMenu>
            <Button 
              variant="primary" 
              icon={<Plus />} 
              iconPosition="left"
              className="!bg-black !text-white"
              onClick={() => router.push('/add-money')}
            >
              {bucketData.id === 'main-bucket' ? 'Add funds' : 'Add money'}
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
                ${animatedCurrentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {bucketData.id !== 'main-bucket' && (
                <span 
                  className="text-[32px] font-semibold text-black/40"
                  style={{ letterSpacing: '-0.05em' }}
                >
                  of ${bucketData.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar - only for savings buckets, not main bucket */}
        {bucketData.id !== 'main-bucket' && (
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
        )}


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
          {loadingActivities ? (
            <div className="flex justify-center py-8">
              <p className="text-black/50">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-black/50">No activities yet. This bucket was just created!</p>
            </div>
          ) : (
            activities.map((activity, index) => (
            <div 
              key={activity.id}
              style={{ animation: `fadeInUp 0.4s ease-out ${newActivity ? 0.5 + index * 0.05 : 0.5 + index * 0.05}s both` }}
            >
              <ActivityListItem
                title={transformActivityTitle(activity)}
                date={new Date(activity.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
                amount={shouldShowAmount(activity) ? 
                  (activity.amount >= 0 ? `+$${Math.abs(activity.amount)}` : `-$${Math.abs(activity.amount)}`) 
                  : undefined
                }
              />
            </div>
            ))
          )}
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