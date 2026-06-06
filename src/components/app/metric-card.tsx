"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/fx/spotlight";

type Tone = "blue" | "purple" | "amber" | "green" | "rose" | "cyan";

const iconTone: Record<Tone, string> = {
  blue: "text-[#a8c6f5]",
  purple: "text-[#c4b8f4]",
  amber: "text-[#e5b067]",
  green: "text-[#4ec9a7]",
  rose: "text-[#e07b7b]",
  cyan: "text-[#9bd2db]",
};

const iconGlow: Record<Tone, string> = {
  blue: "rgba(168, 198, 245, 0.16)",
  purple: "rgba(196, 184, 244, 0.14)",
  amber: "rgba(229, 176, 103, 0.14)",
  green: "rgba(78, 201, 167, 0.14)",
  rose: "rgba(224, 123, 123, 0.14)",
  cyan: "rgba(155, 210, 219, 0.14)",
};

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "blue",
  sub,
  index = 0,
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon: LucideIcon;
  tone?: Tone;
  sub?: string;
  index?: number;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Spotlight
        className="rounded-xl border border-white/[0.05] bg-white/[0.012] p-5 backdrop-blur-xl transition-colors"
        color={iconGlow[tone]}
        radius={240}
      >
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">{label}</div>
            <div className="mt-2 font-display text-[26px] font-medium leading-none tracking-tight text-white">
              {value}
            </div>
            {(sub || delta !== undefined) && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                {delta !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[10.5px] font-medium",
                      positive ? "text-emerald-300/85" : "text-rose-300/85"
                    )}
                  >
                    {positive ? <TrendingUp className="h-3 w-3" strokeWidth={1.6} /> : <TrendingDown className="h-3 w-3" strokeWidth={1.6} />}
                    {positive ? "+" : ""}
                    {delta}%
                  </span>
                )}
                {sub && <span className="text-white/35">{sub}</span>}
              </div>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.012]">
            <Icon className={cn("h-3.5 w-3.5", iconTone[tone])} strokeWidth={1.6} />
          </div>
        </div>
      </Spotlight>
    </motion.div>
  );
}
