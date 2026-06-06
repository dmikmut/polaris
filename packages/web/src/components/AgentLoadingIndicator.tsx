const AGENT_COLORS: Record<string, string> = {
  planner: "var(--planner)",
  executor: "var(--executor)",
  memory: "var(--memory)",
  human: "var(--human)",
};

interface AgentLoadingIndicatorProps {
  agent?: string | null;
  compact?: boolean;
}

export function AgentLoadingIndicator({ agent, compact = false }: AgentLoadingIndicatorProps) {
  const color = agent ? (AGENT_COLORS[agent] ?? "var(--accent)") : "var(--accent)";
  const label = agent
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
