import React, { useState, useCallback } from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// === FLEXIBLE SIDEBAR PATTERNS WITH COLLAPSE/EXPAND ===
// Built with v0 design tokens and systematic state management

// === SIDEBAR VARIANTS ===
const sidebarVariants = cva(
  "flex flex-col bg-v0-bg-secondary border-v0-border-primary transition-all duration-v0-normal ease-v0-ease-in-out",
  {
    variants: {
      // Sidebar Position
      position: {
        left: "border-r",
        right: "border-l",
      },
      // Sidebar Size when expanded
      size: {
        sm: "w-64", // 256px
        md: "w-72", // 288px  
        lg: "w-80", // 320px
        xl: "w-96", // 384px
      },
      // Collapse State
      collapsed: {
        true: "w-16", // Collapsed to icon-only width
        false: "",
      },
      // Visibility on mobile
      mobileVisible: {
        true: "translate-x-0",
        false: "",
      },
      // Overlay mode for mobile
      overlay: {
        true: "fixed inset-y-0 z-50 shadow-v0-shadow-lg",
        false: "relative",
      },
    },
    compoundVariants: [
      // Mobile hidden states
      {
        position: "left",
        mobileVisible: false,
        overlay: true,
        class: "-translate-x-full",
      },
      {
        position: "right", 
        mobileVisible: false,
        overlay: true,
        class: "translate-x-full",
      },
      // Collapsed state overrides size
      {
        collapsed: true,
        class: "w-16",
      },
    ],
    defaultVariants: {
      position: "left",
      size: "md",
      collapsed: false,
      mobileVisible: false,
      overlay: false,
    },
  }
);

// === SIDEBAR HEADER VARIANTS ===
const sidebarHeaderVariants = cva(
  "flex items-center border-b border-v0-border-primary bg-v0-bg-tertiary/30 transition-all duration-v0-normal",
  {
    variants: {
      collapsed: {
        true: "px-v0-2 py-v0-3 justify-center",
        false: "px-v0-4 py-v0-3 justify-between",
      },
    },
    defaultVariants: {
      collapsed: false,
    },
  }
);

// === SIDEBAR CONTENT VARIANTS ===
const sidebarContentVariants = cva(
  "flex-1 overflow-y-auto overflow-x-hidden transition-all duration-v0-normal",
  {
    variants: {
      collapsed: {
        true: "px-v0-1",
        false: "px-v0-4",
      },
      padding: {
        none: "p-0",
        sm: "py-v0-2",
        md: "py-v0-4", 
        lg: "py-v0-6",
      },
    },
    defaultVariants: {
      collapsed: false,
      padding: "md",
    },
  }
);

// === MAIN SIDEBAR COMPONENT ===
interface FlexibleSidebarProps extends VariantProps<typeof sidebarVariants> {
  children: React.ReactNode;
  className?: string;
  // Collapse/Expand Control
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  // Mobile Control  
  mobileBreakpoint?: "sm" | "md" | "lg";
  onMobileVisibleChange?: (visible: boolean) => void;
  // Header Content
  header?: React.ReactNode;
  title?: string;
  // Accessibility
  'aria-label'?: string;
}

export function FlexibleSidebar({
  children,
  className,
  position = "left",
  size = "md",
  overlay = false,
  collapsible = true,
  defaultCollapsed = false,
  onCollapsedChange,
  mobileBreakpoint = "lg",
  mobileVisible = false,
  onMobileVisibleChange,
  header,
  title,
  'aria-label': ariaLabel,
  ...props
}: FlexibleSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const [internalMobileVisible, setInternalMobileVisible] = useState(false);

  const collapsed = onCollapsedChange ? defaultCollapsed : internalCollapsed;
  const isMobileVisible = onMobileVisibleChange ? mobileVisible : internalMobileVisible;

  const handleToggleCollapse = useCallback(() => {
    const newCollapsed = !collapsed;
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  }, [collapsed, onCollapsedChange]);

  const handleToggleMobile = useCallback(() => {
    const newVisible = !isMobileVisible;
    if (onMobileVisibleChange) {
      onMobileVisibleChange(newVisible);
    } else {
      setInternalMobileVisible(newVisible);
    }
  }, [isMobileVisible, onMobileVisibleChange]);

  const breakpointClass = {
    sm: "sm:relative sm:translate-x-0",
    md: "md:relative md:translate-x-0", 
    lg: "lg:relative lg:translate-x-0",
  }[mobileBreakpoint];

  return (
    <>
      {/* Mobile Overlay */}
      {overlay && isMobileVisible && (
        <div 
          className="fixed inset-0 bg-v0-dark-bg/80 z-40 lg:hidden"
          onClick={handleToggleMobile}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          sidebarVariants({
            position,
            size,
            collapsed,
            mobileVisible: isMobileVisible,
            overlay,
          }),
          overlay && breakpointClass,
          className
        )}
        aria-label={ariaLabel || `${position} sidebar`}
        {...props}
      >
        {/* Sidebar Header */}
        <div className={sidebarHeaderVariants({ collapsed })}>
          {!collapsed && (
            <div className="flex items-center space-x-v0-2 min-w-0 flex-1">
              {header || (
                title && (
                  <h2 className="text-v0-base font-v0-medium text-v0-text-primary truncate">
                    {title}
                  </h2>
                )
              )}
            </div>
          )}
          
          {/* Collapse Toggle Button */}
          {collapsible && (
            <Button
              variant="v0-ghost"
              size="icon-sm"
              onClick={handleToggleCollapse}
              className="shrink-0"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {position === "left" ? (
                collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
              ) : (
                collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {/* Mobile Close Button */}
          {overlay && (
            <Button
              variant="v0-ghost"
              size="icon-sm"
              onClick={handleToggleMobile}
              className={cn("shrink-0", breakpointClass.replace("relative", "hidden"))}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sidebar Content */}
        <div className={sidebarContentVariants({ collapsed })}>
          {children}
        </div>
      </aside>
    </>
  );
}

// === SIDEBAR NAVIGATION ITEM ===
interface SidebarNavItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  collapsed?: boolean;
  className?: string;
  badge?: React.ReactNode;
}

export function SidebarNavItem({
  children,
  icon,
  href,
  onClick,
  active = false,
  collapsed = false,
  className,
  badge,
}: SidebarNavItemProps) {
  const Component = href ? "a" : "button";
  
  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center w-full text-left transition-all duration-v0-fast",
        "rounded-md text-v0-sm font-v0-normal",
        collapsed ? "p-v0-2 justify-center" : "px-v0-3 py-v0-2 space-x-v0-3",
        active 
          ? "bg-v0-gold/10 text-v0-gold border border-v0-gold/20" 
          : "text-v0-text-secondary hover:bg-v0-bg-tertiary hover:text-v0-text-primary",
        "focus:outline-none focus:ring-2 focus:ring-v0-gold/20",
        className
      )}
      title={collapsed ? String(children) : undefined}
    >
      {icon && (
        <div className={cn(
          "shrink-0",
          collapsed ? "w-4 h-4" : "w-4 h-4",
          active ? "text-v0-gold" : "text-v0-text-muted"
        )}>
          {icon}
        </div>
      )}
      
      {!collapsed && (
        <>
          <span className="truncate flex-1">{children}</span>
          {badge && <div className="shrink-0">{badge}</div>}
        </>
      )}
    </Component>
  );
}

// === SIDEBAR SECTION ===
interface SidebarSectionProps {
  children: React.ReactNode;
  title?: string;
  collapsed?: boolean;
  className?: string;
}

export function SidebarSection({
  children,
  title,
  collapsed = false,
  className,
}: SidebarSectionProps) {
  return (
    <div className={cn("space-y-v0-1", className)}>
      {title && !collapsed && (
        <h3 className="px-v0-3 text-v0-xs font-v0-medium text-v0-text-muted uppercase tracking-v0-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-v0-1">
        {children}
      </nav>
    </div>
  );
}

// === MOBILE SIDEBAR TRIGGER ===
interface MobileSidebarTriggerProps {
  onClick: () => void;
  className?: string;
  'aria-label'?: string;
}

export function MobileSidebarTrigger({
  onClick,
  className,
  'aria-label': ariaLabel = "Open sidebar menu",
}: MobileSidebarTriggerProps) {
  return (
    <Button
      variant="v0-ghost"
      size="icon"
      onClick={onClick}
      className={cn("lg:hidden", className)}
      aria-label={ariaLabel}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

// === PRESET SIDEBAR LAYOUTS ===

// File Explorer Sidebar
interface FileExplorerSidebarProps {
  children: React.ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export function FileExplorerSidebar({
  children,
  collapsed,
  onCollapsedChange,
  className,
}: FileExplorerSidebarProps) {
  return (
    <FlexibleSidebar
      position="left"
      size="md"
      title="Explorer"
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      aria-label="File explorer"
      className={className}
    >
      {children}
    </FlexibleSidebar>
  );
}

// AI Assistant Sidebar
interface AIAssistantSidebarProps {
  children: React.ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export function AIAssistantSidebar({
  children,
  collapsed,
  onCollapsedChange,
  className,
}: AIAssistantSidebarProps) {
  return (
    <FlexibleSidebar
      position="right"
      size="lg"
      title="AI Assistant"
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      aria-label="AI assistant panel"
      className={className}
    >
      {children}
    </FlexibleSidebar>
  );
}

// === EXPORT ALL COMPONENTS ===
export {
  FlexibleSidebar,
  SidebarNavItem,
  SidebarSection,
  MobileSidebarTrigger,
  FileExplorerSidebar,
  AIAssistantSidebar,
  sidebarVariants,
  sidebarHeaderVariants,
  sidebarContentVariants,
};
