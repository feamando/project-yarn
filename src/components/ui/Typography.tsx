import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// === TYPOGRAPHY COMPONENT SYSTEM ===
// Task 5.1: Typography and Visual Hierarchy Implementation
// Implements Tasks 5.1.1 through 5.1.5 with v0 design tokens

// === TYPOGRAPHY VARIANTS ===
const typographyVariants = cva(
  "transition-colors duration-v0-fast",
  {
    variants: {
      // Task 5.1.1: Consistent font scale (12px, 14px, 16px, 18px, 24px, 32px)
      size: {
        xs: "text-v0-xs",       // 12px - Small text, captions
        sm: "text-v0-sm",       // 14px - Body text, labels
        base: "text-v0-base",   // 16px - Default body text
        lg: "text-v0-lg",       // 18px - Large body text
        xl: "text-v0-xl",       // 24px - Small headings
        "2xl": "text-v0-2xl",   // 32px - Large headings
        "3xl": "text-v0-3xl",   // 36px - Display headings
        "4xl": "text-v0-4xl",   // 48px - Hero headings
        "5xl": "text-v0-5xl",   // 60px - Large display
        "6xl": "text-v0-6xl",   // 72px - Extra large display
      },
      
      // Task 5.1.3: Font-weight hierarchy (400, 500, 600, 700)
      weight: {
        light: "font-v0-light",       // 300
        normal: "font-v0-normal",     // 400 - Regular body text
        medium: "font-v0-medium",     // 500 - Emphasized text
        semibold: "font-v0-semibold", // 600 - Sub-headings
        bold: "font-v0-bold",         // 700 - Headings and strong emphasis
      },
      
      // Task 5.1.5: Text color hierarchy with proper contrast ratios (4.5:1 minimum)
      color: {
        primary: "text-v0-text-primary",       // 7.8:1 contrast - Main content
        secondary: "text-v0-text-secondary",   // 6.2:1 contrast - Supporting text
        muted: "text-v0-text-muted",           // 4.6:1 contrast - Subtle text
        heading: "text-v0-text-heading",       // 10.5:1 contrast - Maximum emphasis
        emphasis: "text-v0-text-emphasis",     // Gold accent for important text
        link: "text-v0-text-link hover:text-v0-text-link-hover", // Accessible link colors
        disabled: "text-v0-text-disabled",     // 3.2:1 contrast - Disabled text
        success: "text-v0-text-success",       // 5.1:1 contrast - Success messages
        warning: "text-v0-text-warning",       // 6.8:1 contrast - Warning messages
        error: "text-v0-text-error",           // 4.7:1 contrast - Error messages
        info: "text-v0-text-info",             // 4.8:1 contrast - Info messages
      },
      
      // Task 5.1.4: Letter-spacing for improved readability
      tracking: {
        tighter: "tracking-v0-tighter",  // -0.05em
        tight: "tracking-v0-tight",      // -0.025em
        normal: "tracking-v0-normal",    // 0em
        wide: "tracking-v0-wide",        // 0.025em
        wider: "tracking-v0-wider",      // 0.05em
        widest: "tracking-v0-widest",    // 0.1em
      },
      
      // Task 5.1.2: Proper line-height ratios (1.2 for headings, 1.5 for body)
      leading: {
        tight: "leading-tight",    // 1.2 - For headings and display text
        normal: "leading-normal",  // 1.5 - For body text and paragraphs
        relaxed: "leading-relaxed", // 1.75 - For long-form reading
      },
      
      // Text alignment
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
      },
      
      // Text transform
      transform: {
        none: "normal-case",
        uppercase: "uppercase",
        lowercase: "lowercase",
        capitalize: "capitalize",
      },
    },
    defaultVariants: {
      size: "base",
      weight: "normal",
      color: "primary",
      tracking: "normal",
      leading: "normal",
      align: "left",
      transform: "none",
    },
  }
);

// === TYPOGRAPHY COMPONENT ===
interface TypographyProps extends VariantProps<typeof typographyVariants> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function Typography({
  children,
  className,
  as: Component = "p",
  size,
  weight,
  color,
  tracking,
  leading,
  align,
  transform,
  ...props
}: TypographyProps) {
  return (
    <Component
      className={cn(
        typographyVariants({
          size,
          weight,
          color,
          tracking,
          leading,
          align,
          transform,
        }),
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// === SEMANTIC TYPOGRAPHY COMPONENTS ===
// Pre-configured components for common use cases

export function Heading1({ children, className, ...props }: Omit<TypographyProps, 'as' | 'size' | 'weight' | 'color' | 'leading'>) {
  return (
    <Typography
      as="h1"
      size="4xl"
      weight="bold"
      color="heading"
      leading="tight"
      tracking="tight"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function Heading2({ children, className, ...props }: Omit<TypographyProps, 'as' | 'size' | 'weight' | 'color' | 'leading'>) {
  return (
    <Typography
      as="h2"
      size="2xl"
      weight="bold"
      color="heading"
      leading="tight"
      tracking="tight"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function Heading3({ children, className, ...props }: Omit<TypographyProps, 'as' | 'size' | 'weight' | 'color' | 'leading'>) {
  return (
    <Typography
      as="h3"
      size="xl"
      weight="semibold"
      color="heading"
      leading="tight"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function Heading4({ children, className, ...props }: Omit<TypographyProps, 'as' | 'size' | 'weight' | 'color' | 'leading'>) {
  return (
    <Typography
      as="h4"
      size="lg"
      weight="semibold"
      color="primary"
      leading="tight"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function BodyText({ children, className, ...props }: Omit<TypographyProps, 'as' | 'size' | 'weight' | 'leading'>) {
  return (
    <Typography
      as="p"
      size="base"
      weight="normal"
      leading="normal"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function SmallText({ children, className, ...props }: Omit<TypographyProps, 'as' | 'size' | 'weight' | 'leading'>) {
  return (
    <Typography
      as="span"
      size="sm"
      weight="normal"
      leading="normal"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function Caption({ children, className, ...props }: Omit<TypographyProps, 'as' | 'size' | 'weight' | 'color' | 'leading'>) {
  return (
    <Typography
      as="span"
      size="xs"
      weight="normal"
      color="muted"
      leading="normal"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function Label({ children, className, ...props }: Omit<TypographyProps, 'as' | 'size' | 'weight' | 'leading'>) {
  return (
    <Typography
      as="label"
      size="sm"
      weight="medium"
      leading="normal"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function Link({ children, className, href, ...props }: Omit<TypographyProps, 'as' | 'color'> & { href?: string }) {
  return (
    <Typography
      as="a"
      color="link"
      className={cn("underline-offset-4 hover:underline cursor-pointer", className)}
      href={href}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function Code({ children, className, ...props }: Omit<TypographyProps, 'as' | 'size' | 'weight'>) {
  return (
    <Typography
      as="code"
      size="sm"
      weight="normal"
      className={cn(
        "font-mono bg-v0-bg-secondary px-1 py-0.5 rounded border border-v0-border-primary",
        className
      )}
      {...props}
    >
      {children}
    </Typography>
  );
}

// === TYPOGRAPHY SHOWCASE COMPONENT ===
// Demonstrates all typography variants and hierarchy

export function TypographyShowcase() {
  return (
    <div className="space-y-8 p-6 bg-v0-dark-bg">
      {/* Headings Hierarchy */}
      <section className="space-y-4">
        <Heading2>Typography Hierarchy</Heading2>
        <div className="space-y-3">
          <Heading1>Heading 1 - Hero Title (48px)</Heading1>
          <Heading2>Heading 2 - Section Title (32px)</Heading2>
          <Heading3>Heading 3 - Subsection Title (24px)</Heading3>
          <Heading4>Heading 4 - Component Title (18px)</Heading4>
        </div>
      </section>

      {/* Body Text Variants */}
      <section className="space-y-4">
        <Heading3>Body Text Variants</Heading3>
        <div className="space-y-3">
          <BodyText>
            This is the default body text (16px) with proper line-height (1.5) for optimal readability. 
            It maintains the v0 prototype look and feel while ensuring accessibility compliance.
          </BodyText>
          <SmallText color="secondary">
            This is small text (14px) used for labels and secondary information.
          </SmallText>
          <Caption>
            This is caption text (12px) used for image captions and fine print.
          </Caption>
        </div>
      </section>

      {/* Color Hierarchy */}
      <section className="space-y-4">
        <Heading3>Text Color Hierarchy</Heading3>
        <div className="space-y-2">
          <BodyText color="heading">Heading text - Maximum emphasis (10.5:1 contrast)</BodyText>
          <BodyText color="primary">Primary text - Main content (7.8:1 contrast)</BodyText>
          <BodyText color="secondary">Secondary text - Supporting content (6.2:1 contrast)</BodyText>
          <BodyText color="muted">Muted text - Subtle information (4.6:1 contrast)</BodyText>
          <BodyText color="emphasis">Emphasis text - Important highlights</BodyText>
          <Link>Link text - Interactive elements</Link>
          <BodyText color="disabled">Disabled text - Inactive elements</BodyText>
        </div>
      </section>

      {/* Semantic Colors */}
      <section className="space-y-4">
        <Heading3>Semantic Text Colors</Heading3>
        <div className="space-y-2">
          <BodyText color="success">Success message - Operation completed successfully</BodyText>
          <BodyText color="warning">Warning message - Attention required</BodyText>
          <BodyText color="error">Error message - Something went wrong</BodyText>
          <BodyText color="info">Info message - Additional information</BodyText>
        </div>
      </section>

      {/* Font Weights */}
      <section className="space-y-4">
        <Heading3>Font Weight Hierarchy</Heading3>
        <div className="space-y-2">
          <BodyText weight="light">Light weight (300) - Subtle emphasis</BodyText>
          <BodyText weight="normal">Normal weight (400) - Regular body text</BodyText>
          <BodyText weight="medium">Medium weight (500) - Emphasized text</BodyText>
          <BodyText weight="semibold">Semibold weight (600) - Sub-headings</BodyText>
          <BodyText weight="bold">Bold weight (700) - Headings and strong emphasis</BodyText>
        </div>
      </section>

      {/* Letter Spacing */}
      <section className="space-y-4">
        <Heading3>Letter Spacing for Readability</Heading3>
        <div className="space-y-2">
          <BodyText tracking="tighter">Tighter tracking - Dense text</BodyText>
          <BodyText tracking="tight">Tight tracking - Compact text</BodyText>
          <BodyText tracking="normal">Normal tracking - Default spacing</BodyText>
          <BodyText tracking="wide">Wide tracking - Spaced text</BodyText>
          <BodyText tracking="wider">Wider tracking - More spaced</BodyText>
          <BodyText tracking="widest">Widest tracking - Maximum spacing</BodyText>
        </div>
      </section>

      {/* Interactive Elements */}
      <section className="space-y-4">
        <Heading3>Interactive Elements</Heading3>
        <div className="space-y-2">
          <Label>Form Label</Label>
          <Link href="#">Interactive Link</Link>
          <Code>inline code snippet</Code>
        </div>
      </section>
    </div>
  );
}

// === USAGE EXAMPLES ===
/*
// Basic Typography Component:
<Typography size="lg" weight="semibold" color="primary">
  Custom typography with specific variants
</Typography>

// Semantic Components:
<Heading1>Main Page Title</Heading1>
<Heading2>Section Title</Heading2>
<BodyText>Regular paragraph content</BodyText>
<Caption>Image caption or fine print</Caption>
<Link href="/path">Navigation link</Link>
<Code>code snippet</Code>

// Typography Showcase:
<TypographyShowcase />
*/

export {
  Typography,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  BodyText,
  SmallText,
  Caption,
  Label,
  Link,
  Code,
  TypographyShowcase,
};
