import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import type { AgentRole } from "./types.js";
import { EXECUTOR_TOOLS, executeTool } from "./code-tools.js";
import { formatRateLimitError, isRateLimitError } from "./rate-limit.js";

export type StoredMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface ClaudeSession {
  sessionId: string;
  messages: StoredMessage[];
}

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOOL_ROUNDS = 30;

export class ClaudeAgentPool {
  private readonly client: Anthropic;
  private readonly cwd: string;
  private readonly model: string;
  private readonly sessions = new Map<AgentRole, ClaudeSession>();

  constructor(apiKey: string, cwd: string, model = DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.cwd = cwd;
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  loadSession(role: AgentRole, session: ClaudeSession | undefined): void {
    if (session) {
      this.sessions.set(role, session);
    }
  }

  getSession(role: AgentRole): ClaudeSession {
    let session = this.sessions.get(role);
    if (!session) {
      session = { sessionId: randomUUID(), messages: [] };
      this.sessions.set(role, session);
    }
    return session;
  }

  getAllSessions(): Record<AgentRole, ClaudeSession> {
    return {
      planner: this.getSession("planner"),
      executor: this.getSession("executor"),
      memory: this.getSession("memory"),
    };
  }

  async run(
    role: AgentRole,
    system: string,
    userMessage: string,
    onStream?: (chunk: string) => void,
    options?: { useTools?: boolean },
  ): Promise<{ text: string; status: "finished" | "error" | "rate_limit"; runId: string }> {
    const session = this.getSession(role);
    session.messages.push({ role: "user", content: userMessage });

    const runId = randomUUID();

    try {
      const useTools = options?.useTools ?? role === "executor";
      let text = "";

      if (useTools) {
        text = await this.runWithTools(system, session, onStream);
      } else {
        text = await this.runChat(system, session, onStream);
      }

      session.messages.push({ role: "assistant", content: text });
      return { text, status: "finished", runId };
    } catch (err) {
      if (isRateLimitError(err)) {
        session.messages.pop();
        return { text: formatRateLimitError(err), status: "rate_limit", runId };
      }
      const message = err instanceof Error ? err.message : String(err);
      session.messages.push({ role: "assistant", content: `Error: ${message}` });
      return { text: message, status: "error", runId };
    }
  }

  private async runChat(
    system: string,
    session: ClaudeSession,
    onStream?: (chunk: string) => void,
  ): Promise<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 8192,
      system,
      messages: session.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    let text = "";
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        text += event.delta.text;
        onStream?.(event.delta.text);
      }
    }
    return text;
  }

  private async runWithTools(
    system: string,
    session: ClaudeSession,
    onStream?: (chunk: string) => void,
  ): Promise<string> {
    const apiMessages: Anthropic.MessageParam[] = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let finalText = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8192,
        system,
        tools: EXECUTOR_TOOLS,
        messages: apiMessages,
      });

      const textParts: string[] = [];
      const toolUses: Anthropic.ToolUseBlock[] = [];

      for (const block of response.content) {
        if (block.type === "text") {
          textParts.push(block.text);
          onStream?.(block.text);
        } else if (block.type === "tool_use") {
          toolUses.push(block);
        }
      }

      finalText += textParts.join("");

      if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
        return finalText;
      }

      apiMessages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tool of toolUses) {
        const input = tool.input as Record<string, unknown>;
        const result = await executeTool(this.cwd, tool.name, input);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: result,
        });
      }

      apiMessages.push({ role: "user", content: toolResults });
    }

    return finalText || "(max tool rounds reached)";
  }
}
