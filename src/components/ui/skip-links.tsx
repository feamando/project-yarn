import React from 'react'
import { cn } from '@/lib/utils'
import { useSkipNavigation, useScreenReaderAnnouncements } from '@/hooks/useKeyboardNavigation'

interface SkipLinksProps {
  className?: string
}

interface SkipLinkItem {
  href: string
  label: string
  targetId: string
}

const SKIP_LINKS: SkipLinkItem[] = [
  { href: '#main-content', label: 'Skip to main content', targetId: 'main-content' },
  { href: '#file-explorer', label: 'Skip to file explorer', targetId: 'file-explorer' },
  { href: '#editor', label: 'Skip to editor', targetId: 'editor' },
  { href: '#ai-assistant', label: 'Skip to AI assistant', targetId: 'ai-assistant' }
]

export function SkipLinks({ className }: SkipLinksProps) {
  const { skipToContent } = useSkipNavigation()
  const { announce } = useScreenReaderAnnouncements()
  
  const handleSkipClick = (e: React.MouseEvent, targetId: string, label: string) => {
    e.preventDefault()
    skipToContent(targetId)
    announce(`Navigated to ${label.toLowerCase()}`, 'polite')
  }
  
  return (
    <nav 
      className={cn(
        "sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50",
        className
      )}
      aria-label="Skip navigation links"
    >
      <ul className="flex gap-2">
        {SKIP_LINKS.map((link) => (
          <li key={link.targetId}>
            <a
              href={link.href}
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-v0-border-primary focus:ring-offset-2 transition-all"
              onClick={(e) => handleSkipClick(e, link.targetId, link.label)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSkipClick(e as any, link.targetId, link.label)
                }
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Hook for managing skip link targets
export const useSkipLinkTarget = (id: string) => {
  React.useEffect(() => {
    const element = document.getElementById(id)
    if (element && !element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1')
    }
  }, [id])
}

export default SkipLinks
