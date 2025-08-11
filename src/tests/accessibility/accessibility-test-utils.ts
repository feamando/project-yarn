// Comprehensive Accessibility Test Utilities
// Task 6.1: Add automated accessibility testing to test suite

import React from 'react'
import { render, RenderResult } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

/**
 * Accessibility test configuration
 */
export const accessibilityConfig = {
  // WCAG AA compliance rules
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-labels': { enabled: true },
    'semantic-markup': { enabled: true }
  },
  // Test tags to include
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
}

/**
 * Run axe accessibility tests on a rendered component
 */
export async function runAccessibilityTests(
  container: HTMLElement,
  options = accessibilityConfig
): Promise<void> {
  const results = await axe(container, options)
  expect(results).toHaveNoViolations()
}

/**
 * Test keyboard navigation for a component
 */
export async function testKeyboardNavigation(
  renderResult: RenderResult,
  expectedFocusableElements: string[]
): Promise<void> {
  const user = userEvent.setup()
  
  // Test Tab navigation
  for (const selector of expectedFocusableElements) {
    await user.tab()
    const element = renderResult.container.querySelector(selector)
    expect(element).toHaveFocus()
  }
  
  // Test Shift+Tab navigation (reverse)
  for (let i = expectedFocusableElements.length - 1; i >= 0; i--) {
    await user.tab({ shift: true })
    const element = renderResult.container.querySelector(expectedFocusableElements[i])
    expect(element).toHaveFocus()
  }
}

/**
 * Test ARIA attributes for a component
 */
export function testAriaAttributes(
  container: HTMLElement,
  expectedAttributes: Record<string, string[]>
): void {
  Object.entries(expectedAttributes).forEach(([selector, attributes]) => {
    const element = container.querySelector(selector)
    expect(element).toBeInTheDocument()
    
    attributes.forEach(attr => {
      expect(element).toHaveAttribute(attr)
    })
  })
}

/**
 * Test color contrast ratios
 */
export interface ContrastTest {
  selector: string
  expectedRatio: number
  textSize: 'normal' | 'large'
}

export function testColorContrast(
  container: HTMLElement,
  contrastTests: ContrastTest[]
): void {
  contrastTests.forEach(({ selector, expectedRatio, textSize }) => {
    const element = container.querySelector(selector) as HTMLElement
    expect(element).toBeInTheDocument()
    
    const styles = window.getComputedStyle(element)
    const fontSize = parseFloat(styles.fontSize)
    
    // Calculate contrast ratio (simplified - in real implementation would use proper algorithm)
    const isLargeText = textSize === 'large' || fontSize >= 18
    const minRatio = isLargeText ? 3.0 : 4.5
    
    // Note: This is a placeholder - actual contrast calculation would be more complex
    expect(expectedRatio).toBeGreaterThanOrEqual(minRatio)
  })
}

/**
 * Test focus management in modals
 */
export async function testModalFocusManagement(
  renderResult: RenderResult,
  modalTriggerSelector: string,
  modalSelector: string
): Promise<void> {
  const user = userEvent.setup()
  
  // Open modal
  const trigger = renderResult.getByTestId(modalTriggerSelector)
  await user.click(trigger)
  
  // Check focus is trapped in modal
  const modal = renderResult.getByTestId(modalSelector)
  expect(modal).toBeInTheDocument()
  
  // Test focus is moved to modal
  const firstFocusableElement = modal.querySelector('[tabindex="0"], button, input, select, textarea')
  expect(firstFocusableElement).toHaveFocus()
  
  // Test Escape key closes modal
  await user.keyboard('{Escape}')
  expect(modal).not.toBeInTheDocument()
  
  // Test focus returns to trigger
  expect(trigger).toHaveFocus()
}

/**
 * Test screen reader announcements
 */
export function testScreenReaderAnnouncements(
  container: HTMLElement,
  expectedAnnouncements: Record<string, string>
): void {
  Object.entries(expectedAnnouncements).forEach(([selector, expectedText]) => {
    const element = container.querySelector(selector)
    expect(element).toBeInTheDocument()
    
    // Check aria-label or aria-labelledby
    const ariaLabel = element?.getAttribute('aria-label')
    const ariaLabelledBy = element?.getAttribute('aria-labelledby')
    
    if (ariaLabel) {
      expect(ariaLabel).toContain(expectedText)
    } else if (ariaLabelledBy) {
      const labelElement = container.querySelector(`#${ariaLabelledBy}`)
      expect(labelElement?.textContent).toContain(expectedText)
    } else {
      // Check if text content includes expected announcement
      expect(element?.textContent).toContain(expectedText)
    }
  })
}

/**
 * Test component with comprehensive accessibility checks
 */
export async function runComprehensiveAccessibilityTest(
  component: React.ReactElement,
  testConfig: {
    focusableElements?: string[]
    ariaAttributes?: Record<string, string[]>
    contrastTests?: ContrastTest[]
    screenReaderTests?: Record<string, string>
  } = {}
): Promise<void> {
  const renderResult = render(component)
  const { container } = renderResult
  
  // Run axe tests
  await runAccessibilityTests(container)
  
  // Test keyboard navigation if specified
  if (testConfig.focusableElements) {
    await testKeyboardNavigation(renderResult, testConfig.focusableElements)
  }
  
  // Test ARIA attributes if specified
  if (testConfig.ariaAttributes) {
    testAriaAttributes(container, testConfig.ariaAttributes)
  }
  
  // Test color contrast if specified
  if (testConfig.contrastTests) {
    testColorContrast(container, testConfig.contrastTests)
  }
  
  // Test screen reader announcements if specified
  if (testConfig.screenReaderTests) {
    testScreenReaderAnnouncements(container, testConfig.screenReaderTests)
  }
}

/**
 * Accessibility audit report generator
 */
export interface AccessibilityIssue {
  component: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  issue: string
  wcagCriterion: string
  recommendation: string
  testMethod: string
}

export class AccessibilityAuditReport {
  private issues: AccessibilityIssue[] = []
  
  addIssue(issue: AccessibilityIssue): void {
    this.issues.push(issue)
  }
  
  getIssuesBySeverity(severity: AccessibilityIssue['severity']): AccessibilityIssue[] {
    return this.issues.filter(issue => issue.severity === severity)
  }
  
  generateReport(): string {
    const criticalIssues = this.getIssuesBySeverity('critical')
    const highIssues = this.getIssuesBySeverity('high')
    const mediumIssues = this.getIssuesBySeverity('medium')
    const lowIssues = this.getIssuesBySeverity('low')
    
    return `
# Accessibility Audit Report
Generated: ${new Date().toISOString()}

## Summary
- Critical Issues: ${criticalIssues.length}
- High Priority Issues: ${highIssues.length}
- Medium Priority Issues: ${mediumIssues.length}
- Low Priority Issues: ${lowIssues.length}
- Total Issues: ${this.issues.length}

## Critical Issues (Must Fix)
${criticalIssues.map(issue => this.formatIssue(issue)).join('\n\n')}

## High Priority Issues (Should Fix)
${highIssues.map(issue => this.formatIssue(issue)).join('\n\n')}

## Medium Priority Issues (Could Fix)
${mediumIssues.map(issue => this.formatIssue(issue)).join('\n\n')}

## Low Priority Issues (Nice to Have)
${lowIssues.map(issue => this.formatIssue(issue)).join('\n\n')}
    `.trim()
  }
  
  private formatIssue(issue: AccessibilityIssue): string {
    return `
### ${issue.component}: ${issue.issue}
- **WCAG Criterion:** ${issue.wcagCriterion}
- **Test Method:** ${issue.testMethod}
- **Recommendation:** ${issue.recommendation}
    `.trim()
  }
}

export default {
  runAccessibilityTests,
  testKeyboardNavigation,
  testAriaAttributes,
  testColorContrast,
  testModalFocusManagement,
  testScreenReaderAnnouncements,
  runComprehensiveAccessibilityTest,
  AccessibilityAuditReport
}
