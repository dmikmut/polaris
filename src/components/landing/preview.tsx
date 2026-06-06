"use client";

import { motion } from "framer-motion";
import { Brain, Code2, Eye, AlertTriangle, Activity } from "lucide-react";
import { PolarisWordmark } from "@/components/brand/polaris-logo";

export function Preview() {
  return (
    <section id="preview" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-5 inline-block text-[11px] uppercase tracking-[0.18em] text-white/40">
            Product preview
          </div>
          <h2 className="font-display text-balance text-[34px] font-medium leading-tight tracking-tight text-white sm:text-5xl">
            One pane of glass for the whole constellation.
          </h2>
          <p className="mt-4 text-[14.5px] leading-relaxed text-white/50">
            Prompt, contract, agents, code, architecture — all live, all aligned.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="relative mt-14"
        >
          <div className="pointer-events-none absolute -inset-x-10 top-20 h-72 bg-[radial-gradient(closest-side,rgba(122,167,232,0.08),transparent)]" />

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0d14]/80 shadow-[0_40px_120px_-30px_rgba(122,167,232,0.18)] backdrop-blur-xl">
            {/* Window bar */}
            <div className="flex items-center justify-between border-b border-white/[0.05] bg-black/30 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <div className="rounded-md bg-white/[0.03] px-3 py-0.5 font-mono text-[11px] text-white/45">
                polaris.dev/projects/atlas-todo-api
              </div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/35">live</div>
            </div>

            <div className="grid grid-cols-12 gap-0">
              {/* Sidebar */}
              <div className="col-span-2 border-r border-white/[0.05] bg-black/20 p-3">
                <div className="px-1.5 py-1">
                  <PolarisWordmark size="sm" />
                </div>
                <div className="mt-4 space-y-0.5">
                  {[
                    "Dashboard",
                    "Projects",
                    "Contract",
                    "Agents",
                    "Build Log",
                    "Architecture",
                    "Analytics",
                    "Errors",
                  ].map((label, i) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] ${
                        i === 3 ? "bg-white/[0.06] text-white" : "text-white/40"
                      }`}
                    >
                      <span className={`h-1 w-1 rounded-full ${i === 3 ? "bg-white" : "bg-white/15"}`} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main */}
              <div className="col-span-10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/35">
                      Atlas Todo API
                    </div>
                    <div className="font-display text-[16px] font-medium tracking-tight text-white">
                      Agent monitoring
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[10.5px] text-white/65">
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400/70" />
                    Contract v1.0 locked
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <PreviewAgentCard
                    icon={Brain}
                    name="Architect"
                    status="Complete"
                    dotColor="bg-emerald-400/70"
                    lines={["6 ambiguities resolved", "Contract v1.0 locked", "Awaiting amendments"]}
                  />
                  <PreviewAgentCard
                    icon={Code2}
                    name="Builder"
                    status="Working"
                    dotColor="bg-blue-300/80"
                    lines={["Step 12 of 24", "GET /api/todos handler", "Confidence: 87%"]}
                    progress={50}
                  />
                  <PreviewAgentCard
                    icon={Eye}
                    name="Overseer"
                    status="Warning"
                    dotColor="bg-amber-300/80"
                    lines={["1 contract violation", "Response shape drift", "Fix ready (96%)"]}
                    warning
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.015] p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/[0.06]">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-300/90" strokeWidth={1.6} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-medium text-white">
                      Contract violation on GET /api/todos
                    </div>
                    <div className="font-mono text-[11px] text-white/45">
                      expected{" "}
                      <span className="text-emerald-300/90">{`{ todos: [] }`}</span> · got{" "}
                      <span className="text-rose-300/90">{`{ data: { todos: [] } }`}</span>
                    </div>
                  </div>
                  <button className="rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-black">
                    Apply fix
                  </button>
                </motion.div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <PreviewMetric label="Loops prevented" value="28" />
                  <PreviewMetric label="Violations caught" value="17" />
                  <PreviewMetric label="Token savings" value="42%" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PreviewAgentCard({
  icon: Icon,
  name,
  status,
  dotColor,
  lines,
  progress,
  warning,
}: {
  icon: typeof Brain;
  name: string;
  status: string;
  dotColor: string;
  lines: string[];
  progress?: number;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white/[0.012] p-3 ${
        warning ? "border-amber-500/15" : "border-white/[0.06]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.02]">
            <Icon className="h-3.5 w-3.5 text-white/80" strokeWidth={1.6} />
          </div>
          <div className="font-display text-[12px] font-medium text-white">{name}</div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10.5px] text-white/55">
          <span className={`h-1.5 w-1.5 animate-pulse-soft rounded-full ${dotColor}`} /> {status}
        </span>
      </div>
      <div className="mt-2.5 space-y-1">
        {lines.map((l) => (
          <div key={l} className="flex items-center gap-1.5 text-[11px] text-white/50">
            <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
            {l}
          </div>
        ))}
      </div>
      {progress !== undefined && (
        <div className="mt-2.5 h-px w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full bg-white/80"
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.4 }}
          />
        </div>
      )}
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.012] p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="font-display text-xl font-medium tracking-tight text-white">{value}</div>
        <Activity className="h-3 w-3 text-white/45" strokeWidth={1.6} />
      </div>
    </div>
  );
}
