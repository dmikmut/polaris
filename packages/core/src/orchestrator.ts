import { randomUUID } from "node:crypto";
import { AgentManager, isPlanReadyForAccept, parsePlanTasks } from "./agent-manager.js";
import {
  DEFAULT_RATE_LIMIT_RETRY_SECONDS,
  parseRetryAfterFromMessage,
} from "./rate-limit.js";
import type { AgentRunResult } from "./agent-manager.js";
import { MemoryStore } from "./memory-store.js";
import type {
  AgentRole,
  ChatMessage,
  OrchestratorConfig,
  PlanTask,
  ProjectPlan,
  RateLimitResumeContext,
  StreamEvent,
  WorkflowPhase,
  WorkflowState,
} from "./types.js";

type EventListener = (event: StreamEvent) => void;

export class Orchestrator {
  private readonly config: OrchestratorConfig;
  private memory!: MemoryStore;
  private readonly agents: AgentManager;
  private workflow: WorkflowState;
  private listeners: EventListener[] = [];
  private currentErrorId: string | null = null;
  private executorChainActive = false;
  private haltRequested = false;
  private operationChain: Promise<unknown> = Promise.resolve();

  private constructor(config: OrchestratorConfig, memory: MemoryStore) {
    this.config = {
      ...config,
    };
    this.memory = memory;
    this.agents = new AgentManager(config.apiKey, config.cwd, config.model);
    this.workflow = {
      projectId: "",
      phase: "idle",
      cwd: config.cwd,
      messages: [],
      currentTaskId: null,
      errorResolutionStartedAt: null,
      errorResolutionAttempts: 0,
      humanInterventionActive: false,
      memoryAgentActive: false,
      memoryCaptureActive: false,
      rateLimitMessage: null,
      rateLimitPausedAgent: null,
      rateLimitRetryAt: null,
      rateLimitResume: null,
      pendingExecutorNotes: [],
      pendingPlanRevisions: [],
      pauseForHumanUpdate: false,
    };
  }

  static async create(config: OrchestratorConfig): Promise<Orchestrator> {
    const memory = config.projectId
      ? await MemoryStore.open(config.cwd, config.projectId)
      : await MemoryStore.create(config.cwd);
    return new Orchestrator(config, memory);
  }

  onEvent(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.operationChain.then(fn, fn);
    this.operationChain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private emit(type: StreamEvent["type"], payload: unknown): void {
    const event: StreamEvent = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private async persistWorkflow(): Promise<void> {
    await this.memory.saveWorkflow(this.workflow);
  }

  private addMessage(
    role: ChatMessage["role"],
    agent: ChatMessage["agent"],
    content: string,
    metadata?: Record<string, unknown>,
  ): ChatMessage {
    const msg: ChatMessage = {
      id: randomUUID(),
      role,
      agent,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };
    this.workflow.messages.push(msg);
    this.emit("message", msg);
    void this.persistWorkflow();
    return msg;
  }

  private setPhase(phase: WorkflowPhase): void {
    this.workflow.phase = phase;
    this.emit("phase_change", { phase });
    void this.persistWorkflow();
  }

  haltAgents(): void {
    this.haltRequested = true;
    this.executorChainActive = false;
    this.workflow.memoryCaptureActive = false;
    this.workflow.memoryAgentActive = false;
    this.workflow.pauseForHumanUpdate = false;
    this.agents.abortAll();

    for (const role of ["planner", "executor", "memory"] as const) {
      this.emit("agent_working", { agent: role, working: false });
    }
    this.emit("agent_status", {
      memoryAgentActive: false,
      memoryCaptureActive: false,
      pauseForHumanUpdate: false,
    });
  }

  private resumeAgents(): void {
    this.haltRequested = false;
  }

  async init(): Promise<void> {
    this.resumeAgents();
    this.workflow.projectId = this.memory.getProjectId();

    const saved = await this.memory.loadWorkflow();
    if (saved && saved.projectId === this.workflow.projectId) {
      this.workflow = {
        ...saved,
        cwd: this.config.cwd,
        humanInterventionActive: saved.humanInterventionActive ?? false,
        memoryAgentActive: saved.memoryAgentActive ?? false,
        memoryCaptureActive: false,
        errorResolutionAttempts: saved.errorResolutionAttempts ?? 0,
        rateLimitMessage: saved.rateLimitMessage ?? null,
        rateLimitPausedAgent: saved.rateLimitPausedAgent ?? null,
        rateLimitRetryAt: saved.rateLimitRetryAt ?? null,
        rateLimitResume: saved.rateLimitResume ?? null,
        pendingExecutorNotes: saved.pendingExecutorNotes ?? [],
        pendingPlanRevisions: saved.pendingPlanRevisions ?? [],
        pauseForHumanUpdate: saved.pauseForHumanUpdate ?? false,
      };
      this.emit("phase_change", { phase: this.workflow.phase });
      if (
        this.workflow.phase === "rate_limit_pause" &&
        !this.workflow.rateLimitRetryAt &&
        this.workflow.rateLimitMessage
      ) {
        const retryAfterSeconds =
          parseRetryAfterFromMessage(this.workflow.rateLimitMessage) ??
          DEFAULT_RATE_LIMIT_RETRY_SECONDS;
        this.workflow.rateLimitRetryAt = new Date(
          Date.now() + retryAfterSeconds * 1000,
        ).toISOString();
      }
    } else {
      this.setPhase("planning");
    }

    this.agents.initializeAgents(this.memory.getAgentSessions());
    this.syncWorkflowWithPlan();
    this.emit("memory_update", this.memory.getState());
    await this.persistWorkflow();

    const plan = this.memory.getState().plan;
    if (
      this.workflow.phase === "executing" &&
      plan?.accepted &&
      !this.workflow.humanInterventionActive
    ) {
      void this.executeNextTask();
    }
  }

  private syncWorkflowWithPlan(): void {
    const plan = this.memory.getState().plan;
    if (this.workflow.phase === "executing" && !plan?.accepted) {
      this.workflow.phase = "planning";
      this.emit("phase_change", { phase: "planning" });
    }
  }

  private canExecute(): boolean {
    const plan = this.memory.getState().plan;
    return (
      this.workflow.phase === "executing" &&
      Boolean(plan?.accepted) &&
      !this.workflow.humanInterventionActive &&
      !this.haltRequested
    );
  }

  private async persistAgentSessions(): Promise<void> {
    await this.memory.saveAgentSessions(this.agents.getSessions());
  }

  getWorkflowState(): WorkflowState {
    return { ...this.workflow, messages: [...this.workflow.messages] };
  }

  getMemoryState() {
    return this.memory.getState();
  }

  private async runAgent(role: AgentRole, prompt: string): Promise<AgentRunResult> {
    if (this.haltRequested) {
      return { text: "Stopped.", status: "error", runId: "halted" };
    }

    this.emit("agent_working", { agent: role, working: true });
    try {
      if (this.haltRequested) {
        return { text: "Stopped.", status: "error", runId: "halted" };
      }
      const result = await this.agents.send(
        role,
        prompt,
        (chunk) => {
          if (!this.haltRequested) {
            this.emit("stream_chunk", { agent: role, chunk });
          }
        },
        { shouldAbort: () => this.haltRequested },
      );

      if (this.haltRequested || result.status === "cancelled") {
        return { text: "Stopped.", status: "error", runId: "halted" };
      }
      return result;
    } finally {
      this.emit("agent_working", { agent: role, working: false });
    }
  }

  private async pauseForRateLimit(
    agent: AgentRole,
    formattedMessage: string,
    resume: Omit<RateLimitResumeContext, "agent">,
    retryAfterSeconds = DEFAULT_RATE_LIMIT_RETRY_SECONDS,
  ): Promise<void> {
    this.executorChainActive = false;
    const retryAt = new Date(Date.now() + retryAfterSeconds * 1000).toISOString();
    this.workflow.rateLimitMessage = formattedMessage;
    this.workflow.rateLimitPausedAgent = agent;
    this.workflow.rateLimitRetryAt = retryAt;
    this.workflow.rateLimitResume = { agent, ...resume };
    this.setPhase("rate_limit_pause");
    this.emit("agent_status", {
      rateLimitMessage: formattedMessage,
      rateLimitPausedAgent: agent,
      rateLimitRetryAt: retryAt,
      rateLimitResume: this.workflow.rateLimitResume,
    });
    this.addMessage("system", "human", formattedMessage);
    await this.persistWorkflow();
  }

  private async handleRateLimitResult(
    result: AgentRunResult,
    agent: AgentRole,
    resume: Omit<RateLimitResumeContext, "agent">,
  ): Promise<AgentRunResult | null> {
    if (result.status !== "rate_limit") return result;
    const retryAfterSeconds =
      result.rateLimitRetryAfterSeconds ??
      parseRetryAfterFromMessage(result.text) ??
      DEFAULT_RATE_LIMIT_RETRY_SECONDS;
    await this.pauseForRateLimit(agent, result.text, resume, retryAfterSeconds);
    return null;
  }

  private async finishPlannerRun(
    userMessage: string,
    result: AgentRunResult,
  ): Promise<void> {
    await this.persistAgentSessions();
    const responseText =
      result.status === "error" ? `Planner error: ${result.text}` : result.text;
    this.addMessage("assistant", "planner", responseText, { channel: "planner" });

    const parsedTasks = parsePlanTasks(result.text);
    const readyForAccept = isPlanReadyForAccept(result.text) && parsedTasks.length > 0;
    if (parsedTasks.length > 0) {
      await this.updatePlanFromTasks(parsedTasks, userMessage, result.text, readyForAccept);
    } else if (this.memory.getState().plan) {
      const existing = this.memory.getState().plan!;
      await this.memory.setPlan({ ...existing, readyForAccept: false });
      this.emit("memory_update", this.memory.getState());
      await this.memory.addPlanRevision(userMessage, "user");
      await this.memory.addPlanRevision(result.text, "planner");
    }

    await this.memory.ingestAgentOutput(result.text);
    this.emit("memory_update", this.memory.getState());
  }

  private async beginNewPlanningCycle(): Promise<void> {
    this.setPhase("planning");
    const plan = this.memory.getState().plan;
    if (plan) {
      await this.memory.setPlan({ ...plan, accepted: false });
      this.emit("memory_update", this.memory.getState());
    }
  }

  private drainPendingExecutorNotes(): string {
    const notes = this.workflow.pendingExecutorNotes;
    if (!notes.length) return "";
    this.workflow.pendingExecutorNotes = [];
    void this.persistWorkflow();
    return `\n\nHuman provided updates during execution:\n${notes.join("\n\n")}`;
  }

  async sendPlannerMessage(userMessage: string): Promise<void> {
    this.haltAgents();
    return this.runExclusive(async () => {
      this.resumeAgents();
      if (this.workflow.phase === "rate_limit_pause") {
        throw new Error("Resolve the rate limit pause before sending planner messages.");
      }
      if (this.workflow.phase === "completed") {
        await this.beginNewPlanningCycle();
      } else if (this.workflow.phase !== "planning" && this.workflow.phase !== "idle") {
        throw new Error(
          "Planner input is only allowed during planning, after completion, or via plan revision during execution.",
        );
      }
      this.addMessage("user", "human", userMessage, { channel: "planner" });

      const memoryContext = this.memory.buildContextPrompt();
      const prompt = memoryContext
        ? `${memoryContext}\n\n---\n\nUser message: ${userMessage}`
        : userMessage;

      const result = await this.runAgent("planner", prompt);
      const checked = await this.handleRateLimitResult(result, "planner", {
        previousPhase: this.workflow.phase,
        action: { type: "planner", userMessage },
      });
      if (!checked) return;

      await this.finishPlannerRun(userMessage, checked);
    });
  }

  private async updatePlanFromTasks(
    tasks: { title: string; description: string }[],
    goal: string,
    summary: string,
    readyForAccept = false,
  ): Promise<void> {
    const existing = this.memory.getState().plan;
    const planTasks: PlanTask[] = tasks.map((t, i) => ({
      id: randomUUID(),
      title: t.title,
      description: t.description,
      status: "pending" as const,
      order: i,
    }));

    const briefSummary =
      summary
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line && !line.startsWith("#") && !line.startsWith("```")) ??
      existing?.summary ??
      goal;

    const plan: ProjectPlan = {
      id: existing?.id ?? randomUUID(),
      goal: existing?.goal ?? goal,
      summary: briefSummary.slice(0, 280),
      tasks: planTasks,
      accepted: false,
      readyForAccept,
      revisions: existing?.revisions ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.memory.setPlan(plan);
    this.emit("task_update", { tasks: planTasks });
  }

  async acceptPlan(): Promise<void> {
    return this.runExclusive(async () => {
      const plan = this.memory.getState().plan;
      if (!plan) {
        throw new Error("No plan to accept. Discuss your goal with the Planner first.");
      }
      if (!plan.tasks.length) {
        throw new Error(
          "The Planner has not produced a full task list yet. Continue the discussion before accepting.",
        );
      }
      if (!plan.readyForAccept) {
        throw new Error(
          "The Planner has not marked the plan as ready. Answer any open questions before accepting.",
        );
      }
      if (plan.accepted) {
        throw new Error("Plan is already accepted.");
      }
      if (
        this.workflow.phase !== "planning" &&
        this.workflow.phase !== "idle" &&
        this.workflow.phase !== "completed"
      ) {
        throw new Error("Plan can only be accepted during the planning phase.");
      }

      const runningId = await MemoryStore.findRunningProjectId(this.config.cwd);
      if (runningId && runningId !== this.memory.getProjectId()) {
        throw new Error(
          "Another project is still running. Stop it on the Projects page before accepting this plan.",
        );
      }

      this.haltAgents();
      this.resumeAgents();
      await this.memory.acceptPlan();
      this.setPhase("executing");
      this.emit("memory_update", this.memory.getState());
      void this.executeNextTask();
    });
  }

  async revisePlanDuringExecution(
    revision: string,
    options?: { skipUserMessage?: boolean; skipResumeExecution?: boolean },
  ): Promise<void> {
    if (!options?.skipUserMessage) {
      this.haltAgents();
      return this.runExclusive(async () => {
        this.resumeAgents();
        await this.revisePlanDuringExecution(revision, {
          ...options,
          skipUserMessage: true,
        });
      });
    }
    if (this.workflow.phase !== "executing") {
      throw new Error("Plan revision is only allowed during execution.");
    }

    if (!options?.skipResumeExecution) {
      this.resumeAgents();
    }

    if (!options?.skipUserMessage) {
      this.addMessage("user", "human", revision, { channel: "planner" });
      await this.memory.addPlanRevision(revision, "user");

      if (this.executorChainActive) {
        this.workflow.pendingPlanRevisions.push(revision);
        this.workflow.pauseForHumanUpdate = true;
        await this.persistWorkflow();
        this.addMessage(
          "system",
          "planner",
          "Plan revision queued — the Planner will apply it before the next task.",
          { channel: "planner" },
        );
        return;
      }
    }

    const memoryContext = this.memory.buildContextPrompt();
    const prompt = `${memoryContext}\n\nThe user wants to revise the plan mid-execution:\n${revision}\n\nUpdate the plan accordingly and output revised tasks in plan-tasks format.`;

    const result = await this.runAgent("planner", prompt);
    const checked = await this.handleRateLimitResult(result, "planner", {
      previousPhase: "executing",
      action: { type: "revise_plan", revision },
    });
    if (!checked) return;

    await this.persistAgentSessions();

    this.addMessage("assistant", "planner", checked.text, { channel: "planner" });

    const parsedTasks = parsePlanTasks(checked.text);
    if (parsedTasks.length > 0) {
      const existing = this.memory.getState().plan!;
      const completedTasks = existing.tasks.filter((t) => t.status === "completed");
      const newTasks: PlanTask[] = parsedTasks.map((t, i) => ({
        id: randomUUID(),
        title: t.title,
        description: t.description,
        status: "pending" as const,
        order: completedTasks.length + i,
      }));

      const updatedPlan: ProjectPlan = {
        ...existing,
        tasks: [...completedTasks, ...newTasks],
        accepted: true,
        updatedAt: new Date().toISOString(),
      };
      await this.memory.setPlan(updatedPlan);
      await this.memory.addPlanRevision(checked.text, "planner");
    }

    await this.memory.ingestAgentOutput(checked.text);
    this.emit("memory_update", this.memory.getState());

    if (
      !options?.skipResumeExecution &&
      this.workflow.phase === "executing" &&
      !this.workflow.humanInterventionActive
    ) {
      void this.executeNextTask();
    }
  }

  async sendExecutorHumanUpdate(humanMessage: string): Promise<void> {
    this.haltAgents();
    return this.runExclusive(async () => {
    this.resumeAgents();
    if (this.workflow.phase !== "executing") {
      throw new Error("Executor updates are only allowed during execution.");
    }

    this.addMessage("user", "human", humanMessage, { channel: "execution" });
    this.workflow.pendingExecutorNotes.push(humanMessage);
    this.workflow.pauseForHumanUpdate = true;
    await this.persistWorkflow();

    if (this.executorChainActive) {
      this.addMessage(
        "system",
        "executor",
        "Your update takes priority — the Executor will apply it before continuing.",
        { channel: "execution" },
      );
      return;
    }

    const plan = this.memory.getState().plan;
    const activeTask =
      plan?.tasks.find((t) => t.status === "in_progress") ??
      plan?.tasks.find((t) => t.status === "pending");

    if (!activeTask || !plan) {
      this.addMessage("system", "executor", "Update saved. No pending tasks to apply it to.", {
        channel: "execution",
      });
      this.workflow.pendingExecutorNotes = [];
      await this.persistWorkflow();
      return;
    }

    await this.runExecutorWithHumanUpdate(activeTask, plan, humanMessage);
    });
  }

  private async applyPendingHumanExecutorUpdate(): Promise<boolean> {
    if (!this.workflow.pendingExecutorNotes.length) {
      this.workflow.pauseForHumanUpdate = false;
      await this.persistWorkflow();
      return false;
    }

    const plan = this.memory.getState().plan;
    if (!plan) {
      this.workflow.pauseForHumanUpdate = false;
      await this.persistWorkflow();
      return false;
    }

    const humanMessage =
      this.workflow.pendingExecutorNotes[this.workflow.pendingExecutorNotes.length - 1];
    const activeTask =
      plan.tasks.find((t) => t.status === "in_progress") ??
      plan.tasks.find((t) => t.status === "pending");

    if (!activeTask) {
      this.workflow.pauseForHumanUpdate = false;
      await this.persistWorkflow();
      return false;
    }

    this.workflow.pauseForHumanUpdate = false;
    await this.persistWorkflow();
    await this.runExecutorWithHumanUpdate(activeTask, plan, humanMessage, {
      skipResumeExecution: true,
    });
    return true;
  }

  private async runExecutorWithHumanUpdate(
    task: PlanTask,
    plan: ProjectPlan,
    humanMessage: string,
    options?: { skipResumeExecution?: boolean },
  ): Promise<void> {
    this.workflow.pendingExecutorNotes = this.workflow.pendingExecutorNotes.filter(
      (n) => n !== humanMessage,
    );

    task.status = "in_progress";
    this.workflow.currentTaskId = task.id;
    await this.memory.setPlan(plan);
    this.emit("task_update", { taskId: task.id, status: "in_progress" });

    const memoryContext = this.memory.buildContextPrompt();
    const humanNotes = this.drainPendingExecutorNotes();
    const prompt = `${memoryContext}\n\n---\n\nThe human user provided new information during execution:\n${humanMessage}\n\nApply this to your work on task: **${task.title}**\n${task.description}${humanNotes}`;

    const result = await this.runAgent("executor", prompt);
    const checked = await this.handleRateLimitResult(result, "executor", {
      previousPhase: "executing",
      action: {
        type: "executor_human_update",
        message: humanMessage,
        taskId: task.id,
        prompt,
      },
    });
    if (!checked) return;

    this.workflow.pauseForHumanUpdate = false;
    await this.persistWorkflow();

    const outcome = await this.finishExecutorTaskRun(task, plan, checked);
    if (!options?.skipResumeExecution && outcome === "continue") {
      void this.executeNextTask();
    }
  }

  private async runBackgroundMemoryCapture(
    executorOutput: string,
    task: PlanTask,
  ): Promise<void> {
    if (this.haltRequested || !this.canExecute()) return;

    const phaseBefore = this.workflow.phase;
    this.workflow.memoryCaptureActive = true;
    this.emit("agent_status", { memoryCaptureActive: true });

    const memoryContext = this.memory.buildContextPrompt();
    const prompt = `${memoryContext}\n\n---\n\nThe Executor just completed task "${task.title}".\n\nExecutor output:\n${executorOutput}\n\nExtract and catalog all connections (files, APIs, databases, third-party services) and knowledge entries from this output. Report findings using connections and knowledge code blocks.`;

    try {
      const result = await this.runAgent("memory", prompt);
      const checked = await this.handleRateLimitResult(result, "memory", {
        previousPhase: phaseBefore === "rate_limit_pause" ? "executing" : phaseBefore,
        action: { type: "memory_capture", taskId: task.id, executorOutput, prompt },
      });
      if (!checked) return;

      await this.persistAgentSessions();
      await this.memory.ingestAgentOutput(checked.text);
      await this.memory.ingestAgentOutput(executorOutput);
      this.emit("memory_update", this.memory.getState());
    } finally {
      this.workflow.memoryCaptureActive = false;
      this.emit("agent_status", { memoryCaptureActive: false });
      await this.persistWorkflow();
    }
  }

  private async finishExecutorTaskRun(
    task: PlanTask,
    plan: ProjectPlan,
    result: AgentRunResult,
  ): Promise<"continue" | "stopped"> {
    if (this.haltRequested || result.runId === "halted") {
      return "stopped";
    }

    await this.persistAgentSessions();
    this.addMessage("assistant", "executor", result.text, { channel: "execution" });
    await this.memory.ingestAgentOutput(result.text);

    if (result.status === "error") {
      await this.handleExecutorError(result.text, task.id);
      return "stopped";
    }

    task.status = "completed";
    await this.memory.setPlan(plan);
    this.emit("task_update", { taskId: task.id, status: "completed" });
    this.emit("memory_update", this.memory.getState());
    void this.runBackgroundMemoryCapture(result.text, task);
    return "continue";
  }

  private async executeNextTask(): Promise<void> {
    if (!this.canExecute() || this.executorChainActive) {
      return;
    }

    const plan = this.memory.getState().plan;
    if (!plan?.accepted) {
      return;
    }

    this.executorChainActive = true;
    try {
      while (!this.workflow.humanInterventionActive && !this.haltRequested) {
        if (this.workflow.pauseForHumanUpdate && this.workflow.pendingExecutorNotes.length > 0) {
          const applied = await this.applyPendingHumanExecutorUpdate();
          if (applied) continue;
        }

        const pendingRevision = this.workflow.pendingPlanRevisions.shift();
        if (pendingRevision) {
          await this.persistWorkflow();
          await this.revisePlanDuringExecution(pendingRevision, {
            skipUserMessage: true,
            skipResumeExecution: true,
          });
        }

        const plan = this.memory.getState().plan;
        if (!plan) return;

        const nextTask = plan.tasks.find((t) => t.status === "pending");
        if (!nextTask) {
          this.setPhase("completed");
          this.addMessage("system", "executor", "All tasks completed.", { channel: "execution" });
          return;
        }

        nextTask.status = "in_progress";
        this.workflow.currentTaskId = nextTask.id;
        await this.memory.setPlan(plan);
        this.emit("task_update", { taskId: nextTask.id, status: "in_progress" });

        const memoryContext = this.memory.buildContextPrompt();
        const humanNotes = this.drainPendingExecutorNotes();
        const prompt = `${memoryContext}\n\n---\n\nExecute this task:\n**${nextTask.title}**\n${nextTask.description}${humanNotes}`;

        try {
          const result = await this.runAgent("executor", prompt);
          const checked = await this.handleRateLimitResult(result, "executor", {
            previousPhase: "executing",
            action: { type: "executor_task", taskId: nextTask.id, prompt },
          });
          if (!checked) return;

          const outcome = await this.finishExecutorTaskRun(nextTask, plan, checked);
          if (outcome === "stopped") return;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await this.handleExecutorError(message, nextTask.id);
          return;
        }
      }
    } finally {
      this.executorChainActive = false;
    }
  }

  private async handleExecutorError(errorMessage: string, taskId: string): Promise<void> {
    const plan = this.memory.getState().plan;
    if (plan) {
      const task = plan.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = "failed";
        await this.memory.setPlan(plan);
      }
    }

    const storedError = await this.memory.recordError(errorMessage, `Task: ${taskId}`, taskId);
    this.currentErrorId = storedError.id;
    this.emit("error", { error: storedError, taskId });

    if (this.workflow.phase !== "error_resolution") {
      this.setPhase("error_resolution");
      this.workflow.memoryAgentActive = true;
      this.workflow.errorResolutionStartedAt = new Date().toISOString();
      this.workflow.errorResolutionAttempts = 0;
      this.emit("agent_status", { memoryAgentActive: true });
    }

    await this.runErrorDiscourse(errorMessage, taskId, null);
  }

  private async runErrorDiscourse(
    errorMessage: string,
    taskId: string,
    executorResponse: string | null,
  ): Promise<void> {
    if (this.workflow.humanInterventionActive) return;

    this.workflow.errorResolutionAttempts += 1;
    this.emit("agent_status", {
      errorResolutionAttempts: this.workflow.errorResolutionAttempts,
    });
    await this.persistWorkflow();

    const discourseContext = executorResponse
      ? `\n\nExecutor's latest response:\n${executorResponse}\n\nThe fix did not work. Analyze what went wrong and provide updated guidance.`
      : "";

    await this.memoryGuideAndRetry(
      `The Executor encountered an error on task ${taskId} (attempt ${this.workflow.errorResolutionAttempts}):\n\n${errorMessage}${discourseContext}\n\nAnalyze using all known connections and prior errors. Provide specific guidance. If this error occurred before, reference the prior resolution.`,
      taskId,
      errorMessage,
      { attempt: this.workflow.errorResolutionAttempts },
    );
  }

  private async memoryGuideAndRetry(
    memoryPrompt: string,
    taskId: string,
    fallbackErrorMessage: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (this.haltRequested || this.workflow.humanInterventionActive) return;

    this.workflow.memoryAgentActive = true;
    this.emit("agent_status", { memoryAgentActive: true });

    const memoryContext = this.memory.buildContextPrompt();
    const prompt = `${memoryContext}\n\n---\n\n${memoryPrompt}\n\nEnd with RESOLUTION_STATUS: resolved or RESOLUTION_STATUS: needs_more_info`;

    const result = await this.runAgent("memory", prompt);
    const checked = await this.handleRateLimitResult(result, "memory", {
      previousPhase: "error_resolution",
      action: {
        type: "memory_discourse",
        taskId,
        memoryPrompt,
        fallbackError: fallbackErrorMessage,
        metadata,
      },
    });
    if (!checked) return;

    await this.persistAgentSessions();
    this.addMessage("assistant", "memory", checked.text, {
      ...metadata,
      channel: "reviewer",
    });
    await this.memory.ingestAgentOutput(checked.text);

    if (this.workflow.humanInterventionActive) return;

    this.workflow.memoryAgentActive = false;
    this.emit("agent_status", { memoryAgentActive: false });

    const executorResult = await this.retryWithGuidance(checked.text, taskId);

    if (executorResult.success) {
      await this.clearErrorResolution(executorResult.guidance);
      await this.executeNextTask();
      return;
    }

    await this.runErrorDiscourse(
      executorResult.errorMessage ?? fallbackErrorMessage,
      taskId,
      executorResult.executorResponse ?? null,
    );
  }

  private async retryWithGuidance(
    guidance: string,
    taskId: string,
  ): Promise<{
    success: boolean;
    guidance: string;
    errorMessage?: string;
    executorResponse?: string;
  }> {
    const plan = this.memory.getState().plan;
    const task = plan?.tasks.find((t) => t.id === taskId);
    if (!task || this.workflow.humanInterventionActive) {
      return { success: false, guidance };
    }

    task.status = "in_progress";
    if (plan) await this.memory.setPlan(plan);

    const memoryContext = this.memory.buildContextPrompt();
    const prompt = `${memoryContext}\n\n---\n\nRetry task: **${task.title}**\n${task.description}\n\nMemory Agent guidance:\n${guidance}`;

    try {
      const result = await this.runAgent("executor", prompt);
      const checked = await this.handleRateLimitResult(result, "executor", {
        previousPhase: "error_resolution",
        action: { type: "executor_retry", taskId, guidance, prompt },
      });
      if (!checked) {
        return { success: false, guidance, errorMessage: "Rate limit pause" };
      }

      await this.persistAgentSessions();
      this.addMessage("assistant", "executor", checked.text, {
        retry: true,
        attempt: this.workflow.errorResolutionAttempts,
        channel: "execution",
      });
      await this.memory.ingestAgentOutput(checked.text);

      if (checked.status === "error") {
        return {
          success: false,
          guidance,
          errorMessage: checked.text,
          executorResponse: checked.text,
        };
      }

      task.status = "completed";
      if (plan) await this.memory.setPlan(plan);

      if (this.currentErrorId) {
        await this.memory.resolveError(this.currentErrorId, guidance);
      }

      void this.runBackgroundMemoryCapture(checked.text, task);
      return { success: true, guidance };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        guidance,
        errorMessage: message,
        executorResponse: message,
      };
    }
  }

  private async clearErrorResolution(_resolution: string): Promise<void> {
    this.workflow.memoryAgentActive = false;
    this.workflow.errorResolutionStartedAt = null;
    this.workflow.errorResolutionAttempts = 0;
    this.currentErrorId = null;
    this.setPhase("executing");
    this.emit("agent_status", {
      memoryAgentActive: false,
      errorResolutionAttempts: 0,
    });
    this.emit("memory_update", this.memory.getState());
  }

  enableHumanIntervention(reason?: string): void {
    this.workflow.humanInterventionActive = true;
    this.workflow.memoryAgentActive = false;
    this.setPhase("human_intervention");
    this.emit("agent_status", {
      memoryAgentActive: false,
      humanInterventionActive: true,
    });
    this.workflow.pauseForHumanUpdate = false;
    this.addMessage(
      "system",
      "human",
      reason ??
        "You can now guide the Executor directly. The Memory Agent is deactivated.",
      { channel: "discourse" },
    );
    void this.persistWorkflow();
  }

  async sendHumanInputInDiscourse(humanMessage: string): Promise<void> {
    this.haltAgents();
    return this.runExclusive(async () => {
    this.resumeAgents();
    if (this.workflow.phase === "rate_limit_pause") {
      await this.retryAfterRateLimit(humanMessage);
      return;
    }

    if (this.workflow.humanInterventionActive) {
      await this.sendHumanGuidanceInternal(humanMessage);
      return;
    }

    if (this.workflow.phase !== "error_resolution") {
      throw new Error(
        "Human input is only allowed during error resolution or human intervention.",
      );
    }

    this.workflow.pauseForHumanUpdate = true;
    this.addMessage("user", "human", humanMessage, { channel: "discourse" });

    const taskId = this.workflow.currentTaskId;
    if (!taskId) return;

    await this.memoryGuideAndRetry(
      `The human user has intervened in the error resolution discussion between the Memory and Executor agents:\n\n"${humanMessage}"\n\nIncorporate their input and provide updated actionable guidance for the Executor. This human input takes priority over all other changes.`,
      taskId,
      humanMessage,
      { humanIntervention: true, channel: "discourse" },
    );
    this.workflow.pauseForHumanUpdate = false;
    await this.persistWorkflow();
    });
  }

  async sendHumanGuidance(guidance: string): Promise<void> {
    return this.runExclusive(() => this.sendHumanGuidanceInternal(guidance));
  }

  private async sendHumanGuidanceInternal(guidance: string): Promise<void> {
    if (!this.workflow.humanInterventionActive) {
      throw new Error("Human intervention is not active.");
    }

    this.addMessage("user", "human", guidance, { channel: "discourse" });

    const taskId = this.workflow.currentTaskId;
    if (!taskId) return;

    const plan = this.memory.getState().plan;
    const task = plan?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.status = "in_progress";
    if (plan) await this.memory.setPlan(plan);

    const memoryContext = this.memory.buildContextPrompt();
    const prompt = `${memoryContext}\n\n---\n\nHuman guidance for task **${task.title}**:\n${guidance}`;

    const result = await this.runAgent("executor", prompt);
    const checked = await this.handleRateLimitResult(result, "executor", {
      previousPhase: "human_intervention",
      action: { type: "executor_human_guidance", taskId, guidance, prompt },
    });
    if (!checked) return;

    await this.persistAgentSessions();
    this.addMessage("assistant", "executor", checked.text, { channel: "discourse" });
    await this.memory.ingestAgentOutput(checked.text);

    if (checked.status === "error") {
      this.workflow.humanInterventionActive = false;
      this.workflow.memoryAgentActive = true;
      this.setPhase("error_resolution");
      this.emit("agent_status", {
        humanInterventionActive: false,
        memoryAgentActive: true,
      });
      await this.runErrorDiscourse(checked.text, taskId, checked.text);
      return;
    }

    task.status = "completed";
    if (plan) await this.memory.setPlan(plan);

    if (this.currentErrorId) {
      await this.memory.resolveError(this.currentErrorId, guidance);
    }

    this.workflow.humanInterventionActive = false;
    this.workflow.errorResolutionAttempts = 0;
    this.currentErrorId = null;
    this.setPhase("executing");
    this.emit("agent_status", { humanInterventionActive: false });
    this.emit("memory_update", this.memory.getState());

    void this.runBackgroundMemoryCapture(checked.text, task);
    await this.executeNextTask();
  }

  async retryAfterRateLimit(humanNote?: string): Promise<void> {
    const ctx = this.workflow.rateLimitResume;
    if (this.workflow.phase !== "rate_limit_pause" || !ctx) {
      throw new Error("No rate limit pause is active.");
    }

    const note = humanNote?.trim() ?? "";
    if (note) {
      this.addMessage("user", "human", note);
    }

    const previousPhase = ctx.previousPhase;
    this.workflow.rateLimitMessage = null;
    this.workflow.rateLimitPausedAgent = null;
    this.workflow.rateLimitRetryAt = null;
    this.workflow.rateLimitResume = null;
    this.setPhase(previousPhase);
    this.emit("agent_status", {
      rateLimitMessage: null,
      rateLimitPausedAgent: null,
      rateLimitRetryAt: null,
      rateLimitResume: null,
    });
    await this.persistWorkflow();

    const noteSuffix = note ? `\n\nHuman note before retry:\n${note}` : "";

    const action = ctx.action;
    switch (action.type) {
      case "planner": {
        const memoryContext = this.memory.buildContextPrompt();
        const prompt = memoryContext
          ? `${memoryContext}\n\n---\n\nUser message: ${action.userMessage}${noteSuffix}`
          : `${action.userMessage}${noteSuffix}`;
        const result = await this.runAgent("planner", prompt);
        const checked = await this.handleRateLimitResult(result, "planner", {
          previousPhase: previousPhase,
          action,
        });
        if (!checked) return;
        await this.finishPlannerRun(action.userMessage, checked);
        break;
      }
      case "executor_task": {
        const { taskId, prompt: executorPrompt } = action;
        const plan = this.memory.getState().plan;
        const task = plan?.tasks.find((t) => t.id === taskId);
        if (!plan || !task) return;

        const result = await this.runAgent("executor", `${executorPrompt}${noteSuffix}`);
        const checked = await this.handleRateLimitResult(result, "executor", {
          previousPhase: previousPhase,
          action,
        });
        if (!checked) return;

        const outcome = await this.finishExecutorTaskRun(task, plan, checked);
        if (outcome === "continue") {
          await this.executeNextTask();
        }
        break;
      }
      case "memory_capture": {
        const { taskId, executorOutput } = action;
        const plan = this.memory.getState().plan;
        const task = plan?.tasks.find((t) => t.id === taskId);
        if (!task) return;

        await this.runBackgroundMemoryCapture(executorOutput, task);
        break;
      }
      case "memory_discourse": {
        await this.memoryGuideAndRetry(
          `${action.memoryPrompt}${noteSuffix}`,
          action.taskId,
          action.fallbackError,
          action.metadata,
        );
        break;
      }
      case "revise_plan": {
        const revision = note
          ? `${action.revision}\n\nHuman note before retry:\n${note}`
          : action.revision;
        await this.revisePlanDuringExecution(revision, { skipUserMessage: true });
        break;
      }
      case "executor_human_update": {
        const { taskId, message } = action;
        const plan = this.memory.getState().plan;
        const task = plan?.tasks.find((t) => t.id === taskId);
        if (!task || !plan) return;
        await this.runExecutorWithHumanUpdate(
          task,
          plan,
          note ? `${message}\n\n${note}` : message,
        );
        break;
      }
      case "executor_retry": {
        const executorResult = await this.retryWithGuidance(
          `${action.guidance}${noteSuffix}`,
          action.taskId,
        );
        if (executorResult.success) {
          await this.clearErrorResolution(executorResult.guidance);
          await this.executeNextTask();
        } else if (executorResult.errorMessage !== "Rate limit pause") {
          await this.runErrorDiscourse(
            executorResult.errorMessage ?? action.guidance,
            action.taskId,
            executorResult.executorResponse ?? null,
          );
        }
        break;
      }
      case "executor_human_guidance": {
        const taskId = action.taskId;
        const plan = this.memory.getState().plan;
        const task = plan?.tasks.find((t) => t.id === taskId);
        if (!task || !plan) return;

        task.status = "in_progress";
        await this.memory.setPlan(plan);

        const result = await this.runAgent("executor", `${action.prompt}${noteSuffix}`);
        const checked = await this.handleRateLimitResult(result, "executor", {
          previousPhase: previousPhase,
          action,
        });
        if (!checked) return;

        await this.persistAgentSessions();
        this.addMessage("assistant", "executor", checked.text);
        await this.memory.ingestAgentOutput(checked.text);

        if (checked.status === "error") {
          this.workflow.humanInterventionActive = false;
          this.workflow.memoryAgentActive = true;
          this.setPhase("error_resolution");
          this.emit("agent_status", {
            humanInterventionActive: false,
            memoryAgentActive: true,
          });
          await this.runErrorDiscourse(checked.text, taskId, checked.text);
          return;
        }

        task.status = "completed";
        await this.memory.setPlan(plan);
        if (this.currentErrorId) {
          await this.memory.resolveError(this.currentErrorId, action.guidance);
        }
        this.workflow.humanInterventionActive = false;
        this.workflow.errorResolutionAttempts = 0;
        this.currentErrorId = null;
        this.setPhase("executing");
        this.emit("agent_status", { humanInterventionActive: false });
        this.emit("memory_update", this.memory.getState());
        void this.runBackgroundMemoryCapture(checked.text, task);
        await this.executeNextTask();
        break;
      }
    }
  }

  async renameProject(name: string): Promise<void> {
    await this.memory.rename(name);
    this.emit("memory_update", this.memory.getState());
  }

  async stopActiveAgents(): Promise<void> {
    this.haltAgents();
    await this.waitForActiveRuns();
    return this.runExclusive(async () => {
      this.executorChainActive = false;
      this.workflow.pauseForHumanUpdate = false;

      const plan = this.memory.getState().plan;
      if (
        plan &&
        (this.workflow.phase === "executing" || this.workflow.phase === "error_resolution")
      ) {
        const resetTasks = plan.tasks.map((task) =>
          task.status === "in_progress" ? { ...task, status: "pending" as const } : task,
        );
        await this.memory.setPlan({ ...plan, tasks: resetTasks });
        this.workflow.currentTaskId = null;
        this.workflow.memoryAgentActive = false;
        this.emit("agent_status", { memoryAgentActive: false });
        this.emit("memory_update", this.memory.getState());
      }

      this.resumeAgents();
      await this.persistWorkflow();
    });
  }

  async stopProject(): Promise<void> {
    this.haltAgents();
    await this.waitForActiveRuns();
    return this.runExclusive(async () => {
      this.executorChainActive = false;
      this.workflow.humanInterventionActive = false;
      this.workflow.memoryAgentActive = false;
      this.workflow.memoryCaptureActive = false;
      this.workflow.currentTaskId = null;
      this.workflow.pendingExecutorNotes = [];
      this.workflow.pendingPlanRevisions = [];
      this.workflow.pauseForHumanUpdate = false;
      this.workflow.rateLimitMessage = null;
      this.workflow.rateLimitPausedAgent = null;
      this.workflow.rateLimitRetryAt = null;
      this.workflow.rateLimitResume = null;

      const plan = this.memory.getState().plan;
      if (plan) {
        const resetTasks = plan.tasks.map((task) =>
          task.status === "in_progress" ? { ...task, status: "pending" as const } : task,
        );
        await this.memory.setPlan({
          ...plan,
          accepted: false,
          readyForAccept: plan.readyForAccept ?? false,
          tasks: resetTasks,
        });
      }

      this.setPhase("planning");
      this.emit("agent_status", {
        humanInterventionActive: false,
        memoryAgentActive: false,
        memoryCaptureActive: false,
        rateLimitMessage: null,
        rateLimitPausedAgent: null,
        rateLimitRetryAt: null,
        rateLimitResume: null,
      });
      this.emit("memory_update", this.memory.getState());
      await this.persistWorkflow();
    });
  }

  async dispose(): Promise<void> {
    this.haltAgents();
    await this.waitForActiveRuns();
    await this.persistAgentSessions();
    await this.persistWorkflow();
    await this.agents.dispose();
  }

  private async waitForActiveRuns(): Promise<void> {
    await this.operationChain;
  }
}
