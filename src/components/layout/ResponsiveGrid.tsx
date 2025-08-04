import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// === RESPONSIVE GRID SYSTEM WITH BREAKPOINT TOKENS ===
// Built with v0 design tokens and systematic breakpoint management

// === GRID CONTAINER VARIANTS ===
const gridVariants = cva(
  "grid w-full",
  {
    variants: {
      // Grid Column System (1-12 columns)
      cols: {
        1: "grid-cols-1",
        2: "grid-cols-2", 
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
        7: "grid-cols-7",
        8: "grid-cols-8",
        9: "grid-cols-9",
        10: "grid-cols-10",
        11: "grid-cols-11",
        12: "grid-cols-12",
        auto: "grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
        "auto-sm": "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]",
        "auto-lg": "grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
      },
      // Responsive Breakpoint Columns (sm, md, lg, xl)
      smCols: {
        1: "sm:grid-cols-1",
        2: "sm:grid-cols-2",
        3: "sm:grid-cols-3",
        4: "sm:grid-cols-4",
        6: "sm:grid-cols-6",
        12: "sm:grid-cols-12",
        auto: "sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]",
      },
      mdCols: {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
        6: "md:grid-cols-6",
        8: "md:grid-cols-8",
        12: "md:grid-cols-12",
        auto: "md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
      },
      lgCols: {
        1: "lg:grid-cols-1",
        2: "lg:grid-cols-2",
        3: "lg:grid-cols-3",
        4: "lg:grid-cols-4",
        6: "lg:grid-cols-6",
        8: "lg:grid-cols-8",
        12: "lg:grid-cols-12",
        auto: "lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
      },
      xlCols: {
        1: "xl:grid-cols-1",
        2: "xl:grid-cols-2",
        3: "xl:grid-cols-3",
        4: "xl:grid-cols-4",
        6: "xl:grid-cols-6",
        8: "xl:grid-cols-8",
        12: "xl:grid-cols-12",
        auto: "xl:grid-cols-[repeat(auto-fit,minmax(350px,1fr))]",
      },
      // Gap System using v0 spacing tokens
      gap: {
        none: "gap-0",
        xs: "gap-v0-1",
        sm: "gap-v0-2", 
        md: "gap-v0-4",
        lg: "gap-v0-6",
        xl: "gap-v0-8",
        "2xl": "gap-v0-12",
      },
      // Alignment Options
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
      },
      justify: {
        start: "justify-items-start",
        center: "justify-items-center", 
        end: "justify-items-end",
        stretch: "justify-items-stretch",
      },
    },
    defaultVariants: {
      cols: 12,
      gap: "md",
      align: "stretch",
      justify: "stretch",
    },
  }
);

// === GRID ITEM VARIANTS ===
const gridItemVariants = cva(
  "w-full",
  {
    variants: {
      // Column Span (1-12)
      span: {
        1: "col-span-1",
        2: "col-span-2",
        3: "col-span-3", 
        4: "col-span-4",
        5: "col-span-5",
        6: "col-span-6",
        7: "col-span-7",
        8: "col-span-8",
        9: "col-span-9",
        10: "col-span-10",
        11: "col-span-11",
        12: "col-span-12",
        full: "col-span-full",
        auto: "col-auto",
      },
      // Responsive Column Spans
      smSpan: {
        1: "sm:col-span-1",
        2: "sm:col-span-2",
        3: "sm:col-span-3",
        4: "sm:col-span-4",
        6: "sm:col-span-6",
        12: "sm:col-span-12",
        full: "sm:col-span-full",
        auto: "sm:col-auto",
      },
      mdSpan: {
        1: "md:col-span-1",
        2: "md:col-span-2",
        3: "md:col-span-3",
        4: "md:col-span-4",
        6: "md:col-span-6",
        8: "md:col-span-8",
        12: "md:col-span-12",
        full: "md:col-span-full",
        auto: "md:col-auto",
      },
      lgSpan: {
        1: "lg:col-span-1",
        2: "lg:col-span-2",
        3: "lg:col-span-3",
        4: "lg:col-span-4",
        6: "lg:col-span-6",
        8: "lg:col-span-8",
        12: "lg:col-span-12",
        full: "lg:col-span-full",
        auto: "lg:col-auto",
      },
      xlSpan: {
        1: "xl:col-span-1",
        2: "xl:col-span-2",
        3: "xl:col-span-3",
        4: "xl:col-span-4",
        6: "xl:col-span-6",
        8: "xl:col-span-8",
        12: "xl:col-span-12",
        full: "xl:col-span-full",
        auto: "xl:col-auto",
      },
      // Row Span
      rowSpan: {
        1: "row-span-1",
        2: "row-span-2",
        3: "row-span-3",
        4: "row-span-4",
        5: "row-span-5",
        6: "row-span-6",
        full: "row-span-full",
        auto: "row-auto",
      },
    },
    defaultVariants: {
      span: "auto",
    },
  }
);

// === GRID CONTAINER COMPONENT ===
interface ResponsiveGridProps extends VariantProps<typeof gridVariants> {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ResponsiveGrid({
  children,
  className,
  cols,
  smCols,
  mdCols,
  lgCols,
  xlCols,
  gap,
  align,
  justify,
  as: Component = "div",
  ...props
}: ResponsiveGridProps) {
  return (
    <Component
      className={cn(
        gridVariants({
          cols,
          smCols,
          mdCols,
          lgCols,
          xlCols,
          gap,
          align,
          justify,
        }),
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// === GRID ITEM COMPONENT ===
interface GridItemProps extends VariantProps<typeof gridItemVariants> {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function GridItem({
  children,
  className,
  span,
  smSpan,
  mdSpan,
  lgSpan,
  xlSpan,
  rowSpan,
  as: Component = "div",
  ...props
}: GridItemProps) {
  return (
    <Component
      className={cn(
        gridItemVariants({
          span,
          smSpan,
          mdSpan,
          lgSpan,
          xlSpan,
          rowSpan,
        }),
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// === PRESET GRID LAYOUTS ===

// Dashboard Grid (3-column responsive)
interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <ResponsiveGrid
      cols={1}
      smCols={2}
      lgCols={3}
      gap="lg"
      className={cn("p-v0-6", className)}
    >
      {children}
    </ResponsiveGrid>
  );
}

// Card Grid (Auto-fit responsive cards)
interface CardGridProps {
  children: React.ReactNode;
  className?: string;
  minCardWidth?: "sm" | "md" | "lg";
}

export function CardGrid({ 
  children, 
  className, 
  minCardWidth = "md" 
}: CardGridProps) {
  const autoColsMap = {
    sm: "auto-sm" as const,
    md: "auto" as const,
    lg: "auto-lg" as const,
  };

  return (
    <ResponsiveGrid
      cols={autoColsMap[minCardWidth]}
      gap="md"
      className={cn("p-v0-4", className)}
    >
      {children}
    </ResponsiveGrid>
  );
}

// Sidebar Layout Grid (Sidebar + Main content)
interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  className?: string;
  sidebarWidth?: "sm" | "md" | "lg";
}

export function SidebarLayout({ 
  sidebar, 
  main, 
  className,
  sidebarWidth = "md"
}: SidebarLayoutProps) {
  const sidebarSpans = {
    sm: { span: 3 as const, mdSpan: 2 as const },
    md: { span: 4 as const, mdSpan: 3 as const },
    lg: { span: 6 as const, mdSpan: 4 as const },
  };

  const mainSpans = {
    sm: { span: 9 as const, mdSpan: 10 as const },
    md: { span: 8 as const, mdSpan: 9 as const },
    lg: { span: 6 as const, mdSpan: 8 as const },
  };

  return (
    <ResponsiveGrid
      cols={12}
      gap="lg"
      className={cn("h-full", className)}
    >
      <GridItem {...sidebarSpans[sidebarWidth]}>
        {sidebar}
      </GridItem>
      <GridItem {...mainSpans[sidebarWidth]}>
        {main}
      </GridItem>
    </ResponsiveGrid>
  );
}

// === EXPORT ALL COMPONENTS ===
export {
  ResponsiveGrid,
  GridItem,
  DashboardGrid,
  CardGrid,
  SidebarLayout,
  gridVariants,
  gridItemVariants,
};
