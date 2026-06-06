import { useEffect, useMemo, useState } from "react";
import { AgentLoadingIndicator } from "./components/AgentLoadingIndicator";
import { AgentThinkingStrip } from "./components/AgentThinkingStrip";
import { MessageContent } from "./components/MessageContent";
import { PlanTasks } from "./components/PlanTasks";
import { StreamingAgentMessage } from "./components/StreamingAgentMessage";
import { usePolaris } from "./hooks/usePolaris";
import { getThinkingAgents, isAgentThinking, type AgentName } from "./lib/thinkingAgents";
import type { WorkflowPhase } from "./types";

type Tab = "prompt" | "execution" | "memory";

const PHASE_LABELS: Record<WorkflowPhase, string> = {
  idle: "Idle",
  planning: "Planning",
  executing: "Executing",
  error_resolution: "Error Resolution",
  human_intervention: "Human Intervention",
  rate_limit_pause: "Rate Limited",
  completed: "Completed",
};

const AGENT_COLORS: Record<string, string> = {
  planner: "var(--planner)",
  executor: "var(--executor)",
  memory: "var(--memory)",
  human: "var(--human)",
  system: "var(--muted)",
};

function canUsePlannerInput(phase: WorkflowPhase, planAccepted: boolean): boolean {
  return (phase === "planning" || phase === "idle") && !planAccepted;
}

function canUseDiscourseInput(phase: WorkflowPhase, humanInterventionActive: boolean): boolean {
  return phase === "error_resolution" || humanInterventionActive;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("prompt");
  const [input, setInput] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [workspaceInput, setWorkspaceInput] = useState("");
  const [editingWorkspace, setEditingWorkspace] = useState(false);
  const {
    state,
    loading,
    streamText,
    activeAgent,
    workingAgent,
    agentBusy,
    apiKeyConfigured,
    workspacePath,
    workspaceWarning,
    workspaceError,
    configureApiKey,
    setWorkspace,
    sendPlannerMessage,
    revisePlan,
    sendExecutorUpdate,
    acceptPlan,
    enableIntervention,
    sendDiscourseInput,
    retryAfterRateLimit,
  } = usePolaris();

  const { workflow, memory } = state;
  const plan = memory.plan;
  const planAccepted = plan?.accepted ?? false;
  const plannerInputEnabled = canUsePlannerInput(workflow.phase, planAccepted);
  const discourseInputEnabled = canUseDiscourseInput(
    workflow.phase,
    workflow.humanInterventionActive,
  );
  const rateLimitInputEnabled = workflow.phase === "rate_limit_pause";
  const executingInterventionEnabled =
    workflow.phase === "executing" && !discourseInputEnabled && !rateLimitInputEnabled;
  const completedPlannerEnabled = workflow.phase === "completed";
  const inputEnabled =
    rateLimitInputEnabled ||
    executingInterventionEnabled ||
    completedPlannerEnabled ||
    (discourseInputEnabled && !agentBusy) ||
    (plannerInputEnabled && !agentBusy);

  useEffect(() => {
    if (!editingWorkspace && workspacePath) {
      setWorkspaceInput(workspacePath);
    }
  }, [workspacePath, editingWorkspace]);

  useEffect(() => {
    if (workflow.phase === "rate_limit_pause") {
      setTab(workflow.rateLimitPausedAgent === "planner" ? "prompt" : "execution");
    } else if (workflow.phase === "error_resolution" || workflow.humanInterventionActive) {
      setTab("execution");
    } else if (workflow.phase === "completed") {
      setTab("prompt");
    }
  }, [workflow.phase, workflow.humanInterventionActive, workflow.rateLimitPausedAgent]);

  const handleSubmit = async () => {
    if (!inputEnabled) return;
    const msg = input.trim();
    setInput("");

    if (rateLimitInputEnabled) {
      await retryAfterRateLimit(msg || undefined);
    } else if (!msg) {
      return;
    } else if (discourseInputEnabled) {
      await sendDiscourseInput(msg);
    } else if (executingInterventionEnabled) {
      if (tab === "execution") {
        await sendExecutorUpdate(msg);
      } else {
        await revisePlan(msg);
      }
    } else {
      await sendPlannerMessage(msg);
    }
  };

  const inputPlaceholder = rateLimitInputEnabled
    ? "Optional note, then press Retry when the rate limit has cleared…"
    : discourseInputEnabled
      ? workflow.humanInterventionActive
        ? "Guide the Executor and Memory Agent…"
        : "Join the error discussion — guide the Executor and Memory Agent…"
      : executingInterventionEnabled
        ? tab === "execution"
          ? "Inform the Executor of new context or requirements…"
          : "Update the plan — tell the Planner what to change…"
        : completedPlannerEnabled
            ? "Plan changes or improvements with the Planner…"
            : plannerInputEnabled
              ? "Describe your project goal…"
              : "Input not available in this phase";

  const thinkingAgents = useMemo(
    () =>
      getThinkingAgents({
        agentBusy,
        workingAgent,
        activeAgent,
        memoryCaptureActive: workflow.memoryCaptureActive,
        memoryAgentActive: workflow.memoryAgentActive,
      }),
    [
      agentBusy,
      workingAgent,
      activeAgent,
      workflow.memoryCaptureActive,
      workflow.memoryAgentActive,
    ],
  );

  const renderAgentActivity = (agent: AgentName) => {
    if (!isAgentThinking(agent, thinkingAgents)) return null;

    const streaming = activeAgent === agent && streamText.length > 0;
    if (streaming) {
      return <StreamingAgentMessage agent={agent} content={streamText} />;
    }

    return <AgentLoadingIndicator agent={agent} />;
  };

  if (apiKeyConfigured === false) {
    return (
      <div className="setup">
        <div className="setup-card">
          <h1>Polaris</h1>
          <p>Enter your Anthropic API key to start the three Claude agents.</p>
          <p className="setup-hint">
            Get a key at{" "}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>
          </p>
          <label className="setup-label">Anthropic API Key</label>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
          />
          <label className="setup-label">Project folder (agents work here)</label>
          <input
            type="text"
            placeholder="/Users/you/projects/my-app"
            value={workspaceInput}
            onChange={(e) => setWorkspaceInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              apiKeyInput.trim() &&
              configureApiKey(apiKeyInput.trim(), workspaceInput || workspacePath)
            }
          />
          {workspaceError && <p className="setup-error">{workspaceError}</p>}
          <button
            onClick={() =>
              configureApiKey(apiKeyInput.trim(), workspaceInput || workspacePath)
            }
            disabled={loading || !apiKeyInput.trim()}
          >
            {loading ? "Saving..." : "Start Agents"}
          </button>
          <p className="setup-agents">Planner · Executor · Memory</p>
        </div>
      </div>
    );
  }

  if (apiKeyConfigured === null) {
    return <div className="setup"><div className="setup-card"><p>Loading...</p></div></div>;
  }

  const isDiscoursePhase =
    workflow.phase === "error_resolution" || workflow.humanInterventionActive;

  const plannerMessages = workflow.messages.filter(
    (m) =>
      m.agent === "planner" ||
      (m.agent === "human" && !isDiscoursePhase),
  );

  const executionMessages = workflow.messages.filter(
    (m) =>
      m.agent === "executor" ||
      m.agent === "memory" ||
      m.role === "system" ||
      (m.agent === "human" &&
        (isDiscoursePhase || workflow.phase === "executing")),
  );

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">✦</span>
          <h1>Polaris</h1>
        </div>
        <div className="workspace-bar">
          {editingWorkspace ? (
            <form
              className="workspace-edit"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await setWorkspace(workspaceInput);
                  setEditingWorkspace(false);
                } catch {
                  /* error shown via workspaceError */
                }
              }}
            >
              <input
                type="text"
                value={workspaceInput}
                onChange={(e) => setWorkspaceInput(e.target.value)}
                placeholder="Absolute path to project folder"
                autoFocus
              />
              <button type="submit" disabled={loading || !workspaceInput.trim()}>
                Set
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditingWorkspace(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="workspace-display"
              onClick={() => {
                setWorkspaceInput(workspacePath);
                setEditingWorkspace(true);
              }}
              title="Click to change workspace"
            >
              <span className="workspace-label">Workspace</span>
              <code>{workspacePath || "Not set"}</code>
            </button>
          )}
          {workspaceError && editingWorkspace && (
            <span className="workspace-inline-error">{workspaceError}</span>
          )}
        </div>
        {workspaceWarning && !editingWorkspace && (
          <div className="workspace-warning" title={workspaceWarning}>
            {workspaceWarning}
          </div>
        )}
        <div className="phase-badge" data-phase={workflow.phase}>
          {PHASE_LABELS[workflow.phase]}
        </div>
        {workflow.memoryAgentActive && !agentBusy && (
          <div className="agent-indicator memory-active">
            Memory Agent — Error Resolution
            {workflow.errorResolutionAttempts > 0 &&
              ` (attempt ${workflow.errorResolutionAttempts})`}
          </div>
        )}
        {workflow.memoryCaptureActive && (
          <div className="agent-indicator memory-capture">Memory Agent — Cataloging</div>
        )}
        {workflow.humanInterventionActive && (
          <div className="agent-indicator human-active">Human Intervention</div>
        )}
        {workflow.phase === "rate_limit_pause" && workflow.rateLimitPausedAgent && (
          <div className="agent-indicator rate-limit-active">
            Paused — {workflow.rateLimitPausedAgent} hit rate limit
          </div>
        )}
      </header>

      <nav className="tabs">
        <button
          className={tab === "prompt" ? "active" : ""}
          onClick={() => setTab("prompt")}
        >
          Prompt
        </button>
        <button
          className={tab === "execution" ? "active" : ""}
          onClick={() => setTab("execution")}
        >
          Execution
        </button>
        <button
          className={tab === "memory" ? "active" : ""}
          onClick={() => setTab("memory")}
        >
          Memory
        </button>
      </nav>

      <AgentThinkingStrip thinkingAgents={thinkingAgents} />

      <main className="content">
        {tab === "prompt" && (
          <section className="panel">
            <div className="panel-header">
              <h2>Plan with the Planner Agent</h2>
              <p>
                {workflow.phase === "completed"
                  ? "Project complete. Chat with the Planner to plan changes or improvements, then accept the new plan to execute again."
                  : "State your goal. The Planner organizes tasks and discusses the plan until you accept it."}
              </p>
            </div>

            <div className="messages">
              {plannerMessages.map((msg) => (
                <div key={msg.id} className="message" data-agent={msg.agent}>
                  <span className="message-agent" style={{ color: AGENT_COLORS[msg.agent] }}>
                    {msg.agent}
                  </span>
                  <MessageContent
                    content={msg.content}
                    markdown={msg.agent !== "human"}
                  />
                </div>
              ))}
              {renderAgentActivity("planner")}
              {renderAgentActivity("executor")}
              {renderAgentActivity("memory")}
            </div>

            {workflow.phase === "rate_limit_pause" && workflow.rateLimitMessage && (
              <div className="rate-limit-banner">
                <MessageContent content={workflow.rateLimitMessage} markdown />
              </div>
            )}

            {plan && !plan.accepted && (
              <PlanTasks
                tasks={plan.tasks}
                onAccept={acceptPlan}
                acceptDisabled={agentBusy}
              />
            )}

            {plan?.accepted && workflow.phase === "executing" && (
              <div className="plan-accepted">
                Plan accepted. Use the input bar on this tab to revise the plan with the Planner at
                any time.
              </div>
            )}

            {workflow.phase === "completed" && plan?.accepted && (
              <div className="plan-accepted completed-banner">
                All tasks finished. Describe what you would like to change or improve next.
              </div>
            )}
          </section>
        )}

        {tab === "execution" && (
          <section className="panel">
            <div className="panel-header">
              <h2>Executor Agent</h2>
              <p>
                Tasks run sequentially without pausing. Use the input bar on this tab to inform the
                Executor at any time. On errors, the Memory Agent retries automatically.
              </p>
            </div>

            {plan && (
              <div className="task-list">
                {plan.tasks.map((task) => (
                  <div key={task.id} className="task" data-status={task.status}>
                    <span className="task-status">{task.status}</span>
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="messages">
              {executionMessages.map((msg) => (
                <div key={msg.id} className="message" data-agent={msg.agent}>
                  <span className="message-agent" style={{ color: AGENT_COLORS[msg.agent] }}>
                    {msg.agent}
                  </span>
                  <MessageContent content={msg.content} />
                </div>
              ))}
              {renderAgentActivity("executor")}
              {renderAgentActivity("memory")}
            </div>

            {workflow.phase === "rate_limit_pause" && workflow.rateLimitMessage && (
              <div className="rate-limit-banner">
                <MessageContent content={workflow.rateLimitMessage} markdown />
              </div>
            )}

            {workflow.phase === "error_resolution" && !workflow.humanInterventionActive && (
              <div className="error-banner">
                <p>
                  Memory Agent is resolving an error with the Executor
                  {workflow.errorResolutionAttempts > 0 &&
                    ` (attempt ${workflow.errorResolutionAttempts})`}
                  . Use the input below to join the discussion.
                </p>
                <button className="btn-secondary" onClick={enableIntervention}>
                  Take Over (Deactivate Memory Agent)
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "memory" && (
          <section className="panel">
            <div className="panel-header">
              <h2>Memory Agent Storage</h2>
              <p>
                Persisted to <code>.polaris/memory/</code> on your machine.
              </p>
            </div>

            <div className="memory-agent-activity">
              {renderAgentActivity("planner")}
              {renderAgentActivity("executor")}
              {renderAgentActivity("memory")}
            </div>

            {plan && (
              <div className="memory-section">
                <h3>Plan</h3>
                <p className="memory-goal">{plan.goal}</p>
                {plan.revisions.length > 0 && (
                  <div className="revisions">
                    <h4>Revisions</h4>
                    {plan.revisions.map((rev) => (
                      <div key={rev.id} className="revision">
                        <span className="revision-meta">
                          {rev.source} · {new Date(rev.timestamp).toLocaleString()}
                        </span>
                        <p>{rev.content.slice(0, 200)}...</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="memory-section">
              <h3>Connections ({memory.connections.length})</h3>
              {memory.connections.length === 0 ? (
                <p className="empty">No connections discovered yet.</p>
              ) : (
                <div className="connection-grid">
                  {memory.connections.map((conn) => (
                    <div key={conn.id} className="connection-card">
                      <span className="conn-type">{conn.type}</span>
                      <div className="conn-path">
                        <code>{conn.source}</code>
                        <span>→</span>
                        <code>{conn.target}</code>
                      </div>
                      <p>{conn.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="memory-section">
              <h3>Errors ({memory.errors.length})</h3>
              {memory.errors.length === 0 ? (
                <p className="empty">No errors recorded.</p>
              ) : (
                memory.errors.map((err) => (
                  <div key={err.id} className="error-card" data-resolved={err.resolved}>
                    <div className="error-header">
                      <span>{err.resolved ? "Resolved" : "Unresolved"}</span>
                      <span>{err.occurrences}x</span>
                    </div>
                    <p>{err.message}</p>
                    {err.resolution && (
                      <p className="resolution">Resolution: {err.resolution}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="memory-section">
              <h3>Knowledge ({memory.knowledge.length})</h3>
              {memory.knowledge.length === 0 ? (
                <p className="empty">No knowledge entries yet.</p>
              ) : (
                memory.knowledge.map((k) => (
                  <div key={k.id} className="knowledge-card">
                    <span className="knowledge-cat">{k.category}</span>
                    <strong>{k.title}</strong>
                    <p>{k.content}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="input-bar">
        {!inputEnabled && thinkingAgents.length > 0 && (
          <div className="input-bar-thinking">
            {thinkingAgents.map((agent) => (
              <AgentLoadingIndicator key={agent} agent={agent} compact />
            ))}
          </div>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={inputPlaceholder}
          disabled={!inputEnabled}
        />
        <button
          onClick={handleSubmit}
          disabled={!inputEnabled || (!rateLimitInputEnabled && !input.trim())}
        >
          {rateLimitInputEnabled ? "Retry" : "Send"}
        </button>
      </footer>
    </div>
  );
}
