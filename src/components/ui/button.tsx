import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-alabaster disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-terracotta text-white shadow-xs hover:bg-terracotta-hover active:scale-[0.99]",
        secondary:
          "bg-sage text-white shadow-xs hover:bg-sage-hover active:scale-[0.99]",
        outline:
          "border border-linen-dark bg-alabaster text-espresso hover:bg-linen hover:border-muted-light active:scale-[0.99]",
        ghost:
          "text-espresso hover:bg-linen/80 hover:text-espresso active:scale-[0.99]",
        subtle:
          "bg-terracotta-subtle text-terracotta hover:bg-terracotta hover:text-white active:scale-[0.99]",
        "sage-subtle":
          "bg-sage-subtle text-sage hover:bg-sage hover:text-white active:scale-[0.99]",
        destructive:
          "bg-red-700 text-white shadow-xs hover:bg-red-800 active:scale-[0.99]",
        link: "text-terracotta underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-6 text-base rounded-xl font-medium tracking-wide",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
