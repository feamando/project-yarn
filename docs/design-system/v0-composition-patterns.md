# V0 Component Composition Patterns

**Last Updated:** 2025-08-02  
**Source:** V0 Prototype Integration (Task 2.5)

## Overview

This document provides comprehensive guidance on using V0 component composition patterns in Project Yarn. These patterns combine individual V0 components into cohesive, reusable UI patterns that maintain consistency across the application while leveraging the V0 design language.

## Pattern Categories

### 1. Header Patterns

#### V0Header Pattern
**Purpose:** Standardized application header with YarnLogo and optional actions.

**Usage:**
```tsx
import { V0Header } from '@/components/v0-components/composition-patterns';

// Basic header
<V0Header />

// Header with custom title
<V0Header title="Project Dashboard" />

// Header with actions
<V0Header 
  title="Document Editor"
  actions={
    <>
      <Button size="sm" variant="outline">Save</Button>
      <Button size="sm">Publish</Button>
    </>
  }
/>
```

**Design Tokens:**
- Background: `bg-dark-bg`
- Border: `border-dark-border`
- Text: `text-dark-text`
- Logo: YarnLogo component with V0 styling

#### V0ModalHeader Pattern
**Purpose:** Consistent header for dialogs and modals with YarnLogo branding.

**Usage:**
```tsx
import { V0ModalHeader } from '@/components/v0-components/composition-patterns';

<Dialog>
  <DialogContent>
    <V0ModalHeader 
      title="Create New Project"
      description="Set up a new project workspace with AI assistance."
      badge={<Badge variant="secondary">Beta</Badge>}
    />
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

### 2. AI Processing Patterns

#### V0AIProcessingPanel Pattern
**Purpose:** Comprehensive AI processing status panel with controls and ContextIndicator.

**Usage:**
```tsx
import { V0AIProcessingPanel } from '@/components/v0-components/composition-patterns';

<V0AIProcessingPanel
  isProcessing={true}
  processedItems={847}
  totalItems={1203}
  title="Document Analysis"
  status="active"
  onPause={() => handlePause()}
  onStop={() => handleStop()}
  onViewDetails={() => showDetails()}
/>
```

**Features:**
- Integrated ContextIndicator for progress visualization
- Status badges with V0 color system
- Action buttons for process control
- Responsive design with consistent spacing

**Status Variants:**
- `active`: Green badge with teal background
- `paused`: Secondary badge
- `error`: Destructive red badge
- `completed`: Gold outline badge

### 3. Form Patterns

#### V0FormField Pattern
**Purpose:** Standardized form field wrapper with label, error handling, and descriptions.

**Usage:**
```tsx
import { V0FormField } from '@/components/v0-components/composition-patterns';

<V0FormField 
  label="Project Name"
  required
  error={errors.name}
  description="Choose a descriptive name for your project"
>
  <Input 
    placeholder="Enter project name..."
    value={formData.name}
    onChange={handleNameChange}
  />
</V0FormField>
```

**Features:**
- Required field indicator with red asterisk
- Error display with AlertCircle icon
- Description text for user guidance
- Consistent spacing and typography

#### V0ProjectForm Pattern
**Purpose:** Complete project creation form with validation and V0 styling.

**Usage:**
```tsx
import { V0ProjectForm } from '@/components/v0-components/composition-patterns';

<V0ProjectForm
  onSubmit={(data) => createProject(data)}
  onCancel={() => closeModal()}
  isLoading={isCreating}
  initialData={{ category: 'web' }}
/>
```

**Features:**
- Built-in form validation
- Loading states with spinner
- Category and template selection
- Responsive button layout

### 4. Navigation Patterns

#### V0SidebarItem Pattern
**Purpose:** Consistent sidebar navigation items with V0 styling.

**Usage:**
```tsx
import { V0SidebarItem } from '@/components/v0-components/composition-patterns';

<V0SidebarItem
  icon={<FileText className="w-4 h-4" />}
  label="Documents"
  isActive={currentPage === 'documents'}
  badge={<Badge variant="outline">12</Badge>}
  onClick={() => navigateTo('documents')}
/>
```

**Features:**
- Active state with gold accent
- Icon and badge support
- Hover effects with V0 colors
- Consistent spacing and typography

#### V0Breadcrumb Pattern
**Purpose:** Navigation breadcrumb with V0 styling and interaction.

**Usage:**
```tsx
import { V0Breadcrumb } from '@/components/v0-components/composition-patterns';

<V0Breadcrumb
  items={[
    { label: 'Projects', onClick: () => navigate('/projects') },
    { label: 'Web App', onClick: () => navigate('/projects/web-app') },
    { label: 'Components', isActive: true }
  ]}
/>
```

### 5. Status Patterns

#### V0StatusCard Pattern
**Purpose:** Status information display with V0 design system integration.

**Usage:**
```tsx
import { V0StatusCard } from '@/components/v0-components/composition-patterns';

<V0StatusCard
  title="Documents Processed"
  value="1,247"
  description="This month"
  icon={<FileText className="w-5 h-5" />}
  variant="success"
  trend="up"
  trendValue="+12% from last month"
/>
```

**Variants:**
- `default`: Standard dark theme styling
- `success`: Teal accent for positive metrics
- `warning`: Gold accent for attention items
- `error`: Red accent for error states

## Implementation Examples

### Complete AI Dashboard Layout
```tsx
import { 
  V0Header, 
  V0AIProcessingPanel, 
  V0StatusCard,
  V0SidebarItem 
} from '@/components/v0-components/composition-patterns';

function AIDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <V0Header 
        title="AI Dashboard"
        actions={
          <Button size="sm" variant="outline">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        }
      />
      
      <div className="flex">
        <aside className="w-64 p-4 space-y-2">
          <V0SidebarItem
            icon={<Bot className="w-4 h-4" />}
            label="AI Processing"
            isActive={true}
          />
          <V0SidebarItem
            icon={<FileText className="w-4 h-4" />}
            label="Documents"
            badge={<Badge variant="outline">247</Badge>}
          />
        </aside>
        
        <main className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <V0StatusCard
              title="Active Processes"
              value="3"
              variant="success"
              icon={<Zap className="w-5 h-5" />}
            />
            <V0StatusCard
              title="Documents Analyzed"
              value="1,247"
              description="This month"
              variant="default"
            />
            <V0StatusCard
              title="Processing Time"
              value="2.3s"
              description="Average"
              variant="warning"
            />
          </div>
          
          <V0AIProcessingPanel
            isProcessing={true}
            processedItems={847}
            totalItems={1203}
            status="active"
            onPause={() => {}}
            onStop={() => {}}
          />
        </main>
      </div>
    </div>
  );
}
```

### Project Creation Modal
```tsx
import { 
  V0ModalHeader, 
  V0ProjectForm 
} from '@/components/v0-components/composition-patterns';

function ProjectCreationModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <V0ModalHeader
          title="Create New Project"
          description="Set up a new project workspace with AI assistance."
        />
        
        <V0ProjectForm
          onSubmit={(data) => {
            createProject(data);
            onClose();
          }}
          onCancel={onClose}
          isLoading={isCreating}
        />
      </DialogContent>
    </Dialog>
  );
}
```

## Design Principles

### Consistency
- All patterns use the V0 color palette consistently
- Typography follows the V0 design system
- Spacing uses standardized design tokens
- Components maintain visual hierarchy

### Accessibility
- Proper ARIA labels and roles
- Keyboard navigation support
- High contrast color combinations
- Screen reader compatibility

### Responsiveness
- Patterns adapt to different screen sizes
- Flexible layouts with proper breakpoints
- Touch-friendly interactive elements
- Optimized for mobile and desktop

### Performance
- Minimal re-renders with proper prop usage
- Efficient component composition
- Lazy loading where appropriate
- Optimized bundle size

## Best Practices

### Pattern Usage
1. **Choose the right pattern** for your use case
2. **Customize props** rather than overriding styles
3. **Combine patterns** thoughtfully for complex layouts
4. **Test accessibility** with screen readers and keyboard navigation

### Customization
1. **Use className prop** for additional styling
2. **Leverage design tokens** instead of hardcoded values
3. **Maintain V0 color palette** consistency
4. **Follow established spacing patterns**

### Performance
1. **Memoize expensive computations** in pattern components
2. **Use React.memo** for patterns with frequent re-renders
3. **Optimize icon imports** to reduce bundle size
4. **Implement proper loading states**

## Integration Checklist

- [x] V0Header pattern implemented and documented
- [x] V0ModalHeader pattern implemented and documented
- [x] V0AIProcessingPanel pattern implemented and documented
- [x] V0FormField pattern implemented and documented
- [x] V0ProjectForm pattern implemented and documented
- [x] V0SidebarItem pattern implemented and documented
- [x] V0Breadcrumb pattern implemented and documented
- [x] V0StatusCard pattern implemented and documented
- [x] Complete implementation examples provided
- [x] Design principles and best practices documented
- [x] TypeScript interfaces exported for all patterns
- [x] Accessibility considerations included
- [x] Performance optimization guidelines provided

## Next Steps

1. **Create Storybook stories** for all composition patterns
2. **Add unit tests** for pattern components
3. **Implement visual regression tests** for pattern consistency
4. **Create pattern usage analytics** to track adoption
5. **Develop pattern generator tools** for rapid development
6. **Add pattern validation** to ensure V0 compliance
7. **Create pattern migration guides** for existing components
8. **Establish pattern review process** for new additions

## Pattern Evolution

As the Project Yarn application grows, these patterns will evolve to meet new requirements while maintaining V0 design consistency. Regular reviews and updates ensure patterns remain relevant and performant.

### Version History
- **v1.0** (2025-08-02): Initial V0 composition patterns implementation
- **Future**: Enhanced patterns with additional variants and features
