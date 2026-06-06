"use client";

import { motion } from "framer-motion";
import { Brain, Code2, Eye } from "lucide-react";
import { architectState, builderState, overseerState } from "@/lib/mock-data";

const agents = [
  {
    icon: Brain,
    name: "Architect",
    state: architectState,
    status: "Contract locked v1.0",
    dot: "bg-emerald-400/70",
    badge: "Complete",
  },
  {
    icon: Code2,
    name: "Builder",
    state: builderState,
    status: `Step ${builderState.currentStep}/${builderState.totalSteps} · ${builderState.currentTask}`,
    dot: "bg-[#a8c6f5]",
    badge: "Working",
  },
  {
    icon: Eye,
    name: "Overseer",
    state: overseerState,
    status: overseerState.currentAudit,
    dot: "bg-amber-300/80",
    badge: "Warning",
  },
];

export function AgentStatusRow() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {agents.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.012] p-5 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02]">
                  <Icon className="h-4 w-4 text-white/85" strokeWidth={1.6} />
                </div>
                <div>
                  <div className="font-display text-[14px] font-medium tracking-tight text-white">{a.name}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/35">Agent {i + 1}</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10.5px] font-medium text-white/65">
                <span className={`h-1.5 w-1.5 animate-pulse-soft rounded-full ${a.dot}`} />
                {a.badge}
              </span>
            </div>
            <div className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-white/55">
              {a.status}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
