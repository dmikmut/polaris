import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseConnections,
  parseKnowledge,
  parsePlanTasks,
  parseResolutionStatus,
} from "../agent-manager.js";

describe("parsePlanTasks", () => {
  it("extracts tasks from plan-tasks block", () => {
    const text = `Here is the plan:
\`\`\`plan-tasks
[{"title": "Setup", "description": "Initialize project"}]
\`\`\``;
    const tasks = parsePlanTasks(text);
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].title, "Setup");
  });

  it("returns empty array when no block found", () => {
    assert.deepEqual(parsePlanTasks("no tasks here"), []);
  });
});

describe("parseConnections", () => {
  it("extracts connections from block", () => {
    const text = `\`\`\`connections
[{"type": "api", "source": "frontend", "target": "/api/users", "description": "fetch users"}]
\`\`\``;
    const conns = parseConnections(text);
    assert.equal(conns.length, 1);
    assert.equal(conns[0].type, "api");
  });
});

describe("parseKnowledge", () => {
  it("extracts knowledge entries", () => {
    const text = `\`\`\`knowledge
[{"category": "architecture", "title": "Auth flow", "content": "JWT based", "relatedFiles": ["auth.ts"]}]
\`\`\``;
    const entries = parseKnowledge(text);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].title, "Auth flow");
  });
});

describe("parseResolutionStatus", () => {
  it("parses resolved status", () => {
    assert.equal(parseResolutionStatus("Done.\nRESOLUTION_STATUS: resolved"), "resolved");
  });

  it("parses needs_more_info status", () => {
    assert.equal(parseResolutionStatus("RESOLUTION_STATUS: needs_more_info"), "needs_more_info");
  });

  it("returns null when missing", () => {
    assert.equal(parseResolutionStatus("no status"), null);
  });
});
