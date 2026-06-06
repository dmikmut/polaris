import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const CONFIG_DIR = ".polaris";
const CONFIG_FILE = "config.json";

export interface PolarisConfig {
  anthropicApiKey?: string;
  model?: string;
  workspacePath?: string;
}

export async function validateWorkspacePath(workspacePath: string): Promise<string> {
  const resolved = path.resolve(workspacePath.trim());
  try {
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${resolved}`);
    }
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (code === "ENOENT") {
      throw new Error(`Folder does not exist: ${resolved}`);
    }
    throw err;
  }
  return resolved;
}

export function getConfigPath(cwd: string): string {
  return path.join(cwd, CONFIG_DIR, CONFIG_FILE);
}

export async function loadConfig(cwd: string): Promise<PolarisConfig> {
  try {
    const raw = await fs.readFile(getConfigPath(cwd), "utf-8");
    return JSON.parse(raw) as PolarisConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(cwd: string, config: PolarisConfig): Promise<void> {
  const dir = path.join(cwd, CONFIG_DIR);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(getConfigPath(cwd), JSON.stringify(config, null, 2), {
    mode: 0o600,
  });
}

export async function promptForApiKey(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Enter your Anthropic API key: ", async (answer) => {
      rl.close();
      const key = answer.trim();
      if (!key) {
        console.error("API key is required.");
        process.exit(1);
      }
      resolve(key);
    });
  });
}

export async function resolveAnthropicApiKey(
  cwd: string,
  options: { prompt?: boolean; save?: boolean } = {},
): Promise<string> {
  const fromEnv = process.env.ANTHROPIC_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  const config = await loadConfig(cwd);
  if (config.anthropicApiKey?.trim()) return config.anthropicApiKey.trim();

  if (options.prompt !== false) {
    console.log("\n  Anthropic API key required for Claude agents.");
    console.log("  Get yours at https://console.anthropic.com/settings/keys\n");
    const key = await promptForApiKey();
    if (options.save !== false) {
      await saveConfig(cwd, { ...config, anthropicApiKey: key });
      console.log(`  Key saved to ${getConfigPath(cwd)}\n`);
    }
    return key;
  }

  throw new Error(
    "ANTHROPIC_API_KEY not set. Export it, save to .polaris/config.json, or run with interactive prompt.",
  );
}

export function setRuntimeApiKey(key: string): void {
  process.env.ANTHROPIC_API_KEY = key;
}
