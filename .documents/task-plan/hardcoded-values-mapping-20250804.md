# Hardcoded Values Comprehensive Mapping
**Date:** 2025-08-04  
**Task:** 1.3 & 1.4 - Identify all components using hardcoded hex values and map to v0 token equivalents  
**Part of:** TP-007-20250804-styling-single-source-truth-unification.md

## Complete Hardcoded Values Inventory

### Components with Hardcoded Hex Values (EXPANDED ANALYSIS)

#### 1. MarkdownEditor.tsx (HIGHEST PRIORITY - 11 instances)
**File:** `src/components/editor/MarkdownEditor.tsx`  
**Status:** ❌ Core editor component with extensive hardcoded values

**Hardcoded Values Found:**
```typescript
Line 340: 'bg-[#4EC9B0] hover:bg-[#4EC9B0]/90 text-black'
Line 341: 'hover:bg-[#3E3E42]'
Line 357: 'border-r border-[#3E3E42]'
Line 373: 'bg-[#1E1E1E] text-[#D4D4D4]'
Line 388: 'border border-[#3E3E42]'
Line 396: 'hover:text-[#D4D4D4]'
Line 402: 'bg-[#2A2A2A]/50'
Line 434: 'bg-[#1E1E1E]'
Line 444: 'border-t border-[#3E3E42] bg-[#2A2A2A]/10'
```

**Token Mappings:**
```
#4EC9B0 → bg-v0-teal / hover:bg-v0-teal/90
#3E3E42 → border-v0-border-primary / hover:bg-v0-border-primary
#1E1E1E → bg-v0-dark-bg
#D4D4D4 → text-v0-text-primary / hover:text-v0-text-primary
#2A2A2A → bg-v0-bg-secondary
```

#### 2. MarkdownPreview.tsx (HIGH PRIORITY - 1 instance)
**File:** `src/components/editor/MarkdownPreview.tsx`  
**Status:** ❌ Core editor component

**Hardcoded Values Found:**
```typescript
Line 96: 'bg-[#2A2A2A]'
```

**Token Mappings:**
```
#2A2A2A → bg-v0-bg-secondary
```

#### 3. DocumentTransformationUI.tsx (MEDIUM PRIORITY - 3 instances)
**File:** `src/components/DocumentTransformationUI.tsx`  
**Status:** ❌ UI transformation component

**Hardcoded Values Found:**
```typescript
Line 252: 'bg-[#2A2A2A]/50'
Line 333: 'bg-[#2A2A2A]/30'
Line 350: 'bg-[#2A2A2A]/30'
```

**Token Mappings:**
```
#2A2A2A/50 → bg-v0-bg-secondary/50
#2A2A2A/30 → bg-v0-bg-secondary/30
```

#### 4. CommandPalette.tsx (MEDIUM PRIORITY - 1 instance)
**File:** `src/components/CommandPalette.tsx`  
**Status:** ❌ Command interface component

**Hardcoded Values Found:**
```typescript
Line 322: 'bg-[#2A2A2A]/30'
```

**Token Mappings:**
```
#2A2A2A/30 → bg-v0-bg-secondary/30
```

#### 5. AISettings.tsx (LOW PRIORITY - 3 instances)
**File:** `src/components/AISettings.tsx`  
**Status:** ❌ Settings page component

**Hardcoded Values Found:**
```typescript
Line 250: 'bg-[#1E1E1E]'
Line 256: 'text-[#858585]'
Line 281: 'border-[#3E3E42]'
```

**Token Mappings:**
```
#1E1E1E → bg-v0-dark-bg
#858585 → text-v0-text-muted
#3E3E42 → border-v0-border-primary
```

#### 6. AiBlocksManager.tsx (LOW PRIORITY - 1 instance)
**File:** `src/components/ai-blocks/AiBlocksManager.tsx`  
**Status:** ❌ AI blocks management component

**Hardcoded Values Found:**
```typescript
Line 186: 'bg-[#1E1E1E]'
```

**Token Mappings:**
```
#1E1E1E → bg-v0-dark-bg
```

## Complete Token Mapping Reference

### Primary Color Mappings
| Hardcoded Value | v0 Token Class | CSS Variable | Usage Context |
|----------------|----------------|--------------|---------------|
| `#1E1E1E` | `bg-v0-dark-bg` | `var(--v0-dark-bg, #1E1E1E)` | Primary dark background |
| `#D4D4D4` | `text-v0-text-primary` | `var(--v0-text-primary, #D4D4D4)` | Primary text color |
| `#858585` | `text-v0-text-muted` | `var(--v0-text-muted, #858585)` | Muted/secondary text |
| `#3E3E42` | `border-v0-border-primary` | `var(--v0-border-primary, #3E3E42)` | Primary borders |
| `#4EC9B0` | `bg-v0-teal` | `var(--v0-teal, #4EC9B0)` | Teal accent color |
| `#2A2A2A` | `bg-v0-bg-secondary` | `var(--v0-bg-secondary, #252526)` | Secondary backgrounds |

### Opacity Variant Mappings
| Hardcoded Value | v0 Token Class | Usage Context |
|----------------|----------------|---------------|
| `#4EC9B0/90` | `bg-v0-teal/90` | Hover states |
| `#2A2A2A/50` | `bg-v0-bg-secondary/50` | Semi-transparent overlays |
| `#2A2A2A/30` | `bg-v0-bg-secondary/30` | Light overlays |
| `#2A2A2A/10` | `bg-v0-bg-secondary/10` | Very subtle backgrounds |

### Hover State Mappings
| Hardcoded Value | v0 Token Class | Usage Context |
|----------------|----------------|---------------|
| `hover:bg-[#4EC9B0]/90` | `hover:bg-v0-teal/90` | Button hover states |
| `hover:bg-[#3E3E42]` | `hover:bg-v0-border-primary` | Subtle hover backgrounds |
| `hover:text-[#D4D4D4]` | `hover:text-v0-text-primary` | Text hover states |

## Migration Impact Analysis

### By Component Priority

#### High Impact (Core Functionality)
1. **MarkdownEditor.tsx** - 11 instances
   - Impact: Core editor functionality
   - Risk: High - affects primary user workflow
   - Testing: Requires comprehensive editor testing

2. **MarkdownPreview.tsx** - 1 instance
   - Impact: Core preview functionality
   - Risk: Medium - affects content preview
   - Testing: Preview rendering validation

#### Medium Impact (UI Components)
3. **DocumentTransformationUI.tsx** - 3 instances
   - Impact: Document transformation interface
   - Risk: Medium - affects transformation workflow
   - Testing: Transformation UI validation

4. **CommandPalette.tsx** - 1 instance
   - Impact: Command interface
   - Risk: Low - cosmetic changes only
   - Testing: Command palette visual validation

#### Low Impact (Settings/Management)
5. **AISettings.tsx** - 3 instances
   - Impact: Settings interface
   - Risk: Low - settings page only
   - Testing: Settings page validation

6. **AiBlocksManager.tsx** - 1 instance
   - Impact: AI blocks management
   - Risk: Low - management interface only
   - Testing: AI blocks UI validation

### By Color Value Frequency

#### Most Common Hardcoded Values
1. **#2A2A2A** (6 instances) - Secondary background
   - Components: MarkdownEditor, MarkdownPreview, DocumentTransformationUI, CommandPalette
   - Migration: `bg-v0-bg-secondary` with various opacity levels

2. **#3E3E42** (4 instances) - Primary border
   - Components: MarkdownEditor, AISettings
   - Migration: `border-v0-border-primary`

3. **#1E1E1E** (3 instances) - Primary background
   - Components: MarkdownEditor, AISettings, AiBlocksManager
   - Migration: `bg-v0-dark-bg`

4. **#D4D4D4** (2 instances) - Primary text
   - Components: MarkdownEditor
   - Migration: `text-v0-text-primary`

5. **#4EC9B0** (2 instances) - Teal accent
   - Components: MarkdownEditor
   - Migration: `bg-v0-teal`

6. **#858585** (1 instance) - Muted text
   - Components: AISettings
   - Migration: `text-v0-text-muted`

## Duplicate Token Sources Analysis

### CSS Files with Hardcoded Values (TO BE CLEANED)

#### 1. src/styles.css (8 duplicate hex values)
```css
--color-brand-gold: #FFD700;
--color-brand-red: #FF4136;
--color-brand-teal: #4EC9B0;
--color-dark-bg: #1E1E1E;
--color-dark-border: #3E3E42;
--color-dark-text: #D4D4D4;
--color-dark-text-muted: #858585;
```
**Action:** Remove these duplicates, keep only shadcn/ui variables

#### 2. src/styles/v0-tokens.css (40+ duplicate hex values)
**Action:** Remove entire file - duplicates tailwind.config.ts

#### 3. src/styles/design-tokens.css (30+ duplicate hex values)
**Action:** Remove entire file - duplicates tailwind.config.ts

## Migration Strategy by Phase

### Phase 1: Core Editor Components (High Priority)
- **MarkdownEditor.tsx** - 11 instances → v0 tokens
- **MarkdownPreview.tsx** - 1 instance → v0 tokens
- **Testing:** Comprehensive editor functionality validation

### Phase 2: UI Components (Medium Priority)
- **DocumentTransformationUI.tsx** - 3 instances → v0 tokens
- **CommandPalette.tsx** - 1 instance → v0 tokens
- **Testing:** UI component visual validation

### Phase 3: Settings Components (Low Priority)
- **AISettings.tsx** - 3 instances → v0 tokens
- **AiBlocksManager.tsx** - 1 instance → v0 tokens
- **Testing:** Settings interface validation

### Phase 4: CSS File Cleanup
- Remove `src/styles/v0-tokens.css`
- Remove `src/styles/design-tokens.css`
- Clean `src/styles.css` (keep only shadcn/ui variables)
- **Testing:** Build process and visual consistency validation

## Summary Statistics

### Total Hardcoded Values Found
- **Component files:** 20 instances across 6 files
- **CSS files:** 80+ duplicate instances across 3 files
- **Total unique colors:** 6 distinct hex values

### Migration Scope
- **Files to modify:** 6 component files + 3 CSS files
- **Lines to change:** ~20 component lines + CSS file cleanup
- **Testing required:** 6 component test suites + build validation

### Expected Benefits
- **Consistency:** 100% v0 token usage across all components
- **Maintainability:** Single source of truth in tailwind.config.ts
- **Bundle size:** Reduced CSS through duplicate elimination
- **Developer experience:** Clear token system with IDE autocomplete

**Migration Priority Order:**
1. MarkdownEditor.tsx (11 instances) - CRITICAL
2. MarkdownPreview.tsx (1 instance) - HIGH
3. DocumentTransformationUI.tsx (3 instances) - MEDIUM
4. CommandPalette.tsx (1 instance) - MEDIUM
5. AISettings.tsx (3 instances) - LOW
6. AiBlocksManager.tsx (1 instance) - LOW
7. CSS file cleanup - FINAL
