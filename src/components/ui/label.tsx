import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  // Additional props can be added here if needed
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-[16px] font-semibold text-foreground mb-2 block",
          className
        )}
        style={{ letterSpacing: '-0.03em' }}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }