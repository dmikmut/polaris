"use client";

import { Button } from "@/components/ui/button";
import {
  Bell,
  Bot,
  Cpu,
  KeySquare,
  ShieldCheck,
  User2,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsCard icon={User2} title="Profile" description="How you appear to your team.">
        <Row label="Name" value="Dharmik K." />
        <Row label="Email" value="dharmik@forge.dev" />
        <Row label="Workspace" value="forge-prod" />
      </SettingsCard>

      <SettingsCard icon={Bot} title="Agents" description="Provider routing for each agent role.">
        <Row label="Architect" value="claude-opus-4-7" tag="planning" />
        <Row label="Builder" value="claude-opus-4-7" tag="coding" />
        <Row label="Overseer" value="gpt-5" tag="auditing" />
        <Row label="Escalation channel" value="email + Slack #forge" />
      </SettingsCard>

      <SettingsCard icon={Cpu} title="Loop prevention" description="Behavior on repeated failures.">
        <Row label="Max attempts per task" value="3" />
        <Row label="Coherence check cadence" value="every 5 steps" />
        <Row label="Confidence threshold" value="70%" />
      </SettingsCard>

      <SettingsCard icon={ShieldCheck} title="Contract policy" description="Who can amend, and when.">
        <Row label="Amendment lock" value="Human only" tag="strict" />
        <Row label="Auto-fix on violation" value="Off — require approval" />
        <Row label="Production gate" value="0 open violations" />
      </SettingsCard>

      <SettingsCard icon={Bell} title="Notifications" description="When we ping you.">
        <Row label="Contract violations" value="Always" />
        <Row label="Loop prevented" value="Daily digest" />
        <Row label="Escalations" value="Instant" />
      </SettingsCard>

      <SettingsCard icon={KeySquare} title="API keys" description="For programmatic access.">
        <Row label="forge_live_***************" value="created 2026-05-12" />
        <div className="pt-2">
          <Button variant="outline" size="sm">Generate new key</Button>
        </div>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User2;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-white/[0.05] px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
          <Icon className="h-4 w-4 text-white/80" />
        </div>
        <div>
          <div className="text-[13.5px] font-semibold text-white">{title}</div>
          <div className="text-[11.5px] text-white/45">{description}</div>
        </div>
      </div>
      <div className="space-y-2 p-5">{children}</div>
    </section>
  );
}

function Row({ label, value, tag }: { label: string; value: string; tag?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
      <div className="text-[12.5px] text-white/65">{label}</div>
      <div className="flex items-center gap-2">
        {tag && (
          <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0 text-[10px] uppercase tracking-[0.18em] text-blue-300">
            {tag}
          </span>
        )}
        <span className="font-mono text-[12px] text-white/85">{value}</span>
      </div>
    </div>
  );
}
