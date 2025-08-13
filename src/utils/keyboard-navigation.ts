/**
 * Keyboard Navigation Utilities
 * 
 * Provides utilities and helpers for enhanced keyboard navigation support
 * throughout the Project Yarn application.
 * 
 * Last Updated: 2025-08-02
 * Source: Accessibility Enhancement (Task 5.3)
 */

import { KeyboardEvent } from 'react';

/**
 * Standard keyboard navigation keys
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
} as const;

/**
 * Check if a key event matches any of the provided keys
 */
export function isKey(event: KeyboardEvent, ...keys: string[]): boolean {
  return keys.includes(event.key);
}

/**
 * Check if event is an activation key (Enter or Space)
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return isKey(event, KEYBOARD_KEYS.ENTER, KEYBOARD_KEYS.SPACE);
}

/**
 * Check if event is an arrow key
 */
export function isArrowKey(event: KeyboardEvent): boolean {
  return isKey(
    event, 
    KEYBOARD_KEYS.ARROW_UP, 
    KEYBOARD_KEYS.ARROW_DOWN, 
    KEYBOARD_KEYS.ARROW_LEFT, 
    KEYBOARD_KEYS.ARROW_RIGHT
  );
}

/**
 * Handle panel resize with keyboard
 */
export function handlePanelResizeKeyboard(
  event: KeyboardEvent,
  onResize?: (direction: 'left' | 'right', amount: number) => void
): void {
  if (!isArrowKey(event)) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const amount = event.shiftKey ? 10 : 5; // Larger steps with Shift
  
  if (onResize) {
    if (isKey(event, KEYBOARD_KEYS.ARROW_LEFT)) {
      onResize('left', amount);
    } else if (isKey(event, KEYBOARD_KEYS.ARROW_RIGHT)) {
      onResize('right', amount);
    }
  }
}

/**
 * Enhanced focus management utilities
 */
export class FocusManager {
  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
  }
  
  /**
   * Focus the first focusable element in a container
   */
  static focusFirst(container: HTMLElement): boolean {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
      return true;
    }
    return false;
  }
  
  /**
   * Focus the last focusable element in a container
   */
  static focusLast(container: HTMLElement): boolean {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
      return true;
    }
    return false;
  }
  
  /**
   * Handle roving tabindex for a group of elements
   */
  static handleRovingTabindex(
    event: KeyboardEvent,
    currentElement: HTMLElement,
    container: HTMLElement,
    orientation: 'horizontal' | 'vertical' = 'horizontal'
  ): void {
    if (!isArrowKey(event)) return;
    
    event.preventDefault();
    
    const focusable = this.getFocusableElements(container);
    const currentIndex = focusable.indexOf(currentElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    if (orientation === 'horizontal') {
      if (isKey(event, KEYBOARD_KEYS.ARROW_LEFT)) {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusable.length - 1;
      } else if (isKey(event, KEYBOARD_KEYS.ARROW_RIGHT)) {
        nextIndex = currentIndex < focusable.length - 1 ? currentIndex + 1 : 0;
      }
    } else {
      if (isKey(event, KEYBOARD_KEYS.ARROW_UP)) {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusable.length - 1;
      } else if (isKey(event, KEYBOARD_KEYS.ARROW_DOWN)) {
        nextIndex = currentIndex < focusable.length - 1 ? currentIndex + 1 : 0;
      }
    }
    
    if (nextIndex !== currentIndex) {
      // Update tabindex values
      focusable.forEach((el, index) => {
        el.setAttribute('tabindex', index === nextIndex ? '0' : '-1');
      });
      
      // Focus the next element
      focusable[nextIndex].focus();
    }
  }
}

/**
 * Keyboard shortcut manager
 */
export class KeyboardShortcuts {
  private shortcuts = new Map<string, () => void>();
  
  /**
   * Register a keyboard shortcut
   */
  register(key: string, modifiers: string[], callback: () => void): void {
    const shortcutKey = this.createShortcutKey(key, modifiers);
    this.shortcuts.set(shortcutKey, callback);
  }
  
  /**
   * Handle keyboard events for registered shortcuts
   */
  handle(event: KeyboardEvent): boolean {
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');
    
    const shortcutKey = this.createShortcutKey(event.key.toLowerCase(), modifiers);
    const callback = this.shortcuts.get(shortcutKey);
    
    if (callback) {
      event.preventDefault();
      event.stopPropagation();
      callback();
      return true;
    }
    
    return false;
  }
  
  /**
   * Create a unique key for the shortcut
   */
  private createShortcutKey(key: string, modifiers: string[]): string {
    return [...modifiers.sort(), key].join('+');
  }
  
  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string, modifiers: string[]): void {
    const shortcutKey = this.createShortcutKey(key, modifiers);
    this.shortcuts.delete(shortcutKey);
  }
  
  /**
   * Clear all shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
  }
}

/**
 * Skip link utilities for better navigation
 */
export function createSkipLink(
  text: string,
  targetId: string,
  className: string = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md'
): HTMLAnchorElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = className;
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  return skipLink;
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = FocusManager.getFocusableElements(container);
  
  if (focusableElements.length === 0) {
    return () => {}; // No cleanup needed
  }
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Focus the first element initially
  firstElement.focus();
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === KEYBOARD_KEYS.TAB) {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown as any);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown as any);
  };
}

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Default keyboard shortcuts for the application
 */
export const DEFAULT_SHORTCUTS = {
  SAVE: { key: 's', modifiers: ['ctrl'] },
  OPEN: { key: 'o', modifiers: ['ctrl'] },
  NEW: { key: 'n', modifiers: ['ctrl'] },
  FIND: { key: 'f', modifiers: ['ctrl'] },
  HELP: { key: '?', modifiers: ['shift'] },
  SETTINGS: { key: ',', modifiers: ['ctrl'] }
} as const;
