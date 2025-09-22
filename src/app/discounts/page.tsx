"use client"

import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TabBar } from "@/components/ui/tab-bar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

// Brand data with emojis using theme-aware colors
const brands = [
  { 
    id: 1, 
    name: 'United', 
    logo: '✈️', 
    discount: '15% OFF'
  },
  { 
    id: 2, 
    name: 'Booking.com', 
    logo: '🏨', 
    discount: '12% OFF'
  },
  { 
    id: 3, 
    name: 'Apple', 
    logo: '🍎', 
    discount: '10% OFF'
  },
  { 
    id: 4, 
    name: 'Ticketmaster', 
    logo: '🎫', 
    discount: '$5 OFF'
  },
  { 
    id: 5, 
    name: 'Nike', 
    logo: '👟', 
    discount: '15% OFF'
  },
  { 
    id: 6, 
    name: 'Amazon', 
    logo: '📦', 
    discount: '20% OFF'
  },
  { 
    id: 7, 
    name: 'Expedia', 
    logo: '🌎', 
    discount: '8% OFF'
  },
  { 
    id: 8, 
    name: 'Home Depot', 
    logo: '🔨', 
    discount: '10% OFF'
  }
]

export default function DiscountsPage() {
  return (
    <ProtectedRoute>
      <DiscountsContent />
    </ProtectedRoute>
  )
}

function DiscountsContent() {
  const { user } = useAuth()
  const router = useRouter()
  
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || 
                     "U"

  const handleBrandClick = (brand: any) => {
    const params = new URLSearchParams({
      brand: brand.name,
      logo: brand.logo,
      discount: brand.discount
    })
    router.push(`/discount-details?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-4"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <div></div> {/* Empty div for spacing */}
          <AvatarDropdown initial={userInitial} />
        </div>

        {/* Title */}
        <div 
          className="mb-6"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-extrabold text-foreground mb-3"
            style={{ letterSpacing: '-0.05em' }}
          >
            Discounts
          </h1>
          <p className="text-foreground/60 text-[16px] leading-relaxed">
            Discover exclusive discounts to create ready-to-shop buckets for your favorite brands
          </p>
        </div>

        {/* Brand Grid */}
        <div className="grid grid-cols-2 gap-4 mb-20">
          {brands.map((brand, index) => (
            <button
              key={brand.id}
              className="relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 bg-secondary"
              style={{ 
                height: '145px',
                animation: `fadeInUp 0.5s ease-out ${0.3 + index * 0.05}s both`
              }}
              onClick={() => handleBrandClick(brand)}
            >
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                {/* Logo - emoji only */}
                <div className="text-4xl text-secondary-foreground">
                  {brand.logo}
                </div>
                
                {/* Brand name */}
                <span className="text-xs font-semibold mt-1 text-secondary-foreground">
                  {brand.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom spacing for tab bar */}
        <div className="h-20"></div>
      </div>

      {/* Tab Bar Navigation */}
      <TabBar />
    </div>
  )
}