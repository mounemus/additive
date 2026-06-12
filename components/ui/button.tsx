import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-background hover:opacity-85 hover:-translate-y-0.5",
        outline:
          "border border-foreground/25 bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
        ghost: "text-foreground hover:bg-foreground/5",
        accent:
          "bg-accent-blue text-white hover:opacity-90 hover:-translate-y-0.5",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        light:
          "bg-white text-[#111111] hover:bg-white/85 hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-7",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
