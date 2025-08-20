"use client"

import { Button } from "@/components/ui/button"
import { BucketCard } from "@/components/ui/bucket-card"
import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"

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

export default function HomePage() {
  const router = useRouter()
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [buckets, setBuckets] = useState<typeof defaultBuckets>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [mainBucketAmount, setMainBucketAmount] = useState(1200.00)

  // Remove complex theme management - using CSS classes instead

  // Initialize from database on mount (hybrid approach)
  useEffect(() => {
    const initializeData = async () => {
      // Load data from database to localStorage
      await HybridStorage.initializeFromDatabase()
      
      // Load buckets from localStorage (now synced with database)
      const localBuckets = HybridStorage.getLocalBuckets()
      if (localBuckets.length > 0) {
        setBuckets(localBuckets)
      } else {
        // First time user - set default buckets (keep for now)
        setBuckets(defaultBuckets)
        localStorage.setItem('buckets', JSON.stringify(defaultBuckets))
      }

      // Load main bucket amount from hybrid storage
      const mainBucket = HybridStorage.getLocalMainBucket()
      setMainBucketAmount(mainBucket.currentAmount)
    }
    
    initializeData()
  }, [])

  // Save buckets to localStorage whenever buckets change
  useEffect(() => {
    if (buckets.length > 0) {
      localStorage.setItem('buckets', JSON.stringify(buckets))
    }
  }, [buckets])

  // Calculate total balance whenever buckets change
  useEffect(() => {
    const bucketsTotal = buckets.reduce((sum, bucket) => sum + bucket.currentAmount, 0)
    const total = mainBucketAmount + bucketsTotal
    setTotalBalance(total)
  }, [buckets, mainBucketAmount])

  // Refresh buckets when returning from other pages (to catch new buckets created via HybridStorage)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh from localStorage when page becomes visible
        const localBuckets = HybridStorage.getLocalBuckets()
        if (localBuckets.length > 0) {
          setBuckets(localBuckets)
        }
        
        // Also refresh main bucket amount
        const mainBucket = HybridStorage.getLocalMainBucket()
        setMainBucketAmount(mainBucket.currentAmount)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleBucketClick = (bucket: typeof buckets[0]) => {
    const params = new URLSearchParams({
      id: bucket.id,
      title: bucket.title,
      currentAmount: bucket.currentAmount.toString(),
      targetAmount: bucket.targetAmount.toString(),
      backgroundColor: bucket.backgroundColor,
      apy: bucket.apy.toString()
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


  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      {/* Sticky Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 bg-background border-b border-foreground/10 transition-all duration-300 ${
          showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-[660px] mx-auto px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={() => router.push('/create-bucket')}>
                Create bucket
              </Button>
              <Button variant="secondary" onClick={() => router.push('/add-money')}>
                Move money
              </Button>
            </div>
            <AvatarDropdown initial="N" />
          </div>
        </div>
      </div>

      <div className="max-w-[660px] mx-auto px-12 py-6">
        {/* Top row with buttons and avatar */}
        <div ref={headerRef} className="flex items-center justify-between mb-15">
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={() => router.push('/create-bucket')}>
              Create bucket
            </Button>
            <Button variant="secondary" onClick={() => router.push('/add-money')}>
              Move money
            </Button>
          </div>
          <AvatarDropdown initial="N" />
        </div>

        {/* Balance section */}
        <div className="flex items-center justify-between mb-10">
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
                    <div className="font-semibold">7.5% APY interest</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
            <p 
              className="text-[40px] font-semibold text-foreground"
              style={{ letterSpacing: '-0.03em', marginBottom: '-6px' }}
            >
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <button 
              className="text-[16px] font-semibold hover:opacity-80 transition-opacity cursor-pointer"
              style={{ letterSpacing: '-0.03em' }}
            >
              <span style={{ color: '#19B802' }}>+7.5%</span>
              <span className="text-foreground ml-1">(${(totalBalance * 0.075).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
            </button>
          </div>
        </div>

        {/* Main Bucket Card */}
        <div 
          className="p-8 rounded-[32px] mb-4 cursor-pointer transition-all duration-300 ease-out relative z-0 main-bucket-card"
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
                <h3 className="text-[20px] font-bold tracking-tight text-foreground">
                  Main Bucket 🏦
                </h3>
              </div>
              
              {/* Amount section - single amount only */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[32px] font-semibold tracking-tight text-foreground">
                    ${mainBucketAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Add balance button */}
            <div className="ml-4">
              <Button 
                variant="secondary" 
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle add balance action
                }}
                className="main-bucket-button"
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
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}