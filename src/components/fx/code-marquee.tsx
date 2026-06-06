"use client";

import { Brain, Code2, Eye, FileLock2, AlertOctagon, Wrench, User2 } from "lucide-react";

type Event = {
  Icon: typeof Brain;
  tag: string;
  text: string;
};

const events: Event[] = [
  { Icon: User2, tag: "human", text: '"Build me a Todo App with login that saves my todos."' },
  { Icon: Brain, tag: "architect", text: "6 ambiguities detected · clarifying auth method" },
  { Icon: FileLock2, tag: "contract", text: "v1.0 locked — only human can amend" },
  { Icon: Code2, tag: "builder", text: "step 11 — POST /auth/login · confidence 91%" },
  { Icon: Code2, tag: "builder", text: "step 12 — GET /api/todos · confidence 87%" },
  { Icon: AlertOctagon, tag: "violation", text: "expected { todos: [] } · got { data: { todos: [] } }" },
  { Icon: Eye, tag: "overseer", text: "root cause traced to step 12 · confidence 96%" },
  { Icon: Wrench, tag: "correction", text: "wrapper removed · single-pass fix · loop counter 0/3" },
  { Icon: Code2, tag: "builder", text: "step 13 — PATCH /api/todos/:id · confidence 93%" },
  { Icon: Brain, tag: "architect", text: "coherence check passed — DB schema matches contract" },
];

const tagColor: Record<string, string> = {
  human: "text-white/55",
  architect: "text-[#a8c6f5]",
  contract: "text-emerald-300/85",
  builder: "text-[#c4b8f4]",
  violation: "text-amber-300/85",
  overseer: "text-rose-300/80",
  correction: "text-emerald-300/85",
};

export function CodeMarquee() {
  // duplicate for seamless scroll
  const stream = [...events, ...events];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.05] bg-black py-3">
      {/* fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-black to-transparent" />

      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {stream.map((e, i) => {
          const Icon = e.Icon;
          return (
            <div key={i} className="flex items-center gap-2 font-mono text-[11.5px]">
              <Icon className="h-3 w-3 text-white/55" strokeWidth={1.7} />
              <span className={`uppercase tracking-[0.18em] ${tagColor[e.tag]}`}>
                {e.tag}
              </span>
              <span className="text-white/45">›</span>
              <span className="text-white/75">{e.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
