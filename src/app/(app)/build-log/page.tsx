"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User2,
  Brain,
  FileLock2,
  Code2,
  Gauge,
  Eye,
  AlertOctagon,
  Wrench,
  Hand,
  ChevronRight,
  Filter,
} from "lucide-react";
import { buildLog, type LogEntryType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const meta: Record<LogEntryType, { icon: typeof Brain; label: string; color: string; ring: string }> = {
  human: { icon: User2, label: "Human", color: "from-slate-400 to-slate-500", ring: "ring-slate-500/30" },
  architect: { icon: Brain, label: "Architect", color: "from-blue-400 to-blue-600", ring: "ring-blue-500/30" },
  contract: { icon: FileLock2, label: "Contract", color: "from-cyan-400 to-blue-500", ring: "ring-cyan-500/30" },
  builder: { icon: Code2, label: "Builder", color: "from-purple-400 to-purple-600", ring: "ring-purple-500/30" },
  confidence: { icon: Gauge, label: "Confidence", color: "from-emerald-400 to-emerald-600", ring: "ring-emerald-500/30" },
  overseer: { icon: Eye, label: "Overseer", color: "from-fuchsia-400 to-purple-600", ring: "ring-fuchsia-500/30" },
  error: { icon: AlertOctagon, label: "Error", color: "from-rose-400 to-red-600", ring: "ring-rose-500/30" },
  correction: { icon: Wrench, label: "Correction", color: "from-amber-400 to-orange-500", ring: "ring-amber-500/30" },
  escalation: { icon: Hand, label: "Escalation", color: "from-pink-400 to-rose-500", ring: "ring-pink-500/30" },
};

const filterTypes: LogEntryType[] = ["human", "architect", "contract", "builder", "overseer", "error"];

export default function BuildLogPage() {
  const [filter, setFilter] = useState<LogEntryType | "all">("all");
  const [expanded, setExpanded] = useState<string | null>("l_011");

  const filtered = filter === "all" ? buildLog : buildLog.filter((e) => e.type === filter);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.025] to-transparent p-3 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 pr-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <Filter className="h-3 w-3" /> Filter
        </div>
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-md border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
            filter === "all"
              ? "border-white/15 bg-white/[0.08] text-white"
              : "border-white/[0.06] bg-transparent text-white/55 hover:text-white"
          )}
        >
          All
        </button>
        {filterTypes.map((t) => {
          const m = meta[t];
          const active = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                active
                  ? "border-white/15 bg-white/[0.08] text-white"
                  : "border-white/[0.06] bg-transparent text-white/55 hover:text-white"
              )}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${m.color}`}
              />
              {m.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 text-[11px] text-white/45">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live · streaming
        </div>
      </div>

      {/* Timeline */}
      <ol className="relative space-y-3">
        <span className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.06]" aria-hidden />
        {filtered.map((entry, i) => {
          const m = meta[entry.type];
          const Icon = m.icon;
          const isOpen = expanded === entry.id;
          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="relative pl-12"
            >
              <div className={`absolute left-2 top-1.5 h-7 w-7 rounded-xl bg-gradient-to-br ${m.color} p-[1px] ring-2 ${m.ring} ring-offset-2 ring-offset-[#07080b]`}>
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0a0c12]/90">
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
              </div>

              <button
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                className={cn(
                  "group w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent text-left backdrop-blur-xl transition-colors",
                  isOpen ? "border-white/[0.12]" : "hover:border-white/[0.1]"
                )}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-medium uppercase tracking-[0.18em] text-white/70">{m.label}</span>
                      <span className="font-mono text-[10.5px] text-white/35">{entry.ts}</span>
                      {entry.meta?.confidence !== undefined && (
                        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 font-mono text-[10px] text-emerald-300">
                          {entry.meta.confidence}%
                        </span>
                      )}
                      {entry.meta?.severity && (
                        <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0 text-[10px] uppercase text-amber-300">
                          {String(entry.meta.severity)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[13.5px] font-medium tracking-tight text-white">
                      {entry.title}
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 flex-shrink-0 text-white/40 transition-transform",
                      isOpen ? "rotate-90 text-white/70" : ""
                    )}
                  />
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-white/[0.05]"
                    >
                      <div className="space-y-3 p-4">
                        <p className="text-[12.5px] leading-relaxed text-white/65">{entry.body}</p>
                        {entry.meta && (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(entry.meta).map(([k, v]) => (
                              <span
                                key={k}
                                className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 font-mono text-[10.5px] text-white/65"
                              >
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
