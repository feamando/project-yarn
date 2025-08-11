import * as React from "react"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface Tab {
  id: string
  title: string
  content?: React.ReactNode
  isActive?: boolean
  isDirty?: boolean
  canClose?: boolean
  icon?: React.ReactNode
  path?: string
}

interface TabSystemProps {
  tabs: Tab[]
  activeTabId?: string
  onTabClick?: (tab: Tab) => void
  onTabClose?: (tab: Tab) => void
  onNewTab?: () => void
  className?: string
  showNewTabButton?: boolean
  maxTabWidth?: number
}

interface TabBarProps {
  tabs: Tab[]
  activeTabId?: string
  onTabClick?: (tab: Tab) => void
  onTabClose?: (tab: Tab) => void
  onNewTab?: () => void
  showNewTabButton?: boolean
  maxTabWidth?: number
  className?: string
}

interface TabContentProps {
  tabs: Tab[]
  activeTabId?: string
  className?: string
}

const TabBar = React.forwardRef<HTMLDivElement, TabBarProps>(
  ({ 
    tabs, 
    activeTabId, 
    onTabClick, 
    onTabClose, 
    onNewTab,
    showNewTabButton = true,
    maxTabWidth = 200,
    className,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center bg-v0-bg-secondary border-b border-v0-border-primary overflow-x-auto scrollbar-thin",
          className
        )}
        {...props}
      >
        <div className="flex items-center min-w-0 flex-1">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id
            
            return (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border-r border-v0-border-primary cursor-pointer transition-colors relative group",
                  "hover:bg-v0-bg-tertiary",
                  isActive && "bg-v0-dark-bg text-v0-text-primary",
                  !isActive && "text-v0-text-muted"
                )}
                style={{ maxWidth: `${maxTabWidth}px`, minWidth: "120px" }}
                onClick={() => onTabClick?.(tab)}
              >
                {/* Active tab indicator */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-v0-gold" />
                )}
                
                {/* Tab icon */}
                {tab.icon && (
                  <div className="w-4 h-4 flex-shrink-0">
                    {tab.icon}
                  </div>
                )}
                
                {/* Tab title */}
                <span className="text-sm font-light truncate flex-1">
                  {tab.title}
                  {tab.isDirty && (
                    <span className="text-v0-gold ml-1">•</span>
                  )}
                </span>
                
                {/* Close button */}
                {tab.canClose !== false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-v0-border-primary text-v0-text-muted hover:text-v0-text-primary transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onTabClose?.(tab)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
        
        {/* New tab button */}
        {showNewTabButton && onNewTab && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 mx-1 text-v0-text-muted hover:text-v0-text-primary hover:bg-v0-bg-tertiary"
            onClick={onNewTab}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    )
  }
)
TabBar.displayName = "TabBar"

const TabContent = React.forwardRef<HTMLDivElement, TabContentProps>(
  ({ tabs, activeTabId, className, ...props }, ref) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId)
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 overflow-hidden bg-v0-dark-bg",
          className
        )}
        {...props}
      >
        {activeTab?.content || (
          <div className="flex items-center justify-center h-full text-v0-text-muted">
            <span className="text-sm">No content available</span>
          </div>
        )}
      </div>
    )
  }
)
TabContent.displayName = "TabContent"

const TabSystem = React.forwardRef<HTMLDivElement, TabSystemProps>(
  ({ 
    tabs, 
    activeTabId, 
    onTabClick, 
    onTabClose, 
    onNewTab,
    showNewTabButton = true,
    maxTabWidth = 200,
    className,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full overflow-hidden",
          className
        )}
        {...props}
      >
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={onTabClick}
          onTabClose={onTabClose}
          onNewTab={onNewTab}
          showNewTabButton={showNewTabButton}
          maxTabWidth={maxTabWidth}
        />
        
        <TabContent
          tabs={tabs}
          activeTabId={activeTabId}
        />
      </div>
    )
  }
)
TabSystem.displayName = "TabSystem"

export { 
  TabSystem, 
  TabBar, 
  TabContent,
  type TabSystemProps,
  type TabBarProps,
  type TabContentProps
}
