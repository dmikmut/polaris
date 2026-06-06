"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  FileLock2,
  Bot,
  ScrollText,
  Network,
  BarChart3,
  AlertOctagon,
  Settings,
  Sparkles,
  Play,
  ArrowRight,
  Search as SearchIcon,
  Hand,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: typeof LayoutDashboard;
  action: () => void;
};

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CommandItem[] = [
    { id: "go-dash", group: "Navigate", label: "Go to Dashboard", icon: LayoutDashboard, action: () => router.push("/dashboard") },
    { id: "go-proj", group: "Navigate", label: "Go to Projects", icon: FolderKanban, action: () => router.push("/projects") },
    { id: "go-contract", group: "Navigate", label: "Open Contract", icon: FileLock2, action: () => router.push("/contract") },
    { id: "go-agents", group: "Navigate", label: "Open Agent monitor", icon: Bot, action: () => router.push("/agents") },
    { id: "go-log", group: "Navigate", label: "Open Build log", icon: ScrollText, action: () => router.push("/build-log") },
    { id: "go-arch", group: "Navigate", label: "Open Architecture graph", icon: Network, action: () => router.push("/architecture") },
    { id: "go-anal", group: "Navigate", label: "Open Analytics", icon: BarChart3, action: () => router.push("/analytics") },
    { id: "go-err", group: "Navigate", label: "Open Errors", icon: AlertOctagon, action: () => router.push("/errors") },
    { id: "go-set", group: "Navigate", label: "Open Settings", icon: Settings, action: () => router.push("/settings") },
    { id: "go-demo", group: "Navigate", label: "Watch Demo mode", icon: Play, action: () => router.push("/demo") },
    { id: "act-apply-fix", group: "Actions", label: "Apply Overseer suggested fix", hint: "v_017 · response shape", icon: Sparkles, action: () => router.push("/errors") },
    { id: "act-escalate", group: "Actions", label: "Escalate current violation to human", hint: "send to Slack #polaris", icon: Hand, action: () => router.push("/errors") },
    { id: "act-amend", group: "Actions", label: "Request contract amendment", hint: "v1.0 locked", icon: Wrench, action: () => router.push("/contract") },
    { id: "act-new", group: "Actions", label: "New project from prompt", icon: Sparkles, action: () => router.push("/dashboard") },
  ];

  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  // Reset highlight when items change
  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Keyboard nav within palette
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[activeIdx];
        if (item) {
          item.action();
          setOpen(false);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIdx, filtered, setOpen]);

  // Group items by group
  const groups: Record<string, CommandItem[]> = {};
  filtered.forEach((it) => {
    if (!groups[it.group]) groups[it.group] = [];
    groups[it.group].push(it);
  });
  let runningIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-24 px-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c12]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
              <SearchIcon className="h-4 w-4 text-white/45" strokeWidth={1.6} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or jump to…"
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/35 focus:outline-none"
              />
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/45">
                Esc
              </kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12.5px] text-white/45">
                  No matches. Try &ldquo;contract&rdquo; or &ldquo;apply fix&rdquo;.
                </div>
              ) : (
                Object.entries(groups).map(([group, items]) => (
                  <div key={group} className="py-1">
                    <div className="px-3 pb-1.5 pt-2 text-[10px] uppercase tracking-[0.18em] text-white/35">
                      {group}
                    </div>
                    {items.map((it) => {
                      const idx = runningIdx++;
                      const isActive = idx === activeIdx;
                      const Icon = it.icon;
                      return (
                        <button
                          key={it.id}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => {
                            it.action();
                            setOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                            isActive
                              ? "bg-white/[0.06] text-white"
                              : "text-white/75 hover:bg-white/[0.025]"
                          )}
                        >
                          <Icon className="h-4 w-4 text-white/55" strokeWidth={1.6} />
                          <span className="flex-1 truncate text-[13px]">{it.label}</span>
                          {it.hint && (
                            <span className="hidden font-mono text-[10.5px] text-white/35 sm:inline">
                              {it.hint}
                            </span>
                          )}
                          {isActive && (
                            <ArrowRight className="h-3 w-3 text-white/65" strokeWidth={1.6} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/30 px-4 py-2 text-[10.5px] text-white/35">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">↑</kbd>
                  <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                  run
                </span>
              </div>
              <span className="font-mono">Polaris ⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
