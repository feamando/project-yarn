import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const textareaVariants = cva(
  "placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default:
          "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30",
        // v0 Design System Variants
        "v0-default":
          "bg-v0-dark-bg border-v0-border-primary text-v0-text-primary placeholder:text-v0-text-muted focus-visible:border-v0-gold focus-visible:ring-v0-gold/20 aria-invalid:border-v0-red",
        "v0-secondary":
          "bg-v0-bg-secondary border-v0-border-primary text-v0-text-primary placeholder:text-v0-text-muted focus-visible:border-v0-teal focus-visible:ring-v0-teal/20 aria-invalid:border-v0-red",
        "v0-ghost":
          "bg-transparent border-transparent text-v0-text-primary placeholder:text-v0-text-muted focus-visible:border-v0-border-primary focus-visible:ring-v0-border-primary/20 aria-invalid:border-v0-red",
      },
      size: {
        default: "min-h-16 px-3 py-2",
        sm: "min-h-12 px-2 py-1 text-sm",
        lg: "min-h-20 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Textarea({ 
  className, 
  variant,
  size,
  ...props 
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
