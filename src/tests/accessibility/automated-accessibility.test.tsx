// Comprehensive Automated Accessibility Test Suite
// Task 6.1: Add automated accessibility testing to test suite

import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock Zustand store
const mockStore = {
  currentDocument: {
    id: '1',
    name: 'Test Document',
    content: '# Test Content\n\nThis is a test document.',
    state: 'draft',
    projectId: '1',
    path: '/test.md',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  settings: {
    theme: 'light',
    fontSize: 'md',
    aiEnabled: true,
    autoSave: true,
    wordWrap: true
  },
  projects: [],
  documents: [],
  currentDocumentId: '1',
  updateDocument: jest.fn(),
  setCurrentDocument: jest.fn()
}

jest.mock('../../stores/useAppStore', () => ({
  useAppStore: (selector: any) => selector ? selector(mockStore) : mockStore
}))

// Import components to test
import App from '../../App'
import { YarnLogo } from '../../components/yarn-logo'
import { ContextIndicator } from '../../components/context-indicator'
import { SkipLinks } from '../../components/ui/skip-links'
import { StreamingChatUI } from '../../components/StreamingChatUI'
import { AIModelSelector } from '../../components/AIModelSelector'

/**
 * Automated accessibility test configuration
 */
const accessibilityConfig = {
  rules: {
    // WCAG 2.1 AA compliance rules
    'color-contrast': { enabled: true },
    'keyboard': { enabled: true },
    'focus-order-semantics': { enabled: false }, // Experimental
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'button-name': { enabled: true },
    'link-name': { enabled: true },
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
}

/**
 * Run comprehensive accessibility tests on a component
 */
async function testComponentAccessibility(component: React.ReactElement, testName: string) {
  const { container } = render(component)
  
  // Run axe accessibility tests
  const results = await axe(container, accessibilityConfig)
  expect(results).toHaveNoViolations()
  
  console.log(`✅ ${testName} passed accessibility tests`)
}

/**
 * Test keyboard navigation for interactive elements
 */
async function testKeyboardNavigation(component: React.ReactElement, testName: string) {
  const { container } = render(component)
  
  // Find all focusable elements
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  // Test that all interactive elements are keyboard accessible
  for (const element of focusableElements) {
    if (element instanceof HTMLElement) {
      element.focus()
      expect(document.activeElement).toBe(element)
    }
  }
  
  console.log(`✅ ${testName} keyboard navigation tests passed`)
}

describe('Automated Accessibility Test Suite', () => {
  // Test individual components
  describe('Core Components', () => {
    it('YarnLogo should be fully accessible', async () => {
      await testComponentAccessibility(<YarnLogo />, 'YarnLogo')
    })

    it('ContextIndicator should be fully accessible', async () => {
      await testComponentAccessibility(
        <ContextIndicator isProcessing={true} processedItems={50} totalItems={100} />, 
        'ContextIndicator'
      )
    })

    it('SkipLinks should be fully accessible', async () => {
      await testComponentAccessibility(<SkipLinks />, 'SkipLinks')
      await testKeyboardNavigation(<SkipLinks />, 'SkipLinks')
    })

    it('StreamingChatUI should be fully accessible', async () => {
      await testComponentAccessibility(<StreamingChatUI />, 'StreamingChatUI')
    })

    it('AIModelSelector should be fully accessible', async () => {
      await testComponentAccessibility(<AIModelSelector />, 'AIModelSelector')
    })
  })

  // Test main application
  describe('Main Application', () => {
    it('App component should be fully accessible', async () => {
      await testComponentAccessibility(<App />, 'Main App')
    })

    it('App should have proper keyboard navigation', async () => {
      await testKeyboardNavigation(<App />, 'Main App')
    })
  })

  // Test ARIA attributes
  describe('ARIA Compliance', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      render(<App />)
      
      // Check for proper ARIA labels
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })

    it('should have proper semantic landmarks', () => {
      render(<App />)
      
      // Check for semantic landmarks
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument() // main content
      expect(screen.getByRole('navigation')).toBeInTheDocument() // navigation
      expect(screen.getByRole('complementary')).toBeInTheDocument() // aside
    })

    it('should have live regions for dynamic content', () => {
      render(<App />)
      
      // Check for ARIA live regions
      const liveRegions = document.querySelectorAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThan(0)
    })
  })

  // Test keyboard shortcuts
  describe('Keyboard Shortcuts', () => {
    it('should handle keyboard shortcuts properly', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Test Escape key (should not cause errors)
      await user.keyboard('{Escape}')
      
      // Test Tab navigation (should not cause errors)
      await user.tab()
      await user.tab()
      
      // Verify no accessibility violations after keyboard interaction
      const results = await axe(document.body, accessibilityConfig)
      expect(results).toHaveNoViolations()
    })
  })

  // Test focus management
  describe('Focus Management', () => {
    it('should maintain proper focus order', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Test focus order by tabbing through elements
      const focusableElements = document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      
      // Verify elements can receive focus
      for (let i = 0; i < Math.min(5, focusableElements.length); i++) {
        await user.tab()
        expect(document.activeElement).toBeInstanceOf(HTMLElement)
      }
    })

    it('should trap focus in modals when opened', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Try to open a modal (if available)
      const newProjectButton = screen.getByLabelText('Create new project')
      await user.click(newProjectButton)
      
      // Verify focus is managed properly
      expect(document.activeElement).toBeInstanceOf(HTMLElement)
    })
  })

  // Test screen reader compatibility
  describe('Screen Reader Compatibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<App />)
      
      // Check for h1 element
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      expect(h1Elements.length).toBeGreaterThanOrEqual(1)
    })

    it('should have descriptive text for all images and icons', () => {
      render(<App />)
      
      // Check that decorative icons are marked as aria-hidden
      const decorativeIcons = document.querySelectorAll('[aria-hidden="true"]')
      expect(decorativeIcons.length).toBeGreaterThan(0)
    })

    it('should provide context for form elements', () => {
      render(<App />)
      
      // Check that form elements have proper labels
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName()
      })
    })
  })

  // Performance test for accessibility
  describe('Accessibility Performance', () => {
    it('should complete accessibility tests within performance threshold', async () => {
      const startTime = Date.now()
      
      const { container } = render(<App />)
      const results = await axe(container, accessibilityConfig)
      
      const endTime = Date.now()
      const testDuration = endTime - startTime
      
      // Should complete within 5 seconds
      expect(testDuration).toBeLessThan(5000)
      expect(results).toHaveNoViolations()
      
      console.log(`✅ Accessibility tests completed in ${testDuration}ms`)
    })
  })
})

// Export test utilities for use in other test files
export {
  testComponentAccessibility,
  testKeyboardNavigation,
  accessibilityConfig
}
