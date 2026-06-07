import cors from "cors";
import express from "express";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import {
  Orchestrator,
  MemoryStore,
  resolveAnthropicApiKey,
  setRuntimeApiKey,
  loadConfig,
  saveConfig,
  validateWorkspacePath,
  listAllProjectSummaries,
  migrateRegistryFromWorkspace,
  registerProject,
  removeRegistryProject,
  resolveRegistryProject,
  setRegistryActiveProject,
  updateRegistryProjectWorkspace,
} from "@polaris/core";
import type { StreamEvent } from "@polaris/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.POLARIS_PORT ?? 3847);
const CONFIG_ROOT = path.resolve(process.env.POLARIS_CWD ?? process.cwd());

let apiKey: string | null = process.env.ANTHROPIC_API_KEY?.trim() ?? null;
let workspaceCwd: string = CONFIG_ROOT;
let configuredWorkspacePath: string | null = null;
let workspaceWarning: string | null = null;
let orchestrator: Orchestrator | null = null;

async function loadWorkspaceFromConfig(): Promise<void> {
  const config = await loadConfig(CONFIG_ROOT);
  configuredWorkspacePath = config.workspacePath?.trim() ?? null;
  workspaceWarning = null;

  let fallback = CONFIG_ROOT;
  if (configuredWorkspacePath) {
    try {
      fallback = await validateWorkspacePath(configuredWorkspacePath);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      workspaceWarning = `Saved workspace "${configuredWorkspacePath}" is unavailable (${reason}). Using ${CONFIG_ROOT} until you set a valid folder.`;
      console.warn(`  ${workspaceWarning}`);
    }
  }

  await migrateRegistryFromWorkspace(CONFIG_ROOT, fallback);
  const projects = await listAllProjectSummaries(CONFIG_ROOT);
  const active = projects.find((p) => p.isActive);
  if (active?.workspacePath) {
    try {
      workspaceCwd = await validateWorkspacePath(active.workspacePath);
      configuredWorkspacePath = workspaceCwd;
      return;
    } catch {
      /* fall through */
    }
  }

  workspaceCwd = fallback;
}

function workspaceInfo() {
  return {
    path: workspaceCwd,
    configRoot: CONFIG_ROOT,
    configuredPath: configuredWorkspacePath,
    warning: workspaceWarning,
  };
}

async function ensureApiKey(): Promise<string> {
  if (apiKey) return apiKey;

  const config = await loadConfig(CONFIG_ROOT);
  if (config.anthropicApiKey?.trim()) {
    apiKey = config.anthropicApiKey.trim();
    setRuntimeApiKey(apiKey);
    return apiKey;
  }

  apiKey = await resolveAnthropicApiKey(CONFIG_ROOT, { prompt: true, save: true });
  return apiKey;
}

function setApiKey(key: string): void {
  apiKey = key.trim();
  setRuntimeApiKey(apiKey);
  orchestrator = null;
}

async function resetOrchestrator(): Promise<void> {
  if (orchestrator) {
    orchestrator.haltAgents();
    await orchestrator.dispose();
    orchestrator = null;
  }
}

async function setWorkspace(dir: string): Promise<string> {
  const resolved = await validateWorkspacePath(dir);
  workspaceCwd = resolved;
  configuredWorkspacePath = resolved;
  workspaceWarning = null;
  const config = await loadConfig(CONFIG_ROOT);
  await saveConfig(CONFIG_ROOT, { ...config, workspacePath: resolved });
  await resetOrchestrator();
  return resolved;
}

async function getOrchestrator(): Promise<Orchestrator> {
  const key = await ensureApiKey();
  if (!orchestrator) {
    const config = await loadConfig(CONFIG_ROOT);
    const projectId = await MemoryStore.resolveProjectId(workspaceCwd);
    orchestrator = await Orchestrator.create({
      apiKey: key,
      cwd: workspaceCwd,
      projectId,
      model: config.model ?? process.env.ANTHROPIC_MODEL,
      errorTimeoutMs: Number(process.env.POLARIS_ERROR_TIMEOUT_MS ?? 300_000),
      maxErrorRetries: Number(process.env.POLARIS_MAX_ERROR_RETRIES ?? 3),
    });
    await orchestrator.init();
  }
  return orchestrator;
}

function resolveWebDist(): string {
  if (process.env.POLARIS_FRONTEND_DIST) {
    return path.resolve(process.env.POLARIS_FRONTEND_DIST);
  }
  const candidates = [
    path.resolve(CONFIG_ROOT, "../../polaris-frontend/out"),
    path.resolve(__dirname, "../../web/dist"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) {
      return dir;
    }
  }
  return path.resolve(__dirname, "../../web/dist");
}

const app = express();
app.use(cors());
app.use(express.json());

const webDist = resolveWebDist();

// API routes must be registered before static/SPA middleware
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", cwd: workspaceCwd, configRoot: CONFIG_ROOT, provider: "anthropic" });
});

app.get("/api/auth/status", async (_req, res) => {
  const configured = Boolean(
    apiKey ?? process.env.ANTHROPIC_API_KEY ?? (await loadConfig(CONFIG_ROOT)).anthropicApiKey,
  );
  res.json({ configured, provider: "anthropic" });
});

app.get("/api/workspace", (_req, res) => {
  res.json(workspaceInfo());
});

app.post("/api/workspace", async (req, res) => {
  try {
    const { path: dir } = req.body as { path?: string };
    if (!dir?.trim()) {
      res.status(400).json({ error: "path is required" });
      return;
    }
    const resolved = await setWorkspace(dir.trim());
    res.json(workspaceInfo());
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/auth/configure", async (req, res) => {
  try {
    const { apiKey: key, workspacePath } = req.body as {
      apiKey?: string;
      workspacePath?: string;
    };
    if (!key?.trim()) {
      res.status(400).json({ error: "apiKey is required" });
      return;
    }
    setApiKey(key);
    const config = await loadConfig(CONFIG_ROOT);
    const updates: typeof config = { ...config, anthropicApiKey: key.trim() };
    if (workspacePath?.trim()) {
      updates.workspacePath = await validateWorkspacePath(workspacePath.trim());
      workspaceCwd = updates.workspacePath;
      configuredWorkspacePath = updates.workspacePath;
      workspaceWarning = null;
      await resetOrchestrator();
    }
    await saveConfig(CONFIG_ROOT, updates);
    res.json({ ok: true, workspacePath: workspaceCwd });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

async function listProjects() {
  return listAllProjectSummaries(CONFIG_ROOT);
}

async function appStatePayload(orch: Orchestrator) {
  return {
    workflow: orch.getWorkflowState(),
    memory: orch.getMemoryState(),
    projects: await listProjects(),
    workspacePath: workspaceCwd,
  };
}

function emptyAppState() {
  return {
    workflow: {
      projectId: "",
      phase: "idle" as const,
      cwd: workspaceCwd,
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
    },
    memory: {
      projectId: "",
      plan: null,
      connections: [],
      errors: [],
      knowledge: [],
      updatedAt: new Date().toISOString(),
    },
    projects: [] as Awaited<ReturnType<typeof listAllProjectSummaries>>,
    workspacePath: workspaceCwd,
  };
}

app.get("/api/projects", async (_req, res) => {
  try {
    res.json({
      projects: await listProjects(),
      workspacePath: workspaceCwd,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.get("/api/state", async (_req, res) => {
  try {
    const projects = await listProjects();
    if (projects.length === 0) {
      res.json(emptyAppState());
      return;
    }
    const orch = await getOrchestrator();
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/planner/message", async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    const orch = await getOrchestrator();
    await orch.sendPlannerMessage(message);
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

async function switchToProject(projectId: string): Promise<Orchestrator> {
  const entry = await resolveRegistryProject(CONFIG_ROOT, projectId);
  await setWorkspace(entry.workspacePath);
  await resetOrchestrator();
  await MemoryStore.setActiveProject(workspaceCwd, projectId);
  await setRegistryActiveProject(CONFIG_ROOT, projectId);
  return getOrchestrator();
}

app.post("/api/project/switch", async (req, res) => {
  try {
    const { projectId } = req.body as { projectId?: string };
    if (!projectId?.trim()) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }
    const orch = await switchToProject(projectId.trim());
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/project/rename", async (req, res) => {
  try {
    const { projectId, name } = req.body as { projectId?: string; name?: string };
    if (!projectId?.trim()) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }
    if (!name?.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const targetId = projectId.trim();
    const entry = await resolveRegistryProject(CONFIG_ROOT, targetId);
    const activeId = await MemoryStore.resolveProjectId(workspaceCwd);

    if (targetId === activeId && orchestrator) {
      const orch = await getOrchestrator();
      await orch.renameProject(name.trim());
    } else {
      await MemoryStore.renameProject(entry.workspacePath, targetId, name.trim());
    }

    const orch = await getOrchestrator();
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/project/stop", async (req, res) => {
  try {
    const { projectId } = req.body as { projectId?: string };
    const activeId = await MemoryStore.resolveProjectId(workspaceCwd);
    const targetId = projectId?.trim() || activeId;

    if (!targetId) {
      res.status(400).json({ error: "No project to stop" });
      return;
    }

    const entry = await resolveRegistryProject(CONFIG_ROOT, targetId);

    if (targetId === activeId && orchestrator) {
      orchestrator.haltAgents();
      await orchestrator.stopProject();
      res.json(await appStatePayload(orchestrator));
      return;
    }

    await MemoryStore.stopProjectOnDisk(entry.workspacePath, targetId);
    const orch = await getOrchestrator();
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/project/delete", async (req, res) => {
  try {
    const { projectId } = req.body as { projectId?: string };
    const activeId = await MemoryStore.resolveProjectId(workspaceCwd);

    if (!projectId?.trim()) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    const targetId = projectId.trim();
    const entry = await resolveRegistryProject(CONFIG_ROOT, targetId);

    if (targetId === activeId) {
      orchestrator?.haltAgents();
      await resetOrchestrator();
    }

    await MemoryStore.deleteProject(entry.workspacePath, targetId);
    const registry = await removeRegistryProject(CONFIG_ROOT, targetId);

    if (registry.projects.length === 0) {
      res.json(emptyAppState());
      return;
    }

    if (targetId === activeId && registry.activeProjectId) {
      const orch = await switchToProject(registry.activeProjectId);
      res.json(await appStatePayload(orch));
      return;
    }

    const orch = await getOrchestrator();
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/project/new", async (req, res) => {
  try {
    const projects = await listProjects();
    const running = projects.find((p) => p.isRunning);
    if (running) {
      res.status(400).json({
        error: "A project is still running. Stop it before creating another.",
      });
      return;
    }

    const { workspacePath: requestedPath } = req.body as { workspacePath?: string };
    const targetPath = requestedPath?.trim()
      ? await validateWorkspacePath(requestedPath.trim())
      : workspaceCwd;

    await resetOrchestrator();
    const projectId = await MemoryStore.createProject(targetPath);
    await registerProject(CONFIG_ROOT, targetPath, projectId);
    await setWorkspace(targetPath);
    const orch = await getOrchestrator();
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/project/workspace", async (req, res) => {
  try {
    const { projectId, workspacePath } = req.body as {
      projectId?: string;
      workspacePath?: string;
    };
    if (!projectId?.trim()) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }
    if (!workspacePath?.trim()) {
      res.status(400).json({ error: "workspacePath is required" });
      return;
    }

    const targetId = projectId.trim();
    const entry = await resolveRegistryProject(CONFIG_ROOT, targetId);
    const resolved = await validateWorkspacePath(workspacePath.trim());

    if (entry.workspacePath !== resolved) {
      await updateRegistryProjectWorkspace(CONFIG_ROOT, targetId, resolved);
    }

    const projects = await listProjects();
    const isActive = projects.find((p) => p.id === targetId)?.isActive;
    if (isActive) {
      await setWorkspace(resolved);
      await resetOrchestrator();
      const orch = await getOrchestrator();
      res.json(await appStatePayload(orch));
      return;
    }

    if (orchestrator) {
      res.json(await appStatePayload(orchestrator));
      return;
    }

    res.json({ ...emptyAppState(), projects });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/agents/stop", async (_req, res) => {
  try {
    const orch = await getOrchestrator();
    await orch.stopActiveAgents();
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/plan/accept", async (_req, res) => {
  try {
    const orch = await getOrchestrator();
    await orch.acceptPlan();
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/executor/message", async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    const orch = await getOrchestrator();
    await orch.sendExecutorHumanUpdate(message);
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/plan/revise", async (req, res) => {
  try {
    const { revision } = req.body as { revision?: string };
    if (!revision?.trim()) {
      res.status(400).json({ error: "revision is required" });
      return;
    }
    const orch = await getOrchestrator();
    await orch.revisePlanDuringExecution(revision);
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/human/intervene", async (_req, res) => {
  try {
    const orch = await getOrchestrator();
    orch.enableHumanIntervention();
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/rate-limit/retry", async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    const orch = await getOrchestrator();
    await orch.retryAfterRateLimit(message?.trim() || undefined);
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/human/guidance", async (req, res) => {
  try {
    const { guidance } = req.body as { guidance?: string };
    if (!guidance?.trim()) {
      res.status(400).json({ error: "guidance is required" });
      return;
    }
    const orch = await getOrchestrator();
    await orch.sendHumanInputInDiscourse(guidance);
    res.json(await appStatePayload(orch));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Unknown API routes return JSON (not HTML) so the UI can parse errors
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found. Restart the server after rebuilding." });
});

app.use(express.static(webDist));

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/ws")) {
    next();
    return;
  }
  const normalized = req.path.endsWith("/") ? req.path : `${req.path}/`;
  const nestedIndex = path.join(webDist, normalized, "index.html");
  if (fs.existsSync(nestedIndex)) {
    res.sendFile(nestedIndex);
    return;
  }
  res.sendFile(path.join(webDist, "index.html"));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", async (ws: WebSocket) => {
  try {
    const orch = await getOrchestrator();
    const unsubscribe = orch.onEvent((event: StreamEvent) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      }
    });

    ws.on("close", () => unsubscribe());
  } catch (err) {
    ws.send(
      JSON.stringify({
        type: "error",
        payload: { message: err instanceof Error ? err.message : String(err) },
        timestamp: new Date().toISOString(),
      }),
    );
    ws.close();
  }
});

async function main(): Promise<void> {
  console.log("\n  Polaris — Claude Multi-Agent Orchestrator\n");

  await loadWorkspaceFromConfig();

  if (!apiKey) {
    try {
      await ensureApiKey();
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  }

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n  Error: Port ${PORT} is already in use.\n`);
      console.error(`  Stop the old server:`);
      console.error(`    npm run stop`);
      console.error(`    lsof -ti :${PORT} | xargs kill -9\n`);
      console.error(`  Or use a different port:`);
      console.error(`    POLARIS_PORT=3848 npm start\n`);
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`  App:       http://localhost:${PORT}`);
    console.log(`  UI:        ${webDist}`);
    console.log(`  Workspace: ${workspaceCwd}`);
    console.log(`  Memory:    ${path.join(workspaceCwd, ".polaris/memory")}`);
    console.log(`  Agents:    Planner, Executor, Reviewer (Claude)\n`);
  });
}

process.on("SIGINT", async () => {
  if (orchestrator) await orchestrator.dispose();
  process.exit(0);
});

main();
