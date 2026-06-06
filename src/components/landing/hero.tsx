"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { AgentFlow } from "./agent-flow";
import { PolarisStar } from "@/components/fx/polaris-star";
import { Starfield } from "@/components/fx/starfield";
import { Aurora } from "@/components/fx/aurora";
import { HeroArc } from "@/components/fx/hero-arc";
import { ShinyText } from "@/components/fx/shiny-text";
import { SplitText } from "@/components/fx/split-text";
import { Magnetic } from "@/components/fx/magnetic";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black pt-40 pb-24">
      <Starfield count={70} />
      <Aurora variant="blue" className="-top-32 left-1/2 -translate-x-1/2" />
      <HeroArc />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Centerpiece star */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.2, 0.65, 0.3, 1] }}
            className="relative"
          >
            <PolarisStar size={340} />
            {/* Polaris label */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 -translate-y-4"
            >
              <div className="flex flex-col items-center gap-1.5">
                <span className="h-3 w-px bg-white/25" />
                <span className="rounded-full border border-white/10 bg-black/70 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.28em] text-white/65 backdrop-blur">
                  α UMi · Polaris
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="relative mx-auto mt-20 flex max-w-3xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-40" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            </span>
            Public beta · open the constellation
          </motion.div>

          <h1
            className="font-display text-balance text-[44px] font-medium leading-[1.04] tracking-tight text-white sm:text-6xl md:text-[72px]"
            style={{ fontFamily: "Satoshi, var(--font-display)" }}
          >
            <SplitText text="The north star for" delay={0.5} />
            <br />
            <ShinyText blue>AI coding agents.</ShinyText>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.05 }}
            className="mt-7 max-w-xl text-balance text-[15px] leading-relaxed text-white/55 sm:text-base"
          >
            Three agents. One locked contract. Polaris turns vague prompts into
            structured specifications and keeps every line of code aligned with your
            original intent.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Magnetic strength={0.18}>
              <Link href="/dashboard">
                <Button variant="default" size="lg" className="group rounded-full px-7">
                  Start charting
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </Magnetic>
            <Magnetic strength={0.18}>
              <Link href="/demo">
                <Button variant="ghost" size="lg" className="rounded-full px-7">
                  <PlayCircle className="h-4 w-4" />
                  Watch the demo
                </Button>
              </Link>
            </Magnetic>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/30"
          >
            <span>No credit card</span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/15" />
            <span>Claude · GPT · Gemini</span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/15" />
            <span>Self-host or cloud</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.5 }}
          className="mt-20"
        >
          <AgentFlow />
        </motion.div>
      </div>
    </section>
  );
}
