"use client";

import { motion } from "framer-motion";
import {
  Lock,
  FileLock2,
  ShieldCheck,
  ListChecks,
  Server,
  Database,
  Layout as LayoutIcon,
  Pencil,
  History,
  Sparkles,
} from "lucide-react";
import { currentContract } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

const methodColor: Record<string, string> = {
  GET: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  POST: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  PATCH: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  DELETE: "text-rose-300 bg-rose-500/10 border-rose-500/20",
};

export default function ContractPage() {
  const c = currentContract;
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-blue-500/[0.06] via-purple-500/[0.04] to-transparent p-6 backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute inset-0 grid-bg-fine opacity-30" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-[1px] shadow-[0_0_40px_-8px_rgba(59,130,246,0.6)]">
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0a0c12]/90">
                <FileLock2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-tight text-white">Atlas Todo API</h1>
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10.5px] text-white/70">
                  {c.version}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-emerald-300">
                  <Lock className="h-2.5 w-2.5" /> Locked
                </span>
              </div>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/65">{c.goal}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-white/45">
                <span>Locked by <span className="text-white/75">{c.lockedBy}</span></span>
                <span>·</span>
                <span>Locked {formatRelativeTime(c.lockedAt)}</span>
                <span>·</span>
                <span className="text-amber-300">Only the human can amend</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Request amendment
            </Button>
            <Button variant="ghost" size="sm">
              <History className="h-3.5 w-3.5" /> Version history
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column - main contract content */}
        <div className="space-y-4 lg:col-span-2">
          <Section icon={ListChecks} title="Goal">
            <p className="text-[13px] leading-relaxed text-white/75">{c.goal}</p>
          </Section>

          <Section icon={Server} title="API endpoints">
            <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-lg border border-white/[0.05]">
              {c.apiEndpoints.map((e) => (
                <li key={e.path + e.method} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className={`inline-flex w-16 justify-center rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${methodColor[e.method] ?? "text-white/70"}`}
                  >
                    {e.method}
                  </span>
                  <code className="flex-1 text-[12.5px] text-white/85">{e.path}</code>
                  <span className="font-mono text-[11.5px] text-white/45">→ {e.returns}</span>
                </li>
              ))}
            </ul>
          </Section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Section icon={LayoutIcon} title="Frontend expectations" compact>
              <ChecklistList items={c.frontend} />
            </Section>
            <Section icon={Server} title="Backend expectations" compact>
              <ChecklistList items={c.backend} />
            </Section>
          </div>

          <Section icon={Database} title="Database schema" compact>
            <ul className="space-y-1.5">
              {c.database.map((d) => (
                <li
                  key={d}
                  className="rounded-md border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[12px] text-white/75"
                >
                  {d}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={ShieldCheck} title="Definition of done">
            <ChecklistList items={c.definitionOfDone} green />
          </Section>
        </div>

        {/* Right column - version history & meta */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
              <History className="h-3.5 w-3.5" /> Version history
            </div>
            <ol className="relative mt-4 space-y-4">
              <span className="absolute left-[5px] top-2 bottom-2 w-px bg-white/[0.08]" aria-hidden />
              {c.versionHistory.map((v, i) => (
                <li key={v.version} className="relative pl-5">
                  <span
                    className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${
                      i === 0
                        ? "bg-gradient-to-br from-blue-400 to-purple-400 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                        : "bg-white/30"
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11.5px] font-semibold text-white">{v.version}</span>
                    {i === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[9.5px] uppercase tracking-[0.18em] text-emerald-300">
                        <Lock className="h-2 w-2" /> Locked
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-white/55">{v.note}</div>
                  <div className="mt-0.5 text-[10.5px] text-white/35">{v.by} · {formatRelativeTime(v.at)}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl">
            <div className="pointer-events-none absolute -inset-x-12 -top-12 h-32 bg-gradient-to-b from-purple-500/20 to-transparent opacity-50" />
            <div className="relative flex items-center gap-2 text-[13px] font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" /> Contract integrity
            </div>
            <p className="relative mt-1 text-[12px] text-white/55">
              The Overseer continuously audits Builder output against this contract.
            </p>
            <div className="relative mt-4 space-y-2 text-[12px]">
              <Row label="Coherence checks" value="12 passed · 1 flagged" />
              <Row label="Endpoints validated" value={`${c.apiEndpoints.length} of ${c.apiEndpoints.length}`} />
              <Row label="Definition of done" value={`0 of ${c.definitionOfDone.length} verified`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  compact,
}: {
  icon: typeof Server;
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/[0.05] px-5 py-3">
        <Icon className="h-3.5 w-3.5 text-white/55" />
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/85">{title}</div>
      </div>
      <div className={compact ? "p-4" : "p-5"}>{children}</div>
    </div>
  );
}

function ChecklistList({ items, green }: { items: string[]; green?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 rounded-md border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[12.5px] text-white/75"
        >
          <span
            className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${green ? "bg-emerald-400" : "bg-blue-400"}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55">{label}</span>
      <span className="text-white/85">{value}</span>
    </div>
  );
}
