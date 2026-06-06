"use client";

import { motion } from "framer-motion";

/**
 * HeroArc — large SVG arc with an animated draw stroke that sweeps in
 * underneath the hero. Sits absolutely positioned in its parent.
 */
export function HeroArc() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="arc-grad" x1="0" y1="0" x2="1200" y2="0">
          <stop offset="0%" stopColor="rgba(168,198,245,0)" />
          <stop offset="50%" stopColor="rgba(168,198,245,0.45)" />
          <stop offset="100%" stopColor="rgba(168,198,245,0)" />
        </linearGradient>
        <linearGradient id="arc-grad-2" x1="0" y1="0" x2="1200" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <motion.path
        d="M 0 460 Q 600 240 1200 460"
        fill="none"
        stroke="url(#arc-grad)"
        strokeWidth="1.2"
        strokeDasharray="6 12"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
      />
      <motion.path
        d="M 0 520 Q 600 360 1200 520"
        fill="none"
        stroke="url(#arc-grad-2)"
        strokeWidth="0.8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.5, delay: 0.6, ease: "easeOut" }}
      />
      <motion.path
        d="M 0 580 Q 600 480 1200 580"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.5, delay: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}
