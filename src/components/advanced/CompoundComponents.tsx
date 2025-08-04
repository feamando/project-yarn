import React, { createContext, useContext, useState, useCallback } from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, X } from "lucide-react";

// === COMPOUND COMPONENTS PATTERN ===
// Advanced component patterns using compound component architecture

// === SELECT COMPOUND COMPONENT ===
// Example: <Select.Root><Select.Trigger /><Select.Content><Select.Item /></Select.Content></Select.Root>

interface SelectContextValue {
  isOpen: boolean;
  selectedValue: string | null;
  onToggle: () => void;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within Select.Root');
  }
  return context;
}

// === SELECT ROOT ===
interface SelectRootProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
}

function SelectRoot({ 
  children, 
  value, 
  onValueChange, 
  defaultValue,
  className 
}: SelectRootProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [isOpen, setIsOpen] = useState(false);

  const selectedValue = value !== undefined ? value : internalValue;

  const handleSelect = useCallback((newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
    setIsOpen(false);
  }, [onValueChange]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const contextValue: SelectContextValue = {
    isOpen,
    selectedValue,
    onToggle: handleToggle,
    onSelect: handleSelect,
    onClose: handleClose,
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={cn("relative", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// === SELECT TRIGGER ===
const selectTriggerVariants = cva(
  "flex items-center justify-between w-full px-v0-3 py-v0-2 text-v0-sm border rounded-md transition-all duration-v0-fast",
  {
    variants: {
      variant: {
        default: "border-v0-border-primary bg-v0-dark-bg text-v0-text-primary hover:border-v0-gold/30",
        filled: "border-v0-border-primary bg-v0-bg-secondary text-v0-text-primary hover:bg-v0-bg-tertiary",
        outline: "border-v0-gold bg-transparent text-v0-text-primary hover:bg-v0-gold/5",
      },
      size: {
        sm: "h-8 px-v0-2 text-v0-xs",
        md: "h-9 px-v0-3 text-v0-sm",
        lg: "h-10 px-v0-4 text-v0-base",
      },
      state: {
        default: "",
        open: "border-v0-gold ring-2 ring-v0-gold/20",
        disabled: "opacity-50 cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      state: "default",
    },
  }
);

interface SelectTriggerProps extends VariantProps<typeof selectTriggerVariants> {
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function SelectTrigger({ 
  children, 
  placeholder = "Select an option...",
  variant,
  size,
  className,
  disabled = false,
}: SelectTriggerProps) {
  const { isOpen, selectedValue, onToggle } = useSelectContext();

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={cn(
        selectTriggerVariants({ 
          variant, 
          size, 
          state: disabled ? "disabled" : isOpen ? "open" : "default" 
        }),
        className
      )}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <span className="truncate">
        {children || selectedValue || placeholder}
      </span>
      <ChevronDown 
        className={cn(
          "h-4 w-4 text-v0-text-muted transition-transform duration-v0-fast",
          isOpen && "rotate-180"
        )} 
      />
    </button>
  );
}

// === SELECT CONTENT ===
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

function SelectContent({ children, className }: SelectContentProps) {
  const { isOpen, onClose } = useSelectContext();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Content */}
      <div className={cn(
        "absolute top-full left-0 right-0 z-50 mt-1",
        "bg-v0-dark-bg border border-v0-border-primary rounded-md shadow-v0-shadow-lg",
        "max-h-60 overflow-auto py-v0-1",
        className
      )}>
        {children}
      </div>
    </>
  );
}

// === SELECT ITEM ===
interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  className?: string;
}

function SelectItem({ children, value, disabled = false, className }: SelectItemProps) {
  const { selectedValue, onSelect } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : () => onSelect(value)}
      disabled={disabled}
      className={cn(
        "flex items-center justify-between w-full px-v0-3 py-v0-2 text-v0-sm text-left",
        "transition-colors duration-v0-fast",
        isSelected 
          ? "bg-v0-gold/10 text-v0-gold" 
          : "text-v0-text-primary hover:bg-v0-bg-secondary",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      role="option"
      aria-selected={isSelected}
    >
      <span className="truncate">{children}</span>
      {isSelected && <Check className="h-4 w-4 shrink-0" />}
    </button>
  );
}

// === SELECT SEPARATOR ===
function SelectSeparator({ className }: { className?: string }) {
  return (
    <div className={cn("h-px bg-v0-border-primary my-v0-1", className)} />
  );
}

// === SELECT LABEL ===
interface SelectLabelProps {
  children: React.ReactNode;
  className?: string;
}

function SelectLabel({ children, className }: SelectLabelProps) {
  return (
    <div className={cn(
      "px-v0-3 py-v0-2 text-v0-xs font-v0-medium text-v0-text-muted uppercase tracking-v0-wider",
      className
    )}>
      {children}
    </div>
  );
}

// === COMPOUND SELECT EXPORT ===
export const Select = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Item: SelectItem,
  Separator: SelectSeparator,
  Label: SelectLabel,
};

// === ACCORDION COMPOUND COMPONENT ===
// Example: <Accordion.Root><Accordion.Item><Accordion.Trigger /><Accordion.Content /></Accordion.Item></Accordion.Root>

interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within Accordion.Root');
  }
  return context;
}

// === ACCORDION ROOT ===
interface AccordionRootProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
}

function AccordionRoot({ 
  children, 
  type = 'single',
  defaultValue,
  className 
}: AccordionRootProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    if (defaultValue) {
      return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
    }
    return new Set();
  });

  const toggleItem = useCallback((value: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      
      if (type === 'single') {
        // Single mode: close all others, toggle current
        newSet.clear();
        if (!prev.has(value)) {
          newSet.add(value);
        }
      } else {
        // Multiple mode: toggle current
        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          newSet.add(value);
        }
      }
      
      return newSet;
    });
  }, [type]);

  const contextValue: AccordionContextValue = {
    openItems,
    toggleItem,
    type,
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn("space-y-v0-1", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// === ACCORDION ITEM ===
interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionTrigger and AccordionContent must be used within AccordionItem');
  }
  return context;
}

interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

function AccordionItem({ children, value, className }: AccordionItemProps) {
  const { openItems } = useAccordionContext();
  const isOpen = openItems.has(value);

  const contextValue: AccordionItemContextValue = {
    value,
    isOpen,
  };

  return (
    <AccordionItemContext.Provider value={contextValue}>
      <div className={cn(
        "border border-v0-border-primary rounded-md overflow-hidden",
        className
      )}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// === ACCORDION TRIGGER ===
interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const { toggleItem } = useAccordionContext();
  const { value, isOpen } = useAccordionItemContext();

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      className={cn(
        "flex items-center justify-between w-full px-v0-4 py-v0-3",
        "text-v0-sm font-v0-medium text-v0-text-primary text-left",
        "bg-v0-bg-secondary/30 hover:bg-v0-bg-secondary/50",
        "transition-colors duration-v0-fast",
        "focus:outline-none focus:ring-2 focus:ring-v0-gold/20",
        className
      )}
      aria-expanded={isOpen}
    >
      <span>{children}</span>
      <ChevronDown 
        className={cn(
          "h-4 w-4 text-v0-text-muted transition-transform duration-v0-fast",
          isOpen && "rotate-180"
        )} 
      />
    </button>
  );
}

// === ACCORDION CONTENT ===
interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionContent({ children, className }: AccordionContentProps) {
  const { isOpen } = useAccordionItemContext();

  return (
    <div className={cn(
      "overflow-hidden transition-all duration-v0-normal",
      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
    )}>
      <div className={cn("px-v0-4 py-v0-3 text-v0-sm text-v0-text-secondary", className)}>
        {children}
      </div>
    </div>
  );
}

// === COMPOUND ACCORDION EXPORT ===
export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
};

// === TABS COMPOUND COMPONENT ===
// Example: <Tabs.Root><Tabs.List><Tabs.Trigger /></Tabs.List><Tabs.Content /></Tabs.Root>

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs.Root');
  }
  return context;
}

// === TABS ROOT ===
interface TabsRootProps {
  children: React.ReactNode;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

function TabsRoot({ 
  children, 
  defaultValue,
  value,
  onValueChange,
  className 
}: TabsRootProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const activeTab = value !== undefined ? value : internalValue;

  const handleTabChange = useCallback((newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  }, [onValueChange]);

  const contextValue: TabsContextValue = {
    activeTab,
    setActiveTab: handleTabChange,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// === TABS LIST ===
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn(
      "flex items-center border-b border-v0-border-primary bg-v0-bg-secondary/20",
      className
    )} role="tablist">
      {children}
    </div>
  );
}

// === TABS TRIGGER ===
interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  className?: string;
}

function TabsTrigger({ children, value, disabled = false, className }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : () => setActiveTab(value)}
      disabled={disabled}
      className={cn(
        "px-v0-4 py-v0-3 text-v0-sm font-v0-medium transition-all duration-v0-fast",
        "border-b-2 border-transparent",
        "focus:outline-none focus:ring-2 focus:ring-v0-gold/20",
        isActive 
          ? "text-v0-gold border-v0-gold bg-v0-gold/5" 
          : "text-v0-text-muted hover:text-v0-text-primary hover:bg-v0-bg-secondary/30",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
    >
      {children}
    </button>
  );
}

// === TABS CONTENT ===
interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

function TabsContent({ children, value, className }: TabsContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div 
      className={cn("py-v0-4", className)}
      role="tabpanel"
      id={`tabpanel-${value}`}
    >
      {children}
    </div>
  );
}

// === COMPOUND TABS EXPORT ===
export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};

// === EXPORT ALL COMPOUND COMPONENTS ===
export {
  Select,
  Accordion,
  Tabs,
};
