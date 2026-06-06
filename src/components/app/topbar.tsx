"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronRight, Command, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const titles: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Dashboard", sub: "Live state across all projects" },
  "/projects": { title: "Projects", sub: "All workspaces in flight" },
  "/contract": { title: "Contract", sub: "The locked source of truth" },
  "/agents": { title: "Agents", sub: "Architect · Builder · Overseer" },
  "/build-log": { title: "Build log", sub: "Chronological record of every action" },
  "/architecture": { title: "Architecture", sub: "System graph with live health" },
  "/analytics": { title: "Analytics", sub: "Trends, savings, and intervention quality" },
  "/errors": { title: "Errors", sub: "Open and resolved incidents" },
  "/settings": { title: "Settings", sub: "Workspace preferences" },
  "/demo": { title: "Demo mode", sub: "Step through a real intervention" },
};

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname() ?? "/dashboard";
  const entry = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] ?? {
    title: "Dashboard",
    sub: "Live state across all projects",
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-black/60 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-6 pt-3.5 pb-2.5">
        <div className="min-w-0">
          {/* Breadcrumbs */}
          <nav className="mb-1 flex items-center gap-1.5 text-[11px] text-white/35">
            <Link href="/dashboard" className="hover:text-white/70">
              Atlas Todo API
            </Link>
            <ChevronRight className="h-3 w-3" strokeWidth={1.6} />
            <span className="text-white/55">{entry.title}</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="font-display text-[18px] font-medium tracking-tight text-white">
              {entry.title}
            </div>
            <span className="hidden text-[12px] text-white/40 md:inline">— {entry.sub}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPalette}
            className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.012] px-3 py-1.5 text-[12px] text-white/45 transition-colors hover:border-white/[0.12] hover:bg-white/[0.025] hover:text-white/75 md:flex"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} />
            <span>Search or jump to…</span>
            <kbd className="ml-3 flex items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.025] px-1 py-0.5 font-mono text-[10px] text-white/45">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" strokeWidth={1.6} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400/80" />
          </Button>
          <Button variant="default" size="sm" className="rounded-full">
            New project
          </Button>
        </div>
      </div>
    </header>
  );
}
