import * as React from "react"
import { cn } from "@/lib/utils"
import { Plus, Minus, Car, Sparkles, Repeat, Download } from "lucide-react"

export interface ActivityListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  date: string
  amount?: string
  activityType?: 'money_added' | 'money_removed' | 'withdrawal' | 'bucket_created' | 'auto_deposit' | 'auto_deposit_started' | 'apy_earnings'
  backgroundColor?: string
}

const ActivityListItem = React.forwardRef<HTMLDivElement, ActivityListItemProps>(
  ({ className, title, date, amount, activityType, backgroundColor, ...props }, ref) => {
    
    // Determine icon based on activity type or title
    const getActivityIcon = () => {
      // Check activity type first
      if (activityType) {
        switch (activityType) {
          case 'money_added':
          case 'auto_deposit':
          case 'apy_earnings':
            return <Plus className="h-4 w-4 text-black" />
          case 'money_removed':
            return <Minus className="h-4 w-4 text-black" />
          case 'withdrawal':
            return <Download className="h-4 w-4 text-black" />
          case 'bucket_created':
            return <Sparkles className="h-4 w-4 text-black" />
          case 'auto_deposit_started':
            return <Repeat className="h-4 w-4 text-black" />
          default:
            return <Plus className="h-4 w-4 text-black" />
        }
      }
      
      // Fallback: Determine by title content
      const lowerTitle = title.toLowerCase()
      if (lowerTitle.includes('to ') && lowerTitle.includes('subaru')) {
        return <Car className="h-4 w-4 text-black" />
      } else if (lowerTitle.includes('from ')) {
        return <Plus className="h-4 w-4 text-black" />
      } else if (lowerTitle.includes('to ')) {
        return <Minus className="h-4 w-4 text-black" />
      } else if (lowerTitle.includes('withdraw')) {
        return <Download className="h-4 w-4 text-black" />
      } else if (lowerTitle.includes('auto')) {
        return <Repeat className="h-4 w-4 text-black" />
      } else if (lowerTitle.includes('created')) {
        return <Sparkles className="h-4 w-4 text-black" />
      }
      
      // Default icon based on amount
      if (amount) {
        return amount.startsWith('+') ? 
          <Plus className="h-4 w-4 text-black" /> : 
          <Minus className="h-4 w-4 text-black" />
      }
      
      return <Plus className="h-4 w-4 text-black" />
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 py-4 border-b border-black/10 last:border-b-0",
          className
        )}
        {...props}
      >
        {/* Activity icon circle */}
        <div 
          className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
        >
          {getActivityIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h4 className="text-[16px] font-semibold text-black" style={{ letterSpacing: '-0.03em' }}>
              {title}
            </h4>
            <p className="text-[14px] font-medium text-black/50 mt-0.5" style={{ letterSpacing: '-0.03em' }}>
              {date}
            </p>
          </div>
          {amount && (
            <div className="text-[16px] font-semibold text-black" style={{ letterSpacing: '-0.03em' }}>
              {amount}
            </div>
          )}
        </div>
      </div>
    )
  }
)
ActivityListItem.displayName = "ActivityListItem"

export { ActivityListItem }