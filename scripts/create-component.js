#!/usr/bin/env node

/**
 * Component scaffolding script for Project Yarn
 * Generates React components with TypeScript, following project conventions
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Component type configurations
const COMPONENT_TYPES = {
  ui: {
    path: 'src/components/ui',
    description: 'Basic UI component (shadcn/ui style)',
    template: 'ui',
    hasProps: true,
    hasStyles: true,
    hasTests: true,
    hasStories: false
  },
  common: {
    path: 'src/components/common',
    description: 'Common application component',
    template: 'common',
    hasProps: true,
    hasStyles: true,
    hasTests: true,
    hasStories: true
  },
  feature: {
    path: 'src/components/features',
    description: 'Feature-specific component',
    template: 'feature',
    hasProps: true,
    hasStyles: true,
    hasTests: true,
    hasStories: true
  },
  performance: {
    path: 'src/components/performance',
    description: 'Performance monitoring component',
    template: 'performance',
    hasProps: true,
    hasStyles: true,
    hasTests: false,
    hasStories: false
  },
  hook: {
    path: 'src/hooks',
    description: 'Custom React hook',
    template: 'hook',
    hasProps: false,
    hasStyles: false,
    hasTests: true,
    hasStories: false
  }
};

// Template generators
const TEMPLATES = {
  ui: (name, props) => `import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const ${name.toLowerCase()}Variants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-input bg-background'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ${name}Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ${name.toLowerCase()}Variants> {
  children?: React.ReactNode;
}

const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <div
        className={cn(${name.toLowerCase()}Variants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

${name}.displayName = '${name}';

export { ${name}, ${name.toLowerCase()}Variants };`,

  common: (name, props) => `import React from 'react';
import { cn } from '@/lib/utils';

export interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
  ${props.map(prop => `${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n  ')}
}

export const ${name}: React.FC<${name}Props> = ({
  className,
  children,
  ${props.map(prop => prop.name).join(',\n  ')}
}) => {
  return (
    <div className={cn('${name.toLowerCase()}', className)}>
      {children}
    </div>
  );
};

${name}.displayName = '${name}';`,

  feature: (name, props) => `import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface ${name}Props {
  className?: string;
  ${props.map(prop => `${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n  ')}
}

export const ${name}: React.FC<${name}Props> = ({
  className,
  ${props.map(prop => prop.name).join(',\n  ')}
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = useCallback(async () => {
    setIsLoading(true);
    try {
      // Implementation here
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className={cn('${name.toLowerCase()}', className)}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">${name}</h2>
        {/* Component content */}
      </div>
    </div>
  );
};

${name}.displayName = '${name}';`,

  performance: (name, props) => `import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface ${name}Props {
  className?: string;
  ${props.map(prop => `${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n  ')}
}

interface PerformanceMetrics {
  [key: string]: number | string;
}

export const ${name}: React.FC<${name}Props> = ({
  className,
  ${props.map(prop => prop.name).join(',\n  ')}
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    // Start performance monitoring
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    // Stop performance monitoring
  }, []);

  useEffect(() => {
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [isMonitoring, stopMonitoring]);

  return (
    <div className={cn('${name.toLowerCase()}', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            ${name}
            <Badge variant={isMonitoring ? 'default' : 'secondary'}>
              {isMonitoring ? 'Monitoring' : 'Stopped'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Performance monitoring component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={startMonitoring}
              disabled={isMonitoring}
              variant="default"
            >
              Start Monitoring
            </Button>
            <Button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              variant="outline"
            >
              Stop Monitoring
            </Button>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="space-y-4">
                {/* Performance overview */}
              </div>
            </TabsContent>
            <TabsContent value="details">
              <div className="space-y-4">
                {/* Detailed metrics */}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

${name}.displayName = '${name}';`,

  hook: (name, props) => `import { useState, useEffect, useCallback } from 'react';

export interface Use${name}Options {
  ${props.map(prop => `${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n  ')}
}

export interface Use${name}Return {
  // Return type properties
  isLoading: boolean;
  error: Error | null;
  // Add more return properties as needed
}

export const use${name} = (options: Use${name}Options = {}): Use${name}Return => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAction = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Hook implementation
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Effect implementation
  }, []);

  return {
    isLoading,
    error
    // Return other values
  };
};`
};

// Test template generator
const generateTestTemplate = (name, type) => {
  if (type === 'hook') {
    return `import { renderHook, act } from '@testing-library/react';
import { use${name} } from './use${name}';

describe('use${name}', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => use${name}());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle loading states', async () => {
    const { result } = renderHook(() => use${name}());
    
    // Test loading state changes
    await act(async () => {
      // Trigger hook action
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => use${name}());
    
    // Test error handling
    await act(async () => {
      // Trigger error condition
    });
    
    expect(result.current.error).toBeTruthy();
  });
});`;
  }

  return `import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${name} } from './${name}';

describe('${name}', () => {
  const defaultProps = {
    // Add default props here
  };

  it('renders without crashing', () => {
    render(<${name} {...defaultProps} />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-class';
    render(<${name} {...defaultProps} className={customClass} />);
    expect(screen.getByRole('generic')).toHaveClass(customClass);
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    const mockHandler = jest.fn();
    
    render(<${name} {...defaultProps} onClick={mockHandler} />);
    
    await user.click(screen.getByRole('generic'));
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<${name} {...defaultProps} />);
      // Add accessibility tests
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<${name} {...defaultProps} />);
      
      await user.tab();
      // Test keyboard navigation
    });
  });
});`;
};

// Story template generator
const generateStoryTemplate = (name, type) => {
  return `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${type}/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Define argTypes here
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default args
  },
};

export const WithProps: Story = {
  args: {
    // Props variation
  },
};

export const Interactive: Story = {
  args: {
    // Interactive variation
  },
  play: async ({ canvasElement }) => {
    // Interaction tests
  },
};`;
};

// Utility functions
function toPascalCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => word.toUpperCase())
    .replace(/\s+/g, '');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, content) {
  ensureDirectoryExists(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Created: ${filePath}`);
}

// Interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function collectComponentInfo() {
  console.log('🚀 Project Yarn Component Generator');
  console.log('==================================\n');

  // Component name
  const componentName = await askQuestion('Component name (PascalCase): ');
  if (!componentName) {
    console.error('❌ Component name is required');
    process.exit(1);
  }

  const name = toPascalCase(componentName);

  // Component type
  console.log('\nAvailable component types:');
  Object.entries(COMPONENT_TYPES).forEach(([key, config]) => {
    console.log(`  ${key}: ${config.description}`);
  });

  const type = await askQuestion('\nComponent type: ');
  if (!COMPONENT_TYPES[type]) {
    console.error('❌ Invalid component type');
    process.exit(1);
  }

  // Props
  const props = [];
  if (COMPONENT_TYPES[type].hasProps) {
    console.log('\nAdd props (press Enter with empty name to finish):');
    
    while (true) {
      const propName = await askQuestion('  Prop name: ');
      if (!propName) break;

      const propType = await askQuestion('  Prop type (default: string): ') || 'string';
      const isOptional = (await askQuestion('  Optional? (y/N): ')).toLowerCase() === 'y';

      props.push({
        name: toCamelCase(propName),
        type: propType,
        optional: isOptional
      });
    }
  }

  // Subdirectory for feature components
  let subdirectory = '';
  if (type === 'feature') {
    subdirectory = await askQuestion('Feature subdirectory (optional): ');
  }

  return { name, type, props, subdirectory };
}

async function generateComponent() {
  try {
    const { name, type, props, subdirectory } = await collectComponentInfo();
    const config = COMPONENT_TYPES[type];
    
    // Determine paths
    const basePath = subdirectory 
      ? path.join(config.path, subdirectory)
      : config.path;
    
    const componentPath = type === 'hook' 
      ? path.join(basePath, `use${name}.ts`)
      : path.join(basePath, `${name}.tsx`);
    
    const testPath = type === 'hook'
      ? path.join(basePath, `use${name}.test.ts`)
      : path.join(basePath, `${name}.test.tsx`);
    
    const storyPath = path.join(basePath, `${name}.stories.tsx`);

    console.log(`\n🔨 Generating ${config.description}...`);

    // Generate component file
    const template = TEMPLATES[config.template];
    const componentContent = template(name, props);
    writeFile(componentPath, componentContent);

    // Generate test file
    if (config.hasTests) {
      const testContent = generateTestTemplate(name, type);
      writeFile(testPath, testContent);
    }

    // Generate story file
    if (config.hasStories) {
      const storyContent = generateStoryTemplate(name, type);
      writeFile(storyPath, storyContent);
    }

    // Update index file if it exists
    const indexPath = path.join(basePath, 'index.ts');
    if (fs.existsSync(indexPath)) {
      const exportLine = type === 'hook' 
        ? `export { use${name} } from './use${name}';`
        : `export { ${name} } from './${name}';`;
      
      fs.appendFileSync(indexPath, `\n${exportLine}`);
      console.log(`✅ Updated: ${indexPath}`);
    }

    console.log('\n✨ Component generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the generated files');
    console.log('2. Customize the implementation');
    console.log('3. Run tests: npm run test');
    console.log('4. Run linting: npm run lint:components');
    
    if (config.hasStories) {
      console.log('5. View in Storybook (if configured)');
    }

  } catch (error) {
    console.error('❌ Error generating component:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Project Yarn Component Generator

Usage: node scripts/create-component.js [options]

Options:
  --help, -h     Show this help message

Interactive Mode:
  The script will prompt you for component details including:
  - Component name (PascalCase)
  - Component type (ui, common, feature, performance, hook)
  - Props definition
  - Subdirectory (for feature components)

Component Types:
  ui          - Basic UI component (shadcn/ui style)
  common      - Common application component
  feature     - Feature-specific component
  performance - Performance monitoring component
  hook        - Custom React hook

Examples:
  node scripts/create-component.js
  # Follow the interactive prompts to generate a component

Generated Files:
  - Component file (.tsx or .ts)
  - Test file (.test.tsx or .test.ts)
  - Story file (.stories.tsx) - if applicable
  - Updated index.ts exports
`);
  process.exit(0);
}

// Run the generator
generateComponent();
