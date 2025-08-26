import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  backgroundColor?: string
  isCompleted?: boolean
  showCompletionBadge?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, backgroundColor, isCompleted = false, showCompletionBadge = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const uniqueId = React.useId()
    
    return (
      <div
        ref={ref}
        className={cn("relative h-10 w-full", className)}
        style={{ position: 'relative', zIndex: 1 }}
        {...props}
      >
        <svg
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <pattern
              id={`diagonal-stripes-${uniqueId}`}
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
              patternTransform="rotate(-45)"
            >
              <rect width="8" height="8" fill="transparent" />
              <rect width="1" height="8" fill="#000000" />
            </pattern>
            
            {/* Clip path for progress bar to ensure stripes stay within rounded corners */}
            <clipPath id={`progress-clip-${uniqueId}`}>
              <rect
                x="1"
                y="1"
                width={`calc(${percentage}% - 2px)`}
                height="38"
                rx="12"
                ry="12"
              />
            </clipPath>
          </defs>
          
          {/* Background pill */}
          <rect
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="38"
            rx="12"
            ry="12"
            fill="#000000"
            fillOpacity="0.1"
          />
          
          {/* Progress fill with diagonal stripes - now properly clipped */}
          <g clipPath={`url(#progress-clip-${uniqueId})`}>
            <rect
              x="1"
              y="1"
              width="100%"
              height="38"
              fill={`url(#diagonal-stripes-${uniqueId})`}
            />
          </g>
          
          {/* Divider stroke between filled and remaining areas */}
          {percentage > 0 && percentage < 100 && (
            <line
              x1={`${percentage}%`}
              y1="1"
              x2={`${percentage}%`}
              y2="39"
              stroke="#000000"
              strokeWidth="1"
            />
          )}
          
          {/* Stroke outline */}
          <rect
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="38"
            rx="12"
            ry="12"
            fill="none"
            stroke="#000000"
            strokeWidth="1"
          />
        </svg>
        
        {/* Completion badge - positioned absolutely on top */}
        {isCompleted && showCompletionBadge && (
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ zIndex: 50 }}
          >
            <div 
              className="inline-flex items-center gap-1 px-3 py-1.5 text-black rounded-full h-7 shadow-sm border border-black/10"
              style={{ backgroundColor: backgroundColor || 'white' }}
            >
              <span className="text-sm">🎉</span>
              <span className="text-[12px] font-semibold" style={{ letterSpacing: '-0.02em' }}>
                Bucket completed
              </span>
            </div>
          </div>
        )}
        
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }