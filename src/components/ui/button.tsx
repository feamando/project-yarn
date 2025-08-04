import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        // v0 Design System Variants
        "v0-primary":
          "bg-v0-gold text-black shadow-xs hover:bg-v0-gold-hover focus-visible:ring-v0-gold/20",
        "v0-secondary":
          "bg-v0-bg-secondary text-v0-text-primary border border-v0-border-primary shadow-xs hover:bg-v0-bg-tertiary",
        "v0-danger":
          "bg-v0-red text-white shadow-xs hover:bg-v0-red/90 focus-visible:ring-v0-red/20",
        "v0-ghost":
          "text-v0-text-primary hover:bg-v0-bg-secondary hover:text-v0-text-primary",
        "v0-outline":
          "border border-v0-border-primary bg-transparent text-v0-text-primary hover:bg-v0-bg-secondary",
        "v0-teal":
          "bg-v0-teal text-white shadow-xs hover:bg-v0-teal/90 focus-visible:ring-v0-teal/20",
      },
      size: {
        // Systematic Size System using v0 design tokens
        xs: "h-7 px-v0-2 py-v0-1 text-v0-xs gap-v0-1 has-[>svg]:px-v0-1",
        sm: "h-8 px-v0-3 py-v0-1 text-v0-sm gap-v0-1 has-[>svg]:px-v0-2",
        default: "h-9 px-v0-4 py-v0-2 text-v0-base gap-v0-2 has-[>svg]:px-v0-3", // md
        lg: "h-10 px-v0-6 py-v0-2 text-v0-lg gap-v0-2 has-[>svg]:px-v0-4",
        xl: "h-12 px-v0-8 py-v0-3 text-v0-xl gap-v0-3 has-[>svg]:px-v0-6",
        icon: "size-9 p-0", // Square icon button
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-10 p-0",
        "icon-xl": "size-12 p-0",
      },
      // State Variants
      state: {
        default: "",
        loading: "cursor-wait",
        disabled: "cursor-not-allowed opacity-50",
        active: "scale-v0-98",
      },
      // Interaction States
      interaction: {
        default: "",
        hover: "hover:scale-v0-102 transition-transform duration-v0-fast",
        focus: "focus-visible:ring-2 focus-visible:ring-v0-gold/20 focus-visible:ring-offset-2",
        pressed: "active:scale-v0-95 transition-transform duration-v0-fast",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
      interaction: "default",
    },
    // Compound Variants for complex combinations
    compoundVariants: [
      // Small buttons with v0 variants get reduced padding
      {
        size: "sm",
        variant: ["v0-primary", "v0-secondary", "v0-danger", "v0-teal"],
        class: "px-v0-2 py-v0-1",
      },
      // Large buttons with v0 variants get increased padding
      {
        size: "lg",
        variant: ["v0-primary", "v0-secondary", "v0-danger", "v0-teal"],
        class: "px-v0-6 py-v0-3",
      },
      // Loading state removes hover effects
      {
        state: "loading",
        class: "pointer-events-none",
      },
      // Disabled state overrides all interactions
      {
        state: "disabled",
        class: "pointer-events-none opacity-50",
      },
      // Icon buttons with loading state
      {
        size: ["icon", "icon-sm", "icon-lg", "icon-xl"],
        state: "loading",
        class: "animate-pulse",
      },
    ],
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
