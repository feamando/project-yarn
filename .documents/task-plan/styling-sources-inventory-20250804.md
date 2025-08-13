# Styling Sources Comprehensive Inventory
**Date:** 2025-08-04  
**Task:** 1.1 - Create comprehensive inventory of all styling sources  
**Part of:** TP-007-20250804-styling-single-source-truth-unification.md

## Primary Styling Sources

### 1. tailwind.config.ts (PRIMARY SOURCE)
**Location:** `./tailwind.config.ts`  
**Status:** ✅ Most comprehensive, should be single source of truth  
**Content:**
- Hybrid Token Mapping System with 3 layers
- Layer 1: Base Yarn Tokens (Brand Colors)
- Layer 2: v0 Design System Tokens (Direct Mapping with CSS variables)
- Layer 3: Semantic Color System with Contrast Ratios
- Complete typography scale (v0-xs to v0-4xl)
- Font families (Inter, Crimson, Google Sans Code)
- Spacing system, shadows, animations
- **Total v0 tokens:** 50+ comprehensive design tokens

### 2. src/styles/v0-tokens.css (DUPLICATE SOURCE)
**Location:** `./src/styles/v0-tokens.css`  
**Status:** ❌ Duplicates tailwind.config.ts tokens  
**Content:**
- CSS variables for v0 design system
- Primary color tokens (gold, red, teal)
- Background system (dark-bg, bg-secondary, bg-tertiary)
- Text system with contrast ratios
- Enhanced text hierarchy
- Border system and semantic state colors
- Light theme overrides
- **Duplication:** ~40 tokens overlap with tailwind.config.ts

### 3. src/styles/design-tokens.css (DUPLICATE SOURCE)
**Location:** `./src/styles/design-tokens.css`  
**Status:** ❌ Duplicates v0 tokens and tailwind config  
**Content:**
- V0 color palette definitions
- Typography system (font families, weights, sizes)
- Spacing system (base spacing units)
- Utility classes for typography
- **Duplication:** ~30 tokens overlap with other sources

### 4. src/styles.css (MIXED - KEEP SHADCN/UI PARTS)
**Location:** `./src/styles.css`  
**Status:** ⚠️ Contains both duplicates and necessary shadcn/ui tokens  
**Content:**
- Imports design-tokens.css (should be removed)
- Tailwind base, components, utilities
- shadcn/ui CSS variables (KEEP - necessary for components)
- V0 brand colors (DUPLICATE - remove)
- Dark theme definitions (DUPLICATE - remove)

### 5. src/App.css (LEGACY)
**Location:** `./src/App.css`  
**Status:** ⚠️ Legacy styles, needs review  
**Content:** Basic app-level styles

### 6. src/styles/accessibility.css (KEEP)
**Location:** `./src/styles/accessibility.css`  
**Status:** ✅ Specialized accessibility styles - keep separate  
**Content:**
- Focus indicators
- High contrast mode support
- Keyboard navigation styles
- Skip links
- Screen reader utilities

## Component Hardcoded Values Inventory

### Components Using Hardcoded Hex Values (NEEDS MIGRATION)

#### Core Editor Components
1. **MarkdownEditor.tsx**
   - `bg-[#1E1E1E]` → should use `bg-v0-dark-bg`
   - `text-[#D4D4D4]` → should use `text-v0-text-primary`
   - `bg-[#4EC9B0]` → should use `bg-v0-teal`
   - `hover:bg-[#4EC9B0]/90` → should use `hover:bg-v0-teal/90`
   - `hover:bg-[#3E3E42]` → should use `hover:bg-v0-border-primary`
   - `hover:text-[#D4D4D4]` → should use `hover:text-v0-text-primary`
   - `bg-[#2A2A2A]/50` → should use `bg-v0-bg-secondary/50`
   - `border-[#3E3E42]` → should use `border-v0-border-primary`
   - `bg-[#2A2A2A]/10` → should use `bg-v0-bg-secondary/10`

2. **MarkdownPreview.tsx**
   - `bg-[#2A2A2A]` → should use `bg-v0-bg-secondary`

#### UI Components
3. **DocumentTransformationUI.tsx**
   - `bg-[#2A2A2A]/50` → should use `bg-v0-bg-secondary/50`
   - `bg-[#2A2A2A]/30` → should use `bg-v0-bg-secondary/30`

4. **CommandPalette.tsx**
   - `bg-[#2A2A2A]/30` → should use `bg-v0-bg-secondary/30`

5. **AISettings.tsx**
   - `bg-[#1E1E1E]` → should use `bg-v0-dark-bg`
   - `text-[#858585]` → should use `text-v0-text-muted`

6. **AiBlocksManager.tsx**
   - `bg-[#1E1E1E]` → should use `bg-v0-dark-bg`

### Components Using v0 Tokens Correctly (REFERENCE EXAMPLES)

#### Layout Components ✅
1. **IDELayout.tsx**
   - Uses: `bg-v0-dark-bg`, `text-v0-text-primary`, `border-v0-border-primary`
   - Pattern: Consistent v0 token usage throughout

2. **three-panel-layout.tsx**
   - Uses: `bg-v0-dark-bg`, `text-v0-text-primary`, `bg-v0-bg-secondary`
   - Pattern: Proper v0 token integration

#### v0 Components ✅
3. **composition-patterns.tsx**
   - Uses v0 tokens consistently throughout all patterns
   - Reference implementation for proper token usage

## Token Mapping Reference

### Color Mappings
```
Hardcoded → v0 Token Class → CSS Variable
#1E1E1E → bg-v0-dark-bg → var(--v0-dark-bg, #1E1E1E)
#D4D4D4 → text-v0-text-primary → var(--v0-text-primary, #D4D4D4)
#858585 → text-v0-text-muted → var(--v0-text-muted, #858585)
#3E3E42 → border-v0-border-primary → var(--v0-border-primary, #3E3E42)
#4EC9B0 → bg-v0-teal → var(--v0-teal, #4EC9B0)
#2A2A2A → bg-v0-bg-secondary → var(--v0-bg-secondary, #252526)
#FFD700 → bg-v0-gold → var(--v0-gold, #FFD700)
```

## Summary and Recommendations

### Issues Identified
1. **Triple Duplication:** Same tokens defined in tailwind.config.ts, v0-tokens.css, and design-tokens.css
2. **Inconsistent Usage:** 13+ components use hardcoded values instead of tokens
3. **Maintenance Overhead:** Changes require updates in multiple files
4. **Bundle Size:** Duplicate CSS increases build size

### Recommended Actions
1. **Keep:** tailwind.config.ts as single source of truth
2. **Remove:** v0-tokens.css and design-tokens.css (duplicates)
3. **Clean:** styles.css to keep only shadcn/ui tokens
4. **Migrate:** All hardcoded values to v0 tokens
5. **Preserve:** accessibility.css (specialized styles)

### Migration Priority
1. **High:** Core editor components (MarkdownEditor, MarkdownPreview)
2. **Medium:** UI components (DocumentTransformationUI, CommandPalette)
3. **Low:** Settings and management components (AISettings, AiBlocksManager)

**Total Components to Migrate:** 6 components with 15+ hardcoded value instances
