export const AGENT_NAMES = ["planner", "executor", "memory"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export function getThinkingAgents(options: {
  agentBusy: boolean;
  workingAgent: string | null;
  activeAgent: string | null;
  memoryCaptureActive: boolean;
  memoryAgentActive: boolean;
}): AgentName[] {
  const { agentBusy, workingAgent, activeAgent, memoryCaptureActive, memoryAgentActive } =
    options;

  if (!agentBusy) return [];

  const thinking = new Set<AgentName>();

  const primary = workingAgent ?? activeAgent;
  if (primary === "planner" || primary === "executor" || primary === "memory") {
    thinking.add(primary);
  }

  if (memoryCaptureActive && (primary === "memory" || !primary)) {
    thinking.add("memory");
  }

  if (memoryAgentActive && primary === "memory") {
    thinking.add("memory");
  }

  return AGENT_NAMES.filter((name) => thinking.has(name));
}

export function isAgentThinking(agent: AgentName, thinkingAgents: AgentName[]): boolean {
  return thinkingAgents.includes(agent);
}
