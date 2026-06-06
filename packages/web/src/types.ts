export type WorkflowPhase =
  | "planning"
  | "executing"
  | "error_resolution"
  | "human_intervention"
  | "rate_limit_pause"
  | "completed"
  | "idle";

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
  revisions: { id: string; content: string; timestamp: string; source: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  type: string;
  source: string;
  target: string;
  description: string;
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

export interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  relatedFiles: string[];
  createdAt: string;
}

export interface MemoryState {
  projectId: string;
  plan: ProjectPlan | null;
  connections: Connection[];
  errors: StoredError[];
  knowledge: KnowledgeEntry[];
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  agent: string;
  content: string;
  timestamp: string;
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
  rateLimitPausedAgent: string | null;
  rateLimitResume: unknown | null;
  pendingExecutorNotes: string[];
  pendingPlanRevisions: string[];
}

export interface AppState {
  workflow: WorkflowState;
  memory: MemoryState;
  workspacePath?: string;
}
