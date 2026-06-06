import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { Solution } from "@/components/landing/solution";
import { Features } from "@/components/landing/features";
import { Preview } from "@/components/landing/preview";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { CodeMarquee } from "@/components/fx/code-marquee";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col bg-black">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <CodeMarquee />
        <Problem />
        <Solution />
        <Features />
        <Preview />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
