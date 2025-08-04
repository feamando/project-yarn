import React, { forwardRef } from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// === POLYMORPHIC COMPONENT PATTERNS ===
// Advanced component patterns with 'as' prop support for flexible element rendering

// === POLYMORPHIC TYPES ===
type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>["ref"];

type PolymorphicComponentPropWithRef<
  C extends React.ElementType,
  Props = {}
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> };

// === POLYMORPHIC TEXT COMPONENT ===
// Can render as any text element (p, span, h1, h2, etc.)

const textVariants = cva(
  "transition-colors duration-v0-fast",
  {
    variants: {
      // Typography Scale
      size: {
        xs: "text-v0-xs",
        sm: "text-v0-sm", 
        base: "text-v0-base",
        lg: "text-v0-lg",
        xl: "text-v0-xl",
        "2xl": "text-v0-2xl",
        "3xl": "text-v0-3xl",
        "4xl": "text-v0-4xl",
        "5xl": "text-v0-5xl",
        "6xl": "text-v0-6xl",
      },
      // Font Weight
      weight: {
        light: "font-v0-light",
        normal: "font-v0-normal",
        medium: "font-v0-medium",
        semibold: "font-v0-semibold",
        bold: "font-v0-bold",
      },
      // Text Color
      color: {
        primary: "text-v0-text-primary",
        secondary: "text-v0-text-secondary",
        muted: "text-v0-text-muted",
        inverse: "text-v0-text-inverse",
        gold: "text-v0-gold",
        red: "text-v0-red",
        teal: "text-v0-teal",
      },
      // Text Alignment
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
      },
      // Line Height
      leading: {
        tight: "leading-tight",
        normal: "leading-normal",
        relaxed: "leading-relaxed",
      },
      // Letter Spacing
      tracking: {
        tight: "tracking-v0-tighter",
        normal: "tracking-v0-normal",
        wide: "tracking-v0-wider",
        wider: "tracking-v0-widest",
      },
    },
    defaultVariants: {
      size: "base",
      weight: "normal",
      color: "primary",
      align: "left",
      leading: "normal",
      tracking: "normal",
    },
  }
);

type TextProps = VariantProps<typeof textVariants>;

type PolymorphicTextComponent = <C extends React.ElementType = "p">(
  props: PolymorphicComponentPropWithRef<C, TextProps>
) => React.ReactElement | null;

export const Text: PolymorphicTextComponent = forwardRef(
  <C extends React.ElementType = "p">(
    {
      as,
      children,
      className,
      size,
      weight,
      color,
      align,
      leading,
      tracking,
      ...props
    }: PolymorphicComponentPropWithRef<C, TextProps>,
    ref?: PolymorphicRef<C>
  ) => {
    const Component = as || "p";

    return (
      <Component
        ref={ref}
        className={cn(
          textVariants({ size, weight, color, align, leading, tracking }),
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = "Text";

// === POLYMORPHIC BOX COMPONENT ===
// Can render as any container element (div, section, article, etc.)

const boxVariants = cva(
  "",
  {
    variants: {
      // Display
      display: {
        block: "block",
        "inline-block": "inline-block",
        flex: "flex",
        "inline-flex": "inline-flex",
        grid: "grid",
        "inline-grid": "inline-grid",
        hidden: "hidden",
      },
      // Flex Direction
      direction: {
        row: "flex-row",
        "row-reverse": "flex-row-reverse",
        col: "flex-col",
        "col-reverse": "flex-col-reverse",
      },
      // Justify Content
      justify: {
        start: "justify-start",
        end: "justify-end",
        center: "justify-center",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly",
      },
      // Align Items
      align: {
        start: "items-start",
        end: "items-end",
        center: "items-center",
        baseline: "items-baseline",
        stretch: "items-stretch",
      },
      // Gap
      gap: {
        none: "gap-0",
        xs: "gap-v0-1",
        sm: "gap-v0-2",
        md: "gap-v0-4",
        lg: "gap-v0-6",
        xl: "gap-v0-8",
        "2xl": "gap-v0-12",
      },
      // Padding
      p: {
        none: "p-0",
        xs: "p-v0-1",
        sm: "p-v0-2",
        md: "p-v0-4",
        lg: "p-v0-6",
        xl: "p-v0-8",
        "2xl": "p-v0-12",
      },
      // Margin
      m: {
        none: "m-0",
        xs: "m-v0-1",
        sm: "m-v0-2",
        md: "m-v0-4",
        lg: "m-v0-6",
        xl: "m-v0-8",
        "2xl": "m-v0-12",
        auto: "m-auto",
      },
      // Background
      bg: {
        none: "bg-transparent",
        primary: "bg-v0-dark-bg",
        secondary: "bg-v0-bg-secondary",
        tertiary: "bg-v0-bg-tertiary",
        elevated: "bg-v0-bg-elevated",
        gold: "bg-v0-gold/10",
        red: "bg-v0-red/10",
        teal: "bg-v0-teal/10",
      },
      // Border
      border: {
        none: "border-0",
        primary: "border border-v0-border-primary",
        secondary: "border border-v0-border-secondary",
        gold: "border border-v0-gold",
        red: "border border-v0-red",
        teal: "border border-v0-teal",
      },
      // Border Radius
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full",
      },
      // Shadow
      shadow: {
        none: "shadow-none",
        sm: "shadow-v0-shadow-sm",
        md: "shadow-v0-shadow",
        lg: "shadow-v0-shadow-md",
        xl: "shadow-v0-shadow-lg",
        "2xl": "shadow-v0-shadow-xl",
      },
    },
    defaultVariants: {
      display: "block",
    },
  }
);

type BoxProps = VariantProps<typeof boxVariants>;

type PolymorphicBoxComponent = <C extends React.ElementType = "div">(
  props: PolymorphicComponentPropWithRef<C, BoxProps>
) => React.ReactElement | null;

export const Box: PolymorphicBoxComponent = forwardRef(
  <C extends React.ElementType = "div">(
    {
      as,
      children,
      className,
      display,
      direction,
      justify,
      align,
      gap,
      p,
      m,
      bg,
      border,
      rounded,
      shadow,
      ...props
    }: PolymorphicComponentPropWithRef<C, BoxProps>,
    ref?: PolymorphicRef<C>
  ) => {
    const Component = as || "div";

    return (
      <Component
        ref={ref}
        className={cn(
          boxVariants({ 
            display, 
            direction, 
            justify, 
            align, 
            gap, 
            p, 
            m, 
            bg, 
            border, 
            rounded, 
            shadow 
          }),
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Box.displayName = "Box";

// === POLYMORPHIC BUTTON COMPONENT ===
// Can render as button, a, Link, etc.

const polymorphicButtonVariants = cva(
  "inline-flex items-center justify-center gap-v0-2 whitespace-nowrap rounded-md font-v0-medium transition-all duration-v0-fast disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-v0-gold/20",
  {
    variants: {
      variant: {
        primary: "bg-v0-gold text-black hover:bg-v0-gold-hover",
        secondary: "bg-v0-bg-secondary text-v0-text-primary border border-v0-border-primary hover:bg-v0-bg-tertiary",
        outline: "border border-v0-border-primary bg-transparent text-v0-text-primary hover:bg-v0-bg-secondary",
        ghost: "text-v0-text-primary hover:bg-v0-bg-secondary",
        link: "text-v0-gold underline-offset-4 hover:underline",
        danger: "bg-v0-red text-white hover:bg-v0-red/90",
        teal: "bg-v0-teal text-white hover:bg-v0-teal/90",
      },
      size: {
        xs: "h-7 px-v0-2 text-v0-xs",
        sm: "h-8 px-v0-3 text-v0-sm",
        md: "h-9 px-v0-4 text-v0-base",
        lg: "h-10 px-v0-6 text-v0-lg",
        xl: "h-12 px-v0-8 text-v0-xl",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-10 w-10 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

type PolymorphicButtonProps = VariantProps<typeof polymorphicButtonVariants> & {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

type PolymorphicButtonComponent = <C extends React.ElementType = "button">(
  props: PolymorphicComponentPropWithRef<C, PolymorphicButtonProps>
) => React.ReactElement | null;

export const PolymorphicButton: PolymorphicButtonComponent = forwardRef(
  <C extends React.ElementType = "button">(
    {
      as,
      children,
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    }: PolymorphicComponentPropWithRef<C, PolymorphicButtonProps>,
    ref?: PolymorphicRef<C>
  ) => {
    const Component = as || "button";
    const isDisabled = disabled || loading;

    return (
      <Component
        ref={ref}
        disabled={isDisabled}
        className={cn(
          polymorphicButtonVariants({ variant, size, fullWidth }),
          loading && "cursor-wait",
          className
        )}
        {...props}
      >
        {loading && (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children && <span className={loading ? "sr-only" : ""}>{children}</span>}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </Component>
    );
  }
);

PolymorphicButton.displayName = "PolymorphicButton";

// === POLYMORPHIC LINK COMPONENT ===
// Can render as a, Link (React Router), NextLink, etc.

const linkVariants = cva(
  "transition-colors duration-v0-fast focus:outline-none focus:ring-2 focus:ring-v0-gold/20 rounded-sm",
  {
    variants: {
      variant: {
        default: "text-v0-gold hover:text-v0-gold-hover underline-offset-4 hover:underline",
        subtle: "text-v0-text-primary hover:text-v0-gold",
        button: "inline-flex items-center justify-center px-v0-4 py-v0-2 bg-v0-gold text-black rounded-md hover:bg-v0-gold-hover",
        nav: "text-v0-text-muted hover:text-v0-text-primary font-v0-medium",
      },
      size: {
        sm: "text-v0-sm",
        md: "text-v0-base",
        lg: "text-v0-lg",
      },
      underline: {
        always: "underline",
        hover: "hover:underline",
        never: "no-underline",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      underline: "hover",
    },
  }
);

type PolymorphicLinkProps = VariantProps<typeof linkVariants> & {
  external?: boolean;
};

type PolymorphicLinkComponent = <C extends React.ElementType = "a">(
  props: PolymorphicComponentPropWithRef<C, PolymorphicLinkProps>
) => React.ReactElement | null;

export const PolymorphicLink: PolymorphicLinkComponent = forwardRef(
  <C extends React.ElementType = "a">(
    {
      as,
      children,
      className,
      variant,
      size,
      underline,
      external = false,
      ...props
    }: PolymorphicComponentPropWithRef<C, PolymorphicLinkProps>,
    ref?: PolymorphicRef<C>
  ) => {
    const Component = as || "a";

    const externalProps = external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};

    return (
      <Component
        ref={ref}
        className={cn(linkVariants({ variant, size, underline }), className)}
        {...externalProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

PolymorphicLink.displayName = "PolymorphicLink";

// === POLYMORPHIC HEADING COMPONENT ===
// Can render as h1, h2, h3, h4, h5, h6

const headingVariants = cva(
  "font-v0-semibold text-v0-text-primary leading-tight tracking-v0-tight",
  {
    variants: {
      level: {
        1: "text-v0-4xl md:text-v0-5xl lg:text-v0-6xl",
        2: "text-v0-3xl md:text-v0-4xl",
        3: "text-v0-2xl md:text-v0-3xl",
        4: "text-v0-xl md:text-v0-2xl",
        5: "text-v0-lg md:text-v0-xl",
        6: "text-v0-base md:text-v0-lg",
      },
      color: {
        primary: "text-v0-text-primary",
        secondary: "text-v0-text-secondary",
        muted: "text-v0-text-muted",
        gold: "text-v0-gold",
        red: "text-v0-red",
        teal: "text-v0-teal",
      },
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
      },
    },
    defaultVariants: {
      level: 2,
      color: "primary",
      align: "left",
    },
  }
);

type HeadingProps = VariantProps<typeof headingVariants>;

type PolymorphicHeadingComponent = <C extends React.ElementType = "h2">(
  props: PolymorphicComponentPropWithRef<C, HeadingProps>
) => React.ReactElement | null;

export const Heading: PolymorphicHeadingComponent = forwardRef(
  <C extends React.ElementType = "h2">(
    {
      as,
      children,
      className,
      level,
      color,
      align,
      ...props
    }: PolymorphicComponentPropWithRef<C, HeadingProps>,
    ref?: PolymorphicRef<C>
  ) => {
    const Component = as || "h2";

    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ level, color, align }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = "Heading";

// === USAGE EXAMPLES ===
/*
// Text Component Examples:
<Text>Default paragraph</Text>
<Text as="span" size="sm" color="muted">Small muted span</Text>
<Text as="h1" size="4xl" weight="bold">Large heading</Text>

// Box Component Examples:
<Box>Default div</Box>
<Box as="section" display="flex" gap="md" p="lg">Flex section</Box>
<Box as="article" bg="secondary" rounded="lg" shadow="md">Article card</Box>

// Button Component Examples:
<PolymorphicButton>Default button</PolymorphicButton>
<PolymorphicButton as="a" href="/link" variant="outline">Link button</PolymorphicButton>
<PolymorphicButton as={Link} to="/route" variant="ghost">Router link</PolymorphicButton>

// Link Component Examples:
<PolymorphicLink href="/internal">Internal link</PolymorphicLink>
<PolymorphicLink href="https://external.com" external>External link</PolymorphicLink>
<PolymorphicLink as={NextLink} href="/next" variant="button">Next.js link</PolymorphicLink>

// Heading Component Examples:
<Heading>Default h2</Heading>
<Heading as="h1" level={1} color="gold">Main title</Heading>
<Heading as="h3" level={3} align="center">Centered subtitle</Heading>
*/

// === EXPORT ALL POLYMORPHIC COMPONENTS ===
export {
  Text,
  Box,
  PolymorphicButton,
  PolymorphicLink,
  Heading,
  // Export types for external use
  type PolymorphicComponentProp,
  type PolymorphicComponentPropWithRef,
  type PolymorphicRef,
};
