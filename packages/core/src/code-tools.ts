import fs from "node:fs/promises";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import type Anthropic from "@anthropic-ai/sdk";

export type ToolRunOptions = {
  shouldAbort?: () => boolean;
  registerProcess?: (child: ChildProcess) => void;
};

const MAX_FILE_BYTES = 512_000;
const MAX_OUTPUT_BYTES = 64_000;

function resolveSafePath(cwd: string, target: string): string {
  const resolved = path.resolve(cwd, target);
  if (!resolved.startsWith(path.resolve(cwd))) {
    throw new Error(`Path escapes workspace: ${target}`);
  }
  return resolved;
}

export const EXECUTOR_TOOLS: Anthropic.Tool[] = [
  {
    name: "read_file",
    description: "Read the contents of a file in the project workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Relative path from project root" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write or overwrite a file in the project workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Relative path from project root" },
        content: { type: "string", description: "Full file content" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_directory",
    description: "List files and directories at a path in the project workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Relative directory path (use '.' for root)" },
      },
      required: ["path"],
    },
  },
  {
    name: "run_command",
    description: "Run a shell command in the project workspace. Use for builds, tests, installs.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: { type: "string", description: "Shell command to execute" },
      },
      required: ["command"],
    },
  },
];

async function runShellCommand(
  cwd: string,
  command: string,
  options?: ToolRunOptions,
): Promise<string> {
  if (options?.shouldAbort?.()) {
    return "Error: Stopped.";
  }

  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    options?.registerProcess?.(child);

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (value: string) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      if (stdout.length > MAX_OUTPUT_BYTES) {
        stdout = stdout.slice(0, MAX_OUTPUT_BYTES);
      }
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > MAX_OUTPUT_BYTES) {
        stderr = stderr.slice(0, MAX_OUTPUT_BYTES);
      }
    });

    child.on("error", (err) => finish(`Error: ${err.message}`));
    child.on("close", () => {
      if (options?.shouldAbort?.()) {
        finish("Error: Stopped.");
        return;
      }
      const out = [stdout, stderr].filter(Boolean).join("\n");
      finish(out || "(no output)");
    });

    const timeout = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      finish("Error: command timed out after 120s");
    }, 120_000);

    child.on("exit", () => clearTimeout(timeout));
  });
}

export async function executeTool(
  cwd: string,
  name: string,
  input: Record<string, unknown>,
  options?: ToolRunOptions,
): Promise<string> {
  if (options?.shouldAbort?.()) {
    return "Error: Stopped.";
  }

  try {
    switch (name) {
      case "read_file": {
        const filePath = resolveSafePath(cwd, String(input.path));
        const stat = await fs.stat(filePath);
        if (stat.size > MAX_FILE_BYTES) {
          return `Error: file too large (${stat.size} bytes, max ${MAX_FILE_BYTES})`;
        }
        return await fs.readFile(filePath, "utf-8");
      }
      case "write_file": {
        const filePath = resolveSafePath(cwd, String(input.path));
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, String(input.content), "utf-8");
        return `Wrote ${String(input.path)} (${String(input.content).length} bytes)`;
      }
      case "list_directory": {
        const dirPath = resolveSafePath(cwd, String(input.path ?? "."));
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries
          .map((e) => `${e.isDirectory() ? "dir" : "file"}\t${e.name}`)
          .join("\n");
      }
      case "run_command": {
        return runShellCommand(cwd, String(input.command), options);
      }
      default:
        return `Error: unknown tool ${name}`;
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
