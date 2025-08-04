/**
 * TypeScript types for React hooks in Project Yarn
 * Provides type safety and better developer experience for custom hooks
 */

import { DependencyList, EffectCallback, MutableRefObject, RefObject } from 'react';

// Base hook types
export interface HookOptions {
  enabled?: boolean;
  deps?: DependencyList;
}

// Async hook types
export interface AsyncHookState<T, E = Error> {
  data: T | null;
  loading: boolean;
  error: E | null;
  called: boolean;
}

export interface AsyncHookActions<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: Error | null) => void;
}

export type AsyncHookReturn<T, E = Error> = AsyncHookState<T, E> & AsyncHookActions<T>;

// Data fetching hook types
export interface FetchOptions extends RequestInit {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface UseFetchOptions<T> extends HookOptions {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  transform?: (data: any) => T;
  fetchOptions?: FetchOptions;
}

export interface UseFetchReturn<T> extends AsyncHookState<T> {
  refetch: () => Promise<void>;
  cancel: () => void;
}

// Local storage hook types
export interface UseLocalStorageOptions<T> {
  defaultValue?: T;
  serializer?: {
    read: (value: string) => T;
    write: (value: T) => string;
  };
  onError?: (error: Error) => void;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  error: Error | null;
}

// Form hook types
export interface FormFieldConfig<T = any> {
  defaultValue?: T;
  validate?: (value: T) => string | undefined;
  transform?: (value: any) => T;
  required?: boolean;
}

export interface FormConfig<T extends Record<string, any>> {
  defaultValues?: Partial<T>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export interface FormFieldState<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: boolean;
  submitting: boolean;
  submitCount: number;
}

export interface FormActions<T extends Record<string, any>> {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  reset: (values?: Partial<T>) => void;
  submit: () => Promise<void>;
  validate: () => boolean;
}

export type UseFormReturn<T extends Record<string, any>> = FormState<T> & FormActions<T>;

// Media query hook types
export interface UseMediaQueryOptions {
  defaultValue?: boolean;
  initializeWithValue?: boolean;
}

export interface UseMediaQueryReturn {
  matches: boolean;
  media: string;
}

// Intersection observer hook types
export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
  initialIsIntersecting?: boolean;
}

export interface UseIntersectionObserverReturn {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
  ref: RefObject<Element>;
}

// Resize observer hook types
export interface UseResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
}

export interface UseResizeObserverReturn {
  width: number;
  height: number;
  ref: RefObject<Element>;
}

// Event listener hook types
export type EventMap = HTMLElementEventMap & DocumentEventMap & WindowEventMap;

export interface UseEventListenerOptions {
  passive?: boolean;
  once?: boolean;
  capture?: boolean;
}

// Debounce and throttle hook types
export interface UseDebounceOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface UseThrottleOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
  pending: () => boolean;
}

// Animation hook types
export interface UseAnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface UseAnimationReturn {
  isAnimating: boolean;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  ref: RefObject<Element>;
}

// Drag and drop hook types
export interface UseDragOptions {
  onDragStart?: (event: DragEvent) => void;
  onDrag?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
  dragImage?: HTMLElement;
  effectAllowed?: DataTransfer['effectAllowed'];
}

export interface UseDropOptions {
  onDragEnter?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
  accept?: string[];
}

export interface UseDragReturn {
  isDragging: boolean;
  dragRef: RefObject<HTMLElement>;
}

export interface UseDropReturn {
  isOver: boolean;
  canDrop: boolean;
  dropRef: RefObject<HTMLElement>;
}

// Keyboard hook types
export interface UseKeyboardOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  target?: RefObject<Element> | Element | Window | Document;
}

export type KeyboardEventHandler = (event: KeyboardEvent) => void;

// Focus management hook types
export interface UseFocusTrapOptions {
  autoFocus?: boolean;
  restoreFocus?: boolean;
  allowOutsideClick?: boolean;
}

export interface UseFocusTrapReturn {
  ref: RefObject<HTMLElement>;
  activate: () => void;
  deactivate: () => void;
  isActive: boolean;
}

// Clipboard hook types
export interface UseClipboardOptions {
  timeout?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseClipboardReturn {
  copy: (text: string) => Promise<void>;
  copied: boolean;
  error: Error | null;
}

// Geolocation hook types
export interface UseGeolocationOptions extends PositionOptions {
  when?: boolean;
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  getCurrentPosition: () => void;
}

// Battery hook types
export interface BatteryManager {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

export interface UseBatteryReturn {
  battery: BatteryManager | null;
  supported: boolean;
  loading: boolean;
}

// Network hook types
export interface UseNetworkReturn {
  online: boolean;
  downlink?: number;
  downlinkMax?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
  type?: string;
}

// Permission hook types
export interface UsePermissionOptions {
  onGranted?: () => void;
  onDenied?: () => void;
  onPrompt?: () => void;
}

export interface UsePermissionReturn {
  state: PermissionState | null;
  supported: boolean;
  request: () => Promise<PermissionState>;
}

// WebSocket hook types
export interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  readyState: number;
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  close: (code?: number, reason?: string) => void;
  connect: () => void;
  lastMessage: MessageEvent | null;
}

// Performance monitoring hook types
export interface UsePerformanceOptions {
  measureName?: string;
  markStart?: string;
  markEnd?: string;
}

export interface UsePerformanceReturn {
  measure: () => PerformanceMeasure | null;
  mark: (name: string) => void;
  clearMarks: (name?: string) => void;
  clearMeasures: (name?: string) => void;
  getEntries: () => PerformanceEntry[];
}

// Accessibility hook types
export interface UseAriaAnnouncerOptions {
  politeness?: 'polite' | 'assertive';
  priority?: 'low' | 'medium' | 'high';
}

export interface UseAriaAnnouncerReturn {
  announce: (message: string, options?: UseAriaAnnouncerOptions) => void;
  clear: () => void;
}

// Type utility for creating custom hook types
export type HookFactory<TOptions, TReturn> = (options?: TOptions) => TReturn;

// Generic hook state management
export interface HookState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

export type HookStateAction<T> =
  | { type: 'loading' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: Error }
  | { type: 'reset' };

// Hook composition types
export type ComposedHook<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
};

// Hook middleware types
export type HookMiddleware<T> = (hookResult: T) => T;

export interface HookWithMiddleware<T> {
  use: (middleware: HookMiddleware<T>) => HookWithMiddleware<T>;
  hook: T;
}

// Export commonly used React hook types
export type {
  DependencyList,
  EffectCallback,
  MutableRefObject,
  RefObject,
  Dispatch,
  SetStateAction,
  Reducer,
  ReducerState,
  ReducerAction
} from 'react';
