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
  fullScreen?: boolean
}

export function Modal({ isOpen, onClose, title, children, className, fullScreen = false }: ModalProps) {
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

  // Full screen modal (existing behavior)
  if (fullScreen) {
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

  // Overlay modal (new behavior)
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative bg-background rounded-[24px] p-8 max-w-[480px] w-full shadow-xl",
            className
          )}
          style={{ animation: 'modalSlideUp 0.3s ease-out' }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <h2 
              className="text-[32px] font-semibold text-foreground mb-6"
              style={{ letterSpacing: '-0.03em' }}
            >
              {title}
            </h2>
          )}
          
          {children}
        </div>
      </div>
    </>
  )
}

// Confirmation Modal Component
export interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "primary"
  loading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false
}: ConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }

  const isLoading = loading || isProcessing

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <h2 
          className="text-[32px] font-semibold text-foreground mb-3"
          style={{ letterSpacing: '-0.03em' }}
        >
          {title}
        </h2>
        
        <p className="text-[16px] text-foreground/60 mb-8 leading-relaxed">
          {description}
        </p>
        
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 !bg-secondary !text-secondary-foreground hover:!bg-secondary/80"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1",
              variant === "danger" ? "!bg-[#EF4444] hover:!bg-[#DC2626] !text-white" : ""
            )}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}