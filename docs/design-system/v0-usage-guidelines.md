# V0 Design System Usage Guidelines

**Last Updated:** 2025-08-03  
**Source:** V0 Design System Integration (TP-005 Tasks 1.1-1.3)

## Overview

This document provides comprehensive usage guidelines for the V0 design system that has been integrated into Project Yarn. The V0 design system includes design tokens, CSS custom properties, and Tailwind utility classes that provide a consistent visual language across the application.

## Quick Reference

### Design Token Access Methods

The V0 design system provides **two primary ways** to access design tokens:

1. **CSS Custom Properties** - Use in CSS files and styled components
2. **Tailwind Utility Classes** - Use directly in JSX className attributes

## CSS Custom Properties Usage

### Color Properties

```css
/* Primary Colors */
var(--v0-color-gold)      /* #FFD700 - Primary brand color */
var(--v0-color-red)       /* #FF4136 - Secondary brand/error color */
var(--v0-color-teal)      /* #4EC9B0 - Accent/success color */

/* Background Colors */
var(--v0-bg-primary)      /* #1E1E1E - Main background */
var(--v0-bg-secondary)    /* #2A2A2A - Secondary background */
var(--v0-bg-tertiary)     /* #333333 - Tertiary background */

/* Text Colors */
var(--v0-text-primary)    /* #D4D4D4 - Primary text */
var(--v0-text-secondary)  /* #858585 - Secondary text */
var(--v0-text-accent)     /* #FFD700 - Accent text */
var(--v0-text-muted)      /* #666666 - Muted text */

/* Border Colors */
var(--v0-border-primary)  /* #3E3E42 - Primary borders */
var(--v0-border-accent)   /* #FFD700 - Accent borders */
var(--v0-border-subtle)   /* #2A2A2A - Subtle borders */
```

### Typography Properties

```css
/* Font Families */
var(--v0-font-serif)      /* For branding and logos */
var(--v0-font-sans)       /* For body text */
var(--v0-font-mono)       /* For code */

/* Font Weights */
var(--v0-font-weight-light)     /* 300 */
var(--v0-font-weight-normal)    /* 400 */
var(--v0-font-weight-medium)    /* 500 */
var(--v0-font-weight-semibold)  /* 600 */
var(--v0-font-weight-bold)      /* 700 */

/* Font Sizes */
var(--v0-font-size-xs)    /* 0.75rem - 12px */
var(--v0-font-size-sm)    /* 0.875rem - 14px */
var(--v0-font-size-base)  /* 1rem - 16px */
var(--v0-font-size-lg)    /* 1.125rem - 18px */
var(--v0-font-size-xl)    /* 1.25rem - 20px */
var(--v0-font-size-2xl)   /* 1.5rem - 24px */
var(--v0-font-size-3xl)   /* 1.875rem - 30px */
var(--v0-font-size-4xl)   /* 2.25rem - 36px */
```

### Spacing Properties

```css
/* V0 Spacing System (4px base unit) */
var(--v0-space-1)   /* 0.25rem - 4px */
var(--v0-space-2)   /* 0.5rem - 8px */
var(--v0-space-3)   /* 0.75rem - 12px */
var(--v0-space-4)   /* 1rem - 16px */
var(--v0-space-5)   /* 1.25rem - 20px */
var(--v0-space-6)   /* 1.5rem - 24px */
var(--v0-space-8)   /* 2rem - 32px */
var(--v0-space-10)  /* 2.5rem - 40px */
var(--v0-space-12)  /* 3rem - 48px */
var(--v0-space-16)  /* 4rem - 64px */
var(--v0-space-20)  /* 5rem - 80px */
var(--v0-space-24)  /* 6rem - 96px */
```

### Component-Specific Properties

```css
/* Button Tokens */
var(--v0-button-shadow)   /* Box shadow for buttons */
var(--v0-button-radius)   /* Border radius for buttons */
var(--v0-button-font-weight) /* Font weight for buttons */

/* Card Tokens */
var(--v0-card-background) /* Background color for cards */
var(--v0-card-border)     /* Border color for cards */
var(--v0-card-radius)     /* Border radius for cards */
var(--v0-card-shadow)     /* Box shadow for cards */

/* Input Tokens */
var(--v0-input-background)    /* Background for inputs */
var(--v0-input-border)        /* Border for inputs */
var(--v0-input-radius)        /* Border radius for inputs */
var(--v0-input-focus-border)  /* Focus border for inputs */

/* Modal Tokens */
var(--v0-modal-background)    /* Background for modals */
var(--v0-modal-border)        /* Border for modals */
var(--v0-modal-radius)        /* Border radius for modals */
var(--v0-modal-shadow)        /* Box shadow for modals */
```

## Tailwind Utility Classes Usage

### Color Classes

```jsx
// Primary Colors
<div className="text-v0-gold">Gold text</div>
<div className="bg-v0-red">Red background</div>
<div className="border-v0-teal">Teal border</div>

// Background Colors
<div className="bg-v0-bg-primary">Primary background</div>
<div className="bg-v0-bg-secondary">Secondary background</div>
<div className="bg-v0-bg-tertiary">Tertiary background</div>

// Text Colors
<span className="text-v0-text-primary">Primary text</span>
<span className="text-v0-text-secondary">Secondary text</span>
<span className="text-v0-text-accent">Accent text</span>
<span className="text-v0-text-muted">Muted text</span>

// Border Colors
<div className="border border-v0-border-primary">Primary border</div>
<div className="border border-v0-border-accent">Accent border</div>
<div className="border border-v0-border-subtle">Subtle border</div>
```

### Typography Classes

```jsx
// Font Families
<h1 className="font-v0-serif">Branding Text</h1>
<p className="font-v0-sans">Body Text</p>
<code className="font-v0-mono">Code Text</code>

// Combined Typography
<h1 className="font-v0-serif text-v0-text-accent text-v0-font-size-2xl">
  Brand Heading
</h1>
```

### Spacing Classes

```jsx
// Padding
<div className="p-v0-4">Padding 16px</div>
<div className="px-v0-6 py-v0-3">Horizontal 24px, Vertical 12px</div>

// Margin
<div className="m-v0-2">Margin 8px</div>
<div className="mt-v0-8 mb-v0-4">Top 32px, Bottom 16px</div>

// Gap (for flexbox/grid)
<div className="flex gap-v0-3">Gap 12px</div>
```

### Border Radius Classes

```jsx
<div className="rounded-v0-sm">Small radius</div>
<div className="rounded-v0-base">Base radius</div>
<div className="rounded-v0-md">Medium radius</div>
<div className="rounded-v0-lg">Large radius</div>
<div className="rounded-v0-xl">Extra large radius</div>
<div className="rounded-v0-2xl">2X large radius</div>
<div className="rounded-v0-full">Full radius (circle)</div>
```

### Shadow Classes

```jsx
<div className="shadow-v0-xs">Extra small shadow</div>
<div className="shadow-v0-sm">Small shadow</div>
<div className="shadow-v0-base">Base shadow</div>
<div className="shadow-v0-md">Medium shadow</div>
<div className="shadow-v0-lg">Large shadow</div>
<div className="shadow-v0-xl">Extra large shadow</div>
```

## Usage Patterns and Best Practices

### When to Use CSS Custom Properties vs Tailwind Classes

#### Use CSS Custom Properties When:
- Writing custom CSS in `.css` files
- Creating styled components with complex logic
- Building reusable component styles
- Need to access raw values for calculations

```css
/* Example: Custom component styling */
.custom-button {
  background-color: var(--v0-color-gold);
  color: var(--v0-text-primary);
  padding: var(--v0-space-3) var(--v0-space-6);
  border-radius: var(--v0-radius-md);
  box-shadow: var(--v0-shadow-sm);
  font-family: var(--v0-font-sans);
  font-weight: var(--v0-font-weight-medium);
}
```

#### Use Tailwind Classes When:
- Applying styles directly in JSX
- Rapid prototyping and development
- Simple, one-off styling needs
- Responsive design patterns

```jsx
// Example: Direct JSX styling
<button className="bg-v0-gold text-v0-text-primary px-v0-6 py-v0-3 rounded-v0-md shadow-v0-sm font-v0-sans font-medium">
  Click Me
</button>
```

### Component-Specific Usage Guidelines

#### Branding Elements (YarnLogo, Headers)
```jsx
// Always use v0-serif for branding
<h1 className="font-v0-serif text-v0-text-accent text-v0-font-size-3xl">
  Project Yarn
</h1>

// YarnLogo should use gold primary with red accent
<div className="text-v0-gold">
  Yarn<span className="text-v0-red">•</span>
</div>
```

#### Buttons
```jsx
// Primary button
<button className="bg-v0-gold text-v0-bg-primary px-v0-6 py-v0-3 rounded-v0-md shadow-v0-sm font-medium hover:bg-opacity-90">
  Primary Action
</button>

// Secondary button
<button className="bg-v0-bg-secondary text-v0-text-primary border border-v0-border-primary px-v0-6 py-v0-3 rounded-v0-md hover:bg-v0-bg-tertiary">
  Secondary Action
</button>

// Destructive button
<button className="bg-v0-red text-v0-text-primary px-v0-6 py-v0-3 rounded-v0-md shadow-v0-sm font-medium hover:bg-opacity-90">
  Delete
</button>
```

#### Cards and Containers
```jsx
<div className="bg-v0-bg-secondary border border-v0-border-primary rounded-v0-lg shadow-v0-sm p-v0-6">
  <h3 className="text-v0-text-primary font-v0-sans font-semibold mb-v0-3">
    Card Title
  </h3>
  <p className="text-v0-text-secondary font-v0-sans">
    Card content goes here
  </p>
</div>
```

#### Forms and Inputs
```jsx
<div className="space-y-v0-4">
  <label className="block text-v0-text-primary font-v0-sans font-medium">
    Input Label
  </label>
  <input 
    className="w-full bg-v0-bg-tertiary border border-v0-border-primary rounded-v0-base px-v0-4 py-v0-3 text-v0-text-primary font-v0-sans focus:border-v0-border-accent focus:outline-none"
    placeholder="Enter text..."
  />
</div>
```

#### Modals and Dialogs
```jsx
<div className="bg-v0-bg-primary border border-v0-border-primary rounded-v0-xl shadow-v0-xl p-v0-8">
  <h2 className="text-v0-text-accent font-v0-serif text-v0-font-size-2xl mb-v0-6">
    Modal Title
  </h2>
  <p className="text-v0-text-secondary font-v0-sans mb-v0-8">
    Modal content
  </p>
</div>
```

## Migration from Legacy Styles

### Updating Existing Components

When updating existing components, replace legacy color references:

```jsx
// OLD: Legacy yarn-* classes
<div className="bg-yarn-bg text-yarn-text border-yarn-border">

// NEW: V0 design system classes
<div className="bg-v0-bg-primary text-v0-text-primary border-v0-border-primary">
```

### Backward Compatibility

The V0 design system maintains backward compatibility with existing yarn-* classes:
- `yarn-gold` → `v0-gold` (same color)
- `yarn-bg` → `v0-bg-primary` (same color)
- `yarn-text` → `v0-text-primary` (same color)

## Validation and Testing

### Design Token Validation

Verify design tokens are working correctly:

```jsx
// Test component to verify tokens
const DesignTokenTest = () => (
  <div className="p-v0-8 space-y-v0-4">
    <div className="bg-v0-gold text-v0-bg-primary p-v0-4 rounded-v0-md">
      Gold Background Test
    </div>
    <div className="text-v0-text-accent font-v0-serif text-v0-font-size-xl">
      Typography Test
    </div>
    <div className="border border-v0-border-accent p-v0-4 rounded-v0-lg shadow-v0-sm">
      Border and Shadow Test
    </div>
  </div>
);
```

### Browser DevTools Verification

Check that CSS custom properties are available:
1. Open browser DevTools
2. Navigate to Elements tab
3. Check `:root` styles
4. Verify `--v0-*` properties are present

## Common Patterns

### Responsive Design with V0 Tokens

```jsx
<div className="p-v0-4 md:p-v0-8 lg:p-v0-12">
  <h1 className="text-v0-font-size-xl md:text-v0-font-size-2xl lg:text-v0-font-size-3xl font-v0-serif text-v0-text-accent">
    Responsive Heading
  </h1>
</div>
```

### Dark Mode Considerations

The V0 design system is built for dark mode by default:
- All background colors are dark variants
- Text colors provide proper contrast
- No additional dark mode configuration needed

### Animation and Transitions

```jsx
<button className="bg-v0-gold text-v0-bg-primary px-v0-6 py-v0-3 rounded-v0-md transition-all duration-200 hover:bg-opacity-90 hover:shadow-v0-md">
  Animated Button
</button>
```

## Troubleshooting

### Common Issues

1. **CSS Custom Properties Not Working**
   - Verify `design-tokens.css` is imported in `styles.css`
   - Check browser DevTools for `:root` properties

2. **Tailwind Classes Not Recognized**
   - Verify `tailwind.config.ts` includes v0 tokens
   - Restart development server after config changes

3. **Colors Not Matching Design**
   - Use exact v0 color values: `#FFD700`, `#FF4136`, `#4EC9B0`
   - Avoid custom color modifications

### Getting Help

- Check existing v0 components in `src/components/v0-components/`
- Reference design system documentation in `docs/design-system/`
- Validate against V0 prototype specifications

## Conclusion

The V0 design system provides a comprehensive foundation for consistent UI development in Project Yarn. By following these guidelines and using the provided tokens, you can ensure visual consistency and maintainability across the application.

For component-specific implementations, refer to the existing V0 components and composition patterns documentation.
