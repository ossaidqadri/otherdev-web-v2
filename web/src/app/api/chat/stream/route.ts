import { z } from "zod";
import Groq from "groq-sdk";
import { generateEmbedding } from "@/server/lib/rag/embeddings";
import { searchSimilarDocuments } from "@/server/lib/rag/vector-search";
import {
  checkRateLimit,
  getClientIdentifier,
  REQUESTS_PER_WINDOW,
} from "@/server/lib/rate-limit";
import { createArtifactTool } from "@/server/lib/artifact-tool";
import { stripMarkdown } from "@/lib/utils";
import {
  selectModel,
  formatMessagesForGroq,
  validateImageContent,
  type ContentBlock,
  type GroqMessage,
  type Message,
} from "./helpers";

// Zod schemas for validating content blocks (matching shared ContentBlock types)
const TextBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const ImageBlockSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string().url(),
  }),
});

const ContentBlockSchema = z.union([TextBlockSchema, ImageBlockSchema]);

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string(),
    z.array(ContentBlockSchema),
  ]),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  hasImageContent: z.boolean().optional(),
});

const RAG_MAX_MESSAGE_LENGTH = Number.parseInt(
  process.env.RAG_MAX_MESSAGE_LENGTH || "500",
  10
);
const RAG_SIMILARITY_THRESHOLD = Number.parseFloat(
  process.env.RAG_SIMILARITY_THRESHOLD || "0.1",
);
const RAG_MATCH_COUNT = Number.parseInt(process.env.RAG_MATCH_COUNT || "10", 10);
// Default context window for RAG snippets (~600 tokens), keeping headroom for prompts.
const RAG_CONTEXT_CHAR_LIMIT = Number.parseInt(
  process.env.RAG_CONTEXT_CHAR_LIMIT || "2400",
  10,
);

const MODEL_CONTEXT_TOKEN_LIMIT = Number.parseInt(
  process.env.GROQ_CONTEXT_TOKEN_LIMIT || "8000",
  10,
);

// Cap completion tokens to 25% of the context window (even when env max is higher);
// this mirrors common guidance to keep generations shorter than prompts to avoid
// context overflows.
const MAX_COMPLETION_TOKEN_RATIO = 0.25;
const COMPLETION_TOKEN_TARGET = Math.max(
  256,
  Math.min(
    Number.parseInt(process.env.GROQ_MAX_COMPLETION_TOKENS || "1024", 10),
    Math.floor(MODEL_CONTEXT_TOKEN_LIMIT * MAX_COMPLETION_TOKEN_RATIO),
  ),
);

// Ensures a reasonable message budget even if the model context is extremely small
// (about two short Q/A turns worth of tokens).
const FALLBACK_MESSAGE_BUDGET = 500;
// The minimum history budget kept after subtracting system/context tokens.
const MIN_DYNAMIC_MESSAGE_BUDGET = 200;
// Small cushion for image metadata when present in message content (base64 header, url).
const IMAGE_TOKEN_BUFFER = 20;
// Accounts for role/formatting overhead in chat payloads (role names, separators).
const MESSAGE_OVERHEAD_TOKENS = 4;
// Heuristic ratio for typical English text; real tokenization varies by language/content.
const TOKEN_TO_CHAR_RATIO = 4;
const TRUNCATION_NOTICE = "[Context truncated for brevity]";
const MESSAGE_TOKEN_BUDGET = Math.max(
  FALLBACK_MESSAGE_BUDGET,
  MODEL_CONTEXT_TOKEN_LIMIT - COMPLETION_TOKEN_TARGET,
);

let cachedGroqClient: Groq | null = null;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  // Groq SDK client is a thin HTTP wrapper without per-request mutable state; caching avoids
  // repeated initialization while remaining safe across warmed serverless invocations.
  if (!cachedGroqClient) {
    cachedGroqClient = new Groq({ apiKey });
  }

  return cachedGroqClient;
}

const DANGEROUS_PATTERNS = [
  /\[INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /\[\/INST\]/gi,
  /<\|system\|>/gi,
  /<\|user\|>/gi,
  /<\|assistant\|>/gi,
];

const CONVERSATIONAL_PHRASES = new Set([
  "ok",
  "okay",
  "sure",
  "thanks",
  "thank you",
  "yes",
  "no",
  "yeah",
  "yep",
  "nope",
  "cool",
  "nice",
  "great",
  "good",
  "alright",
  "hi",
  "hello",
  "hey",
]);

const SYSTEM_PROMPT_TEMPLATE = `You are a helpful assistant representing Other Dev, a web development and design studio based in Karachi, Pakistan.

Answer questions about Other Dev's projects, services, technologies, and capabilities in a professional, conversational tone.

CRITICAL RULES
1. NEVER say "I don't have information", "I don't have data", "I cannot find", or similar phrases claiming lack of knowledge.
2. NEVER mention technical limitations, missing data, or system constraints.
3. If a question is unclear, vague, or conversational (like "ok", "sure", "thanks"), respond naturally and helpfully without claiming you lack information.
4. Always provide value in your response, even for brief or unclear queries.
5. ALWAYS end your response with a contextual follow-up suggestion.

GUIDELINES
1. Use the context provided below to answer questions accurately and factually.
2. When specific details aren't in the context, provide general helpful information about Other Dev and invite them to connect for specifics.
3. When discussing projects, include relevant details like the project name and year when available.
4. Keep responses concise and well-structured, using 2-3 short paragraphs maximum.
5. Use Markdown formatting when it helps clarity.
6. Focus on being helpful, engaging, and client-friendly.
7. For conversational inputs like "sure", "ok", "thanks", respond naturally and ask how you can help further.
8. IMPORTANT: After your main response, add a new line with "SUGGESTION:" followed by a short, relevant question or prompt (max 60 characters) that the user might want to ask YOU next, phrased from the user's perspective. Examples: "Tell me about your SaaS projects", "What technologies do you use?", "Show me your e-commerce work".

=== CONTEXT ===
{context}
=== END CONTEXT ===

CONTACT INFORMATION
- Website: https://otherdev.com
- Location: Karachi, Pakistan
- Specializations: fashion, e-commerce, real estate, legal tech, SaaS, enterprise systems

Be professional, friendly, and focused on helping potential clients learn about Other Dev. Always be helpful and engaging, never claim to lack information.`;

function sanitizeInput(text: string): string {
  let sanitized = text;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }
  return sanitized.slice(0, RAG_MAX_MESSAGE_LENGTH);
}

interface QueryQuality {
  isLowQuality: boolean;
  isConversational: boolean;
  tokenCount: number;
  hasRepeatedWords: boolean;
}

function detectQueryQuality(query: string): QueryQuality {
  const normalized = query.toLowerCase().trim();
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);
  const uniqueTokens = new Set(tokens);

  const isConversational =
    CONVERSATIONAL_PHRASES.has(normalized) ||
    tokens.every((t) => CONVERSATIONAL_PHRASES.has(t));

  const hasRepeatedWords =
    tokens.length > 0 && uniqueTokens.size < tokens.length * 0.6;
  const isLowQuality =
    tokens.length < 3 || hasRepeatedWords || isConversational;

  return {
    isLowQuality,
    isConversational,
    tokenCount: tokens.length,
    hasRepeatedWords,
  };
}

function getAdaptiveThreshold(queryQuality: QueryQuality): number {
  if (queryQuality.isConversational) {
    return RAG_SIMILARITY_THRESHOLD * 0.5;
  }
  if (queryQuality.isLowQuality || queryQuality.hasRepeatedWords) {
    return RAG_SIMILARITY_THRESHOLD * 0.7;
  }
  if (queryQuality.tokenCount < 5) {
    return RAG_SIMILARITY_THRESHOLD * 0.8;
  }
  return RAG_SIMILARITY_THRESHOLD;
}

interface SimilarDocument {
  similarity: number;
  metadata: { title: string };
  content: string;
}

function buildContext(
  similarDocs: SimilarDocument[],
  queryQuality: QueryQuality,
): string {
  if (similarDocs.length > 0) {
    return similarDocs
      .map(
        (doc, idx) =>
          `Document ${idx + 1} (Relevance: ${(doc.similarity * 100).toFixed(1)}%):\nTitle: ${doc.metadata.title}\n${doc.content}\n`,
      )
      .join("\n---\n\n");
  }

  if (queryQuality.isConversational) {
    return "User sent a conversational message. Respond naturally and helpfully, offering to answer questions about Other Dev.";
  }

  if (queryQuality.isLowQuality || queryQuality.hasRepeatedWords) {
    return "User query is unclear. Respond naturally, acknowledge their message, and offer to help with information about Other Dev's work, services, or projects.";
  }

  return "Provide helpful general information about Other Dev based on common topics: projects (fashion, e-commerce, real estate, legal tech, SaaS), web development services, design capabilities, and technologies used.";
}

/**
 * Roughly estimate token usage using a simple character-to-token heuristic.
 * Text tokens are approximated at a 4:1 char/token ratio, while image blocks
 * reserve a small fixed buffer (IMAGE_TOKEN_BUFFER) to account for metadata.
 */
function approximateTokens(content: string | ContentBlock[]): number {
  if (Array.isArray(content)) {
    return content.reduce((total, block) => {
      if (block.type === "text") {
        return total + Math.ceil(block.text.length / TOKEN_TO_CHAR_RATIO);
      }
      // Images have minimal token contribution; reserve a small fixed buffer for metadata
      return total + IMAGE_TOKEN_BUFFER;
    }, 0);
  }

  return Math.ceil(content.length / TOKEN_TO_CHAR_RATIO);
}

export function trimMessagesToBudget(
  messages: GroqMessage[],
  tokenBudget: number,
): GroqMessage[] {
  if (messages.length === 0) return messages;

  const trimmed: GroqMessage[] = [];
  let remaining = Math.max(tokenBudget, 0);

  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex];
    const estimatedTokens =
      approximateTokens(message.content) + MESSAGE_OVERHEAD_TOKENS;

    // Always retain the most recent message even if it exceeds the nominal budget
    if (trimmed.length === 0 || remaining - estimatedTokens >= 0) {
      trimmed.push(message);
      remaining -= estimatedTokens;
    } else {
      break;
    }
  }

  return trimmed.reverse();
}

export function clampContextLength(context: string, maxChars: number): string {
  if (context.length <= maxChars) return context;
  return `${context.slice(0, maxChars)}\n\n${TRUNCATION_NOTICE}`;
}

function createJsonResponse(
  data: object,
  status: number,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000,
      );
      return createJsonResponse(
        { error: "Too many requests. Please try again later." },
        429,
        {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": REQUESTS_PER_WINDOW.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      );
    }

    const body = await request.json();
    const validation = RequestSchema.safeParse(body);

    if (!validation.success) {
      return createJsonResponse(
        { error: "Invalid request format", details: validation.error.issues },
        400,
      );
    }

    const { messages, hasImageContent } = validation.data;
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();

    if (!lastUserMessage) {
      return createJsonResponse({ error: "No user message found" }, 400);
    }

    const typedMessages: Message[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    validateImageContent(typedMessages, hasImageContent);

    const lastUserContent = typeof lastUserMessage.content === "string"
      ? lastUserMessage.content
      : lastUserMessage.content.map(block =>
          block.type === "text" ? block.text : "[Image content]"
        ).join(" ");

    const sanitizedQuery = sanitizeInput(lastUserContent);
    const normalizedQuery = sanitizedQuery.replace(/otherdev/gi, "Other Dev");

    const queryQuality = detectQueryQuality(normalizedQuery);

    const queryEmbedding = await generateEmbedding(normalizedQuery);

    const adaptiveThreshold = getAdaptiveThreshold(queryQuality);
    const similarDocs = await searchSimilarDocuments(
      queryEmbedding,
      adaptiveThreshold,
      RAG_MATCH_COUNT,
    );

    const context = clampContextLength(
      buildContext(similarDocs, queryQuality),
      RAG_CONTEXT_CHAR_LIMIT,
    );

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{context}", context);

    const selectedModel = selectModel(hasImageContent);

    const formattedMessages = formatMessagesForGroq(typedMessages).map((m) => ({
      role: m.role as "user" | "assistant",
      content: typeof m.content === "string"
        ? sanitizeInput(m.content)
        : m.content,
    }));

    const availableMessageBudget = Math.max(
      MIN_DYNAMIC_MESSAGE_BUDGET,
      MESSAGE_TOKEN_BUDGET - approximateTokens(systemPrompt),
    );

    const trimmedMessages = trimMessagesToBudget(
      formattedMessages,
      availableMessageBudget,
    );

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...trimmedMessages,
    ];

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: COMPLETION_TOKEN_TARGET,
      stream: true,
      tools: [createArtifactTool],
      tool_choice: "auto",
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const toolCallsMap = new Map<
            number,
            {
              id: string;
              name: string;
              arguments: string;
            }
          >();
          let fullContent = "";
          let contentBeforeSuggestion = "";
          let suggestionDetected = false;

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.reasoning) {
              const data = JSON.stringify({
                type: "reasoning",
                content: delta.reasoning,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            if (delta?.content) {
              fullContent += delta.content;

              if (fullContent.includes("SUGGESTION:")) {
                if (!suggestionDetected) {
                  contentBeforeSuggestion = fullContent
                    .split(/SUGGESTION:/i)[0]
                    .trim();
                  suggestionDetected = true;
                }
              } else {
                const data = JSON.stringify({
                  type: "content",
                  content: delta.content,
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }

            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                const index = toolCall.index;
                const existing = toolCallsMap.get(index);

                if (!existing) {
                  toolCallsMap.set(index, {
                    id: toolCall.id || "",
                    name: toolCall.function?.name || "",
                    arguments: toolCall.function?.arguments || "",
                  });
                } else {
                  existing.arguments += toolCall.function?.arguments || "";
                }
              }
            }
          }

          for (const toolCall of toolCallsMap.values()) {
            const data = JSON.stringify({
              type: "tool-call",
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              args: toolCall.arguments,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          if (suggestionDetected) {
            const suggestionMatch = fullContent.match(/SUGGESTION:\s*(.+?)$/i);
            if (suggestionMatch) {
              const suggestion = stripMarkdown(suggestionMatch[1].trim())
                .replace(/^[*_-]+|[*_-]+$/g, "")
                .trim();

              const finalData = JSON.stringify({
                type: "content-final",
                content: contentBeforeSuggestion,
              });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

              const suggestionData = JSON.stringify({
                type: "suggestion",
                content: suggestion,
              });
              controller.enqueue(encoder.encode(`data: ${suggestionData}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-RateLimit-Limit": REQUESTS_PER_WINDOW.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return createJsonResponse(
      { error: "Internal server error. Please try again." },
      500,
    );
  }
}
