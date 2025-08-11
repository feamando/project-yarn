import * as React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";

// === IDE LAYOUT COMPOSITION PATTERNS ===
// Reusable three-panel IDE layout with v0 design tokens

interface IDELayoutProps {
  children?: React.ReactNode;
  className?: string;
}

interface IDEPanelProps {
  children: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
  'aria-label'?: string;
  role?: string;
}

interface IDEResizeHandleProps {
  'aria-label'?: string;
  className?: string;
}

// === MAIN IDE LAYOUT CONTAINER ===
export function IDELayout({ children, className }: IDELayoutProps) {
  return (
    <div className={cn(
      "h-full w-full bg-v0-dark-bg text-v0-text-primary",
      "flex flex-col overflow-hidden",
      className
    )}>
      {children}
    </div>
  );
}

// === THREE-PANEL GROUP ===
export function IDEPanelGroup({ children, className }: IDELayoutProps) {
  return (
    <PanelGroup 
      direction="horizontal" 
      className={cn("flex-1", className)}
    >
      {children}
    </PanelGroup>
  );
}

// === LEFT PANEL (File Explorer) ===
export function IDELeftPanel({ 
  children, 
  defaultSize = 20, 
  minSize = 15, 
  maxSize = 35,
  className,
  'aria-label': ariaLabel = "File explorer",
  role = "navigation"
}: IDEPanelProps) {
  return (
    <Panel defaultSize={defaultSize} minSize={minSize} maxSize={maxSize}>
      <nav 
        className={cn(
          "h-full bg-v0-dark-bg/20 border-r border-v0-border-primary",
          "flex flex-col overflow-hidden",
          className
        )}
        role={role}
        aria-label={ariaLabel}
      >
        {children}
      </nav>
    </Panel>
  );
}

// === CENTER PANEL (Editor) ===
export function IDECenterPanel({ 
  children, 
  defaultSize = 60, 
  minSize = 40, 
  maxSize,
  className,
  'aria-label': ariaLabel = "Main editor",
  role = "main"
}: IDEPanelProps) {
  return (
    <Panel defaultSize={defaultSize} minSize={minSize} maxSize={maxSize}>
      <section 
        className={cn(
          "h-full flex flex-col bg-v0-dark-bg",
          className
        )}
        aria-label={ariaLabel}
        role={role}
      >
        {children}
      </section>
    </Panel>
  );
}

// === RIGHT PANEL (AI Assistant) ===
export function IDERightPanel({ 
  children, 
  defaultSize = 20, 
  minSize = 15, 
  maxSize = 35,
  className,
  'aria-label': ariaLabel = "AI assistant",
  role = "complementary"
}: IDEPanelProps) {
  return (
    <Panel defaultSize={defaultSize} minSize={minSize} maxSize={maxSize}>
      <aside 
        className={cn(
          "h-full bg-v0-bg-secondary/10 border-l border-v0-border-primary",
          "flex flex-col overflow-hidden",
          className
        )}
        role={role}
        aria-label={ariaLabel}
      >
        {children}
      </aside>
    </Panel>
  );
}

// === RESIZE HANDLE ===
export function IDEResizeHandle({ 
  'aria-label': ariaLabel,
  className 
}: IDEResizeHandleProps) {
  return (
    <PanelResizeHandle 
      className={cn(
        "w-2 bg-v0-border-primary",
        "hover:bg-v0-gold/20 focus:bg-v0-gold/30 active:bg-v0-gold/40",
        "transition-all duration-v0-fast",
        "focus:outline-none focus:ring-2 focus:ring-v0-gold/50",
        className
      )}
      aria-label={ariaLabel}
    />
  );
}

// === PANEL HEADER ===
interface IDEPanelHeaderProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}

export function IDEPanelHeader({ 
  children, 
  className, 
  icon, 
  title 
}: IDEPanelHeaderProps) {
  return (
    <header className={cn(
      "p-v0-4 border-b border-v0-border-primary bg-v0-bg-secondary/30",
      "flex items-center space-x-v0-2",
      className
    )}>
      {icon && (
        <div className="text-v0-gold" aria-hidden="true">
          {icon}
        </div>
      )}
      {title && (
        <h2 className="font-medium text-v0-sm text-v0-text-primary">
          {title}
        </h2>
      )}
      {children}
    </header>
  );
}

// === PANEL CONTENT ===
interface IDEPanelContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function IDEPanelContent({ 
  children, 
  className, 
  padding = true 
}: IDEPanelContentProps) {
  return (
    <div className={cn(
      "flex-1 overflow-auto",
      padding && "p-v0-4",
      className
    )}>
      {children}
    </div>
  );
}

// === EDITOR HEADER (Breadcrumb + Status) ===
interface IDEEditorHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export function IDEEditorHeader({ children, className }: IDEEditorHeaderProps) {
  return (
    <div className={cn(
      "border-b border-v0-border-primary bg-v0-dark-bg",
      "px-v0-4 py-v0-2",
      "flex items-center justify-between",
      className
    )}>
      {children}
    </div>
  );
}

// === STATUS BAR ===
interface IDEStatusBarProps {
  children: React.ReactNode;
  className?: string;
}

export function IDEStatusBar({ children, className }: IDEStatusBarProps) {
  return (
    <footer className={cn(
      "flex items-center justify-between",
      "p-v0-2 text-v0-xs text-v0-text-muted",
      "border-t border-v0-border-primary bg-v0-bg-secondary/30",
      className
    )}>
      {children}
    </footer>
  );
}

// === COMPLETE IDE LAYOUT COMPOSITION ===
interface CompleteIDELayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  statusBar?: React.ReactNode;
  className?: string;
  leftPanelProps?: Partial<IDEPanelProps>;
  centerPanelProps?: Partial<IDEPanelProps>;
  rightPanelProps?: Partial<IDEPanelProps>;
}

export function CompleteIDELayout({
  leftPanel,
  centerPanel,
  rightPanel,
  statusBar,
  className,
  leftPanelProps = {},
  centerPanelProps = {},
  rightPanelProps = {}
}: CompleteIDELayoutProps) {
  return (
    <IDELayout className={className}>
      <IDEPanelGroup>
        <IDELeftPanel {...leftPanelProps}>
          {leftPanel}
        </IDELeftPanel>
        
        <IDEResizeHandle aria-label="Resize file explorer panel" />
        
        <IDECenterPanel {...centerPanelProps}>
          {centerPanel}
        </IDECenterPanel>
        
        <IDEResizeHandle aria-label="Resize editor panel" />
        
        <IDERightPanel {...rightPanelProps}>
          {rightPanel}
        </IDERightPanel>
      </IDEPanelGroup>
      
      {statusBar && (
        <IDEStatusBar>
          {statusBar}
        </IDEStatusBar>
      )}
    </IDELayout>
  );
}


