/** Remove machine-readable blocks that are rendered separately in the UI. */
export function stripStructuredBlocks(text: string): string {
  return text
    .replace(/```plan-tasks\s*[\s\S]*?```/gi, "")
    .replace(/```connections\s*[\s\S]*?```/gi, "")
    .replace(/```knowledge\s*[\s\S]*?```/gi, "")
    .replace(/^RESOLUTION_STATUS:\s*.+$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
