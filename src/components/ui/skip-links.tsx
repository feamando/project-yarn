// Skip Links Component for Accessibility
// Task 3.3.4: Accessibility Remediation - Critical Fix #3
// 
// Skip navigation links for keyboard users to jump to main content areas

import React from 'react'
import { cn } from '../../lib/utils'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Individual skip link component that becomes visible when focused
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className 
}) => {
  return (
    <a
      href={href}
      className={cn(
        // Visually hidden by default
        'absolute left-[-10000px] top-auto w-[1px] h-[1px] overflow-hidden',
        // Visible when focused
        'focus:left-[6px] focus:top-[6px] focus:w-auto focus:h-auto focus:overflow-visible',
        // Styling when visible
        'focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded-md focus:shadow-lg focus:z-50',
        // Smooth transitions
        'transition-all duration-200',
        className
      )}
      onFocus={(e) => {
        // Ensure the link is visible when focused
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }}
    >
      {children}
    </a>
  )
}

/**
 * Skip links container component with common navigation links
 */
interface SkipLinksProps {
  className?: string
  customLinks?: Array<{ href: string; label: string }>
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ 
  className,
  customLinks = []
}) => {
  const defaultLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#file-explorer', label: 'Skip to file explorer' },
    { href: '#editor', label: 'Skip to editor' },
    { href: '#ai-chat', label: 'Skip to AI chat' },
  ]

  const allLinks = [...defaultLinks, ...customLinks]

  return (
    <nav 
      className={cn('sr-only focus-within:not-sr-only', className)}
      aria-label="Skip navigation links"
    >
      <ul className="flex flex-col gap-1">
        {allLinks.map((link, index) => (
          <li key={index}>
            <SkipLink href={link.href}>
              {link.label}
            </SkipLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Hook for managing skip link targets
 */
export const useSkipLinkTarget = (id: string) => {
  const targetProps = {
    id,
    tabIndex: -1, // Make focusable programmatically
    'aria-label': `Main ${id.replace('-', ' ')} area`,
  }

  return targetProps
}

export default SkipLinks
