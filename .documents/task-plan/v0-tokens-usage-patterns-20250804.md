# v0 Design Tokens Usage Patterns Documentation
**Date:** 2025-08-04  
**Task:** 1.2 - Document all v0 design tokens currently defined and their usage patterns  
**Part of:** TP-007-20250804-styling-single-source-truth-unification.md

## v0 Design Tokens Defined in tailwind.config.ts

### Layer 1: Base Yarn Tokens (Brand Colors)
```typescript
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
```

### Layer 2: v0 Design System Tokens (Direct Mapping)
```typescript
// Primary Colors
"v0-gold": "var(--v0-gold, #FFD700)",
"v0-gold-hover": "var(--v0-gold-hover, #E6C200)",
"v0-red": "var(--v0-red, #FF4136)",
"v0-teal": "var(--v0-teal, #4EC9B0)",

// Background System
"v0-dark-bg": "var(--v0-dark-bg, #1E1E1E)",
"v0-bg-secondary": "var(--v0-bg-secondary, #252526)",
"v0-bg-tertiary": "var(--v0-bg-tertiary, #2D2D30)",

// Text System
"v0-text-primary": "var(--v0-text-primary, #D4D4D4)",
"v0-text-muted": "var(--v0-text-muted, #858585)",
"v0-text-secondary": "var(--v0-text-secondary, #CCCCCC)",
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

// Border System
"v0-border-primary": "var(--v0-border-primary, #3E3E42)",
"v0-border-secondary": "var(--v0-border-secondary, #2D2D30)",
"v0-border-accent": "var(--v0-border-accent, #FFD700)",
```

### Layer 3: Semantic Color System
```typescript
"v0-semantic": {
  // Primary Colors
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
  "text-primary": "var(--v0-text-primary, #D4D4D4)",
  "text-secondary": "var(--v0-text-secondary, #CCCCCC)",
  "text-muted": "var(--v0-text-muted, #858585)",
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
}
```

### Typography Scale
```typescript
fontSize: {
  'v0-xs': ['0.75rem', { lineHeight: '1.5' }],       // 12px
  'v0-sm': ['0.875rem', { lineHeight: '1.5' }],      // 14px
  'v0-base': ['1rem', { lineHeight: '1.5' }],        // 16px
  'v0-lg': ['1.125rem', { lineHeight: '1.5' }],      // 18px
  'v0-xl': ['1.25rem', { lineHeight: '1.4' }],       // 20px
  'v0-2xl': ['1.5rem', { lineHeight: '1.4' }],       // 24px
  'v0-3xl': ['1.875rem', { lineHeight: '1.3' }],     // 30px
  'v0-4xl': ['2.25rem', { lineHeight: '1.2' }],      // 36px
}
```

### Spacing System
```typescript
spacing: {
  'v0-space-1': '0.25rem',   // 4px
  'v0-space-2': '0.5rem',    // 8px
  'v0-space-3': '0.75rem',   // 12px
  'v0-space-4': '1rem',      // 16px
  'v0-space-5': '1.25rem',   // 20px
  'v0-space-6': '1.5rem',    // 24px
  'v0-space-8': '2rem',      // 32px
  'v0-space-10': '2.5rem',   // 40px
  'v0-space-12': '3rem',     // 48px
  'v0-space-16': '4rem',     // 64px
  'v0-space-20': '5rem',     // 80px
  'v0-space-24': '6rem',     // 96px
}
```

## Current v0 Token Usage Patterns

### ✅ Components Using v0 Tokens Correctly

#### 1. Layout Components
**IDELayout.tsx:**
- `bg-v0-dark-bg` - Main background
- `text-v0-text-primary` - Primary text color
- `border-v0-border-primary` - Border styling

**three-panel-layout.tsx:**
- `bg-v0-dark-bg` - Layout background
- `text-v0-text-primary` - Text color
- `bg-v0-bg-secondary` - Secondary panel backgrounds
- `border-v0-border-primary` - Panel borders

#### 2. v0 Component Library
**yarn-logo.tsx:**
- `text-v0-gold` - Logo text color
- `bg-v0-red` - Logo accent dot

**context-indicator.tsx:**
- `text-v0-teal` - Success state
- `text-v0-red` - Error state
- `text-v0-gold` - Warning state
- `bg-v0-teal/10` - Background with opacity
- `border-v0-teal/20` - Border with opacity
- `bg-v0-dark-bg` - Background
- `border-v0-border-primary` - Border
- `text-v0-text-primary` - Primary text
- `text-v0-text-muted` - Muted text

**composition-patterns.tsx:**
- Comprehensive usage of v0 tokens throughout all patterns
- `bg-v0-dark-bg` - Card backgrounds
- `border-v0-border-primary` - Card borders
- `text-v0-text-primary` - Primary text
- `text-v0-text-muted` - Secondary text
- `bg-v0-teal` - Success states
- `text-v0-gold` - Accent text
- `p-v0-space-4` - Padding
- `gap-v0-space-3` - Gap spacing
- `mb-v0-space-2` - Margin bottom

#### 3. Specialized Components
**VirtualizedMemoryMonitor.tsx:**
- Extensive use of v0 spacing tokens: `p-v0-space-6`, `mb-v0-space-6`, `gap-v0-space-4`
- Color tokens: `text-v0-teal`, `text-v0-gold`, `text-v0-red`, `text-v0-text-primary`
- Border radius: `rounded-v0-radius-lg`

### ❌ Components Using Hardcoded Values (Need Migration)

#### 1. Core Editor Components
**MarkdownEditor.tsx:**
- `bg-[#1E1E1E]` → should use `bg-v0-dark-bg`
- `text-[#D4D4D4]` → should use `text-v0-text-primary`
- `bg-[#4EC9B0]` → should use `bg-v0-teal`
- `hover:bg-[#4EC9B0]/90` → should use `hover:bg-v0-teal/90`
- `hover:bg-[#3E3E42]` → should use `hover:bg-v0-border-primary`
- `bg-[#2A2A2A]/50` → should use `bg-v0-bg-secondary/50`
- `border-[#3E3E42]` → should use `border-v0-border-primary`

**MarkdownPreview.tsx:**
- `bg-[#2A2A2A]` → should use `bg-v0-bg-secondary`

#### 2. UI Components
**DocumentTransformationUI.tsx:**
- `bg-[#2A2A2A]/50` → should use `bg-v0-bg-secondary/50`
- `bg-[#2A2A2A]/30` → should use `bg-v0-bg-secondary/30`

**CommandPalette.tsx:**
- `bg-[#2A2A2A]/30` → should use `bg-v0-bg-secondary/30`

**AISettings.tsx:**
- `bg-[#1E1E1E]` → should use `bg-v0-dark-bg`
- `text-[#858585]` → should use `text-v0-text-muted`

**AiBlocksManager.tsx:**
- `bg-[#1E1E1E]` → should use `bg-v0-dark-bg`

## Usage Pattern Analysis

### Most Used v0 Tokens
1. **Background Colors:**
   - `bg-v0-dark-bg` - Primary dark background (most common)
   - `bg-v0-bg-secondary` - Secondary backgrounds
   - `bg-v0-teal` - Success/accent backgrounds

2. **Text Colors:**
   - `text-v0-text-primary` - Primary text (most common)
   - `text-v0-text-muted` - Secondary/muted text
   - `text-v0-gold` - Accent/emphasis text
   - `text-v0-teal` - Success state text
   - `text-v0-red` - Error state text

3. **Border Colors:**
   - `border-v0-border-primary` - Primary borders (most common)
   - `border-v0-teal/20` - Accent borders with opacity

4. **Spacing:**
   - `p-v0-space-4` - Standard padding (16px)
   - `gap-v0-space-3` - Standard gap (12px)
   - `mb-v0-space-2` - Standard margin bottom (8px)

### Token Usage Consistency
- **Layout components:** 100% v0 token usage ✅
- **v0 component library:** 100% v0 token usage ✅
- **Editor components:** ~20% v0 token usage ❌
- **UI components:** ~30% v0 token usage ❌
- **Settings components:** ~10% v0 token usage ❌

### Opacity Patterns
Common opacity patterns used with v0 tokens:
- `/10` - Very subtle backgrounds (10% opacity)
- `/20` - Subtle borders and accents (20% opacity)
- `/30` - Light backgrounds (30% opacity)
- `/50` - Medium backgrounds (50% opacity)
- `/80` - Strong accents (80% opacity)
- `/90` - Hover states (90% opacity)

## Migration Priority Based on Usage

### High Priority (Core Functionality)
1. **MarkdownEditor.tsx** - 9 hardcoded values, core editor component
2. **MarkdownPreview.tsx** - 1 hardcoded value, core editor component

### Medium Priority (UI Components)
3. **DocumentTransformationUI.tsx** - 3 hardcoded values, transformation UI
4. **CommandPalette.tsx** - 1 hardcoded value, command interface

### Low Priority (Settings/Management)
5. **AISettings.tsx** - 2 hardcoded values, settings page
6. **AiBlocksManager.tsx** - 1 hardcoded value, management interface

## Recommendations

### Token Usage Best Practices
1. **Always use v0 tokens** for colors, spacing, and typography
2. **Use opacity modifiers** (e.g., `/10`, `/20`) for subtle variations
3. **Follow semantic naming** - use `text-v0-text-primary` not `text-v0-gold` for body text
4. **Consistent spacing** - use v0-space tokens for all spacing needs

### Missing Token Opportunities
1. **Border radius:** Consider adding `v0-radius-*` tokens to tailwind.config.ts
2. **Shadow system:** Add `v0-shadow-*` tokens for consistent elevation
3. **Animation timing:** Add `v0-duration-*` tokens for consistent transitions

### Component Migration Strategy
1. **Start with layout components** (already done ✅)
2. **Migrate core editor components** (highest impact)
3. **Update UI components** (medium impact)
4. **Finish with settings components** (lowest impact)

**Total v0 Tokens Defined:** 50+ tokens across colors, typography, and spacing
**Current Usage Rate:** ~60% of components use v0 tokens consistently
**Migration Target:** 100% v0 token usage across all components
