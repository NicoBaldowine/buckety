import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        "secondary-icon": "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border-2 border-foreground/40 bg-transparent text-foreground hover:bg-foreground/10 hover:border-foreground/60",
        avatar: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full",
      },
      size: {
        default: "h-[45px] px-6 py-4 text-[15px] rounded-xl",
        sm: "h-8 px-3 text-xs rounded-lg",
        icon: "h-[45px] w-[45px] p-0 rounded-xl",
        avatar: "h-[45px] w-[45px] p-0 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  initial?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, iconPosition = "left", initial, children, ...props }, ref) => {
    const isIconOnly = variant === "secondary-icon"
    const isAvatar = variant === "avatar"
    
    // Determine the size to use
    let buttonSize = size
    if (isIconOnly && size !== "avatar") {
      buttonSize = "icon"
    } else if (isAvatar) {
      buttonSize = "avatar"
    }
    
    return (
      <button
        className={cn(buttonVariants({ variant, size: buttonSize, className }))}
        ref={ref}
        {...props}
      >
        {isAvatar && initial ? (
          initial.toUpperCase()
        ) : isIconOnly ? (
          icon
        ) : (
          <>
            {icon && iconPosition === "left" && icon}
            {children}
            {icon && iconPosition === "right" && icon}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }