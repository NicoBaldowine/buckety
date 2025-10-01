"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ActivityListItem } from "@/components/ui/activity-list-item"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ActivityListSkeleton } from "@/components/ui/skeleton-loader"
import { ConfirmationModal } from "@/components/ui/modal"
import { ArrowLeft, MoreVertical, Edit, Trash2, Plus, Repeat } from "lucide-react"
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
  const nonMonetaryActivityTypes = ['bucket_created', 'bucket_completed', 'auto_deposit_started']
  const nonMonetaryTitles = ['Bucket created', 'Bucket completed', 'Account opened', 'Settings updated', 'Auto deposit setup']
  
  return !nonMonetaryActivityTypes.includes(activity.activity_type) && 
         !nonMonetaryTitles.includes(activity.title) &&
         activity.amount !== 0
}

// Transform activity titles for display
function transformActivityTitle(activity: Activity, currentBucketId: string): string {
  // Handle specific activity types
  if (activity.activity_type === 'auto_deposit') {
    return 'Auto deposited'
  }
  
  if (activity.activity_type === 'bucket_created') {
    return 'Bucket created'
  }
  
  if (activity.activity_type === 'bucket_completed') {
    return 'Bucket completed'
  }
  
  if (activity.activity_type === 'money_added') {
    // First check if we already have a formatted title
    if (activity.title && activity.title.startsWith('From ')) {
      return activity.title
    }
    
    // Check source
    if (activity.from_source === 'main-bucket' || activity.from_source === 'Main Bucket') {
      return 'From Main Bucket'
    }
    
    // If there's a from_source that's not main bucket or deposit, show it
    if (activity.from_source && activity.from_source !== 'deposit' && activity.from_source !== 'external') {
      return `From ${activity.from_source}`
    }
    
    // For main bucket, show more specific titles
    if (currentBucketId === 'main-bucket') {
      // If it's an external deposit
      if (!activity.from_source || activity.from_source === 'deposit' || activity.from_source === 'external') {
        return 'Deposited'
      }
    }
    
    // Check if it's a deposit for other buckets
    if (!activity.from_source || activity.from_source === 'deposit' || activity.from_source === 'external') {
      return 'Deposited'
    }
    // Check title for deposit keywords
    if (activity.title && (activity.title.toLowerCase().includes('deposit') || activity.title.toLowerCase().includes('added'))) {
      return activity.title
    }
    return 'Added money'
  }
  
  if (activity.activity_type === 'money_removed') {
    // First check if we already have a formatted title
    if (activity.title && activity.title.startsWith('To ')) {
      return activity.title
    }
    
    // For main bucket, show where money went
    if (currentBucketId === 'main-bucket') {
      if (activity.to_destination && activity.to_destination !== 'withdrawal' && activity.to_destination !== 'external') {
        return `To ${activity.to_destination}`
      }
      return 'Withdrawn'
    }
    
    // For other buckets
    if (activity.to_destination === 'main-bucket' || activity.to_destination === 'Main Bucket') {
      return 'Sent to main'
    }
    
    // If there's a to_destination that's not main bucket or withdrawal, show it
    if (activity.to_destination && activity.to_destination !== 'withdrawal' && activity.to_destination !== 'external') {
      return `To ${activity.to_destination}`
    }
    
    return 'Withdrawn'
  }
  
  // Handle legacy title formats
  switch (activity.title) {
    case 'Auto-deposit':
      return 'Auto deposited'
    
    case 'Money transfer':
    case 'Received from Main Bucket':
      if (activity.from_source) {
        return `From ${activity.from_source}`
      }
      return 'Added money'
    
    case 'Money transfer out':
    case 'Transfer to savings bucket':
      if (activity.to_destination) {
        return `To ${activity.to_destination}`
      }
      return 'Money removed'
    
    default:
      // Handle "Received from" pattern
      if (activity.title.startsWith('Received from ')) {
        const source = activity.title.replace('Received from ', '')
        if (source === 'Main Bucket') {
          return 'Added from main'
        }
        return `From ${source}`
      }
      // Handle "Moved to" pattern
      if (activity.title.startsWith('Moved to ')) {
        const destination = activity.title.replace('Moved to ', '')
        return `To ${destination}`
      }
      // Handle "From X To Y" pattern
      if (activity.title.startsWith('From ') && activity.title.includes(' To ')) {
        return activity.title
      }
      
      // Return original title if no transformation needed
      return activity.title || 'Activity'
  }
}

function BucketDetailsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  // Removed newActivity state - activities are handled through HybridStorage
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
    title: searchParams.get('title') || "Unknown Bucket",
    currentAmount: parseFloat(searchParams.get('currentAmount') || '0'),
    targetAmount: parseFloat(searchParams.get('targetAmount') || '0'),
    backgroundColor: searchParams.get('backgroundColor') || "#E5E7EB",
    apy: parseFloat(searchParams.get('apy') || '3.8')
  }
  
  // Helper function to create complete bucket details URL for navigation
  const createCompleteSourceURL = () => {
    const params = new URLSearchParams({
      id: bucketData.id,
      title: bucketData.title,
      currentAmount: displayCurrentAmount.toString(),
      targetAmount: bucketData.targetAmount.toString(),
      backgroundColor: bucketData.backgroundColor,
      apy: bucketData.apy.toString()
    })
    return `/bucket-details?${params.toString()}`
  }
  
  // Load actual amount from localStorage immediately to avoid display issues
  const [displayCurrentAmount, setDisplayCurrentAmount] = useState(() => {
    if (typeof window !== 'undefined' && bucketData.id) {
      try {
        if (bucketData.id === 'main-bucket') {
          // Try to get the main bucket amount from localStorage immediately
          const mainBucketKey = `mainBucket_${user?.id || 'demo-user-id'}`
          const mainBucketData = localStorage.getItem(mainBucketKey)
          if (mainBucketData) {
            const mainBucket = JSON.parse(mainBucketData)
            return mainBucket.currentAmount
          }
        } else {
          // Try to get the bucket amount from localStorage immediately
          const bucketsKey = `buckets_${user?.id || 'demo-user-id'}`
          const bucketsData = localStorage.getItem(bucketsKey)
          if (bucketsData) {
            const buckets = JSON.parse(bucketsData)
            const bucket = buckets.find((b: { id: string; currentAmount: number }) => b.id === bucketData.id)
            if (bucket) {
              return bucket.currentAmount
            }
          }
        }
      } catch (e) {
        console.warn('Error loading bucket amount immediately:', e)
      }
    }
    return bucketData.currentAmount
  })

  // Validate bucket exists and update current amount display
  useEffect(() => {
    const loadActualAmount = () => {
      if (bucketData.id === 'main-bucket') {
        const mainBucket = HybridStorage.getLocalMainBucket(user?.id)
        setDisplayCurrentAmount(mainBucket.currentAmount)
        setActualCurrentAmount(mainBucket.currentAmount)
      } else if (bucketData.id) {
        const buckets = HybridStorage.getLocalBuckets(user?.id)
        const bucket = buckets.find((b: { id: string; currentAmount: number }) => b.id === bucketData.id)
        if (bucket) {
          setDisplayCurrentAmount(bucket.currentAmount)
          setActualCurrentAmount(bucket.currentAmount)
        } else {
          // Bucket doesn't exist, clean up any orphaned data and redirect to home
          console.warn(`Bucket with id ${bucketData.id} not found, cleaning up and redirecting to home`)
          
          // Clean up any orphaned activities for this non-existent bucket
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`activities_${bucketData.id}`)
            console.log(`Cleaned up orphaned activities for bucket ${bucketData.id}`)
          }
          
          router.push('/home')
          return
        }
      } else {
        // No valid bucket ID, redirect to home
        console.warn('No valid bucket ID provided, redirecting to home')
        router.push('/home')
        return
      }
    }
    
    if (user?.id) {
      loadActualAmount()
    }
  }, [bucketData.id, user?.id, router])

  // Load activities with immediate localStorage display like other buckets
  useEffect(() => {
    const loadActivities = async () => {
      if (bucketData.id && user?.id) {
        setLoadingActivities(true)
        try {
          // CRITICAL: For Main Bucket, clear contaminated data
          if (bucketData.id === 'main-bucket') {
            const allKeys = Object.keys(localStorage)
            
            // Remove all Main Bucket keys that aren't for current user
            allKeys.forEach(key => {
              // Remove global contaminated keys
              if (key === 'main_bucket_transfers' || key === 'activities_main-bucket') {
                console.log(`🧹 Removing contaminated global key: ${key}`)
                localStorage.removeItem(key)
              }
              // Remove other users' Main Bucket keys
              if ((key.startsWith('main_bucket_transfers_') || key.startsWith('activities_main-bucket_')) 
                  && !key.endsWith(user.id)) {
                console.log(`🧹 Removing other user's key: ${key}`)
                localStorage.removeItem(key)
              }
            })
            
            // Don't clear Main Bucket activities - they're user-specific now
            console.log('🏠 Main Bucket: Keeping user-specific activities')
            
            console.log('🏠 Main Bucket: Cleaned up contaminated data')
          }
          
          // Get localStorage key for this user and bucket
          const activitiesKey = `activities_${bucketData.id}_${user.id}`
          
          // For main bucket, also check the generic key for existing data
          const fallbackKey = bucketData.id === 'main-bucket' ? `activities_main-bucket` : null
          
          console.log(`🔍 Loading activities for ${bucketData.id}:`, {
            activitiesKey,
            fallbackKey,
            userId: user.id
          })
          
          // Try to load from localStorage immediately for fast display
          let localActivities = localStorage.getItem(activitiesKey)
          
          // If no user-specific data, try fallback for main bucket
          if (!localActivities && fallbackKey) {
            localActivities = localStorage.getItem(fallbackKey)
            if (localActivities) {
              // Migrate to user-specific key
              localStorage.setItem(activitiesKey, localActivities)
              localStorage.removeItem(fallbackKey)
              console.log('📦 Migrated main bucket activities to user-specific cache:', {
                fromKey: fallbackKey,
                toKey: activitiesKey,
                dataLength: localActivities.length
              })
            }
          }
          
          // For main bucket, if still no activities, try to load from database immediately
          if (!localActivities && bucketData.id === 'main-bucket') {
            console.log('🏠 No Main Bucket activities in localStorage, loading from database immediately...')
            // Don't try to guess from other localStorage keys as this causes cross-account contamination
            // Instead, rely on the database call below to provide the correct user-specific data
          }
          
          if (localActivities) {
            try {
              const activities = JSON.parse(localActivities)
              console.log(`📋 Loaded ${activities.length} activities from localStorage for ${bucketData.id}`)
              setActivities(activities)
            } catch (e) {
              console.warn('Error parsing cached activities:', e)
              setActivities([])
            }
          } else {
            // No cached activities, show empty state immediately
            console.log(`📋 No cached activities found for ${bucketData.id}`)
            setActivities([])
          }
          
          // For main bucket with no localStorage data, keep loading until database responds
          if (bucketData.id === 'main-bucket' && !localActivities) {
            console.log('🏠 Keeping loading state for Main Bucket until database loads...')
            // Don't set loading to false yet, let the database call below handle it
          } else {
            // Stop loading for other cases
            setLoadingActivities(false)
          }
          
          // Load fresh data from database in background (don't wait for it)
          HybridStorage.getBucketActivities(bucketData.id, user?.id).then(bucketActivities => {
            // Update the activities if we got new data from the database
            if (bucketActivities && bucketActivities.length > 0) {
              // CRITICAL: For Main Bucket, be extra strict about filtering
              if (bucketData.id === 'main-bucket') {
                console.log('🏠 Main Bucket: Raw activities from database:', bucketActivities.map(a => ({
                  id: a.id,
                  bucket_id: a.bucket_id,
                  user_id: a.user_id,
                  title: a.title,
                  activity_type: a.activity_type,
                  from_source: a.from_source
                })))
              }
              
              // Filter activities to ensure they belong to this specific bucket and user
              const validActivities = bucketActivities.filter(activity => {
                // Must belong to this bucket
                const belongsToThisBucket = activity.bucket_id === bucketData.id
                // Must belong to this user (if user_id exists in activity)
                const belongsToThisUser = !activity.user_id || activity.user_id === user?.id
                
                // For Main Bucket, apply moderate filtering (less strict for now)
                if (bucketData.id === 'main-bucket') {
                  // Only reject obvious auto_deposit activities
                  if (activity.activity_type === 'auto_deposit') {
                    console.warn(`🏠 Main Bucket: Rejecting auto_deposit activity`)
                    return false
                  }
                  
                  // Log what we're keeping for debugging
                  console.log(`🏠 Main Bucket: Keeping activity:`, {
                    id: activity.id,
                    title: activity.title,
                    from_source: activity.from_source,
                    activity_type: activity.activity_type
                  })
                }
                
                if (!belongsToThisBucket) {
                  console.warn(`🚨 Filtered out activity for wrong bucket: ${activity.bucket_id} (expected: ${bucketData.id})`)
                }
                if (!belongsToThisUser) {
                  console.warn(`🚨 Filtered out activity for wrong user: ${activity.user_id} (expected: ${user?.id})`)
                }
                
                return belongsToThisBucket && belongsToThisUser
              })
              
              if (validActivities.length !== bucketActivities.length) {
                console.log(`🔒 Filtered ${bucketActivities.length - validActivities.length} invalid activities`)
              }
              
              bucketActivities = validActivities
              // Process bucket creation and completion activities for non-main buckets
              if (bucketData.id !== 'main-bucket') {
                // Add bucket creation activity if it doesn't exist
                const hasBucketCreatedActivity = bucketActivities.some(
                  activity => activity.activity_type === 'bucket_created'
                )
                
                if (!hasBucketCreatedActivity) {
                  const bucketCreatedActivity: Activity = {
                    id: `created-${bucketData.id}`,
                    bucket_id: bucketData.id,
                    title: 'Bucket created',
                    amount: 0,
                    activity_type: 'bucket_created',
                    from_source: '',
                    to_destination: '',
                    date: new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString()
                  }
                  bucketActivities.push(bucketCreatedActivity)
                }
                
                // Add bucket completion activity if bucket is completed
                const currentBucketAmount = actualCurrentAmount !== null ? actualCurrentAmount : bucketData.currentAmount
                if (currentBucketAmount >= bucketData.targetAmount && bucketData.targetAmount > 0) {
                  const hasCompletionActivity = bucketActivities.some(
                    activity => activity.activity_type === 'bucket_completed'
                  )
                  
                  if (!hasCompletionActivity) {
                    const completionActivity: Activity = {
                      id: `completion-${bucketData.id}`,
                      bucket_id: bucketData.id,
                      title: 'Bucket completed',
                      amount: 0,
                      activity_type: 'bucket_completed',
                      from_source: '',
                      to_destination: '',
                      date: new Date().toISOString().split('T')[0],
                      created_at: new Date().toISOString()
                    }
                    bucketActivities.push(completionActivity)
                  }
                }
              }
              
              // Sort activities by date (newest first), but always put "bucket_completed" at the top
              const sortedActivities = bucketActivities.sort((a, b) => {
                // Bucket completed activities should always be at the top
                if (a.activity_type === 'bucket_completed' && b.activity_type !== 'bucket_completed') {
                  return -1 // a comes first
                }
                if (b.activity_type === 'bucket_completed' && a.activity_type !== 'bucket_completed') {
                  return 1 // b comes first
                }
                
                // For all other activities, sort by date (newest first)
                const dateA = new Date(a.date || a.created_at || '1970-01-01')
                const dateB = new Date(b.date || b.created_at || '1970-01-01')
                return dateB.getTime() - dateA.getTime()
              })
              
              // Update cache and UI
              localStorage.setItem(activitiesKey, JSON.stringify(sortedActivities))
              setActivities(sortedActivities)
              console.log(`🔄 Updated ${bucketData.id} with ${sortedActivities.length} activities from database`)
              
              // Stop loading if we were waiting for database (especially for Main Bucket)
              setLoadingActivities(false)
            } else {
              // No activities from database either, stop loading
              console.log(`📭 No activities found in database for ${bucketData.id}`)
              setLoadingActivities(false)
            }
          }).catch(error => {
            console.error('Error loading fresh activities:', error)
            // Always stop loading on error
            setLoadingActivities(false)
          })
        } catch (error) {
          console.error('Error loading activities:', error)
          setActivities([])
          setLoadingActivities(false)
        }
      }
    }
    
    loadActivities()
  }, [bucketData.id, bucketData.currentAmount, bucketData.targetAmount, user?.id, actualCurrentAmount])

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
            } else {
              setAutoDeposits([])
            }
          } catch (e) {
            console.warn('Error parsing local auto deposits:', e)
            setAutoDeposits([])
          }
        } else {
          // Clear auto deposits if none found locally, but still check database
          setAutoDeposits([])
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
  
  // Add listener to reload auto deposits when returning to the page
  useEffect(() => {
    const checkAutoDeposits = () => {
      if (bucketData.id && bucketData.id !== 'main-bucket') {
        const autoDepositsKey = `auto_deposits_${bucketData.id}`
        const localAutoDeposits = localStorage.getItem(autoDepositsKey)
        
        console.log(`🔍 Checking auto deposits for key ${autoDepositsKey}:`, localAutoDeposits ? 'FOUND' : 'NOT FOUND')
        
        if (!localAutoDeposits || localAutoDeposits === 'null' || localAutoDeposits === 'undefined') {
          // If no auto deposits in localStorage, clear the state
          setAutoDeposits([])
          console.log('🔄 Auto deposits cleared - no data in localStorage')
        } else {
          try {
            const deposits = JSON.parse(localAutoDeposits)
            // Check if deposits is actually an array with content
            if (Array.isArray(deposits) && deposits.length > 0) {
              setAutoDeposits(deposits)
              console.log('🔄 Auto deposits reloaded:', deposits.length)
            } else {
              setAutoDeposits([])
              console.log('🔄 Auto deposits cleared - empty array')
            }
          } catch (e) {
            console.error('Error parsing auto deposits:', e)
            setAutoDeposits([])
          }
        }
      }
    }
    
    // Check when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAutoDeposits()
      }
    }
    
    // Check on mount
    checkAutoDeposits()
    
    // Add event listeners
    window.addEventListener('focus', checkAutoDeposits)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also check on interval as fallback
    const interval = setInterval(checkAutoDeposits, 500) // Check more frequently
    
    return () => {
      window.removeEventListener('focus', checkAutoDeposits)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [bucketData.id])

  const [animatedCurrentAmount, setAnimatedCurrentAmount] = useState(0)
  const [animatedProgress, setAnimatedProgress] = useState(0)
  
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
      
      // Removed duplicate activity creation - activities are already saved during transfer
      
      // Clean up the URL parameters after showing animation
      setTimeout(() => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.delete('fromTransfer')
        params.delete('transferAmount')
        params.delete('fromSource')
        params.delete('fromCreate')
        params.delete('fromAutoDeposit')
        params.delete('fromDiscounts')
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

    // If bucket is completed, show it immediately without animation from 0
    const isCompleted = displayCurrentAmount >= bucketData.targetAmount
    if (isCompleted && bucketData.id !== 'main-bucket') {
      setAnimatedCurrentAmount(displayCurrentAmount)
      setAnimatedProgress(100)
    } else {
      // Start synchronized animation only if not completed
      setTimeout(() => {
        animateTogether(0, displayCurrentAmount, finalProgress, 1500)
      }, 600)
    }
  }, [displayCurrentAmount, finalProgress, bucketData.targetAmount, bucketData.id])

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
      {/* Sticky header - matches original header exactly */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 border-b border-black/10 transition-all duration-300 ${
          showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ backgroundColor: bucketData.backgroundColor }}
      >
        <div className="max-w-[660px] mx-auto px-12 py-4 max-sm:px-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="secondary-icon-black" 
              icon={<ArrowLeft />} 
              onClick={() => {
                const fromDiscounts = searchParams.get('fromDiscounts')
                
                // If from discounts, go back normally
                if (fromDiscounts === 'true') {
                  router.back()
                  return
                }
                
                // Always go to home from bucket details (except discounts)
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('navigation_context')
                }
                router.push('/home')
              }}
              className="!bg-black/5 !text-black"
            />
            <div className="flex items-center gap-3">
              <DropdownMenu
                trigger={
                  <Button 
                    variant="secondary-icon-black" 
                    icon={<MoreVertical />}
                    className="!bg-black/5 !text-black"
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
                        router.push(`/add-money?to=${bucketData.id}&showAutoDeposit=true&source=${encodeURIComponent(createCompleteSourceURL())}`)
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
              {/* Only show Add money button for non-completed buckets and main bucket */}
              {(bucketData.id === 'main-bucket' || displayCurrentAmount < bucketData.targetAmount) && (
                <Button 
                  variant="primary-black" 
                  icon={<Plus />} 
                  iconPosition="left"
                  className="!bg-black !text-white"
                  onClick={() => {
                    router.push(`/add-money?to=${bucketData.id}&source=${encodeURIComponent(createCompleteSourceURL())}`)
                  }}
                >
                  {bucketData.id === 'main-bucket' ? 'Add funds' : 'Add money'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header with navigation and actions */}
        <div 
          ref={headerRef}
          className="flex items-center justify-between mb-6 md:mb-12"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon-black" 
            icon={<ArrowLeft />} 
            onClick={() => {
              const fromDiscounts = searchParams.get('fromDiscounts')
              
              console.log('🔙 Back button clicked:', {
                fromDiscounts,
                allParams: Object.fromEntries(searchParams.entries())
              })
              
              // If from discounts, go back normally
              if (fromDiscounts === 'true') {
                console.log('🛍️ Going back to discounts')
                router.back()
                return
              }
              
              // Always go to home from bucket details (except discounts)
              console.log('🏠 Going to home from bucket details')
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('navigation_context')
              }
              router.push('/home')
            }}
            className="!bg-black/5 !text-black"
          />
          <div className="flex items-center gap-3">
            <DropdownMenu
              trigger={
                <Button 
                  variant="secondary-icon-black" 
                  icon={<MoreVertical />}
                  className="!bg-black/5 !text-black"
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
                      router.push(`/add-money?to=${bucketData.id}&showAutoDeposit=true&source=${encodeURIComponent(createCompleteSourceURL())}`)
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
            {/* Only show Add money button for non-completed buckets and main bucket */}
            {(bucketData.id === 'main-bucket' || displayCurrentAmount < bucketData.targetAmount) && (
              <Button 
                variant="primary-black" 
                icon={<Plus />} 
                iconPosition="left"
                className="!bg-black !text-white"
                onClick={() => {
                  router.push(`/add-money?to=${bucketData.id}&source=${encodeURIComponent(createCompleteSourceURL())}`)
                }}
              >
                {bucketData.id === 'main-bucket' ? 'Add funds' : 'Add money'}
              </Button>
            )}
          </div>
        </div>

        {/* Bucket title and amounts */}
        <div 
          className="mb-6 relative mt-8 md:mt-[70px]"
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
          
          {/* Title */}
          <h1 
            className="text-[20px] md:text-[32px] font-extrabold text-black mb-0"
            style={{ letterSpacing: '-0.05em' }}
          >
            {bucketData.title}
          </h1>
          
          {/* Amounts in single line like bucket card but proportionally bigger */}
          {bucketData.id !== 'main-bucket' && (
            <div className="mb-2">
              <div className="flex items-baseline gap-1">
                <span 
                  className="text-[16px] md:text-[30px] font-semibold tracking-tight text-black"
                >
                  ${animatedCurrentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span 
                  className="text-[16px] md:text-[30px] font-semibold tracking-tight text-black/40"
                >
                  of ${bucketData.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
          {bucketData.id === 'main-bucket' && (
            <div className="mb-4">
              <span 
                className="text-[16px] md:text-[30px] font-semibold tracking-tight text-black"
              >
                ${animatedCurrentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar - only for savings buckets, not main bucket */}
        {bucketData.id !== 'main-bucket' && (
          <div 
            className="mb-4 md:mb-10 relative max-sm:-mt-2.5"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
          >
            <Progress 
              value={animatedProgress} 
              max={100} 
              backgroundColor={bucketData.backgroundColor}
              isCompleted={displayCurrentAmount >= bucketData.targetAmount}
              showCompletionBadge={false}
              className="w-full" 
            />
            {animatedProgress < 90 && (
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

        {/* Auto deposit banner - only for savings buckets with auto deposits and not completed */}
        {(() => {
          const isCompleted = displayCurrentAmount >= bucketData.targetAmount
          const showBanner = bucketData.id !== 'main-bucket' && 
                            !loadingAutoDeposits && 
                            autoDeposits.length > 0 && 
                            !isCompleted
          
          return showBanner ? (
            <AutoDepositBanner 
              autoDeposit={autoDeposits[0]} 
              onManage={handleManageAutoDeposit}
            />
          ) : null
        })()}


        {/* Activity list */}
        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}>
          {/* Activities */}
          {loadingActivities && activities.length === 0 ? (
            <ActivityListSkeleton count={5} />
          ) : (
            activities.map((activity, index) => (
            <div 
              key={`${activity.activity_type}-${index}-${activity.id}`}
              style={{ animation: `fadeInUp 0.4s ease-out ${0.4 + index * 0.08}s both` }}
            >
              <ActivityListItem
                title={transformActivityTitle(activity, bucketData.id)}
                date={(() => {
                  // Parse date without timezone conversion
                  const [year, month, day] = activity.date.split('-');
                  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  return dateObj.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                })()}
                amount={shouldShowAmount(activity) ? 
                  (activity.amount >= 0 ? `+$${Math.abs(activity.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `-$${Math.abs(activity.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) 
                  : undefined
                }
                activityType={activity.activity_type}
                backgroundColor={bucketData.backgroundColor}
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