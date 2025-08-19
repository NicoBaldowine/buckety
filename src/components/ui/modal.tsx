"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Full Screen Content */}
      <div className="min-h-screen bg-background transition-all duration-500 ease-out">
        <div className="max-w-[660px] mx-auto px-12 py-6">
          {/* Header */}
          <div 
            className="flex items-center justify-between mb-15"
            style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
          >
            {title && (
              <h1 
                className="text-[40px] font-semibold text-foreground"
                style={{ letterSpacing: '-0.03em' }}
              >
                {title}
              </h1>
            )}
            <Button 
              variant="secondary-icon"
              icon={<X />}
              onClick={onClose}
              className="ml-auto"
            />
          </div>

          {/* Content */}
          <div style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}