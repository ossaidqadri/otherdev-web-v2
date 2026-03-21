export type ContentBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
      };
    };

export type MessageContent = string | ContentBlock[];

export interface Message {
  role: "user" | "assistant";
  content: MessageContent;
}

export interface GroqMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
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
  const hasImages = messages.some((message) => {
    if (Array.isArray(message.content)) {
      return message.content.some((block) => block.type === "image_url");
    }
    return false;
  });

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
