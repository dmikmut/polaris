interface LandingPageProps {
  onTryApp: () => void;
}

const PROBLEMS = [
  {
    icon: "↻",
    title: "Infinite debugging loops",
    description:
      "The same error reappears. The agent tries the same fix three times in a row, burning tokens.",
  },
  {
    icon: "<>",
    title: "Frontend / backend disconnect",
    description:
      "Backend ships one shape, frontend expects another. Nothing breaks at compile time.",
  },
  {
    icon: "◇",
    title: "Requirement drift",
    description:
      "By step 40 the agent has quietly forgotten half of what you asked for in the original prompt.",
  },
  {
    icon: "⟳",
    title: "Repeated failed fixes",
    description:
      "No memory of what didn't work. The agent re-tries the same broken approach minutes later.",
  },
  {
    icon: "▭",
    title: "Context degradation",
    description:
      "As the conversation gets longer, the agent loses the thread. Decisions made on stale assumptions.",
  },
  {
    icon: "⊘",
    title: "Silent incorrect assumptions",
    description:
      "\"I assumed pagination wasn't needed.\" The agent never asked. You only find out in production.",
  },
];

const AGENTS = [
  {
    icon: "◎",
    name: "Planner",
    role: "Agent 1",
    description: "Turns vague prompts into structured plans. Organizes tasks until you accept.",
  },
  {
    icon: "</>",
    name: "Execution",
    role: "Agent 2",
    description: "Builds autonomously, task by task. Applies your updates and keeps shipping.",
  },
  {
    icon: "◉",
    name: "Reviewer",
    role: "Agent 3",
    description: "Catalogs connections, catches errors, and resolves failures with the Executor.",
  },
];

const CAPABILITIES = [
  {
    icon: "▣",
    title: "Structured planning",
    description: "The Planner organizes your goal into tasks you review and accept before any code runs.",
  },
  {
    icon: "⚡",
    title: "Autonomous execution",
    description: "The Executor runs tasks sequentially without pausing, applying human updates on the fly.",
  },
  {
    icon: "◎",
    title: "Proactive error resolution",
    description: "The Reviewer retries with the Executor when something fails, escalating only when needed.",
  },
  {
    icon: "↻",
    title: "Loop prevention",
    description: "Failed fixes are tracked so the same broken approach isn't retried endlessly.",
  },
  {
    icon: "◇",
    title: "Persistent memory",
    description: "Connections, errors, and knowledge are cataloged to .polaris/memory/ on your machine.",
  },
  {
    icon: "✦",
    title: "Human intervention",
    description: "Revise the plan or inform the Executor at any time during a build.",
  },
  {
    icon: "▤",
    title: "Mid-build plan updates",
    description: "Change direction without stopping — plan revisions queue and apply before the next task.",
  },
  {
    icon: "◈",
    title: "Continuous improvement",
    description: "When a project completes, chat with the Planner to plan changes and run again.",
  },
];

const PIPELINE = [
  { label: "Human", sub: "Prompt" },
  { label: "Planner", sub: "Plan" },
  { label: "Contract", sub: "Tasks" },
  { label: "Execution", sub: "Build" },
  { label: "Reviewer", sub: "Audit" },
  { label: "Aligned", sub: "Ship" },
];

export function LandingPage({ onTryApp }: LandingPageProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing">
      <div className="landing-stars" aria-hidden />

      <header className="landing-nav">
        <div className="landing-nav-brand">
          <span className="landing-star" aria-hidden>✦</span>
          <span>Polaris</span>
        </div>
        <nav className="landing-nav-links">
          <button type="button" onClick={() => scrollTo("problem")}>Problem</button>
          <button type="button" onClick={() => scrollTo("solution")}>Solution</button>
          <button type="button" onClick={() => scrollTo("capabilities")}>Capabilities</button>
          <button type="button" onClick={() => scrollTo("demo")}>Demo</button>
        </nav>
        <button type="button" className="landing-btn-primary landing-btn-sm" onClick={onTryApp}>
          Try the app →
        </button>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-star" aria-hidden>✦</div>
        <p className="landing-eyebrow">Open source · Local-first</p>
        <h1 className="landing-hero-title">The north star for AI coding agents</h1>
        <p className="landing-hero-sub">
          Three agents. One workflow. Polaris turns vague prompts into structured plans and keeps
          every line of code aligned with your original intent.
        </p>
        <div className="landing-hero-actions">
          <button type="button" className="landing-btn-primary" onClick={onTryApp}>
            Try the app →
          </button>
          <button type="button" className="landing-btn-ghost" onClick={() => scrollTo("solution")}>
            See how it works
          </button>
        </div>
        <p className="landing-trust">
          No account required · Anthropic Claude · Runs on your machine
        </p>

        <div className="landing-pipeline">
          {PIPELINE.map((step, i) => (
            <div key={step.label} className="landing-pipeline-step">
              <div className="landing-pipeline-node">
                <span className="landing-pipeline-icon">{i + 1}</span>
              </div>
              <span className="landing-pipeline-label">{step.label}</span>
              <span className="landing-pipeline-sub">{step.sub}</span>
              {i < PIPELINE.length - 1 && <span className="landing-pipeline-line" aria-hidden />}
            </div>
          ))}
        </div>
      </section>

      <section id="problem" className="landing-section">
        <p className="landing-section-eyebrow">The problem</p>
        <h2 className="landing-section-title">Coding agents fail in predictable ways</h2>
        <p className="landing-section-sub">
          Every team building with AI agents has hit the same wall. These six failure modes account
          for almost every &ldquo;why is this not working&rdquo; moment.
        </p>
        <div className="landing-grid landing-grid-3">
          {PROBLEMS.map((item) => (
            <div key={item.title} className="landing-card">
              <span className="landing-card-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="solution" className="landing-section">
        <p className="landing-section-eyebrow">The solution</p>
        <h2 className="landing-section-title">Three agents. One workflow.</h2>
        <p className="landing-section-sub">
          A planner, a builder, and a reviewer. Each with a single job — keeping your build aligned
          from first prompt to final ship.
        </p>
        <div className="landing-agents">
          {AGENTS.map((agent) => (
            <div key={agent.name} className="landing-agent-card">
              <span className="landing-agent-icon">{agent.icon}</span>
              <span className="landing-agent-role">{agent.role}</span>
              <h3>{agent.name}</h3>
              <p>{agent.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="landing-section">
        <p className="landing-section-eyebrow">Capabilities</p>
        <h2 className="landing-section-title">Everything you need to ship agent-built software</h2>
        <p className="landing-section-sub">
          Built for engineering teams that want autonomy without losing control.
        </p>
        <div className="landing-grid landing-grid-4">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className="landing-card landing-card-sm">
              <span className="landing-card-icon">{cap.icon}</span>
              <h3>{cap.title}</h3>
              <p>{cap.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="landing-cta">
        <div className="landing-cta-star" aria-hidden>✦</div>
        <h2>Chart your first build</h2>
        <p>Give Polaris a prompt. The Planner takes it from there.</p>
        <button type="button" className="landing-btn-primary" onClick={onTryApp}>
          Try the app →
        </button>
      </section>

      <footer className="landing-footer">
        <span className="landing-star" aria-hidden>✦</span>
        <span>Polaris — Planner · Execution · Reviewer</span>
      </footer>
    </div>
  );
}
