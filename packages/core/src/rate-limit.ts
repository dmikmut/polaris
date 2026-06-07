import { RateLimitError } from "@anthropic-ai/sdk";

export const DEFAULT_RATE_LIMIT_RETRY_SECONDS = 60;

export interface RateLimitDetails {
  retryAfterSeconds: number;
  formatted: string;
}

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

export function parseRetryAfterFromMessage(message: string): number | null {
  const match = message.match(/\*\*Suggested wait:\*\*\s*about\s+(\d+)\s+second/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export function getRateLimitDetails(err: unknown): RateLimitDetails {
  const retryAfter =
    err instanceof RateLimitError
      ? (parseRetryAfterSeconds(err.headers) ?? DEFAULT_RATE_LIMIT_RETRY_SECONDS)
      : DEFAULT_RATE_LIMIT_RETRY_SECONDS;

  return {
    retryAfterSeconds: retryAfter,
    formatted: formatRateLimitError(err, retryAfter),
  };
}

export function formatRateLimitError(
  err: unknown,
  retryAfterSeconds = DEFAULT_RATE_LIMIT_RETRY_SECONDS,
): string {
  if (err instanceof RateLimitError) {
    const resolvedRetryAfter =
      parseRetryAfterSeconds(err.headers) ?? retryAfterSeconds;
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

    const mins = Math.ceil(resolvedRetryAfter / 60);
    lines.push(
      "",
      `**Suggested wait:** about ${resolvedRetryAfter} second${resolvedRetryAfter === 1 ? "" : "s"}${mins > 1 ? ` (~${mins} min)` : ""} before retrying.`,
    );

    lines.push(
      "",
      "Use the **Retry** button when the countdown reaches zero. You can add an optional note below.",
    );

    return lines.join("\n");
  }

  if (err instanceof Error) {
    return [
      "**Anthropic API rate limit reached**",
      "",
      err.message.replace(/^429\s*/, ""),
      "",
      `**Suggested wait:** about ${retryAfterSeconds} seconds before retrying.`,
      "",
      "Use the **Retry** button when the countdown reaches zero.",
    ].join("\n");
  }

  return [
    "**Anthropic API rate limit reached.**",
    "",
    `**Suggested wait:** about ${retryAfterSeconds} seconds before retrying.`,
    "",
    "Use the **Retry** button when the countdown reaches zero.",
  ].join("\n");
}
