import { boundMessagesForGroq, type Message } from "../helpers";

function buildTextMessage(role: "user" | "assistant", text: string): Message {
  return { role, content: text };
}

function buildImageMessage(role: "user" | "assistant", text: string): Message {
  return {
    role,
    content: [
      { type: "image_url" as const, image_url: { url: "https://example.com/img.png" } },
      { type: "text" as const, text },
    ],
  };
}

describe("boundMessagesForGroq", () => {
  it("removes oldest messages when exceeding the character budget", () => {
    const messages: Message[] = [
      buildTextMessage("user", "one"),
      buildTextMessage("assistant", "two"),
      buildTextMessage("user", "three"),
      buildTextMessage("assistant", "four"),
      buildTextMessage("user", "five"),
      buildTextMessage("assistant", "six"),
    ];

    const result = boundMessagesForGroq(messages, {
      charBudget: 12,
      maxMessages: 6,
      minMessages: 2,
    });

    expect(result.length).toBe(3);
    expect(result[0].content).toBe("four");
    expect(result[result.length - 1].content).toBe("six");
  });

  it("always preserves the newest messages within maxMessages", () => {
    const messages: Message[] = Array.from({ length: 10 }, (_, idx) =>
      buildTextMessage(idx % 2 === 0 ? "user" : "assistant", `msg-${idx + 1}`),
    );

    const result = boundMessagesForGroq(messages, {
      maxMessages: 5,
      charBudget: 10_000,
      minMessages: 2,
    });

    expect(result).toHaveLength(5);
    expect(result[0].content).toBe("msg-6");
    expect(result[4].content).toBe("msg-10");
  });

  it("accounts for image blocks when estimating length", () => {
    const messages: Message[] = [
      buildImageMessage("user", "image-text"),
      buildTextMessage("assistant", "ack"),
      buildTextMessage("user", "final-user-message"),
    ];

    const result = boundMessagesForGroq(messages, {
      charBudget: 6000,
      maxMessages: 5,
      minMessages: 2,
    });

    expect(result[result.length - 1].content).toBe("final-user-message");
    expect(result.some((msg) => Array.isArray(msg.content))).toBe(true);
  });
});
