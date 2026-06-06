"use client";

import {
  BuildVolumeChart,
  ConfidenceChart,
  TokenSavingsChart,
  ViolationBreakdownChart,
} from "@/components/app/charts";
import { MetricCard } from "@/components/app/metric-card";
import {
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Hand,
  Gauge,
  Sparkles,
} from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Errors prevented" value={87} icon={ShieldCheck} tone="green" delta={32} index={0} />
        <MetricCard label="Loops prevented" value={28} icon={RefreshCw} tone="blue" delta={18} index={1} />
        <MetricCard label="Violations caught" value={44} icon={Sparkles} tone="purple" delta={9} index={2} />
        <MetricCard label="Avg confidence" value="86%" icon={Gauge} tone="cyan" delta={4} index={3} />
        <MetricCard label="Human escalations" value={3} icon={Hand} tone="rose" sub="this week" index={4} />
        <MetricCard label="Token savings" value="42%" icon={TrendingUp} tone="amber" delta={11} index={5} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl lg:col-span-2">
          <ChartHeader title="Build & error volume" sub="Last 7 days · all projects" />
          <BuildVolumeChart />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl">
          <ChartHeader title="Violation breakdown" sub="By type, last 30 days" />
          <ViolationBreakdownChart />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl lg:col-span-2">
          <ChartHeader title="Builder confidence" sub="Step-by-step trend · Atlas Todo API" />
          <ConfidenceChart />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-5 backdrop-blur-xl">
          <ChartHeader title="Token savings" sub="Weekly · vs single-agent baseline" />
          <TokenSavingsChart />
        </div>
      </div>
    </div>
  );
}

function ChartHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <div className="text-[13px] font-semibold text-white">{title}</div>
        <div className="text-[11px] text-white/45">{sub}</div>
      </div>
    </div>
  );
}
