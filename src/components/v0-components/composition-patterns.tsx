/**
 * V0 Component Composition Patterns
 * 
 * This file contains reusable composition patterns that leverage the V0 design language
 * for consistent UI patterns throughout the Project Yarn application.
 * 
 * Last Updated: 2025-08-02
 * Source: V0 Prototype Integration (Task 2.5)
 */

import * as React from 'react';
import { YarnLogo } from '../yarn-logo';
import { ContextIndicator } from '../context-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  MoreHorizontal,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';

// ============================================================================
// HEADER PATTERNS
// ============================================================================

/**
 * V0 Application Header Pattern
 * Combines YarnLogo with title and optional actions
 */
interface V0HeaderProps {
  title?: string;
  showTitle?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

function V0Header({ 
  title = "Project Yarn", 
  showTitle = true, 
  actions,
  className = ""
}: V0HeaderProps) {
  return (
    <header className={`flex items-center justify-between p-v0-space-4 border-b border-v0-border-primary bg-v0-dark-bg ${className}`}>
      <div className="flex items-center gap-v0-space-3">
        <YarnLogo className="w-6 h-6" />
        {showTitle && (
          <h1 className="font-serif text-lg font-normal text-v0-text-primary">{title}</h1>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

/**
 * V0 Modal Header Pattern
 * Standardized header for dialogs and modals
 */
interface V0ModalHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

function V0ModalHeader({ title, description, icon, badge }: V0ModalHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        {icon || <YarnLogo className="w-5 h-5" />}
        <span>{title}</span>
        {badge}
      </DialogTitle>
      {description && (
        <DialogDescription>{description}</DialogDescription>
      )}
    </DialogHeader>
  );
}

// ============================================================================
// AI PROCESSING PATTERNS
// ============================================================================

/**
 * V0 AI Processing Panel Pattern
 * Combines ContextIndicator with controls and status
 */
interface V0AIProcessingPanelProps {
  isProcessing: boolean;
  processedItems: number;
  totalItems: number;
  title?: string;
  status?: 'active' | 'paused' | 'error' | 'completed';
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

function V0AIProcessingPanel({
  isProcessing,
  processedItems,
  totalItems,
  title = "AI Assistant",
  status = 'active',
  onPause,
  onResume,
  onStop,
  onViewDetails,
  className = ""
}: V0AIProcessingPanelProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-v0-teal text-v0-dark-bg">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-v0-gold border-v0-gold">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`bg-v0-dark-bg border-v0-border-primary ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <YarnLogo className="w-5 h-5" />
            <CardTitle className="text-sm text-v0-text-primary">{title}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ContextIndicator 
          isProcessing={isProcessing}
          processedItems={processedItems}
          totalItems={totalItems}
        />
        
        <div className="flex gap-2">
          {status === 'active' && onPause && (
            <Button size="sm" variant="outline" onClick={onPause} className="flex-1">
              <Clock className="w-3 h-3" />
              Pause
            </Button>
          )}
          {status === 'paused' && onResume && (
            <Button size="sm" variant="outline" onClick={onResume} className="flex-1">
              <Zap className="w-3 h-3" />
              Resume
            </Button>
          )}
          {onStop && (
            <Button size="sm" variant="destructive" onClick={onStop} className="flex-1">
              Stop
            </Button>
          )}
          {onViewDetails && (
            <Button size="sm" variant="ghost" onClick={onViewDetails}>
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FORM PATTERNS
// ============================================================================

/**
 * V0 Form Field Pattern
 * Standardized form field with label and error handling
 */
interface V0FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function V0FormField({ 
  label, 
  required = false, 
  error, 
  description, 
  children, 
  className = "" 
}: V0FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-v0-text-primary">
        {label}
        {required && <span className="text-v0-red ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-v0-text-muted">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-v0-red flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * V0 Project Creation Form Pattern
 * Reusable form pattern for creating projects
 */
interface V0ProjectFormData {
  name: string;
  description: string;
  category: string;
  template?: string;
}

interface V0ProjectFormProps {
  onSubmit: (data: V0ProjectFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<V0ProjectFormData>;
  className?: string;
}

function V0ProjectForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  initialData = {},
  className = ""
}: V0ProjectFormProps) {
  const [formData, setFormData] = React.useState<V0ProjectFormData>({
    name: initialData.name || '',
    description: initialData.description || '',
    category: initialData.category || '',
    template: initialData.template || ''
  });

  const [errors, setErrors] = React.useState<Partial<V0ProjectFormData>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Partial<V0ProjectFormData> = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <V0FormField 
        label="Project Name" 
        required 
        error={errors.name}
        description="Choose a descriptive name for your project"
      >
        <Input
          placeholder="Enter project name..."
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          disabled={isLoading}
        />
      </V0FormField>

      <V0FormField 
        label="Description" 
        error={errors.description}
        description="Brief description of your project goals"
      >
        <Textarea
          placeholder="Project description..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          disabled={isLoading}
          className="min-h-20"
        />
      </V0FormField>

      <V0FormField 
        label="Category" 
        required 
        error={errors.category}
        description="Select the primary category for your project"
      >
        <Select 
          value={formData.category} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="web">Web Development</SelectItem>
            <SelectItem value="mobile">Mobile Application</SelectItem>
            <SelectItem value="desktop">Desktop Application</SelectItem>
            <SelectItem value="ai">AI/ML Project</SelectItem>
            <SelectItem value="data">Data Analysis</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </V0FormField>

      <V0FormField 
        label="Template" 
        description="Optional: Start with a project template"
      >
        <Select 
          value={formData.template} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, template: value }))}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose template (optional)..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blank">Blank Project</SelectItem>
            <SelectItem value="react">React Application</SelectItem>
            <SelectItem value="node">Node.js Backend</SelectItem>
            <SelectItem value="python">Python Project</SelectItem>
            <SelectItem value="documentation">Documentation Site</SelectItem>
          </SelectContent>
        </Select>
      </V0FormField>

      <div className="flex gap-2 pt-4">
        <Button 
          type="button"
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 mr-2" />
              Create Project
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ============================================================================
// NAVIGATION PATTERNS
// ============================================================================

/**
 * V0 Sidebar Item Pattern
 * Standardized sidebar navigation item
 */
interface V0SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

function V0SidebarItem({ 
  icon, 
  label, 
  isActive = false, 
  badge, 
  onClick,
  className = ""
}: V0SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors
        ${isActive 
          ? 'bg-v0-gold/10 text-v0-gold border border-v0-gold/20' 
          : 'text-v0-text-primary hover:bg-v0-border-primary hover:text-v0-text-primary'
        }
        ${className}
      `}
    >
      <span className="w-4 h-4 flex items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge}
    </button>
  );
}

/**
 * V0 Breadcrumb Pattern
 * Navigation breadcrumb with V0 styling
 */
interface V0BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface V0BreadcrumbProps {
  items: V0BreadcrumbItem[];
  className?: string;
}

function V0Breadcrumb({ items, className = "" }: V0BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-v0-text-muted">/</span>
          )}
          {item.isActive ? (
            <span className="text-v0-gold font-medium">{item.label}</span>
          ) : (
            <button
              onClick={item.onClick}
              className="text-v0-text-muted hover:text-v0-text-primary transition-colors"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ============================================================================
// STATUS PATTERNS
// ============================================================================

/**
 * V0 Status Card Pattern
 * Displays status information with V0 styling
 */
interface V0StatusCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

function V0StatusCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  variant = 'default',
  className = ""
}: V0StatusCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-v0-teal/20 bg-v0-teal/5';
      case 'warning':
        return 'border-v0-gold/20 bg-v0-gold/5';
      case 'error':
        return 'border-v0-red/20 bg-v0-red/5';
      default:
        return 'border-v0-border-primary bg-v0-dark-bg';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    // You would import these from lucide-react
    // return trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
    return null;
  };

  return (
    <Card className={`${getVariantStyles()} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-v0-text-muted font-medium">{title}</p>
            <p className="text-2xl font-semibold text-v0-text-primary">{value}</p>
            {description && (
              <p className="text-xs text-v0-text-muted">{description}</p>
            )}
          </div>
          {icon && (
            <div className="text-v0-text-muted">
              {icon}
            </div>
          )}
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {getTrendIcon()}
            <span className={`text-xs ${
              trend === 'up' ? 'text-v0-teal' : 
              trend === 'down' ? 'text-v0-red' : 
              'text-v0-text-muted'
            }`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXPORT ALL PATTERNS
// ============================================================================

export {
  // Header patterns
  V0Header,
  V0ModalHeader,
  
  // AI processing patterns
  V0AIProcessingPanel,
  
  // Form patterns
  V0FormField,
  V0ProjectForm,
  
  // Navigation patterns
  V0SidebarItem,
  V0Breadcrumb,
  
  // Status patterns
  V0StatusCard
};

// Export types for external use
export type {
  V0HeaderProps,
  V0ModalHeaderProps,
  V0AIProcessingPanelProps,
  V0FormFieldProps,
  V0ProjectFormProps,
  V0ProjectFormData,
  V0SidebarItemProps,
  V0BreadcrumbProps,
  V0BreadcrumbItem,
  V0StatusCardProps
};
