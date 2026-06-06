"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Code2, Eye, FileLock2, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

const nodes = [
  {
    id: "human",
    label: "Human",
    icon: User2,
    blurb: "Sends a prompt. Owns the contract. The only entity that can amend.",
    pos: { top: "50%", left: "6%" },
  },
  {
    id: "architect",
    label: "Architect",
    icon: Brain,
    blurb: "Asks clarifying questions one at a time. Resolves ambiguity before any code is written.",
    pos: { top: "22%", left: "32%" },
  },
  {
    id: "contract",
    label: "Contract",
    icon: FileLock2,
    blurb: "Locked source of truth. API endpoints, expected shapes, DoD. Frozen until human amends.",
    pos: { top: "78%", left: "32%" },
  },
  {
    id: "builder",
    label: "Builder",
    icon: Code2,
    blurb: "Writes code, step by step. Checks contract before each action. Reports confidence and concerns.",
    pos: { top: "30%", left: "62%" },
  },
  {
    id: "overseer",
    label: "Overseer",
    icon: Eye,
    blurb: "Never writes code. Audits every step. Catches violations. Traces root causes.",
    pos: { top: "70%", left: "62%" },
  },
  {
    id: "app",
    label: "Aligned build",
    icon: Code2,
    blurb: "Shipped. Frontend and backend aligned by construction. No drift, no silent failures.",
    pos: { top: "50%", left: "88%" },
  },
];

const edges = [
  { from: "human", to: "architect" },
  { from: "architect", to: "contract" },
  { from: "contract", to: "builder" },
  { from: "contract", to: "overseer" },
  { from: "overseer", to: "builder", dashed: true },
  { from: "builder", to: "overseer", dashed: true },
  { from: "builder", to: "app" },
];

export function Solution() {
  const [active, setActive] = useState<string>("architect");

  return (
    <section id="solution" className="relative py-28">
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-5 inline-block text-[11px] uppercase tracking-[0.18em] text-white/40">
            The solution
          </div>
          <h2 className="font-display text-balance text-[34px] font-medium leading-tight tracking-tight text-white sm:text-5xl">
            Three agents. One contract.
          </h2>
          <p className="mt-4 text-[14.5px] leading-relaxed text-white/50">
            A planner, a coder, and an auditor. Each with a single job. Hover any node to see how
            they keep each other honest.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-stretch">
          {/* Constellation */}
          <div className="relative h-[440px] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.012] backdrop-blur-xl">
            {/* faint background stars */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              {Array.from({ length: 24 }).map((_, i) => {
                const x = (i * 41) % 100;
                const y = (i * 67) % 100;
                return (
                  <motion.circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={0.6}
                    fill="#cfd9ee"
                    animate={{ opacity: [0.15, 0.5, 0.15] }}
                    transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.18 }}
                  />
                );
              })}
            </svg>

            {/* edges */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {edges.map((e, idx) => {
                const f = nodes.find((n) => n.id === e.from)!;
                const t = nodes.find((n) => n.id === e.to)!;
                const x1 = parseFloat(f.pos.left);
                const y1 = parseFloat(f.pos.top);
                const x2 = parseFloat(t.pos.left);
                const y2 = parseFloat(t.pos.top);
                const isActive = active === e.from || active === e.to;
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isActive ? "rgba(168, 198, 245, 0.5)" : "rgba(255,255,255,0.08)"}
                    strokeWidth={isActive ? 0.25 : 0.15}
                    strokeDasharray={e.dashed ? "0.8 0.8" : undefined}
                    style={{ strokeWidth: isActive ? 1.3 : 0.9 }}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {/* moving photons */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {edges.map((e, idx) => {
                const f = nodes.find((n) => n.id === e.from)!;
                const t = nodes.find((n) => n.id === e.to)!;
                return (
                  <motion.circle
                    key={`dot-${idx}`}
                    r="0.45"
                    fill="#cfd9ee"
                    initial={{ cx: parseFloat(f.pos.left), cy: parseFloat(f.pos.top), opacity: 0 }}
                    animate={{
                      cx: [parseFloat(f.pos.left), parseFloat(t.pos.left)],
                      cy: [parseFloat(f.pos.top), parseFloat(t.pos.top)],
                      opacity: [0, 0.9, 0],
                    }}
                    transition={{ duration: 2.8, repeat: Infinity, delay: idx * 0.45, ease: "easeInOut" }}
                  />
                );
              })}
            </svg>

            {/* nodes */}
            {nodes.map((n) => {
              const Icon = n.icon;
              const isActive = active === n.id;
              return (
                <button
                  key={n.id}
                  onMouseEnter={() => setActive(n.id)}
                  onFocus={() => setActive(n.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 outline-none"
                  style={{ top: n.pos.top, left: n.pos.left }}
                >
                  <motion.div
                    animate={{ scale: isActive ? 1.05 : 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-full border transition-colors",
                        isActive
                          ? "border-white/30 bg-white/[0.06]"
                          : "border-white/[0.1] bg-white/[0.02]"
                      )}
                    >
                      <Icon className="h-4 w-4 text-white" strokeWidth={1.6} />
                    </div>
                    <div
                      className={cn(
                        "rounded-md px-1.5 py-0.5 font-display text-[11px] font-medium backdrop-blur transition-colors",
                        isActive ? "bg-white/10 text-white" : "bg-black/20 text-white/70"
                      )}
                    >
                      {n.label}
                    </div>
                  </motion.div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.012] p-6 backdrop-blur-xl">
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/35">
              Focused
            </div>
            <AnimatePresence mode="wait">
              {nodes
                .filter((n) => n.id === active)
                .map((n) => {
                  const Icon = n.icon;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.02]">
                          <Icon className="h-4 w-4 text-white" strokeWidth={1.6} />
                        </div>
                        <div className="font-display text-[17px] font-medium tracking-tight text-white">
                          {n.label}
                        </div>
                      </div>
                      <p className="mt-4 text-[13px] leading-relaxed text-white/60">{n.blurb}</p>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
