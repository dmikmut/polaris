interface SetupPageProps {
  apiKeyInput: string;
  workspaceInput: string;
  workspacePath: string;
  workspaceError: string | null;
  loading: boolean;
  onApiKeyChange: (value: string) => void;
  onWorkspaceChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function SetupPage({
  apiKeyInput,
  workspaceInput,
  workspacePath,
  workspaceError,
  loading,
  onApiKeyChange,
  onWorkspaceChange,
  onSubmit,
  onBack,
}: SetupPageProps) {
  const canSubmit = apiKeyInput.trim().length > 0 && !loading;

  return (
    <div className="setup-page">
      <div className="landing-stars" aria-hidden />

      <header className="setup-page-nav">
        <button type="button" className="landing-btn-ghost setup-back" onClick={onBack}>
          ← Back
        </button>
        <div className="landing-nav-brand">
          <span className="landing-star" aria-hidden>✦</span>
          <span>Polaris</span>
        </div>
      </header>

      <div className="setup-page-content">
        <div className="setup-page-star" aria-hidden>✦</div>
        <h1>Chart your first build</h1>
        <p className="setup-page-sub">
          Enter your project folder and Anthropic API key. All three agents run locally on your machine.
        </p>

        <form
          className="setup-page-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }}
        >
          <label className="setup-label">Project folder</label>
          <input
            type="text"
            placeholder="/Users/you/projects/my-app"
            value={workspaceInput}
            onChange={(e) => onWorkspaceChange(e.target.value)}
            autoFocus
          />
          <p className="setup-hint">Absolute path to the directory where agents will read and write code.</p>

          <label className="setup-label">Anthropic API key</label>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKeyInput}
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
          <p className="setup-hint">
            Get a key at{" "}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>
          </p>

          {workspaceError && <p className="setup-error">{workspaceError}</p>}

          <button type="submit" className="landing-btn-primary setup-submit" disabled={!canSubmit}>
            {loading ? "Starting agents…" : "Start agents →"}
          </button>
        </form>

        <p className="setup-agents">Planner · Execution · Reviewer</p>
        {workspacePath && !workspaceInput && (
          <p className="setup-hint">Previous workspace: {workspacePath}</p>
        )}
      </div>
    </div>
  );
}
