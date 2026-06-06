"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Code2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  FileText,
  GitMerge,
  Sparkles,
  Cpu,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { architectState, builderState, overseerState } from "@/lib/mock-data";

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Live banner */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.012] px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          </span>
          <span className="font-display text-[12.5px] font-medium text-white">Live · Atlas Todo API</span>
          <span className="text-[11px] text-white/40">3 agents · contract v1.0 locked</span>
        </div>
        <div className="hidden items-center gap-2 text-[11px] text-white/40 md:flex">
          <Cpu className="h-3.5 w-3.5" strokeWidth={1.6} />
          claude-opus-4-7 · gpt-5
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ArchitectPanel />
        <BuilderPanel />
        <OverseerPanel />
      </div>
    </div>
  );
}

function PanelShell({
  children,
  accent,
  icon: Icon,
  name,
  index,
  status,
  statusTone,
}: {
  children: React.ReactNode;
  accent: string;
  icon: typeof Brain;
  name: string;
  index: number;
  status: string;
  statusTone: "green" | "blue" | "amber" | "rose";
}) {
  const toneClass = {
    green: "border-white/[0.06] bg-white/[0.02] text-emerald-300/85",
    blue: "border-white/[0.06] bg-white/[0.02] text-[#a8c6f5]",
    amber: "border-white/[0.06] bg-white/[0.02] text-amber-300/85",
    rose: "border-white/[0.06] bg-white/[0.02] text-rose-300/85",
  }[statusTone];
  const dotClass = {
    green: "bg-emerald-400/80",
    blue: "bg-[#a8c6f5]",
    amber: "bg-amber-300/80",
    rose: "bg-rose-300/80",
  }[statusTone];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.012] backdrop-blur-xl"
    >
      <div className="relative border-b border-white/[0.04] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02]">
              <Icon className="h-4 w-4 text-white/85" strokeWidth={1.6} />
            </div>
            <div>
              <div className="font-display text-[15px] font-medium tracking-tight text-white">{name}</div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/35">Agent {index + 1}</div>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${toneClass}`}>
            <span className={`h-1.5 w-1.5 animate-pulse-soft rounded-full ${dotClass}`} /> {status}
          </span>
        </div>
      </div>
      <div className="relative p-5">{children}</div>
    </motion.section>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className={`mt-1 text-[12.5px] text-white/75 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function ArchitectPanel() {
  const s = architectState;
  return (
    <PanelShell
      accent="from-blue-500/15 to-blue-500"
      icon={Brain}
      name="Architect"
      index={0}
      status="Complete"
      statusTone="green"
    >
      <div className="space-y-4">
        <Field label="Prompt analysis" value={s.promptAnalysis} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Ambiguities" value={s.ambiguities} />
          <Stat label="Resolved" value={s.assumptionsResolved} />
          <Stat label="Status" value={s.contractStatus} small />
        </div>
        <div>
          <div className="mb-2 text-[10.5px] uppercase tracking-[0.18em] text-white/35">Clarifying questions</div>
          <ul className="space-y-2">
            {s.clarifyingQuestions.map((q, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                  <div className="min-w-0">
                    <div className="text-[12px] text-white/85">{q.q}</div>
                    <div className="mt-0.5 text-[11.5px] text-white/55">
                      → <span className="text-blue-300">{q.a}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-2.5 text-[12px]">
          <FileText className="h-3.5 w-3.5 text-emerald-300" />
          <span className="text-white/85">Contract</span>
          <span className="font-mono text-emerald-300">v1.0</span>
          <span className="text-white/40">·</span>
          <span className="text-white/55">locked, awaiting human amendments</span>
        </div>
      </div>
    </PanelShell>
  );
}

function BuilderPanel() {
  const s = builderState;
  return (
    <PanelShell
      accent="from-purple-500/15 to-purple-500"
      icon={Code2}
      name="Builder"
      index={1}
      status="Working"
      statusTone="blue"
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-[11px] text-white/45">
            <span>Current task</span>
            <span className="font-mono">Step {s.currentStep}/{s.totalSteps}</span>
          </div>
          <div className="mt-1 text-[13.5px] font-medium text-white">{s.currentTask}</div>
          <div className="mt-2.5">
            <Progress value={s.progress} indicatorClassName="bg-white/85" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ConfidenceMeter value={s.confidence} />
          <Stat label="Failed attempts" value={`${s.errorAttempts} / 3`} />
        </div>

        <div>
          <div className="mb-2 text-[10.5px] uppercase tracking-[0.18em] text-white/35">Files modified</div>
          <ul className="space-y-1.5">
            {s.filesModified.map((f) => (
              <li
                key={f.path}
                className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5"
              >
                <code className="truncate text-[11.5px] text-white/75">{f.path}</code>
                <span className="ml-2 flex-shrink-0 font-mono text-[10.5px] text-emerald-300">{f.changes}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-300">
            <AlertTriangle className="h-3 w-3" /> Active concern
          </div>
          <div className="mt-1 text-[12px] text-white/75">{s.concern}</div>
        </div>

        <div>
          <div className="mb-2 text-[10.5px] uppercase tracking-[0.18em] text-white/35">Recent actions</div>
          <ul className="space-y-1">
            {s.recentActions.slice(0, 4).map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-[11.5px] text-white/55">
                <span className="font-mono text-white/35">{a.ts}</span>
                <span className="truncate text-white/75">{a.action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PanelShell>
  );
}

function OverseerPanel() {
  const s = overseerState;
  const v = s.contractViolations[0];
  return (
    <PanelShell
      accent="from-fuchsia-500/15 to-purple-500"
      icon={Eye}
      name="Overseer"
      index={2}
      status="Warning"
      statusTone="amber"
    >
      <div className="space-y-4">
        <Field label="Current audit" value={s.currentAudit} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Violations" value={s.contractViolations.length} tone="amber" />
          <Stat label="Last check" value={s.lastCoherenceCheck} small />
          <Stat label="Next at" value={s.nextCoherenceCheck} small />
        </div>

        {v && (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.05] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-300">
                <AlertTriangle className="h-3 w-3" /> {v.type}
              </div>
              <span className="font-mono text-[10px] text-white/45">step {v.step}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-start gap-2 text-[11.5px]">
                <span className="mt-0.5 w-16 flex-shrink-0 text-emerald-300">expected</span>
                <code className="text-white/85">{v.expected}</code>
              </div>
              <div className="flex items-start gap-2 text-[11.5px]">
                <span className="mt-0.5 w-16 flex-shrink-0 text-rose-300">actual</span>
                <code className="text-white/85">{v.actual}</code>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-white/40">
            <GitMerge className="h-3 w-3" /> Root cause
          </div>
          <div className="text-[12px] text-white/75">{v?.rootCause}</div>
        </div>

        <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.05] p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-300">
            <Sparkles className="h-3 w-3" /> Suggested fix
          </div>
          <div className="mt-1 text-[12px] text-white/80">{s.suggestedFix}</div>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10.5px] text-white/45">
              Confidence: <span className="font-mono text-white/80">{v?.confidence}%</span>
            </span>
            <button className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-black hover:bg-white/90">
              Apply fix
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
          <div className="text-[11.5px] text-white/55">Escalation</div>
          <span className="text-[11px] text-emerald-300">No human action needed</span>
        </div>
      </div>
    </PanelShell>
  );
}

function Stat({
  label,
  value,
  small,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  small?: boolean;
  tone?: "amber";
}) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
      <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div
        className={`mt-0.5 font-semibold tracking-tight text-white ${
          small ? "text-[12.5px]" : "text-lg"
        } ${tone === "amber" ? "text-amber-300" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 85 ? "text-emerald-300" : value >= 70 ? "text-amber-300" : "text-rose-300";
  const bar = value >= 85 ? "from-emerald-400 to-green-500" : value >= 70 ? "from-amber-400 to-orange-500" : "from-rose-400 to-red-500";
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">Confidence</div>
        <span className={`text-[11px] font-mono ${color}`}>{value}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className={`h-full bg-gradient-to-r ${bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
