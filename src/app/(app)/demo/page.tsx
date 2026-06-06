"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Code2,
  Eye,
  FileLock2,
  Pause,
  Play,
  RefreshCcw,
  Sparkles,
  User2,
  ShieldCheck,
  RefreshCw,
  Hand,
  TrendingDown,
  Rocket,
} from "lucide-react";
import { demoFinalMetrics, demoScenario, type DemoStep } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actorMeta = {
  human: { Icon: User2, label: "Human", color: "from-slate-400 to-slate-500", text: "text-slate-200" },
  architect: { Icon: Brain, label: "Architect", color: "from-blue-400 to-blue-600", text: "text-blue-200" },
  builder: { Icon: Code2, label: "Builder", color: "from-purple-400 to-purple-600", text: "text-purple-200" },
  overseer: { Icon: Eye, label: "Overseer", color: "from-fuchsia-400 to-purple-600", text: "text-fuchsia-200" },
  system: { Icon: Sparkles, label: "System", color: "from-emerald-400 to-emerald-600", text: "text-emerald-200" },
} as const;

const STEP_MS = 2200;

export default function DemoPage() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!playing) return;
    if (active >= demoScenario.length) return;
    timer.current = setTimeout(() => {
      setActive((a) => Math.min(a + 1, demoScenario.length));
    }, STEP_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active, playing]);

  const finished = active >= demoScenario.length;
  const current = demoScenario[Math.min(active, demoScenario.length - 1)];

  const reset = () => {
    setActive(0);
    setPlaying(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-blue-500/[0.07] via-purple-500/[0.05] to-transparent p-6 backdrop-blur-xl">
        <div className="pointer-events-none absolute -inset-x-12 -top-12 h-40 bg-gradient-to-b from-blue-500/15 to-transparent" />
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/65">
              <Rocket className="h-3 w-3 text-blue-300" /> Guided demo
            </div>
            <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Watch all three agents prevent a silent production bug.
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/55">
              Scenario: a user asks for a Todo App. The Builder makes a small but real
              mistake. The Overseer catches it before it ships. No infinite loop. No human paged.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {!finished ? (
                <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)}>
                  {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {playing ? "Pause" : "Resume"}
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={reset}>
                  <RefreshCcw className="h-3.5 w-3.5" /> Replay
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setActive((a) => Math.min(a + 1, demoScenario.length))}>
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="font-mono text-[10.5px] text-white/45">
              {Math.min(active + 1, demoScenario.length)} / {demoScenario.length}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative mt-5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
            initial={false}
            animate={{ width: `${(Math.min(active + 1, demoScenario.length) / demoScenario.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Step list */}
        <ol className="space-y-2">
          {demoScenario.map((s, i) => {
            const m = actorMeta[s.actor];
            const Icon = m.Icon;
            const done = i < active;
            const isCurrent = i === active && !finished;
            return (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  onClick={() => {
                    setPlaying(false);
                    setActive(i);
                  }}
                  className={cn(
                    "relative flex w-full items-start gap-3 rounded-xl border bg-gradient-to-b p-3 text-left transition-all",
                    isCurrent
                      ? "border-white/[0.12] from-white/[0.05] to-white/[0.02] shadow-[0_0_24px_-8px_rgba(59,130,246,0.4)]"
                      : done
                      ? "border-white/[0.05] from-white/[0.02] to-transparent"
                      : "border-white/[0.04] from-white/[0.01] to-transparent opacity-65 hover:opacity-100"
                  )}
                >
                  <div className={cn("flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br p-[1px]", m.color)}>
                    <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#0a0c12]/90">
                      {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <Icon className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[10.5px] font-medium uppercase tracking-[0.18em]", m.text)}>{m.label}</span>
                      <span className="font-mono text-[10px] text-white/35">step {s.id}</span>
                    </div>
                    <div className="mt-0.5 text-[12.5px] font-medium text-white">{s.title}</div>
                  </div>
                  {isCurrent && (
                    <motion.span
                      layoutId="demo-pulse"
                      className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                    />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ol>

        {/* Stage */}
        <div className="space-y-4">
          {!finished ? (
            <AnimatePresence mode="wait">
              <CurrentStepCard key={current.id} step={current} />
            </AnimatePresence>
          ) : (
            <FinalSummary />
          )}

          {/* Live agent telemetry */}
          <div className="grid grid-cols-3 gap-3">
            <TelemetryCard
              actor="architect"
              label="Architect"
              value={active >= 3 ? "Locked" : active >= 1 ? "Asking" : "Idle"}
              dot={active >= 1 ? "bg-blue-400" : "bg-white/30"}
            />
            <TelemetryCard
              actor="builder"
              label="Builder"
              value={
                finished
                  ? "Done"
                  : active >= 7
                  ? "Applying fix"
                  : active >= 5
                  ? "Step 12 / 24"
                  : active >= 3
                  ? "Working"
                  : "Idle"
              }
              dot={active >= 3 ? "bg-purple-400" : "bg-white/30"}
            />
            <TelemetryCard
              actor="overseer"
              label="Overseer"
              value={
                finished
                  ? "Healthy"
                  : active >= 5
                  ? "Violation found"
                  : active >= 3
                  ? "Auditing"
                  : "Idle"
              }
              dot={
                finished
                  ? "bg-emerald-400"
                  : active >= 5
                  ? "bg-amber-400"
                  : active >= 3
                  ? "bg-fuchsia-400"
                  : "bg-white/30"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentStepCard({ step }: { step: DemoStep }) {
  const m = actorMeta[step.actor];
  const Icon = m.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6 backdrop-blur-xl"
    >
      <div className={cn("pointer-events-none absolute -inset-x-12 -top-12 h-40 bg-gradient-to-b opacity-50", m.color.replace("from-", "from-").replace("to-", "to-"))} />
      <div className="relative flex items-start gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br p-[1px]", m.color)}>
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#0a0c12]/90">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", m.text)}>{m.label}</span>
            <span className="font-mono text-[10.5px] text-white/40">step {step.id}</span>
          </div>
          <h3 className="mt-1 text-[18px] font-semibold tracking-tight text-white">{step.title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-white/70">{step.body}</p>
          {step.detail && (
            <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[12.5px] text-white/65">
              {step.detail}
            </div>
          )}

          {/* Special inline visual for step 5/6 (the diff catch) */}
          {step.id === 5 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <DiffBlock label="Contract" code="{ todos: [] }" tone="emerald" />
              <DiffBlock label="Builder wrote" code="{ data: { todos: [] } }" tone="rose" />
            </div>
          )}
          {step.id === 6 && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3">
              <FileLock2 className="h-4 w-4 text-amber-300" />
              <div className="text-[12.5px] text-white/85">
                Contract integrity check failed —{" "}
                <span className="font-mono text-amber-300">response shape mismatch</span>
              </div>
            </div>
          )}
          {step.id === 8 && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <div className="text-[12.5px] text-white/85">
                Single-pass fix applied · loop counter: <span className="font-mono text-emerald-300">0 / 3</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DiffBlock({ label, code, tone }: { label: string; code: string; tone: "emerald" | "rose" }) {
  const toneClass = tone === "emerald" ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300" : "border-rose-500/25 bg-rose-500/[0.06] text-rose-300";
  return (
    <div className={cn("rounded-lg border p-3", toneClass)}>
      <div className="text-[10.5px] uppercase tracking-[0.18em]">{label}</div>
      <pre className="mt-1.5 overflow-x-auto rounded-md border border-white/[0.05] bg-black/40 p-2 font-mono text-[12px] text-white/85">{code}</pre>
    </div>
  );
}

function TelemetryCard({
  actor,
  label,
  value,
  dot,
}: {
  actor: keyof typeof actorMeta;
  label: string;
  value: string;
  dot: string;
}) {
  const m = actorMeta[actor];
  const Icon = m.Icon;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br p-[1px]", m.color)}>
          <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#0a0c12]/90">
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <div className="text-[12px] font-medium text-white">{label}</div>
        <span className={cn("ml-auto h-1.5 w-1.5 animate-pulse rounded-full", dot)} />
      </div>
      <div className="mt-2 text-[11.5px] text-white/55">{value}</div>
    </div>
  );
}

function FinalSummary() {
  const m = demoFinalMetrics;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-blue-500/[0.04] to-transparent p-8 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -inset-x-12 -top-12 h-40 bg-gradient-to-b from-emerald-500/20 to-transparent" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          <h3 className="text-[20px] font-semibold tracking-tight text-white">Build successful</h3>
        </div>
        <div className="mt-1 text-[13px] text-white/55">
          Contract maintained · Loop prevented · Frontend & backend aligned
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat icon={ShieldCheck} label="Errors prevented" value={m.errorsPrevented} tone="text-emerald-300" />
          <SummaryStat icon={RefreshCw} label="Loops prevented" value={m.loopsPrevented} tone="text-blue-300" />
          <SummaryStat icon={Hand} label="Human escalations" value={m.humanEscalations} tone="text-purple-300" />
          <SummaryStat icon={TrendingDown} label="Token savings" value={`${m.tokenSavings * 100}%`} tone="text-amber-300" />
        </div>
      </div>
    </motion.div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Brain;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-white/45">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={cn("mt-1 text-2xl font-semibold tracking-tight", tone)}>{value}</div>
    </div>
  );
}
