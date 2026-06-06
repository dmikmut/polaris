"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  GitMerge,
  Layout as LayoutIcon,
  Server,
  Lightbulb,
  Hand,
  TrendingUp,
} from "lucide-react";
import { incidents } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sevTone: Record<string, string> = {
  critical: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  high: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  medium: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
  low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
};

const statusTone: Record<string, string> = {
  open: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  fixed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  dismissed: "border-white/10 bg-white/[0.04] text-white/55",
};

export default function ErrorsPage() {
  const [selectedId, setSelectedId] = useState(incidents[0].id);
  const selected = incidents.find((i) => i.id === selectedId)!;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        {/* List */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[12.5px] font-semibold text-white">Incidents</span>
            </div>
            <span className="text-[11px] text-white/45">{incidents.length} total</span>
          </div>
          <ul className="max-h-[640px] divide-y divide-white/[0.04] overflow-y-auto">
            {incidents.map((it) => {
              const active = it.id === selectedId;
              return (
                <li key={it.id}>
                  <button
                    onClick={() => setSelectedId(it.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors",
                      active ? "bg-white/[0.05]" : "hover:bg-white/[0.025]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-md border px-1.5 py-0 text-[10px] uppercase tracking-[0.18em]", sevTone[it.severity])}>
                        {it.severity}
                      </span>
                      <span className={cn("rounded-md border px-1.5 py-0 text-[10px] uppercase tracking-[0.18em]", statusTone[it.status])}>
                        {it.status}
                      </span>
                    </div>
                    <div className="mt-2 text-[13px] font-medium text-white">{it.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-white/45">
                      <span className="font-mono">{it.id}</span>
                      <span>·</span>
                      <span>Step {it.step}</span>
                      <span>·</span>
                      <span>{it.ts}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Inspector */}
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-amber-500/[0.06] via-transparent to-transparent p-5 backdrop-blur-xl">
            <div className="pointer-events-none absolute -inset-x-12 -top-12 h-40 bg-gradient-to-b from-amber-500/15 to-transparent opacity-60" />
            <div className="relative flex items-start justify-between gap-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/[0.08]">
                  <AlertOctagon className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[18px] font-semibold tracking-tight text-white">{selected.title}</h2>
                    <span className={cn("rounded-md border px-1.5 py-0 text-[10px] uppercase tracking-[0.18em]", sevTone[selected.severity])}>
                      {selected.severity}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11.5px] text-white/45">
                    <span className="font-mono">{selected.id}</span>
                    <span>·</span>
                    <span>{selected.type}</span>
                    <span>·</span>
                    <span>step {selected.step}</span>
                    <span>·</span>
                    <span>{selected.ts}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Hand className="h-3.5 w-3.5" /> Escalate
                </Button>
                <Button variant="primary" size="sm">
                  <Sparkles className="h-3.5 w-3.5" /> Apply fix
                </Button>
              </div>
            </div>
          </div>

          {/* Diff */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CodeBlock label="Expected (contract)" tone="green" value={selected.expected} />
            <CodeBlock label="Actual (builder output)" tone="red" value={selected.actual} />
          </div>

          {/* Root cause */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/85">
              <GitMerge className="h-3.5 w-3.5" /> Root cause analysis
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/75">{selected.rootCause}</p>
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <div className="flex-1 text-[12.5px] text-white/80">
                Diagnosis confidence
              </div>
              <span className="font-mono text-[12.5px] text-emerald-300">{selected.confidence}%</span>
            </div>
          </div>

          {/* Recommended fix */}
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/[0.06] to-transparent p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-300">
              <Lightbulb className="h-3.5 w-3.5" /> Recommended fix
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/85">{selected.recommendedFix}</p>
          </div>

          {/* Related files */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FilesPanel
              icon={LayoutIcon}
              tone="purple"
              label="Frontend files"
              files={selected.frontendFiles}
            />
            <FilesPanel
              icon={Server}
              tone="blue"
              label="Backend files"
              files={selected.backendFiles}
            />
          </div>

          {/* Architecture impact */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/85">
              <TrendingUp className="h-3.5 w-3.5" /> Architecture impact
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Impact label="Blast radius" value="Single endpoint" tone="amber" />
              <Impact label="Frontend break" value="Yes (silent)" tone="rose" />
              <Impact label="Production risk" value="High" tone="rose" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CodeBlock({ label, value, tone }: { label: string; value: string; tone: "green" | "red" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-500/20 bg-emerald-500/[0.04]"
      : "border-rose-500/20 bg-rose-500/[0.04]";
  const accentClass = tone === "green" ? "text-emerald-300" : "text-rose-300";
  return (
    <div className={cn("rounded-2xl border p-4 backdrop-blur-xl", toneClass)}>
      <div className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]", accentClass)}>
        {tone === "green" ? <CheckCircle2 className="h-3 w-3" /> : <AlertOctagon className="h-3 w-3" />}
        {label}
      </div>
      <pre className="mt-2 overflow-x-auto rounded-lg border border-white/[0.05] bg-black/40 p-3 font-mono text-[12.5px] text-white/85">
        {value}
      </pre>
    </div>
  );
}

function FilesPanel({
  icon: Icon,
  label,
  files,
  tone,
}: {
  icon: typeof Server;
  label: string;
  files: string[];
  tone: "blue" | "purple";
}) {
  const colorClass = tone === "blue" ? "text-blue-300" : "text-purple-300";
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-4 backdrop-blur-xl">
      <div className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]", colorClass)}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      {files.length === 0 ? (
        <div className="mt-2 text-[12px] text-white/45">No files affected.</div>
      ) : (
        <ul className="mt-2 space-y-1">
          {files.map((f) => (
            <li
              key={f}
              className="rounded-md border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[12px] text-white/75"
            >
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Impact({ label, value, tone }: { label: string; value: string; tone: "amber" | "rose" }) {
  const color = tone === "amber" ? "text-amber-300" : "text-rose-300";
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className={cn("mt-1 text-[13px] font-medium", color)}>{value}</div>
    </div>
  );
}
