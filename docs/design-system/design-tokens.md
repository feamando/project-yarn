# V0 Design Tokens - Project Yarn Design System

**Last Updated:** 2025-08-02  
**Source:** V0 Prototype Integration (Task 1.4)

## Overview

This document defines the complete design token system based on the V0 prototype specifications. Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes. They provide a single source of truth for design decisions across the Project Yarn application.

## Token Categories

### Color Tokens

#### Brand Colors
```json
{
  "color": {
    "brand": {
      "gold": {
        "value": "#FFD700",
        "type": "color",
        "description": "Primary brand color for logos, highlights, and important CTAs"
      },
      "red": {
        "value": "#FF4136", 
        "type": "color",
        "description": "Secondary brand color for accents, errors, and destructive actions"
      },
      "teal": {
        "value": "#4EC9B0",
        "type": "color", 
        "description": "AI processing indicator color for active states and progress"
      }
    }
  }
}
```

#### Dark Theme Colors
```json
{
  "color": {
    "dark": {
      "bg": {
        "value": "#1E1E1E",
        "type": "color",
        "description": "Primary dark background for cards and containers"
      },
      "border": {
        "value": "#3E3E42",
        "type": "color",
        "description": "Border color for dark theme components"
      },
      "text": {
        "value": "#D4D4D4", 
        "type": "color",
        "description": "Primary text color in dark theme"
      },
      "text-muted": {
        "value": "#858585",
        "type": "color",
        "description": "Secondary/muted text color in dark theme"
      }
    }
  }
}
```

### Typography Tokens

#### Font Families
```json
{
  "typography": {
    "fontFamily": {
      "serif": {
        "value": ["ui-serif", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        "type": "fontFamily",
        "description": "Serif font stack for branding elements (YarnLogo)"
      },
      "sans": {
        "value": ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"],
        "type": "fontFamily", 
        "description": "Sans-serif font stack for body text and UI elements"
      }
    }
  }
}
```

#### Font Sizes
```json
{
  "typography": {
    "fontSize": {
      "xs": {
        "value": "0.75rem",
        "type": "dimension",
        "description": "Extra small text (12px) - used in ContextIndicator"
      },
      "sm": {
        "value": "0.875rem", 
        "type": "dimension",
        "description": "Small text (14px) - used in buttons and UI elements"
      },
      "base": {
        "value": "1rem",
        "type": "dimension", 
        "description": "Base text size (16px) - body text default"
      },
      "lg": {
        "value": "1.125rem",
        "type": "dimension",
        "description": "Large text (18px) - section headings"
      },
      "xl": {
        "value": "1.25rem",
        "type": "dimension",
        "description": "Extra large text (20px) - used in YarnLogo"
      },
      "2xl": {
        "value": "1.5rem",
        "type": "dimension",
        "description": "2X large text (24px) - page headings"
      }
    }
  }
}
```

#### Font Weights
```json
{
  "typography": {
    "fontWeight": {
      "normal": {
        "value": "400",
        "type": "number",
        "description": "Normal weight - used in YarnLogo and body text"
      },
      "medium": {
        "value": "500", 
        "type": "number",
        "description": "Medium weight - used in ContextIndicator labels and buttons"
      },
      "semibold": {
        "value": "600",
        "type": "number",
        "description": "Semi-bold weight - used in headings"
      },
      "bold": {
        "value": "700",
        "type": "number", 
        "description": "Bold weight - used in important headings"
      }
    }
  }
}
```

#### Line Heights
```json
{
  "typography": {
    "lineHeight": {
      "none": {
        "value": "1",
        "type": "number",
        "description": "No line height - used in YarnLogo for tight spacing"
      },
      "tight": {
        "value": "1.25",
        "type": "number",
        "description": "Tight line height - used in small text"
      },
      "normal": {
        "value": "1.5", 
        "type": "number",
        "description": "Normal line height - used in body text"
      },
      "relaxed": {
        "value": "1.75",
        "type": "number",
        "description": "Relaxed line height - used in larger text"
      }
    }
  }
}
```

### Spacing Tokens

#### Component Spacing
```json
{
  "spacing": {
    "component": {
      "xs": {
        "value": "0.125rem",
        "type": "dimension", 
        "description": "2px - minimal spacing"
      },
      "sm": {
        "value": "0.25rem",
        "type": "dimension",
        "description": "4px - small spacing between related elements"
      },
      "md": {
        "value": "0.5rem", 
        "type": "dimension",
        "description": "8px - default spacing between elements"
      },
      "lg": {
        "value": "0.75rem",
        "type": "dimension",
        "description": "12px - larger spacing for separation"
      },
      "xl": {
        "value": "1rem",
        "type": "dimension",
        "description": "16px - section spacing"
      }
    }
  }
}
```

### Size Tokens

#### Icon Sizes
```json
{
  "size": {
    "icon": {
      "xs": {
        "value": "0.5rem",
        "type": "dimension",
        "description": "8px - extra small icons (Zap in ContextIndicator)"
      },
      "sm": {
        "value": "1rem", 
        "type": "dimension",
        "description": "16px - small icons (Brain in ContextIndicator)"
      },
      "md": {
        "value": "1.5rem",
        "type": "dimension", 
        "description": "24px - medium icons"
      },
      "lg": {
        "value": "2rem",
        "type": "dimension",
        "description": "32px - large icons (YarnLogo)"
      }
    }
  }
}
```

#### Component Sizes
```json
{
  "size": {
    "component": {
      "dot": {
        "value": "0.375rem",
        "type": "dimension",
        "description": "6px - small decorative dots (YarnLogo red dot)"
      },
      "button-height-sm": {
        "value": "2rem",
        "type": "dimension", 
        "description": "32px - small button height"
      },
      "button-height-md": {
        "value": "2.25rem",
        "type": "dimension",
        "description": "36px - default button height"
      },
      "button-height-lg": {
        "value": "2.5rem", 
        "type": "dimension",
        "description": "40px - large button height"
      }
    }
  }
}
```

### Border Radius Tokens

```json
{
  "borderRadius": {
    "none": {
      "value": "0",
      "type": "dimension",
      "description": "No border radius"
    },
    "sm": {
      "value": "0.125rem",
      "type": "dimension", 
      "description": "2px - subtle rounding"
    },
    "md": {
      "value": "0.375rem",
      "type": "dimension",
      "description": "6px - default component rounding (ContextIndicator)"
    },
    "lg": {
      "value": "0.5rem",
      "type": "dimension",
      "description": "8px - card and container rounding"
    },
    "full": {
      "value": "9999px", 
      "type": "dimension",
      "description": "Full rounding for circles (YarnLogo dot)"
    }
  }
}
```

### Shadow Tokens

```json
{
  "shadow": {
    "xs": {
      "value": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "type": "boxShadow",
      "description": "Extra small shadow - used in V0 enhanced buttons"
    },
    "sm": {
      "value": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      "type": "boxShadow", 
      "description": "Small shadow - used in cards and dropdowns"
    },
    "md": {
      "value": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      "type": "boxShadow",
      "description": "Medium shadow - used in modals and overlays"
    }
  }
}
```

## Token Usage Guidelines

### Component-Specific Token Usage

#### YarnLogo Component
```scss
.yarn-logo {
  font-family: var(--typography-fontFamily-serif);
  font-size: var(--typography-fontSize-xl);
  font-weight: var(--typography-fontWeight-normal);
  line-height: var(--typography-lineHeight-none);
  color: var(--color-brand-gold);
  
  .dot {
    width: var(--size-component-dot);
    height: var(--size-component-dot);
    background-color: var(--color-brand-red);
    border-radius: var(--borderRadius-full);
  }
}
```

#### ContextIndicator Component
```scss
.context-indicator {
  background-color: var(--color-dark-bg);
  border: 1px solid var(--color-dark-border);
  border-radius: var(--borderRadius-md);
  padding: var(--spacing-component-lg) var(--spacing-component-xl);
  
  .primary-text {
    font-size: var(--typography-fontSize-xs);
    font-weight: var(--typography-fontWeight-medium);
    color: var(--color-dark-text);
  }
  
  .secondary-text {
    font-size: var(--typography-fontSize-xs);
    font-weight: var(--typography-fontWeight-normal);
    color: var(--color-dark-text-muted);
  }
  
  .brain-icon {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
    color: var(--color-brand-gold);
  }
  
  .processing-icon {
    width: var(--size-icon-xs);
    height: var(--size-icon-xs);
    color: var(--color-brand-teal);
  }
}
```

#### Enhanced Button Styling
```scss
.button-v0 {
  font-weight: var(--typography-fontWeight-medium);
  box-shadow: var(--shadow-xs);
  
  &.size-sm {
    height: var(--size-component-button-height-sm);
    font-size: var(--typography-fontSize-sm);
  }
  
  &.size-md {
    height: var(--size-component-button-height-md);
    font-size: var(--typography-fontSize-sm);
  }
  
  &.size-lg {
    height: var(--size-component-button-height-lg);
    font-size: var(--typography-fontSize-base);
  }
}
```

## CSS Custom Properties Implementation

Add these CSS custom properties to your global styles:

```css
:root {
  /* Brand Colors */
  --color-brand-gold: #FFD700;
  --color-brand-red: #FF4136;
  --color-brand-teal: #4EC9B0;
  
  /* Dark Theme Colors */
  --color-dark-bg: #1E1E1E;
  --color-dark-border: #3E3E42;
  --color-dark-text: #D4D4D4;
  --color-dark-text-muted: #858585;
  
  /* Typography */
  --typography-fontSize-xs: 0.75rem;
  --typography-fontSize-sm: 0.875rem;
  --typography-fontSize-base: 1rem;
  --typography-fontSize-lg: 1.125rem;
  --typography-fontSize-xl: 1.25rem;
  --typography-fontSize-2xl: 1.5rem;
  
  --typography-fontWeight-normal: 400;
  --typography-fontWeight-medium: 500;
  --typography-fontWeight-semibold: 600;
  --typography-fontWeight-bold: 700;
  
  --typography-lineHeight-none: 1;
  --typography-lineHeight-tight: 1.25;
  --typography-lineHeight-normal: 1.5;
  --typography-lineHeight-relaxed: 1.75;
  
  /* Spacing */
  --spacing-component-xs: 0.125rem;
  --spacing-component-sm: 0.25rem;
  --spacing-component-md: 0.5rem;
  --spacing-component-lg: 0.75rem;
  --spacing-component-xl: 1rem;
  
  /* Sizes */
  --size-icon-xs: 0.5rem;
  --size-icon-sm: 1rem;
  --size-icon-md: 1.5rem;
  --size-icon-lg: 2rem;
  
  --size-component-dot: 0.375rem;
  --size-component-button-height-sm: 2rem;
  --size-component-button-height-md: 2.25rem;
  --size-component-button-height-lg: 2.5rem;
  
  /* Border Radius */
  --borderRadius-none: 0;
  --borderRadius-sm: 0.125rem;
  --borderRadius-md: 0.375rem;
  --borderRadius-lg: 0.5rem;
  --borderRadius-full: 9999px;
  
  /* Shadows */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

## Design Token Benefits

### Consistency
- **Single source of truth** for all visual design decisions
- **Consistent spacing** and sizing across all components
- **Unified color palette** ensuring brand consistency

### Maintainability
- **Easy updates** - change a token value to update all instances
- **Reduced duplication** - no more hardcoded values scattered throughout code
- **Clear documentation** - every design decision is documented and named

### Scalability
- **Theme support** - easy to create light/dark themes or brand variations
- **Component variants** - tokens enable systematic component variations
- **Design system growth** - new components automatically inherit consistent styling

## Integration Status

- [x] Design tokens extracted from V0 prototype specifications
- [x] Complete token system documented (colors, typography, spacing, sizes, shadows)
- [x] Component-specific usage examples provided
- [x] CSS custom properties implementation guide created
- [ ] CSS custom properties added to global styles
- [ ] Tailwind configuration updated with token-based values
- [ ] Components refactored to use design tokens
- [ ] Token validation and testing completed

## Next Steps

1. Add design token CSS custom properties to global styles
2. Update Tailwind configuration to use design tokens
3. Refactor existing components to use design tokens instead of hardcoded values
4. Create design token validation tests
5. Generate design token documentation for Storybook
6. Implement design token tooling for automated updates
