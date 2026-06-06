import { useCallback, useEffect, useRef, useState } from "react";
import { parseJsonResponse } from "../lib/api";
import type { AppState, ChatMessage } from "../types";

const initialState: AppState = {
  workflow: {
    projectId: "",
    phase: "idle",
    cwd: "",
    messages: [],
    currentTaskId: null,
    errorResolutionStartedAt: null,
    errorResolutionAttempts: 0,
    humanInterventionActive: false,
    memoryAgentActive: false,
    memoryCaptureActive: false,
    rateLimitMessage: null,
    rateLimitPausedAgent: null,
    rateLimitResume: null,
    pendingExecutorNotes: [],
    pendingPlanRevisions: [],
  },
  memory: {
    projectId: "",
    plan: null,
    connections: [],
    errors: [],
    knowledge: [],
    updatedAt: "",
  },
  workspacePath: "",
};

export function usePolaris() {
  const [state, setState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [workingAgent, setWorkingAgent] = useState<string | null>(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);
  const [workspacePath, setWorkspacePath] = useState("");
  const [workspaceWarning, setWorkspaceWarning] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const applyWorkspaceInfo = useCallback(
    (data: { path: string; warning?: string | null }) => {
      setWorkspacePath(data.path);
      setWorkspaceWarning(data.warning ?? null);
    },
    [],
  );

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) {
        const data = await parseJsonResponse<{ path: string; warning?: string | null }>(res);
        applyWorkspaceInfo(data);
        return data.path;
      }
    } catch {
      /* workspace endpoint may be unavailable on stale server */
    }
    return "";
  }, [applyWorkspaceInfo]);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/auth/status");
    if (res.ok) {
      const data = await res.json();
      setApiKeyConfigured(data.configured);
      return data.configured as boolean;
    }
    return false;
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/state");
    if (res.ok) {
      const data = await parseJsonResponse<AppState & { workspacePath?: string }>(res);
      setState(data);
      if (data.workspacePath) setWorkspacePath(data.workspacePath);
    }
  }, []);

  useEffect(() => {
    fetchWorkspace();
    checkAuth().then((configured) => {
      if (configured) refresh();
    });

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "message") {
        const msg = data.payload as ChatMessage;
        setState((prev) => ({
          ...prev,
          workflow: {
            ...prev.workflow,
            messages: [...prev.workflow.messages, msg],
          },
        }));
        setStreamText("");
        setActiveAgent(null);
      } else if (data.type === "agent_working") {
        const { agent, working } = data.payload as { agent: string; working: boolean };
        setWorkingAgent(working ? agent : null);
        if (working) {
          setActiveAgent(agent);
          setLoading(true);
        } else {
          setLoading(false);
          setStreamText("");
          setActiveAgent(null);
        }
      } else if (data.type === "phase_change") {
        setState((prev) => ({
          ...prev,
          workflow: { ...prev.workflow, phase: data.payload.phase },
        }));
      } else if (data.type === "memory_update") {
        setState((prev) => ({ ...prev, memory: data.payload }));
      } else if (data.type === "stream_chunk") {
        setActiveAgent(data.payload.agent);
        setWorkingAgent(data.payload.agent);
        setLoading(true);
        setStreamText((prev) => prev + data.payload.chunk);
      } else if (data.type === "agent_status") {
        setState((prev) => ({
          ...prev,
          workflow: { ...prev.workflow, ...data.payload },
        }));
      } else if (data.type === "task_update") {
        refresh();
      }
    };

    return () => ws.close();
  }, [checkAuth, fetchWorkspace, refresh]);

  const apiPost = async (url: string, body?: object) => {
    setStreamText("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await parseJsonResponse<AppState & { error?: string; workspacePath?: string }>(
        res,
      );
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setState(data);
      if (data.workspacePath) setWorkspacePath(data.workspacePath);
    } catch (err) {
      setLoading(false);
      setWorkingAgent(null);
      setStreamText("");
      setActiveAgent(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const configureApiKey = async (apiKey: string, path?: string) => {
    setLoading(true);
    setWorkspaceError(null);
    try {
      const res = await fetch("/api/auth/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, workspacePath: path?.trim() || undefined }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        workspacePath?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "Failed to save API key");
      setApiKeyConfigured(true);
      if (data.workspacePath) setWorkspacePath(data.workspacePath);
      await refresh();
    } catch (err) {
      setWorkspaceError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setWorkspace = async (path: string) => {
    setLoading(true);
    setWorkspaceError(null);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: path.trim() }),
      });
      const data = await parseJsonResponse<{
        path: string;
        warning?: string | null;
        error?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "Failed to set workspace");
      applyWorkspaceInfo(data);
      setState(initialState);
      await refresh();
    } catch (err) {
      setWorkspaceError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    state,
    loading,
    streamText,
    activeAgent,
    apiKeyConfigured,
    workspacePath,
    workspaceWarning,
    workspaceError,
    configureApiKey,
    setWorkspace,
    workingAgent,
    agentBusy: workingAgent !== null || loading,
    sendPlannerMessage: (message: string) =>
      apiPost("/api/planner/message", { message }),
    revisePlan: (revision: string) => apiPost("/api/plan/revise", { revision }),
    sendExecutorUpdate: (message: string) =>
      apiPost("/api/executor/message", { message }),
    acceptPlan: () => apiPost("/api/plan/accept"),
    enableIntervention: () => apiPost("/api/human/intervene"),
    sendDiscourseInput: (guidance: string) => apiPost("/api/human/guidance", { guidance }),
    retryAfterRateLimit: (message?: string) =>
      apiPost("/api/rate-limit/retry", message ? { message } : {}),
    refresh,
  };
}
