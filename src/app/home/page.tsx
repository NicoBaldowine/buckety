"use client"

import { Button } from "@/components/ui/button"
import { BucketCard } from "@/components/ui/bucket-card"
import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"

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
  const mainBucketRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const amountRef = useRef<HTMLSpanElement>(null)
  const [totalBalance, setTotalBalance] = useState(0)
  const mainBucketAmount = 1200.00

  // Set initial dark mode background and monitor changes
  useEffect(() => {
    const updateMainBucketTheme = () => {
      if (mainBucketRef.current) {
        const theme = document.documentElement.getAttribute('data-theme')
        console.log('Current theme:', theme) // Debug log
        const isDark = theme === 'dark'
        const backgroundColor = isDark ? '#272727' : '#F4F4F4'
        const textColor = isDark ? '#ffffff' : '#000000'
        console.log('Setting background to:', backgroundColor, 'text to:', textColor) // Debug log
        
        mainBucketRef.current.style.backgroundColor = backgroundColor
        
        if (titleRef.current) {
          titleRef.current.style.color = textColor
        }
        if (amountRef.current) {
          amountRef.current.style.color = textColor
        }
      }
    }
    
    // Set initial theme immediately and also with delay
    updateMainBucketTheme()
    const timeout = setTimeout(updateMainBucketTheme, 100)
    const timeout2 = setTimeout(updateMainBucketTheme, 500)
    
    // Listen for theme changes using data-theme attribute
    const observer = new MutationObserver(() => {
      setTimeout(updateMainBucketTheme, 10)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    
    // Also listen for storage events in case theme is changed in another tab
    const handleStorageChange = () => {
      setTimeout(updateMainBucketTheme, 10)
    }
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearTimeout(timeout)
      clearTimeout(timeout2)
      observer.disconnect()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Load buckets from localStorage on mount
  useEffect(() => {
    const savedBuckets = localStorage.getItem('buckets')
    if (savedBuckets) {
      setBuckets(JSON.parse(savedBuckets))
    } else {
      // First time user - set default buckets
      setBuckets(defaultBuckets)
      localStorage.setItem('buckets', JSON.stringify(defaultBuckets))
    }
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

  // Check for new bucket from create page (runs after buckets are loaded)
  useEffect(() => {
    if (buckets.length === 0) return // Wait for buckets to be loaded first
    
    const newBucketData = localStorage.getItem('newBucket')
    if (newBucketData) {
      const newBucket = JSON.parse(newBucketData)
      
      // Add to top of buckets
      setBuckets(prevBuckets => [newBucket, ...prevBuckets])
      
      // Clean up localStorage
      localStorage.removeItem('newBucket')
    }
  }, [buckets.length]) // Depend on buckets.length to run after initial load

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
          ref={mainBucketRef}
          className="p-8 rounded-[32px] mb-4 cursor-pointer transition-all duration-300 ease-out hover:brightness-95"
          style={{ 
            animation: 'fadeInUp 0.6s ease-out 0s both'
          }}
          onMouseEnter={(e) => {
            const theme = document.documentElement.getAttribute('data-theme')
            const isDark = theme === 'dark'
            e.currentTarget.style.backgroundColor = isDark ? '#1F1F1F' : '#E5E7EB'
          }}
          onMouseLeave={(e) => {
            const theme = document.documentElement.getAttribute('data-theme')
            const isDark = theme === 'dark'
            e.currentTarget.style.backgroundColor = isDark ? '#272727' : '#F4F4F4'
          }}
          onClick={() => {
            const params = new URLSearchParams({
              id: 'main-bucket',
              title: 'Main Bucket',
              currentAmount: '1200.00',
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
                <h3 ref={titleRef} className="text-[20px] font-bold tracking-tight" style={{ color: '#000' }}>
                  Main Bucket 🏦
                </h3>
              </div>
              
              {/* Amount section - single amount only */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span ref={amountRef} className="text-[32px] font-semibold tracking-tight" style={{ color: '#000' }}>
                    $1,200.00
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
                className="bg-transparent border border-black/20 text-black hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
              >
                Add balance
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