import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseConnections, parseKnowledge } from "./agent-manager.js";
import type {
  AgentRole,
  AgentSessionState,
  Connection,
  KnowledgeEntry,
  MemoryState,
  PlanRevision,
  ProjectPlan,
  StoredError,
  WorkflowState,
} from "./types.js";

const MEMORY_DIR = ".polaris/memory";
const ACTIVE_PROJECT_FILE = ".polaris/active-project.json";

export class MemoryStore {
  private readonly cwd: string;
  private readonly baseDir: string;
  private readonly projectId: string;
  private state: MemoryState;

  constructor(cwd: string, projectId?: string) {
    this.cwd = cwd;
    this.baseDir = path.join(cwd, MEMORY_DIR);
    this.projectId = projectId ?? randomUUID();
    this.state = this.emptyState();
  }

  static async resolveProjectId(cwd: string): Promise<string | undefined> {
    const activePath = path.join(cwd, ACTIVE_PROJECT_FILE);
    try {
      const raw = await fs.readFile(activePath, "utf-8");
      const { projectId } = JSON.parse(raw) as { projectId: string };
      const statePath = path.join(cwd, MEMORY_DIR, `${projectId}.json`);
      await fs.access(statePath);
      return projectId;
    } catch {
      return undefined;
    }
  }

  static async create(cwd: string): Promise<MemoryStore> {
    const existingId = await MemoryStore.resolveProjectId(cwd);
    const store = new MemoryStore(cwd, existingId);
    await store.init();
    return store;
  }

  private emptyState(): MemoryState {
    return {
      projectId: this.projectId,
      plan: null,
      connections: [],
      errors: [],
      knowledge: [],
      agentSessions: {},
      updatedAt: new Date().toISOString(),
    };
  }

  async init(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.mkdir(path.join(this.cwd, ".polaris"), { recursive: true });
    const statePath = this.statePath();
    try {
      const raw = await fs.readFile(statePath, "utf-8");
      const parsed = JSON.parse(raw) as MemoryState & { agentIds?: Record<string, string> };
      this.state = {
        ...parsed,
        agentSessions: parsed.agentSessions ?? {},
      };
      delete (this.state as MemoryState & { agentIds?: unknown }).agentIds;
    } catch {
      await this.persist();
    }
    await this.saveActiveProject();
  }

  private async saveActiveProject(): Promise<void> {
    await fs.writeFile(
      path.join(this.cwd, ACTIVE_PROJECT_FILE),
      JSON.stringify({ projectId: this.projectId, updatedAt: new Date().toISOString() }, null, 2),
    );
  }

  private workflowPath(): string {
    return path.join(this.baseDir, `${this.projectId}-workflow.json`);
  }

  async saveWorkflow(workflow: WorkflowState): Promise<void> {
    await fs.writeFile(this.workflowPath(), JSON.stringify(workflow, null, 2));
  }

  async loadWorkflow(): Promise<WorkflowState | null> {
    try {
      const raw = await fs.readFile(this.workflowPath(), "utf-8");
      return JSON.parse(raw) as WorkflowState;
    } catch {
      return null;
    }
  }

  private statePath(): string {
    return path.join(this.baseDir, `${this.projectId}.json`);
  }

  private connectionsPath(): string {
    return path.join(this.baseDir, `${this.projectId}-connections.json`);
  }

  private errorsPath(): string {
    return path.join(this.baseDir, `${this.projectId}-errors.json`);
  }

  private knowledgePath(): string {
    return path.join(this.baseDir, `${this.projectId}-knowledge.json`);
  }

  private planPath(): string {
    return path.join(this.baseDir, `${this.projectId}-plan.json`);
  }

  private sessionsPath(): string {
    return path.join(this.baseDir, `${this.projectId}-sessions.json`);
  }

  async persist(): Promise<void> {
    this.state.updatedAt = new Date().toISOString();
    await fs.writeFile(this.statePath(), JSON.stringify(this.state, null, 2));

    if (this.state.plan) {
      await fs.writeFile(this.planPath(), JSON.stringify(this.state.plan, null, 2));
    }
    await fs.writeFile(
      this.connectionsPath(),
      JSON.stringify(this.state.connections, null, 2),
    );
    await fs.writeFile(this.errorsPath(), JSON.stringify(this.state.errors, null, 2));
    await fs.writeFile(
      this.knowledgePath(),
      JSON.stringify(this.state.knowledge, null, 2),
    );
    await fs.writeFile(
      this.sessionsPath(),
      JSON.stringify(this.state.agentSessions, null, 2),
    );
  }

  getState(): MemoryState {
    return { ...this.state };
  }

  getProjectId(): string {
    return this.projectId;
  }

  getMemoryDir(): string {
    return this.baseDir;
  }

  async setPlan(plan: ProjectPlan): Promise<void> {
    this.state.plan = plan;
    await this.persist();
  }

  async acceptPlan(): Promise<void> {
    if (!this.state.plan) return;
    this.state.plan.accepted = true;
    this.state.plan.acceptedAt = new Date().toISOString();
    await this.persist();
  }

  async addPlanRevision(content: string, source: "user" | "planner"): Promise<void> {
    if (!this.state.plan) return;
    const revision: PlanRevision = {
      id: randomUUID(),
      content,
      timestamp: new Date().toISOString(),
      source,
    };
    this.state.plan.revisions.push(revision);
    this.state.plan.updatedAt = new Date().toISOString();
    await this.persist();
  }

  async addConnection(connection: Omit<Connection, "id" | "discoveredAt">): Promise<Connection> {
    const existing = this.state.connections.find(
      (c) =>
        c.source === connection.source &&
        c.target === connection.target &&
        c.type === connection.type,
    );
    if (existing) return existing;

    const entry: Connection = {
      ...connection,
      id: randomUUID(),
      discoveredAt: new Date().toISOString(),
    };
    this.state.connections.push(entry);
    await this.persist();
    return entry;
  }

  async addConnections(
    connections: Omit<Connection, "id" | "discoveredAt">[],
  ): Promise<Connection[]> {
    const results: Connection[] = [];
    for (const conn of connections) {
      results.push(await this.addConnection(conn));
    }
    return results;
  }

  async recordError(
    message: string,
    context: string,
    taskId?: string,
  ): Promise<StoredError> {
    const normalized = message.trim().toLowerCase();
    const existing = this.state.errors.find(
      (e) => e.message.trim().toLowerCase() === normalized && !e.resolved,
    );

    if (existing) {
      existing.occurrences += 1;
      existing.lastSeenAt = new Date().toISOString();
      if (taskId) existing.taskId = taskId;
      await this.persist();
      return existing;
    }

    const entry: StoredError = {
      id: randomUUID(),
      message,
      context,
      taskId,
      resolved: false,
      occurrences: 1,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
    this.state.errors.push(entry);
    await this.persist();
    return entry;
  }

  async resolveError(errorId: string, resolution: string): Promise<void> {
    const error = this.state.errors.find((e) => e.id === errorId);
    if (!error) return;
    error.resolved = true;
    error.resolution = resolution;
    await this.persist();
  }

  async addKnowledge(
    entry: Omit<KnowledgeEntry, "id" | "createdAt">,
  ): Promise<KnowledgeEntry> {
    const existing = this.state.knowledge.find(
      (k) => k.title.trim().toLowerCase() === entry.title.trim().toLowerCase(),
    );
    if (existing) return existing;

    const knowledge: KnowledgeEntry = {
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.state.knowledge.push(knowledge);
    await this.persist();
    return knowledge;
  }

  async addKnowledgeEntries(
    entries: Omit<KnowledgeEntry, "id" | "createdAt">[],
  ): Promise<KnowledgeEntry[]> {
    const results: KnowledgeEntry[] = [];
    for (const entry of entries) {
      results.push(await this.addKnowledge(entry));
    }
    return results;
  }

  async ingestAgentOutput(text: string): Promise<{ connections: number; knowledge: number }> {
    const connections = parseConnections(text);
    if (connections.length > 0) {
      await this.addConnections(
        connections.map((c) => ({
          type: c.type as Connection["type"],
          source: c.source,
          target: c.target,
          description: c.description,
        })),
      );
    }

    const knowledge = parseKnowledge(text);
    if (knowledge.length > 0) {
      await this.addKnowledgeEntries(
        knowledge.map((k) => ({
          category: k.category as KnowledgeEntry["category"],
          title: k.title,
          content: k.content,
          relatedFiles: k.relatedFiles ?? [],
        })),
      );
    }

    return { connections: connections.length, knowledge: knowledge.length };
  }

  getAgentSessions(): Partial<Record<AgentRole, AgentSessionState>> {
    return this.state.agentSessions;
  }

  async saveAgentSessions(
    sessions: Partial<Record<AgentRole, AgentSessionState>>,
  ): Promise<void> {
    this.state.agentSessions = sessions;
    await this.persist();
  }

  buildContextPrompt(): string {
    const parts: string[] = ["# Polaris Memory Context\n"];

    if (this.state.plan) {
      parts.push("## Accepted Plan");
      parts.push(`Goal: ${this.state.plan.goal}`);
      parts.push(`Summary: ${this.state.plan.summary}`);
      parts.push("\nTasks:");
      for (const task of this.state.plan.tasks) {
        parts.push(`- [${task.status}] ${task.title}: ${task.description}`);
      }
      if (this.state.plan.revisions.length > 0) {
        parts.push("\nPlan Revisions:");
        for (const rev of this.state.plan.revisions) {
          parts.push(`- (${rev.source}, ${rev.timestamp}): ${rev.content}`);
        }
      }
    }

    if (this.state.connections.length > 0) {
      parts.push("\n## Architecture Connections");
      for (const conn of this.state.connections) {
        parts.push(
          `- [${conn.type}] ${conn.source} → ${conn.target}: ${conn.description}`,
        );
      }
    }

    if (this.state.errors.filter((e) => !e.resolved).length > 0) {
      parts.push("\n## Unresolved Errors");
      for (const err of this.state.errors.filter((e) => !e.resolved)) {
        parts.push(
          `- (${err.occurrences}x) ${err.message}\n  Context: ${err.context}`,
        );
      }
    }

    const resolvedRepeats = this.state.errors.filter(
      (e) => e.resolved && e.occurrences > 1,
    );
    if (resolvedRepeats.length > 0) {
      parts.push("\n## Previously Resolved (may repeat)");
      for (const err of resolvedRepeats) {
        parts.push(`- ${err.message}\n  Resolution: ${err.resolution}`);
      }
    }

    if (this.state.knowledge.length > 0) {
      parts.push("\n## Knowledge Base");
      for (const k of this.state.knowledge) {
        parts.push(`- [${k.category}] ${k.title}: ${k.content}`);
        if (k.relatedFiles.length > 0) {
          parts.push(`  Files: ${k.relatedFiles.join(", ")}`);
        }
      }
    }

    return parts.join("\n");
  }
}
