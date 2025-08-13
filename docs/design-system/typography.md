# V0 Typography System - Project Yarn Design System

**Last Updated:** 2025-08-02  
**Source:** V0 Prototype Integration (Task 1.2)

## Overview

This document defines the typography system extracted from the V0 prototype and integrated into Project Yarn's design system. The typography system establishes consistent text styling, hierarchy, and branding elements across the application.

## Brand Typography

### YarnLogo Font
- **Font Family:** `font-serif` (serif typeface)
- **Font Weight:** `font-normal` (400)
- **Font Size:** `text-xl` (1.25rem / 20px)
- **Line Height:** `leading-none` (1)
- **Usage:** Exclusively for YarnLogo branding element
- **Implementation:**
  ```tsx
  <span className="font-serif text-brand-gold font-normal text-xl leading-none">Y</span>
  ```

### Serif Typography Guidelines
- **Primary Use:** Branding and logo elements
- **Characteristics:** Classic, professional, distinctive
- **Accessibility:** High contrast with background colors
- **Pairing:** Works well with sans-serif body text for contrast

## Component-Specific Typography

### ContextIndicator Typography
Based on the V0 prototype ContextIndicator component:

#### Primary Text (Labels)
- **Font Size:** `text-xs` (0.75rem / 12px)
- **Font Weight:** `font-medium` (500)
- **Color:** `text-dark-text` (#D4D4D4)
- **Usage:** Main labels, titles, primary information
- **Implementation:**
  ```tsx
  <div className="text-xs font-medium text-dark-text">Context Analysis</div>
  ```

#### Secondary Text (Details)
- **Font Size:** `text-xs` (0.75rem / 12px)
- **Font Weight:** `font-normal` (400)
- **Color:** `text-dark-text-muted` (#858585)
- **Usage:** Descriptions, metadata, secondary information
- **Implementation:**
  ```tsx
  <div className="text-xs text-dark-text-muted">847 / 1,203 items (70%)</div>
  ```

## Enhanced Button Typography (V0 Styling)

The V0 prototype includes enhanced button styling with improved typography:

### Button Text Styling
- **Font Weight:** `font-medium` (500)
- **Font Size:** Varies by button size (sm: text-sm, default: text-sm, lg: text-base)
- **Letter Spacing:** Default Tailwind spacing
- **Text Transform:** None (preserve original case)

### Button Size Typography Mapping
```tsx
// Small buttons
className="h-8 text-sm font-medium"

// Default buttons  
className="h-9 text-sm font-medium"

// Large buttons
className="h-10 text-base font-medium"
```

## Typography Hierarchy

### Heading Levels (Recommended)
Following modern design principles and V0 aesthetic:

```css
/* H1 - Page Titles */
.heading-1 {
  font-size: 2.25rem; /* 36px */
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

/* H2 - Section Titles */
.heading-2 {
  font-size: 1.875rem; /* 30px */
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.025em;
}

/* H3 - Subsection Titles */
.heading-3 {
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  line-height: 1.4;
}

/* H4 - Component Titles */
.heading-4 {
  font-size: 1.25rem; /* 20px */
  font-weight: 500;
  line-height: 1.4;
}
```

## Font Loading and Performance

### System Font Stack
Project Yarn uses system fonts for optimal performance:

```css
font-family: 
  system-ui, 
  -apple-system, 
  BlinkMacSystemFont, 
  "Segoe UI", 
  Roboto, 
  "Helvetica Neue", 
  Arial, 
  "Noto Sans", 
  sans-serif;
```

### Serif Font Stack (for YarnLogo)
```css
font-family: 
  ui-serif, 
  Georgia, 
  Cambria, 
  "Times New Roman", 
  Times, 
  serif;
```

## Tailwind Typography Configuration

Add these typography utilities to your Tailwind configuration:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        'sans': ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'serif': ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      }
    }
  }
}
```

## Usage Guidelines

### YarnLogo Implementation
```tsx
export function YarnLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="font-serif text-brand-gold font-normal text-xl leading-none">Y</span>
      <div className="w-1.5 h-1.5 bg-brand-red rounded-full ml-0.5 mt-1"></div>
    </div>
  )
}
```

### ContextIndicator Implementation
```tsx
<div className="flex flex-col">
  <div className="text-xs font-medium text-dark-text">Context Analysis</div>
  <div className="text-xs text-dark-text-muted">
    {processedItems.toLocaleString()} / {totalItems.toLocaleString()} items ({progress}%)
  </div>
</div>
```

## Accessibility Considerations

### Font Size Minimums
- **Minimum readable size:** 12px (text-xs) for secondary information
- **Recommended minimum:** 14px (text-sm) for body text
- **Logo text:** 20px (text-xl) for brand visibility

### Contrast Requirements
- **Dark text on light backgrounds:** Minimum 4.5:1 contrast ratio
- **Light text on dark backgrounds:** Verified with V0 color palette
- **Brand gold (#FFD700):** High contrast on dark backgrounds

### Responsive Typography
```css
/* Mobile-first responsive typography */
.responsive-heading {
  font-size: 1.5rem; /* 24px */
}

@media (min-width: 768px) {
  .responsive-heading {
    font-size: 2rem; /* 32px */
  }
}

@media (min-width: 1024px) {
  .responsive-heading {
    font-size: 2.25rem; /* 36px */
  }
}
```

## Integration Status

- [x] Typography system extracted from V0 prototype
- [x] YarnLogo font specifications documented (font-serif, text-xl, font-normal)
- [x] ContextIndicator typography documented (text-xs, font-medium/normal)
- [x] Button typography enhancements documented
- [ ] Typography utilities added to Tailwind configuration
- [ ] Typography classes applied to existing components
- [ ] Responsive typography implemented
- [ ] Accessibility testing completed

## Next Steps

1. Update Tailwind configuration with typography utilities
2. Apply V0 typography to existing components systematically
3. Implement responsive typography scaling
4. Validate accessibility compliance for all text sizes
5. Create Storybook stories showcasing typography system
6. Test font loading performance and fallbacks
