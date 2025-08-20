"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DropdownMenu({ trigger, children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, right: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8, // 8px margin
        right: window.innerWidth - rect.right
      })
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <div ref={triggerRef}>
        <div onClick={handleToggle} className="cursor-pointer">
          {trigger}
        </div>
      </div>
      
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className={cn(
            "fixed min-w-[180px] rounded-xl bg-background border border-black/10 shadow-lg py-2",
            className
          )}
          style={{
            top: position.top,
            right: position.right,
            zIndex: 99999
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </>
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