import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // v0 Design System Variants
        "v0-gold":
          "border-transparent bg-v0-gold text-black [a&]:hover:bg-v0-gold-hover",
        "v0-teal":
          "border-transparent bg-v0-teal text-white [a&]:hover:bg-v0-teal/90",
        "v0-red":
          "border-transparent bg-v0-red text-white [a&]:hover:bg-v0-red/90",
        "v0-outline":
          "border-v0-border-primary bg-transparent text-v0-text-primary [a&]:hover:bg-v0-bg-secondary",
        "v0-secondary":
          "border-transparent bg-v0-bg-secondary text-v0-text-primary [a&]:hover:bg-v0-bg-tertiary",
        "v0-processing":
          "border-transparent bg-v0-teal/10 text-v0-teal border-v0-teal/20 [a&]:hover:bg-v0-teal/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
