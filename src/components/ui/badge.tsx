import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-terracotta text-white border-transparent shadow-xs",
        secondary:
          "bg-sage text-white border-transparent shadow-xs",
        outline:
          "border border-linen-dark text-espresso bg-alabaster/60",
        subtle:
          "bg-terracotta-subtle text-terracotta border border-terracotta/15",
        "sage-subtle":
          "bg-sage-subtle text-sage border border-sage/20",
        // Domain statuses:
        available:
          "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
        reserved:
          "bg-amber-50 text-amber-900 border border-amber-200/90",
        sold:
          "bg-stone-100 text-stone-500 border border-stone-200",
        in_progress:
          "bg-sky-50 text-sky-800 border border-sky-200/80",
        ooak:
          "bg-terracotta-subtle text-terracotta border border-terracotta/20 font-serif italic text-[13px] tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
