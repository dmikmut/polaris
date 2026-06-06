"use client";

import { cn } from "@/lib/utils";

/**
 * Aurora — slowly drifting gradient blob in the background. Use sparingly,
 * one per section, behind dark surfaces, for that "space" depth.
 */
export function Aurora({
  className,
  variant = "blue",
}: {
  className?: string;
  variant?: "blue" | "purple" | "mix";
}) {
  const gradient = {
    blue:
      "radial-gradient(closest-side, rgba(122, 167, 232, 0.22), transparent 70%)",
    purple:
      "radial-gradient(closest-side, rgba(155, 141, 227, 0.20), transparent 70%)",
    mix: "conic-gradient(from 120deg, rgba(122,167,232,0.18), rgba(155,141,227,0.18), rgba(122,167,232,0.18))",
  }[variant];

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-[520px] w-[520px] rounded-full blur-3xl animate-aurora",
        className
      )}
      style={{ background: gradient }}
    />
  );
}
