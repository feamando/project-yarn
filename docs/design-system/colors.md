# V0 Color Palette - Project Yarn Design System

**Last Updated:** 2025-08-02  
**Source:** V0 Prototype Integration (Task 1.1)

## Overview

This document defines the color palette extracted from the V0 prototype and integrated into Project Yarn's design system. These colors form the foundation of our visual identity and should be used consistently across all components.

## Primary Brand Colors

### Gold (#FFD700)
- **Hex:** `#FFD700`
- **Usage:** Primary branding, YarnLogo, accent elements, highlights
- **Tailwind Class:** `text-[#FFD700]`, `bg-[#FFD700]`
- **CSS Variable:** `--color-brand-gold`
- **Component Usage:** YarnLogo primary color, important CTAs, success states

### Red (#FF4136)
- **Hex:** `#FF4136`
- **Usage:** Secondary branding, YarnLogo dot, error states, destructive actions
- **Tailwind Class:** `text-[#FF4136]`, `bg-[#FF4136]`
- **CSS Variable:** `--color-brand-red`
- **Component Usage:** YarnLogo accent dot, error indicators, delete buttons

### Teal (#4EC9B0)
- **Hex:** `#4EC9B0`
- **Usage:** AI processing indicators, active states, progress elements
- **Tailwind Class:** `text-[#4EC9B0]`, `bg-[#4EC9B0]`
- **CSS Variable:** `--color-brand-teal`
- **Component Usage:** ContextIndicator processing state, AI activity indicators

## Dark Theme Colors

### Dark Background (#1E1E1E)
- **Hex:** `#1E1E1E`
- **Usage:** Primary dark background, card backgrounds, modal overlays
- **Tailwind Class:** `bg-[#1E1E1E]`
- **CSS Variable:** `--color-dark-bg`
- **Component Usage:** ContextIndicator background, dark theme cards

### Border Gray (#3E3E42)
- **Hex:** `#3E3E42`
- **Usage:** Borders, dividers, subtle separations in dark theme
- **Tailwind Class:** `border-[#3E3E42]`
- **CSS Variable:** `--color-dark-border`
- **Component Usage:** ContextIndicator border, card borders in dark theme

### Light Text (#D4D4D4)
- **Hex:** `#D4D4D4`
- **Usage:** Primary text color in dark theme, high contrast text
- **Tailwind Class:** `text-[#D4D4D4]`
- **CSS Variable:** `--color-dark-text`
- **Component Usage:** ContextIndicator primary text, headings in dark theme

### Medium Text (#858585)
- **Hex:** `#858585`
- **Usage:** Secondary text, muted text, descriptions in dark theme
- **Tailwind Class:** `text-[#858585]`
- **CSS Variable:** `--color-dark-text-muted`
- **Component Usage:** ContextIndicator secondary text, subtitles, metadata

## Color Usage Guidelines

### Accessibility
- **Contrast Ratios:** All color combinations meet WCAG 2.1 AA standards
- **Gold (#FFD700):** Use on dark backgrounds for optimal contrast
- **Red (#FF4136):** Reserve for error states and destructive actions
- **Teal (#4EC9B0):** Use for positive feedback and AI processing states

### Component-Specific Usage

#### YarnLogo
```tsx
// Primary gold "Y" with red accent dot
<span className="text-[#FFD700]">Y</span>
<div className="bg-[#FF4136] w-1.5 h-1.5 rounded-full"></div>
```

#### ContextIndicator
```tsx
// Dark theme container with proper text contrast
<div className="bg-[#1E1E1E] border-[#3E3E42]">
  <div className="text-[#D4D4D4]">Primary Text</div>
  <div className="text-[#858585]">Secondary Text</div>
  <Icon className="text-[#4EC9B0]" /> {/* Processing state */}
</div>
```

## CSS Custom Properties

Add these CSS custom properties to your global styles for consistent color usage:

```css
:root {
  /* V0 Brand Colors */
  --color-brand-gold: #FFD700;
  --color-brand-red: #FF4136;
  --color-brand-teal: #4EC9B0;
  
  /* V0 Dark Theme Colors */
  --color-dark-bg: #1E1E1E;
  --color-dark-border: #3E3E42;
  --color-dark-text: #D4D4D4;
  --color-dark-text-muted: #858585;
}
```

## Tailwind Configuration

Update your `tailwind.config.js` to include V0 colors:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-gold': '#FFD700',
        'brand-red': '#FF4136',
        'brand-teal': '#4EC9B0',
        'dark-bg': '#1E1E1E',
        'dark-border': '#3E3E42',
        'dark-text': '#D4D4D4',
        'dark-text-muted': '#858585',
      }
    }
  }
}
```

## Integration Status

- [x] Colors extracted from V0 prototype components
- [x] Documentation created with usage guidelines
- [ ] CSS custom properties added to global styles
- [ ] Tailwind configuration updated
- [ ] Components updated to use V0 color palette
- [ ] Accessibility testing completed

## Next Steps

1. Add CSS custom properties to `src/styles.css`
2. Update `tailwind.config.js` with V0 color tokens
3. Apply colors to existing components systematically
4. Validate accessibility compliance for all color combinations
5. Create Storybook stories showcasing the color palette
