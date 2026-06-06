"use client";

import { motion } from "framer-motion";
import { Brain, Code2, Eye, FileLock2, User2, Check } from "lucide-react";

const stages = [
  { icon: User2, label: "Human", sub: "intent" },
  { icon: Brain, label: "Architect", sub: "clarify" },
  { icon: FileLock2, label: "Contract", sub: "locked" },
  { icon: Code2, label: "Builder", sub: "build" },
  { icon: Eye, label: "Overseer", sub: "audit" },
  { icon: Check, label: "Aligned", sub: "shipped" },
];

export function AgentFlow() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.012] p-8 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 grid-bg-fine opacity-50" />

      {/* subtle constellation backdrop */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {[
          [12, 24], [86, 18], [40, 78], [70, 50], [22, 60], [55, 12], [92, 70], [8, 88],
        ].map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={`${x}%`}
            cy={`${y}%`}
            r={0.9}
            fill="#cfd9ee"
            animate={{ opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: 3.5 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </svg>

      <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="flex min-w-[96px] flex-col items-center gap-2.5"
              >
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.025]">
                  <Icon className="h-4 w-4 text-white/85" strokeWidth={1.6} />
                </div>
                <div className="text-center">
                  <div className="font-display text-[12.5px] font-medium text-white">{stage.label}</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{stage.sub}</div>
                </div>
              </motion.div>
              {i < stages.length - 1 && <FlowConnector index={i} />}
            </div>
          );
        })}
      </div>

      {/* Audit loop annotation */}
      <div className="relative mt-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[11px] text-white/55"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/80" />
          </span>
          The Overseer audits every five steps · drift caught before it ships
        </motion.div>
      </div>
    </div>
  );
}

function FlowConnector({ index }: { index: number }) {
  return (
    <div className="relative h-px w-8 flex-shrink-0 sm:w-10">
      <div className="absolute inset-0 bg-white/[0.07]" />
      <motion.div
        className="absolute -top-[2px] h-1 w-1 rounded-full bg-white/90"
        animate={{ x: ["0%", "100%"], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.18, ease: "easeInOut" }}
      />
    </div>
  );
}
