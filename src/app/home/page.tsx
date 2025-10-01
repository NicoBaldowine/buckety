"use client"

import { Button } from "@/components/ui/button"
import { BucketCard } from "@/components/ui/bucket-card"
import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { HeaderSkeleton, BalanceSkeleton, MainBucketSkeleton, BucketCardSkeleton } from "@/components/ui/skeleton-loader"
import { TabBar } from "@/components/ui/tab-bar"
import { ChevronRight, Link2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { autoDepositService, bucketService, mainBucketService } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
// import { syncMainBucketBalance, createMissingMainBucketActivities } from "@/lib/sync-main-bucket"

// Bank Account Button Component
function BankAccountButton() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Check if bank is connected
  const isBankConnected = user?.id ? localStorage.getItem(`bank_connected_${user.id}`) === 'true' : false
  
  if (isBankConnected) {
    return (
      <button 
        onClick={() => router.push('/earnings')}
        className="text-[16px] font-semibold hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1.5"
        style={{ letterSpacing: '-0.03em' }}
      >
        <Link2 className="h-4 w-4 text-foreground/40" />
        <span className="text-foreground/40">Chase Savings **9070</span>
        <ChevronRight className="h-4 w-4 text-foreground/40" />
      </button>
    )
  }

  return (
    <button 
      onClick={() => {
        // Simulate bank connection (in real app, would integrate with Plaid)
        if (user?.id) {
          localStorage.setItem(`bank_connected_${user.id}`, 'true')
          window.location.reload() // Refresh to show connected state
        }
      }}
      className="text-[16px] font-semibold hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1.5"
      style={{ letterSpacing: '-0.03em' }}
    >
      <Link2 className="h-4 w-4 text-foreground/60" />
      <span className="text-foreground/60">Connect your account</span>
      <ChevronRight className="h-4 w-4 text-foreground/60" />
    </button>
  )
}

interface Bucket {
  id: string
  title: string
  currentAmount: number
  targetAmount: number
  backgroundColor: string
  apy: number
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  )
}

function HomePageContent() {
  const router = useRouter()
  // Removed unused searchParams and isDemo variables
  const { user, loading: authLoading } = useAuth()
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [mainBucketAmount, setMainBucketAmount] = useState(1200.00)
  const [autoDepositBuckets, setAutoDepositBuckets] = useState<Set<string>>(() => {
    // Initialize instantly from localStorage for immediate UI feedback
    if (typeof window === 'undefined') return new Set()
    
    const initialAutoDepositBuckets = new Set<string>()
    try {
      // Get all auto deposit keys for current user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('auto_deposits_') && !key.includes('undefined')) {
          const bucketId = key.replace('auto_deposits_', '')
          const localAutoDeposits = localStorage.getItem(key)
          if (localAutoDeposits) {
            try {
              const deposits = JSON.parse(localAutoDeposits)
              if (deposits && deposits.length > 0) {
                initialAutoDepositBuckets.add(bucketId)
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.warn('Error loading initial auto deposits from localStorage:', error)
    }
    return initialAutoDepositBuckets
  })
  const [isLoading, setIsLoading] = useState(true)
  // const [hasLoadedFromCache, setHasLoadedFromCache] = useState(false) // Unused variables commented out

  // Remove complex theme management - using CSS classes instead

  // Load from localStorage immediately for fast initial render
  useEffect(() => {
    // Check for demo mode
    const demoMode = localStorage.getItem('demo_mode') === 'true'
    const demoUser = demoMode ? JSON.parse(localStorage.getItem('demo_user') || '{}') : null
    const effectiveUser = user || demoUser
    
    if (!demoMode && authLoading) {
      // Still waiting for auth to resolve
      return
    }
    
    if (!effectiveUser) {
      setIsLoading(false)
      return
    }
    
    // Clean up ALL Main Bucket keys that might be contaminated
    if (typeof window !== 'undefined') {
      // Remove ALL Main Bucket related keys except the current user's
      const keysToCheck = Object.keys(localStorage)
      keysToCheck.forEach(key => {
        // Remove global Main Bucket keys
        if (key === 'main_bucket_transfers' || key === 'activities_main-bucket') {
          console.log(`🧹 Removing contaminated global key: ${key}`)
          localStorage.removeItem(key)
        }
        // Remove Main Bucket keys from OTHER users
        if (key.startsWith('main_bucket_transfers_') && !key.endsWith(effectiveUser.id)) {
          console.log(`🧹 Removing other user's Main Bucket key: ${key}`)
          localStorage.removeItem(key)
        }
        if (key.startsWith('activities_main-bucket_') && !key.endsWith(effectiveUser.id)) {
          console.log(`🧹 Removing other user's activities key: ${key}`)
          localStorage.removeItem(key)
        }
      })
      
      // Don't clear user's Main Bucket data - it's user-specific now
    }
    
    // Load cached data immediately for fast initial render
    const cachedBuckets = localStorage.getItem(`buckets_${effectiveUser.id}`)
    const cachedMainBucket = localStorage.getItem(`mainBucket_${effectiveUser.id}`)
    
    if (cachedBuckets) {
      try {
        setBuckets(JSON.parse(cachedBuckets))
      } catch {
        console.warn('Error parsing cached buckets')
      }
    }
    if (cachedMainBucket) {
      try {
        setMainBucketAmount(JSON.parse(cachedMainBucket).currentAmount)
      } catch {
        console.warn('Error parsing cached main bucket')
      }
    }
    
    // Show cached data immediately
    if (cachedBuckets || cachedMainBucket) {
      setIsLoading(false)
    }
    
    const initializeData = async () => {
      
      try {
        // Auto-deposits are now handled by server-side cron jobs
        // No need to execute them in the client to avoid conflicts
        
        // Load user's buckets directly from database
        const userBuckets = await bucketService.getBuckets(user?.id || '')
        
        // Transform database buckets to local format (even if empty)
        const transformedBuckets = userBuckets.map(bucket => ({
          id: bucket.id,
          title: bucket.title,
          currentAmount: bucket.current_amount,
          targetAmount: bucket.target_amount,
          backgroundColor: bucket.background_color,
          apy: bucket.apy
        }))
        
        if (userBuckets.length > 0) {
          
          setBuckets(transformedBuckets)
          
          // First, load auto deposits instantly from localStorage (for immediate UI feedback)
          const instantAutoDepositBuckets = new Set<string>()
          transformedBuckets.forEach(bucket => {
            const autoDepositsKey = `auto_deposits_${bucket.id}`
            const localAutoDeposits = localStorage.getItem(autoDepositsKey)
            if (localAutoDeposits) {
              try {
                const deposits = JSON.parse(localAutoDeposits)
                if (deposits && deposits.length > 0) {
                  instantAutoDepositBuckets.add(bucket.id)
                }
              } catch (error) {
                console.warn('Error parsing local auto deposits:', error)
              }
            }
          })
          setAutoDepositBuckets(instantAutoDepositBuckets)
          
          // Then, check database in background for accuracy and sync
          const autoDepositChecks = await Promise.all(
            userBuckets.map(async (bucket) => {
              try {
                // Always check database first for accurate state
                const autoDeposits = await autoDepositService.getBucketAutoDeposits(bucket.id)
                const hasAutoDeposit = autoDeposits.length > 0
                
                // Update localStorage to match database state
                const autoDepositsKey = `auto_deposits_${bucket.id}`
                if (hasAutoDeposit) {
                  localStorage.setItem(autoDepositsKey, JSON.stringify(autoDeposits))
                } else {
                  localStorage.removeItem(autoDepositsKey)
                }
                
                return { bucketId: bucket.id, hasAutoDeposit }
              } catch (error) {
                console.warn(`Error checking auto deposits for bucket ${bucket.id}:`, error)
                return { bucketId: bucket.id, hasAutoDeposit: false }
              }
            })
          )
          
          const bucketsWithAutoDeposits = new Set(
            autoDepositChecks
              .filter(check => check.hasAutoDeposit)
              .map(check => check.bucketId)
          )
          setAutoDepositBuckets(bucketsWithAutoDeposits)
          
          // Save to localStorage for quick access (user-specific)
          localStorage.setItem(`buckets_${user?.id}`, JSON.stringify(transformedBuckets))
        } else {
          // New user - start with empty buckets
          setBuckets([])
          localStorage.removeItem(`buckets_${user?.id}`)
        }

        // Load user's main bucket
        const mainBucket = await mainBucketService.getMainBucket(user?.id || '')
        if (mainBucket) {
          // Calculate what the Main Bucket SHOULD be
          const bucketsSum = transformedBuckets.reduce((sum, bucket) => sum + bucket.currentAmount, 0)
          const correctMainBucketAmount = 1200 - bucketsSum
          
          // Use the correct amount
          setMainBucketAmount(correctMainBucketAmount)
          localStorage.setItem(`mainBucket_${user?.id}`, JSON.stringify({ currentAmount: correctMainBucketAmount }))
          
          // Update database if needed
          if (Math.abs(mainBucket.current_amount - correctMainBucketAmount) > 0.01) {
            await mainBucketService.updateMainBucket(user?.id || '', correctMainBucketAmount)
          }
        } else {
          // Create initial main bucket for new user
          const bucketsSum = transformedBuckets.reduce((sum, bucket) => sum + bucket.currentAmount, 0)
          const initialMainBucketAmount = 1200 - bucketsSum
          
          await mainBucketService.updateMainBucket(user?.id || '', initialMainBucketAmount)
          setMainBucketAmount(initialMainBucketAmount)
          localStorage.setItem(`mainBucket_${user?.id}`, JSON.stringify({ currentAmount: initialMainBucketAmount }))
        }
        
        // DISABLED: Sync Main Bucket balance - was causing reset to 1200
        // The balance is now properly managed through direct updates
        /*
        if (user?.id) {
          syncMainBucketBalance(user.id).then(correctedBalance => {
            if (correctedBalance !== undefined) {
              setMainBucketAmount(correctedBalance)
              localStorage.setItem(`mainBucket_${user.id}`, JSON.stringify({ currentAmount: correctedBalance }))
            }
          }).catch(error => {
            console.error('Error syncing Main Bucket balance:', error)
          })
          
          // Also check for missing Main Bucket activities
          createMissingMainBucketActivities(user.id).catch(error => {
            console.error('Error creating missing activities:', error)
          })
        }
        */
        
      } catch (error) {
        console.error('Error loading user data:', error)
        // Fallback to localStorage if database fails
        const cachedBuckets = localStorage.getItem(`buckets_${user?.id}`)
        const cachedMainBucket = localStorage.getItem(`mainBucket_${user?.id}`)
        
        if (cachedBuckets) {
          setBuckets(JSON.parse(cachedBuckets))
        }
        if (cachedMainBucket) {
          setMainBucketAmount(JSON.parse(cachedMainBucket).currentAmount)
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    // Only load fresh data from database if we have a real authenticated user
    if (effectiveUser && !demoMode) {
      // Defer data loading slightly to ensure auth is fully settled
      setTimeout(() => {
        // Set a maximum loading time of 3 seconds
        const loadingTimeout = setTimeout(() => {
          setIsLoading(false)
        }, 3000)
        
        initializeData().finally(() => {
          clearTimeout(loadingTimeout)
        })
      }, 100)
    } else if (demoMode) {
      setIsLoading(false)
    }
  }, [user, authLoading])

  // Save buckets to localStorage whenever buckets change (user-specific)
  useEffect(() => {
    if (user && buckets.length > 0) {
      localStorage.setItem(`buckets_${user.id}`, JSON.stringify(buckets))
    }
  }, [buckets, user])

  // Total balance should always be $1200 (initial amount for all users)
  // Money just moves between buckets, total never changes
  const TOTAL_BALANCE = 1200
  useEffect(() => {
    setTotalBalance(TOTAL_BALANCE)
  }, [])
  
  // Recalculate Main Bucket based on Total Balance minus sum of buckets
  useEffect(() => {
    if (user) {
      // Calculate sum of all bucket amounts
      const bucketsSum = buckets.reduce((sum, bucket) => sum + bucket.currentAmount, 0)
      
      // Main Bucket = Total Balance - Sum of all buckets
      const correctMainBucketAmount = TOTAL_BALANCE - bucketsSum
      
      // Update Main Bucket if different
      if (Math.abs(mainBucketAmount - correctMainBucketAmount) > 0.01) {
        console.log('📊 Recalculating Main Bucket:', {
          totalBalance: TOTAL_BALANCE,
          bucketsSum,
          correctMainBucketAmount,
          currentMainBucketAmount: mainBucketAmount
        })
        
        setMainBucketAmount(correctMainBucketAmount)
        
        // Update localStorage
        localStorage.setItem(`mainBucket_${user.id}`, JSON.stringify({ 
          currentAmount: correctMainBucketAmount 
        }))
        
        // Update database
        mainBucketService.updateMainBucket(user.id, correctMainBucketAmount).catch(error => {
          console.error('Error updating main bucket in database:', error)
        })
      }
    }
  }, [buckets, user, mainBucketAmount])
  
  // Auto-deposits are now handled by server-side cron jobs
  // This useEffect is disabled to avoid conflicts with server execution
  // useEffect(() => {
  //   if (!user?.id) return
  //   
  //   const checkAutoDeposits = async () => {
  //     console.log('Auto-deposits are handled server-side via cron jobs')
  //   }
  //   checkAutoDeposits()
  // }, [user?.id])
  
  /*
  // DISABLED: Check and execute auto-deposits periodically (once when app opens)
  useEffect(() => {
    if (!user?.id) return
    
    const checkAutoDeposits = async () => {
      // Check if we've already executed today
      const lastExecutionKey = `last_auto_deposit_check_${user.id}`
      const lastExecution = localStorage.getItem(lastExecutionKey)
      const today = new Date().toISOString().split('T')[0]
      
      if (lastExecution === today) {
        console.log('Auto-deposits already checked today')
        return
      }
      
      try {
        const result = await autoDepositService.executeAutoDeposits(user.id)
        if (result.executed > 0) {
          console.log(`✅ Executed ${result.executed} auto-deposits`)
          // Refresh buckets to show updated amounts
          const userBuckets = await bucketService.getBuckets(user.id)
          if (userBuckets.length > 0) {
            const transformedBuckets = userBuckets.map(bucket => ({
              id: bucket.id,
              title: bucket.title,
              currentAmount: bucket.current_amount,
              targetAmount: bucket.target_amount,
              backgroundColor: bucket.background_color,
              apy: bucket.apy
            }))
            setBuckets(transformedBuckets)
            // Update localStorage
            localStorage.setItem(`buckets_${user.id}`, JSON.stringify(transformedBuckets))
          }
        }
        // Mark as checked for today
        localStorage.setItem(lastExecutionKey, today)
      } catch (error) {
        console.warn('Failed to check auto-deposits:', error)
      }
    }
    
    // Check on mount and when becoming visible
    checkAutoDeposits()
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAutoDeposits()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])
  */

  // Refresh buckets when returning from other pages (user-specific)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        try {
          // Refresh from localStorage first for immediate update
          const cachedBuckets = localStorage.getItem(`buckets_${user.id}`)
          if (cachedBuckets) {
            try {
              setBuckets(JSON.parse(cachedBuckets))
            } catch {
              console.warn('Error parsing cached buckets during refresh')
            }
          }
          
          // Also refresh Main Bucket from localStorage for immediate update
          const cachedMainBucket = localStorage.getItem(`mainBucket_${user.id}`)
          if (cachedMainBucket) {
            try {
              const mainBucketData = JSON.parse(cachedMainBucket)
              setMainBucketAmount(mainBucketData.currentAmount)
            } catch {
              console.warn('Error parsing cached main bucket during refresh')
            }
          }
          
          // Refresh from database when page becomes visible
          const userBuckets = await bucketService.getBuckets(user?.id || '')
          
          if (userBuckets.length > 0) {
            const transformedBuckets = userBuckets.map(bucket => ({
              id: bucket.id,
              title: bucket.title,
              currentAmount: bucket.current_amount,
              targetAmount: bucket.target_amount,
              backgroundColor: bucket.background_color,
              apy: bucket.apy
            }))
            
            setBuckets(transformedBuckets)
            
            // First, load auto deposits instantly from localStorage (for immediate UI feedback)
            const instantAutoDepositBuckets = new Set<string>()
            transformedBuckets.forEach(bucket => {
              const autoDepositsKey = `auto_deposits_${bucket.id}`
              const localAutoDeposits = localStorage.getItem(autoDepositsKey)
              if (localAutoDeposits) {
                try {
                  const deposits = JSON.parse(localAutoDeposits)
                  if (deposits && deposits.length > 0) {
                    instantAutoDepositBuckets.add(bucket.id)
                  }
                } catch (error) {
                  console.warn('Error parsing local auto deposits during refresh:', error)
                }
              }
            })
            setAutoDepositBuckets(instantAutoDepositBuckets)
            
            // Also refresh auto deposit status from database for accuracy
            const autoDepositChecks = await Promise.all(
              userBuckets.map(async (bucket) => {
                try {
                  // Always check database first for accurate state
                  const autoDeposits = await autoDepositService.getBucketAutoDeposits(bucket.id)
                  const hasAutoDeposit = autoDeposits.length > 0
                  
                  // Update localStorage to match database state
                  const autoDepositsKey = `auto_deposits_${bucket.id}`
                  if (hasAutoDeposit) {
                    localStorage.setItem(autoDepositsKey, JSON.stringify(autoDeposits))
                  } else {
                    localStorage.removeItem(autoDepositsKey)
                  }
                  
                  return { bucketId: bucket.id, hasAutoDeposit }
                } catch (error) {
                  console.warn(`Error refreshing auto deposits for bucket ${bucket.id}:`, error)
                  return { bucketId: bucket.id, hasAutoDeposit: false }
                }
              })
            )
            
            const bucketsWithAutoDeposits = new Set(
              autoDepositChecks
                .filter(check => check.hasAutoDeposit)
                .map(check => check.bucketId)
            )
            setAutoDepositBuckets(bucketsWithAutoDeposits)
          }
          
          // Also refresh main bucket amount
          const mainBucket = await mainBucketService.getMainBucket(user?.id || '')
          if (mainBucket) {
            setMainBucketAmount(mainBucket.current_amount)
          }
        } catch (error) {
          console.error('Error refreshing user data:', error)
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also listen for window focus to immediately refresh auto deposit status
    const handleWindowFocus = () => {
      if (user) {
        handleVisibilityChange()
      }
    }
    window.addEventListener('focus', handleWindowFocus)
    
    // Listen for localStorage changes (from other tabs or components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `mainBucket_${user?.id}` && e.newValue) {
        try {
          const mainBucketData = JSON.parse(e.newValue)
          setMainBucketAmount(mainBucketData.currentAmount)
        } catch {
          console.warn('Error parsing main bucket from storage event')
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Check auto deposits periodically 
    // For development/testing, execute auto deposits every 30 seconds from client
    const checkAndExecuteAutoDeposits = async () => {
      if (buckets.length > 0 && user) {
        // Execute auto deposits (temporary for testing until server cron is deployed)
        try {
          console.log('🔄 Checking for auto deposits to execute...', new Date().toISOString())
          const result = await autoDepositService.executeAutoDeposits(user.id)
          console.log('🔄 Auto-deposit check result:', result)
          if (result.executed > 0) {
            console.log(`✅ Executed ${result.executed} auto-deposits`)
            // Refresh buckets to show updated amounts
            const userBuckets = await bucketService.getBuckets(user.id)
            if (userBuckets.length > 0) {
              const transformedBuckets = userBuckets.map(bucket => ({
                id: bucket.id,
                title: bucket.title,
                currentAmount: bucket.current_amount,
                targetAmount: bucket.target_amount,
                backgroundColor: bucket.background_color,
                apy: bucket.apy
              }))
              setBuckets(transformedBuckets)
              localStorage.setItem(`buckets_${user.id}`, JSON.stringify(transformedBuckets))
            }
          } else {
            console.log('📅 No auto-deposits executed this check')
          }
        } catch (error) {
          console.error('Auto-deposit execution error:', error)
        }
        
        const autoDepositChecks = await Promise.all(
          buckets.map(async (bucket) => {
            try {
              // Always check database first for most accurate state
              const autoDeposits = await autoDepositService.getBucketAutoDeposits(bucket.id)
              const hasAutoDeposit = autoDeposits.length > 0
              
              // Keep localStorage in sync with database
              const autoDepositsKey = `auto_deposits_${bucket.id}`
              if (hasAutoDeposit) {
                localStorage.setItem(autoDepositsKey, JSON.stringify(autoDeposits))
              } else {
                localStorage.removeItem(autoDepositsKey)
              }
              
              return { bucketId: bucket.id, hasAutoDeposit }
            } catch (error) {
              console.warn(`Error checking auto deposits for bucket ${bucket.id}:`, error)
              // If database check fails, maintain current state
              return { bucketId: bucket.id, hasAutoDeposit: autoDepositBuckets.has(bucket.id) }
            }
          })
        )
        
        const bucketsWithAutoDeposits = new Set(
          autoDepositChecks
            .filter(check => check.hasAutoDeposit)
            .map(check => check.bucketId)
        )
        setAutoDepositBuckets(bucketsWithAutoDeposits)
      }
    }
    
    // Auto-deposit execution - now with proper safeguards
    // Only check once on mount, then every 4 hours (will move to server-side cron job)
    
    // Execute after a delay to avoid initial load issues
    const executeTimeout = setTimeout(() => {
      checkAndExecuteAutoDeposits()
    }, 5000) // Wait 5 seconds after mount
    
    // Then check every 4 hours (reduced frequency to prevent overload)
    const interval = setInterval(checkAndExecuteAutoDeposits, 4 * 60 * 60 * 1000) // Check every 4 hours
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('storage', handleStorageChange)
      clearTimeout(executeTimeout)
      clearInterval(interval)
    }
  }, [user, buckets]) // Removed autoDepositBuckets to prevent infinite re-renders

  // Listen for localStorage changes (e.g., when buckets are deleted)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (user && e.key === `buckets_${user.id}`) {
        try {
          const updatedBuckets = e.newValue ? JSON.parse(e.newValue) : []
          setBuckets(updatedBuckets)
          console.log('Buckets updated from storage event:', updatedBuckets.length)
        } catch {
          console.warn('Error parsing updated buckets from storage event')
        }
      }
      if (user && e.key === `mainBucket_${user.id}`) {
        try {
          const updatedMainBucket = e.newValue ? JSON.parse(e.newValue) : { currentAmount: 0 }
          setMainBucketAmount(updatedMainBucket.currentAmount)
          console.log('Main bucket updated from storage event:', updatedMainBucket.currentAmount)
        } catch {
          console.warn('Error parsing updated main bucket from storage event')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user])

  const handleBucketClick = (bucket: Bucket) => {
    const params = new URLSearchParams({
      id: bucket.id || '',
      title: bucket.title || '',
      currentAmount: (bucket.currentAmount || 0).toString(),
      targetAmount: (bucket.targetAmount || 0).toString(),
      backgroundColor: bucket.backgroundColor || '#ffffff',
      apy: (bucket.apy || 0).toString()
    })
    router.push(`/bucket-details?${params.toString()}`)
  }

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


  // Show skeleton loading while auth is loading or data is loading
  if (authLoading || (isLoading && !user)) {
    return (
      <div className="min-h-screen bg-background transition-all duration-500 ease-out">
        <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
          <HeaderSkeleton />
          <BalanceSkeleton />
          <MainBucketSkeleton />
          <div className="space-y-4">
            <BucketCardSkeleton />
            <BucketCardSkeleton />
            <BucketCardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      {/* Sticky Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 bg-background border-b border-foreground/10 transition-all duration-300 ${
          showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-[660px] mx-auto px-12 py-4 max-sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={() => router.push('/create-bucket')}>
                Create bucket
              </Button>
              <Button variant="secondary" onClick={() => router.push('/add-money?source=/home')}>
                Move money
              </Button>
            </div>
            <AvatarDropdown initial={user?.name?.charAt(0) || user?.email?.charAt(0) || "U"} />
          </div>
        </div>
      </div>

      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Top row with buttons and avatar */}
        <div ref={headerRef} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={() => router.push('/create-bucket')}>
              Create bucket
            </Button>
            <Button variant="secondary" onClick={() => router.push('/add-money')}>
              Move money
            </Button>
            
          </div>
          <AvatarDropdown initial={user?.name?.charAt(0) || user?.email?.charAt(0) || "U"} />
        </div>

        {/* Balance section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-[-6px]">
              <p 
                className="text-[16px] font-semibold text-foreground/50"
                style={{ letterSpacing: '-0.03em' }}
              >
                Total balance
              </p>
            </div>
            <p 
              className="text-[32px] font-extrabold text-foreground"
              style={{ letterSpacing: '-0.04em', marginBottom: '-6px' }}
            >
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <BankAccountButton />
          </div>
        </div>

        {/* Main Bucket Card */}
        <div 
          className="p-5 md:p-8 rounded-[20px] mb-4 cursor-pointer transition-all duration-300 ease-out relative z-0 main-bucket-card"
          style={{ 
            animation: 'fadeInUp 0.6s ease-out 0s both'
          }}
          onClick={() => {
            const params = new URLSearchParams({
              id: 'main-bucket',
              title: 'Main Bucket',
              currentAmount: mainBucketAmount.toString(),
              targetAmount: '1200.00',
              backgroundColor: '#E5E7EB',
              apy: '0'
            })
            router.push(`/bucket-details?${params.toString()}`)
          }}
        >
          {/* Header with title - matching bucket card styling but theme-aware text */}
          <div className="mb-0">
            <h3 className="text-[20px] md:text-[24px] font-extrabold text-foreground" style={{ letterSpacing: '-0.04em' }}>
              Main Bucket 🏦
            </h3>
          </div>
          
          {/* Amount section - matching bucket card styling but theme-aware text */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] md:text-[20px] font-semibold tracking-tight text-foreground">
                ${mainBucketAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Bucket cards */}
        <div className="space-y-4">
          {buckets.map((bucket, index) => (
            <div 
              key={bucket.id}
              onClick={() => handleBucketClick(bucket)} 
              className="cursor-pointer transform transition-all duration-300 hover:scale-[0.98] active:scale-[0.96]"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
              }}
            >
              <BucketCard
                title={bucket.title}
                currentAmount={bucket.currentAmount}
                targetAmount={bucket.targetAmount}
                backgroundColor={bucket.backgroundColor}
                hasAutoDeposit={autoDepositBuckets.has(bucket.id)}
              />
            </div>
          ))}
        </div>

        {/* Add bottom padding to account for tab bar */}
        <div className="h-20"></div>
      </div>

      {/* Tab Bar Navigation */}
      <TabBar />
    </div>
  )
}