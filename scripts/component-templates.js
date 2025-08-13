/**
 * Component template utilities for Project Yarn
 * Provides reusable templates and utilities for component generation
 */

// Common imports for different component types
const IMPORTS = {
  ui: [
    "import * as React from 'react';",
    "import { cn } from '@/lib/utils';",
    "import { cva, type VariantProps } from 'class-variance-authority';"
  ],
  common: [
    "import React from 'react';",
    "import { cn } from '@/lib/utils';"
  ],
  feature: [
    "import React, { useState, useCallback } from 'react';",
    "import { cn } from '@/lib/utils';"
  ],
  performance: [
    "import React, { useState, useEffect, useCallback } from 'react';",
    "import { cn } from '@/lib/utils';",
    "import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';",
    "import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';",
    "import { Button } from '@/components/ui/button';",
    "import { Badge } from '@/components/ui/badge';"
  ],
  hook: [
    "import { useState, useEffect, useCallback } from 'react';"
  ]
};

// Common prop patterns
const PROP_PATTERNS = {
  className: {
    name: 'className',
    type: 'string',
    optional: true,
    description: 'Additional CSS classes'
  },
  children: {
    name: 'children',
    type: 'React.ReactNode',
    optional: true,
    description: 'Child elements'
  },
  disabled: {
    name: 'disabled',
    type: 'boolean',
    optional: true,
    description: 'Whether the component is disabled'
  },
  loading: {
    name: 'loading',
    type: 'boolean',
    optional: true,
    description: 'Whether the component is in loading state'
  },
  onClick: {
    name: 'onClick',
    type: '(event: React.MouseEvent) => void',
    optional: true,
    description: 'Click event handler'
  },
  onSubmit: {
    name: 'onSubmit',
    type: '(event: React.FormEvent) => void',
    optional: true,
    description: 'Submit event handler'
  },
  variant: {
    name: 'variant',
    type: "'primary' | 'secondary' | 'destructive' | 'outline'",
    optional: true,
    description: 'Visual variant'
  },
  size: {
    name: 'size',
    type: "'sm' | 'md' | 'lg'",
    optional: true,
    description: 'Size variant'
  }
};

// Component boilerplate generators
const BOILERPLATES = {
  // Form component boilerplate
  form: (name) => `import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ${name}Props {
  className?: string;
  onSubmit: (data: ${name}Data) => void;
  onCancel?: () => void;
  initialData?: Partial<${name}Data>;
  disabled?: boolean;
}

export interface ${name}Data {
  // Define form data structure
}

export const ${name}: React.FC<${name}Props> = ({
  className,
  onSubmit,
  onCancel,
  initialData = {},
  disabled = false
}) => {
  const [formData, setFormData] = useState<${name}Data>({
    ...initialData
  } as ${name}Data);

  const [errors, setErrors] = useState<Partial<Record<keyof ${name}Data, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation logic
    const newErrors: Partial<Record<keyof ${name}Data, string>> = {};
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ${name}Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="field">Field Label</Label>
        <Input
          id="field"
          value={formData.field || ''}
          onChange={(e) => handleInputChange('field', e.target.value)}
          disabled={disabled}
          className={errors.field ? 'border-destructive' : ''}
        />
        {errors.field && (
          <p className="text-sm text-destructive">{errors.field}</p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={disabled}>
          Submit
        </Button>
      </div>
    </form>
  );
};

${name}.displayName = '${name}';`,

  // Modal component boilerplate
  modal: (name) => `import React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ${name}: React.FC<${name}Props> = ({
  className,
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn('sm:max-w-[425px]', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

${name}.displayName = '${name}';`,

  // List component boilerplate
  list: (name) => `import React from 'react';
import { cn } from '@/lib/utils';

export interface ${name}Item {
  id: string;
  // Define item structure
}

export interface ${name}Props {
  className?: string;
  items: ${name}Item[];
  onItemClick?: (item: ${name}Item) => void;
  onItemSelect?: (item: ${name}Item) => void;
  selectedItems?: string[];
  loading?: boolean;
  emptyMessage?: string;
  renderItem?: (item: ${name}Item) => React.ReactNode;
}

export const ${name}: React.FC<${name}Props> = ({
  className,
  items,
  onItemClick,
  onItemSelect,
  selectedItems = [],
  loading = false,
  emptyMessage = 'No items found',
  renderItem
}) => {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-muted-foreground">{emptyMessage}</div>
      </div>
    );
  }

  const defaultRenderItem = (item: ${name}Item) => (
    <div
      key={item.id}
      className={cn(
        'p-4 border rounded-lg cursor-pointer hover:bg-accent',
        selectedItems.includes(item.id) && 'bg-accent'
      )}
      onClick={() => onItemClick?.(item)}
    >
      {/* Default item rendering */}
      <div>{item.id}</div>
    </div>
  );

  return (
    <div className={cn('space-y-2', className)}>
      {items.map(item => 
        renderItem ? renderItem(item) : defaultRenderItem(item)
      )}
    </div>
  );
};

${name}.displayName = '${name}';`,

  // Data fetching hook boilerplate
  dataHook: (name) => `import { useState, useEffect, useCallback } from 'react';

export interface Use${name}Options {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface Use${name}Return<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const use${name} = <T = any>(
  options: Use${name}Options = {}
): Use${name}Return<T> => {
  const { enabled = true, refetchInterval } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Implement data fetching logic
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};`
};

// Utility functions
function generatePropInterface(props, componentName) {
  const propLines = props.map(prop => {
    const optional = prop.optional ? '?' : '';
    const comment = prop.description ? `  /** ${prop.description} */\n` : '';
    return `${comment}  ${prop.name}${optional}: ${prop.type};`;
  });

  return `export interface ${componentName}Props {
${propLines.join('\n')}
}`;
}

function generatePropDestructuring(props) {
  return props.map(prop => prop.name).join(',\n  ');
}

function generateDefaultProps(props) {
  const defaultProps = props
    .filter(prop => prop.optional && prop.default)
    .map(prop => `${prop.name}: ${prop.default}`)
    .join(',\n  ');

  return defaultProps ? `const defaultProps = {\n  ${defaultProps}\n};` : '';
}

// Export utilities
module.exports = {
  IMPORTS,
  PROP_PATTERNS,
  BOILERPLATES,
  generatePropInterface,
  generatePropDestructuring,
  generateDefaultProps
};
