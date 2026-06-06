"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User2,
  Brain,
  FileLock2,
  Code2,
  Eye,
  Layout as LayoutIcon,
  Server,
  Database,
  Activity,
  ZoomIn,
} from "lucide-react";
import { graphEdges, graphNodes, type GraphNode } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconFor: Record<string, typeof Brain> = {
  human: User2,
  architect: Brain,
  contract: FileLock2,
  builder: Code2,
  overseer: Eye,
  frontend: LayoutIcon,
  backend: Server,
  database: Database,
};

const statusTone: Record<GraphNode["status"], { ring: string; dot: string; label: string; text: string }> = {
  healthy: { ring: "ring-emerald-500/40", dot: "bg-emerald-400", label: "Healthy", text: "text-emerald-300" },
  warning: { ring: "ring-amber-500/50", dot: "bg-amber-400", label: "Warning", text: "text-amber-300" },
  violation: { ring: "ring-rose-500/50", dot: "bg-rose-400", label: "Violation", text: "text-rose-300" },
  escalation: { ring: "ring-purple-500/50", dot: "bg-purple-400", label: "Escalation", text: "text-purple-300" },
};

const edgeColor: Record<string, string> = {
  healthy: "rgba(34,197,94,0.5)",
  warning: "rgba(245,158,11,0.7)",
  violation: "rgba(239,68,68,0.7)",
  escalation: "rgba(168,85,247,0.7)",
};

const W = 700;
const H = 420;

export default function ArchitecturePage() {
  const [selectedId, setSelectedId] = useState<string>("backend");
  const selected = graphNodes.find((n) => n.id === selectedId)!;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        {/* Graph */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-white">
              <Activity className="h-3.5 w-3.5 text-blue-300" /> System graph
            </div>
            <div className="flex items-center gap-3 text-[10.5px] text-white/55">
              <LegendDot color="bg-emerald-400" label="Healthy" />
              <LegendDot color="bg-amber-400" label="Warning" />
              <LegendDot color="bg-rose-400" label="Violation" />
              <LegendDot color="bg-purple-400" label="Escalation" />
            </div>
          </div>
          <div className="relative h-[480px] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 grid-bg-fine opacity-40" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

            <svg
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Edges */}
              {graphEdges.map((e) => {
                const f = graphNodes.find((n) => n.id === e.from)!;
                const t = graphNodes.find((n) => n.id === e.to)!;
                const isSel = e.from === selectedId || e.to === selectedId;
                return (
                  <g key={e.id} opacity={isSel ? 1 : 0.55}>
                    <line
                      x1={f.x}
                      y1={f.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={edgeColor[e.status]}
                      strokeWidth={isSel ? 2 : 1.2}
                      strokeDasharray={e.status !== "healthy" ? "5 4" : undefined}
                    />
                    {/* animated dot */}
                    <motion.circle
                      r={2.4}
                      fill={edgeColor[e.status]}
                      initial={false}
                      animate={{ cx: [f.x, t.x], cy: [f.y, t.y], opacity: [0, 1, 0] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                      style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
                    />
                    {e.label && (
                      <text
                        x={(f.x + t.x) / 2}
                        y={(f.y + t.y) / 2 - 6}
                        textAnchor="middle"
                        className="fill-white/45"
                        fontSize="9"
                        fontFamily="ui-monospace, monospace"
                      >
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {graphNodes.map((n) => {
                const Icon = iconFor[n.id] ?? Brain;
                const tone = statusTone[n.status];
                const active = n.id === selectedId;
                return (
                  <g
                    key={n.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(n.id)}
                  >
                    {active && (
                      <motion.circle
                        cx={n.x}
                        cy={n.y}
                        r={28}
                        fill="none"
                        stroke={tone.dot.replace("bg-", "").includes("emerald") ? "#22c55e" : tone.dot.includes("amber") ? "#f59e0b" : tone.dot.includes("rose") ? "#ef4444" : "#a855f7"}
                        strokeWidth={1.5}
                        opacity={0.4}
                        animate={{ r: [28, 32, 28] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={20}
                      fill="rgba(10,12,18,0.95)"
                      stroke={active ? "#ffffff30" : "#ffffff15"}
                      strokeWidth={1.2}
                      className={cn("transition-all", tone.ring)}
                    />
                    <foreignObject x={n.x - 9} y={n.y - 9} width={18} height={18}>
                      <Icon className="h-[18px] w-[18px] text-white/85" />
                    </foreignObject>
                    <text
                      x={n.x}
                      y={n.y + 36}
                      textAnchor="middle"
                      className="fill-white"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {n.label}
                    </text>
                    <foreignObject x={n.x - 30} y={n.y + 40} width={60} height={14}>
                      <div className="flex justify-center">
                        <span className={cn("inline-flex items-center gap-1 rounded-full bg-black/40 px-1.5 py-0 text-[9px] backdrop-blur", tone.text)}>
                          <span className={cn("h-1 w-1 rounded-full", tone.dot)} /> {tone.label}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-2.5 text-[11px] text-white/45">
            <span>Click any node to inspect.</span>
            <span className="flex items-center gap-1.5">
              <ZoomIn className="h-3 w-3" /> Hover edges to see direction
            </span>
          </div>
        </div>

        {/* Detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                {(() => {
                  const Icon = iconFor[selected.id] ?? Brain;
                  return <Icon className="h-5 w-5 text-white/85" />;
                })()}
              </div>
              <div>
                <div className="text-[15px] font-semibold tracking-tight text-white">{selected.label}</div>
                <div className="text-[11px] text-white/45 capitalize">{selected.kind}</div>
              </div>
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                  statusTone[selected.status].text,
                  selected.status === "healthy" && "border-emerald-500/20 bg-emerald-500/10",
                  selected.status === "warning" && "border-amber-500/20 bg-amber-500/10",
                  selected.status === "violation" && "border-rose-500/20 bg-rose-500/10",
                  selected.status === "escalation" && "border-purple-500/20 bg-purple-500/10"
                )}
              >
                <span className={cn("h-1.5 w-1.5 animate-pulse rounded-full", statusTone[selected.status].dot)} />
                {statusTone[selected.status].label}
              </span>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-white/65">{selected.detail}</p>

            <div className="mt-5 space-y-2">
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">Connections</div>
              {graphEdges
                .filter((e) => e.from === selected.id || e.to === selected.id)
                .map((e) => {
                  const other = graphNodes.find((n) => n.id === (e.from === selected.id ? e.to : e.from))!;
                  const direction = e.from === selected.id ? "→" : "←";
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedId(other.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <span className="text-[11.5px] text-white/80">
                        {direction} {other.label}
                      </span>
                      <span
                        className={cn(
                          "rounded-md border px-1.5 py-0 text-[10px] uppercase",
                          e.status === "healthy" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
                          e.status === "warning" && "border-amber-500/20 bg-amber-500/10 text-amber-300",
                          e.status === "violation" && "border-rose-500/20 bg-rose-500/10 text-rose-300",
                          e.status === "escalation" && "border-purple-500/20 bg-purple-500/10 text-purple-300"
                        )}
                      >
                        {e.label ?? e.status}
                      </span>
                    </button>
                  );
                })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      <span>{label}</span>
    </div>
  );
}
