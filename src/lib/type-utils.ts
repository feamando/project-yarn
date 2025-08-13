/**
 * TypeScript utility functions and helpers for Project Yarn
 * Provides runtime type checking and utility functions for better DX
 */

import type { 
  ComponentProps, 
  ElementType, 
  ReactElement, 
  ReactNode,
  RefObject,
  MutableRefObject
} from 'react';

// Runtime type checking utilities
export const typeGuards = {
  isString: (value: unknown): value is string => typeof value === 'string',
  isNumber: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',
  isFunction: (value: unknown): value is Function => typeof value === 'function',
  isObject: (value: unknown): value is Record<string, unknown> => 
    value !== null && typeof value === 'object' && !Array.isArray(value),
  isArray: <T>(value: unknown): value is T[] => Array.isArray(value),
  isNull: (value: unknown): value is null => value === null,
  isUndefined: (value: unknown): value is undefined => value === undefined,
  isNullish: (value: unknown): value is null | undefined => value == null,
  isReactElement: (value: unknown): value is ReactElement => {
    return typeof value === 'object' && value !== null && 'type' in value && 'props' in value;
  },
  isReactNode: (value: unknown): value is ReactNode => {
    return typeGuards.isString(value) || 
           typeGuards.isNumber(value) || 
           typeGuards.isReactElement(value) ||
           typeGuards.isArray(value);
  },
  isRef: <T>(value: unknown): value is RefObject<T> | MutableRefObject<T> => {
    return typeGuards.isObject(value) && 'current' in value;
  }
};

// Type assertion utilities
export const assertions = {
  assertString: (value: unknown, message?: string): asserts value is string => {
    if (!typeGuards.isString(value)) {
      throw new TypeError(message || `Expected string, got ${typeof value}`);
    }
  },
  assertNumber: (value: unknown, message?: string): asserts value is number => {
    if (!typeGuards.isNumber(value)) {
      throw new TypeError(message || `Expected number, got ${typeof value}`);
    }
  },
  assertFunction: (value: unknown, message?: string): asserts value is Function => {
    if (!typeGuards.isFunction(value)) {
      throw new TypeError(message || `Expected function, got ${typeof value}`);
    }
  },
  assertObject: (value: unknown, message?: string): asserts value is Record<string, unknown> => {
    if (!typeGuards.isObject(value)) {
      throw new TypeError(message || `Expected object, got ${typeof value}`);
    }
  },
  assertArray: <T>(value: unknown, message?: string): asserts value is T[] => {
    if (!typeGuards.isArray(value)) {
      throw new TypeError(message || `Expected array, got ${typeof value}`);
    }
  }
};

// Component prop utilities
export const propUtils = {
  /**
   * Extract props from a component type
   */
  extractProps: <T extends ElementType>(): ComponentProps<T> => {
    return {} as ComponentProps<T>;
  },

  /**
   * Merge component props with defaults
   */
  mergeProps: <T extends Record<string, unknown>>(
    defaultProps: Partial<T>,
    userProps: Partial<T>
  ): T => {
    return { ...defaultProps, ...userProps } as T;
  },

  /**
   * Filter out undefined props
   */
  filterProps: <T extends Record<string, unknown>>(props: T): Partial<T> => {
    const filtered: Partial<T> = {};
    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined) {
        (filtered as any)[key] = value;
      }
    }
    return filtered;
  },

  /**
   * Split props into groups
   */
  splitProps: <T extends Record<string, unknown>, K extends keyof T>(
    props: T,
    keys: K[]
  ): [Pick<T, K>, Omit<T, K>] => {
    const picked: Partial<Pick<T, K>> = {};
    const omitted: Partial<Omit<T, K>> = {};

    for (const [key, value] of Object.entries(props)) {
      if (keys.includes(key as K)) {
        (picked as any)[key] = value;
      } else {
        (omitted as any)[key] = value;
      }
    }

    return [picked as Pick<T, K>, omitted as Omit<T, K>];
  }
};

// Object utilities with type safety
export const objectUtils = {
  /**
   * Get object keys with proper typing
   */
  keys: <T extends Record<string, unknown>>(obj: T): (keyof T)[] => {
    return Object.keys(obj) as (keyof T)[];
  },

  /**
   * Get object entries with proper typing
   */
  entries: <T extends Record<string, unknown>>(obj: T): [keyof T, T[keyof T]][] => {
    return Object.entries(obj) as [keyof T, T[keyof T]][];
  },

  /**
   * Get object values with proper typing
   */
  values: <T extends Record<string, unknown>>(obj: T): T[keyof T][] => {
    return Object.values(obj) as T[keyof T][];
  },

  /**
   * Pick properties from object
   */
  pick: <T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> => {
    const result: Partial<Pick<T, K>> = {};
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result as Pick<T, K>;
  },

  /**
   * Omit properties from object
   */
  omit: <T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> => {
    const result: Partial<T> = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result as Omit<T, K>;
  },

  /**
   * Deep merge objects
   */
  deepMerge: <T extends Record<string, unknown>>(target: T, source: Partial<T>): T => {
    const result = { ...target };
    
    for (const key in source) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (typeGuards.isObject(sourceValue) && typeGuards.isObject(targetValue)) {
        result[key] = objectUtils.deepMerge(targetValue as any, sourceValue as any);
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
    
    return result;
  }
};

// Array utilities with type safety
export const arrayUtils = {
  /**
   * Create array of specified length with mapper function
   */
  range: <T>(length: number, mapper?: (index: number) => T): T[] => {
    return Array.from({ length }, (_, index) => 
      mapper ? mapper(index) : index as unknown as T
    );
  },

  /**
   * Group array items by key
   */
  groupBy: <T, K extends keyof T>(
    array: T[],
    keySelector: (item: T) => T[K]
  ): Record<string, T[]> => {
    const groups: Record<string, T[]> = {};
    
    for (const item of array) {
      const key = String(keySelector(item));
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }
    
    return groups;
  },

  /**
   * Remove duplicates from array
   */
  unique: <T>(array: T[], keySelector?: (item: T) => unknown): T[] => {
    if (!keySelector) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const key = keySelector(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Flatten nested arrays
   */
  flatten: <T>(array: (T | T[])[]): T[] => {
    return array.reduce<T[]>((acc, item) => {
      if (typeGuards.isArray(item)) {
        acc.push(...arrayUtils.flatten(item));
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  }
};

// Function utilities
export const functionUtils = {
  /**
   * Create a debounced function
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
    let timeoutId: NodeJS.Timeout;
    
    const debounced = (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
    
    debounced.cancel = () => clearTimeout(timeoutId);
    
    return debounced;
  },

  /**
   * Create a throttled function
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;
    
    const throttled = (...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
          timeoutId = null;
        }, delay - (currentTime - lastExecTime));
      }
    };
    
    throttled.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    return throttled;
  },

  /**
   * Create a memoized function
   */
  memoize: <T extends (...args: any[]) => any>(
    func: T,
    keySelector?: (...args: Parameters<T>) => string
  ): T & { cache: Map<string, ReturnType<T>>; clear: () => void } => {
    const cache = new Map<string, ReturnType<T>>();
    
    const memoized = ((...args: Parameters<T>): ReturnType<T> => {
      const key = keySelector ? keySelector(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T & { cache: Map<string, ReturnType<T>>; clear: () => void };
    
    memoized.cache = cache;
    memoized.clear = () => cache.clear();
    
    return memoized;
  }
};

// Promise utilities
export const promiseUtils = {
  /**
   * Create a delay promise
   */
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Create a timeout promise that rejects
   */
  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Promise timed out after ${ms}ms`)), ms);
    });
    
    return Promise.race([promise, timeoutPromise]);
  },

  /**
   * Retry a promise with exponential backoff
   */
  retry: async <T>(
    fn: () => Promise<T>,
    options: {
      retries?: number;
      delay?: number;
      backoff?: number;
      onRetry?: (error: Error, attempt: number) => void;
    } = {}
  ): Promise<T> => {
    const { retries = 3, delay = 1000, backoff = 2, onRetry } = options;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === retries) {
          throw lastError;
        }
        
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }
        
        await promiseUtils.delay(delay * Math.pow(backoff, attempt));
      }
    }
    
    throw lastError!;
  }
};

// Validation utilities
export const validationUtils = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL format
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate required fields
   */
  validateRequired: <T extends Record<string, unknown>>(
    data: T,
    requiredFields: (keyof T)[]
  ): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
    const errors: Partial<Record<keyof T, string>> = {};
    
    for (const field of requiredFields) {
      const value = data[field];
      if (value === undefined || value === null || value === '') {
        errors[field] = `${String(field)} is required`;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Performance utilities
export const performanceUtils = {
  /**
   * Measure execution time of a function
   */
  measure: async <T>(
    name: string,
    fn: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  },

  /**
   * Create a performance mark
   */
  mark: (name: string): void => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  /**
   * Measure between two marks
   */
  measureBetween: (name: string, startMark: string, endMark: string): number | null => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        return entries.length > 0 ? entries[entries.length - 1].duration : null;
      } catch {
        return null;
      }
    }
    return null;
  }
};

// Export all utilities
export const typeUtils = {
  typeGuards,
  assertions,
  propUtils,
  objectUtils,
  arrayUtils,
  functionUtils,
  promiseUtils,
  validationUtils,
  performanceUtils
};

export default typeUtils;
