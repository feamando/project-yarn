// UI Components Accessibility Tests
// Task 3.3.3: Accessibility Audit Implementation

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  runComprehensiveAccessibilityTest,
  AccessibilityAuditReport,
  type AccessibilityIssue
} from './accessibility-test-utils'

// Import UI components
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Checkbox } from '../../components/ui/checkbox'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Progress } from '../../components/ui/progress'
import { ScrollArea } from '../../components/ui/scroll-area'

describe('UI Components Accessibility Tests', () => {
  let auditReport: AccessibilityAuditReport

  beforeEach(() => {
    auditReport = new AccessibilityAuditReport()
  })

  describe('Button Component', () => {
    it('should be fully accessible', async () => {
      const ButtonTest = () => (
        <div>
          <Button>Default Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button size="sm">Small Button</Button>
          <Button size="lg">Large Button</Button>
        </div>
      )

      await runComprehensiveAccessibilityTest(<ButtonTest />, {
        focusableElements: ['button:not([disabled])'],
        ariaAttributes: {
          'button': ['type', 'role']
        },
        contrastTests: [
          { selector: 'button', expectedRatio: 4.5, textSize: 'normal' }
        ],
        screenReaderTests: {
          'button[disabled]': 'disabled'
        }
      })
    })

    it('should handle keyboard interactions correctly', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button onClick={handleClick}>Test Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Test Button' })
      
      // Test Enter key
      button.focus()
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      // Test Space key
      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('should have proper focus indicators', () => {
      render(<Button>Focus Test</Button>)
      const button = screen.getByRole('button')
      
      button.focus()
      
      // Check focus styles are applied
      const styles = window.getComputedStyle(button)
      expect(styles.outline).not.toBe('none')
    })
  })

  describe('Input Component', () => {
    it('should be fully accessible', async () => {
      const InputTest = () => (
        <div>
          <Label htmlFor="test-input">Test Input</Label>
          <Input id="test-input" placeholder="Enter text..." />
          
          <Label htmlFor="disabled-input">Disabled Input</Label>
          <Input id="disabled-input" disabled placeholder="Disabled..." />
          
          <Label htmlFor="required-input">Required Input *</Label>
          <Input id="required-input" required aria-describedby="required-help" />
          <div id="required-help">This field is required</div>
        </div>
      )

      await runComprehensiveAccessibilityTest(<InputTest />, {
        focusableElements: ['input:not([disabled])'],
        ariaAttributes: {
          'input[required]': ['aria-describedby', 'required'],
          'input[disabled]': ['disabled']
        },
        screenReaderTests: {
          'label[for="test-input"]': 'Test Input',
          'input[required]': 'required'
        }
      })
    })

    it('should announce validation errors', async () => {
      const InputWithError = () => (
        <div>
          <Label htmlFor="error-input">Email</Label>
          <Input 
            id="error-input" 
            type="email" 
            aria-invalid="true"
            aria-describedby="error-message"
          />
          <div id="error-message" role="alert">
            Please enter a valid email address
          </div>
        </div>
      )

      const { container } = render(<InputWithError />)
      
      const input = screen.getByLabelText('Email')
      const errorMessage = screen.getByRole('alert')
      
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
      expect(errorMessage).toHaveTextContent('Please enter a valid email address')
    })
  })

  describe('Checkbox Component', () => {
    it('should be fully accessible', async () => {
      const CheckboxTest = () => (
        <div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="newsletter" defaultChecked />
            <Label htmlFor="newsletter">Subscribe to newsletter</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="disabled-check" disabled />
            <Label htmlFor="disabled-check">Disabled option</Label>
          </div>
        </div>
      )

      await runComprehensiveAccessibilityTest(<CheckboxTest />, {
        focusableElements: ['[role="checkbox"]:not([disabled])'],
        ariaAttributes: {
          '[role="checkbox"]': ['aria-checked'],
          '[role="checkbox"][disabled]': ['disabled']
        },
        screenReaderTests: {
          'label[for="terms"]': 'Accept terms and conditions'
        }
      })
    })

    it('should toggle state with keyboard', async () => {
      const user = userEvent.setup()
      
      render(
        <div className="flex items-center space-x-2">
          <Checkbox id="keyboard-test" />
          <Label htmlFor="keyboard-test">Keyboard Test</Label>
        </div>
      )
      
      const checkbox = screen.getByRole('checkbox')
      
      // Test Space key toggles checkbox
      checkbox.focus()
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
      
      await user.keyboard(' ')
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
      
      await user.keyboard(' ')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('Progress Component', () => {
    it('should be fully accessible', async () => {
      const ProgressTest = () => (
        <div>
          <Label htmlFor="progress-1">Loading progress</Label>
          <Progress id="progress-1" value={33} aria-label="Loading progress: 33%" />
          
          <Label htmlFor="progress-2">Upload progress</Label>
          <Progress id="progress-2" value={75} max={100} aria-label="Upload progress: 75 of 100" />
        </div>
      )

      await runComprehensiveAccessibilityTest(<ProgressTest />, {
        ariaAttributes: {
          '[role="progressbar"]': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-label']
        },
        screenReaderTests: {
          '[aria-label*="33%"]': '33%',
          '[aria-label*="75 of 100"]': '75 of 100'
        }
      })
    })
  })

  describe('Textarea Component', () => {
    it('should be fully accessible', async () => {
      const TextareaTest = () => (
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            placeholder="Enter your description..."
            aria-describedby="description-help"
          />
          <div id="description-help">Maximum 500 characters</div>
        </div>
      )

      await runComprehensiveAccessibilityTest(<TextareaTest />, {
        focusableElements: ['textarea'],
        ariaAttributes: {
          'textarea': ['aria-describedby']
        },
        screenReaderTests: {
          'label[for="description"]': 'Description',
          '#description-help': 'Maximum 500 characters'
        }
      })
    })
  })

  describe('ScrollArea Component', () => {
    it('should be fully accessible', async () => {
      const ScrollAreaTest = () => (
        <ScrollArea className="h-32 w-48">
          <div className="p-4">
            <h4>Scrollable Content</h4>
            <p>This is a long content that should be scrollable...</p>
            <p>More content here...</p>
            <p>Even more content...</p>
            <p>And more...</p>
          </div>
        </ScrollArea>
      )

      await runComprehensiveAccessibilityTest(<ScrollAreaTest />, {
        ariaAttributes: {
          '[data-radix-scroll-area-viewport]': ['tabindex']
        }
      })
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      
      render(
        <ScrollArea className="h-32 w-48">
          <div className="p-4">
            <button>First button</button>
            <button>Second button</button>
            <button>Third button</button>
          </div>
        </ScrollArea>
      )
      
      // Test that buttons inside scroll area are focusable
      await user.tab()
      expect(screen.getByText('First button')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByText('Second button')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByText('Third button')).toHaveFocus()
    })
  })

  afterAll(() => {
    // Generate accessibility report for UI components
    console.log('UI Components Accessibility Audit Report:')
    console.log(auditReport.generateReport())
  })
})
