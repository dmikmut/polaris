import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RateLimitError } from "@anthropic-ai/sdk";
import { formatRateLimitError, isRateLimitError } from "../rate-limit.js";

describe("isRateLimitError", () => {
  it("detects Anthropic RateLimitError", () => {
    const err = new RateLimitError(
      429,
      { type: "rate_limit_error", message: "Rate limited" },
      "Rate limited",
      { "retry-after": "30" },
    );
    assert.equal(isRateLimitError(err), true);
  });

  it("detects message heuristics", () => {
    assert.equal(isRateLimitError(new Error("429 rate limit exceeded")), true);
    assert.equal(isRateLimitError(new Error("something else")), false);
  });
});

describe("formatRateLimitError", () => {
  it("formats a readable message with retry-after", () => {
    const err = new RateLimitError(
      429,
      { type: "rate_limit_error", message: "Number of request tokens has exceeded your rate limit" },
      "Number of request tokens has exceeded your rate limit",
      { "retry-after": "45" },
    );
    const text = formatRateLimitError(err);
    assert.match(text, /rate limit reached/i);
    assert.match(text, /Number of request tokens/);
    assert.match(text, /45 second/);
    assert.match(text, /retry/i);
  });
});
