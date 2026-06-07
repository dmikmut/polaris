import { AgentLoadingIndicator } from "./AgentLoadingIndicator";
import { MessageContent } from "./MessageContent";
import { AGENT_DISPLAY_NAMES, type AgentName } from "../lib/thinkingAgents";

const AGENT_COLORS: Record<string, string> = {
  planner: "var(--planner)",
  executor: "var(--executor)",
  memory: "var(--reviewer)",
};

interface StreamingAgentMessageProps {
  agent: string;
  content: string;
  markdown?: boolean;
}

export function StreamingAgentMessage({
  agent,
  content,
  markdown = true,
}: StreamingAgentMessageProps) {
  return (
    <div className="message streaming" data-agent={agent}>
      <div className="message-agent-row">
        <AgentLoadingIndicator agent={agent} compact />
        <span className="message-agent" style={{ color: AGENT_COLORS[agent] ?? "var(--accent)" }}>
          {agent in AGENT_DISPLAY_NAMES ? AGENT_DISPLAY_NAMES[agent as AgentName] : agent}
        </span>
      </div>
      {content ? <MessageContent content={content} markdown={markdown} /> : null}
    </div>
  );
}
