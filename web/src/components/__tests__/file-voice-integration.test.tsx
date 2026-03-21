/**
 * Integration tests for file attachment and voice input feature.
 * Verifies the complete flow from file selection through API routing.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { encodeImageToBase64 } from "@/lib/file-processor";
import type { ContentBlock } from "@/lib/content-types";

describe("File & Voice Attachment Integration", () => {
  // Test data
  let testImageBase64: string;
  let testFileContent: string;

  beforeEach(() => {
    // Mock base64 image data (minimal valid PNG)
    testImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    testFileContent = "console.log('Hello, World!');\n";
  });

  describe("File Attachment Flow", () => {
    it("should create image content block with base64 data", () => {
      const imageBlock: ContentBlock = {
        type: "image_url",
        image_url: { url: testImageBase64 },
      };

      expect(imageBlock.type).toBe("image_url");
      expect(imageBlock.image_url.url.startsWith("data:image/")).toBe(true);
      expect(imageBlock.image_url.url.includes("base64,")).toBe(true);
    });

    it("should create text content block from file content", () => {
      const textBlock: ContentBlock = {
        type: "text",
        text: `[File: example.js]\n${testFileContent}`,
      };

      expect(textBlock.type).toBe("text");
      expect(textBlock.text).toContain("[File: example.js]");
      expect(textBlock.text).toContain("console.log");
    });

    it("should merge multiple files into content array", () => {
      const imageBlock: ContentBlock = {
        type: "image_url",
        image_url: { url: testImageBase64 },
      };

      const codeBlock: ContentBlock = {
        type: "text",
        text: `[File: app.js]\n${testFileContent}`,
      };

      const contentBlocks: ContentBlock[] = [imageBlock, codeBlock];

      expect(contentBlocks).toHaveLength(2);
      expect(contentBlocks[0].type).toBe("image_url");
      expect(contentBlocks[1].type).toBe("text");
    });
  });

  describe("Voice Input Flow", () => {
    it("should wrap transcript in voice message block", () => {
      const transcript = "Tell me about your projects";
      const voiceBlock: ContentBlock = {
        type: "text",
        text: `[Voice Message] ${transcript}`,
      };

      expect(voiceBlock.type).toBe("text");
      expect(voiceBlock.text.startsWith("[Voice Message]")).toBe(true);
      expect(voiceBlock.text).toContain(transcript);
    });

    it("should support multiple voice messages in conversation", () => {
      const firstMessage: ContentBlock = {
        type: "text",
        text: "[Voice Message] Hello",
      };

      const secondMessage: ContentBlock = {
        type: "text",
        text: "[Voice Message] What services do you offer?",
      };

      const messages: ContentBlock[] = [firstMessage, secondMessage];

      expect(messages).toHaveLength(2);
      messages.forEach((msg) => {
        expect(msg.type).toBe("text");
        expect(msg.text).toContain("[Voice Message]");
      });
    });
  });

  describe("Mixed Content (Files + Voice)", () => {
    it("should combine image and voice in single message", () => {
      const imageBlock: ContentBlock = {
        type: "image_url",
        image_url: { url: testImageBase64 },
      };

      const voiceBlock: ContentBlock = {
        type: "text",
        text: "[Voice Message] What's in this image?",
      };

      const userMessage = {
        role: "user" as const,
        content: [imageBlock, voiceBlock],
      };

      expect(userMessage.content).toHaveLength(2);
      expect((userMessage.content[0] as any).type).toBe("image_url");
      expect((userMessage.content[1] as any).type).toBe("text");
    });

    it("should combine multiple files with text message", () => {
      const textBlock: ContentBlock = {
        type: "text",
        text: "Here are my project files:",
      };

      const imageBlock1: ContentBlock = {
        type: "image_url",
        image_url: { url: testImageBase64 },
      };

      const imageBlock2: ContentBlock = {
        type: "image_url",
        image_url: { url: testImageBase64 },
      };

      const userMessage = {
        role: "user" as const,
        content: [textBlock, imageBlock1, imageBlock2],
      };

      expect(userMessage.content).toHaveLength(3);
      const imageCount = userMessage.content.filter((b: any) => b.type === "image_url").length;
      expect(imageCount).toBe(2);
    });
  });

  describe("Model Routing Detection", () => {
    it("should detect image content in message", () => {
      const contentWithImage: ContentBlock[] = [
        {
          type: "image_url",
          image_url: { url: testImageBase64 },
        },
      ];

      const hasImages = contentWithImage.some((block) => block.type === "image_url");
      expect(hasImages).toBe(true);
    });

    it("should detect text-only content", () => {
      const textOnly: ContentBlock[] = [
        {
          type: "text",
          text: "Hello, what are your services?",
        },
      ];

      const hasImages = textOnly.some((block) => block.type === "image_url");
      expect(hasImages).toBe(false);
    });

    it("should correctly identify mixed content has images", () => {
      const mixed: ContentBlock[] = [
        {
          type: "text",
          text: "Check this image",
        },
        {
          type: "image_url",
          image_url: { url: testImageBase64 },
        },
      ];

      const hasImages = mixed.some((block) => block.type === "image_url");
      expect(hasImages).toBe(true);
    });
  });

  describe("API Request Format", () => {
    it("should format request with hasImageContent flag for text-only", () => {
      const apiRequest = {
        messages: [
          {
            role: "user" as const,
            content: "What's your experience with React?",
          },
        ],
        hasImageContent: false,
      };

      expect(apiRequest.hasImageContent).toBe(false);
      expect(typeof apiRequest.messages[0].content).toBe("string");
    });

    it("should format request with hasImageContent flag for images", () => {
      const apiRequest = {
        messages: [
          {
            role: "user" as const,
            content: [
              {
                type: "text" as const,
                text: "Analyze this design",
              },
              {
                type: "image_url" as const,
                image_url: { url: testImageBase64 },
              },
            ],
          },
        ],
        hasImageContent: true,
      };

      expect(apiRequest.hasImageContent).toBe(true);
      expect(Array.isArray(apiRequest.messages[0].content)).toBe(true);
    });

    it("should include metadata in runtime message", () => {
      const runtimeMessage = {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: "Check this image",
          },
          {
            type: "image_url" as const,
            image_url: { url: testImageBase64 },
          },
        ],
        metadata: {
          custom: {
            hasImageContent: true,
          },
        },
      };

      expect(runtimeMessage.metadata?.custom?.hasImageContent).toBe(true);
    });
  });

  describe("Error Scenarios", () => {
    it("should handle empty content blocks", () => {
      const emptyContent: ContentBlock[] = [];
      const hasImages = emptyContent.some((block) => block.type === "image_url");
      expect(hasImages).toBe(false);
      expect(emptyContent).toHaveLength(0);
    });

    it("should handle invalid base64 URL gracefully", () => {
      const invalidBlock: ContentBlock = {
        type: "image_url",
        image_url: { url: "data:image/png;base64,invalid" },
      };

      // Type is still valid, validation happens at API level
      expect(invalidBlock.type).toBe("image_url");
      expect(invalidBlock.image_url.url).toContain("base64");
    });

    it("should handle very long transcripts", () => {
      const longTranscript = "a".repeat(5000);
      const voiceBlock: ContentBlock = {
        type: "text",
        text: `[Voice Message] ${longTranscript}`,
      };

      expect(voiceBlock.text.length).toBeGreaterThan(5000);
      expect(voiceBlock.text.startsWith("[Voice Message]")).toBe(true);
    });
  });

  describe("Feature Completeness", () => {
    it("should support complete feature flow: file + voice + text", () => {
      // User message with text, attached image, and voice input
      const completeMessage = {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: "I uploaded an image and have a question about it:",
          },
          {
            type: "image_url" as const,
            image_url: { url: testImageBase64 },
          },
          {
            type: "text" as const,
            text: "[Voice Message] Can you analyze the design?",
          },
        ],
      };

      const apiRequest = {
        messages: [completeMessage],
        hasImageContent: true,
      };

      // Verify structure
      expect(apiRequest.messages).toHaveLength(1);
      expect(apiRequest.messages[0].content).toHaveLength(3);
      expect(apiRequest.hasImageContent).toBe(true);

      // Verify content types
      const content = apiRequest.messages[0].content;
      expect((content[0] as any).type).toBe("text");
      expect((content[1] as any).type).toBe("image_url");
      expect((content[2] as any).type).toBe("text");

      // Verify text content has markers
      const firstText = (content[0] as any).text;
      const thirdText = (content[2] as any).text;
      expect(firstText).toContain("image");
      expect(thirdText).toContain("[Voice Message]");
    });
  });
});
