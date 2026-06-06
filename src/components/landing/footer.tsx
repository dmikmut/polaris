import { PolarisWordmark } from "@/components/brand/polaris-logo";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-3 text-[12px] text-white/45">
          <PolarisWordmark size="sm" />
          <span className="hidden sm:inline">·</span>
          <span>© 2026 · the north star for AI agents</span>
        </div>
        <div className="flex items-center gap-6 text-[11.5px] text-white/35">
          <a className="hover:text-white/70" href="#">Privacy</a>
          <a className="hover:text-white/70" href="#">Terms</a>
          <a className="hover:text-white/70" href="#">Security</a>
          <a className="hover:text-white/70" href="#">Status</a>
        </div>
      </div>
    </footer>
  );
}
