import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Task 5.2: Animation and Micro-interactions Implementation
// ============================================================================

// Task 5.2.3: Loading States with Skeleton Animations
const skeletonVariants = cva(
  'animate-pulse bg-gradient-to-r from-v0-bg-secondary via-v0-bg-tertiary to-v0-bg-secondary bg-[length:200%_100%]',
  {
    variants: {
      variant: {
        default: 'rounded-md',
        text: 'rounded-sm h-4',
        avatar: 'rounded-full',
        button: 'rounded-lg',
        card: 'rounded-xl',
      },
      size: {
        sm: 'h-3',
        md: 'h-4',
        lg: 'h-6',
        xl: 'h-8',
        '2xl': 'h-12',
      },
      width: {
        auto: 'w-auto',
        full: 'w-full',
        '1/4': 'w-1/4',
        '1/3': 'w-1/3',
        '1/2': 'w-1/2',
        '2/3': 'w-2/3',
        '3/4': 'w-3/4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      width: 'full',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, size, width, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, size, width }), className)}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// Task 5.2.4: Hover and Focus Animations for Interactive Elements
const interactiveVariants = cva(
  'transition-all duration-v0-fast ease-v0-ease-out focus:outline-none focus:ring-2 focus:ring-v0-gold focus:ring-offset-2 focus:ring-offset-v0-dark-bg',
  {
    variants: {
      variant: {
        default: 'hover:scale-v0-102 active:scale-v0-98',
        subtle: 'hover:bg-v0-bg-secondary active:bg-v0-bg-tertiary',
        glow: 'hover:shadow-lg hover:shadow-v0-gold/20 active:shadow-md',
        lift: 'hover:translate-y-[-2px] hover:shadow-lg active:translate-y-0',
        bounce: 'hover:scale-v0-105 active:scale-v0-95 transition-transform duration-v0-normal ease-v0-ease-bounce',
        fade: 'hover:opacity-v0-80 active:opacity-v0-60',
        border: 'hover:border-v0-gold active:border-v0-gold-hover',
        rotate: 'hover:rotate-3 active:rotate-1 transition-transform duration-v0-slow ease-v0-ease-back',
      },
      speed: {
        instant: 'duration-v0-instant',
        fast: 'duration-v0-fast',
        normal: 'duration-v0-normal',
        slow: 'duration-v0-slow',
        slower: 'duration-v0-slower',
      },
      disabled: {
        true: 'opacity-v0-50 cursor-not-allowed pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      speed: 'fast',
      disabled: false,
    },
  }
);

export interface InteractiveProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interactiveVariants> {
  asChild?: boolean;
}

export const Interactive = React.forwardRef<HTMLDivElement, InteractiveProps>(
  ({ className, variant, speed, disabled, asChild = false, children, ...props }, ref) => {
    const Component = asChild ? React.Fragment : 'div';
    
    if (asChild) {
      return React.cloneElement(
        children as React.ReactElement,
        {
          className: cn(interactiveVariants({ variant, speed, disabled }), className),
          ref,
          ...props,
        }
      );
    }

    return (
      <Component
        ref={ref}
        className={cn(interactiveVariants({ variant, speed, disabled }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Interactive.displayName = 'Interactive';

// Task 5.2.5: Page Transition Animations
const fadeVariants = cva(
  'transition-opacity',
  {
    variants: {
      variant: {
        in: 'opacity-v0-100',
        out: 'opacity-v0-0',
      },
      duration: {
        fast: 'duration-v0-fast',
        normal: 'duration-v0-normal',
        slow: 'duration-v0-slow',
        slower: 'duration-v0-slower',
      },
    },
    defaultVariants: {
      variant: 'in',
      duration: 'normal',
    },
  }
);

export interface FadeTransitionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof fadeVariants> {
  show?: boolean;
}

export const FadeTransition = React.forwardRef<HTMLDivElement, FadeTransitionProps>(
  ({ className, variant, duration, show = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          fadeVariants({ variant: show ? 'in' : 'out', duration }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FadeTransition.displayName = 'FadeTransition';

// Slide Transition for Panel Animations
const slideVariants = cva(
  'transition-transform',
  {
    variants: {
      direction: {
        left: 'translate-x-0',
        right: 'translate-x-0',
        up: 'translate-y-0',
        down: 'translate-y-0',
      },
      state: {
        in: '',
        out: '',
      },
      duration: {
        fast: 'duration-v0-fast',
        normal: 'duration-v0-normal',
        slow: 'duration-v0-slow',
      },
    },
    compoundVariants: [
      {
        direction: 'left',
        state: 'out',
        class: '-translate-x-full',
      },
      {
        direction: 'right',
        state: 'out',
        class: 'translate-x-full',
      },
      {
        direction: 'up',
        state: 'out',
        class: '-translate-y-full',
      },
      {
        direction: 'down',
        state: 'out',
        class: 'translate-y-full',
      },
    ],
    defaultVariants: {
      direction: 'left',
      state: 'in',
      duration: 'normal',
    },
  }
);

export interface SlideTransitionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof slideVariants> {
  show?: boolean;
}

export const SlideTransition = React.forwardRef<HTMLDivElement, SlideTransitionProps>(
  ({ className, direction, duration, show = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          slideVariants({ 
            direction, 
            state: show ? 'in' : 'out', 
            duration 
          }),
          'ease-v0-ease-out',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SlideTransition.displayName = 'SlideTransition';

// Skeleton Composition Components for Common UI Patterns
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => (
  <div className={cn('space-y-v0-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '2/3' : 'full'}
        className={i === 0 ? 'w-3/4' : ''}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-v0-4 p-v0-6', className)}>
    <div className="flex items-center space-x-v0-4">
      <Skeleton variant="avatar" className="h-12 w-12" />
      <div className="space-y-v0-2 flex-1">
        <Skeleton variant="text" width="1/2" />
        <Skeleton variant="text" width="1/4" size="sm" />
      </div>
    </div>
    <SkeletonText lines={2} />
    <div className="flex space-x-v0-2">
      <Skeleton variant="button" className="h-10 w-20" />
      <Skeleton variant="button" className="h-10 w-16" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ 
  items?: number; 
  className?: string;
}> = ({ items = 5, className }) => (
  <div className={cn('space-y-v0-3', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-v0-3 p-v0-3">
        <Skeleton variant="avatar" className="h-8 w-8" />
        <div className="flex-1 space-y-v0-1">
          <Skeleton variant="text" width="3/4" size="sm" />
          <Skeleton variant="text" width="1/2" size="sm" />
        </div>
      </div>
    ))}
  </div>
);

// Loading Spinner with v0 Design System
export const LoadingSpinner: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-v0-border-primary border-t-v0-gold',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Pulse Animation for Notifications
export const PulseIndicator: React.FC<{
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}> = ({ variant = 'default', className }) => {
  const variantClasses = {
    default: 'bg-v0-gold',
    success: 'bg-v0-green',
    warning: 'bg-v0-gold',
    error: 'bg-v0-red',
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'h-3 w-3 rounded-full',
          variantClasses[variant]
        )}
      />
      <div
        className={cn(
          'absolute inset-0 h-3 w-3 rounded-full animate-ping',
          variantClasses[variant],
          'opacity-v0-30'
        )}
      />
    </div>
  );
};
