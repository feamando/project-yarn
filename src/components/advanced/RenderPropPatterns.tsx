import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { cn } from "@/lib/utils";

// === RENDER PROP PATTERNS ===
// Advanced patterns for complex state sharing and component composition

// === TOGGLE RENDER PROP ===
// Manages toggle state with render prop pattern

interface ToggleState {
  isOn: boolean;
  toggle: () => void;
  turnOn: () => void;
  turnOff: () => void;
  setToggle: (value: boolean) => void;
}

interface ToggleProps {
  children: (state: ToggleState) => React.ReactNode;
  defaultOn?: boolean;
  onToggle?: (isOn: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ 
  children, 
  defaultOn = false, 
  onToggle,
  disabled = false 
}: ToggleProps) {
  const [isOn, setIsOn] = useState(defaultOn);

  const toggle = useCallback(() => {
    if (disabled) return;
    const newValue = !isOn;
    setIsOn(newValue);
    onToggle?.(newValue);
  }, [isOn, disabled, onToggle]);

  const turnOn = useCallback(() => {
    if (disabled) return;
    if (!isOn) {
      setIsOn(true);
      onToggle?.(true);
    }
  }, [isOn, disabled, onToggle]);

  const turnOff = useCallback(() => {
    if (disabled) return;
    if (isOn) {
      setIsOn(false);
      onToggle?.(false);
    }
  }, [isOn, disabled, onToggle]);

  const setToggle = useCallback((value: boolean) => {
    if (disabled) return;
    if (value !== isOn) {
      setIsOn(value);
      onToggle?.(value);
    }
  }, [isOn, disabled, onToggle]);

  return (
    <>
      {children({ isOn, toggle, turnOn, turnOff, setToggle })}
    </>
  );
}

// === COUNTER RENDER PROP ===
// Manages counter state with increment/decrement controls

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
  canIncrement: boolean;
  canDecrement: boolean;
}

interface CounterProps {
  children: (state: CounterState) => React.ReactNode;
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (count: number) => void;
}

export function Counter({ 
  children, 
  initialValue = 0, 
  min = -Infinity, 
  max = Infinity, 
  step = 1,
  onChange 
}: CounterProps) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    const newValue = Math.min(count + step, max);
    if (newValue !== count) {
      setCount(newValue);
      onChange?.(newValue);
    }
  }, [count, step, max, onChange]);

  const decrement = useCallback(() => {
    const newValue = Math.max(count - step, min);
    if (newValue !== count) {
      setCount(newValue);
      onChange?.(newValue);
    }
  }, [count, step, min, onChange]);

  const reset = useCallback(() => {
    if (count !== initialValue) {
      setCount(initialValue);
      onChange?.(initialValue);
    }
  }, [count, initialValue, onChange]);

  const set = useCallback((value: number) => {
    const clampedValue = Math.max(min, Math.min(max, value));
    if (clampedValue !== count) {
      setCount(clampedValue);
      onChange?.(clampedValue);
    }
  }, [count, min, max, onChange]);

  const canIncrement = count < max;
  const canDecrement = count > min;

  return (
    <>
      {children({ 
        count, 
        increment, 
        decrement, 
        reset, 
        set, 
        canIncrement, 
        canDecrement 
      })}
    </>
  );
}

// === FORM STATE RENDER PROP ===
// Complex form state management with validation

interface FormField {
  value: string;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

interface FormActions {
  setValue: (field: string, value: string) => void;
  setError: (field: string, error?: string) => void;
  setTouched: (field: string, touched?: boolean) => void;
  reset: () => void;
  submit: () => Promise<void>;
  validate: () => boolean;
  getFieldProps: (field: string) => {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
    error?: string;
    touched: boolean;
  };
}

interface FormProps {
  children: (state: FormState, actions: FormActions) => React.ReactNode;
  initialValues?: Record<string, string>;
  validators?: Record<string, (value: string) => string | undefined>;
  onSubmit?: (values: Record<string, string>) => Promise<void> | void;
}

type FormAction = 
  | { type: 'SET_VALUE'; field: string; value: string }
  | { type: 'SET_ERROR'; field: string; error?: string }
  | { type: 'SET_TOUCHED'; field: string; touched: boolean }
  | { type: 'SET_SUBMITTING'; submitting: boolean }
  | { type: 'INCREMENT_SUBMIT_COUNT' }
  | { type: 'RESET'; initialValues: Record<string, string> };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_VALUE': {
      const newFields = {
        ...state.fields,
        [action.field]: {
          ...state.fields[action.field],
          value: action.value,
          dirty: true,
        }
      };
      return {
        ...state,
        fields: newFields,
        isDirty: Object.values(newFields).some(field => field.dirty),
      };
    }
    case 'SET_ERROR': {
      const newFields = {
        ...state.fields,
        [action.field]: {
          ...state.fields[action.field],
          error: action.error,
        }
      };
      return {
        ...state,
        fields: newFields,
        isValid: !Object.values(newFields).some(field => field.error),
      };
    }
    case 'SET_TOUCHED': {
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.field]: {
            ...state.fields[action.field],
            touched: action.touched,
          }
        }
      };
    }
    case 'SET_SUBMITTING': {
      return {
        ...state,
        isSubmitting: action.submitting,
      };
    }
    case 'INCREMENT_SUBMIT_COUNT': {
      return {
        ...state,
        submitCount: state.submitCount + 1,
      };
    }
    case 'RESET': {
      const fields: Record<string, FormField> = {};
      Object.keys(action.initialValues).forEach(key => {
        fields[key] = {
          value: action.initialValues[key],
          touched: false,
          dirty: false,
        };
      });
      return {
        fields,
        isValid: true,
        isDirty: false,
        isSubmitting: false,
        submitCount: 0,
      };
    }
    default:
      return state;
  }
}

export function Form({ 
  children, 
  initialValues = {}, 
  validators = {},
  onSubmit 
}: FormProps) {
  const [state, dispatch] = useReducer(formReducer, {
    fields: Object.keys(initialValues).reduce((acc, key) => {
      acc[key] = {
        value: initialValues[key],
        touched: false,
        dirty: false,
      };
      return acc;
    }, {} as Record<string, FormField>),
    isValid: true,
    isDirty: false,
    isSubmitting: false,
    submitCount: 0,
  });

  const setValue = useCallback((field: string, value: string) => {
    dispatch({ type: 'SET_VALUE', field, value });
    
    // Run validation if validator exists
    if (validators[field]) {
      const error = validators[field](value);
      dispatch({ type: 'SET_ERROR', field, error });
    }
  }, [validators]);

  const setError = useCallback((field: string, error?: string) => {
    dispatch({ type: 'SET_ERROR', field, error });
  }, []);

  const setTouched = useCallback((field: string, touched = true) => {
    dispatch({ type: 'SET_TOUCHED', field, touched });
  }, []);

  const validate = useCallback(() => {
    let isValid = true;
    Object.keys(state.fields).forEach(field => {
      if (validators[field]) {
        const error = validators[field](state.fields[field].value);
        if (error) {
          isValid = false;
          dispatch({ type: 'SET_ERROR', field, error });
        }
      }
    });
    return isValid;
  }, [state.fields, validators]);

  const submit = useCallback(async () => {
    dispatch({ type: 'INCREMENT_SUBMIT_COUNT' });
    dispatch({ type: 'SET_SUBMITTING', submitting: true });

    // Mark all fields as touched
    Object.keys(state.fields).forEach(field => {
      setTouched(field, true);
    });

    const isValid = validate();
    
    if (isValid && onSubmit) {
      try {
        const values = Object.keys(state.fields).reduce((acc, key) => {
          acc[key] = state.fields[key].value;
          return acc;
        }, {} as Record<string, string>);
        
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }

    dispatch({ type: 'SET_SUBMITTING', submitting: false });
  }, [state.fields, validate, onSubmit, setTouched]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', initialValues });
  }, [initialValues]);

  const getFieldProps = useCallback((field: string) => {
    const fieldState = state.fields[field] || { value: '', touched: false, dirty: false };
    
    return {
      value: fieldState.value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValue(field, e.target.value);
      },
      onBlur: () => {
        setTouched(field, true);
      },
      error: fieldState.error,
      touched: fieldState.touched,
    };
  }, [state.fields, setValue, setTouched]);

  const actions: FormActions = {
    setValue,
    setError,
    setTouched,
    reset,
    submit,
    validate,
    getFieldProps,
  };

  return (
    <>
      {children(state, actions)}
    </>
  );
}

// === ASYNC DATA RENDER PROP ===
// Manages async data fetching with loading, error, and success states

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetch: Date | null;
}

interface AsyncActions<T> {
  refetch: () => Promise<void>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: Error) => void;
}

interface AsyncDataProps<T> {
  children: (state: AsyncState<T>, actions: AsyncActions<T>) => React.ReactNode;
  fetcher: () => Promise<T>;
  immediate?: boolean;
  dependencies?: any[];
}

export function AsyncData<T>({ 
  children, 
  fetcher, 
  immediate = true,
  dependencies = [] 
}: AsyncDataProps<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
  });

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await fetcher();
      setState({
        data,
        loading: false,
        error: null,
        lastFetch: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [fetcher]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastFetch: null,
    });
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: Error) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    if (immediate) {
      refetch();
    }
  }, [immediate, refetch, ...dependencies]);

  const actions: AsyncActions<T> = {
    refetch,
    reset,
    setData,
    setError,
  };

  return (
    <>
      {children(state, actions)}
    </>
  );
}

// === INTERSECTION OBSERVER RENDER PROP ===
// Manages intersection observer for visibility detection

interface IntersectionState {
  isIntersecting: boolean;
  intersectionRatio: number;
  entry: IntersectionObserverEntry | null;
}

interface IntersectionProps {
  children: (state: IntersectionState, ref: React.RefObject<HTMLElement>) => React.ReactNode;
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function Intersection({ 
  children, 
  threshold = 0,
  rootMargin = '0px',
  triggerOnce = false 
}: IntersectionProps) {
  const [state, setState] = useState<IntersectionState>({
    isIntersecting: false,
    intersectionRatio: 0,
    entry: null,
  });

  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        // If triggerOnce is true and we've already triggered, don't update
        if (triggerOnce && hasTriggeredRef.current && !isIntersecting) {
          return;
        }

        if (isIntersecting && triggerOnce) {
          hasTriggeredRef.current = true;
        }

        setState({
          isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          entry,
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return (
    <>
      {children(state, elementRef)}
    </>
  );
}

// === MOUSE POSITION RENDER PROP ===
// Tracks mouse position relative to an element

interface MouseState {
  x: number;
  y: number;
  elementX: number;
  elementY: number;
  isOver: boolean;
}

interface MouseProps {
  children: (state: MouseState, ref: React.RefObject<HTMLElement>) => React.ReactNode;
}

export function Mouse({ children }: MouseProps) {
  const [state, setState] = useState<MouseState>({
    x: 0,
    y: 0,
    elementX: 0,
    elementY: 0,
    isOver: false,
  });

  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      setState({
        x: e.clientX,
        y: e.clientY,
        elementX: e.clientX - rect.left,
        elementY: e.clientY - rect.top,
        isOver: true,
      });
    };

    const handleMouseLeave = () => {
      setState(prev => ({ ...prev, isOver: false }));
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {children(state, elementRef)}
    </>
  );
}

// === USAGE EXAMPLES ===
/*
// Toggle Example:
<Toggle defaultOn={false} onToggle={(isOn) => console.log(isOn)}>
  {({ isOn, toggle }) => (
    <button onClick={toggle}>
      {isOn ? 'Turn Off' : 'Turn On'}
    </button>
  )}
</Toggle>

// Counter Example:
<Counter min={0} max={10} onChange={(count) => console.log(count)}>
  {({ count, increment, decrement, canIncrement, canDecrement }) => (
    <div>
      <button onClick={decrement} disabled={!canDecrement}>-</button>
      <span>{count}</span>
      <button onClick={increment} disabled={!canIncrement}>+</button>
    </div>
  )}
</Counter>

// Form Example:
<Form 
  initialValues={{ name: '', email: '' }}
  validators={{
    name: (value) => value.length < 2 ? 'Name too short' : undefined,
    email: (value) => !value.includes('@') ? 'Invalid email' : undefined,
  }}
  onSubmit={async (values) => console.log('Submit:', values)}
>
  {(state, actions) => (
    <form onSubmit={(e) => { e.preventDefault(); actions.submit(); }}>
      <input {...actions.getFieldProps('name')} placeholder="Name" />
      <input {...actions.getFieldProps('email')} placeholder="Email" />
      <button type="submit" disabled={!state.isValid || state.isSubmitting}>
        {state.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )}
</Form>

// Async Data Example:
<AsyncData fetcher={() => fetch('/api/data').then(r => r.json())}>
  {({ data, loading, error }, { refetch }) => (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && <div>Data: {JSON.stringify(data)}</div>}
      <button onClick={refetch}>Refetch</button>
    </div>
  )}
</AsyncData>

// Intersection Example:
<Intersection threshold={0.5} triggerOnce>
  {({ isIntersecting }, ref) => (
    <div ref={ref} className={isIntersecting ? 'animate-fade-in' : ''}>
      {isIntersecting ? 'Visible!' : 'Not visible'}
    </div>
  )}
</Intersection>

// Mouse Example:
<Mouse>
  {({ elementX, elementY, isOver }, ref) => (
    <div ref={ref} className="relative h-64 bg-gray-100">
      {isOver && (
        <div 
          className="absolute w-2 h-2 bg-red-500 rounded-full"
          style={{ left: elementX - 4, top: elementY - 4 }}
        />
      )}
      Mouse: ({elementX}, {elementY})
    </div>
  )}
</Mouse>
*/

// === EXPORT ALL RENDER PROP COMPONENTS ===
export {
  Toggle,
  Counter,
  Form,
  AsyncData,
  Intersection,
  Mouse,
};
