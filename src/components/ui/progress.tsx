import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  backgroundColor?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, backgroundColor, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const uniqueId = React.useId()
    
    return (
      <div
        ref={ref}
        className={cn("relative h-10 w-full", className)}
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
          
          {/* Progress fill with diagonal stripes */}
          <rect
            x="1"
            y="1"
            width={`calc(${percentage}% - 2px)`}
            height="38"
            rx="12"
            ry="12"
            fill={`url(#diagonal-stripes-${uniqueId})`}
          />
          
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
        
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }