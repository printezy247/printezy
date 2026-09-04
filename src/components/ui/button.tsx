import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold cursor-pointer transition-[background-color,border-color,color,opacity,filter,transform] duration-150 active:duration-[60ms] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "btn-primary-glass text-primary-foreground",
        outline: "btn-outline-glass border border-[rgba(201,161,58,0.45)] text-accent",
        ghost: "btn-ghost-glass bg-transparent text-body hover:bg-surface hover:text-foreground",
      },
      size: {
        sm: "min-h-10 rounded-lg px-4 py-2 text-[13px]",
        md: "min-h-11 rounded-lg px-5 py-2.5 text-sm",
        lg: "min-h-12 rounded-[10px] px-6 py-3 text-[15px]",
        default: "min-h-11 rounded-lg px-5 py-2.5 text-sm",
        icon: "min-h-11 min-w-11 rounded-lg p-0 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
