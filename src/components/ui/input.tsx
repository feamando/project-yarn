import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive",
        // v0 Design System Variants
        "v0-default":
          "bg-v0-dark-bg border-v0-border-primary text-v0-text-primary placeholder:text-v0-text-muted focus-visible:border-v0-gold focus-visible:ring-v0-gold/20 aria-invalid:border-v0-red",
        "v0-secondary":
          "bg-v0-bg-secondary border-v0-border-primary text-v0-text-primary placeholder:text-v0-text-muted focus-visible:border-v0-teal focus-visible:ring-v0-teal/20 aria-invalid:border-v0-red",
        "v0-ghost":
          "bg-transparent border-transparent text-v0-text-primary placeholder:text-v0-text-muted focus-visible:border-v0-border-primary focus-visible:ring-v0-border-primary/20 aria-invalid:border-v0-red",
      },
      size: {
        default: "h-9 px-3 py-1",
        sm: "h-8 px-2 py-1 text-sm",
        lg: "h-10 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Input({ 
  className, 
  variant,
  size,
  type, 
  ...props 
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
