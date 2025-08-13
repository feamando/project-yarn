import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

// === CARD/PANEL COMPOSITION PATTERNS ===
// Built with v0 design tokens and consistent elevation system

// === CARD VARIANTS ===
const cardVariants = cva(
  "bg-v0-dark-bg border border-v0-border-primary rounded-lg overflow-hidden transition-all duration-v0-normal",
  {
    variants: {
      // Elevation System (consistent shadows)
      elevation: {
        none: "shadow-none",
        sm: "shadow-v0-shadow-sm",
        md: "shadow-v0-shadow",
        lg: "shadow-v0-shadow-md",
        xl: "shadow-v0-shadow-lg",
        "2xl": "shadow-v0-shadow-xl",
      },
      // Card Size
      size: {
        sm: "p-v0-3",
        md: "p-v0-4",
        lg: "p-v0-6",
        xl: "p-v0-8",
      },
      // Card Type/Variant
      variant: {
        default: "bg-v0-dark-bg border-v0-border-primary",
        elevated: "bg-v0-bg-secondary border-v0-border-primary",
        outlined: "bg-transparent border-v0-border-primary border-2",
        filled: "bg-v0-bg-secondary/50 border-v0-border-secondary",
        accent: "bg-v0-gold/5 border-v0-gold/20",
        success: "bg-v0-teal/5 border-v0-teal/20",
        warning: "bg-yellow-500/5 border-yellow-500/20",
        error: "bg-v0-red/5 border-v0-red/20",
      },
      // Interactive States
      interactive: {
        none: "",
        hover: "hover:shadow-v0-shadow-md hover:border-v0-gold/30 cursor-pointer",
        clickable: "hover:shadow-v0-shadow-md hover:border-v0-gold/30 active:scale-v0-98 cursor-pointer",
      },
    },
    defaultVariants: {
      elevation: "md",
      size: "md",
      variant: "default",
      interactive: "none",
    },
  }
);

// === CARD HEADER VARIANTS ===
const cardHeaderVariants = cva(
  "flex items-center justify-between border-b border-v0-border-primary",
  {
    variants: {
      size: {
        sm: "px-v0-3 py-v0-2",
        md: "px-v0-4 py-v0-3",
        lg: "px-v0-6 py-v0-4",
        xl: "px-v0-8 py-v0-5",
      },
      variant: {
        default: "bg-v0-bg-secondary/30",
        accent: "bg-v0-gold/10",
        success: "bg-v0-teal/10",
        warning: "bg-yellow-500/10",
        error: "bg-v0-red/10",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

// === CARD CONTENT VARIANTS ===
const cardContentVariants = cva(
  "",
  {
    variants: {
      size: {
        sm: "p-v0-3",
        md: "p-v0-4",
        lg: "p-v0-6",
        xl: "p-v0-8",
      },
      spacing: {
        none: "space-y-0",
        sm: "space-y-v0-2",
        md: "space-y-v0-4",
        lg: "space-y-v0-6",
      },
    },
    defaultVariants: {
      size: "md",
      spacing: "md",
    },
  }
);

// === MAIN CARD COMPOSITION ===
interface CardCompositionProps extends VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

export function CardComposition({
  children,
  className,
  elevation = "md",
  size = "md",
  variant = "default",
  interactive = "none",
  onClick,
  'aria-label': ariaLabel,
  ...props
}: CardCompositionProps) {
  const Component = onClick ? "button" : "div";
  
  return (
    <Component
      className={cn(
        cardVariants({ elevation, size, variant, interactive }),
        className
      )}
      onClick={onClick}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </Component>
  );
}

// === CARD HEADER ===
interface CardHeaderProps extends VariantProps<typeof cardHeaderVariants> {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  children,
  title,
  subtitle,
  icon,
  actions,
  size = "md",
  variant = "default",
  className,
}: CardHeaderProps) {
  return (
    <div className={cn(cardHeaderVariants({ size, variant }), className)}>
      <div className="flex items-center space-x-v0-3 min-w-0 flex-1">
        {icon && (
          <div className="shrink-0 text-v0-gold">
            {icon}
          </div>
        )}
        
        {(title || subtitle) && (
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-v0-base font-v0-semibold text-v0-text-primary truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-v0-sm text-v0-text-muted truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        {children}
      </div>
      
      {actions && (
        <div className="shrink-0 flex items-center space-x-v0-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// === CARD CONTENT ===
interface CardContentProps extends VariantProps<typeof cardContentVariants> {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({
  children,
  size = "md",
  spacing = "md",
  className,
}: CardContentProps) {
  return (
    <div className={cn(cardContentVariants({ size, spacing }), className)}>
      {children}
    </div>
  );
}

// === CARD FOOTER ===
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function CardFooter({
  children,
  className,
  size = "md",
}: CardFooterProps) {
  const sizeClasses = {
    sm: "px-v0-3 py-v0-2",
    md: "px-v0-4 py-v0-3",
    lg: "px-v0-6 py-v0-4",
    xl: "px-v0-8 py-v0-5",
  };

  return (
    <div className={cn(
      "border-t border-v0-border-primary bg-v0-bg-secondary/20",
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
}

// === PRESET CARD COMPOSITIONS ===

// Status Card
interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "accent" | "success" | "warning" | "error";
  className?: string;
}

export function StatusCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = "default",
  className,
}: StatusCardProps) {
  const trendColors = {
    up: "text-v0-teal",
    down: "text-v0-red",
    neutral: "text-v0-text-muted",
  };

  return (
    <CardComposition
      variant={variant}
      elevation="md"
      size="md"
      className={className}
    >
      <CardContent size="md" spacing="sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-v0-sm text-v0-text-muted truncate">{title}</p>
            <p className="text-v0-2xl font-v0-bold text-v0-text-primary">{value}</p>
            {subtitle && (
              <p className="text-v0-xs text-v0-text-muted">{subtitle}</p>
            )}
          </div>
          
          {icon && (
            <div className="shrink-0 text-v0-gold ml-v0-3">
              {icon}
            </div>
          )}
        </div>
        
        {trend && trendValue && (
          <div className={cn("text-v0-xs font-v0-medium", trendColors[trend])}>
            {trendValue}
          </div>
        )}
      </CardContent>
    </CardComposition>
  );
}

// Feature Card
interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  icon,
  action,
  href,
  onClick,
  className,
}: FeatureCardProps) {
  return (
    <CardComposition
      variant="elevated"
      elevation="md"
      interactive={onClick || href ? "hover" : "none"}
      onClick={onClick}
      className={className}
    >
      <CardContent size="lg" spacing="md">
        <div className="flex items-start space-x-v0-4">
          {icon && (
            <div className="shrink-0 text-v0-gold">
              {icon}
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <h3 className="text-v0-lg font-v0-semibold text-v0-text-primary mb-v0-2">
              {title}
            </h3>
            <p className="text-v0-sm text-v0-text-secondary leading-relaxed">
              {description}
            </p>
            
            {action && (
              <div className="mt-v0-4">
                {action}
              </div>
            )}
          </div>
          
          {(onClick || href) && (
            <ChevronRight className="h-4 w-4 text-v0-text-muted shrink-0" />
          )}
        </div>
      </CardContent>
    </CardComposition>
  );
}

// List Card
interface ListCardProps {
  title?: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    onClick?: () => void;
  }>;
  className?: string;
  showDividers?: boolean;
}

export function ListCard({
  title,
  items,
  className,
}: ListCardProps) {
  return (
    <CardComposition
      variant="default"
      elevation="md"
      size="sm"
      className={className}
    >
      {title && (
        <CardHeader title={title} size="sm" />
      )}
      
      <div className="divide-y divide-v0-border-primary">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between p-v0-3",
              item.onClick && "hover:bg-v0-bg-secondary/30 cursor-pointer transition-colors duration-v0-fast"
            )}
            onClick={item.onClick}
          >
            <div className="flex items-center space-x-v0-3 min-w-0 flex-1">
              {item.icon && (
                <div className="shrink-0 text-v0-text-muted">
                  {item.icon}
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <p className="text-v0-sm font-v0-medium text-v0-text-primary truncate">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-v0-xs text-v0-text-muted truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>
            
            {item.action && (
              <div className="shrink-0">
                {item.action}
              </div>
            )}
          </div>
        ))}
      </div>
    </CardComposition>
  );
}

// Settings Card
interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({
  title,
  description,
  children,
  className,
}: SettingsCardProps) {
  return (
    <CardComposition
      variant="outlined"
      elevation="sm"
      size="md"
      className={className}
    >
      <CardHeader
        title={title}
        subtitle={description}
        size="md"
      />
      
      <CardContent size="md" spacing="md">
        {children}
      </CardContent>
    </CardComposition>
  );
}

// === EXPORT ALL COMPONENTS ===
// All components are already exported inline above
