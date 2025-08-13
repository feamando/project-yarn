import * as React from "react"
import { cn } from "@/lib/utils"

interface ThreePanelLayoutProps {
  children: React.ReactNode
  className?: string
}

interface PanelProps {
  children: React.ReactNode
  className?: string
  width?: "narrow" | "medium" | "wide" | "flexible"
  sticky?: boolean
}

const ThreePanelLayout = React.forwardRef<HTMLDivElement, ThreePanelLayoutProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-screen bg-v0-dark-bg text-v0-text-primary overflow-hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ThreePanelLayout.displayName = "ThreePanelLayout"

const LeftPanel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ children, className, width = "narrow", sticky = false, ...props }, ref) => {
    const widthClasses = {
      narrow: "w-64",
      medium: "w-80",
      wide: "w-96",
      flexible: "flex-1"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-v0-bg-secondary border-r border-v0-border-primary flex flex-col overflow-hidden",
          widthClasses[width],
          sticky && "sticky top-0 h-screen",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
LeftPanel.displayName = "LeftPanel"

const CenterPanel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ children, className, sticky = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 bg-v0-dark-bg flex flex-col overflow-hidden",
          sticky && "sticky top-0 h-screen",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CenterPanel.displayName = "CenterPanel"

const RightPanel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ children, className, width = "narrow", sticky = false, ...props }, ref) => {
    const widthClasses = {
      narrow: "w-64",
      medium: "w-80",
      wide: "w-96",
      flexible: "flex-1"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-v0-bg-tertiary border-l border-v0-border-primary flex flex-col overflow-hidden",
          widthClasses[width],
          sticky && "sticky top-0 h-screen",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
RightPanel.displayName = "RightPanel"

const PanelHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "sticky top-0 z-40 p-4 border-b border-v0-border-primary bg-inherit",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PanelHeader.displayName = "PanelHeader"

const PanelContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 overflow-y-auto scrollbar-custom p-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PanelContent.displayName = "PanelContent"

const PanelFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "sticky bottom-0 p-4 border-t border-v0-border-primary bg-inherit",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PanelFooter.displayName = "PanelFooter"

export {
  ThreePanelLayout,
  LeftPanel,
  CenterPanel,
  RightPanel,
  PanelHeader,
  PanelContent,
  PanelFooter,
  type ThreePanelLayoutProps,
  type PanelProps
}

