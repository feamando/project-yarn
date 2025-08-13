# Component Development Guidelines
**Document Type:** Development Guidelines  
**Date:** August 2, 2025  
**Project:** Project Yarn Frontend Enhancement  
**Task:** 8.1 - Create component development guidelines document  

## Overview

This document provides comprehensive guidelines for developing React components in Project Yarn. Following these guidelines ensures consistency, maintainability, and optimal performance across the entire frontend codebase.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [File Structure and Naming](#file-structure-and-naming)
3. [Component Types and Patterns](#component-types-and-patterns)
4. [TypeScript Best Practices](#typescript-best-practices)
5. [Props and Interface Design](#props-and-interface-design)
6. [State Management](#state-management)
7. [Performance Optimization](#performance-optimization)
8. [Accessibility Guidelines](#accessibility-guidelines)
9. [Testing Requirements](#testing-requirements)
10. [Documentation Standards](#documentation-standards)

## Component Architecture

### Design Principles

**1. Single Responsibility Principle**
Each component should have one clear purpose and responsibility.

```tsx
// ✅ Good - Single responsibility
const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'medium' }) => {
  return (
    <div className={`avatar avatar-${size}`}>
      <img src={user.avatarUrl} alt={`${user.name} avatar`} />
    </div>
  );
};

// ❌ Bad - Multiple responsibilities
const UserProfile: React.FC = () => {
  // Handles avatar, user info, settings, notifications, etc.
  return <div>...</div>;
};
```

**2. Composition Over Inheritance**
Favor component composition and prop-based customization.

```tsx
// ✅ Good - Composition
const Card: React.FC<CardProps> = ({ children, header, footer, className }) => (
  <div className={cn('card', className)}>
    {header && <div className="card-header">{header}</div>}
    <div className="card-content">{children}</div>
    {footer && <div className="card-footer">{footer}</div>}
  </div>
);

// Usage
<Card 
  header={<h2>Title</h2>}
  footer={<Button>Action</Button>}
>
  Content here
</Card>
```

**3. Predictable Props Interface**
Design props that are intuitive and follow consistent patterns.

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
}
```

## File Structure and Naming

### Directory Structure

```
src/components/
├── ui/                     # Basic UI components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── common/                 # Shared application components
│   ├── YarnLogo.tsx
│   ├── ContextIndicator.tsx
│   └── SkipLinks.tsx
├── features/               # Feature-specific components
│   ├── chat/
│   │   ├── StreamingChatUI.tsx
│   │   └── MessageBubble.tsx
│   └── documents/
│       ├── DocumentList.tsx
│       └── DocumentViewer.tsx
└── performance/            # Performance monitoring components
    ├── PerformanceProfiler.tsx
    ├── BundleAnalyzer.tsx
    └── RenderPerformanceTracker.tsx
```

### Naming Conventions

**Component Files**
- Use PascalCase for component files: `UserProfile.tsx`
- Match the component name exactly: `export const UserProfile = ...`

**Component Names**
- Use descriptive, noun-based names: `DocumentList`, `UserAvatar`, `SettingsPanel`
- Avoid generic names: `Item`, `Container`, `Wrapper`

**Props Interfaces**
- Always suffix with `Props`: `UserProfileProps`, `ButtonProps`
- Use descriptive property names: `isLoading` instead of `loading`

```tsx
// ✅ Good naming
interface DocumentListProps {
  documents: Document[];
  onDocumentSelect: (document: Document) => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ ... }) => {
  // Component implementation
};
```

## Component Types and Patterns

### 1. Presentation Components

Pure components that focus on rendering UI based on props.

```tsx
interface UserCardProps {
  user: User;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  showActions = false, 
  onEdit, 
  onDelete 
}) => {
  return (
    <Card className="user-card">
      <CardHeader>
        <UserAvatar user={user} />
        <div>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      </CardHeader>
      {showActions && (
        <CardFooter>
          <Button onClick={onEdit} variant="outline">Edit</Button>
          <Button onClick={onDelete} variant="destructive">Delete</Button>
        </CardFooter>
      )}
    </Card>
  );
};
```

### 2. Container Components

Components that manage state and data fetching.

```tsx
const DocumentListContainer: React.FC = () => {
  const { documents, isLoading, error } = useDocuments();
  const navigate = useNavigate();

  const handleDocumentSelect = useCallback((document: Document) => {
    navigate(`/documents/${document.id}`);
  }, [navigate]);

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <DocumentList
      documents={documents}
      isLoading={isLoading}
      onDocumentSelect={handleDocumentSelect}
    />
  );
};
```

### 3. Compound Components

Components that work together as a cohesive unit.

```tsx
const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent
};

// Usage
<Tabs.Root value="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="details">Details</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">Overview content</Tabs.Content>
  <Tabs.Content value="details">Details content</Tabs.Content>
</Tabs.Root>
```

### 4. Higher-Order Components (HOCs)

Use sparingly, prefer hooks for cross-cutting concerns.

```tsx
// ✅ Preferred - Custom hook
const useErrorBoundary = () => {
  const [error, setError] = useState<Error | null>(null);
  
  const resetError = useCallback(() => setError(null), []);
  
  useEffect(() => {
    if (error) {
      console.error('Component error:', error);
    }
  }, [error]);

  return { error, setError, resetError };
};

// ❌ Less preferred - HOC
const withErrorBoundary = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    // Error boundary logic
    return <Component {...props} />;
  };
};
```

## TypeScript Best Practices

### Interface Design

**1. Explicit Prop Types**

```tsx
// ✅ Good - Explicit and descriptive
interface SearchInputProps {
  value: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

// ❌ Bad - Too generic
interface SearchInputProps {
  [key: string]: any;
}
```

**2. Union Types for Variants**

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  // ... other props
}
```

**3. Generic Components**

```tsx
interface SelectProps<T> {
  options: T[];
  value?: T;
  onValueChange: (value: T) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
}

const Select = <T,>({ options, value, onValueChange, getOptionLabel, getOptionValue }: SelectProps<T>) => {
  // Implementation
};
```

### Type Utilities

**1. Component Props Extraction**

```tsx
// Extract props from existing components
type ButtonProps = React.ComponentProps<typeof Button>;
type DivProps = React.ComponentProps<'div'>;
```

**2. Conditional Props**

```tsx
type ConditionalProps<T> = T extends true 
  ? { required: string } 
  : { optional?: string };

interface ComponentProps<T extends boolean = false> {
  showRequired: T;
  // ... other props
  conditionalProps: ConditionalProps<T>;
}
```

## Props and Interface Design

### Required vs Optional Props

**Guidelines:**
- Make props required by default
- Use optional props sparingly and provide sensible defaults
- Group related optional props

```tsx
interface UserProfileProps {
  // Required props
  user: User;
  onSave: (user: User) => void;
  
  // Optional props with defaults
  editable?: boolean;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
  
  // Optional callbacks
  onEdit?: () => void;
  onCancel?: () => void;
  
  // Styling
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onSave,
  editable = false,
  showAvatar = true,
  avatarSize = 'md',
  onEdit,
  onCancel,
  className
}) => {
  // Implementation
};
```

### Prop Validation Patterns

**1. Runtime Validation (Development)**

```tsx
const validateProps = (props: ComponentProps) => {
  if (process.env.NODE_ENV === 'development') {
    if (props.items.length === 0 && !props.emptyStateMessage) {
      console.warn('Consider providing an emptyStateMessage when items array is empty');
    }
  }
};
```

**2. Default Props Pattern**

```tsx
const defaultProps = {
  size: 'md' as const,
  variant: 'primary' as const,
  disabled: false,
  loading: false
};

const Button: React.FC<ButtonProps> = (props) => {
  const { size, variant, disabled, loading, ...rest } = { ...defaultProps, ...props };
  // Implementation
};
```

## State Management

### Local State Guidelines

**1. Use useState for Simple State**

```tsx
const SearchInput: React.FC<SearchInputProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSearch(query);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};
```

**2. Use useReducer for Complex State**

```tsx
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

type FormAction = 
  | { type: 'SET_VALUE'; field: string; value: any }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'SET_TOUCHED'; field: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'RESET' };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value }
      };
    // ... other cases
    default:
      return state;
  }
};

const useForm = (initialValues: Record<string, any>) => {
  const [state, dispatch] = useReducer(formReducer, {
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false
  });

  // Form methods
  return { state, dispatch, /* ... */ };
};
```

### Global State Integration

**1. Zustand Store Usage**

```tsx
// Store definition
interface AppStore {
  user: User | null;
  theme: 'light' | 'dark';
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const useAppStore = create<AppStore>((set) => ({
  user: null,
  theme: 'light',
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme })
}));

// Component usage
const UserProfile: React.FC = () => {
  const { user, setUser } = useAppStore();
  
  if (!user) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      {/* Profile content */}
    </div>
  );
};
```

## Performance Optimization

### Memoization Guidelines

**1. React.memo for Expensive Components**

```tsx
interface ExpensiveComponentProps {
  data: ComplexData[];
  onItemClick: (item: ComplexData) => void;
}

const ExpensiveComponent = React.memo<ExpensiveComponentProps>(({ data, onItemClick }) => {
  return (
    <div>
      {data.map(item => (
        <ComplexItem 
          key={item.id} 
          item={item} 
          onClick={() => onItemClick(item)} 
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, index) => item.id === nextProps.data[index].id)
  );
});
```

**2. useMemo for Expensive Calculations**

```tsx
const DataVisualization: React.FC<DataVisualizationProps> = ({ rawData, filters }) => {
  const processedData = useMemo(() => {
    return rawData
      .filter(item => filters.every(filter => filter(item)))
      .map(item => transformData(item))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [rawData, filters]);

  const chartConfig = useMemo(() => ({
    data: processedData,
    options: {
      responsive: true,
      scales: {
        x: { type: 'time' },
        y: { beginAtZero: true }
      }
    }
  }), [processedData]);

  return <Chart {...chartConfig} />;
};
```

**3. useCallback for Event Handlers**

```tsx
const ItemList: React.FC<ItemListProps> = ({ items, onItemUpdate }) => {
  const handleItemClick = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      onItemUpdate(item);
    }
  }, [items, onItemUpdate]);

  return (
    <div>
      {items.map(item => (
        <Item 
          key={item.id} 
          item={item} 
          onClick={() => handleItemClick(item.id)} 
        />
      ))}
    </div>
  );
};
```

### Virtualization for Large Lists

```tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  height: number;
}

const VirtualizedList: React.FC<VirtualizedListProps> = ({ items, itemHeight, height }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <Item item={items[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## Accessibility Guidelines

### ARIA and Semantic HTML

**1. Use Semantic HTML First**

```tsx
// ✅ Good - Semantic HTML
const Navigation: React.FC = () => (
  <nav role="navigation" aria-label="Main navigation">
    <ul>
      <li><a href="/" aria-current="page">Home</a></li>
      <li><a href="/projects">Projects</a></li>
      <li><a href="/settings">Settings</a></li>
    </ul>
  </nav>
);

// ❌ Bad - Non-semantic
const Navigation: React.FC = () => (
  <div className="navigation">
    <div onClick={() => navigate('/')}>Home</div>
    <div onClick={() => navigate('/projects')}>Projects</div>
  </div>
);
```

**2. Proper ARIA Labels**

```tsx
const SearchInput: React.FC<SearchInputProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId}>Search documents</label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-describedby={`${inputId}-help`}
      />
      <div id={`${inputId}-help`} className="sr-only">
        Enter keywords to search through your documents
      </div>
      <button 
        onClick={() => onSearch(query)}
        aria-label={`Search for "${query}"`}
      >
        Search
      </button>
    </div>
  );
};
```

**3. Focus Management**

```tsx
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        tabIndex={-1}
      >
        <h2 id="modal-title">{title}</h2>
        {children}
        <button onClick={onClose} aria-label="Close dialog">
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
```

## Testing Requirements

### Component Testing Structure

**1. Test File Organization**

```typescript
// UserProfile.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  const defaultProps = {
    user: mockUser,
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders user information correctly', () => {
      render(<UserProfile {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /john doe avatar/i })).toBeInTheDocument();
    });

    it('shows edit mode when editable prop is true', () => {
      render(<UserProfile {...defaultProps} editable />);
      
      expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onSave with updated user data', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      
      render(<UserProfile {...defaultProps} editable onSave={onSave} />);
      
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith({
        ...mockUser,
        name: 'Jane Doe'
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<UserProfile {...defaultProps} />);
      
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'John Doe avatar');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...defaultProps} editable />);
      
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      await user.tab();
      expect(nameInput).toHaveFocus();
    });
  });
});
```

**2. Testing Hooks**

```typescript
// useDocuments.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useDocuments } from './useDocuments';

describe('useDocuments', () => {
  it('fetches documents on mount', async () => {
    const { result } = renderHook(() => useDocuments());
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.documents).toHaveLength(3);
  });

  it('handles fetch errors', async () => {
    // Mock API error
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));
    
    const { result } = renderHook(() => useDocuments());
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

## Documentation Standards

### Component Documentation

**1. JSDoc Comments**

```tsx
/**
 * UserProfile component displays and allows editing of user information.
 * 
 * @example
 * ```tsx
 * <UserProfile 
 *   user={currentUser} 
 *   editable 
 *   onSave={handleUserSave}
 *   onCancel={handleCancel}
 * />
 * ```
 */
interface UserProfileProps {
  /** The user object to display */
  user: User;
  
  /** Whether the profile can be edited */
  editable?: boolean;
  
  /** Callback fired when user saves changes */
  onSave: (user: User) => void;
  
  /** Callback fired when user cancels editing */
  onCancel?: () => void;
  
  /** Additional CSS classes */
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ ... }) => {
  // Implementation
};
```

**2. README Documentation**

```markdown
# UserProfile Component

A reusable component for displaying and editing user profile information.

## Usage

```tsx
import { UserProfile } from '@/components/UserProfile';

function App() {
  const handleSave = (user: User) => {
    // Save user logic
  };

  return (
    <UserProfile 
      user={currentUser}
      editable
      onSave={handleSave}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `User` | - | The user object to display |
| `editable` | `boolean` | `false` | Whether the profile can be edited |
| `onSave` | `(user: User) => void` | - | Callback fired when user saves changes |
| `onCancel` | `() => void` | - | Callback fired when user cancels editing |
| `className` | `string` | - | Additional CSS classes |

## Examples

### Read-only Profile
```tsx
<UserProfile user={user} />
```

### Editable Profile
```tsx
<UserProfile 
  user={user} 
  editable 
  onSave={handleSave}
  onCancel={handleCancel}
/>
```
```

## Code Quality Checklist

Before submitting a component, ensure it meets these criteria:

### Functionality
- [ ] Component renders without errors
- [ ] All props work as expected
- [ ] Event handlers function correctly
- [ ] Edge cases are handled (empty states, loading states, errors)

### Code Quality
- [ ] TypeScript interfaces are properly defined
- [ ] No TypeScript errors or warnings
- [ ] ESLint rules pass
- [ ] Code follows established patterns
- [ ] Performance optimizations applied where needed

### Accessibility
- [ ] Proper semantic HTML used
- [ ] ARIA labels and roles added where needed
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA standards

### Testing
- [ ] Unit tests cover main functionality
- [ ] Accessibility tests included
- [ ] Edge cases tested
- [ ] Test coverage above 80%

### Documentation
- [ ] JSDoc comments added
- [ ] Props interface documented
- [ ] Usage examples provided
- [ ] README updated if necessary

## Common Patterns and Anti-Patterns

### ✅ Good Patterns

**1. Consistent Error Handling**
```tsx
const DataComponent: React.FC<DataComponentProps> = ({ dataId }) => {
  const { data, error, isLoading } = useData(dataId);

  if (error) {
    return <ErrorMessage error={error} onRetry={() => window.location.reload()} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <EmptyState message="No data available" />;
  }

  return <DataDisplay data={data} />;
};
```

**2. Proper Event Handler Naming**
```tsx
// ✅ Good - Clear intent
const handleUserClick = () => { /* ... */ };
const handleFormSubmit = () => { /* ... */ };
const handleModalClose = () => { /* ... */ };

// ❌ Bad - Unclear intent
const onClick = () => { /* ... */ };
const onSubmit = () => { /* ... */ };
const close = () => { /* ... */ };
```

### ❌ Anti-Patterns to Avoid

**1. Prop Drilling**
```tsx
// ❌ Bad - Excessive prop drilling
const App = () => {
  const user = useUser();
  return <Layout user={user} />;
};

const Layout = ({ user }) => {
  return <Sidebar user={user} />;
};

const Sidebar = ({ user }) => {
  return <UserMenu user={user} />;
};

// ✅ Good - Use context or state management
const UserContext = createContext();

const App = () => {
  const user = useUser();
  return (
    <UserContext.Provider value={user}>
      <Layout />
    </UserContext.Provider>
  );
};
```

**2. Inline Object/Function Creation**
```tsx
// ❌ Bad - Creates new objects on every render
const Component = ({ items }) => {
  return (
    <div>
      {items.map(item => (
        <Item 
          key={item.id}
          item={item}
          style={{ marginBottom: 10 }} // New object every render
          onClick={() => handleClick(item.id)} // New function every render
        />
      ))}
    </div>
  );
};

// ✅ Good - Stable references
const itemStyle = { marginBottom: 10 };

const Component = ({ items }) => {
  const handleItemClick = useCallback((itemId) => {
    handleClick(itemId);
  }, []);

  return (
    <div>
      {items.map(item => (
        <Item 
          key={item.id}
          item={item}
          style={itemStyle}
          onClick={() => handleItemClick(item.id)}
        />
      ))}
    </div>
  );
};
```

## Conclusion

Following these component development guidelines ensures that Project Yarn maintains high code quality, consistency, and developer experience. Regular review and updates of these guidelines help the team stay aligned with best practices and evolving patterns in React development.

For questions or suggestions regarding these guidelines, please reach out to the frontend team or create an issue in the project repository.

---

**Document Prepared By:** Cascade AI Assistant  
**Last Updated:** August 2, 2025  
**Review Status:** Complete  
**Next Review:** Quarterly or when significant changes are made to component patterns
