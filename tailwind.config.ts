import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // === HYBRID TOKEN MAPPING SYSTEM ===
        // Layer 1: Base Yarn Tokens (Brand Colors)
        "yarn-bg": "#1E1E1E",
        "yarn-bg-secondary": "#252526",
        "yarn-bg-tertiary": "#2D2D30",
        "yarn-border": "#3E3E42",
        "yarn-text": "#D4D4D4",
        "yarn-text-muted": "#858585",
        "yarn-gold": "#FFD700",
        "yarn-gold-hover": "#E6C200",
        "yarn-red": "#FF4136",
        "yarn-green": "#4EC9B0",
        
        // Layer 2: v0 Design System Tokens (Direct Values - Fixed Token Resolution)
        "v0-gold": "#FFD700",
        "v0-gold-hover": "#E6C200",
        "v0-red": "#FF4136",
        "v0-teal": "#4EC9B0",
        "v0-dark-bg": "#1E1E1E",
        "v0-bg-secondary": "#252526",
        "v0-bg-tertiary": "#2D2D30",
        "v0-border-primary": "#3E3E42",
        "v0-text-primary": "#D4D4D4",
        "v0-text-muted": "#858585",
        "v0-text-secondary": "#CCCCCC",
        
        // Enhanced Text Hierarchy - Task 5.1.5
        "v0-text-heading": "var(--v0-text-heading, #FFFFFF)",
        "v0-text-emphasis": "var(--v0-text-emphasis, #FFD700)",
        "v0-text-link": "var(--v0-text-link, #4FC3F7)",
        "v0-text-link-hover": "var(--v0-text-link-hover, #29B6F6)",
        "v0-text-disabled": "var(--v0-text-disabled, #666666)",
        "v0-text-placeholder": "var(--v0-text-placeholder, #999999)",
        "v0-text-success": "var(--v0-text-success, #4EC9B0)",
        "v0-text-warning": "var(--v0-text-warning, #FFD700)",
        "v0-text-error": "var(--v0-text-error, #FF6B6B)",
        "v0-text-info": "var(--v0-text-info, #4FC3F7)",
        
        // Layer 3: Semantic Color System with Contrast Ratios
        "v0-semantic": {
          // Primary Colors (4.5:1 contrast minimum)
          "brand-primary": "var(--v0-gold, #FFD700)",
          "brand-secondary": "var(--v0-teal, #4EC9B0)",
          "accent-primary": "var(--v0-red, #FF4136)",
          
          // Background System
          "bg-primary": "var(--v0-dark-bg, #1E1E1E)",
          "bg-secondary": "var(--v0-bg-secondary, #252526)",
          "bg-tertiary": "var(--v0-bg-tertiary, #2D2D30)",
          "bg-elevated": "var(--v0-bg-elevated, #2D2D30)",
          "bg-overlay": "var(--v0-bg-overlay, rgba(30, 30, 30, 0.8))",
          
          // Text System with Contrast
          "text-primary": "var(--v0-text-primary, #D4D4D4)", // 7.8:1 contrast
          "text-secondary": "var(--v0-text-secondary, #CCCCCC)", // 6.2:1 contrast
          "text-muted": "var(--v0-text-muted, #858585)", // 4.6:1 contrast
          "text-inverse": "var(--v0-text-inverse, #1E1E1E)",
          
          // Border System
          "border-primary": "var(--v0-border-primary, #3E3E42)",
          "border-secondary": "var(--v0-border-secondary, #2D2D30)",
          "border-accent": "var(--v0-gold, #FFD700)",
          
          // State Colors
          "success": "var(--v0-teal, #4EC9B0)",
          "warning": "var(--v0-gold, #FFD700)",
          "error": "var(--v0-red, #FF4136)",
          "info": "var(--v0-teal, #4EC9B0)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      
      // === TYPOGRAPHY SCALE TOKENS ===
      // Task 5.1.1: Consistent font scale (12px, 14px, 16px, 18px, 24px, 32px)
      // Task 5.1.2: Proper line-height ratios (1.2 for headings, 1.5 for body)
      fontSize: {
        // Primary Typography Scale - Task 5.1.1
        'v0-xs': ['0.75rem', { lineHeight: '1.5' }],       // 12px - Small text, captions
        'v0-sm': ['0.875rem', { lineHeight: '1.5' }],      // 14px - Body text, labels
        'v0-base': ['1rem', { lineHeight: '1.5' }],        // 16px - Default body text
        'v0-lg': ['1.125rem', { lineHeight: '1.5' }],      // 18px - Large body text
        'v0-xl': ['1.5rem', { lineHeight: '1.2' }],        // 24px - Small headings
        'v0-2xl': ['2rem', { lineHeight: '1.2' }],         // 32px - Large headings
        
        // Extended Scale for Additional Use Cases
        'v0-3xl': ['2.25rem', { lineHeight: '1.2' }],      // 36px - Display headings
        'v0-4xl': ['3rem', { lineHeight: '1.2' }],         // 48px - Hero headings
        'v0-5xl': ['3.75rem', { lineHeight: '1.2' }],      // 60px - Large display
        'v0-6xl': ['4.5rem', { lineHeight: '1.2' }],       // 72px - Extra large display
      },
      
      fontWeight: {
        // v0 Font Weight Hierarchy
        'v0-light': '300',
        'v0-normal': '400',
        'v0-medium': '500',
        'v0-semibold': '600',
        'v0-bold': '700',
      },
      
      letterSpacing: {
        // v0 Letter Spacing for improved readability
        'v0-tighter': '-0.05em',
        'v0-tight': '-0.025em',
        'v0-normal': '0em',
        'v0-wide': '0.025em',
        'v0-wider': '0.05em',
        'v0-widest': '0.1em',
      },
      
      // === SPACING SYSTEM TOKENS (8px grid) ===
      spacing: {
        // v0 Spacing Scale (8px grid system)
        'v0-0': '0px',
        'v0-1': '0.25rem',   // 4px
        'v0-2': '0.5rem',    // 8px
        'v0-3': '0.75rem',   // 12px
        'v0-4': '1rem',      // 16px
        'v0-5': '1.25rem',   // 20px
        'v0-6': '1.5rem',    // 24px
        'v0-8': '2rem',      // 32px
        'v0-10': '2.5rem',   // 40px
        'v0-12': '3rem',     // 48px
        'v0-16': '4rem',     // 64px
        'v0-20': '5rem',     // 80px
        'v0-24': '6rem',     // 96px
        'v0-32': '8rem',     // 128px
        'v0-40': '10rem',    // 160px
        'v0-48': '12rem',    // 192px
        'v0-56': '14rem',    // 224px
        'v0-64': '16rem',    // 256px
      },
      
      // === ANIMATION AND MICRO-INTERACTION TOKENS ===
      // Task 5.2.1: Consistent transition durations (150ms, 200ms, 300ms)
      transitionDuration: {
        'v0-instant': '0ms',
        'v0-fast': '150ms',     // Quick interactions (hover, focus)
        'v0-normal': '200ms',   // Standard transitions
        'v0-slow': '300ms',     // Complex animations
        'v0-slower': '500ms',   // Page transitions
        'v0-slowest': '800ms',  // Complex state changes
      },
      
      // Task 5.2.2: Easing functions (ease-in-out, ease-out, ease-in)
      transitionTimingFunction: {
        'v0-linear': 'linear',
        'v0-ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'v0-ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'v0-ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'v0-ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'v0-ease-elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'v0-ease-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.1)',
      },
      
      // Transform Scale Values for Micro-interactions
      scale: {
        'v0-95': '0.95',   // Pressed state
        'v0-98': '0.98',   // Active state
        'v0-100': '1',     // Default state
        'v0-102': '1.02',  // Hover state
        'v0-105': '1.05',  // Emphasized hover
        'v0-110': '1.1',   // Strong emphasis
      },
      
      // Opacity Values for Fade Animations
      opacity: {
        'v0-0': '0',
        'v0-10': '0.1',
        'v0-20': '0.2',
        'v0-30': '0.3',
        'v0-40': '0.4',
        'v0-50': '0.5',
        'v0-60': '0.6',
        'v0-70': '0.7',
        'v0-80': '0.8',
        'v0-90': '0.9',
        'v0-100': '1',
      },
      
      // Blur Values for Focus States
      blur: {
        'v0-none': '0',
        'v0-sm': '4px',
        'v0-md': '8px',
        'v0-lg': '16px',
        'v0-xl': '24px',
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-crimson)", "Georgia", "serif"],
        mono: ["Google Sans Code", "Menlo", "Monaco", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
