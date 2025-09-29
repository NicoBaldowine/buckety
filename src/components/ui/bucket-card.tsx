import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Repeat, CheckCircle } from "lucide-react"

export interface BucketCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  currentAmount: number
  targetAmount: number
  apy?: number
  backgroundColor?: string
  hasAutoDeposit?: boolean
}

const BucketCard = React.forwardRef<HTMLDivElement, BucketCardProps>(
  ({ 
    className, 
    title, 
    currentAmount, 
    targetAmount, 
    // apy = 3.5, // Unused parameter commented out 
    backgroundColor = "#B6F3AD",
    hasAutoDeposit = false,
    ...props 
  }, ref) => {
    const progress = Math.min((currentAmount / targetAmount) * 100, 100)
    
    // Function to darken the background color
    const darkenColor = (color: string, amount: number = 0.1) => {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      
      const newR = Math.max(0, Math.floor(r * (1 - amount)))
      const newG = Math.max(0, Math.floor(g * (1 - amount)))
      const newB = Math.max(0, Math.floor(b * (1 - amount)))
      
      return `rgb(${newR}, ${newG}, ${newB})`
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "p-8 rounded-[24px] cursor-pointer transition-all duration-300 ease-out relative",
          className
        )}
        style={{ 
          backgroundColor
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = darkenColor(backgroundColor, 0.08)
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = backgroundColor
        }}
        {...props}
      >
        {/* Auto deposit indicator */}
        {hasAutoDeposit && progress < 100 && (
          <div className="absolute top-6 right-6">
            <div className="bg-black/10 rounded-full p-2">
              <Repeat className="h-4 w-4 text-black/70" />
            </div>
          </div>
        )}
        
        {/* Completion indicator */}
        {progress >= 100 && (
          <div className="absolute top-6 right-6">
            <div className="bg-black/10 rounded-full p-2">
              <CheckCircle className="h-4 w-4 text-black/70" />
            </div>
          </div>
        )}
        
        {/* Header with title */}
        <div className="mb-0">
          <h3 className="text-[24px] font-extrabold text-black" style={{ letterSpacing: '-0.04em' }}>
            {title}
          </h3>
        </div>
        
        {/* Amount section */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-[20px] font-semibold tracking-tight text-black">
              ${currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[20px] font-semibold tracking-tight text-black/40">
              of ${targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative">
          <Progress value={progress} max={100} className="w-full" backgroundColor={backgroundColor} />
          {progress < 90 && (
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 pointer-events-none"
              style={{ left: `max(calc(${progress}% + 8px), 16px)` }}
            >
              <span className="text-[14px] font-semibold text-black/70">
                {progress.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }
)
BucketCard.displayName = "BucketCard"

export { BucketCard }