"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PolarisMark } from "@/components/brand/polaris-logo";

export function CTA() {
  return (
    <section className="relative pb-32 pt-12">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.012] p-12 text-center backdrop-blur-xl sm:p-16"
        >
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: 16 }).map((_, i) => {
              const x = (i * 41) % 100;
              const y = (i * 67) % 100;
              return (
                <motion.span
                  key={i}
                  className="absolute h-0.5 w-0.5 rounded-full bg-white/40"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.18 }}
                />
              );
            })}
          </div>

          <div className="relative">
            <div className="mx-auto flex justify-center">
              <PolarisMark size={36} glow />
            </div>
            <h2 className="mt-6 font-display text-balance text-[34px] font-medium tracking-tight text-white sm:text-5xl">
              Chart your first build.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[14.5px] text-white/55">
              Give Polaris a prompt. The Architect takes it from there.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/dashboard">
                <Button variant="default" size="lg" className="group rounded-full px-6">
                  Start charting
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="ghost" size="lg" className="rounded-full px-6">
                  Watch the demo
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
