/**
 * Enhanced TypeScript types for Project Yarn components
 * Provides better developer experience with strict typing and utilities
 */

import type { ComponentProps, ElementType, ReactNode } from 'react';

// Base component props that all components should extend
export interface BaseComponentProps {
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing purposes */
  'data-testid'?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility */
  'aria-describedby'?: string;
}

// Polymorphic component props for components that can render as different elements
export type PolymorphicProps<T extends ElementType> = {
  as?: T;
} & ComponentProps<T>;

export type PolymorphicComponent<T extends ElementType, P = {}> = P & 
  PolymorphicProps<T> & 
  BaseComponentProps;

// Variant system types for consistent component variants
export type VariantProps<T> = T extends (...args: any) => any
  ? Parameters<T>[0]
  : never;

// Size variants used across components
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Color variants used across components
export type ColorVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'destructive' 
  | 'outline' 
  | 'ghost';

// Component state types
export interface ComponentState {
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
}

// Event handler types with proper typing
export type EventHandler<T = Element, E = Event> = (event: E & { currentTarget: T }) => void;

export type ClickHandler<T = Element> = EventHandler<T, React.MouseEvent>;
export type ChangeHandler<T = Element> = EventHandler<T, React.ChangeEvent>;
export type FocusHandler<T = Element> = EventHandler<T, React.FocusEvent>;
export type KeyboardHandler<T = Element> = EventHandler<T, React.KeyboardEvent>;
export type FormHandler<T = Element> = EventHandler<T, React.FormEvent>;

// Form-related types
export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
}

export interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export type FormFieldValidator<T = any> = (value: T) => string | undefined;

// Data loading states
export interface LoadingState {
  loading: boolean;
  error: Error | null;
  data: any;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetch?: Date;
}

// Pagination types
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationState;
}

// Sorting and filtering types
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface FilterState {
  [key: string]: any;
}

// Component composition types
export interface WithChildren {
  children?: ReactNode;
}

export interface WithOptionalChildren {
  children?: ReactNode;
}

export interface WithRequiredChildren {
  children: ReactNode;
}

// Render prop types
export type RenderProp<T> = (props: T) => ReactNode;

export interface RenderPropComponent<T> {
  children: RenderProp<T>;
}

// Forwarded ref types
export type ForwardedRefComponent<T, P> = React.ForwardRefExoticComponent<
  P & React.RefAttributes<T>
>;

// Component factory types
export type ComponentFactory<P = {}> = <T extends ElementType = 'div'>(
  props: PolymorphicComponent<T, P>
) => JSX.Element;

// Theme-aware component types
export interface ThemeAwareProps {
  theme?: 'light' | 'dark' | 'system';
}

// Responsive prop types
export type ResponsiveValue<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};

// Animation and transition types
export interface AnimationProps {
  animate?: boolean;
  duration?: number;
  delay?: number;
  easing?: string;
}

export interface TransitionProps {
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
}

// Accessibility types
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Performance monitoring types
export interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  lastRender: Date;
  propsChanges: number;
}

export interface ComponentPerformanceData {
  componentName: string;
  metrics: PerformanceMetrics;
  warnings: string[];
}

// Virtualization types
export interface VirtualizationProps {
  itemCount: number;
  itemSize: number | ((index: number) => number);
  overscan?: number;
  scrollToIndex?: number;
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
}

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  end: number;
}

// Component metadata types
export interface ComponentMetadata {
  displayName: string;
  version: string;
  description?: string;
  category: 'ui' | 'common' | 'feature' | 'performance';
  tags?: string[];
  deprecated?: boolean;
  experimental?: boolean;
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  eventType?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// Context types
export type ContextValue<T> = T | undefined;

export interface ContextProviderProps<T> extends WithChildren {
  value: T;
}

// Hook return types
export interface UseToggleReturn {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
  setValue: (value: boolean) => void;
}

export interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

// Utility types for better DX
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Required<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Extract prop types from components
export type PropsOf<T> = T extends React.ComponentType<infer P> ? P : never;

// Create discriminated unions for component variants
export type CreateVariant<T extends Record<string, any>> = {
  [K in keyof T]: { variant: K } & T[K];
}[keyof T];

// Type-safe event emitter
export interface TypedEventEmitter<T extends Record<string, any>> {
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void;
  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
}

// Component registry types for dynamic component loading
export interface ComponentRegistry {
  [key: string]: React.ComponentType<any>;
}

export type RegisteredComponent<T extends keyof ComponentRegistry> = ComponentRegistry[T];

// Type guards
export const isReactElement = (value: any): value is React.ReactElement => {
  return React.isValidElement(value);
};

export const isFunction = (value: any): value is Function => {
  return typeof value === 'function';
};

export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: any): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: any): value is Record<string, any> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const isArray = <T>(value: any): value is T[] => {
  return Array.isArray(value);
};

// Export all types for easy importing
export type {
  ComponentProps,
  ElementType,
  ReactNode
} from 'react';
