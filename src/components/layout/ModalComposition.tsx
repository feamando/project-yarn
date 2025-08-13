import * as React from 'react';
import { useEffect, useRef } from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// === MODAL/DIALOG COMPOSITION PATTERNS ===
// Built with v0 design tokens and proper focus management

// === MODAL VARIANTS ===
const modalVariants = cva(
  "relative bg-v0-dark-bg border border-v0-border-primary shadow-v0-shadow-xl rounded-lg overflow-hidden",
  {
    variants: {
      // Modal Size
      size: {
        xs: "max-w-xs",
        sm: "max-w-sm", 
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        full: "max-w-full mx-v0-4",
      },
      // Modal Type
      type: {
        default: "",
        confirmation: "border-v0-gold/20",
        warning: "border-yellow-500/20",
        error: "border-v0-red/20",
        success: "border-v0-teal/20",
        info: "border-blue-500/20",
      },
    },
    defaultVariants: {
      size: "md",
      type: "default",
    },
  }
);

// === MODAL HEADER VARIANTS ===
const modalHeaderVariants = cva(
  "flex items-center justify-between p-v0-6 border-b border-v0-border-primary",
  {
    variants: {
      type: {
        default: "bg-v0-bg-secondary/30",
        confirmation: "bg-v0-gold/5",
        warning: "bg-yellow-500/5",
        error: "bg-v0-red/5", 
        success: "bg-v0-teal/5",
        info: "bg-blue-500/5",
      },
    },
    defaultVariants: {
      type: "default",
    },
  }
);

// === FOCUS TRAP HOOK ===
function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    // Handle tab key navigation
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Handle escape key
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Trigger close if there's a close handler
        const closeButton = container.querySelector('[data-modal-close]') as HTMLElement;
        closeButton?.click();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restore focus to the previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  return containerRef;
}

// === MAIN MODAL COMPOSITION ===
interface ModalCompositionProps extends VariantProps<typeof modalVariants> {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export function ModalComposition({
  children,
  isOpen,
  onClose,
  title,
  description,
  icon,
  size = "md",
  type = "default",
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalCompositionProps) {
  const containerRef = useFocusTrap(isOpen);



  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={containerRef}
        className={cn(modalVariants({ size, type }), className)}
        onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
      >
        {/* Modal Header */}
        {(title || description || showCloseButton) && (
          <DialogHeader className={modalHeaderVariants({ type })}>
            <div className="flex items-center space-x-v0-3">
              {icon && (
                <div className="shrink-0 text-v0-gold">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <DialogTitle className="text-v0-lg font-v0-semibold text-v0-text-primary">
                    {title}
                  </DialogTitle>
                )}
                {description && (
                  <DialogDescription className="text-v0-sm text-v0-text-muted mt-v0-1">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
            
            {showCloseButton && (
              <Button
                variant="v0-ghost"
                size="icon-sm"
                onClick={onClose}
                data-modal-close
                className="shrink-0"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogHeader>
        )}

        {/* Modal Content */}
        <div className="p-v0-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// === CONFIRMATION MODAL ===
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "default" | "warning" | "error";
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default",
  loading = false,
}: ConfirmationModalProps) {
  const icons = {
    default: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    error: <AlertTriangle className="h-5 w-5" />,
  };

  const confirmVariants = {
    default: "v0-primary" as const,
    warning: "v0-danger" as const,
    error: "v0-danger" as const,
  };

  return (
    <ModalComposition
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={icons[type]}
      type={type === "default" ? "confirmation" : type}
      size="sm"
    >
      <DialogFooter className="flex space-x-v0-3">
        <Button
          variant="v0-outline"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmVariants[type]}
          onClick={onConfirm}
          state={loading ? "loading" : "default"}
          disabled={loading}
        >
          {confirmText}
        </Button>
      </DialogFooter>
    </ModalComposition>
  );
}

// === ALERT MODAL ===
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error";
  actionText?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  description,
  type = "info",
  actionText = "OK",
}: AlertModalProps) {
  const icons = {
    info: <Info className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    error: <AlertTriangle className="h-5 w-5" />,
  };

  return (
    <ModalComposition
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={icons[type]}
      type={type}
      size="sm"
    >
      <DialogFooter>
        <Button
          variant="v0-primary"
          onClick={onClose}
          className="w-full"
        >
          {actionText}
        </Button>
      </DialogFooter>
    </ModalComposition>
  );
}

// === FORM MODAL ===
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  submitDisabled?: boolean;
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  children,
  submitText = "Submit",
  cancelText = "Cancel",
  loading = false,
  submitDisabled = false,
}: FormModalProps) {
  return (
    <ModalComposition
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <div className="space-y-v0-4 mb-v0-6">
          {children}
        </div>
        
        <DialogFooter className="flex space-x-v0-3">
          <Button
            type="button"
            variant="v0-outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            variant="v0-primary"
            state={loading ? "loading" : "default"}
            disabled={loading || submitDisabled}
          >
            {submitText}
          </Button>
        </DialogFooter>
      </form>
    </ModalComposition>
  );
}

// === FULLSCREEN MODAL ===
interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  toolbar?: React.ReactNode;
}

export function FullscreenModal({
  isOpen,
  onClose,
  title,
  children,
  toolbar,
}: FullscreenModalProps) {
  return (
    <ModalComposition
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
      closeOnOverlayClick={false}
      className="h-screen max-h-screen m-0 rounded-none"
    >
      {toolbar && (
        <div className="border-b border-v0-border-primary p-v0-4 bg-v0-bg-secondary/30">
          {toolbar}
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-v0-6">
        {children}
      </div>
    </ModalComposition>
  );
}


