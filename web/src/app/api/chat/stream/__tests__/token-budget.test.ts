import type { GroqMessage } from "../helpers";
import { clampContextLength, trimMessagesToBudget } from "../route";

describe("trimMessagesToBudget", () => {
  const buildMessage = (role: "user" | "assistant", length: number): GroqMessage => ({
    role,
    content: "x".repeat(length),
  });

  it("keeps newest messages within the available budget", () => {
    const messages: GroqMessage[] = [
      buildMessage("user", 400),
      buildMessage("assistant", 400),
      buildMessage("user", 400),
      buildMessage("assistant", 200),
    ];

    // Budget derived from last two messages:
    // (400 chars ≈ 100 tokens) + (200 chars ≈ 50 tokens) + overhead (2 * 4) + a small buffer.
    const SMALL_BUFFER_TOKENS = 12;
    const budgetForLastTwo =
      Math.ceil(400 / 4) + Math.ceil(200 / 4) + 2 * 4 + SMALL_BUFFER_TOKENS;
    const trimmed = trimMessagesToBudget(messages, budgetForLastTwo);

    expect(trimmed).toEqual(messages.slice(2));
  });

  it("always keeps the most recent message even if the budget is tiny", () => {
    const messages: GroqMessage[] = [
      buildMessage("user", 300),
      buildMessage("assistant", 300),
    ];

    const trimmed = trimMessagesToBudget(messages, 0);

    expect(trimmed).toHaveLength(1);
    expect(trimmed[0]).toEqual(messages[1]);
  });
});

describe("clampContextLength", () => {
  it("returns original context when under the limit", () => {
    const context = "short context";
    expect(clampContextLength(context, 50)).toBe(context);
  });

  it("truncates context when it exceeds the limit", () => {
    const context = "a".repeat(30);
    const truncated = clampContextLength(context, 10);

    expect(truncated.startsWith("a".repeat(10))).toBe(true);
    expect(truncated).toMatch(/\[Context truncated for brevity\]$/);
  });
});
