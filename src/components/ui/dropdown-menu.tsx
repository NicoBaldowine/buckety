"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DropdownMenu({ trigger, children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 min-w-[180px] rounded-xl bg-background border border-black/10 shadow-lg z-50 py-2",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function DropdownMenuItem({ children, className, ...props }: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        "w-full px-4 py-3 text-left text-[15px] font-semibold text-foreground hover:bg-secondary transition-colors flex items-center gap-3 cursor-pointer whitespace-nowrap",
        className
      )}
      style={{ letterSpacing: '-0.03em' }}
      {...props}
    >
      {children}
    </button>
  )
}