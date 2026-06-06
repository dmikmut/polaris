"use client";

import { motion } from "framer-motion";
import {
  FileLock2,
  AlertOctagon,
  Search,
  Repeat2,
  GitCompare,
  Hand,
  Network,
  Gauge,
} from "lucide-react";
import { Spotlight } from "@/components/fx/spotlight";

const features = [
  { icon: FileLock2, title: "Contract-driven development", body: "Every project starts with a locked spec. The Architect captures intent before code is written." },
  { icon: AlertOctagon, title: "Proactive error detection", body: "Coherence checks run every five steps — drift caught before it compounds." },
  { icon: Search, title: "Root cause analysis", body: "When something breaks, the Overseer traces it to the exact step that introduced the bug." },
  { icon: Repeat2, title: "Loop prevention", body: "Three failed attempts triggers escalation — not a fourth attempt with the same bad fix." },
  { icon: GitCompare, title: "Frontend/backend validation", body: "Response shapes, auth flows, and route paths cross-checked against the contract." },
  { icon: Hand, title: "Human escalation", body: "Unresolved violations route to you — with a one-line summary, root cause, and suggested fix." },
  { icon: Network, title: "Architecture monitoring", body: "A live graph of frontend, backend, database, and contract. Broken edges glow." },
  { icon: Gauge, title: "Confidence scoring", body: "Every step ships with a confidence number. Below 70%? The Overseer takes a second look." },
];

export function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-5 inline-block text-[11px] uppercase tracking-[0.18em] text-white/40">
            Capabilities
          </div>
          <h2 className="font-display text-balance text-[34px] font-medium leading-tight tracking-tight text-white sm:text-5xl">
            Everything you need to ship agent-built software.
          </h2>
          <p className="mt-4 text-[14.5px] leading-relaxed text-white/50">
            Built for engineering teams that want autonomy without losing control.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: (i % 4) * 0.04, duration: 0.4 }}
              >
                <Spotlight className="h-full bg-black p-6 transition-colors hover:bg-white/[0.015]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02]">
                    <Icon className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                  </div>
                  <h3 className="mt-5 font-display text-[15px] font-medium tracking-tight text-white">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/50">{f.body}</p>
                </Spotlight>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
