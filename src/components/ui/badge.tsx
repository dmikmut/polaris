import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/[0.05] text-white/80 border border-white/[0.08]",
        primary: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
        accent: "bg-purple-500/10 text-purple-300 border border-purple-500/20",
        success: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
        error: "bg-red-500/10 text-red-300 border border-red-500/20",
        outline: "border border-white/15 text-white/70",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
