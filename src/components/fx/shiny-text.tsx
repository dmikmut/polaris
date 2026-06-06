"use client";

import { cn } from "@/lib/utils";

export function ShinyText({
  children,
  className,
  blue,
}: {
  children: React.ReactNode;
  className?: string;
  blue?: boolean;
}) {
  return (
    <span className={cn(blue ? "shiny-text-blue" : "shiny-text", className)}>
      {children}
    </span>
  );
}
