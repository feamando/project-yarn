# Project Yarn Accessibility Remediation Guide
## Task 3.3.3: Implementation Guide for Accessibility Fixes

This guide provides step-by-step instructions for implementing the accessibility improvements identified in the comprehensive audit.

---

## Critical Fixes Implementation

### 1. Modal Focus Trap Implementation

#### Install Focus Trap Library
```bash
npm install focus-trap focus-trap-react
```

#### Update Modal Components
```typescript
// components/ui/dialog.tsx - Enhanced Dialog with Focus Trap
import { useEffect, useRef } from 'react'
import { createFocusTrap } from 'focus-trap'

export const Dialog: React.FC<DialogProps> = ({ 
  isOpen, 
  onClose, 
  children,
  initialFocusRef 
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const focusTrapRef = useRef<any>(null)

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Create focus trap
      focusTrapRef.current = createFocusTrap(modalRef.current, {
        initialFocus: initialFocusRef?.current || '[data-autofocus]',
        returnFocusOnDeactivate: true,
        escapeDeactivates: true,
        clickOutsideDeactivates: true,
        onDeactivate: onClose
      })
      
      focusTrapRef.current.activate()
      
      return () => {
        if (focusTrapRef.current) {
          focusTrapRef.current.deactivate()
        }
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div 
        ref={modalRef}
        className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        {children}
      </div>
    </div>
  )
}
```

### 2. Live Regions for AI Streaming

#### Update StreamingChatUI Component
```typescript
// components/StreamingChatUI.tsx - Add Live Regions
export const StreamingChatUI: React.FC = () => {
  const [streamingStatus, setStreamingStatus] = useState('')
  const [messageCount, setMessageCount] = useState(0)

  return (
    <div className="flex flex-col h-full">
      {/* Screen Reader Live Regions */}
      <div className="sr-only">
        <div 
          role="status" 
          aria-live="polite" 
          aria-label="AI response status"
        >
          {streamingStatus}
        </div>
        <div 
          role="status" 
          aria-live="polite" 
          aria-label="Message count"
        >
          {messageCount > 0 && `${messageCount} messages in conversation`}
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        role="log" 
        aria-live="polite" 
        aria-label="Chat messages"
        className="flex-1 overflow-auto p-4"
      >
        {/* Messages rendered here */}
      </div>
    </div>
  )
}
```

### 3. View Mode Toggle States

#### Update MarkdownEditor Component
```typescript
// components/editor/MarkdownEditor.tsx - Enhanced View Mode Toggles
const ViewModeToggle: React.FC = () => {
  return (
    <div 
      role="group" 
      aria-label="View mode selection"
      className="flex items-center border border-border rounded-md"
    >
      <Button 
        variant={viewMode === 'edit' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('edit')}
        aria-pressed={viewMode === 'edit'}
        aria-describedby="edit-mode-desc"
        className="rounded-r-none border-r border-border h-8 px-3"
      >
        <Edit3 className="h-3 w-3 mr-1" />
        Edit
      </Button>
      <Button 
        variant={viewMode === 'preview' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('preview')}
        aria-pressed={viewMode === 'preview'}
        aria-describedby="preview-mode-desc"
        className="rounded-none border-r border-border h-8 px-3"
      >
        <Eye className="h-3 w-3 mr-1" />
        Preview
      </Button>
      <Button 
        variant={viewMode === 'split' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('split')}
        aria-pressed={viewMode === 'split'}
        aria-describedby="split-mode-desc"
        className="rounded-l-none h-8 px-3"
      >
        <SplitSquareHorizontal className="h-3 w-3 mr-1" />
        Split
      </Button>
    </div>
  )
}
```

### 4. Error Message Association

#### Create Enhanced Form Components
```typescript
// components/ui/form-field.tsx - Accessible Form Field
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  description?: string
  children: React.ReactElement
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  description,
  children
}) => {
  const id = useId()
  const errorId = `${id}-error`
  const descId = `${id}-description`

  const enhancedChild = React.cloneElement(children, {
    id,
    'aria-invalid': !!error,
    'aria-describedby': [
      error ? errorId : null,
      description ? descId : null
    ].filter(Boolean).join(' ') || undefined,
    required
  })

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span aria-label="required"> *</span>}
      </Label>
      
      {description && (
        <div id={descId} className="text-sm text-muted-foreground">
          {description}
        </div>
      )}
      
      {enhancedChild}
      
      {error && (
        <div id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
```

---

## High Priority Fixes Implementation

### 5. Mermaid Diagram Accessibility

#### Update MermaidDiagram Component
```typescript
// components/editor/MermaidDiagram.tsx - Add Alt Text
export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  definition,
  className
}) => {
  const diagramDescription = useMemo(() => {
    return generateDiagramDescription(definition)
  }, [definition])

  return (
    <div className={`mermaid-container ${className}`}>
      <iframe
        ref={iframeRef}
        title={`Mermaid diagram: ${diagramType}`}
        aria-label={diagramDescription}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0"
        onLoad={handleIframeLoad}
      />
      
      {/* Fallback text description for screen readers */}
      <div className="sr-only">
        <h4>Diagram Description:</h4>
        <p>{diagramDescription}</p>
      </div>
    </div>
  )
}

// Utility function to generate diagram descriptions
function generateDiagramDescription(definition: string): string {
  const lines = definition.split('\n').filter(line => line.trim())
  const diagramType = lines[0]?.trim() || 'diagram'
  
  // Basic description generation based on diagram type
  if (diagramType.includes('flowchart')) {
    return `Flowchart diagram with ${lines.length - 1} elements showing process flow`
  } else if (diagramType.includes('sequenceDiagram')) {
    return `Sequence diagram showing interactions between components`
  } else if (diagramType.includes('classDiagram')) {
    return `Class diagram showing relationships between classes`
  } else {
    return `${diagramType} diagram with ${lines.length - 1} elements`
  }
}
```

### 6. Skip Navigation Links

#### Update App Component
```typescript
// App.tsx - Add Skip Links
export const App: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* Skip Navigation Links */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50">
        <a 
          href="#main-content" 
          className="bg-primary text-primary-foreground p-2 rounded-br-md"
        >
          Skip to main content
        </a>
        <a 
          href="#navigation" 
          className="bg-primary text-primary-foreground p-2 rounded-br-md ml-2"
        >
          Skip to navigation
        </a>
      </div>

      {/* Main App Layout */}
      <div className="flex-1 flex">
        <nav id="navigation" className="w-64 bg-muted">
          {/* Navigation content */}
        </nav>
        
        <main id="main-content" className="flex-1">
          {/* Main content */}
        </main>
      </div>
    </div>
  )
}
```

---

## Medium Priority Fixes Implementation

### 7. Color Contrast Improvements

#### Update CSS Variables
```css
/* globals.css - Enhanced Color Contrast */
:root {
  /* Improved secondary text contrast */
  --muted-foreground: hsl(215.4 16.3% 46.9%); /* Was 56.9%, now 46.9% for better contrast */
  
  /* Enhanced border contrast */
  --border: hsl(214.3 31.8% 91.4%); /* Slightly darker for better visibility */
  
  /* Improved focus ring */
  --ring: hsl(221.2 83.2% 53.3%); /* More vibrant focus indicator */
}

.dark {
  /* Dark mode contrast improvements */
  --muted-foreground: hsl(215.4 16.3% 65.9%); /* Lighter for better contrast on dark */
  --border: hsl(217.2 32.6% 17.5%); /* Better border visibility */
}
```

### 8. Heading Structure Consistency

#### Create Heading Component
```typescript
// components/ui/heading.tsx - Semantic Heading Component
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
}

export const Heading: React.FC<HeadingProps> = ({ 
  level, 
  children, 
  className = '' 
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  
  const baseStyles = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
    4: 'text-lg font-medium',
    5: 'text-base font-medium',
    6: 'text-sm font-medium'
  }
  
  return (
    <Tag className={`${baseStyles[level]} ${className}`}>
      {children}
    </Tag>
  )
}
```

### 9. Loading State Announcements

#### Create Loading Component
```typescript
// components/ui/loading.tsx - Accessible Loading Component
interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  inline?: boolean
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  size = 'md',
  inline = false
}) => {
  return (
    <div className={inline ? 'inline-flex items-center' : 'flex items-center justify-center'}>
      <div 
        role="status" 
        aria-live="polite"
        aria-label={message}
        className="flex items-center space-x-2"
      >
        <Loader2 className={`animate-spin ${
          size === 'sm' ? 'h-4 w-4' : 
          size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
        }`} />
        <span className={inline ? 'sr-only' : ''}>{message}</span>
      </div>
    </div>
  )
}
```

---

## Testing and Validation

### Automated Testing Script
```typescript
// scripts/accessibility-test.ts
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

async function runAccessibilityTests() {
  console.log('Running accessibility tests...')
  
  try {
    // Run axe tests
    const axeResults = execSync('npm run test:accessibility', { encoding: 'utf8' })
    console.log('✅ Axe tests passed')
    
    // Run Lighthouse accessibility audit
    const lighthouseResults = execSync(
      'lighthouse http://localhost:1420 --only-categories=accessibility --output=json',
      { encoding: 'utf8' }
    )
    
    const lighthouse = JSON.parse(lighthouseResults)
    const accessibilityScore = lighthouse.lhr.categories.accessibility.score * 100
    
    console.log(`📊 Lighthouse Accessibility Score: ${accessibilityScore}/100`)
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      axePassed: true,
      lighthouseScore: accessibilityScore,
      status: accessibilityScore >= 95 ? 'PASS' : 'NEEDS_IMPROVEMENT'
    }
    
    writeFileSync('accessibility-test-results.json', JSON.stringify(report, null, 2))
    console.log('📝 Test results saved to accessibility-test-results.json')
    
  } catch (error) {
    console.error('❌ Accessibility tests failed:', error)
    process.exit(1)
  }
}

runAccessibilityTests()
```

### Manual Testing Checklist
```markdown
## Manual Accessibility Testing Checklist

### Keyboard Navigation
- [ ] Tab through entire application
- [ ] All interactive elements focusable
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Logical tab order

### Screen Reader Testing (NVDA/JAWS)
- [ ] All content announced correctly
- [ ] Form labels read properly
- [ ] Error messages announced
- [ ] Status updates communicated
- [ ] Navigation landmarks present

### Modal Testing
- [ ] Focus moves to modal on open
- [ ] Focus trapped within modal
- [ ] Escape key closes modal
- [ ] Focus returns to trigger on close

### Color and Contrast
- [ ] Text contrast ≥ 4.5:1
- [ ] Large text contrast ≥ 3:1
- [ ] Focus indicators visible
- [ ] Information not color-dependent

### Responsive and Zoom
- [ ] Usable at 200% zoom
- [ ] Content reflows properly
- [ ] No horizontal scrolling
- [ ] Touch targets ≥ 44px
```

---

## Implementation Timeline

### Week 1: Critical Fixes
- Day 1-2: Modal focus trap implementation
- Day 3-4: Live regions for AI streaming
- Day 5: Error message associations

### Week 2: High Priority
- Day 1-2: View mode toggle states
- Day 3-4: Mermaid diagram accessibility
- Day 5: Skip navigation links

### Week 3: Medium Priority
- Day 1-2: Color contrast improvements
- Day 3-4: Heading structure fixes
- Day 5: Loading state announcements

### Week 4: Testing and Polish
- Day 1-3: Comprehensive testing
- Day 4-5: Documentation and final fixes

---

## Success Validation

After implementing all fixes, validate success by:

1. **Automated Testing**: 95+ Lighthouse accessibility score
2. **Manual Testing**: Complete keyboard navigation without issues
3. **Screen Reader Testing**: All content properly announced
4. **User Testing**: Feedback from assistive technology users
5. **Compliance Check**: Full WCAG 2.1 AA compliance

This remediation guide provides a systematic approach to achieving full accessibility compliance for Project Yarn.
