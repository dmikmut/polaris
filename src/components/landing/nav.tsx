"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PolarisWordmark } from "@/components/brand/polaris-logo";

export function LandingNav() {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 pt-5"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/[0.06] bg-black/40 px-5 py-2 backdrop-blur-xl">
        <Link href="/">
          <PolarisWordmark size="sm" />
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] text-white/55 md:flex">
          <a href="#problem" className="transition-colors hover:text-white">Problem</a>
          <a href="#solution" className="transition-colors hover:text-white">Solution</a>
          <a href="#features" className="transition-colors hover:text-white">Capabilities</a>
          <Link href="/demo" className="transition-colors hover:text-white">Demo</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="hidden sm:inline-block">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="default" size="sm" className="rounded-full">
              Start charting
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
