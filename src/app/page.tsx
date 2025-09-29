"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
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


  // Scroll effects for sticky header and bucket animations
  useEffect(() => {
    const handleScroll = () => {
      // Sticky header logic
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom
        setShowStickyHeader(headerBottom < 0)
      }

      const scrollY = window.scrollY
      const bucketCards = document.querySelectorAll('.bucket-scroll-animation')
      
      bucketCards.forEach((card: Element) => {
        const bucketIndex = parseInt((card as HTMLElement).getAttribute('data-bucket-index') || '0')
        const staggerDelay = bucketIndex * 30
        const startScrollPoint = 50 + staggerDelay
        
        if (scrollY > startScrollPoint) {
          const disappearProgress = Math.min(1, (scrollY - startScrollPoint) / 150)
          const scale = 1 - (disappearProgress * 0.6)
          const opacity = 1 - (disappearProgress * 1.5)
          const translateY = disappearProgress * -50
          
          ;(card as HTMLElement).style.transform = `scale(${scale}) translateY(${translateY}px)`
          ;(card as HTMLElement).style.opacity = Math.max(0, opacity).toString()
          ;(card as HTMLElement).style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out'
        } else {
          ;(card as HTMLElement).style.transform = 'scale(1) translateY(0px)'
          ;(card as HTMLElement).style.opacity = '1'
          ;(card as HTMLElement).style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out'
        }
      })

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

  return (
    <div className="min-h-screen">
      {/* Desktop Sticky Buttons - Only visible on desktop when scrolled */}
      <div 
        className={`hidden md:block fixed top-8 right-10 z-50 transition-all duration-300 ${
          showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary"
            onClick={() => router.push('/sign-up')}
            className="text-black bg-white/95 border border-black/20 hover:bg-white backdrop-blur-md shadow-lg px-6"
          >
            Get Started
          </Button>
          <Button 
            variant="secondary"
            onClick={() => router.push('/login')}
            className="text-black bg-[#2d2d2d] hover:bg-[#2d2d2d]/90 border border-black !text-white shadow-lg px-8"
          >
            Login
          </Button>
        </div>
      </div>

      {/* Mobile Sticky Buttons - Floating at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-5">
        <div className="flex justify-center gap-4 px-5">
          <Button 
            variant="secondary"
            onClick={() => router.push('/sign-up')}
            className="text-black bg-white border-2 border-black hover:bg-gray-50 py-5 px-8 text-base font-semibold rounded-xl shadow-lg"
          >
            Get Started
          </Button>
          <Button 
            variant="secondary"
            onClick={() => router.push('/login')}
            className="text-white bg-[#2d2d2d] hover:bg-[#2d2d2d]/90 border-2 border-[#2d2d2d] py-5 px-8 text-base font-semibold rounded-xl shadow-lg"
          >
            Login
          </Button>
        </div>
      </div>


      {/* Hero Section with Animated Buckets - Combined */}
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }} className="flex flex-col pb-24 md:pb-0">
        <div className="w-full px-4 min-h-screen flex flex-col relative">
        {/* Header */}
        <header 
          ref={headerRef}
          className="w-full flex items-center justify-between pt-6 pb-6 px-6 md:px-6"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          {/* Mobile Logo - Fixed position closer to edges */}
          <div className="md:hidden absolute top-3 left-1 z-40">
            <div className="relative w-44 h-14">
              <Image 
                src="/zuma-light.svg" 
                alt="Zuma Logo" 
                fill
                className="object-contain object-left"
              />
            </div>
          </div>
          
          {/* Desktop Logo */}
          <div className="hidden md:flex items-center">
            <div className="relative w-44 h-14">
              <Image 
                src="/zuma-light.svg" 
                alt="Zuma Logo" 
                fill
                className="object-contain object-left"
              />
            </div>
          </div>
          
          {/* Desktop Buttons Only */}
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="secondary"
              onClick={() => router.push('/sign-up')}
              className="text-black bg-white border border-black/20 hover:bg-gray-50 px-6"
            >
              Get Started
            </Button>
            <Button 
              variant="secondary"
              onClick={() => router.push('/login')}
              className="text-black bg-[#2d2d2d] hover:bg-[#2d2d2d]/90 border border-black !text-white px-8"
            >
              Login
            </Button>
          </div>
        </header>

        {/* Main Content Container */}
        <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col">

        {/* Main Content with Buckets */}
        <main className="flex-1 flex items-center justify-center py-8 relative">
          {/* Animated Bucket Cards around the title - Both Desktop and Mobile */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Cancun Trip */}
            <div 
              className="absolute bucket-card pointer-events-auto bucket-scroll-animation"
              data-bucket-index="0"
              style={{
                top: '120px',
                left: '10px',
                zIndex: 20,
                '--delay': '0.8s',
                '--color': '#B6F3AD',
                animation: 'slideInScale 1s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay) both'
              } as React.CSSProperties}
            >
              <div className="bucket-content" style={{ backgroundColor: 'var(--color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[16px] font-extrabold text-black" style={{ letterSpacing: '-0.04em' }}>Cancun Trip</span>
                  <span className="text-[20px]">✈️</span>
                </div>
                <div className="progress-container" style={{ height: '24px', borderRadius: '6px' }}>
                  <div className="progress-bar hatched-pattern" style={{ '--progress': '28%' } as React.CSSProperties}></div>
                  <span className="progress-text" style={{ letterSpacing: '-0.04em' }}>28%</span>
                </div>
              </div>
            </div>

            {/* Laksik Procedure */}
            <div 
              className="absolute bucket-card pointer-events-auto bucket-scroll-animation"
              data-bucket-index="1"
              style={{
                top: '120px',
                right: '10px',
                zIndex: 20,
                '--delay': '1.0s',
                '--color': '#FFDA2A',
                animation: 'slideInScale 1s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay) both'
              } as React.CSSProperties}
            >
              <div className="bucket-content" style={{ backgroundColor: 'var(--color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[16px] font-extrabold text-black" style={{ letterSpacing: '-0.04em' }}>Laksik Procedure</span>
                  <span className="text-[20px]">👁️</span>
                </div>
                <div className="progress-container" style={{ height: '24px', borderRadius: '6px' }}>
                  <div className="progress-bar hatched-pattern" style={{ '--progress': '65%' } as React.CSSProperties}></div>
                  <span className="progress-text" style={{ letterSpacing: '-0.04em' }}>65%</span>
                </div>
              </div>
            </div>

            {/* Nintendo Switch */}
            <div 
              className="absolute bucket-card pointer-events-auto bucket-scroll-animation"
              data-bucket-index="2"
              style={{
                top: '50%',
                left: '10px',
                transform: 'translateY(-50%)',
                zIndex: 20,
                '--delay': '1.2s',
                '--color': '#ABE9FA',
                animation: 'slideInScale 1s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay) both'
              } as React.CSSProperties}
            >
              <div className="bucket-content" style={{ backgroundColor: 'var(--color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[16px] font-extrabold text-black" style={{ letterSpacing: '-0.04em' }}>Nintendo Switch</span>
                  <span className="text-[20px]">🎮</span>
                </div>
                <div className="progress-container" style={{ height: '24px', borderRadius: '6px' }}>
                  <div className="progress-bar hatched-pattern" style={{ '--progress': '52%' } as React.CSSProperties}></div>
                  <span className="progress-text" style={{ letterSpacing: '-0.04em' }}>52%</span>
                </div>
              </div>
            </div>

            {/* Electric Guitar */}
            <div 
              className="absolute bucket-card pointer-events-auto bucket-scroll-animation"
              data-bucket-index="3"
              style={{
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                zIndex: 20,
                '--delay': '1.4s',
                '--color': '#FF7261',
                animation: 'slideInScale 1s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay) both'
              } as React.CSSProperties}
            >
              <div className="bucket-content" style={{ backgroundColor: 'var(--color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[16px] font-extrabold text-black" style={{ letterSpacing: '-0.04em' }}>Electric Guitar</span>
                  <span className="text-[20px]">🎸</span>
                </div>
                <div className="progress-container" style={{ height: '24px', borderRadius: '6px' }}>
                  <div className="progress-bar hatched-pattern" style={{ '--progress': '15%' } as React.CSSProperties}></div>
                  <span className="progress-text" style={{ letterSpacing: '-0.04em' }}>15%</span>
                </div>
              </div>
            </div>

            {/* FIFA Worldcup */}
            <div 
              className="absolute bucket-card pointer-events-auto bucket-scroll-animation"
              data-bucket-index="4"
              style={{
                bottom: '160px',
                left: '10px',
                zIndex: 20,
                '--delay': '1.6s',
                '--color': '#31A7FE',
                animation: 'slideInScale 1s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay) both'
              } as React.CSSProperties}
            >
              <div className="bucket-content" style={{ backgroundColor: 'var(--color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[16px] font-extrabold text-black" style={{ letterSpacing: '-0.04em' }}>FIFA Worldcup</span>
                  <span className="text-[20px]">⚽</span>
                </div>
                <div className="progress-container" style={{ height: '24px', borderRadius: '6px' }}>
                  <div className="progress-bar hatched-pattern" style={{ '--progress': '70%' } as React.CSSProperties}></div>
                  <span className="progress-text" style={{ letterSpacing: '-0.04em' }}>70%</span>
                </div>
              </div>
            </div>

            {/* iPhone 17 */}
            <div 
              className="absolute bucket-card pointer-events-auto bucket-scroll-animation"
              data-bucket-index="5"
              style={{
                bottom: '160px',
                right: '10px',
                zIndex: 20,
                '--delay': '1.8s',
                '--color': '#F7C250',
                animation: 'slideInScale 1s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay) both'
              } as React.CSSProperties}
            >
              <div className="bucket-content" style={{ backgroundColor: 'var(--color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[16px] font-extrabold text-black" style={{ letterSpacing: '-0.04em' }}>iPhone 17</span>
                  <span className="text-[20px]">📱</span>
                </div>
                <div className="progress-container" style={{ height: '24px', borderRadius: '6px' }}>
                  <div className="progress-bar hatched-pattern" style={{ '--progress': '38%' } as React.CSSProperties}></div>
                  <span className="progress-text" style={{ letterSpacing: '-0.04em' }}>38%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Heading - Desktop: 2 lines, Mobile: 4 lines */}
          <div className="w-full text-center relative z-10">
            <h1 
              className="font-normal text-black leading-[0.8] uppercase robuck-font" 
              style={{ 
                letterSpacing: '0', 
                animation: 'fadeInUp 0.5s ease-out 0.2s both',
                fontSize: 'clamp(80px, 18vw, 250px)'
              }}
            >
              {/* Desktop: 2 lines */}
              <span className="hidden md:block">YOUR MODERN</span>
              <span className="hidden md:block">SAVING ACCOUNT</span>
              
              {/* Mobile: 4 lines */}
              <span className="block md:hidden" style={{ fontSize: 'clamp(80px, 24vw, 120px)' }}>YOUR</span>
              <span className="block md:hidden" style={{ fontSize: 'clamp(80px, 24vw, 120px)' }}>MODERN</span>
              <span className="block md:hidden" style={{ fontSize: 'clamp(80px, 24vw, 120px)' }}>SAVING</span>
              <span className="block md:hidden" style={{ fontSize: 'clamp(80px, 24vw, 120px)' }}>ACCOUNT</span>
            </h1>
          </div>
        </main>
        </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes slideInScale {
          0% {
            opacity: 0;
            transform: translateX(var(--tx, 0)) scale(0.6) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: translateX(var(--tx, 0)) scale(0.9) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateX(var(--tx, 0)) scale(1) translateY(0);
          }
        }

        @keyframes fillProgress {
          0% {
            width: 0%;
          }
          100% {
            width: var(--progress);
          }
        }

        .bucket-card {
          width: 227px;
          height: 90px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bucket-card:hover {
          transform: translateX(var(--tx, 0)) scale(1.05) translateY(-5px);
        }

        .bucket-content {
          width: 100%;
          height: 100%;
          border-radius: 12px;
          padding: 16px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 2px 2px 0px rgba(0, 0, 0, 1);
          border: 1px solid rgba(0, 0, 0, 1);
          transition: all 0.3s ease;
        }

        .bucket-content:hover {
          box-shadow: 4px 4px 0px rgba(0, 0, 0, 1);
          transform: translateY(-2px);
        }

        .progress-container {
          position: relative;
          width: 100%;
          height: 24px !important;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 6px !important;
          border: 1px solid rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .progress-bar {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: transparent;
          border-radius: 0 !important;
          animation: fillProgress 1.5s cubic-bezier(0.4, 0, 0.2, 1) calc(var(--delay) + 0.5s) both;
          overflow: hidden;
        }

        .hatched-pattern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            rgba(0, 0, 0, 1) 3px,
            rgba(0, 0, 0, 1) 4px
          );
          border-radius: 0;
        }
        
        .hatched-pattern::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 1px;
          background: rgba(0, 0, 0, 0.5);
        }

        .progress-text {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.8);
          z-index: 1;
        }

        /* Mobile bucket cards */
        @media (max-width: 768px) {
          .bucket-card {
            width: 160px !important;
            height: 75px !important;
          }
          
          .bucket-content {
            padding: 10px 12px !important;
          }
          
          .bucket-content span:first-child {
            font-size: 12px !important;
          }
          
          .bucket-content .progress-container {
            height: 22px !important;
          }
          
          .progress-text {
            font-size: 10px !important;
            right: 8px !important;
          }
        }

        /* Orbit Animation Styles */
        .orbit-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .orbit-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: var(--size);
          height: var(--size);
          border: 1.5px solid var(--color);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: var(--opacity);
          z-index: 1;
        }

        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(var(--orbit)) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(var(--orbit)) rotate(-360deg);
          }
        }

        @keyframes bucketExpand {
          0%, 40% {
            width: 50px;
            border-radius: 8px;
          }
          50%, 80% {
            width: 180px;
            border-radius: 12px;
          }
          90%, 100% {
            width: 50px;
            border-radius: 8px;
          }
        }

        @keyframes amountShow {
          0%, 40% {
            opacity: 0;
          }
          50%, 80% {
            opacity: 1;
          }
          90%, 100% {
            opacity: 0;
          }
        }



        .orbiting-bucket {
          position: absolute;
          top: 50%;
          left: 50%;
          animation: orbit 12s linear infinite;
          animation-delay: var(--delay);
          z-index: 10;
        }

        .bucket-mini {
          position: relative;
          width: 50px;
          height: 50px;
          background-color: var(--color);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 0 12px;
          border: 1px solid #000;
          box-shadow: 2px 2px 0px #000;
          animation: bucketExpand 12s ease-in-out infinite;
          animation-delay: var(--delay);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .bucket-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .bucket-amount {
          font-size: 16px;
          font-weight: 700;
          color: #000;
          white-space: nowrap;
          letter-spacing: -0.02em;
          animation: amountShow 12s ease-in-out infinite;
          animation-delay: var(--delay);
        }

        /* Mobile responsive for orbit */
        @media (max-width: 768px) {
          .orbit-circle {
            width: calc(var(--size) * 0.6);
            height: calc(var(--size) * 0.6);
          }
          
          .orbiting-bucket {
            --orbit: calc(var(--orbit) * 0.6);
          }
          
          .bucket-mini {
            width: 40px;
            height: 40px;
          }
          
          .bucket-icon {
            font-size: 16px;
          }
          
          .bucket-amount {
            font-size: 12px;
            padding: 6px 12px;
          }
        }
      `}</style>

      {/* Second Section - Black background, no button */}
      <div 
        ref={setSectionRef('buckets')}
        style={{ backgroundColor: '#000000' }}
        className="py-[60px] md:py-[120px] md:h-[760px]"
      >
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 h-full flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center w-full">
            {/* Left side - Visual placeholder */}
            <div 
              className="flex items-center justify-center order-2 md:order-1 px-0"
              style={{ 
                animation: visibleSections.has('buckets') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('buckets') ? 1 : 0,
                transform: visibleSections.has('buckets') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              <div 
                className="w-full md:max-w-[545px] aspect-[545/508] md:w-[545px] md:h-[508px]"
                style={{ 
                  backgroundColor: '#1A1A1A',
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
              className="max-w-xl order-1 md:order-2"
              style={{ 
                animation: visibleSections.has('buckets') ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
                opacity: visibleSections.has('buckets') ? 1 : 0,
                transform: visibleSections.has('buckets') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out 0.1s'
              }}
            >
              <h2 
                className="text-[24px] md:text-[48px] font-extrabold text-white leading-[1.1] mb-4 md:mb-6" 
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
              >
                Create custom buckets.<br />
                Track everything.
              </h2>
              
              <p 
                className="text-[14px] leading-[1.4]"
                style={{ letterSpacing: '0%', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Set savings goals your way. Create personalized buckets and monitor every deposit and withdrawal with full transparency.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Third Section - White background, Mirror account */}
      <div 
        ref={setSectionRef('mirror')}
        style={{ backgroundColor: '#ffffff' }}
        className="py-[60px] md:py-[120px] md:h-[760px]"
      >
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 h-full flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center w-full">
            {/* Left side - Content (reversed position) */}
            <div 
              className="max-w-xl order-1 md:order-1"
              style={{ 
                animation: visibleSections.has('mirror') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('mirror') ? 1 : 0,
                transform: visibleSections.has('mirror') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              <h2 
                className="text-[24px] md:text-[48px] font-extrabold text-black leading-[1.1] mb-4 md:mb-6" 
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
              >
                Mirror your saving or<br />
                checking account.
              </h2>
              
              <p 
                className="text-[14px] leading-[1.4]"
                style={{ letterSpacing: '0%', color: 'rgba(0, 0, 0, 0.7)' }}
              >
                With Plaid, linking your account takes seconds. Your balance appears instantly so you can organize it into buckets for what matters most.
              </p>
            </div>

            {/* Right side - Visual placeholder (reversed position) */}
            <div 
              className="flex items-center justify-center order-2 md:order-2 px-0"
              style={{ 
                animation: visibleSections.has('mirror') ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
                opacity: visibleSections.has('mirror') ? 1 : 0,
                transform: visibleSections.has('mirror') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out 0.1s'
              }}
            >
              <div 
                className="w-full md:max-w-[545px] aspect-[545/508] md:w-[545px] md:h-[508px] relative overflow-hidden"
                style={{ 
                  backgroundColor: '#F9F9F9',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Animated Orbit Visualization */}
                <div className="orbit-container relative w-full h-full flex items-center justify-center">
                  {/* Concentric Circles */}
                  <div className="orbit-circle" style={{ '--size': '80px', '--opacity': '1', '--color': '#E8E7E7' } as React.CSSProperties}></div>
                  <div className="orbit-circle" style={{ '--size': '140px', '--opacity': '1', '--color': '#D9D8D8' } as React.CSSProperties}></div>
                  <div className="orbit-circle" style={{ '--size': '200px', '--opacity': '0.8', '--color': '#CFCFCF' } as React.CSSProperties}></div>
                  <div className="orbit-circle" style={{ '--size': '260px', '--opacity': '0.6', '--color': '#C4C4C4' } as React.CSSProperties}></div>
                  <div className="orbit-circle" style={{ '--size': '320px', '--opacity': '0.4', '--color': '#B8B8B8' } as React.CSSProperties}></div>
                  <div className="orbit-circle" style={{ '--size': '380px', '--opacity': '0.25', '--color': '#AFAFAF' } as React.CSSProperties}></div>

                  {/* Orbiting Bucket Cards - 5 buckets on different orbits */}
                  <div className="orbiting-bucket" style={{ '--orbit': '140px', '--delay': '0s', '--color': '#B6F3AD' } as React.CSSProperties}>
                    <div className="bucket-mini">
                      <span className="bucket-icon">✈️</span>
                      <span className="bucket-amount">+$120.00</span>
                    </div>
                  </div>

                  <div className="orbiting-bucket" style={{ '--orbit': '100px', '--delay': '-2.4s', '--color': '#FFDA2A' } as React.CSSProperties}>
                    <div className="bucket-mini">
                      <span className="bucket-icon">🎮</span>
                      <span className="bucket-amount">+$75.00</span>
                    </div>
                  </div>

                  <div className="orbiting-bucket" style={{ '--orbit': '160px', '--delay': '-4.8s', '--color': '#31A7FE' } as React.CSSProperties}>
                    <div className="bucket-mini">
                      <span className="bucket-icon">⚽</span>
                      <span className="bucket-amount">+$120.00</span>
                    </div>
                  </div>

                  <div className="orbiting-bucket" style={{ '--orbit': '190px', '--delay': '-7.2s', '--color': '#ABE9FA' } as React.CSSProperties}>
                    <div className="bucket-mini">
                      <span className="bucket-icon">📷</span>
                      <span className="bucket-amount">+$400.00</span>
                    </div>
                  </div>

                  <div className="orbiting-bucket" style={{ '--orbit': '175px', '--delay': '-9.6s', '--color': '#FF7261' } as React.CSSProperties}>
                    <div className="bucket-mini">
                      <span className="bucket-icon">👁️</span>
                      <span className="bucket-amount">+$350.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fourth Section - Black background, Marketplace */}
      <div 
        ref={setSectionRef('marketplace')}
        style={{ backgroundColor: '#000000' }}
        className="py-[60px] md:py-[120px] md:h-[760px]"
      >
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 h-full flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center w-full">
            {/* Left side - Visual placeholder */}
            <div 
              className="flex items-center justify-center order-2 md:order-1 px-0"
              style={{ 
                animation: visibleSections.has('marketplace') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('marketplace') ? 1 : 0,
                transform: visibleSections.has('marketplace') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              <div 
                className="w-full md:max-w-[545px] aspect-[545/508] md:w-[545px] md:h-[508px]"
                style={{ 
                  backgroundColor: '#1A1A1A',
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
              className="max-w-xl order-1 md:order-2"
              style={{ 
                animation: visibleSections.has('marketplace') ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
                opacity: visibleSections.has('marketplace') ? 1 : 0,
                transform: visibleSections.has('marketplace') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out 0.1s'
              }}
            >
              <h2 
                className="text-[24px] md:text-[48px] font-extrabold text-white leading-[1.1] mb-4 md:mb-6" 
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
              >
                Save for real things.<br />
                Unlock real discounts.
              </h2>
              
              <p 
                className="text-[14px] leading-[1.4]"
                style={{ letterSpacing: '0%', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Access Zuma's Marketplace with exclusive deals on curated products. Each discount includes a goal-driven bucket to help you save and buy smarter.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fifth Section - Yellow background, Automation */}
      <div 
        ref={setSectionRef('automation')}
        style={{ backgroundColor: '#FFDA2A' }}
        className="py-[60px] md:py-[120px] md:h-[760px]"
      >
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 h-full flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center w-full">
            {/* Left side - Content (reversed position) */}
            <div 
              className="max-w-xl order-1 md:order-1"
              style={{ 
                animation: visibleSections.has('automation') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('automation') ? 1 : 0,
                transform: visibleSections.has('automation') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              <h2 
                className="text-[24px] md:text-[48px] font-extrabold text-black leading-[1.1] mb-4 md:mb-6" 
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
              >
                Move money or<br />
                automate it. Your call.
              </h2>
              
              <p 
                className="text-[14px] leading-[1.4]"
                style={{ letterSpacing: '0%', color: 'rgba(0, 0, 0, 0.7)' }}
              >
                Take control of your savings with flexible automation. Set up recurring deposits or move money manually whenever you want. The choice is always yours.
              </p>
            </div>

            {/* Right side - Visual placeholder (reversed position) */}
            <div 
              className="flex items-center justify-center order-2 md:order-2 px-0"
              style={{ 
                animation: visibleSections.has('automation') ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
                opacity: visibleSections.has('automation') ? 1 : 0,
                transform: visibleSections.has('automation') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out 0.1s'
              }}
            >
              <div 
                className="w-full md:max-w-[545px] aspect-[545/508] md:w-[545px] md:h-[508px]"
                style={{ 
                  backgroundColor: '#F0D000',
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

      {/* Sixth Section - Black background, Smart Updates */}
      <div 
        ref={setSectionRef('updates')}
        style={{ backgroundColor: '#000000' }}
        className="py-[60px] md:py-[120px] md:h-[760px]"
      >
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 h-full flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center w-full">
            {/* Left side - Visual placeholder */}
            <div 
              className="flex items-center justify-center order-2 md:order-1 px-0"
              style={{ 
                animation: visibleSections.has('updates') ? 'fadeInUp 0.5s ease-out 0.1s both' : 'none',
                opacity: visibleSections.has('updates') ? 1 : 0,
                transform: visibleSections.has('updates') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              <div 
                className="w-full md:max-w-[545px] aspect-[545/508] md:w-[545px] md:h-[508px]"
                style={{ 
                  backgroundColor: '#1A1A1A',
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
              className="max-w-xl order-1 md:order-2"
              style={{ 
                animation: visibleSections.has('updates') ? 'fadeInUp 0.5s ease-out 0.2s both' : 'none',
                opacity: visibleSections.has('updates') ? 1 : 0,
                transform: visibleSections.has('updates') ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out 0.1s'
              }}
            >
              <h2 
                className="text-[24px] md:text-[48px] font-extrabold text-white leading-[1.1] mb-4 md:mb-6" 
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em' }}
              >
                Get smart updates.<br />
                Weekly & Monthly.
              </h2>
              
              <p 
                className="text-[14px] leading-[1.4]"
                style={{ letterSpacing: '0%', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Access Zuma's Marketplace with exclusive deals on curated products. Each discount includes a goal-driven bucket to help you save and buy smarter.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#ffffff' }} className="pt-4 pb-24 md:py-20">
        <div className="max-w-[1200px] mx-auto px-1 md:px-10">
          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-2 gap-20">
            {/* Left side - Logo and Copyright */}
            <div>
              <div className="mb-8">
                <div className="relative w-44 h-14">
                  <Image 
                    src="/zuma-light.svg" 
                    alt="Zuma Logo" 
                    fill
                    className="object-contain object-left"
                  />
                </div>
              </div>
              <p className="text-[#999999] text-[14px]">
                Zuma LLC 2025. All rights reserved
              </p>
            </div>

            {/* Right side - Navigation Links */}
            <div className="grid grid-cols-2 gap-10">
              <div className="flex flex-col space-y-4">
                <a href="/pricing" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                  Pricing
                </a>
                <a href="/about" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                  About us
                </a>
                <a href="/contact" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                  Contact
                </a>
                <a href="/feedback" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                  Feedback
                </a>
              </div>
              <div className="flex flex-col space-y-4">
                <a href="/terms" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                  Terms
                </a>
                <a href="/privacy" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                  Privacy
                </a>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Logo */}
            <div className="mb-4">
              <div className="relative w-44 h-14">
                <Image 
                  src="/zuma-light.svg" 
                  alt="Zuma Logo" 
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>

            {/* All Links Aligned Left */}
            <div className="flex flex-col space-y-4 mb-8">
              <a href="/pricing" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                Pricing
              </a>
              <a href="/terms" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                Terms
              </a>
              <a href="/about" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                About us
              </a>
              <a href="/privacy" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                Privacy
              </a>
              <a href="/contact" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                Contact
              </a>
              <a href="/feedback" className="text-[#1A1A1A] text-[16px] font-medium hover:text-gray-600 transition-colors">
                Feedback
              </a>
            </div>

            {/* Copyright */}
            <p className="text-[#999999] text-[14px]">
              Zuma LLC 2025. All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
