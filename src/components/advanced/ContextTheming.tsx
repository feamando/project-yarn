import * as React from 'react';
import { createContext, useContext, useMemo } from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// === CONTEXT-BASED THEMING SYSTEM ===
// Advanced theming patterns for nested component styling with context inheritance

// === THEME TYPES ===
interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  border: string;
  borderSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// === PREDEFINED THEMES ===
const v0Theme: ThemeConfig = {
  name: 'v0',
  colors: {
    background: 'bg-v0-dark-bg',
    backgroundSecondary: 'bg-v0-bg-secondary',
    backgroundTertiary: 'bg-v0-bg-tertiary',
    border: 'border-v0-border-primary',
    borderSecondary: 'border-v0-border-secondary',
    text: 'text-v0-text-primary',
    textSecondary: 'text-v0-text-secondary',
    textMuted: 'text-v0-text-muted',
    accent: 'text-v0-gold bg-v0-gold',
    accentHover: 'hover:bg-v0-gold-hover',
    success: 'text-v0-teal bg-v0-teal',
    warning: 'text-yellow-500 bg-yellow-500',
    error: 'text-v0-red bg-v0-red',
    info: 'text-blue-500 bg-blue-500',
  },
  spacing: {
    xs: 'space-v0-1',
    sm: 'space-v0-2',
    md: 'space-v0-4',
    lg: 'space-v0-6',
    xl: 'space-v0-8',
    '2xl': 'space-v0-12',
  },
  typography: {
    fontFamily: 'font-v0-sans',
    fontSize: {
      xs: 'text-v0-xs',
      sm: 'text-v0-sm',
      base: 'text-v0-base',
      lg: 'text-v0-lg',
      xl: 'text-v0-xl',
      '2xl': 'text-v0-2xl',
      '3xl': 'text-v0-3xl',
      '4xl': 'text-v0-4xl',
    },
    fontWeight: {
      light: 'font-v0-light',
      normal: 'font-v0-normal',
      medium: 'font-v0-medium',
      semibold: 'font-v0-semibold',
      bold: 'font-v0-bold',
    },
    lineHeight: {
      tight: 'leading-tight',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
    },
  },
  borderRadius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  },
  shadows: {
    sm: 'shadow-v0-shadow-sm',
    md: 'shadow-v0-shadow',
    lg: 'shadow-v0-shadow-md',
    xl: 'shadow-v0-shadow-lg',
  },
};

const lightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    background: 'bg-white',
    backgroundSecondary: 'bg-gray-50',
    backgroundTertiary: 'bg-gray-100',
    border: 'border-gray-200',
    borderSecondary: 'border-gray-300',
    text: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textMuted: 'text-gray-500',
    accent: 'text-blue-600 bg-blue-600',
    accentHover: 'hover:bg-blue-700',
    success: 'text-green-600 bg-green-600',
    warning: 'text-yellow-600 bg-yellow-600',
    error: 'text-red-600 bg-red-600',
    info: 'text-blue-600 bg-blue-600',
  },
  spacing: {
    xs: 'space-1',
    sm: 'space-2',
    md: 'space-4',
    lg: 'space-6',
    xl: 'space-8',
    '2xl': 'space-12',
  },
  typography: {
    fontFamily: 'font-sans',
    fontSize: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
    fontWeight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    lineHeight: {
      tight: 'leading-tight',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
    },
  },
  borderRadius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  },
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-md',
    xl: 'shadow-lg',
  },
};

const darkTheme: ThemeConfig = {
  name: 'dark',
  colors: {
    background: 'bg-gray-900',
    backgroundSecondary: 'bg-gray-800',
    backgroundTertiary: 'bg-gray-700',
    border: 'border-gray-700',
    borderSecondary: 'border-gray-600',
    text: 'text-gray-100',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    accent: 'text-blue-400 bg-blue-600',
    accentHover: 'hover:bg-blue-700',
    success: 'text-green-400 bg-green-600',
    warning: 'text-yellow-400 bg-yellow-600',
    error: 'text-red-400 bg-red-600',
    info: 'text-blue-400 bg-blue-600',
  },
  spacing: {
    xs: 'space-1',
    sm: 'space-2',
    md: 'space-4',
    lg: 'space-6',
    xl: 'space-8',
    '2xl': 'space-12',
  },
  typography: {
    fontFamily: 'font-sans',
    fontSize: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
    fontWeight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    lineHeight: {
      tight: 'leading-tight',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
    },
  },
  borderRadius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  },
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-md',
    xl: 'shadow-lg',
  },
};

// === THEME CONTEXT ===
interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig | string) => void;
  availableThemes: Record<string, ThemeConfig>;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// === THEME PROVIDER ===
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  themes?: Record<string, ThemeConfig>;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'v0',
  themes: customThemes = {} 
}: ThemeProviderProps) {
  const availableThemes = useMemo(() => ({
    v0: v0Theme,
    light: lightTheme,
    dark: darkTheme,
    ...customThemes,
  }), [customThemes]);

  const [currentTheme, setCurrentTheme] = React.useState<ThemeConfig>(
    (availableThemes as Record<string, ThemeConfig>)[defaultTheme] || v0Theme
  );

  const setTheme = React.useCallback((theme: ThemeConfig | string) => {
    if (typeof theme === 'string') {
      const themeConfig = (availableThemes as Record<string, ThemeConfig>)[theme];
      if (themeConfig) {
        setCurrentTheme(themeConfig);
      }
    } else {
      setCurrentTheme(theme);
    }
  }, [availableThemes]);

  const isDark = useMemo(() => {
    return currentTheme.name === 'dark' || currentTheme.name === 'v0';
  }, [currentTheme]);

  const toggleTheme = React.useCallback(() => {
    if (currentTheme.name === 'light') {
      setTheme('dark');
    } else if (currentTheme.name === 'dark') {
      setTheme('v0');
    } else {
      setTheme('light');
    }
  }, [currentTheme, setTheme]);

  const contextValue = useMemo(() => ({
    theme: currentTheme,
    setTheme,
    availableThemes,
    isDark,
    toggleTheme,
  }), [currentTheme, setTheme, availableThemes, isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={cn(
        currentTheme.colors.background,
        currentTheme.colors.text,
        currentTheme.typography.fontFamily,
        "min-h-screen transition-colors duration-300"
      )}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// === THEMED COMPONENTS ===
// Components that automatically adapt to the current theme context

// === THEMED CARD ===
const themedCardVariants = cva(
  "border rounded-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "",
        elevated: "",
        outlined: "",
        filled: "",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-lg",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  }
);

interface ThemedCardProps extends VariantProps<typeof themedCardVariants> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ThemedCard({ 
  children, 
  className, 
  variant, 
  size, 
  interactive,
  onClick 
}: ThemedCardProps) {
  const { theme } = useTheme();

  const variantClasses = {
    default: cn(
      theme.colors.backgroundSecondary,
      theme.colors.border,
      theme.shadows.sm
    ),
    elevated: cn(
      theme.colors.backgroundSecondary,
      theme.colors.border,
      theme.shadows.md
    ),
    outlined: cn(
      theme.colors.background,
      theme.colors.border,
      "border-2"
    ),
    filled: cn(
      theme.colors.backgroundTertiary,
      "border-transparent"
    ),
  };

  return (
    <div 
      className={cn(
        themedCardVariants({ variant, size, interactive }),
        variantClasses[variant || 'default'],
        theme.borderRadius.lg,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// === THEMED BUTTON ===
const themedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "",
        secondary: "",
        outline: "",
        ghost: "",
        link: "",
        destructive: "",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-base",
        xl: "h-12 px-8 text-lg",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ThemedButtonProps extends VariantProps<typeof themedButtonVariants> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function ThemedButton({ 
  children, 
  className, 
  variant, 
  size,
  disabled = false,
  loading = false,
  onClick 
}: ThemedButtonProps) {
  const { theme } = useTheme();

  const variantClasses = {
    primary: cn(
      theme.colors.accent.replace('text-', 'bg-').replace('bg-bg-', 'bg-'),
      "text-white",
      theme.colors.accentHover,
      "focus:ring-current/20"
    ),
    secondary: cn(
      theme.colors.backgroundSecondary,
      theme.colors.text,
      theme.colors.border,
      "border hover:bg-opacity-80 focus:ring-current/20"
    ),
    outline: cn(
      theme.colors.background,
      theme.colors.accent.replace('bg-', 'text-').replace('text-text-', 'text-'),
      theme.colors.border,
      "border-2 hover:bg-current/10 focus:ring-current/20"
    ),
    ghost: cn(
      theme.colors.text,
      "hover:bg-current/10 focus:ring-current/20"
    ),
    link: cn(
      theme.colors.accent.replace('bg-', 'text-').replace('text-text-', 'text-'),
      "underline-offset-4 hover:underline focus:ring-current/20"
    ),
    destructive: cn(
      theme.colors.error.replace('text-', 'bg-').replace('bg-bg-', 'bg-'),
      "text-white hover:bg-opacity-90 focus:ring-current/20"
    ),
  };

  return (
    <button 
      className={cn(
        themedButtonVariants({ variant, size }),
        variantClasses[variant || 'primary'],
        theme.borderRadius.md,
        loading && "cursor-wait",
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  );
}

// === THEMED TEXT ===
interface ThemedTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'warning' | 'error' | 'info';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  as?: React.ElementType;
}

export function ThemedText({ 
  children, 
  className, 
  variant = 'primary',
  size = 'base',
  weight = 'normal',
  as: Component = 'p' 
}: ThemedTextProps) {
  const { theme } = useTheme();

  const variantClasses = {
    primary: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    accent: theme.colors.accent.replace('bg-', 'text-').replace('text-text-', 'text-'),
    success: theme.colors.success.replace('bg-', 'text-').replace('text-text-', 'text-'),
    warning: theme.colors.warning.replace('bg-', 'text-').replace('text-text-', 'text-'),
    error: theme.colors.error.replace('bg-', 'text-').replace('text-text-', 'text-'),
    info: theme.colors.info.replace('bg-', 'text-').replace('text-text-', 'text-'),
  };

  return (
    <Component 
      className={cn(
        variantClasses[variant],
        theme.typography.fontSize[size],
        theme.typography.fontWeight[weight],
        className
      )}
    >
      {children}
    </Component>
  );
}

// === THEMED INPUT ===
interface ThemedInputProps {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  type?: string;
}

export function ThemedInput({ 
  className, 
  placeholder,
  value,
  onChange,
  disabled = false,
  error = false,
  type = "text"
}: ThemedInputProps) {
  const { theme } = useTheme();

  return (
    <input 
      type={type}
      className={cn(
        "w-full px-3 py-2 transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        theme.colors.background,
        theme.colors.text,
        theme.colors.border,
        theme.borderRadius.md,
        "border",
        error 
          ? cn(theme.colors.error.replace('bg-', 'border-').replace('text-', 'border-'), "focus:ring-red-500/20")
          : cn(theme.colors.border, "focus:ring-current/20"),
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

// === THEME SWITCHER COMPONENT ===
interface ThemeSwitcherProps {
  className?: string;
  showLabels?: boolean;
}

export function ThemeSwitcher({ className, showLabels = true }: ThemeSwitcherProps) {
  const { theme, setTheme, availableThemes, toggleTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabels && (
        <ThemedText size="sm" variant="muted">
          Theme:
        </ThemedText>
      )}
      
      <select 
        value={theme.name}
        onChange={(e) => setTheme(e.target.value)}
        className={cn(
          "px-2 py-1 border rounded text-sm",
          theme.colors.background,
          theme.colors.text,
          theme.colors.border,
          theme.borderRadius.sm
        )}
      >
        {Object.entries(availableThemes).map(([key, themeConfig]) => (
          <option key={key} value={key}>
            {themeConfig.name.charAt(0).toUpperCase() + themeConfig.name.slice(1)}
          </option>
        ))}
      </select>
      
      <ThemedButton 
        variant="ghost" 
        size="icon"
        onClick={toggleTheme}
        className="ml-2"
      >
        {theme.name === 'light' ? '🌙' : '☀️'}
      </ThemedButton>
    </div>
  );
}

// === USAGE EXAMPLES ===
/*
// Basic Theme Provider Setup:
<ThemeProvider defaultTheme="v0">
  <App />
</ThemeProvider>

// Custom Theme:
const customTheme: ThemeConfig = {
  name: 'custom',
  colors: { ... },
  spacing: { ... },
  typography: { ... },
  // ... other config
};

<ThemeProvider 
  defaultTheme="custom" 
  themes={{ custom: customTheme }}
>
  <App />
</ThemeProvider>

// Using Themed Components:
function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <ThemedCard variant="elevated" size="lg">
      <ThemedText size="xl" weight="bold">
        Card Title
      </ThemedText>
      
      <ThemedText variant="muted">
        Card description text
      </ThemedText>
      
      <div className="flex gap-2 mt-4">
        <ThemedButton variant="primary">
          Primary Action
        </ThemedButton>
        
        <ThemedButton variant="outline">
          Secondary Action
        </ThemedButton>
      </div>
    </ThemedCard>
  );
}

// Theme Switcher:
<ThemeSwitcher showLabels />
*/


