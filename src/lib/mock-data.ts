// Realistic mock data for the multi-agent platform.
// Three agents: Architect (planning), Builder (coding), Overseer (auditing).

export type AgentStatus = "running" | "waiting" | "complete" | "error" | "healthy" | "warning" | "critical" | "working";

export type Project = {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "complete" | "review";
  progress: number;
  contractVersion: string;
  language: string;
  framework: string;
  updatedAt: string;
  errorsPrevented: number;
  loopsPrevented: number;
  confidence: number;
};

export const projects: Project[] = [
  {
    id: "proj_01",
    name: "Atlas Todo API",
    description: "Authenticated todo backend with JWT and pagination",
    status: "active",
    progress: 72,
    contractVersion: "v1.0",
    language: "TypeScript",
    framework: "Next.js",
    updatedAt: "2026-06-06T08:24:00Z",
    errorsPrevented: 14,
    loopsPrevented: 3,
    confidence: 87,
  },
  {
    id: "proj_02",
    name: "Helix Billing",
    description: "Stripe-based subscription billing dashboard",
    status: "review",
    progress: 94,
    contractVersion: "v2.3",
    language: "TypeScript",
    framework: "React",
    updatedAt: "2026-06-06T07:11:00Z",
    errorsPrevented: 32,
    loopsPrevented: 8,
    confidence: 92,
  },
  {
    id: "proj_03",
    name: "Nimbus Auth Service",
    description: "OAuth + magic-link microservice with rate limiting",
    status: "active",
    progress: 41,
    contractVersion: "v1.2",
    language: "Go",
    framework: "Fiber",
    updatedAt: "2026-06-06T08:42:00Z",
    errorsPrevented: 6,
    loopsPrevented: 2,
    confidence: 78,
  },
  {
    id: "proj_04",
    name: "Pulse Analytics",
    description: "Event ingestion + cohort analytics",
    status: "paused",
    progress: 33,
    contractVersion: "v0.4",
    language: "Python",
    framework: "FastAPI",
    updatedAt: "2026-06-05T19:02:00Z",
    errorsPrevented: 9,
    loopsPrevented: 1,
    confidence: 64,
  },
  {
    id: "proj_05",
    name: "Lumen Doc Search",
    description: "Vector search over engineering docs",
    status: "complete",
    progress: 100,
    contractVersion: "v3.0",
    language: "TypeScript",
    framework: "Next.js",
    updatedAt: "2026-06-04T22:14:00Z",
    errorsPrevented: 41,
    loopsPrevented: 12,
    confidence: 96,
  },
];

export const dashboardMetrics = {
  activeProjects: 4,
  activeAgents: 12,
  loopsPrevented: 28,
  contractViolations: 17,
  humanEscalations: 3,
  tasksCompleted: 1483,
  tokenSavings: 0.42,
};

export const buildVolumeSeries = [
  { day: "Mon", builds: 124, errors: 8, loops: 3 },
  { day: "Tue", builds: 156, errors: 12, loops: 5 },
  { day: "Wed", builds: 142, errors: 7, loops: 4 },
  { day: "Thu", builds: 198, errors: 14, loops: 6 },
  { day: "Fri", builds: 211, errors: 9, loops: 4 },
  { day: "Sat", builds: 89, errors: 4, loops: 2 },
  { day: "Sun", builds: 167, errors: 11, loops: 5 },
];

export const confidenceSeries = [
  { step: 1, confidence: 92 },
  { step: 2, confidence: 88 },
  { step: 3, confidence: 91 },
  { step: 4, confidence: 79 },
  { step: 5, confidence: 84 },
  { step: 6, confidence: 88 },
  { step: 7, confidence: 91 },
  { step: 8, confidence: 67 },
  { step: 9, confidence: 73 },
  { step: 10, confidence: 86 },
  { step: 11, confidence: 89 },
  { step: 12, confidence: 87 },
];

export const violationBreakdown = [
  { name: "Response Shape", value: 38, color: "#3b82f6" },
  { name: "Missing Field", value: 24, color: "#a855f7" },
  { name: "Auth Drift", value: 16, color: "#22c55e" },
  { name: "Endpoint Path", value: 12, color: "#f59e0b" },
  { name: "Other", value: 10, color: "#ef4444" },
];

export const tokenSavingsSeries = [
  { week: "W1", saved: 12 },
  { week: "W2", saved: 19 },
  { week: "W3", saved: 28 },
  { week: "W4", saved: 34 },
  { week: "W5", saved: 38 },
  { week: "W6", saved: 42 },
];

// --- Contract ---

export const currentContract = {
  version: "v1.0",
  locked: true,
  lockedAt: "2026-06-06T07:48:21Z",
  lockedBy: "dharmik@polaris.dev",
  goal: "Build a Todo App with authenticated multi-user persistence and 24h token expiry.",
  apiEndpoints: [
    { method: "POST", path: "/auth/login", returns: "{ token, user }" },
    { method: "POST", path: "/auth/register", returns: "{ token, user }" },
    { method: "GET", path: "/api/todos", returns: "{ todos: [] }" },
    { method: "POST", path: "/api/todos", returns: "{ todo }" },
    { method: "PATCH", path: "/api/todos/:id", returns: "{ todo }" },
    { method: "DELETE", path: "/api/todos/:id", returns: "{ ok: true }" },
  ],
  frontend: [
    "auth_token stored in localStorage under key `atlas.token`",
    "User shape: { id: string, email: string }",
    "Empty state shown when todos.length === 0",
    "Optimistic UI on create / toggle",
  ],
  backend: [
    "JWT with 24h expiry, HS256",
    "Bcrypt password hashing (cost 12)",
    "All /api/todos routes require Bearer token",
    "Rate limit: 60 req/min per IP",
  ],
  database: [
    "users(id, email UNIQUE, password_hash, created_at)",
    "todos(id, user_id FK, title, completed, created_at, updated_at)",
    "Cascade delete todos when user deleted",
  ],
  definitionOfDone: [
    "Login persists across reloads",
    "Todos persist per user",
    "Token auto-expires after 24h",
    "All endpoints respond < 200ms p95",
  ],
  versionHistory: [
    { version: "v1.0", at: "2026-06-06T07:48:21Z", by: "dharmik@polaris.dev", note: "Locked initial contract after Architect clarification round" },
    { version: "v0.3", at: "2026-06-06T07:42:08Z", by: "Architect", note: "Added rate limit + token expiry" },
    { version: "v0.2", at: "2026-06-06T07:36:51Z", by: "Architect", note: "Defined user shape + storage key" },
    { version: "v0.1", at: "2026-06-06T07:31:02Z", by: "Architect", note: "Parsed initial prompt" },
  ],
};

// --- Agents (live state) ---

export const architectState = {
  status: "complete" as AgentStatus,
  promptAnalysis: "User wants a Todo App. Resolved 6 ambiguities across auth, persistence, pagination, error handling, rate limiting, and DoD criteria.",
  clarifyingQuestions: [
    { q: "Should todos persist per user or globally?", a: "Per user", resolved: true },
    { q: "What auth method — JWT, session, magic link?", a: "JWT with 24h expiry", resolved: true },
    { q: "Pagination — page-based or cursor?", a: "Skipped (small N), revisit at >1000 todos", resolved: true },
    { q: "Token storage — localStorage or httpOnly cookie?", a: "localStorage (key: atlas.token)", resolved: true },
    { q: "Should deleting a user cascade to their todos?", a: "Yes", resolved: true },
    { q: "Need rate limiting?", a: "60 req/min per IP", resolved: true },
  ],
  ambiguities: 6,
  assumptionsResolved: 6,
  contractStatus: "Locked v1.0",
};

export const builderState = {
  status: "working" as AgentStatus,
  currentTask: "Implement GET /api/todos handler",
  currentStep: 12,
  totalSteps: 24,
  progress: 50,
  filesModified: [
    { path: "src/app/api/todos/route.ts", changes: "+47 / -2" },
    { path: "src/lib/auth/jwt.ts", changes: "+62 / -0" },
    { path: "src/lib/db/todos.ts", changes: "+38 / -1" },
    { path: "src/middleware.ts", changes: "+14 / -0" },
  ],
  confidence: 87,
  concern: "Pagination requirements not specified — assuming unbounded for now per contract.",
  errorAttempts: 0,
  recentActions: [
    { ts: "08:42:18", action: "Wrote src/app/api/todos/route.ts" },
    { ts: "08:41:02", action: "Added bearer token validation to middleware" },
    { ts: "08:39:44", action: "Created src/lib/db/todos.ts with prisma client" },
    { ts: "08:38:12", action: "Step 11 complete: POST /auth/login (confidence 91%)" },
    { ts: "08:36:01", action: "Step 10 complete: JWT signing util (confidence 94%)" },
  ],
};

export const overseerState = {
  status: "warning" as AgentStatus,
  currentAudit: "Reviewing Builder step 12 — GET /api/todos response shape",
  contractViolations: [
    {
      id: "v_017",
      step: 12,
      severity: "high" as const,
      expected: "{ todos: [] }",
      actual: "{ data: { todos: [] } }",
      type: "Response Shape",
      rootCause: "Builder wrapped response in `data` envelope during step 12, diverging from contract.",
      recommendedFix: "Return `{ todos }` directly — remove the `data` wrapper.",
      confidence: 96,
    },
  ],
  lastCoherenceCheck: "Step 10 — passed",
  nextCoherenceCheck: "Step 15",
  activeWarnings: 1,
  suggestedFix: "Remove `data` wrapper from GET /api/todos response (src/app/api/todos/route.ts:24)",
  escalation: { active: false, reason: null as string | null },
};

// --- Build log (chronological) ---

export type LogEntryType =
  | "human"
  | "architect"
  | "contract"
  | "builder"
  | "confidence"
  | "overseer"
  | "error"
  | "correction"
  | "escalation";

export type LogEntry = {
  id: string;
  ts: string;
  type: LogEntryType;
  title: string;
  body: string;
  meta?: Record<string, string | number>;
};

export const buildLog: LogEntry[] = [
  {
    id: "l_001",
    ts: "07:31:02",
    type: "human",
    title: "Initial prompt received",
    body: '"Build me a Todo App with login that saves my todos."',
  },
  {
    id: "l_002",
    ts: "07:31:14",
    type: "architect",
    title: "Architect started prompt analysis",
    body: "Detected 6 ambiguities: auth method, persistence model, token storage, rate limiting, pagination, DoD criteria.",
  },
  {
    id: "l_003",
    ts: "07:33:40",
    type: "architect",
    title: "Clarifying question",
    body: "What auth method should we use — JWT, session cookie, or magic link?",
  },
  {
    id: "l_004",
    ts: "07:34:12",
    type: "human",
    title: "Answered",
    body: "JWT, 24 hour expiry.",
  },
  {
    id: "l_005",
    ts: "07:48:21",
    type: "contract",
    title: "Contract v1.0 locked",
    body: "All ambiguities resolved. Contract is the source of truth — only the human can amend.",
    meta: { version: "v1.0" },
  },
  {
    id: "l_006",
    ts: "08:01:33",
    type: "builder",
    title: "Step 1 started — initialize Next.js project",
    body: "Builder began implementation against contract v1.0.",
  },
  {
    id: "l_007",
    ts: "08:03:55",
    type: "confidence",
    title: "Step 1 complete",
    body: "Project scaffolding done.",
    meta: { confidence: 96 },
  },
  {
    id: "l_008",
    ts: "08:16:42",
    type: "overseer",
    title: "Coherence check passed",
    body: "Step 5 audit — DB schema matches contract. No drift.",
  },
  {
    id: "l_009",
    ts: "08:38:12",
    type: "confidence",
    title: "Step 11 complete — POST /auth/login",
    body: "Token returned with 24h expiry as specified.",
    meta: { confidence: 91 },
  },
  {
    id: "l_010",
    ts: "08:42:18",
    type: "builder",
    title: "Step 12 — GET /api/todos handler written",
    body: "Builder implemented response as { data: { todos: [] } }.",
    meta: { confidence: 87 },
  },
  {
    id: "l_011",
    ts: "08:42:31",
    type: "error",
    title: "Contract violation detected",
    body: "Overseer flagged response shape mismatch on GET /api/todos. Expected { todos: [] }, got { data: { todos: [] } }.",
    meta: { severity: "high", step: 12 },
  },
  {
    id: "l_012",
    ts: "08:42:44",
    type: "overseer",
    title: "Root cause analysis",
    body: "Builder wrapped response in `data` envelope — likely transfer pattern from previous step. Recommend removing wrapper.",
  },
];

// --- Architecture graph ---

export type GraphNode = {
  id: string;
  label: string;
  kind: "human" | "agent" | "artifact" | "system";
  status: "healthy" | "warning" | "violation" | "escalation";
  x: number;
  y: number;
  detail: string;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  status: "healthy" | "warning" | "violation" | "escalation";
  label?: string;
};

export const graphNodes: GraphNode[] = [
  { id: "human", label: "Human", kind: "human", status: "healthy", x: 50, y: 80, detail: "dharmik@polaris.dev — prompt origin and contract owner." },
  { id: "architect", label: "Architect", kind: "agent", status: "healthy", x: 220, y: 80, detail: "Resolved 6 ambiguities. Generated contract v1.0." },
  { id: "contract", label: "Contract v1.0", kind: "artifact", status: "healthy", x: 220, y: 220, detail: "Locked source of truth. Only human can amend." },
  { id: "builder", label: "Builder", kind: "agent", status: "warning", x: 420, y: 140, detail: "Step 12 of 24. Confidence 87%. Active concern: pagination unspecified." },
  { id: "overseer", label: "Overseer", kind: "agent", status: "warning", x: 420, y: 300, detail: "1 active violation on step 12. Suggested fix ready." },
  { id: "frontend", label: "Frontend", kind: "system", status: "healthy", x: 620, y: 60, detail: "Next.js 16 — login page rendered, todo list pending API contract fix." },
  { id: "backend", label: "Backend", kind: "system", status: "violation", x: 620, y: 200, detail: "GET /api/todos returns wrong shape — contract violation v_017." },
  { id: "database", label: "Database", kind: "system", status: "healthy", x: 620, y: 340, detail: "Postgres — users + todos tables match contract schema." },
];

export const graphEdges: GraphEdge[] = [
  { id: "e1", from: "human", to: "architect", status: "healthy", label: "prompt" },
  { id: "e2", from: "architect", to: "contract", status: "healthy", label: "generates" },
  { id: "e3", from: "contract", to: "builder", status: "healthy", label: "spec" },
  { id: "e4", from: "contract", to: "overseer", status: "healthy", label: "spec" },
  { id: "e5", from: "builder", to: "frontend", status: "healthy", label: "writes" },
  { id: "e6", from: "builder", to: "backend", status: "violation", label: "writes" },
  { id: "e7", from: "builder", to: "database", status: "healthy", label: "writes" },
  { id: "e8", from: "overseer", to: "builder", status: "warning", label: "audits" },
  { id: "e9", from: "overseer", to: "human", status: "healthy", label: "escalates" },
];

// --- Errors ---

export type IncidentError = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  step: number;
  type: string;
  expected: string;
  actual: string;
  rootCause: string;
  recommendedFix: string;
  confidence: number;
  frontendFiles: string[];
  backendFiles: string[];
  ts: string;
  status: "open" | "fixed" | "dismissed";
};

export const incidents: IncidentError[] = [
  {
    id: "v_017",
    title: "GET /api/todos returns wrong shape",
    severity: "high",
    step: 12,
    type: "Response Shape Violation",
    expected: "{ todos: [] }",
    actual: "{ data: { todos: [] } }",
    rootCause: "Builder introduced a `data` envelope at Step 12, likely carried over from billing-API style. Contract specifies bare `{ todos: [] }`.",
    recommendedFix: "Return `{ todos }` directly from src/app/api/todos/route.ts (line 24). Remove the outer `data` wrapper.",
    confidence: 96,
    frontendFiles: ["src/app/todos/page.tsx", "src/hooks/useTodos.ts"],
    backendFiles: ["src/app/api/todos/route.ts"],
    ts: "08:42:31",
    status: "open",
  },
  {
    id: "v_016",
    title: "Missing 401 handling on PATCH /api/todos/:id",
    severity: "medium",
    step: 9,
    type: "Auth Drift",
    expected: "401 when bearer missing",
    actual: "200 with empty body",
    rootCause: "Middleware did not include PATCH route in protected pattern.",
    recommendedFix: "Extend middleware matcher to include /api/todos/:path*.",
    confidence: 91,
    frontendFiles: [],
    backendFiles: ["src/middleware.ts"],
    ts: "08:18:02",
    status: "fixed",
  },
  {
    id: "v_015",
    title: "User shape drift in login response",
    severity: "low",
    step: 6,
    type: "Missing Field",
    expected: "{ id, email }",
    actual: "{ id, email, password_hash }",
    rootCause: "Builder echoed full DB row.",
    recommendedFix: "Select only id and email before returning.",
    confidence: 99,
    frontendFiles: ["src/app/login/page.tsx"],
    backendFiles: ["src/app/api/auth/login/route.ts"],
    ts: "08:09:51",
    status: "fixed",
  },
];

// --- Demo Mode scenario ---

export type DemoStep = {
  id: number;
  actor: "human" | "architect" | "builder" | "overseer" | "system";
  title: string;
  body: string;
  detail?: string;
};

export const demoScenario: DemoStep[] = [
  {
    id: 1,
    actor: "human",
    title: "User prompt",
    body: '"Build me a Todo App with login that saves my todos."',
  },
  {
    id: 2,
    actor: "architect",
    title: "Architect asks 6 clarifying questions",
    body: "Auth method? Token storage? Pagination? Rate limiting? Cascade deletes? DoD?",
    detail: "Each ambiguity logged. No code written yet.",
  },
  {
    id: 3,
    actor: "architect",
    title: "Contract v1.0 generated and locked",
    body: "All assumptions resolved. Contract becomes single source of truth.",
    detail: "Only the human can amend from this point forward.",
  },
  {
    id: 4,
    actor: "builder",
    title: "Builder starts step-by-step implementation",
    body: "Scaffolds project, writes auth, writes DB layer, reports confidence after each step.",
  },
  {
    id: 5,
    actor: "builder",
    title: "Step 12 — GET /api/todos written",
    body: "Confidence 87%. Returns { data: { todos: [] } }.",
    detail: "Builder unknowingly wrapped response in a data envelope.",
  },
  {
    id: 6,
    actor: "overseer",
    title: "Overseer detects contract violation",
    body: "Expected { todos: [] }, got { data: { todos: [] } }.",
    detail: "Without the Overseer, the frontend would silently break in production.",
  },
  {
    id: 7,
    actor: "overseer",
    title: "Root cause traced to Step 12",
    body: "Builder introduced `data` wrapper — likely pattern bleed-through. Confidence in diagnosis: 96%.",
  },
  {
    id: 8,
    actor: "builder",
    title: "Builder applies the fix",
    body: "Returns `{ todos }` directly. Contract integrity restored.",
    detail: "No infinite loop. No re-attempts. One pass.",
  },
  {
    id: 9,
    actor: "system",
    title: "Build successful",
    body: "Contract maintained • Loop prevented • Frontend & backend aligned.",
  },
];

export const demoFinalMetrics = {
  errorsPrevented: 2,
  loopsPrevented: 4,
  humanEscalations: 0,
  tokenSavings: 0.4,
};

// --- Recent activity (dashboard surface) ---

export const recentActivity = [
  { id: "a1", agent: "overseer", action: "Flagged contract violation on Atlas Todo API", ts: "08:42:31" },
  { id: "a2", agent: "builder", action: "Completed step 12 — GET /api/todos", ts: "08:42:18" },
  { id: "a3", agent: "builder", action: "Completed step 11 — POST /auth/login", ts: "08:38:12" },
  { id: "a4", agent: "overseer", action: "Coherence check passed on Helix Billing", ts: "08:36:04" },
  { id: "a5", agent: "architect", action: "Contract v2.3 amended on Helix Billing", ts: "08:21:48" },
  { id: "a6", agent: "builder", action: "Auto-recovered from failed Stripe webhook test", ts: "08:14:11" },
];
