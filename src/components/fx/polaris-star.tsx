"use client";

import { motion } from "framer-motion";

/**
 * PolarisStar — the centerpiece. A bright 4-point star at the center
 * surrounded by concentric orbital rings, slowly rotating, with a few
 * smaller stars orbiting along the rings. The whole thing has a halo glow.
 */
export function PolarisStar({ size = 320 }: { size?: number }) {
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* Outer halo glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(168,198,245,0.18), rgba(168,198,245,0.04) 40%, transparent 70%)",
        }}
      />

      {/* Concentric orbital rings */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 400"
        aria-hidden
      >
        <defs>
          <radialGradient id="starGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#dde7f8" />
            <stop offset="100%" stopColor="#a8c6f5" />
          </radialGradient>
          <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a8c6f5" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#7aa7e8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#7aa7e8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ringStroke" x1="0" y1="0" x2="400" y2="400">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="50%" stopColor="rgba(168,198,245,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
        </defs>

        {/* Pulsing soft halo behind the star */}
        <motion.circle
          cx="200"
          cy="200"
          r="60"
          fill="url(#haloGrad)"
          animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "center" }}
        />

        {/* Ring 1 (innermost) */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle
            cx="200"
            cy="200"
            r="90"
            fill="none"
            stroke="url(#ringStroke)"
            strokeWidth="0.7"
            strokeDasharray="2 3"
          />
          <circle cx="290" cy="200" r="1.6" fill="#ffffff" />
        </motion.g>

        {/* Ring 2 */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle
            cx="200"
            cy="200"
            r="130"
            fill="none"
            stroke="url(#ringStroke)"
            strokeWidth="0.6"
            strokeDasharray="1 6"
          />
          <circle cx="200" cy="70" r="1.3" fill="#cfd9ee" />
          <circle cx="330" cy="200" r="1.1" fill="#a8c6f5" />
        </motion.g>

        {/* Ring 3 with tick marks (compass) */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle
            cx="200"
            cy="200"
            r="175"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 360) / 60;
            const rad = (angle * Math.PI) / 180;
            const r1 = 170;
            const r2 = i % 5 === 0 ? 160 : 167;
            // Round to 2 decimals so SSR string and CSR number serialize identically.
            const round = (n: number) => Math.round(n * 100) / 100;
            const x1 = round(200 + Math.cos(rad) * r1);
            const y1 = round(200 + Math.sin(rad) * r1);
            const x2 = round(200 + Math.cos(rad) * r2);
            const y2 = round(200 + Math.sin(rad) * r2);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(168,198,245,0.35)"
                strokeWidth={i % 5 === 0 ? 0.7 : 0.4}
              />
            );
          })}
        </motion.g>

        {/* Ring 4 (outermost) — slow drift */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle
            cx="200"
            cy="200"
            r="195"
            fill="none"
            stroke="rgba(168,198,245,0.18)"
            strokeWidth="0.45"
            strokeDasharray="6 14"
          />
          <circle cx="395" cy="200" r="1.5" fill="#ffffff" />
        </motion.g>

        {/* The North Star itself — 4-point shape */}
        <motion.path
          d="M200 110 L208 192 L290 200 L208 208 L200 290 L192 208 L110 200 L192 192 Z"
          fill="url(#starGrad)"
          animate={{ filter: ["drop-shadow(0 0 14px rgba(168,198,245,0.55))", "drop-shadow(0 0 22px rgba(168,198,245,0.85))", "drop-shadow(0 0 14px rgba(168,198,245,0.55))"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Tiny inner brightness */}
        <circle cx="200" cy="200" r="3" fill="#ffffff" opacity="0.95" />
        <circle cx="200" cy="200" r="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
      </svg>
    </div>
  );
}
