export type WorkflowPhase =
  | "planning"
  | "executing"
  | "error_resolution"
  | "human_intervention"
  | "rate_limit_pause"
  | "completed"
  | "idle";

export type RateLimitResumeAction =
  | { type: "planner"; userMessage: string }
  | { type: "revise_plan"; revision: string }
  | { type: "executor_human_update"; message: string; taskId: string; prompt: string }
  | { type: "executor_task"; taskId: string; prompt: string }
  | { type: "memory_capture"; taskId: string; executorOutput: string; prompt: string }
  | {
      type: "memory_discourse";
      taskId: string;
      memoryPrompt: string;
      fallbackError: string;
      metadata?: Record<string, unknown>;
    }
  | { type: "executor_retry"; taskId: string; guidance: string; prompt: string }
  | { type: "executor_human_guidance"; taskId: string; guidance: string; prompt: string };

export interface RateLimitResumeContext {
  agent: AgentRole;
  previousPhase: WorkflowPhase;
  action: RateLimitResumeAction;
}

export type AgentRole = "planner" | "executor" | "memory";

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  order: number;
}

export interface ProjectPlan {
  id: string;
  goal: string;
  summary: string;
  tasks: PlanTask[];
  accepted: boolean;
  acceptedAt?: string;
  readyForAccept?: boolean;
  revisions: PlanRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanRevision {
  id: string;
  content: string;
  timestamp: string;
  source: "user" | "planner";
}

export interface Connection {
  id: string;
  type: "file" | "api" | "database" | "third_party" | "internal";
  source: string;
  target: string;
  description: string;
  metadata?: Record<string, string>;
  discoveredAt: string;
}

export interface StoredError {
  id: string;
  message: string;
  context: string;
  taskId?: string;
  resolution?: string;
  resolved: boolean;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface AgentSessionState {
  sessionId: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

export interface MemoryState {
  projectId: string;
  name?: string;
  plan: ProjectPlan | null;
  connections: Connection[];
  errors: StoredError[];
  knowledge: KnowledgeEntry[];
  agentSessions: Partial<Record<AgentRole, AgentSessionState>>;
  updatedAt: string;
}

export interface KnowledgeEntry {
  id: string;
  category: "architecture" | "convention" | "dependency" | "note";
  title: string;
  content: string;
  relatedFiles: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  agent: AgentRole | "human";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowState {
  projectId: string;
  phase: WorkflowPhase;
  cwd: string;
  messages: ChatMessage[];
  currentTaskId: string | null;
  errorResolutionStartedAt: string | null;
  errorResolutionAttempts: number;
  humanInterventionActive: boolean;
  memoryAgentActive: boolean;
  memoryCaptureActive: boolean;
  rateLimitMessage: string | null;
  rateLimitPausedAgent: AgentRole | null;
  rateLimitRetryAt: string | null;
  rateLimitResume: RateLimitResumeContext | null;
  pendingExecutorNotes: string[];
  pendingPlanRevisions: string[];
  pauseForHumanUpdate: boolean;
}

export type MessageChannel = "planner" | "execution" | "reviewer" | "discourse";

export interface ProjectSummary {
  id: string;
  goal: string;
  phase: WorkflowPhase;
  planAccepted: boolean;
  completedTasks: number;
  totalTasks: number;
  updatedAt: string;
  isActive: boolean;
  isRunning: boolean;
  workspacePath?: string;
}

export interface OrchestratorConfig {
  apiKey: string;
  cwd: string;
  model?: string;
  errorTimeoutMs?: number;
  maxErrorRetries?: number;
  memoryDir?: string;
  projectId?: string;
}

export interface StreamEvent {
  type:
    | "message"
    | "phase_change"
    | "task_update"
    | "error"
    | "memory_update"
    | "agent_status"
    | "agent_working"
    | "stream_chunk";
  payload: unknown;
  timestamp: string;
}
