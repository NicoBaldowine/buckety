"use client"

import React, { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface VerificationInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function VerificationInput({ 
  value = '', 
  onChange, 
  disabled = false,
  className 
}: VerificationInputProps) {
  const [values, setValues] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Update internal state when prop value changes
  useEffect(() => {
    if (value === '') {
      setValues(['', '', '', '', '', ''])
    } else {
      const newValues = value.split('').concat(['', '', '', '', '', '']).slice(0, 6)
      setValues(newValues)
    }
  }, [value])

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, '').slice(-1)
    
    const newValues = [...values]
    newValues[index] = digit
    setValues(newValues)
    
    // Call parent onChange with the full string
    onChange(newValues.join(''))
    
    // Auto-focus next input if digit was entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        // If current input is empty and backspace is pressed, focus previous input
        inputRefs.current[index - 1]?.focus()
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    const newValues = pastedData.split('').concat(['', '', '', '', '', '']).slice(0, 6)
    setValues(newValues)
    onChange(newValues.join(''))
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newValues.findIndex(v => !v)
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {values.map((digit, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-xl font-mono rounded-lg",
            "border-2 border-border bg-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed",
            digit && "border-foreground/20"
          )}
          autoComplete="off"
        />
      ))}
    </div>
  )
}