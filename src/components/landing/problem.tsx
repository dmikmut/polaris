"use client";

import { motion } from "framer-motion";
import {
  RefreshCw,
  Unlink2,
  GitFork,
  Repeat2,
  Brain,
  EyeOff,
} from "lucide-react";

const problems = [
  {
    icon: RefreshCw,
    title: "Infinite debugging loops",
    body: "The same error reappears. The agent tries the same fix three times in a row, burning tokens.",
  },
  {
    icon: Unlink2,
    title: "Frontend / backend disconnect",
    body: "Backend ships { data: { todos } }. Frontend expects { todos }. Nothing breaks at compile time.",
  },
  {
    icon: GitFork,
    title: "Requirement drift",
    body: "By step 40 the agent has quietly forgotten half of what you asked for in the original prompt.",
  },
  {
    icon: Repeat2,
    title: "Repeated failed fixes",
    body: "No memory of what didn't work. The agent re-tries the same broken approach minutes later.",
  },
  {
    icon: Brain,
    title: "Context degradation",
    body: "As the conversation gets longer, the agent loses the thread. Decisions made on stale assumptions.",
  },
  {
    icon: EyeOff,
    title: "Silent incorrect assumptions",
    body: '"I assumed pagination wasn\'t needed." The agent never asked. You only find out in production.',
  },
];

export function Problem() {
  return (
    <section id="problem" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-5 inline-block text-[11px] uppercase tracking-[0.18em] text-white/40">
            The problem
          </div>
          <h2 className="font-display text-balance text-[34px] font-medium leading-tight tracking-tight text-white sm:text-5xl">
            Coding agents fail in predictable ways.
          </h2>
          <p className="mt-4 text-[14.5px] leading-relaxed text-white/50">
            Every team building with AI agents has hit the same wall. These six failure
            modes account for almost every &ldquo;why is this not working&rdquo; moment.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] md:grid-cols-2 lg:grid-cols-3">
          {problems.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="group relative bg-black p-7 transition-colors hover:bg-white/[0.012]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02]">
                  <Icon className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                </div>
                <h3 className="mt-5 font-display text-[16px] font-medium tracking-tight text-white">
                  {p.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/50">{p.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
