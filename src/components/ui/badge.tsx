import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white",
        secondary:
          "bg-blue-900/50 border border-blue-500/30 text-blue-300",
        green:
          "bg-green-600 text-white",
        red:
          "bg-red-600 text-white",
        yellow:
          "bg-yellow-600 text-white",
        gray:
          "bg-gray-600 text-white",
        outline: 
          "border border-blue-500/30 text-blue-300 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 