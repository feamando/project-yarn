# V0-Enhanced Component API Documentation

**Last Updated:** 2025-08-02  
**Source:** V0 Prototype Integration (Task 2.4)

## Overview

This document provides comprehensive API documentation for all V0-enhanced components in the Project Yarn design system. These components have been enhanced with V0 prototype styling patterns, including the signature `shadow-xs` enhancement, consistent design tokens, and improved accessibility features.

## V0 Components

### YarnLogo Component

**Location:** `src/components/v0-components/yarn-logo.tsx`

#### Description
The YarnLogo component displays the Project Yarn brand logo with a gold "Y" and red accent dot, using the V0 design system colors and typography.

#### Props
```typescript
interface YarnLogoProps {
  className?: string; // Additional CSS classes
}
```

#### Usage Examples
```tsx
import { YarnLogo } from '@/components/v0-components/yarn-logo';

// Default size (24x24px)
<YarnLogo />

// Custom size
<YarnLogo className="w-8 h-8" />

// In header with text
<div className="flex items-center gap-2">
  <YarnLogo className="w-6 h-6" />
  <span className="font-serif text-lg">Project Yarn</span>
</div>
```

#### Design Tokens Used
- **Color**: `text-brand-gold` (#FFD700), `bg-brand-red` (#FF4136)
- **Typography**: `font-serif`, `text-xl`, `font-normal`, `leading-none`
- **Size**: `w-6 h-6` (default), `w-1.5 h-1.5` (dot)

#### Accessibility
- Uses semantic HTML structure
- Proper color contrast ratios
- Scalable for different viewport sizes

---

### ContextIndicator Component

**Location:** `src/components/v0-components/context-indicator.tsx`

#### Description
The ContextIndicator component displays AI processing states with Brain and Zap icons, using the V0 dark theme design system.

#### Props
```typescript
interface ContextIndicatorProps {
  isProcessing: boolean;     // Whether AI is currently processing
  processedItems: number;    // Number of items processed
  totalItems: number;        // Total number of items to process
  className?: string;        // Additional CSS classes
}
```

#### Usage Examples
```tsx
import { ContextIndicator } from '@/components/v0-components/context-indicator';

// Basic usage
<ContextIndicator 
  isProcessing={true} 
  processedItems={847} 
  totalItems={1203} 
/>

// Not processing state
<ContextIndicator 
  isProcessing={false} 
  processedItems={1203} 
  totalItems={1203} 
/>

// Custom styling
<ContextIndicator 
  isProcessing={true} 
  processedItems={150} 
  totalItems={500}
  className="mb-4" 
/>
```

#### Design Tokens Used
- **Colors**: `bg-dark-bg` (#1E1E1E), `border-dark-border` (#3E3E42)
- **Text**: `text-dark-text` (#D4D4D4), `text-dark-text-muted` (#858585)
- **Icons**: `text-brand-gold` (#FFD700), `text-brand-teal` (#4EC9B0)
- **Typography**: `text-xs`, `font-medium`, `font-normal`
- **Spacing**: `px-3 py-2`, `gap-2`
- **Border Radius**: `rounded-md`

#### Accessibility
- Proper ARIA labels for screen readers
- High contrast colors for visibility
- Semantic progress indication

---

## V0-Enhanced UI Components

### Button Component

**Location:** `src/components/ui/button.tsx`

#### V0 Enhancements
- Added `shadow-xs` to all variants
- Enhanced focus states with ring styling
- Improved accessibility with ARIA support
- Consistent sizing and spacing

#### Props
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  className?: string;
}
```

#### Usage Examples
```tsx
import { Button } from '@/components/ui/button';

// Primary button with V0 shadow
<Button variant="default">Save Changes</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Outline button with V0 styling
<Button variant="outline">Learn More</Button>

// Small button
<Button size="sm">Quick Action</Button>

// Icon button
<Button size="icon" variant="ghost">
  <Settings className="h-4 w-4" />
</Button>
```

#### V0 Design Tokens
- **Shadow**: `shadow-xs` (0 1px 2px 0 rgb(0 0 0 / 0.05))
- **Focus**: `focus-visible:ring-[3px]` with ring colors
- **Heights**: `h-8` (sm), `h-9` (default), `h-10` (lg)

---

### Input Component

**Location:** `src/components/ui/input.tsx`

#### V0 Enhancements
- Added `shadow-xs` for subtle depth
- Enhanced focus states with ring styling
- Improved dark theme support
- Better accessibility features

#### Props
```typescript
interface InputProps extends React.ComponentProps<'input'> {
  className?: string;
  type?: string;
}
```

#### Usage Examples
```tsx
import { Input } from '@/components/ui/input';

// Basic input with V0 styling
<Input placeholder="Enter your name..." />

// Email input
<Input type="email" placeholder="your@email.com" />

// Password input
<Input type="password" placeholder="Password" />

// Disabled input
<Input disabled value="Read only" />

// Custom styling
<Input className="max-w-sm" placeholder="Search..." />
```

#### V0 Design Tokens
- **Shadow**: `shadow-xs`
- **Height**: `h-9`
- **Border**: `border-input` with focus states
- **Background**: `dark:bg-input/30` for dark theme

---

### Textarea Component

**Location:** `src/components/ui/textarea.tsx`

#### V0 Enhancements
- Added `shadow-xs` for consistency
- Enhanced focus states
- Improved field sizing
- Better dark theme support

#### Props
```typescript
interface TextareaProps extends React.ComponentProps<'textarea'> {
  className?: string;
}
```

#### Usage Examples
```tsx
import { Textarea } from '@/components/ui/textarea';

// Basic textarea with V0 styling
<Textarea placeholder="Enter your message..." />

// Larger textarea
<Textarea className="min-h-32" placeholder="Detailed description..." />

// Disabled textarea
<Textarea disabled value="Read only content" />
```

#### V0 Design Tokens
- **Shadow**: `shadow-xs`
- **Min Height**: `min-h-16`
- **Field Sizing**: `field-sizing-content`
- **Border**: `border-input` with enhanced focus states

---

### Select Component

**Location:** `src/components/ui/select.tsx`

#### V0 Enhancements
- Added `shadow-xs` to trigger
- Enhanced focus and hover states
- Improved dark theme support
- Better accessibility features

#### Props
```typescript
interface SelectTriggerProps {
  size?: 'sm' | 'default';
  className?: string;
}
```

#### Usage Examples
```tsx
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Basic select with V0 styling
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>

// Small select
<Select>
  <SelectTrigger size="sm">
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">A</SelectItem>
    <SelectItem value="b">B</SelectItem>
  </SelectContent>
</Select>
```

#### V0 Design Tokens
- **Shadow**: `shadow-xs`
- **Heights**: `h-8` (sm), `h-9` (default)
- **Border**: `border-input` with focus states
- **Background**: `dark:bg-input/30` with hover states

---

### Badge Component

**Location:** `src/components/ui/badge.tsx`

#### V0 Enhancements
- Enhanced variants with better contrast
- Improved focus states for interactive badges
- Better accessibility support
- Consistent sizing and spacing

#### Props
```typescript
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  asChild?: boolean;
  className?: string;
}
```

#### Usage Examples
```tsx
import { Badge } from '@/components/ui/badge';

// Default badge
<Badge>New</Badge>

// Secondary badge
<Badge variant="secondary">Beta</Badge>

// Destructive badge
<Badge variant="destructive">Error</Badge>

// Outline badge
<Badge variant="outline">Draft</Badge>

// Interactive badge (as link)
<Badge asChild>
  <a href="/tags/react">React</a>
</Badge>

// With icon
<Badge className="gap-1">
  <CheckCircle className="h-3 w-3" />
  Verified
</Badge>
```

#### V0 Design Tokens
- **Typography**: `text-xs`, `font-medium`
- **Spacing**: `px-2 py-0.5`, `gap-1`
- **Border Radius**: `rounded-md`
- **Focus**: `focus-visible:ring-[3px]` for interactive badges

---

### Dialog Component

**Location:** `src/components/ui/dialog.tsx`

#### V0 Enhancements
- Enhanced overlay styling
- Better content positioning
- Improved close button styling
- Enhanced accessibility features

#### Props
```typescript
interface DialogContentProps {
  showCloseButton?: boolean;
  className?: string;
}
```

#### Usage Examples
```tsx
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

// Basic dialog with V0 styling
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Dialog without close button
<DialogContent showCloseButton={false}>
  <DialogHeader>
    <DialogTitle>Custom Dialog</DialogTitle>
  </DialogHeader>
  {/* Content */}
</DialogContent>
```

#### V0 Design Tokens
- **Overlay**: `bg-black/50` with fade animations
- **Content**: Enhanced positioning and spacing
- **Close Button**: Improved styling and positioning

---

## Component Composition Patterns

### Header with Logo and Context
```tsx
<div className="flex items-center justify-between p-4">
  <div className="flex items-center gap-3">
    <YarnLogo className="w-6 h-6" />
    <span className="font-serif text-lg text-dark-text">Project Yarn</span>
  </div>
  <ContextIndicator 
    isProcessing={isAIProcessing} 
    processedItems={processed} 
    totalItems={total} 
  />
</div>
```

### Form with V0 Components
```tsx
<form className="space-y-4">
  <div>
    <label className="text-sm font-medium">Project Name</label>
    <Input placeholder="Enter project name..." />
  </div>
  <div>
    <label className="text-sm font-medium">Description</label>
    <Textarea placeholder="Project description..." />
  </div>
  <div>
    <label className="text-sm font-medium">Category</label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select category..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="web">Web Development</SelectItem>
        <SelectItem value="mobile">Mobile App</SelectItem>
        <SelectItem value="desktop">Desktop Application</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div className="flex gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Create Project</Button>
  </div>
</form>
```

### AI Processing Panel
```tsx
<Card className="p-4">
  <div className="flex items-center gap-2 mb-4">
    <YarnLogo className="w-5 h-5" />
    <span className="font-medium">AI Assistant</span>
    <Badge variant="secondary">Active</Badge>
  </div>
  
  <ContextIndicator 
    isProcessing={true} 
    processedItems={847} 
    totalItems={1203} 
  />
  
  <div className="mt-4 space-y-2">
    <Button size="sm" variant="outline" className="w-full">
      Pause Processing
    </Button>
    <Button size="sm" variant="ghost" className="w-full">
      View Details
    </Button>
  </div>
</Card>
```

## Best Practices

### Accessibility
- Always provide proper ARIA labels for interactive elements
- Ensure sufficient color contrast ratios
- Use semantic HTML structure
- Support keyboard navigation

### Performance
- Use `asChild` prop for polymorphic components when needed
- Leverage CSS custom properties for consistent theming
- Minimize re-renders with proper prop usage

### Consistency
- Always use design tokens instead of hardcoded values
- Follow the established V0 color palette
- Maintain consistent spacing and sizing patterns
- Use the signature `shadow-xs` for depth

### Dark Theme Support
- All components support dark theme automatically
- Use semantic color tokens that adapt to theme
- Test components in both light and dark modes

## Integration Status

- [x] YarnLogo component documented with full API
- [x] ContextIndicator component documented with full API
- [x] Button component V0 enhancements documented
- [x] Input component V0 enhancements documented
- [x] Textarea component V0 enhancements documented
- [x] Select component V0 enhancements documented
- [x] Badge component V0 enhancements documented
- [x] Dialog component V0 enhancements documented
- [x] Component composition patterns provided
- [x] Best practices and guidelines included
- [x] Accessibility considerations documented
- [x] Dark theme support documented

## Next Steps

1. Create Storybook stories for all documented components
2. Add visual regression tests for component variants
3. Generate TypeScript definitions for better IDE support
4. Create component usage analytics and monitoring
5. Develop component design guidelines for new additions
