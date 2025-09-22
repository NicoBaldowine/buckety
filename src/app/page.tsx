"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeIndex, setActiveIndex] = useState(0)
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const headerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Function to set section refs
  const setSectionRef = (sectionName: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[sectionName] = el
  }

  useEffect(() => {
    // Check for demo mode first
    const isDemoMode = localStorage.getItem('demo_mode') === 'true'
    if (isDemoMode) {
      router.push('/home?demo=true')
      return
    }

    
    // If user is already authenticated, redirect to home
    if (!loading && user) {
      router.push('/home')
    }
  }, [user, loading, router])

  // Don't show loading state forever - timeout after 2 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Auth loading timeout, showing landing page')
      }
    }, 2000)
    return () => clearTimeout(timeout)
  }, [loading])

  // Animate bullet points
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3)
    }, 2000) // Change every 2 seconds

    return () => clearInterval(interval)
  }, [])

  // Scroll effects for sticky header and section animations
  useEffect(() => {
    const handleScroll = () => {
      // Sticky header logic
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom
        setShowStickyHeader(headerBottom < 0)
      }

      // Section visibility logic
      const newVisibleSections = new Set<string>()
      Object.entries(sectionRefs.current).forEach(([sectionName, ref]) => {
        if (ref) {
          const rect = ref.getBoundingClientRect()
          // Check if section is in viewport (with some offset for trigger)
          if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
            newVisibleSections.add(sectionName)
          }
        }
      })
      setVisibleSections(newVisibleSections)
    }

    window.addEventListener('scroll', handleScroll)
    // Initial check
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Skip loading state to prevent getting stuck
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-foreground/50">Loading...</div>
  //     </div>
  //   )
  // }

  // Don't show landing page if user is authenticated
  if (!loading && user) {
    return null
  }

  const bulletPoints = [
    "Create Saving buckets for anything.",
    "Pick a product. Start saving with a discount.",
    "Earn high-yield interest."
  ]

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 transition-all duration-300 ${
          showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-10 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative w-44 h-14">
                <Image 
                  src="/zuma-dark.svg" 
                  alt="Zuma Logo" 
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary"
                onClick={() => router.push('/sign-up')}
                className="text-white bg-transparent border-white/20 hover:bg-white/10"
              >
                Sign up
              </Button>
              <Button 
                variant="primary"
                onClick={() => router.push('/login')}
                className="bg-white text-black hover:bg-white/90 px-8 py-3 text-[16px] font-medium"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ backgroundColor: '#232323', height: '820px' }}>
        {/* Container with max-width 1200px and 40px horizontal padding */}
        <div className="max-w-[1200px] mx-auto px-10 h-full flex flex-col">
        {/* Header */}
        <header 
          ref={headerRef}
          className="flex items-center justify-between py-6"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <div className="flex items-center">
            {/* Zuma logo - 10% smaller */}
            <div className="relative w-44 h-14">
              <Image 
                src="/zuma-dark.svg" 
                alt="Zuma Logo" 
                fill
                className="object-contain object-left"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary"
              onClick={() => router.push('/sign-up')}
              className="text-white bg-transparent border-white/20 hover:bg-white/10"
            >
              Sign up
            </Button>
            <Button 
              variant="primary"
              onClick={() => router.push('/login')}
              className="bg-white text-black hover:bg-white/90"
            >
              Login
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center" style={{ marginTop: '-40px' }}>
          <div className="max-w-2xl">
            {/* Main Heading */}
            <h1 
              className="text-[56px] font-extrabold text-white leading-[1.1] mb-6" 
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em', animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
            >
              Modern savings account.<br />
              Personalized to you.
            </h1>

            {/* Description bullets with highlighting animation */}
            <div 
              className="space-y-1 mb-8"
              style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
            >
              {bulletPoints.map((text, index) => (
                <p 
                  key={index}
                  className="text-[14px] leading-relaxed transition-all duration-500 ease-in-out" 
                  style={{ 
                    letterSpacing: '0%',
                    color: activeIndex === index ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                    transform: activeIndex === index ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  <span 
                    style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: activeIndex === index ? '#ffffff' : 'transparent',
                      marginRight: '8px',
                      transition: 'all 0.5s ease-in-out',
                      verticalAlign: 'middle',
                      border: activeIndex === index ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  {text}
                </p>
              ))}
            </div>

            {/* CTA Button */}
            <Button 
              variant="primary"
              onClick={() => router.push('/sign-up')}
              className="bg-white text-black hover:bg-white/90 px-8 py-3 text-[16px] font-medium"
              style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
            >
              Get Started
            </Button>
          </div>
        </main>
        </div>
      </div>

      {/* Second Section - Bucket Visualization */}
      <div 
        ref={setSectionRef('buckets')}
        style={{ backgroundColor: '#ffffff', height: '760px' }}
      >
        <div className="max-w-[1200px] mx-auto px-10 h-full flex items-center">
          <div className="grid grid-cols-2 gap-20 items-center w-full">
            {/* Left side - Visual placeholder */}
            <div 
              className="flex items-center justify-center"
              style={{ 
                animation: visibleSections.has('buckets') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('buckets') ? 1 : 0,
                transform: visibleSections.has('buckets') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              <div 
                style={{ 
                  width: '545px', 
                  height: '508px', 
                  backgroundColor: '#F3F0F0',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
              </div>
            </div>

            {/* Right side - Content */}
            <div 
              className="max-w-xl"
              style={{ 
                animation: visibleSections.has('buckets') ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
                opacity: visibleSections.has('buckets') ? 1 : 0,
                transform: visibleSections.has('buckets') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out 0.1s'
              }}
            >
              <h2 
                className="text-[48px] font-extrabold text-[#1A1A1A] leading-[1.1] mb-6" 
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
              >
                Create custom buckets.<br />
                Track everything.
              </h2>
              
              <p 
                className="text-[14px] text-[#7E7676] leading-[1.4] mb-8"
                style={{ letterSpacing: '0%' }}
              >
                Set savings goals your way. Create personalized buckets and monitor<br />
                every deposit and withdrawal with full transparency.
              </p>

              <Button 
                variant="secondary"
                onClick={() => router.push('/sign-up')}
                className="bg-white text-black border border-black hover:bg-gray-50 px-8 py-3 text-[16px] font-medium"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Third Section - Marketplace/Discounts (Dark with reversed layout) */}
      <div 
        ref={setSectionRef('marketplace')}
        style={{ backgroundColor: '#232323', height: '760px' }}
      >
        <div className="max-w-[1200px] mx-auto px-10 h-full flex items-center">
          <div className="grid grid-cols-2 gap-20 items-center w-full">
            {/* Left side - Content (reversed position) */}
            <div 
              className="max-w-xl"
              style={{ 
                animation: visibleSections.has('marketplace') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('marketplace') ? 1 : 0,
                transform: visibleSections.has('marketplace') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              <h2 
                className="text-[48px] font-extrabold text-white leading-[1.1] mb-6" 
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
              >
                Save for real things.<br />
                Unlock real discounts.
              </h2>
              
              <p 
                className="text-[14px] leading-[1.4] mb-8"
                style={{ letterSpacing: '0%', color: '#9B9B9B' }}
              >
                Access Zuma's Marketplace with exclusive deals on curated products.<br />
                Each discount includes a goal-driven bucket to help you save and buy<br />
                smarter.
              </p>

              <Button 
                variant="secondary"
                onClick={() => router.push('/sign-up')}
                className="bg-transparent text-white border border-white hover:bg-white/10 px-8 py-3 text-[16px] font-medium"
              >
                Get Started
              </Button>
            </div>

            {/* Right side - Visual placeholder (reversed position) */}
            <div 
              className="flex items-center justify-center"
              style={{ 
                animation: visibleSections.has('marketplace') ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
                opacity: visibleSections.has('marketplace') ? 1 : 0,
                transform: visibleSections.has('marketplace') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out 0.1s'
              }}
            >
              <div 
                style={{ 
                  width: '545px', 
                  height: '508px', 
                  backgroundColor: '#1A1A1A',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fourth Section - Automation (White with normal layout) */}
      <div 
        ref={setSectionRef('automation')}
        style={{ backgroundColor: '#ffffff', height: '760px' }}
      >
        <div className="max-w-[1200px] mx-auto px-10 h-full flex items-center">
          <div className="grid grid-cols-2 gap-20 items-center w-full">
            {/* Left side - Visual placeholder */}
            <div 
              className="flex items-center justify-center"
              style={{ 
                animation: visibleSections.has('automation') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('automation') ? 1 : 0,
                transform: visibleSections.has('automation') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              <div 
                style={{ 
                  width: '545px', 
                  height: '508px', 
                  backgroundColor: '#F3F0F0',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
              </div>
            </div>

            {/* Right side - Content */}
            <div 
              className="max-w-xl"
              style={{ 
                animation: visibleSections.has('automation') ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
                opacity: visibleSections.has('automation') ? 1 : 0,
                transform: visibleSections.has('automation') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out 0.1s'
              }}
            >
              <h2 
                className="text-[48px] font-extrabold text-[#1A1A1A] leading-[1.1] mb-6" 
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
              >
                Move money or<br />
                automate it. Your call.
              </h2>
              
              <p 
                className="text-[14px] text-[#7E7676] leading-[1.4] mb-8"
                style={{ letterSpacing: '0%' }}
              >
                Take control of your savings with flexible automation. Set up<br />
                recurring deposits or move money manually whenever you want.<br />
                The choice is always yours.
              </p>

              <Button 
                variant="secondary"
                onClick={() => router.push('/sign-up')}
                className="bg-white text-black border border-black hover:bg-gray-50 px-8 py-3 text-[16px] font-medium"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Fifth Section - APY Growth (Dark with reversed layout) */}
      <div 
        ref={setSectionRef('apy')}
        style={{ backgroundColor: '#232323', height: '760px' }}
      >
        <div className="max-w-[1200px] mx-auto px-10 h-full flex items-center">
          <div className="grid grid-cols-2 gap-20 items-center w-full">
            {/* Left side - Content (reversed position) */}
            <div 
              className="max-w-xl"
              style={{ 
                animation: visibleSections.has('apy') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('apy') ? 1 : 0,
                transform: visibleSections.has('apy') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              <h2 
                className="text-[48px] font-extrabold text-white leading-[1.1] mb-6" 
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
              >
                Watch your savings<br />
                grow with APY.
              </h2>
              
              <p 
                className="text-[14px] leading-[1.4] mb-8"
                style={{ letterSpacing: '0%', color: '#9B9B9B' }}
              >
                Earn competitive interest on every dollar you save. Your money<br />
                works harder while you focus on reaching your goals. No hidden<br />
                fees, just steady growth.
              </p>

              <Button 
                variant="secondary"
                onClick={() => router.push('/sign-up')}
                className="bg-transparent text-white border border-white hover:bg-white/10 px-8 py-3 text-[16px] font-medium"
              >
                Get Started
              </Button>
            </div>

            {/* Right side - Visual placeholder (reversed position) */}
            <div 
              className="flex items-center justify-center"
              style={{ 
                animation: visibleSections.has('apy') ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
                opacity: visibleSections.has('apy') ? 1 : 0,
                transform: visibleSections.has('apy') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out 0.1s'
              }}
            >
              <div 
                style={{ 
                  width: '545px', 
                  height: '508px', 
                  backgroundColor: '#1A1A1A',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sixth Section - Features Grid (White) */}
      <div 
        ref={setSectionRef('features')}
        style={{ backgroundColor: '#ffffff', height: '760px' }}
      >
        <div className="max-w-[1200px] mx-auto px-10 h-full flex items-center">
          <div className="w-full">
            {/* Features grid */}
            <div 
              className="grid grid-cols-3"
              style={{ 
                animation: visibleSections.has('features') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('features') ? 1 : 0,
                transform: visibleSections.has('features') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out',
                gap: '40px'
              }}
            >
              {/* Feature 1 - Link bank */}
              <div className="flex flex-col">
                {/* Image box */}
                <div 
                  style={{ 
                    width: '366px', 
                    height: '219px', 
                    backgroundColor: '#EBE9E9',
                    borderRadius: '20px',
                    marginBottom: '44px'
                  }}
                />
                {/* Text content outside */}
                <div>
                  <h3 className="text-[32px] font-extrabold text-[#1A1A1A] mb-3" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em', lineHeight: '110%' }}>
                    Link your bank.<br />
                    Fuel your buckets.
                  </h3>
                  <p className="text-[14px] text-[#7E7676]" style={{ letterSpacing: '0%', lineHeight: '140%' }}>
                    Connect your bank account securely to Zuma and start saving with seamless transfers, recurring deposits and real-time funding.
                  </p>
                </div>
              </div>

              {/* Feature 2 - Get updates */}
              <div className="flex flex-col">
                {/* Image box */}
                <div 
                  style={{ 
                    width: '366px', 
                    height: '219px', 
                    backgroundColor: '#EBE9E9',
                    borderRadius: '20px',
                    marginBottom: '44px'
                  }}
                />
                {/* Text content outside */}
                <div>
                  <h3 className="text-[32px] font-extrabold text-[#1A1A1A] mb-3" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em', lineHeight: '110%' }}>
                    Get smart updates.<br />
                    Weekly & Monthly.
                  </h3>
                  <p className="text-[14px] text-[#7E7676]" style={{ letterSpacing: '0%', lineHeight: '140%' }}>
                    Receive automatic reports on your savings progress, interest earned and upcoming milestones sent directly to your inbox.
                  </p>
                </div>
              </div>

              {/* Feature 3 - Share Zuma */}
              <div className="flex flex-col">
                {/* Image box */}
                <div 
                  style={{ 
                    width: '366px', 
                    height: '219px', 
                    backgroundColor: '#EBE9E9',
                    borderRadius: '20px',
                    marginBottom: '44px'
                  }}
                />
                {/* Text content outside */}
                <div>
                  <h3 className="text-[32px] font-extrabold text-[#1A1A1A] mb-3" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em', lineHeight: '110%' }}>
                    Share Zuma.<br />
                    Get rewarded.
                  </h3>
                  <p className="text-[14px] text-[#7E7676]" style={{ letterSpacing: '0%', lineHeight: '140%' }}>
                    Invite friends and unlock exclusive rewards when they join. Earn bonuses, boost your savings and help others start smart.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
