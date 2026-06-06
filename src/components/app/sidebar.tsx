"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PolarisWordmark } from "@/components/brand/polaris-logo";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/contract", label: "Contract", icon: FileLock2 },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/build-log", label: "Build Log", icon: ScrollText },
  { href: "/architecture", label: "Architecture", icon: Network },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/errors", label: "Errors", icon: AlertOctagon, badge: 1 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/[0.04] bg-black/30 backdrop-blur-xl lg:flex">
      {/* Brand */}
      <div className="px-5 pt-5 pb-5">
        <Link href="/">
          <PolarisWordmark size="sm" />
        </Link>
      </div>

      {/* Project switcher */}
      <button className="mx-3 mb-5 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.012] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.025]">
        <div className="h-2 w-2 rounded-full bg-emerald-400/70 shadow-[0_0_8px_rgba(78,201,167,0.4)]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium text-white">Atlas Todo API</div>
          <div className="truncate text-[10.5px] text-white/35">v1.0 · contract locked</div>
        </div>
        <svg className="h-3 w-3 text-white/35" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-white/[0.05] text-white"
                  : "text-white/50 hover:bg-white/[0.025] hover:text-white"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-y-1 left-0 w-px bg-white/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={cn("h-4 w-4 transition-colors", active ? "text-white" : "text-white/45 group-hover:text-white/80")}
                strokeWidth={1.6}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-white/[0.08] px-1.5 text-[10px] font-medium text-white/70">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Demo card */}
      <div className="m-3 rounded-xl border border-white/[0.06] bg-white/[0.012] p-3">
        <div className="font-display text-[12.5px] font-medium text-white">Guided demo</div>
        <div className="mt-0.5 text-[11px] text-white/45">
          Watch three agents catch a bug in real time.
        </div>
        <Link
          href="/demo"
          className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/85 hover:text-white"
        >
          <Play className="h-3 w-3 fill-current" /> Start demo
        </Link>
      </div>

      {/* User */}
      <div className="border-t border-white/[0.04] px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-[11px] font-medium text-white">
            D
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium text-white">Dharmik K.</div>
            <div className="truncate text-[10.5px] text-white/35">dharmik@polaris.dev</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
