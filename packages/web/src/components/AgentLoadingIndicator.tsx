import { AGENT_DISPLAY_NAMES, type AgentName } from "../lib/thinkingAgents";

const AGENT_COLORS: Record<string, string> = {
  planner: "var(--planner)",
  executor: "var(--executor)",
  memory: "var(--reviewer)",
  human: "var(--human)",
};

interface AgentLoadingIndicatorProps {
  agent?: string | null;
  compact?: boolean;
}

export function AgentLoadingIndicator({ agent, compact = false }: AgentLoadingIndicatorProps) {
  const color = agent ? (AGENT_COLORS[agent] ?? "var(--accent)") : "var(--accent)";
  const label = agent && agent in AGENT_DISPLAY_NAMES
    ? `${AGENT_DISPLAY_NAMES[agent as AgentName]} is thinking…`
    : agent
      ? `${agent.charAt(0).toUpperCase()}${agent.slice(1)} is thinking…`
      : "Working…";

  return (
    <div className={`agent-loading${compact ? " agent-loading-compact" : ""}`} data-agent={agent}>
      <span
        className="agent-loading-spinner"
        style={{ borderTopColor: color }}
        aria-hidden
      />
      <span className="agent-loading-label">{label}</span>
    </div>
  );
}
