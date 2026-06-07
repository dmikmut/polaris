import { AgentLoadingIndicator } from "./AgentLoadingIndicator";
import { AGENT_NAMES, type AgentName } from "../lib/thinkingAgents";

const AGENT_COLORS: Record<AgentName, string> = {
  planner: "var(--planner)",
  executor: "var(--executor)",
  memory: "var(--reviewer)",
};

interface AgentThinkingStripProps {
  thinkingAgents: AgentName[];
}

export function AgentThinkingStrip({ thinkingAgents }: AgentThinkingStripProps) {
  if (thinkingAgents.length === 0) return null;

  return (
    <div className="agent-thinking-strip" role="status" aria-live="polite">
      {AGENT_NAMES.filter((agent) => thinkingAgents.includes(agent)).map((agent) => (
        <div key={agent} className="agent-thinking-chip" data-agent={agent}>
          <span
            className="agent-thinking-dot"
            style={{ background: AGENT_COLORS[agent] }}
            aria-hidden
          />
          <AgentLoadingIndicator agent={agent} compact />
        </div>
      ))}
    </div>
  );
}
