# Polaris

Multi-agent development orchestrator powered by **Claude (Anthropic API)**. Three specialized agents collaborate to plan, execute, and remember your project.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Polaris UI                           │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  Prompt  │  │  Execution  │  │       Memory         │   │
│  │   Tab    │  │     Tab     │  │        Tab           │   │
│  └────┬─────┘  └──────┬──────┘  └──────────┬───────────┘   │
└───────┼───────────────┼────────────────────┼───────────────┘
        │               │                    │
        ▼               ▼                    ▼
   ┌─────────┐    ┌──────────┐        ┌──────────┐
   │ Agent 1 │    │ Agent 2  │◄──────►│ Agent 3  │
   │ Planner │    │ Executor │        │  Memory  │
   │ (Claude)│    │ (Claude) │        │ (Claude) │
   └─────────┘    └──────────┘        └────┬─────┘
                                           │
                                           ▼
                                    .polaris/memory/
                                    (files on disk)
```

### Agent Roles

| Agent | Model Role | Capabilities |
|-------|------------|--------------|
| **Planner** | Claude | Organizes goals into tasks, discusses until accepted |
| **Executor** | Claude Code | Executes tasks with `read_file`, `write_file`, `list_directory`, `run_command` tools |
| **Memory** | Claude | Catalogs connections, knowledge, errors; guides error resolution |

## Prerequisites

- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/settings/keys)

## Setup

```bash
npm install
npm run build
```

On first run, you'll be **prompted to enter your Anthropic API key**. It's saved to `.polaris/config.json` (mode 600) in your project directory.

Alternatively:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

## Usage

### Web UI

```bash
npm start
# Opens http://localhost:3847
```

If the server wasn't started with a key, the web UI shows a setup screen to enter your API key.

### CLI

```bash
npm start                          # Web UI + server (prompts for API key)
npm run plan                       # Interactive CLI planning
npm run memory                     # View stored memory context
npx polaris start --dir /path/to/project
```

## API Key Resolution Order

1. `ANTHROPIC_API_KEY` environment variable
2. `.polaris/config.json` in the project directory
3. Interactive terminal prompt (saved to config)

## Memory Storage

```
.polaris/
├── config.json                         # Anthropic API key (local only)
├── active-project.json
└── memory/
    ├── {projectId}.json
    ├── {projectId}-plan.json
    ├── {projectId}-sessions.json       # Claude conversation history per agent
    ├── {projectId}-connections.json
    ├── {projectId}-errors.json
    ├── {projectId}-knowledge.json
    └── {projectId}-workflow.json
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Claude model for all agents |
| `POLARIS_PORT` | `3847` | Web server port |
| `POLARIS_CWD` | `process.cwd()` | Project working directory |
| `POLARIS_ERROR_TIMEOUT_MS` | `300000` | Human handoff timeout (5 min) |
| `POLARIS_MAX_ERROR_RETRIES` | `3` | Memory ↔ Executor discourse attempts |

## Testing

```bash
npm test
```

## License

MIT
