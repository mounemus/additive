import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background",
        outline: "border border-border text-muted",
        blue: "bg-accent-blue/10 text-accent-blue",
        orange: "bg-accent-orange/10 text-accent-orange",
        success: "bg-emerald-500/10 text-emerald-600",
        warning: "bg-amber-500/10 text-amber-600",
        muted: "bg-foreground/5 text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
