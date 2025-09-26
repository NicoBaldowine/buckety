"use client"

import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"
import { bucketService } from "@/lib/supabase"

interface Product {
  id: number
  name: string
  originalPrice: number
  discountedPrice: number
  discount: string
  image?: string
}

const brandProducts: Record<string, Product[]> = {
  'Nike': [
    {
      id: 1,
      name: 'Air Max 90',
      originalPrice: 120,
      discountedPrice: 102,
      discount: '15% OFF',
      image: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/7df77916-8bbf-4a5d-b813-eb24bfabc747/AIR+MAX+90+PRM.png'
    },
    {
      id: 2,
      name: 'React Infinity Run',
      originalPrice: 160,
      discountedPrice: 136,
      discount: '15% OFF',
      image: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/b8bf0ce1-4f5f-4426-8062-eb8bcd40fcb9/W+REACT+INFINITY+RUN+FK+3.png'
    },
    {
      id: 3,
      name: 'Air Force 1',
      originalPrice: 90,
      discountedPrice: 76.50,
      discount: '15% OFF',
      image: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/e777c881-5b62-4250-92a6-362967f54cca/AIR+FORCE+1+%2707.png'
    },
    {
      id: 4,
      name: 'Dunk Low',
      originalPrice: 100,
      discountedPrice: 85,
      discount: '15% OFF',
      image: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/a3e5f6c5-0b43-4b0e-b0a8-2285a0f64c2b/W+NIKE+DUNK+LOW.png'
    }
  ],
  'Apple': [
    {
      id: 5,
      name: 'iPhone 15',
      originalPrice: 799,
      discountedPrice: 719.10,
      discount: '10% OFF'
    },
    {
      id: 6,
      name: 'MacBook Air',
      originalPrice: 1199,
      discountedPrice: 1079.10,
      discount: '10% OFF'
    },
    {
      id: 7,
      name: 'AirPods Pro',
      originalPrice: 249,
      discountedPrice: 224.10,
      discount: '10% OFF'
    },
    {
      id: 8,
      name: 'iPad Air',
      originalPrice: 599,
      discountedPrice: 539.10,
      discount: '10% OFF'
    }
  ],
  'Amazon': [
    {
      id: 9,
      name: 'Echo Dot',
      originalPrice: 50,
      discountedPrice: 40,
      discount: '20% OFF'
    },
    {
      id: 10,
      name: 'Fire TV Stick',
      originalPrice: 40,
      discountedPrice: 32,
      discount: '20% OFF'
    },
    {
      id: 11,
      name: 'Kindle',
      originalPrice: 90,
      discountedPrice: 72,
      discount: '20% OFF'
    },
    {
      id: 12,
      name: 'Ring Doorbell',
      originalPrice: 100,
      discountedPrice: 80,
      discount: '20% OFF'
    }
  ],
  'PlayStation': [
    {
      id: 13,
      name: 'PS5 Console',
      originalPrice: 500,
      discountedPrice: 375,
      discount: '25% OFF'
    },
    {
      id: 14,
      name: 'DualSense Controller',
      originalPrice: 70,
      discountedPrice: 52.50,
      discount: '25% OFF'
    },
    {
      id: 15,
      name: 'Spider-Man 2',
      originalPrice: 70,
      discountedPrice: 52.50,
      discount: '25% OFF'
    },
    {
      id: 16,
      name: 'Horizon Forbidden West',
      originalPrice: 60,
      discountedPrice: 45,
      discount: '25% OFF'
    }
  ]
}

export default function DiscountDetailsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <DiscountDetailsContent />
      </Suspense>
    </ProtectedRoute>
  )
}

function DiscountDetailsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const brandName = searchParams.get('brand') || 'Nike'
  const brandLogo = searchParams.get('logo') || '👟'
  const brandDiscount = searchParams.get('discount') || '15% OFF'
  
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || 
                     "U"

  const products = brandProducts[brandName as keyof typeof brandProducts] || brandProducts['Nike']

  const handleCreateBucket = async (product: any) => {
    try {
      if (!user?.id) {
        console.log('User not authenticated')
        return
      }
      
      // Create bucket directly in database with retry logic
      const bucketData = {
        title: product.name,
        target_amount: product.discountedPrice,
        current_amount: 0,
        background_color: getRandomColor(),
        apy: 3.5,
        user_id: user.id
      }
      
      console.log('Creating bucket with data:', bucketData)
      
      let newBucket = null
      let retries = 3
      
      while (retries > 0 && !newBucket) {
        try {
          newBucket = await bucketService.createBucket(bucketData)
          if (newBucket) break
        } catch (fetchError) {
          console.warn(`Bucket creation attempt failed, ${retries - 1} retries left:`, fetchError)
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }
      
      if (newBucket) {
        console.log('Bucket created successfully:', newBucket)
        // Navigate to bucket details with fromDiscounts flag
        const params = new URLSearchParams({
          id: newBucket.id,
          title: newBucket.title,
          currentAmount: newBucket.current_amount.toString(),
          targetAmount: newBucket.target_amount.toString(),
          backgroundColor: newBucket.background_color,
          apy: newBucket.apy.toString(),
          fromDiscounts: 'true'
        })
        router.push(`/bucket-details?${params.toString()}`)
      } else {
        console.error('Failed to create bucket after all retries')
        // Fallback: Navigate to create bucket page with prefilled data
        const params = new URLSearchParams({
          prefillTitle: product.name,
          prefillAmount: product.discountedPrice.toString(),
          fromDiscount: 'true'
        })
        router.push(`/create-bucket?${params.toString()}`)
      }
    } catch (error) {
      console.error('Error in handleCreateBucket:', error)
      // Fallback: Navigate to create bucket page
      const params = new URLSearchParams({
        prefillTitle: product.name,
        prefillAmount: product.discountedPrice.toString(),
        fromDiscount: 'true'
      })
      router.push(`/create-bucket?${params.toString()}`)
    }
  }

  const getRandomColor = () => {
    const colors = ['#B6F3AD', '#BFB0FF', '#FDB86A', '#96CEB4', '#FECA57', '#45B7D1', '#A3D5FF', '#CC99FF']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header with back button */}
        <div 
          className="flex items-center justify-between mb-6"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon" 
            icon={<ArrowLeft />} 
            onClick={() => router.back()}
          />
        </div>

        {/* Brand Header */}
        <div 
          className="mb-6"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[28px] font-semibold text-foreground mb-3"
            style={{ letterSpacing: '-0.03em' }}
          >
            {brandName}
          </h1>
        </div>

        {/* Products Grid - E-commerce style */}
        <div className="grid grid-cols-2 gap-4 mb-20">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="bg-secondary rounded-2xl p-4 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ 
                animation: `fadeInUp 0.5s ease-out ${0.3 + index * 0.1}s both`
              }}
            >
              <div className="flex flex-col h-full">
                {/* Product image */}
                <div className="w-full h-32 bg-secondary/50 rounded-md mb-3 overflow-hidden relative">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                
                {/* Product name */}
                <h3 className="font-semibold text-foreground text-[16px] mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                {/* Price section with discount badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-[18px]">
                      ${product.discountedPrice}
                    </span>
                    <span className="text-foreground/60 line-through text-[18px]">
                      ${product.originalPrice}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded-full">
                    {product.discount}
                  </span>
                </div>
                
                {/* Create Bucket Button */}
                <Button
                  onClick={() => handleCreateBucket(product)}
                  variant="secondary"
                  className="w-full py-2 rounded-xl font-medium text-sm mt-auto"
                >
                  Create Bucket
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom spacing */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}