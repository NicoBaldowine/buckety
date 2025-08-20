import * as React from "react"
import { cn } from "@/lib/utils"

export interface ActivityListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  date: string
  amount?: string
}

const ActivityListItem = React.forwardRef<HTMLDivElement, ActivityListItemProps>(
  ({ className, title, date, amount, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between py-4 border-b border-black/10 last:border-b-0",
          className
        )}
        {...props}
      >
        <div>
          <h4 className="text-[16px] font-semibold text-black" style={{ letterSpacing: '-0.03em' }}>
            {title}
          </h4>
          <p className="text-[14px] font-medium text-black/50 mt-1" style={{ letterSpacing: '-0.03em' }}>
            {date}
          </p>
        </div>
        {amount && (
          <div className="text-[16px] font-semibold text-black" style={{ letterSpacing: '-0.03em' }}>
            {amount}
          </div>
        )}
      </div>
    )
  }
)
ActivityListItem.displayName = "ActivityListItem"

export { ActivityListItem }