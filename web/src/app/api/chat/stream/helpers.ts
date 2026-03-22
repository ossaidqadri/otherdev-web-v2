import type { ContentBlock, MessageContent } from "@/lib/content-types";

export type { ContentBlock, MessageContent };

export interface Message {
  role: "user" | "assistant";
  content: MessageContent;
}

export interface GroqMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

// Typical base64 image URLs for previews can easily exceed a few hundred characters.
// Use a generous estimate to avoid under-counting when bounding history size.
const IMAGE_BLOCK_CHAR_ESTIMATE = 500;
const MIN_MESSAGE_FLOOR = 4;
const DEFAULT_MESSAGE_LIMIT = 12;
const DEFAULT_CHAR_BUDGET = 12000;

function getValidatedInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

export function selectModel(hasImageContent: boolean | undefined): string {
  if (hasImageContent === true) {
    return "meta-llama/llama-4-scout-17b-16e-instruct";
  }
  return "openai/gpt-oss-120b";
}

export function formatMessagesForGroq(messages: Message[]): GroqMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function validateImageContent(
  messages: Message[],
  hasImageContent: boolean | undefined,
): void {
  const hasImages = messagesContainImages(messages);

  if (hasImageContent === true && !hasImages) {
    console.warn(
      "WARNING: hasImageContent flag is true but no images found in message content. " +
        "This may indicate a mismatch between the flag and actual content.",
    );
  }

  if (hasImageContent === false && hasImages) {
    console.warn(
      "WARNING: hasImageContent flag is false but images found in message content. " +
        "Consider setting hasImageContent to true for better model selection.",
    );
  }
}

export function messagesContainImages(messages: Message[]): boolean {
  return messages.some((message) => {
    if (Array.isArray(message.content)) {
      return message.content.some((block) => block.type === "image_url");
    }
    return false;
  });
}

function estimateMessageCharacterCount(message: Message): number {
  if (typeof message.content === "string") {
    return message.content.length;
  }

  return message.content.reduce((total, block) => {
    if (block.type === "text") {
      return total + block.text.length;
    }
    // Image URLs can be long; account for them generously
    return total + IMAGE_BLOCK_CHAR_ESTIMATE;
  }, 0);
}

export function boundMessagesForGroq(
  messages: Message[],
  options?: {
    maxMessages?: number;
    charBudget?: number;
    minMessages?: number;
  },
): Message[] {
  if (messages.length === 0) return [];

  const maxMessages = Math.max(
    options?.maxMessages ??
      Math.max(
        getValidatedInt(process.env.CHAT_HISTORY_MESSAGE_LIMIT, DEFAULT_MESSAGE_LIMIT),
        MIN_MESSAGE_FLOOR,
      ),
    MIN_MESSAGE_FLOOR,
  );
  const charBudget =
    options?.charBudget ??
    Math.max(
      getValidatedInt(process.env.CHAT_HISTORY_CHAR_BUDGET, DEFAULT_CHAR_BUDGET),
      1000,
    );
  const minMessages = Math.max(
    options?.minMessages ?? MIN_MESSAGE_FLOOR,
    1,
  );

  const recentMessages = messages.slice(-maxMessages);
  const trimmedMessages = [...recentMessages];

  let totalLength = trimmedMessages.reduce(
    (total, message) => total + estimateMessageCharacterCount(message),
    0,
  );

  while (trimmedMessages.length > minMessages && totalLength > charBudget) {
    const removed = trimmedMessages.shift();
    if (removed) {
      totalLength -= estimateMessageCharacterCount(removed);
    }
  }

  return trimmedMessages;
}
