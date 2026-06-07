import type { AgentRole } from "./types.js";
import { ClaudeAgentPool } from "./claude-agent.js";
import type { ClaudeSession } from "./claude-agent.js";

const PLANNER_SYSTEM = `You are the Planner Agent (Claude) in Polaris, a multi-agent development system.

Your role:
- Help the user define and refine their project goal
- Break the goal into clear, ordered, small executable tasks
- Discuss the plan with the user until they accept it
- When the user requests changes mid-execution, update the plan accordingly

When presenting a plan, always structure your response with:
1. A clear goal summary
2. A numbered list of small tasks (each should be independently executable)
3. Key architectural decisions and file/module connections you anticipate
4. Any questions or assumptions

Format tasks as JSON in a fenced code block tagged "plan-tasks":
\`\`\`plan-tasks
[{"title": "...", "description": "..."}]
\`\`\`

Be collaborative. Ask clarifying questions until the goal and scope are clear. Do not execute code — only plan.

Plan readiness:
- While you still need clarification or the task list is incomplete, end your response with: PLAN_STATUS: drafting
- When the user has answered your questions and you output a complete plan-tasks block, end with: PLAN_STATUS: ready
- Never output PLAN_STATUS: ready without a complete plan-tasks JSON block.`;

const EXECUTOR_SYSTEM = `You are the Executor Agent (Claude Code) in Polaris, a multi-agent development system.

Your role:
- Execute one small task at a time from the accepted project plan
- Continue through all tasks autonomously — never ask the user for input or confirmation
- Use your tools (read_file, write_file, list_directory, run_command) to make real changes
- Report connections you discover (files, APIs, databases, third-party services)
- When you encounter errors, describe them clearly with full context and stop — do not proceed to the next task until the error is resolved

When you discover architectural connections, report them in a fenced block tagged "connections":
\`\`\`connections
[{"type": "file|api|database|third_party|internal", "source": "...", "target": "...", "description": "..."}]
\`\`\`

Focus on the current task only. Be precise and minimal in changes.`;

const MEMORY_SYSTEM = `You are the Memory Agent (Claude) in Polaris, a multi-agent development system.

Your role:
- Maintain knowledge of the project plan, all connections, and errors
- Continuously extract and catalog connections between frontend, backend, files, APIs, databases, and third-party services
- When the Executor encounters an error, analyze it using your full context and guide resolution through multi-turn discourse
- Track whether errors have occurred before and suggest prior resolutions
- Store architectural knowledge for future reference

You do NOT execute code directly. You analyze, remember, and advise.
When advising on errors, be specific: reference exact files, connections, and prior errors.
Structure guidance as actionable steps the Executor can follow.

When cataloging discoveries from Executor output, report connections:
\`\`\`connections
[{"type": "file|api|database|third_party|internal", "source": "...", "target": "...", "description": "..."}]
\`\`\`

And knowledge entries:
\`\`\`knowledge
[{"category": "architecture|convention|dependency|note", "title": "...", "content": "...", "relatedFiles": ["..."]}]
\`\`\`

During error resolution discourse, end your response with a status line:
RESOLUTION_STATUS: resolved | needs_more_info`;

export interface AgentRunResult {
  text: string;
  status: "finished" | "error" | "rate_limit" | "cancelled";
  runId: string;
  rateLimitRetryAfterSeconds?: number;
}

export type StreamCallback = (chunk: string) => void;

export class AgentManager {
  private readonly pool: ClaudeAgentPool;

  constructor(apiKey: string, cwd: string, model?: string) {
    this.pool = new ClaudeAgentPool(apiKey, cwd, model);
  }

  initializeAgents(sessions?: Partial<Record<AgentRole, ClaudeSession>>): void {
    for (const role of ["planner", "executor", "memory"] as AgentRole[]) {
      const session = sessions?.[role];
      if (session) {
        this.pool.loadSession(role, session);
      } else {
        this.pool.getSession(role);
      }
    }
  }

  getSessions(): Record<AgentRole, ClaudeSession> {
    return this.pool.getAllSessions();
  }

  getModel(): string {
    return this.pool.getModel();
  }

  private systemPrompt(role: AgentRole): string {
    switch (role) {
      case "planner":
        return PLANNER_SYSTEM;
      case "executor":
        return EXECUTOR_SYSTEM;
      case "memory":
        return MEMORY_SYSTEM;
    }
  }

  async send(
    role: AgentRole,
    prompt: string,
    onStream?: StreamCallback,
    options?: { shouldAbort?: () => boolean },
  ): Promise<AgentRunResult> {
    const result = await this.pool.run(
      role,
      this.systemPrompt(role),
      prompt,
      onStream,
      {
        useTools: role === "executor",
        shouldAbort: options?.shouldAbort,
      },
    );

    return {
      text: result.text,
      status: result.status,
      runId: result.runId,
      rateLimitRetryAfterSeconds: result.rateLimitRetryAfterSeconds,
    };
  }

  abortAll(): void {
    this.pool.abortAll();
  }

  async dispose(): Promise<void> {
    this.pool.abortAll();
  }
}

export function isPlanReadyForAccept(text: string): boolean {
  return /PLAN_STATUS:\s*ready\b/i.test(text);
}

export function parsePlanTasks(text: string): { title: string; description: string }[] {
  const match = text.match(/```plan-tasks\s*([\s\S]*?)```/);
  if (!match) return [];
  try {
    return JSON.parse(match[1].trim()) as { title: string; description: string }[];
  } catch {
    return [];
  }
}

export function parseConnections(
  text: string,
): { type: string; source: string; target: string; description: string }[] {
  const match = text.match(/```connections\s*([\s\S]*?)```/);
  if (!match) return [];
  try {
    return JSON.parse(match[1].trim()) as {
      type: string;
      source: string;
      target: string;
      description: string;
    }[];
  } catch {
    return [];
  }
}

export function parseKnowledge(
  text: string,
): {
  category: string;
  title: string;
  content: string;
  relatedFiles: string[];
}[] {
  const match = text.match(/```knowledge\s*([\s\S]*?)```/);
  if (!match) return [];
  try {
    return JSON.parse(match[1].trim()) as {
      category: string;
      title: string;
      content: string;
      relatedFiles: string[];
    }[];
  } catch {
    return [];
  }
}

export function parseResolutionStatus(text: string): "resolved" | "needs_more_info" | null {
  const match = text.match(/RESOLUTION_STATUS:\s*(resolved|needs_more_info)/i);
  if (!match) return null;
  return match[1].toLowerCase() as "resolved" | "needs_more_info";
}
