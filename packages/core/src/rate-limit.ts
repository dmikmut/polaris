import { RateLimitError } from "@anthropic-ai/sdk";

export function isRateLimitError(err: unknown): boolean {
  if (err instanceof RateLimitError) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate_limit") ||
      msg.includes("rate limit") ||
      msg.includes("too many requests")
    );
  }
  return false;
}

function parseRetryAfterSeconds(headers: unknown): number | null {
  if (!headers || typeof headers !== "object") return null;
  const raw =
    "retry-after" in headers
      ? (headers as Record<string, string>)["retry-after"]
      : "get" in headers && typeof (headers as { get: (k: string) => string | null }).get === "function"
        ? (headers as { get: (k: string) => string | null }).get("retry-after")
        : null;
  if (!raw) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export function formatRateLimitError(err: unknown): string {
  if (err instanceof RateLimitError) {
    const retryAfter = parseRetryAfterSeconds(err.headers);
    const apiMessage =
      typeof err.error === "object" &&
      err.error !== null &&
      "message" in err.error &&
      typeof (err.error as { message: unknown }).message === "string"
        ? (err.error as { message: string }).message
        : null;

    const lines = [
      "**Anthropic API rate limit reached**",
      "",
      "Polaris has paused all agents until you retry. This is not a bug in your project — your API tier has a requests-per-minute limit.",
    ];

    if (apiMessage) {
      lines.push("", `**Details:** ${apiMessage}`);
    }

    if (retryAfter) {
      const mins = Math.ceil(retryAfter / 60);
      lines.push(
        "",
        `**Suggested wait:** about ${retryAfter} second${retryAfter === 1 ? "" : "s"}${mins > 1 ? ` (~${mins} min)` : ""} before retrying.`,
      );
    } else {
      lines.push("", "**Suggested wait:** 1–2 minutes on free tier, then send a message to retry.");
    }

    lines.push(
      "",
      "When ready, type a note below (optional) and press **Send** to re-prompt the agent.",
    );

    return lines.join("\n");
  }

  if (err instanceof Error) {
    return [
      "**Anthropic API rate limit reached**",
      "",
      err.message.replace(/^429\s*/, ""),
      "",
      "Wait a minute, then send a message to retry.",
    ].join("\n");
  }

  return "**Anthropic API rate limit reached.** Wait a minute, then send a message to retry.";
}
