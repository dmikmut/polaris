#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import { Orchestrator, resolveAnthropicApiKey } from "@polaris/core";
import { freePort } from "./port.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();

program
  .name("polaris")
  .description("Multi-agent orchestration CLI powered by Claude (Anthropic)")
  .version("1.0.0");

program
  .command("start")
  .description("Start the Polaris web UI and server")
  .option("-p, --port <number>", "Server port", "3847")
  .option("-d, --dir <path>", "Working directory", process.cwd())
  .action(async (opts: { port: string; dir: string }) => {
    const cwd = path.resolve(opts.dir);

    console.log(chalk.cyan.bold("\n  Polaris"));
    console.log(chalk.dim("  Claude multi-agent development orchestrator\n"));

    if (!process.env.ANTHROPIC_API_KEY) {
      await resolveAnthropicApiKey(cwd, { prompt: true, save: true });
    }

    const port = Number(opts.port);
    const stopped = freePort(port);
    if (stopped > 0) {
      console.log(
        chalk.yellow(`  Stopped ${stopped} previous process(es) on port ${port}`),
      );
      await new Promise((r) => setTimeout(r, 400));
    }

    const serverPath = path.resolve(__dirname, "../../server/dist/index.js");
    const env = {
      ...process.env,
      POLARIS_PORT: String(port),
      POLARIS_CWD: cwd,
    };

    console.log(chalk.green(`  Starting server on port ${port}...`));
    console.log(chalk.dim(`  Working directory: ${cwd}\n`));

    const child = spawn("node", [serverPath], {
      env,
      stdio: "inherit",
    });

    child.on("error", (err) => {
      console.error(chalk.red(`Failed to start: ${err.message}`));
      process.exit(1);
    });
  });

program
  .command("stop")
  .description("Stop the Polaris server running on a port")
  .option("-p, --port <number>", "Server port", "3847")
  .action((opts: { port: string }) => {
    const port = Number(opts.port);
    const stopped = freePort(port);
    if (stopped > 0) {
      console.log(chalk.green(`  Stopped ${stopped} process(es) on port ${port}`));
    } else {
      console.log(chalk.dim(`  No process found on port ${port}`));
    }
  });

program
  .command("plan")
  .description("Interactive planning session with the Planner agent (CLI mode)")
  .option("-d, --dir <path>", "Working directory", process.cwd())
  .action(async (opts: { dir: string }) => {
    const cwd = path.resolve(opts.dir);
    const apiKey = await resolveAnthropicApiKey(cwd, { prompt: true, save: true });
    const orch = await Orchestrator.create({ apiKey, cwd });
    await orch.init();

    console.log(chalk.cyan.bold("\n  Polaris Planner (Claude)"));
    console.log(chalk.dim("  Describe your goal. Type 'accept' to approve the plan.\n"));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = (): void => {
      rl.question(chalk.green("You: "), async (input) => {
        const trimmed = input.trim();
        if (!trimmed) {
          prompt();
          return;
        }

        if (trimmed.toLowerCase() === "accept") {
          try {
            const spinner = ora("Accepting plan and starting execution...").start();
            await orch.acceptPlan();
            spinner.succeed("Plan accepted. Executor is running tasks.");
            console.log(chalk.dim("\nWatch progress in the web UI: polaris start\n"));
          } catch (err) {
            console.error(chalk.red(err instanceof Error ? err.message : String(err)));
          }
          rl.close();
          await orch.dispose();
          return;
        }

        if (trimmed.toLowerCase() === "quit" || trimmed.toLowerCase() === "exit") {
          rl.close();
          await orch.dispose();
          return;
        }

        const spinner = ora("Planner thinking...").start();
        try {
          await orch.sendPlannerMessage(trimmed);
          spinner.stop();

          const memory = orch.getMemoryState();
          const lastMsg = orch.getWorkflowState().messages.at(-1);
          if (lastMsg) {
            console.log(chalk.blue("\nPlanner:"), lastMsg.content, "\n");
          }
          if (memory.plan) {
            console.log(chalk.yellow("Tasks:"));
            for (const task of memory.plan.tasks) {
              console.log(chalk.dim(`  ${task.order + 1}.`), task.title);
            }
            console.log(chalk.dim("\nType 'accept' to approve, or continue discussing.\n"));
          }
        } catch (err) {
          spinner.fail(err instanceof Error ? err.message : String(err));
        }

        prompt();
      });
    };

    prompt();
  });

program
  .command("memory")
  .description("Show the Memory agent's stored context")
  .option("-d, --dir <path>", "Working directory", process.cwd())
  .action(async (opts: { dir: string }) => {
    const { MemoryStore } = await import("@polaris/core");
    const store = await MemoryStore.create(path.resolve(opts.dir));
    console.log(store.buildContextPrompt());
  });

program.parse();
