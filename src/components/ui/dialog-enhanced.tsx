// Enhanced Dialog Component with Focus Trap
// Task 3.3.4: Accessibility Remediation - Critical Fix #1

import React, { useEffect, useRef, useCallback } from 'react'
import { createFocusTrap } from 'focus-trap'
import { X } from 'lucide-react'
import { Button } from './button'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  initialFocusRef?: React.RefObject<HTMLElement>
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const DialogEnhanced: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
  initialFocusRef,
  size = 'md'
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const focusTrapRef = useRef<any>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)

  // Store the element that triggered the dialog
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Focus trap implementation
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Create focus trap
      focusTrapRef.current = createFocusTrap(dialogRef.current, {
        initialFocus: initialFocusRef?.current || '[data-autofocus]',
        returnFocusOnDeactivate: false, // We'll handle this manually
        escapeDeactivates: true,
        clickOutsideDeactivates: true,
        onDeactivate: () => {
          onClose()
        },
        fallbackFocus: dialogRef.current
      })
      
      try {
        focusTrapRef.current.activate()
      } catch (error) {
        console.warn('Focus trap activation failed:', error)
      }
      
      return () => {
        if (focusTrapRef.current) {
          try {
            focusTrapRef.current.deactivate()
          } catch (error) {
            console.warn('Focus trap deactivation failed:', error)
          }
        }
        
        // Return focus to trigger element
        if (triggerElementRef.current && triggerElementRef.current.focus) {
          triggerElementRef.current.focus()
        }
      }
    }
  }, [isOpen, onClose, initialFocusRef])

  // Handle Escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      onClose()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? "dialog-description" : undefined}
    >
      <div 
        ref={dialogRef}
        className={`
          bg-background border border-border rounded-lg shadow-lg 
          ${sizeClasses[size]} w-full max-h-[90vh] overflow-auto
          ${className}
        `}
      >
        {/* Dialog Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 
              id="dialog-title" 
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            {description && (
              <p 
                id="dialog-description" 
                className="text-sm text-muted-foreground mt-1"
              >
                {description}
              </p>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Dialog Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// Hook for managing dialog state
export const useDialog = (initialOpen = false) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen)
  
  const openDialog = useCallback(() => setIsOpen(true), [])
  const closeDialog = useCallback(() => setIsOpen(false), [])
  const toggleDialog = useCallback(() => setIsOpen(prev => !prev), [])
  
  return {
    isOpen,
    openDialog,
    closeDialog,
    toggleDialog
  }
}

export default DialogEnhanced
