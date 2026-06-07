import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { validateWorkspacePath } from "./api-key.js";
import { MemoryStore } from "./memory-store.js";
import type { ProjectSummary } from "./types.js";

const REGISTRY_DIR = ".polaris";
const REGISTRY_FILE = "project-registry.json";

export interface ProjectRegistryEntry {
  id: string;
  workspacePath: string;
  createdAt: string;
}

export interface ProjectRegistry {
  projects: ProjectRegistryEntry[];
  activeProjectId: string | null;
}

function registryPath(configRoot: string): string {
  return path.join(configRoot, REGISTRY_DIR, REGISTRY_FILE);
}

export async function loadProjectRegistry(configRoot: string): Promise<ProjectRegistry> {
  try {
    const raw = await fs.readFile(registryPath(configRoot), "utf-8");
    const parsed = JSON.parse(raw) as ProjectRegistry;
    return {
      projects: parsed.projects ?? [],
      activeProjectId: parsed.activeProjectId ?? null,
    };
  } catch {
    return { projects: [], activeProjectId: null };
  }
}

export async function saveProjectRegistry(
  configRoot: string,
  registry: ProjectRegistry,
): Promise<void> {
  await fs.mkdir(path.join(configRoot, REGISTRY_DIR), { recursive: true });
  await fs.writeFile(registryPath(configRoot), JSON.stringify(registry, null, 2));
}

export async function migrateRegistryFromWorkspace(
  configRoot: string,
  workspacePath: string,
): Promise<ProjectRegistry> {
  const existing = await loadProjectRegistry(configRoot);
  if (existing.projects.length > 0) {
    return existing;
  }

  const ids = await MemoryStore.listProjectIds(workspacePath);
  if (ids.length === 0) {
    return existing;
  }

  const activeId = (await MemoryStore.resolveProjectId(workspacePath)) ?? ids[0] ?? null;
  const registry: ProjectRegistry = {
    projects: ids.map((id) => ({
      id,
      workspacePath,
      createdAt: new Date().toISOString(),
    })),
    activeProjectId: activeId,
  };
  await saveProjectRegistry(configRoot, registry);
  return registry;
}

export async function listAllProjectSummaries(
  configRoot: string,
): Promise<ProjectSummary[]> {
  const registry = await loadProjectRegistry(configRoot);
  if (registry.projects.length === 0) {
    return [];
  }

  const summaries = await Promise.all(
    registry.projects.map(async (entry) => {
      const summary = await MemoryStore.loadProjectSummary(
        entry.workspacePath,
        entry.id,
        registry.activeProjectId ?? undefined,
      );
      return { ...summary, workspacePath: entry.workspacePath };
    }),
  );

  return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function registerProject(
  configRoot: string,
  workspacePath: string,
  projectId?: string,
): Promise<{ registry: ProjectRegistry; projectId: string }> {
  const resolved = await validateWorkspacePath(workspacePath);
  const id = projectId ?? randomUUID();
  const registry = await loadProjectRegistry(configRoot);

  const existing = registry.projects.find((p) => p.id === id);
  if (existing) {
    existing.workspacePath = resolved;
  } else {
    registry.projects.push({
      id,
      workspacePath: resolved,
      createdAt: new Date().toISOString(),
    });
  }

  registry.activeProjectId = id;
  await saveProjectRegistry(configRoot, registry);
  return { registry, projectId: id };
}

export async function setRegistryActiveProject(
  configRoot: string,
  projectId: string,
): Promise<ProjectRegistry> {
  const registry = await loadProjectRegistry(configRoot);
  const entry = registry.projects.find((p) => p.id === projectId);
  if (!entry) {
    throw new Error("Project not found in registry.");
  }
  registry.activeProjectId = projectId;
  await saveProjectRegistry(configRoot, registry);
  return registry;
}

export async function removeRegistryProject(
  configRoot: string,
  projectId: string,
): Promise<ProjectRegistry> {
  const registry = await loadProjectRegistry(configRoot);
  registry.projects = registry.projects.filter((p) => p.id !== projectId);
  if (registry.activeProjectId === projectId) {
    registry.activeProjectId = registry.projects[0]?.id ?? null;
  }
  await saveProjectRegistry(configRoot, registry);
  return registry;
}

export async function updateRegistryProjectWorkspace(
  configRoot: string,
  projectId: string,
  workspacePath: string,
): Promise<ProjectRegistry> {
  const resolved = await validateWorkspacePath(workspacePath);
  const registry = await loadProjectRegistry(configRoot);
  const entry = registry.projects.find((p) => p.id === projectId);
  if (!entry) {
    throw new Error("Project not found in registry.");
  }

  const oldPath = entry.workspacePath;
  if (oldPath !== resolved) {
    await MemoryStore.migrateProjectFiles(oldPath, resolved, projectId);
    entry.workspacePath = resolved;
    await saveProjectRegistry(configRoot, registry);
  }

  return registry;
}

export async function resolveRegistryProject(
  configRoot: string,
  projectId: string,
): Promise<ProjectRegistryEntry> {
  const registry = await loadProjectRegistry(configRoot);
  const entry = registry.projects.find((p) => p.id === projectId);
  if (!entry) {
    throw new Error("Project not found.");
  }
  return entry;
}
