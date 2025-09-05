"use client"

import { Button } from "@/components/ui/button"
import { BucketCard } from "@/components/ui/bucket-card"
import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { HeaderSkeleton, BalanceSkeleton, MainBucketSkeleton, BucketCardSkeleton } from "@/components/ui/skeleton-loader"
import { TabBar } from "@/components/ui/tab-bar"
import { Info, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { autoDepositService, bucketService, mainBucketService } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface Bucket {
  id: string
  title: string
  currentAmount: number
  targetAmount: number
  backgroundColor: string
  apy: number
}

/*
const defaultBuckets = [
  {
    id: "vacation",
    title: "Vacation Fund 🏖️",
    currentAmount: 1250,
    targetAmount: 3000,
    apy: 3.8,
    backgroundColor: "#B6F3AD"
  },
  {
    id: "emergency",
    title: "Emergency Fund 🚨", 
    currentAmount: 890,
    targetAmount: 2000,
    apy: 4.2,
    backgroundColor: "#BFB0FF"
  },
  {
    id: "car",
    title: "New Car 🚗",
    currentAmount: 2300,
    targetAmount: 8000,
    apy: 3.5,
    backgroundColor: "#FDB86A"
  },
  {
    id: "drumset",
    title: "Electronic Drumset 🥁",
    currentAmount: 675,
    targetAmount: 1500,
    apy: 4.0,
    backgroundColor: "#FF97D0"
  },
  {
    id: "gaming",
    title: "Gaming Setup 🎮",
    currentAmount: 420,
    targetAmount: 2500,
    apy: 3.9,
    backgroundColor: "#A3D5FF"
  },
  {
    id: "coffee",
    title: "Coffee Shop Business ☕",
    currentAmount: 1800,
    targetAmount: 5000,
    apy: 4.1,
    backgroundColor: "#FFB366"
  }
]
*/

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
  const [autoDepositBuckets, setAutoDepositBuckets] = useState<Set<string>>(new Set())
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
        // Load user's buckets directly from database
        const userBuckets = await bucketService.getBuckets(user?.id || '')
        
        if (userBuckets.length > 0) {
          // Transform database buckets to local format
          const transformedBuckets = userBuckets.map(bucket => ({
            id: bucket.id,
            title: bucket.title,
            currentAmount: bucket.current_amount,
            targetAmount: bucket.target_amount,
            backgroundColor: bucket.background_color,
            apy: bucket.apy
          }))
          
          setBuckets(transformedBuckets)
          
          // Check for auto deposits for each bucket (localStorage first, then database)
          const autoDepositChecks = await Promise.all(
            userBuckets.map(async (bucket) => {
              // First check localStorage
              const autoDepositsKey = `auto_deposits_${bucket.id}`
              const localAutoDeposits = localStorage.getItem(autoDepositsKey)
              
              if (localAutoDeposits) {
                try {
                  const deposits = JSON.parse(localAutoDeposits)
                  return { bucketId: bucket.id, hasAutoDeposit: Array.isArray(deposits) && deposits.length > 0 }
                } catch {
                  // If parse fails, check database
                }
              }
              
              // If no localStorage or parse failed, check database
              const autoDeposits = await autoDepositService.getBucketAutoDeposits(bucket.id)
              return { bucketId: bucket.id, hasAutoDeposit: autoDeposits.length > 0 }
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
          setMainBucketAmount(mainBucket.current_amount)
          localStorage.setItem(`mainBucket_${user?.id}`, JSON.stringify({ currentAmount: mainBucket.current_amount }))
        } else {
          // Create initial main bucket for new user
          await mainBucketService.updateMainBucket(user?.id || '', 1200.00)
          setMainBucketAmount(1200.00)
          localStorage.setItem(`mainBucket_${user?.id}`, JSON.stringify({ currentAmount: 1200.00 }))
        }
        
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

  // Calculate total balance whenever buckets change
  useEffect(() => {
    const bucketsTotal = buckets.reduce((sum, bucket) => sum + bucket.currentAmount, 0)
    const total = mainBucketAmount + bucketsTotal
    setTotalBalance(total)
  }, [buckets, mainBucketAmount])

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
            
            // Also refresh auto deposit status (localStorage first, then database)
            const autoDepositChecks = await Promise.all(
              userBuckets.map(async (bucket) => {
                // First check localStorage
                const autoDepositsKey = `auto_deposits_${bucket.id}`
                const localAutoDeposits = localStorage.getItem(autoDepositsKey)
                
                if (localAutoDeposits) {
                  try {
                    const deposits = JSON.parse(localAutoDeposits)
                    return { bucketId: bucket.id, hasAutoDeposit: Array.isArray(deposits) && deposits.length > 0 }
                  } catch {
                    // If parse fails, check database
                  }
                }
                
                // If no localStorage or parse failed, check database
                const autoDeposits = await autoDepositService.getBucketAutoDeposits(bucket.id)
                return { bucketId: bucket.id, hasAutoDeposit: autoDeposits.length > 0 }
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
    
    // Also check auto deposits periodically to catch cancellations
    // Only check every 5 seconds to avoid flashing, and check both localStorage and database
    const interval = setInterval(async () => {
      if (buckets.length > 0 && user) {
        const autoDepositChecks = await Promise.all(
          buckets.map(async (bucket) => {
            const autoDepositsKey = `auto_deposits_${bucket.id}`
            const localAutoDeposits = localStorage.getItem(autoDepositsKey)
            
            if (localAutoDeposits) {
              try {
                const deposits = JSON.parse(localAutoDeposits)
                // Only return true if we have valid deposits
                if (Array.isArray(deposits) && deposits.length > 0) {
                  return { bucketId: bucket.id, hasAutoDeposit: true }
                }
              } catch {
                // Parse failed, check database
              }
            }
            
            // Check database as fallback or if localStorage is empty
            try {
              const autoDeposits = await autoDepositService.getBucketAutoDeposits(bucket.id)
              const hasDeposits = autoDeposits.length > 0
              
              // Update localStorage with the database state
              if (hasDeposits) {
                localStorage.setItem(autoDepositsKey, JSON.stringify(autoDeposits))
              } else {
                localStorage.removeItem(autoDepositsKey)
              }
              
              return { bucketId: bucket.id, hasAutoDeposit: hasDeposits }
            } catch {
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
    }, 5000) // Check every 5 seconds instead of every second
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [user, buckets])

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
              <Button variant="secondary" onClick={() => router.push('/add-money')}>
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
              <div className="relative group">
                <Info className="h-4 w-4 text-foreground/30 hover:text-foreground/50 transition-colors cursor-help" />
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  <div className="text-center">
                    <div>Sum of all buckets earning</div>
                    <div className="font-semibold">6% APY interest</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
            <p 
              className="text-[32px] font-semibold text-foreground"
              style={{ letterSpacing: '-0.03em', marginBottom: '-6px' }}
            >
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <button 
              onClick={() => router.push('/earnings')}
              className="text-[16px] font-semibold hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
              style={{ letterSpacing: '-0.03em' }}
            >
              <span style={{ color: '#19B802' }}>+6%</span>
              <span className="text-foreground ml-1">(${(totalBalance * 0.06).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
              <ChevronRight className="h-4 w-4 text-foreground/50" />
            </button>
          </div>
        </div>

        {/* Main Bucket Card */}
        <div 
          className="p-8 rounded-[24px] mb-4 cursor-pointer transition-all duration-300 ease-out relative z-0 main-bucket-card"
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
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Header with title */}
              <div className="mb-1">
                <h3 className="text-[20px] font-semibold tracking-tight text-foreground">
                  Main Bucket 🏦
                </h3>
              </div>
              
              {/* Amount section - single amount only */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[24px] font-semibold tracking-tight text-foreground">
                    ${mainBucketAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Add balance button */}
            <div className="ml-4">
              <Button 
                variant="secondary"
                onClick={() => {
                  // Handle add balance action - placeholder
                }}
                className="text-[14px] font-medium border border-foreground/20"
              >
                Add funds
              </Button>
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