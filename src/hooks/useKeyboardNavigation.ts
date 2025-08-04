/**
 * Keyboard Navigation React Hook
 * 
 * Provides React hooks for enhanced keyboard navigation support
 * throughout the Project Yarn application.
 * 
 * Last Updated: 2025-08-02
 * Source: Accessibility Enhancement (Task 5.3)
 */

import { useEffect, useCallback, useRef } from 'react';
import { KeyboardShortcuts, FocusManager, trapFocus, announceToScreenReader } from '@/utils/keyboard-navigation';

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const shortcutsRef = useRef<KeyboardShortcuts>(new KeyboardShortcuts());
  
  const registerShortcut = useCallback((
    key: string, 
    modifiers: string[], 
    callback: () => void
  ) => {
    shortcutsRef.current.register(key, modifiers, callback);
  }, []);
  
  const unregisterShortcut = useCallback((key: string, modifiers: string[]) => {
    shortcutsRef.current.unregister(key, modifiers);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcutsRef.current.handle(event as any);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      shortcutsRef.current.clear();
    };
  }, []);
  
  return { registerShortcut, unregisterShortcut };
}

/**
 * Hook for managing focus trapping (useful for modals)
 */
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const cleanup = trapFocus(containerRef.current);
    return cleanup;
  }, [isActive]);
  
  return containerRef;
}

/**
 * Hook for managing roving tabindex
 */
export function useRovingTabindex(
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  const containerRef = useRef<HTMLElement>(null);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!containerRef.current) return;
    
    const target = event.target as HTMLElement;
    FocusManager.handleRovingTabindex(
      event, 
      target, 
      containerRef.current, 
      orientation
    );
  }, [orientation]);
  
  const initializeTabindex = useCallback(() => {
    if (!containerRef.current) return;
    
    const focusable = FocusManager.getFocusableElements(containerRef.current);
    focusable.forEach((el, index) => {
      el.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
  }, []);
  
  useEffect(() => {
    initializeTabindex();
  }, [initializeTabindex]);
  
  return { containerRef, handleKeyDown, initializeTabindex };
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReaderAnnouncements() {
  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    announceToScreenReader(message, priority);
  }, []);
  
  return { announce };
}

/**
 * Hook for enhanced focus management
 */
export function useFocusManagement() {
  const focusFirst = useCallback((container: HTMLElement) => {
    return FocusManager.focusFirst(container);
  }, []);
  
  const focusLast = useCallback((container: HTMLElement) => {
    return FocusManager.focusLast(container);
  }, []);
  
  const getFocusableElements = useCallback((container: HTMLElement) => {
    return FocusManager.getFocusableElements(container);
  }, []);
  
  return { focusFirst, focusLast, getFocusableElements };
}

/**
 * Hook for skip navigation
 */
export function useSkipNavigation() {
  const skipToContent = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  
  return { skipToContent };
}
