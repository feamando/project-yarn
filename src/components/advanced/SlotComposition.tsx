import React, { createContext, useContext, useMemo } from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// === SLOT-BASED COMPOSITION PATTERNS ===
// Flexible layout composition using slot-based architecture

// === SLOT CONTEXT ===
// Context for managing slot assignments and layout configuration

interface SlotContextValue {
  slots: Record<string, React.ReactNode>;
  registerSlot: (name: string, content: React.ReactNode) => void;
  getSlot: (name: string) => React.ReactNode;
  hasSlot: (name: string) => boolean;
}

const SlotContext = createContext<SlotContextValue | null>(null);

function useSlotContext() {
  const context = useContext(SlotContext);
  if (!context) {
    throw new Error('Slot components must be used within a SlotProvider');
  }
  return context;
}

// === SLOT PROVIDER ===
// Provides slot context for nested slot components

interface SlotProviderProps {
  children: React.ReactNode;
}

export function SlotProvider({ children }: SlotProviderProps) {
  const [slots, setSlots] = React.useState<Record<string, React.ReactNode>>({});

  const registerSlot = React.useCallback((name: string, content: React.ReactNode) => {
    setSlots(prev => ({ ...prev, [name]: content }));
  }, []);

  const getSlot = React.useCallback((name: string) => {
    return slots[name] || null;
  }, [slots]);

  const hasSlot = React.useCallback((name: string) => {
    return name in slots && slots[name] !== null && slots[name] !== undefined;
  }, [slots]);

  const contextValue = useMemo(() => ({
    slots,
    registerSlot,
    getSlot,
    hasSlot,
  }), [slots, registerSlot, getSlot, hasSlot]);

  return (
    <SlotContext.Provider value={contextValue}>
      {children}
    </SlotContext.Provider>
  );
}

// === SLOT COMPONENT ===
// Defines a named slot that can be filled with content

interface SlotProps {
  name: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function Slot({ name, children, fallback, className }: SlotProps) {
  const { getSlot, hasSlot } = useSlotContext();

  // Register children as slot content if provided
  React.useEffect(() => {
    if (children) {
      const { registerSlot } = useSlotContext();
      registerSlot(name, children);
    }
  }, [name, children]);

  const slotContent = getSlot(name);
  const content = slotContent || fallback || null;

  if (!content) return null;

  return (
    <div className={className} data-slot={name}>
      {content}
    </div>
  );
}

// === SLOT FILL COMPONENT ===
// Fills a named slot with content

interface SlotFillProps {
  slot: string;
  children: React.ReactNode;
}

export function SlotFill({ slot, children }: SlotFillProps) {
  const { registerSlot } = useSlotContext();

  React.useEffect(() => {
    registerSlot(slot, children);
    
    // Cleanup on unmount
    return () => {
      registerSlot(slot, null);
    };
  }, [slot, children, registerSlot]);

  return null; // This component doesn't render anything directly
}

// === LAYOUT TEMPLATES ===
// Pre-built layout templates using slot composition

// === CARD LAYOUT ===
const cardLayoutVariants = cva(
  "bg-v0-bg-secondary border border-v0-border-primary rounded-lg overflow-hidden transition-all duration-v0-fast",
  {
    variants: {
      size: {
        sm: "p-v0-3",
        md: "p-v0-4",
        lg: "p-v0-6",
        xl: "p-v0-8",
      },
      elevation: {
        none: "shadow-none",
        sm: "shadow-v0-shadow-sm",
        md: "shadow-v0-shadow",
        lg: "shadow-v0-shadow-md",
        xl: "shadow-v0-shadow-lg",
      },
      interactive: {
        true: "hover:shadow-v0-shadow-md hover:border-v0-gold/50 cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      elevation: "sm",
      interactive: false,
    },
  }
);

interface CardLayoutProps extends VariantProps<typeof cardLayoutVariants> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CardLayout({ 
  children, 
  className, 
  size, 
  elevation, 
  interactive,
  onClick 
}: CardLayoutProps) {
  return (
    <SlotProvider>
      <div 
        className={cn(
          cardLayoutVariants({ size, elevation, interactive }),
          className
        )}
        onClick={onClick}
      >
        {/* Header Slot */}
        <Slot 
          name="header" 
          className="mb-v0-4 pb-v0-3 border-b border-v0-border-secondary"
        />
        
        {/* Media Slot */}
        <Slot 
          name="media" 
          className="mb-v0-4 -mx-v0-4 -mt-v0-4"
        />
        
        {/* Content Slot */}
        <Slot 
          name="content" 
          className="mb-v0-4"
        />
        
        {/* Footer Slot */}
        <Slot 
          name="footer" 
          className="mt-v0-4 pt-v0-3 border-t border-v0-border-secondary"
        />
        
        {children}
      </div>
    </SlotProvider>
  );
}

// === SIDEBAR LAYOUT ===
const sidebarLayoutVariants = cva(
  "flex h-full",
  {
    variants: {
      direction: {
        left: "flex-row",
        right: "flex-row-reverse",
      },
      sidebarWidth: {
        sm: "[&>[data-slot=sidebar]]:w-48",
        md: "[&>[data-slot=sidebar]]:w-64",
        lg: "[&>[data-slot=sidebar]]:w-80",
        xl: "[&>[data-slot=sidebar]]:w-96",
      },
      gap: {
        none: "gap-0",
        sm: "gap-v0-2",
        md: "gap-v0-4",
        lg: "gap-v0-6",
      },
    },
    defaultVariants: {
      direction: "left",
      sidebarWidth: "md",
      gap: "md",
    },
  }
);

interface SidebarLayoutProps extends VariantProps<typeof sidebarLayoutVariants> {
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function SidebarLayout({ 
  children, 
  className, 
  direction, 
  sidebarWidth, 
  gap,
  collapsible = false,
  collapsed = false,
  onToggle 
}: SidebarLayoutProps) {
  return (
    <SlotProvider>
      <div className={cn(sidebarLayoutVariants({ direction, sidebarWidth, gap }), className)}>
        {/* Sidebar Slot */}
        <Slot 
          name="sidebar" 
          className={cn(
            "bg-v0-bg-tertiary border-r border-v0-border-primary flex-shrink-0 transition-all duration-v0-normal",
            collapsed && collapsible && "w-12 overflow-hidden"
          )}
        />
        
        {/* Main Content Slot */}
        <Slot 
          name="main" 
          className="flex-1 min-w-0 bg-v0-dark-bg"
        />
        
        {/* Header Slot (spans full width) */}
        <Slot 
          name="header" 
          className="absolute top-0 left-0 right-0 z-10 bg-v0-bg-secondary border-b border-v0-border-primary"
        />
        
        {children}
      </div>
    </SlotProvider>
  );
}

// === MODAL LAYOUT ===
const modalLayoutVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center",
  {
    variants: {
      backdrop: {
        blur: "backdrop-blur-sm",
        dark: "bg-black/50",
        light: "bg-white/50",
        none: "",
      },
      size: {
        sm: "[&>[data-slot=content]]:max-w-sm",
        md: "[&>[data-slot=content]]:max-w-md",
        lg: "[&>[data-slot=content]]:max-w-lg",
        xl: "[&>[data-slot=content]]:max-w-xl",
        "2xl": "[&>[data-slot=content]]:max-w-2xl",
        full: "[&>[data-slot=content]]:max-w-full [&>[data-slot=content]]:h-full",
      },
      animation: {
        fade: "animate-in fade-in duration-v0-normal",
        scale: "animate-in fade-in zoom-in-95 duration-v0-normal",
        slide: "animate-in fade-in slide-in-from-bottom-4 duration-v0-normal",
      },
    },
    defaultVariants: {
      backdrop: "dark",
      size: "md",
      animation: "scale",
    },
  }
);

interface ModalLayoutProps extends VariantProps<typeof modalLayoutVariants> {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onClose?: () => void;
}

export function ModalLayout({ 
  children, 
  className, 
  backdrop, 
  size, 
  animation,
  open = true,
  onClose 
}: ModalLayoutProps) {
  if (!open) return null;

  return (
    <SlotProvider>
      <div 
        className={cn(modalLayoutVariants({ backdrop, size, animation }), className)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
      >
        {/* Content Slot */}
        <Slot 
          name="content" 
          className="bg-v0-dark-bg border border-v0-border-primary rounded-lg shadow-v0-shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
        />
        
        {children}
      </div>
    </SlotProvider>
  );
}

// === GRID LAYOUT ===
const gridLayoutVariants = cva(
  "grid gap-v0-4",
  {
    variants: {
      columns: {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        auto: "grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
      },
      gap: {
        none: "gap-0",
        sm: "gap-v0-2",
        md: "gap-v0-4",
        lg: "gap-v0-6",
        xl: "gap-v0-8",
      },
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
      },
    },
    defaultVariants: {
      columns: "auto",
      gap: "md",
      align: "stretch",
    },
  }
);

interface GridLayoutProps extends VariantProps<typeof gridLayoutVariants> {
  children: React.ReactNode;
  className?: string;
}

export function GridLayout({ 
  children, 
  className, 
  columns, 
  gap, 
  align 
}: GridLayoutProps) {
  return (
    <SlotProvider>
      <div className={cn(gridLayoutVariants({ columns, gap, align }), className)}>
        {/* Items are rendered directly as children */}
        {children}
      </div>
    </SlotProvider>
  );
}

// === STACK LAYOUT ===
const stackLayoutVariants = cva(
  "flex",
  {
    variants: {
      direction: {
        vertical: "flex-col",
        horizontal: "flex-row",
      },
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
      },
      justify: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly",
      },
      gap: {
        none: "gap-0",
        xs: "gap-v0-1",
        sm: "gap-v0-2",
        md: "gap-v0-4",
        lg: "gap-v0-6",
        xl: "gap-v0-8",
        "2xl": "gap-v0-12",
      },
      wrap: {
        true: "flex-wrap",
        false: "flex-nowrap",
      },
    },
    defaultVariants: {
      direction: "vertical",
      align: "stretch",
      justify: "start",
      gap: "md",
      wrap: false,
    },
  }
);

interface StackLayoutProps extends VariantProps<typeof stackLayoutVariants> {
  children: React.ReactNode;
  className?: string;
}

export function StackLayout({ 
  children, 
  className, 
  direction, 
  align, 
  justify, 
  gap, 
  wrap 
}: StackLayoutProps) {
  return (
    <div className={cn(stackLayoutVariants({ direction, align, justify, gap, wrap }), className)}>
      {children}
    </div>
  );
}

// === USAGE EXAMPLES ===
/*
// Card Layout with Slots:
<CardLayout size="lg" elevation="md" interactive>
  <SlotFill slot="header">
    <h3 className="text-lg font-semibold">Card Title</h3>
  </SlotFill>
  
  <SlotFill slot="media">
    <img src="/image.jpg" alt="Card image" className="w-full h-48 object-cover" />
  </SlotFill>
  
  <SlotFill slot="content">
    <p>This is the main content of the card.</p>
  </SlotFill>
  
  <SlotFill slot="footer">
    <div className="flex justify-between">
      <button>Cancel</button>
      <button>Save</button>
    </div>
  </SlotFill>
</CardLayout>

// Sidebar Layout:
<SidebarLayout direction="left" sidebarWidth="lg" collapsible>
  <SlotFill slot="sidebar">
    <nav>Navigation items</nav>
  </SlotFill>
  
  <SlotFill slot="main">
    <main>Main content area</main>
  </SlotFill>
  
  <SlotFill slot="header">
    <header>App header</header>
  </SlotFill>
</SidebarLayout>

// Modal Layout:
<ModalLayout size="lg" backdrop="blur" open={isOpen} onClose={() => setIsOpen(false)}>
  <SlotFill slot="content">
    <div className="p-6">
      <h2>Modal Title</h2>
      <p>Modal content goes here</p>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => setIsOpen(false)}>Close</button>
      </div>
    </div>
  </SlotFill>
</ModalLayout>

// Grid Layout:
<GridLayout columns={3} gap="lg">
  <div>Grid item 1</div>
  <div>Grid item 2</div>
  <div>Grid item 3</div>
</GridLayout>

// Stack Layout:
<StackLayout direction="horizontal" justify="between" align="center">
  <div>Left item</div>
  <div>Center item</div>
  <div>Right item</div>
</StackLayout>
*/

// === EXPORT ALL SLOT COMPONENTS ===
export {
  SlotProvider,
  Slot,
  SlotFill,
  CardLayout,
  SidebarLayout,
  ModalLayout,
  GridLayout,
  StackLayout,
};
