import cors from "cors";
import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import {
  Orchestrator,
  resolveAnthropicApiKey,
  setRuntimeApiKey,
  loadConfig,
  saveConfig,
  validateWorkspacePath,
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

  if (configuredWorkspacePath) {
    try {
      workspaceCwd = await validateWorkspacePath(configuredWorkspacePath);
    } catch (err) {
      workspaceCwd = CONFIG_ROOT;
      const reason = err instanceof Error ? err.message : String(err);
      workspaceWarning = `Saved workspace "${configuredWorkspacePath}" is unavailable (${reason}). Using ${CONFIG_ROOT} until you set a valid folder.`;
      console.warn(`  ${workspaceWarning}`);
    }
  } else {
    workspaceCwd = CONFIG_ROOT;
  }
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
    orchestrator = await Orchestrator.create({
      apiKey: key,
      cwd: workspaceCwd,
      model: config.model ?? process.env.ANTHROPIC_MODEL,
      errorTimeoutMs: Number(process.env.POLARIS_ERROR_TIMEOUT_MS ?? 300_000),
      maxErrorRetries: Number(process.env.POLARIS_MAX_ERROR_RETRIES ?? 3),
    });
    await orchestrator.init();
  }
  return orchestrator;
}

const app = express();
app.use(cors());
app.use(express.json());

const webDist = path.resolve(__dirname, "../../web/dist");

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

app.get("/api/state", async (_req, res) => {
  try {
    const orch = await getOrchestrator();
    res.json({
      workflow: orch.getWorkflowState(),
      memory: orch.getMemoryState(),
      workspacePath: workspaceCwd,
    });
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
    res.json({
      workflow: orch.getWorkflowState(),
      memory: orch.getMemoryState(),
      workspacePath: workspaceCwd,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/plan/accept", async (_req, res) => {
  try {
    const orch = await getOrchestrator();
    await orch.acceptPlan();
    res.json({
      workflow: orch.getWorkflowState(),
      memory: orch.getMemoryState(),
      workspacePath: workspaceCwd,
    });
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
    res.json({
      workflow: orch.getWorkflowState(),
      memory: orch.getMemoryState(),
      workspacePath: workspaceCwd,
    });
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
    res.json({
      workflow: orch.getWorkflowState(),
      memory: orch.getMemoryState(),
      workspacePath: workspaceCwd,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/human/intervene", async (_req, res) => {
  try {
    const orch = await getOrchestrator();
    orch.enableHumanIntervention();
    res.json({ workflow: orch.getWorkflowState(), workspacePath: workspaceCwd });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/rate-limit/retry", async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    const orch = await getOrchestrator();
    await orch.retryAfterRateLimit(message?.trim() || undefined);
    res.json({
      workflow: orch.getWorkflowState(),
      memory: orch.getMemoryState(),
      workspacePath: workspaceCwd,
    });
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
    res.json({
      workflow: orch.getWorkflowState(),
      memory: orch.getMemoryState(),
      workspacePath: workspaceCwd,
    });
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
    console.log(`  Server:    http://localhost:${PORT}`);
    console.log(`  Workspace: ${workspaceCwd}`);
    console.log(`  Memory:    ${path.join(workspaceCwd, ".polaris/memory")}`);
    console.log(`  Agents:    Planner, Executor, Memory (Claude)\n`);
  });
}

process.on("SIGINT", async () => {
  if (orchestrator) await orchestrator.dispose();
  process.exit(0);
});

main();
