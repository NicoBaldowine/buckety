"use client"

import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function EarningsPage() {
  return (
    <ProtectedRoute>
      <EarningsContent />
    </ProtectedRoute>
  )
}

function EarningsContent() {
  const router = useRouter()
  const { user } = useAuth()
  interface ChartDataPoint {
    month: string
    balance: number
    earnings: number
    deposit: number
  }

  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [hoveredData, setHoveredData] = useState<ChartDataPoint | null>(null)
  const [displayBalance, setDisplayBalance] = useState(0)
  const [displayEarnings, setDisplayEarnings] = useState(0)

  // Calculate earnings data from user's actual buckets and transactions
  useEffect(() => {
    const calculateEarningsData = async () => {
      if (!user?.id) return
      
      try {
        // TODO: Replace with real data from Supabase
        // const { buckets, mainBucket, transactions } = await getUserFinancialData(user.id)
        
        // For now, use demo data until real data integration
        const demoData = generateDemoEarningsData()
        setChartData(demoData)
        
        // Set initial display to current values (last month)
        const lastData = demoData[demoData.length - 1]
        if (lastData) {
          setDisplayBalance(lastData.balance)
          setDisplayEarnings(lastData.earnings)
        }
      } catch (error) {
        console.error('Error calculating earnings data:', error)
      }
    }
    
    calculateEarningsData()
  }, [user?.id])
  
  // Generate demo earnings data - will be replaced with real data calculation
  const generateDemoEarningsData = () => {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
    const data = []
    // Realistic deposit pattern for demo
    const monthlyDeposits = [
      250,  // Sep - initial
      30,   // Oct - small
      85,   // Nov - medium
      20,   // Dec - holiday season
      150,  // Jan - new year
      45,   // Feb - regular
      75,   // Mar - tax refund
      120,  // Apr - good month
      60,   // May - average
      180,  // Jun - bonus
      95,   // Jul - summer
      90    // Aug - final
    ]
    
    let runningBalance = 0
    let totalEarningsAccumulated = 0
    
    for (let i = 0; i < 12; i++) {
      runningBalance += monthlyDeposits[i]
      
      // 6% APY = 0.5% per month
      const monthlyInterest = runningBalance * 0.005
      totalEarningsAccumulated += monthlyInterest
      
      data.push({
        month: months[i],
        balance: Math.round(runningBalance),
        earnings: parseFloat(totalEarningsAccumulated.toFixed(2)),
        deposit: monthlyDeposits[i]
      })
      
      runningBalance += monthlyInterest
    }
    
    return data
  }


  // Reset to current values when hover ends
  const handleMouseLeave = () => {
    setHoveredData(null)
    const lastData = chartData[chartData.length - 1]
    if (lastData) {
      setDisplayBalance(lastData.balance)
      setDisplayEarnings(lastData.earnings)
    }
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header with back button */}
        <div 
          className="flex items-center justify-between mb-15"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon" 
            icon={<ArrowLeft />} 
            onClick={() => router.push('/home')}
          />
        </div>

        {/* Title */}
        <div 
          className="mb-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-semibold text-foreground mb-3"
            style={{ letterSpacing: '-0.03em' }}
          >
            Earnings
          </h1>
          <p className="text-[16px] text-foreground/60 leading-relaxed">
            Your earnings are calculated with a <span className="font-semibold text-foreground">6% APY</span> annual interest rate. 
            This applies to your total balance across all buckets.
          </p>
        </div>

        {/* Combined Earnings Card */}
        <div 
          className="bg-secondary rounded-[24px] p-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          {/* Total Balance and Total Earned - Interactive Values */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-[14px] text-foreground/50 font-medium mb-0">
                Total Balance
              </p>
              <p className="text-[32px] font-semibold text-foreground transition-all duration-200" style={{ letterSpacing: '-0.03em' }}>
                ${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[14px] text-foreground/50 font-medium mb-0">
                Total Earned {hoveredData ? `${hoveredData.month}` : `Aug 29, 2025`}
              </p>
              <p className="text-[32px] font-semibold transition-all duration-200" style={{ color: '#19B802', letterSpacing: '-0.03em' }}>
                +${displayEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          {/* Professional Interactive Chart */}
          <div 
            className="h-[250px] -mx-4 max-sm:-mx-6" 
            onMouseLeave={handleMouseLeave} 
            style={{ 
              outline: 'none', 
              border: 'none'
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData}
                onMouseMove={(event: unknown) => {
                  if (event && typeof event === 'object' && 'activePayload' in event) {
                    const eventObj = event as { activePayload?: Array<{ payload: ChartDataPoint }> }
                    if (Array.isArray(eventObj.activePayload) && eventObj.activePayload.length > 0) {
                      const payload = eventObj.activePayload[0].payload
                      setHoveredData(payload)
                      setDisplayBalance(payload.balance)
                      setDisplayEarnings(payload.earnings)
                    }
                  }
                }}
                margin={{ top: 10, right: 30, left: 15, bottom: 30 }}
              >
                {/* Define gradient and pattern */}
                <defs>
                  <pattern 
                    id="diagonalStripes" 
                    patternUnits="userSpaceOnUse" 
                    width="8" 
                    height="8"
                    patternTransform="rotate(-45)"
                  >
                    <rect width="8" height="8" fill="#19B802" opacity="0.15" />
                    <rect width="1" height="8" fill="#19B802" opacity="0.8" />
                  </pattern>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#19B802" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#19B802" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="0" 
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                  axisLine={false}
                  tickLine={false}
                />
                
                <YAxis 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                  width={45}
                />
                
                <Tooltip
                  content={() => null}
                  cursor={{ stroke: '#19B802', strokeWidth: 1, strokeOpacity: 0.5 }}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#19B802" 
                  strokeWidth={2}
                  fill="url(#diagonalStripes)"
                  fillOpacity={1}
                  animationDuration={1000}
                  animationBegin={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
        </div>
      </div>
    </div>
  )
}