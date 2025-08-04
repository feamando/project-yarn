// Accessibility Testing Configuration
// Task 6.1: Add automated accessibility testing to test suite

import type { RunOptions } from 'axe-core'

/**
 * Comprehensive accessibility testing configuration for WCAG 2.1 AA compliance
 */
export const accessibilityTestConfig: RunOptions = {
  // WCAG 2.1 AA compliance rules
  rules: {
    // Color and contrast
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: false }, // AAA level, not required for AA
    
    // Keyboard navigation
    'keyboard': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'tabindex': { enabled: true },
    
    // Focus management
    'focus-trap': { enabled: true },
    'focusable-content': { enabled: true },
    'focus-visible': { enabled: true },
    
    // ARIA labels and roles
    'aria-allowed-attr': { enabled: true },
    'aria-allowed-role': { enabled: true },
    'aria-command-name': { enabled: true },
    'aria-hidden-body': { enabled: true },
    'aria-hidden-focus': { enabled: true },
    'aria-input-field-name': { enabled: true },
    'aria-label': { enabled: true },
    'aria-labelledby': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-required-children': { enabled: true },
    'aria-required-parent': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-toggle-field-name': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    
    // Semantic markup
    'button-name': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'heading-order': { enabled: true },
    'label': { enabled: true },
    'landmark-banner-is-top-level': { enabled: true },
    'landmark-complementary-is-top-level': { enabled: true },
    'landmark-contentinfo-is-top-level': { enabled: true },
    'landmark-main-is-top-level': { enabled: true },
    'landmark-no-duplicate-banner': { enabled: true },
    'landmark-no-duplicate-contentinfo': { enabled: true },
    'landmark-no-duplicate-main': { enabled: true },
    'landmark-one-main': { enabled: true },
    'landmark-unique': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    
    // Images and media
    'image-alt': { enabled: true },
    'input-image-alt': { enabled: true },
    
    // Tables
    'table-fake-caption': { enabled: true },
    'td-headers-attr': { enabled: true },
    'th-has-data-cells': { enabled: true },
    
    // Language
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'valid-lang': { enabled: true }
  },
  
  // Test tags to include (WCAG 2.1 AA compliance)
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
  
  // Exclude experimental rules that might cause false positives
  exclude: [
    // Exclude experimental or beta rules
    'color-contrast-enhanced', // AAA level
    'focus-order-semantics' // Experimental
  ],
  
  // Test environment configuration
  environment: {
    // Simulate different user preferences
    reducedMotion: 'reduce',
    colorScheme: 'light'
  }
}

/**
 * Accessibility test scenarios for different component types
 */
export const testScenarios = {
  // Interactive components (buttons, inputs, etc.)
  interactive: {
    ...accessibilityTestConfig,
    rules: {
      ...accessibilityTestConfig.rules,
      'keyboard': { enabled: true },
      'button-name': { enabled: true },
      'link-name': { enabled: true },
      'aria-command-name': { enabled: true }
    }
  },
  
  // Form components
  forms: {
    ...accessibilityTestConfig,
    rules: {
      ...accessibilityTestConfig.rules,
      'label': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'aria-input-field-name': { enabled: true },
      'aria-required-attr': { enabled: true }
    }
  },
  
  // Navigation components
  navigation: {
    ...accessibilityTestConfig,
    rules: {
      ...accessibilityTestConfig.rules,
      'landmark-banner-is-top-level': { enabled: true },
      'landmark-main-is-top-level': { enabled: true },
      'landmark-unique': { enabled: true },
      'region': { enabled: true },
      'skip-link': { enabled: true }
    }
  },
  
  // Modal and dialog components
  modals: {
    ...accessibilityTestConfig,
    rules: {
      ...accessibilityTestConfig.rules,
      'focus-trap': { enabled: true },
      'aria-hidden-focus': { enabled: true },
      'focusable-content': { enabled: true }
    }
  },
  
  // Content components (editor, text areas)
  content: {
    ...accessibilityTestConfig,
    rules: {
      ...accessibilityTestConfig.rules,
      'heading-order': { enabled: true },
      'page-has-heading-one': { enabled: true },
      'landmark-one-main': { enabled: true },
      'region': { enabled: true }
    }
  }
}

/**
 * Performance thresholds for accessibility tests
 */
export const performanceThresholds = {
  // Maximum time for accessibility test to complete (ms)
  maxTestDuration: 5000,
  
  // Maximum number of violations before test fails
  maxViolations: 0,
  
  // Minimum color contrast ratio
  minContrastRatio: 4.5, // WCAG AA standard
  
  // Maximum time for focus to be visible (ms)
  maxFocusDelay: 100
}

/**
 * Test utilities configuration
 */
export const testUtils = {
  // Mock user preferences for testing
  mockUserPreferences: {
    reducedMotion: true,
    highContrast: false,
    fontSize: 'medium',
    screenReader: true
  },
  
  // Simulated screen reader announcements
  screenReaderAnnouncements: {
    navigation: 'Navigated to {target}',
    stateChange: '{component} state changed to {state}',
    error: 'Error: {message}',
    success: 'Success: {message}'
  },
  
  // Keyboard navigation patterns
  keyboardPatterns: {
    tab: ['Tab'],
    shiftTab: ['Shift', 'Tab'],
    enter: ['Enter'],
    space: [' '],
    escape: ['Escape'],
    arrowKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
  }
}

export default {
  accessibilityTestConfig,
  testScenarios,
  performanceThresholds,
  testUtils
}
