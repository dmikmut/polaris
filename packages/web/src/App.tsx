import { useEffect, useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { SetupPage } from "./components/SetupPage";
import { WorkspaceApp } from "./components/WorkspaceApp";
import { usePolaris } from "./hooks/usePolaris";

type AppView = "home" | "setup" | "workspace";

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [workspaceInput, setWorkspaceInput] = useState("");
  const {
    loading,
    apiKeyConfigured,
    workspacePath,
    workspaceError,
    configureApiKey,
  } = usePolaris();

  useEffect(() => {
    if (apiKeyConfigured === null) return;
    if (apiKeyConfigured) {
      setView("workspace");
    }
  }, [apiKeyConfigured]);

  useEffect(() => {
    if (workspacePath && !workspaceInput) {
      setWorkspaceInput(workspacePath);
    }
  }, [workspacePath, workspaceInput]);

  const handleStart = async () => {
    try {
      await configureApiKey(apiKeyInput.trim(), workspaceInput || workspacePath);
      setView("workspace");
    } catch {
      /* error shown via workspaceError */
    }
  };

  if (apiKeyConfigured === null) {
    return (
      <div className="setup-page">
        <div className="setup-page-content">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (view === "workspace" && apiKeyConfigured) {
    return <WorkspaceApp />;
  }

  if (view === "setup") {
    return (
      <SetupPage
        apiKeyInput={apiKeyInput}
        workspaceInput={workspaceInput}
        workspacePath={workspacePath}
        workspaceError={workspaceError}
        loading={loading}
        onApiKeyChange={setApiKeyInput}
        onWorkspaceChange={setWorkspaceInput}
        onSubmit={handleStart}
        onBack={() => setView("home")}
      />
    );
  }

  return <LandingPage onTryApp={() => setView("setup")} />;
}
