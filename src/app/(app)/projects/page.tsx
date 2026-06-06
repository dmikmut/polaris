"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  FolderKanban,
  GitBranch,
  ShieldCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { projects } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

const statusTone: Record<string, string> = {
  active: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  paused: "border-white/10 bg-white/[0.04] text-white/55",
  complete: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  review: "border-amber-500/20 bg-amber-500/10 text-amber-300",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[12px] text-white/45">
          <Search className="h-3.5 w-3.5" />
          <span>Search 5 projects…</span>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-3.5 w-3.5" /> New project
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl transition-colors hover:border-white/[0.12]"
          >
            <div className="pointer-events-none absolute -inset-x-12 -top-12 h-32 bg-gradient-to-b from-blue-500/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-blue-500/15 to-purple-500/15">
                  <FolderKanban className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold tracking-tight text-white">{p.name}</div>
                  <div className="text-[11px] text-white/45">{p.framework} · {p.language}</div>
                </div>
              </div>
              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em]", statusTone[p.status])}>
                {p.status}
              </span>
            </div>
            <p className="relative mt-3 line-clamp-2 text-[12.5px] text-white/55">{p.description}</p>

            {/* Progress */}
            <div className="relative mt-4">
              <div className="flex items-center justify-between text-[10.5px] text-white/45">
                <span>Build progress</span>
                <span className="font-mono">{p.progress}%</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>

            <div className="relative mt-4 grid grid-cols-3 gap-2">
              <Stat icon={ShieldCheck} label="Violations" value={p.errorsPrevented} tone="text-amber-300" />
              <Stat icon={RefreshCw} label="Loops" value={p.loopsPrevented} tone="text-emerald-300" />
              <Stat icon={GitBranch} label="Contract" value={p.contractVersion} tone="text-blue-300" mono />
            </div>

            <div className="relative mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
              <span className="text-[10.5px] text-white/40">Updated {formatRelativeTime(p.updatedAt)}</span>
              <Link
                href="/dashboard"
                className="text-[11.5px] font-medium text-blue-300 hover:text-blue-200"
              >
                Open →
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
  mono,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: string | number;
  tone: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/40">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={cn("mt-0.5 text-[12.5px] font-semibold", tone, mono && "font-mono")}>{value}</div>
    </div>
  );
}
