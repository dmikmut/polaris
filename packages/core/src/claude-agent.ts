import Anthropic from "@anthropic-ai/sdk";
import type { ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { AgentRole } from "./types.js";
import { EXECUTOR_TOOLS, executeTool, type ToolRunOptions } from "./code-tools.js";
import { getRateLimitDetails, isRateLimitError } from "./rate-limit.js";

export type StoredMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface ClaudeSession {
  sessionId: string;
  messages: StoredMessage[];
}

export type AgentRunOptions = {
  useTools?: boolean;
  shouldAbort?: () => boolean;
};

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOOL_ROUNDS = 30;

export class AgentAbortedError extends Error {
  constructor() {
    super("Stopped.");
    this.name = "AgentAbortedError";
  }
}

export class ClaudeAgentPool {
  private readonly client: Anthropic;
  private readonly cwd: string;
  private readonly model: string;
  private readonly sessions = new Map<AgentRole, ClaudeSession>();
  private readonly activeControllers = new Set<AbortController>();
  private readonly activeChildren = new Set<ChildProcess>();

  constructor(apiKey: string, cwd: string, model = DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.cwd = cwd;
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  abortAll(): void {
    for (const controller of this.activeControllers) {
      controller.abort();
    }
    this.activeControllers.clear();

    for (const child of this.activeChildren) {
      try {
        child.kill("SIGTERM");
      } catch {
        /* process may have already exited */
      }
    }
    this.activeChildren.clear();
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
    options?: AgentRunOptions,
  ): Promise<{
    text: string;
    status: "finished" | "error" | "rate_limit" | "cancelled";
    runId: string;
    rateLimitRetryAfterSeconds?: number;
  }> {
    const session = this.getSession(role);
    session.messages.push({ role: "user", content: userMessage });

    const runId = randomUUID();
    const controller = new AbortController();
    this.activeControllers.add(controller);

    const shouldAbort = (): boolean =>
      controller.signal.aborted || (options?.shouldAbort?.() ?? false);

    const linkAbort = (): void => {
      if (options?.shouldAbort?.()) {
        controller.abort();
      }
    };

    const toolOptions: ToolRunOptions = {
      shouldAbort,
      registerProcess: (child) => {
        this.activeChildren.add(child);
        child.on("exit", () => this.activeChildren.delete(child));
      },
    };

    try {
      linkAbort();
      if (shouldAbort()) {
        throw new AgentAbortedError();
      }

      const useTools = options?.useTools ?? role === "executor";
      let text = "";

      if (useTools) {
        text = await this.runWithTools(system, session, onStream, controller.signal, shouldAbort, toolOptions);
      } else {
        text = await this.runChat(system, session, onStream, controller.signal, shouldAbort);
      }

      session.messages.push({ role: "assistant", content: text });
      return { text, status: "finished", runId };
    } catch (err) {
      if (err instanceof AgentAbortedError || shouldAbort()) {
        session.messages.pop();
        return { text: "Stopped.", status: "cancelled", runId };
      }
      if (isRateLimitError(err)) {
        session.messages.pop();
        const details = getRateLimitDetails(err);
        return {
          text: details.formatted,
          status: "rate_limit",
          runId,
          rateLimitRetryAfterSeconds: details.retryAfterSeconds,
        };
      }
      const message = err instanceof Error ? err.message : String(err);
      session.messages.push({ role: "assistant", content: `Error: ${message}` });
      return { text: message, status: "error", runId };
    } finally {
      this.activeControllers.delete(controller);
    }
  }

  private async runChat(
    system: string,
    session: ClaudeSession,
    onStream: ((chunk: string) => void) | undefined,
    signal: AbortSignal,
    shouldAbort: () => boolean,
  ): Promise<string> {
    const stream = this.client.messages.stream(
      {
        model: this.model,
        max_tokens: 8192,
        system,
        messages: session.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
      { signal },
    );

    let text = "";
    for await (const event of stream) {
      if (shouldAbort()) {
        throw new AgentAbortedError();
      }
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
    onStream: ((chunk: string) => void) | undefined,
    signal: AbortSignal,
    shouldAbort: () => boolean,
    toolOptions: ToolRunOptions,
  ): Promise<string> {
    const apiMessages: Anthropic.MessageParam[] = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let finalText = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      if (shouldAbort()) {
        throw new AgentAbortedError();
      }

      const response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: 8192,
          system,
          tools: EXECUTOR_TOOLS,
          messages: apiMessages,
        },
        { signal },
      );

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
        if (shouldAbort()) {
          throw new AgentAbortedError();
        }
        const input = tool.input as Record<string, unknown>;
        const result = await executeTool(this.cwd, tool.name, input, toolOptions);
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
