"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ActivityListItem } from "@/components/ui/activity-list-item"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ActivityListSkeleton } from "@/components/ui/skeleton-loader"
import { ConfirmationModal } from "@/components/ui/modal"
import { ArrowLeft, MoreVertical, Edit, Trash2, Plus, ArrowUpFromLine, Repeat, Download } from "lucide-react"
import ConfettiExplosion from 'react-confetti-explosion'
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect, useRef } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"
import { type Activity, type AutoDeposit, autoDepositService } from "@/lib/supabase"
import { AutoDepositBanner } from "@/components/ui/auto-deposit-banner"
import { useAuth } from "@/contexts/auth-context"

// Determine if activity should show an amount
function shouldShowAmount(activity: Activity): boolean {
  // Non-monetary activities that shouldn't show amounts
  const nonMonetaryActivityTypes = ['bucket_created', 'auto_deposit_started']
  const nonMonetaryTitles = ['Bucket created', 'Account opened', 'Settings updated', 'Auto deposit setup']
  
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
  
  // Check activity type first for auto deposits
  if (activity.activity_type === 'auto_deposit') {
    return 'Auto deposited'
  }
  
  // Transform based on activity type and available data
  switch (activity.title) {
    case 'Auto-deposit':
      return 'Auto deposited'
    
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
  const { user } = useAuth()
  const [newActivity, setNewActivity] = useState<{ id: number; title: string; date: string; amount: string } | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [actualCurrentAmount, setActualCurrentAmount] = useState<number | null>(null)
  const [autoDeposits, setAutoDeposits] = useState<AutoDeposit[]>([])
  const [loadingAutoDeposits, setLoadingAutoDeposits] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  // const [bucketJustCompleted, setBucketJustCompleted] = useState(false) // Unused variable commented out
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  const handleDeleteBucket = async () => {
    const bucketId = searchParams.get('id')
    
    // Handle demo mode
    const isDemoMode = localStorage.getItem('demo_mode') === 'true'
    const effectiveUser = user || (isDemoMode ? JSON.parse(localStorage.getItem('demo_user') || '{}') : null)
    
    if (!bucketId || !effectiveUser?.id) {
      console.error('Missing required data for deletion')
      setIsDeleting(false)
      setShowDeleteModal(false)
      return
    }
    
    setIsDeleting(true)
    
    // Set a safety timeout to prevent infinite processing
    const timeoutId = setTimeout(() => {
      console.error('Deletion timeout - forcing completion')
      setIsDeleting(false)
      setShowDeleteModal(false)
      window.location.href = '/home'
    }, 10000) // 10 second timeout
    
    try {
      console.log('Starting bucket deletion process for:', bucketId)
      
      // Get current bucket amount to transfer to main bucket
      const buckets = HybridStorage.getLocalBuckets(effectiveUser.id)
      const bucketToDelete = buckets.find((b: { id: string }) => b.id === bucketId)
      
      console.log('Found bucket to delete:', bucketToDelete)
      
      if (bucketToDelete && bucketToDelete.currentAmount > 0) {
        console.log('Transferring funds to main bucket:', bucketToDelete.currentAmount)
        
        try {
          // Transfer funds to main bucket
          const transferResult = await HybridStorage.transferMoney(
            bucketId,
            'main-bucket',
            bucketToDelete.currentAmount,
            effectiveUser.id
          )
          
          if (!transferResult.success) {
            console.error('Failed to transfer funds to main bucket:', transferResult.error)
          } else {
            console.log('Funds transferred successfully')
          }
        } catch (transferError) {
          console.error('Error during fund transfer:', transferError)
          // Continue with deletion even if transfer fails
        }
      }
      
      // Delete bucket from localStorage
      const bucketsKey = `buckets_${effectiveUser.id}`
      const savedBuckets = localStorage.getItem(bucketsKey)
      if (savedBuckets) {
        try {
          const allBuckets = JSON.parse(savedBuckets)
          const updatedBuckets = allBuckets.filter((bucket: { id: string }) => bucket.id !== bucketId)
          localStorage.setItem(bucketsKey, JSON.stringify(updatedBuckets))
          console.log('Bucket deleted from localStorage, remaining buckets:', updatedBuckets.length)
        } catch (localStorageError) {
          console.error('Error updating localStorage:', localStorageError)
        }
      }
      
      // Delete from database if not in demo mode
      if (!isDemoMode && user?.id) {
        try {
          console.log('Deleting from database...')
          // Import services for comprehensive deletion
          const { bucketService, autoDepositService } = await import('@/lib/supabase')
          
          // First, cancel any active auto deposits for this bucket
          const bucketAutoDeposits = await autoDepositService.getBucketAutoDeposits(bucketId)
          for (const autoDeposit of bucketAutoDeposits) {
            await autoDepositService.updateAutoDepositStatus(autoDeposit.id, 'cancelled')
            console.log('Cancelled auto deposit:', autoDeposit.id)
          }
          
          // Delete the bucket from database
          const deleteResult = await bucketService.deleteBucket(bucketId)
          if (deleteResult) {
            console.log('Bucket deleted from database successfully')
          } else {
            console.warn('Database deletion may have failed, but continuing')
          }
          
          // Clear any cached activities for this bucket
          localStorage.removeItem(`activities_${bucketId}`)
          
        } catch (dbError) {
          console.error('Error deleting bucket from database:', dbError)
          // Don't fail the operation if database deletion fails
        }
      }
      
      console.log('Deletion process completed, navigating to home...')
      
      // Set a small delay to ensure state updates complete
      setTimeout(() => {
        console.log('Redirecting to home page...')
        window.location.href = '/home'
      }, 100)
      
    } catch (error) {
      console.error('Critical error during bucket deletion:', error)
      alert('An error occurred while deleting the bucket. Please try again.')
    } finally {
      // Clear the safety timeout
      clearTimeout(timeoutId)
      
      // Ensure modal state is reset even if navigation fails
      setTimeout(() => {
        setIsDeleting(false)
        setShowDeleteModal(false)
      }, 50)
    }
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
        const mainBucket = HybridStorage.getLocalMainBucket(user?.id)
        setActualCurrentAmount(mainBucket.currentAmount)
      } else {
        const buckets = HybridStorage.getLocalBuckets(user?.id)
        const bucket = buckets.find((b: { id: string; currentAmount: number }) => b.id === bucketData.id)
        if (bucket) {
          setActualCurrentAmount(bucket.currentAmount)
        }
      }
    }
    
    loadActualAmount()
  }, [bucketData.id, user?.id])

  // Load activities from database with optimized caching
  useEffect(() => {
    const loadActivities = async () => {
      if (bucketData.id && user?.id) {
        setLoadingActivities(true)
        try {
          // Try to load from cache first for immediate display
          const cacheKey = `activities_${bucketData.id}`
          const cachedActivities = localStorage.getItem(cacheKey)
          if (cachedActivities) {
            try {
              const cached = JSON.parse(cachedActivities)
              setActivities(cached)
              setLoadingActivities(false) // Show cached data immediately
            } catch {
              console.warn('Error parsing cached activities')
            }
          }
          
          // Load fresh data with user context
          const bucketActivities = await HybridStorage.getBucketActivities(bucketData.id, user.id)
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
  }, [bucketData.id, user?.id])

  // Load auto deposits for this bucket
  useEffect(() => {
    const loadAutoDeposits = async () => {
      if (bucketData.id && bucketData.id !== 'main-bucket') {
        setLoadingAutoDeposits(true)
        
        // First check localStorage for immediate display
        const autoDepositsKey = `auto_deposits_${bucketData.id}`
        const localAutoDeposits = localStorage.getItem(autoDepositsKey)
        if (localAutoDeposits) {
          try {
            const deposits = JSON.parse(localAutoDeposits)
            if (deposits && deposits.length > 0) {
              setAutoDeposits(deposits)
              console.log('✅ Loaded auto deposits from localStorage:', deposits)
            }
          } catch (e) {
            console.warn('Error parsing local auto deposits:', e)
          }
        } else {
          console.log('❌ No auto deposits found in localStorage for bucket:', bucketData.id)
        }
        
        // Then try to load from database
        try {
          const bucketAutoDeposits = await autoDepositService.getBucketAutoDeposits(bucketData.id)
          if (bucketAutoDeposits && bucketAutoDeposits.length > 0) {
            setAutoDeposits(bucketAutoDeposits)
            // Update localStorage with database data
            localStorage.setItem(autoDepositsKey, JSON.stringify(bucketAutoDeposits))
          }
        } catch (error) {
          console.warn('Auto deposits not available from database:', error)
          // Keep localStorage data if database fails
        } finally {
          setLoadingAutoDeposits(false)
        }
      } else {
        setLoadingAutoDeposits(false)
      }
    }
    
    loadAutoDeposits()
  }, [bucketData.id])

  const [animatedCurrentAmount, setAnimatedCurrentAmount] = useState(0)
  const [animatedProgress, setAnimatedProgress] = useState(0)
  
  // Use actual current amount if available, otherwise fall back to URL parameter
  const displayCurrentAmount = actualCurrentAmount !== null ? actualCurrentAmount : bucketData.currentAmount
  const finalProgress = Math.min((displayCurrentAmount / bucketData.targetAmount) * 100, 100)
  
  // Handle sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom
        setShowStickyHeader(headerBottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check for transfer and bucket completion
  useEffect(() => {
    const fromTransfer = searchParams.get('fromTransfer')
    const transferAmountParam = searchParams.get('transferAmount')
    
    if (fromTransfer === 'true') {
      // Check if bucket just got completed
      const currentAmount = actualCurrentAmount !== null ? actualCurrentAmount : bucketData.currentAmount
      const isNowComplete = currentAmount >= bucketData.targetAmount && bucketData.targetAmount > 0
      
      if (isNowComplete && bucketData.id !== 'main-bucket') {
        console.log('🎉 Bucket just completed! Showing confetti')
        // setBucketJustCompleted(true) // Commented out since variable is unused
        setShowConfetti(true)
        
        // Stop confetti after 4 seconds
        setTimeout(() => {
          setShowConfetti(false)
        }, 4000)
      }
      
      if (transferAmountParam) {
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
      }
      
      // Clean up the URL parameters after showing animation
      setTimeout(() => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.delete('fromTransfer')
        params.delete('transferAmount')
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
      }, 100)
    }
  }, [searchParams, actualCurrentAmount, bucketData.currentAmount, bucketData.targetAmount, bucketData.id])

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

  const handleManageAutoDeposit = () => {
    if (autoDeposits.length > 0) {
      // Navigate to edit auto deposit page
      router.push(`/edit-auto-deposit?bucket=${bucketData.id}`)
    }
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: bucketData.backgroundColor
      }}
    >
      {/* Sticky header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 border-b border-black/10 transition-all duration-300 ${
          showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ backgroundColor: bucketData.backgroundColor }}
      >
        <div className="max-w-[660px] mx-auto px-12 py-4 max-sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => router.push(`/add-money?to=${bucketData.id}`)}>
                Add money
              </Button>
              {bucketData.targetAmount > 0 && displayCurrentAmount < bucketData.targetAmount && (
                <Button 
                  variant="primary"
                  onClick={() => router.push(`/add-money?to=${bucketData.id}&showAutoDeposit=true`)}
                >
                  Auto deposit
                </Button>
              )}
            </div>
            <DropdownMenu 
              trigger={<Button variant="secondary-icon" icon={<MoreVertical />} />}
            >
              {bucketData.id !== 'main-bucket' && (
                <DropdownMenuItem onClick={() => {
                  const params = new URLSearchParams(searchParams?.toString() || '')
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
              {bucketData.id !== 'main-bucket' && (
                <DropdownMenuItem onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete bucket
                </DropdownMenuItem>
              )}
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header with navigation and actions */}
        <div 
          ref={headerRef}
          className="flex items-center justify-between mb-15"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon" 
            icon={<ArrowLeft />} 
            onClick={() => {
              // If coming from a transfer or auto deposit setup, go to home instead of back
              const fromTransfer = searchParams.get('fromTransfer')
              const fromAutoDeposit = searchParams.get('fromAutoDeposit')
              if (fromTransfer === 'true' || fromAutoDeposit === 'true') {
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
                  const params = new URLSearchParams(searchParams?.toString() || '')
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
              {/* Only show auto deposit option if bucket is not completed */}
              {!(displayCurrentAmount >= bucketData.targetAmount) && (
                <>
                  {autoDeposits.length > 0 ? (
                    <DropdownMenuItem onClick={() => {
                      router.push(`/edit-auto-deposit?bucket=${bucketData.id}`)
                    }}>
                      <Repeat className="h-4 w-4" />
                      Edit auto deposit
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => {
                      router.push(`/add-money?to=${bucketData.id}&showAutoDeposit=true`)
                    }}>
                      <Repeat className="h-4 w-4" />
                      Auto deposit
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {bucketData.id !== 'main-bucket' && (
                <DropdownMenuItem onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete bucket
                </DropdownMenuItem>
              )}
            </DropdownMenu>
            <Button 
              variant="primary" 
              icon={bucketData.id !== 'main-bucket' && displayCurrentAmount >= bucketData.targetAmount ? <Download /> : <Plus />} 
              iconPosition="left"
              className="!bg-black !text-white"
              onClick={() => {
                // If bucket is completed, show withdraw action, otherwise add money
                if (bucketData.id !== 'main-bucket' && displayCurrentAmount >= bucketData.targetAmount) {
                  // TODO: Navigate to withdraw page when implemented
                  alert('Withdraw functionality coming soon!')
                } else {
                  router.push(`/add-money?to=${bucketData.id}`)
                }
              }}
            >
              {bucketData.id === 'main-bucket' 
                ? 'Add funds' 
                : (displayCurrentAmount >= bucketData.targetAmount ? 'Withdraw' : 'Add money')
              }
            </Button>
          </div>
        </div>

        {/* Bucket title */}
        <div 
          className="mb-10 relative"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          {/* Confetti explosion */}
          {showConfetti && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <ConfettiExplosion 
                particleCount={150}
                width={1200}
                duration={4000}
                colors={['#f43f5e', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']}
              />
            </div>
          )}
          
          <h1 
            className="text-[40px] max-sm:text-[20px] font-semibold text-black"
            style={{ letterSpacing: '-0.03em' }}
          >
            {bucketData.title}
          </h1>
          
          
          <div className="flex items-baseline mt-2">
            <div className="flex items-baseline gap-1">
              <span 
                className="text-[32px] max-sm:text-[24px] font-semibold text-black"
                style={{ letterSpacing: '-0.05em' }}
              >
                ${animatedCurrentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {bucketData.id !== 'main-bucket' && (
                <span 
                  className="text-[32px] max-sm:text-[24px] font-semibold text-black/40"
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
            className="mb-10 relative"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
          >
            <Progress 
              value={animatedProgress} 
              max={100} 
              backgroundColor={bucketData.backgroundColor}
              isCompleted={displayCurrentAmount >= bucketData.targetAmount}
              showCompletionBadge={displayCurrentAmount >= bucketData.targetAmount}
              className="w-full" 
            />
            {animatedProgress < 100 && (
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 pointer-events-none"
                style={{ left: `max(calc(${animatedProgress}% + 8px), 16px)` }}
              >
                <span className="text-[14px] font-semibold text-black/70">
                  {Math.round(animatedProgress)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Auto deposit banner - only for savings buckets with auto deposits */}
        {(() => {
          const showBanner = bucketData.id !== 'main-bucket' && !loadingAutoDeposits && autoDeposits.length > 0
          console.log('Banner conditions:', {
            isNotMainBucket: bucketData.id !== 'main-bucket',
            loadingAutoDeposits,
            autoDepositsCount: autoDeposits.length,
            showBanner,
            bucketId: bucketData.id
          })
          return showBanner ? (
            <AutoDepositBanner 
              autoDeposit={autoDeposits[0]} 
              onManage={handleManageAutoDeposit}
            />
          ) : null
        })()}

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
          {loadingActivities && activities.length === 0 ? (
            <ActivityListSkeleton count={5} />
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
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteBucket}
        title="Delete bucket?"
        description={`Are you sure you want to delete "${bucketData.title}"? ${
          actualCurrentAmount && actualCurrentAmount > 0
            ? `Your funds ($${actualCurrentAmount.toFixed(2)}) will be moved to your Main Bucket.`
            : 'This action cannot be undone.'
        }`}
        confirmLabel="Delete bucket"
        cancelLabel="Keep bucket"
        variant="danger"
        loading={isDeleting}
      />
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