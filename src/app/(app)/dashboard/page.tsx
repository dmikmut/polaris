"use client";

import {
  FolderKanban,
  Bot,
  RefreshCw,
  ShieldAlert,
  Hand,
  CheckCircle2,
} from "lucide-react";
import { MetricCard } from "@/components/app/metric-card";
import { AgentStatusRow } from "@/components/app/agent-status-row";
import { RecentActivityList } from "@/components/app/recent-activity-list";
import {
  BuildVolumeChart,
  ConfidenceChart,
  ViolationBreakdownChart,
} from "@/components/app/charts";
import { dashboardMetrics } from "@/lib/mock-data";

export default function DashboardPage() {
  const m = dashboardMetrics;
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Active projects" value={m.activeProjects} icon={FolderKanban} tone="blue" delta={12} index={0} />
        <MetricCard label="Active agents" value={m.activeAgents} icon={Bot} tone="purple" sub="3 paused" index={1} />
        <MetricCard label="Loops prevented" value={m.loopsPrevented} icon={RefreshCw} tone="green" delta={18} index={2} />
        <MetricCard label="Violations found" value={m.contractViolations} icon={ShieldAlert} tone="amber" delta={-4} index={3} />
        <MetricCard label="Human escalations" value={m.humanEscalations} icon={Hand} tone="rose" sub="this week" index={4} />
        <MetricCard label="Tasks completed" value={m.tasksCompleted.toLocaleString()} icon={CheckCircle2} tone="cyan" delta={24} index={5} />
      </section>

      <AgentStatusRow />

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-white">Build volume</div>
              <div className="text-[11px] text-white/45">Steps executed vs errors caught — last 7 days</div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white/55">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Builds</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Errors</span>
            </div>
          </div>
          <div className="mt-3">
            <BuildVolumeChart />
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl">
          <div>
            <div className="text-[13px] font-semibold text-white">Violation types</div>
            <div className="text-[11px] text-white/45">What the Overseer is catching</div>
          </div>
          <div className="mt-3">
            <ViolationBreakdownChart />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-white">Builder confidence — Atlas Todo API</div>
              <div className="text-[11px] text-white/45">Step-by-step confidence trend, dip at step 8 caught by Overseer</div>
            </div>
            <span className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10.5px] text-white/55">v1.0</span>
          </div>
          <div className="mt-3">
            <ConfidenceChart />
          </div>
        </div>
        <RecentActivityList />
      </section>
    </div>
  );
}
