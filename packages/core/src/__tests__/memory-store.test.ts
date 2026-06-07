import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { MemoryStore } from "../memory-store.js";

describe("MemoryStore", () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "polaris-test-"));
  });

  after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("persists and restores state", async () => {
    const store = new MemoryStore(tmpDir);
    await store.init();

    await store.setPlan({
      id: "plan-1",
      goal: "Build app",
      summary: "A test app",
      tasks: [],
      accepted: false,
      revisions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const projectId = store.getProjectId();
    const store2 = new MemoryStore(tmpDir, projectId);
    await store2.init();

    assert.equal(store2.getState().plan?.goal, "Build app");
  });

  it("deduplicates connections", async () => {
    const store = new MemoryStore(tmpDir);
    await store.init();

    const conn = {
      type: "file" as const,
      source: "a.ts",
      target: "b.ts",
      description: "imports",
    };

    await store.addConnection(conn);
    await store.addConnection(conn);

    assert.equal(store.getState().connections.length, 1);
  });

  it("tracks error occurrences", async () => {
    const store = new MemoryStore(tmpDir);
    await store.init();

    const e1 = await store.recordError("TypeError: x", "ctx");
    const e2 = await store.recordError("TypeError: x", "ctx again");

    assert.equal(e1.id, e2.id);
    assert.equal(store.getState().errors[0].occurrences, 2);
  });

  it("ingests agent output blocks", async () => {
    const store = new MemoryStore(tmpDir);
    await store.init();

    const result = await store.ingestAgentOutput(`
\`\`\`connections
[{"type": "internal", "source": "src/a.ts", "target": "src/b.ts", "description": "calls"}]
\`\`\`
\`\`\`knowledge
[{"category": "note", "title": "Pattern", "content": "Uses factory", "relatedFiles": []}]
\`\`\`
`);

    assert.equal(result.connections, 1);
    assert.equal(result.knowledge, 1);
    assert.equal(store.getState().knowledge.length, 1);
  });

  it("saves and loads workflow state", async () => {
    const store = new MemoryStore(tmpDir);
    await store.init();

    const workflow = {
      projectId: store.getProjectId(),
      phase: "executing" as const,
      cwd: tmpDir,
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

    await store.saveWorkflow(workflow);
    const loaded = await store.loadWorkflow();
    assert.equal(loaded?.phase, "executing");
  });

  it("saveWorkflow recreates memory directory if missing", async () => {
    const store = new MemoryStore(tmpDir);
    await store.init();

    const workflow = {
      projectId: store.getProjectId(),
      phase: "planning" as const,
      cwd: tmpDir,
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

    await fs.rm(path.join(tmpDir, ".polaris", "memory"), { recursive: true, force: true });
    await store.saveWorkflow(workflow);

    const loaded = await store.loadWorkflow();
    assert.equal(loaded?.phase, "planning");
  });

  it("resolveProjectId returns active project before state file exists", async () => {
    const projectId = "9f290d7a-3622-474d-a13a-dd3b22c6abb7";
    await fs.mkdir(path.join(tmpDir, ".polaris"), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, ".polaris", "active-project.json"),
      JSON.stringify({ projectId, updatedAt: new Date().toISOString() }),
    );

    const resolved = await MemoryStore.resolveProjectId(tmpDir);
    assert.equal(resolved, projectId);

    const store = await MemoryStore.open(tmpDir, projectId);
    assert.equal(store.getProjectId(), projectId);
  });
});
