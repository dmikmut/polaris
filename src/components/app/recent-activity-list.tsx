"use client";

import { motion } from "framer-motion";
import { Brain, Code2, Eye } from "lucide-react";
import { recentActivity } from "@/lib/mock-data";

const agentMeta: Record<string, { Icon: typeof Brain; label: string }> = {
  architect: { Icon: Brain, label: "Architect" },
  builder: { Icon: Code2, label: "Builder" },
  overseer: { Icon: Eye, label: "Overseer" },
};

export function RecentActivityList() {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.012] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3.5">
        <h3 className="font-display text-[13px] font-medium text-white">Recent activity</h3>
        <button className="text-[11px] text-white/40 transition-colors hover:text-white">View all →</button>
      </div>
      <ul className="divide-y divide-white/[0.035]">
        {recentActivity.map((a, i) => {
          const meta = agentMeta[a.agent];
          const Icon = meta.Icon;
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 px-5 py-3"
            >
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
                <Icon className="h-3 w-3 text-white/75" strokeWidth={1.6} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] text-white/80">{a.action}</div>
                <div className="text-[10.5px] text-white/35">{meta.label} · {a.ts}</div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
