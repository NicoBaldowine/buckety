"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function Select({ 
  value, 
  onValueChange, 
  placeholder = "Select...", 
  children, 
  className,
  disabled = false 
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Get display text for selected value
  const getDisplayText = () => {
    if (!value) return placeholder
    
    const selectedOption = React.Children.toArray(children).find((child) => {
      if (React.isValidElement(child) && child.props.value === value) {
        return true
      }
      return false
    })
    
    if (React.isValidElement(selectedOption)) {
      return selectedOption.props.children
    }
    
    return value
  }

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
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      })
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-foreground/20 bg-background px-4 py-3 text-[16px] font-medium text-foreground focus:outline-none focus:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{ letterSpacing: '-0.03em' }}
      >
        <span className={value ? "text-foreground" : "text-foreground/50"}>
          {getDisplayText()}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-foreground/40 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed rounded-xl bg-background border border-foreground/20 shadow-lg py-2 max-h-60 overflow-y-auto"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 99999
          }}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<SelectItemProps>, {
                onClick: () => handleSelect(child.props.value),
                isSelected: child.props.value === value
              })
            }
            return child
          })}
        </div>,
        document.body
      )}
    </>
  )
}

export interface SelectItemProps {
  value: string
  children: React.ReactNode
  onClick?: () => void
  isSelected?: boolean
  className?: string
}

export function SelectItem({ 
  value, 
  children, 
  onClick, 
  isSelected = false, 
  className 
}: SelectItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 text-left text-[16px] font-medium transition-colors hover:bg-foreground/5 cursor-pointer",
        isSelected && "bg-foreground/5 text-foreground font-semibold",
        !isSelected && "text-foreground/80",
        className
      )}
      style={{ letterSpacing: '-0.03em' }}
    >
      {children}
    </button>
  )
}