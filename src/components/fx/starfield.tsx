"use client";

import { motion } from "framer-motion";

/**
 * Starfield — pseudo-random twinkling stars across the viewport. Each star
 * uses a deterministic offset so SSR/CSR match.
 */
export function Starfield({
  count = 60,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const stars = Array.from({ length: count }, (_, i) => ({
    x: ((i * 37) % 1000) / 10,
    y: ((i * 71) % 1000) / 10,
    s: ((i * 13) % 5) * 0.15 + 0.4,
    d: (i % 5) * 0.6 + 2.4,
    delay: (i % 11) * 0.18,
  }));
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
    >
      {stars.map((star, i) => (
        <motion.circle
          key={i}
          cx={`${star.x}%`}
          cy={`${star.y}%`}
          r={star.s}
          fill="#dde7f8"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{ duration: star.d, repeat: Infinity, delay: star.delay }}
        />
      ))}
    </svg>
  );
}
