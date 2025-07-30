// Live Region Component for Accessibility
// Task 3.3.4: Accessibility Remediation - Critical Fix #2
// 
// ARIA live region for announcing dynamic content changes to screen readers

import React, { useRef } from 'react'
import { cn } from '../../lib/utils'

interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text' | 'additions removals' | 'removals additions' | 'removals text' | 'text additions' | 'text removals'
  className?: string
}

/**
 * LiveRegion component for announcing dynamic content changes to screen readers.
 * 
 * @param politeness - How urgently the screen reader should announce changes
 *   - 'polite': Wait for current speech to finish (default)
 *   - 'assertive': Interrupt current speech immediately
 *   - 'off': Don't announce changes
 * @param atomic - Whether to read the entire region or just changes
 * @param relevant - What types of changes to announce
 * @param className - Additional CSS classes
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = false,
  relevant = 'additions text',
  className
}) => {
  const regionRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={regionRef}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(
        // Visually hidden but accessible to screen readers
        'sr-only',
        className
      )}
      role="status"
    >
      {children}
    </div>
  )
}

/**
 * Hook for managing live region announcements
 */
export const useLiveRegion = () => {
  const [announcement, setAnnouncement] = React.useState<string>('')
  
  const announce = React.useCallback((message: string, _politeness: 'polite' | 'assertive' = 'polite') => {
    // Clear previous announcement first to ensure new one is read
    setAnnouncement('')
    
    // Use setTimeout to ensure the clearing happens before the new announcement
    setTimeout(() => {
      setAnnouncement(message)
    }, 10)
    
    // Clear announcement after a delay to prevent it from persisting
    setTimeout(() => {
      setAnnouncement('')
    }, 1000)
  }, [])
  
  return {
    announcement,
    announce
  }
}

/**
 * Status announcer component for dynamic status updates
 */
interface StatusAnnouncerProps {
  message: string
  politeness?: 'polite' | 'assertive'
  className?: string
}

export const StatusAnnouncer: React.FC<StatusAnnouncerProps> = ({
  message,
  politeness = 'polite',
  className
}) => {
  return (
    <LiveRegion politeness={politeness} className={className}>
      {message}
    </LiveRegion>
  )
}

export default LiveRegion
