import { AgentLoadingIndicator } from "./AgentLoadingIndicator";
import { MessageContent } from "./MessageContent";

const AGENT_COLORS: Record<string, string> = {
  planner: "var(--planner)",
  executor: "var(--executor)",
  memory: "var(--memory)",
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
          {agent}
        </span>
      </div>
      {content ? <MessageContent content={content} markdown={markdown} /> : null}
    </div>
  );
}
