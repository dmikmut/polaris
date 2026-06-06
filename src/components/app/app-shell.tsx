"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette, useCommandPalette } from "./command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette();
  return (
    <div className="relative min-h-screen flex-1 bg-[#06080d]">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar onOpenPalette={() => setOpen(true)} />
        <main className="px-6 py-6">{children}</main>
      </div>
      <CommandPalette open={open} setOpen={setOpen} />
    </div>
  );
}
