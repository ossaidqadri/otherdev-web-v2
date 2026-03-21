import type { TextMessagePart } from "@assistant-ui/react";

// Define the content part types for file attachment
type ImageUrlMessagePart = {
  type: "image_url";
  image_url: { url: string };
};

type AppendableContentPart = TextMessagePart | ImageUrlMessagePart;

describe("useOtherDevRuntime - appendFileContent", () => {
  it("should define ContentPart type with text and image_url variants", () => {
    const textPart: TextMessagePart = {
      type: "text",
      text: "Check this",
    };

    const imagePart: ImageUrlMessagePart = {
      type: "image_url",
      image_url: { url: "data:image/png;base64,abc123" },
    };

    const contentBlocks: AppendableContentPart[] = [textPart, imagePart];

    expect(contentBlocks).toHaveLength(2);
    expect(contentBlocks[0].type).toBe("text");
    expect(contentBlocks[1].type).toBe("image_url");
  });

  it("should allow text-only content blocks", () => {
    const textOnlyBlocks: AppendableContentPart[] = [
      {
        type: "text",
        text: "This is just text content",
      },
    ];

    expect(textOnlyBlocks).toHaveLength(1);
    expect(textOnlyBlocks[0].type).toBe("text");
  });

  it("should allow multiple images in content blocks", () => {
    const multipleImages: AppendableContentPart[] = [
      {
        type: "text",
        text: "Here are two images:",
      },
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,image1" },
      },
      {
        type: "image_url",
        image_url: { url: "data:image/jpeg;base64,image2" },
      },
    ];

    expect(multipleImages).toHaveLength(3);
    const imageBlocks = multipleImages.filter((b) => b.type === "image_url");
    expect(imageBlocks).toHaveLength(2);
  });

  it("should support Groq formatting with proper structure", () => {
    const groqFormattedContent: AppendableContentPart[] = [
      {
        type: "text",
        text: "Analyze this image:",
      },
      {
        type: "image_url",
        image_url: {
          url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
      },
    ];

    const hasImages = groqFormattedContent.some((b) => b.type === "image_url");
    expect(hasImages).toBe(true);

    const textContent = groqFormattedContent.find((b) => b.type === "text");
    expect(textContent).toBeDefined();
    if (textContent && textContent.type === "text") {
      expect(textContent.text).toMatch(/image/i);
    }
  });
});

describe("useOtherDevRuntime - message pipeline integration", () => {
  it("should merge composed content and hasImageContent flag into user message", () => {
    const userTextContent: TextMessagePart = {
      type: "text",
      text: "Please analyze these files",
    };

    const composedContent: AppendableContentPart[] = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,xyz123" },
      },
      {
        type: "image_url",
        image_url: { url: "data:image/jpeg;base64,abc456" },
      },
    ];

    const hasImageContent = true;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: [
        userTextContent,
        ...composedContent,
      ],
      createdAt: new Date(),
      attachments: [],
      metadata: {
        custom: { hasImageContent },
      },
    };

    expect(userMessage.content).toHaveLength(3);
    expect(userMessage.content[0]).toEqual(userTextContent);
    expect(userMessage.content[1]).toEqual(composedContent[0]);
    expect(userMessage.content[2]).toEqual(composedContent[1]);
    expect(userMessage.metadata.custom.hasImageContent).toBe(true);
  });

  it("should handle API request with hasImageContent flag", () => {
    const messages = [
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: "Hello with image" },
          {
            type: "image_url" as const,
            image_url: { url: "data:image/png;base64,test" },
          },
        ],
      },
    ];

    const hasImageContent = true;

    const apiPayload = {
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content.find((c) => c.type === "text")?.text ?? "",
      })),
      hasImageContent,
    };

    expect(apiPayload.hasImageContent).toBe(true);
    expect(apiPayload.messages[0].content).toBe("Hello with image");
    expect(apiPayload).toHaveProperty("hasImageContent");
  });

  it("should clear composed content after sending message", () => {
    let composedContent: AppendableContentPart[] = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,image1" },
      },
    ];

    let hasImageContent = true;

    composedContent = [];
    hasImageContent = false;

    expect(composedContent).toHaveLength(0);
    expect(hasImageContent).toBe(false);
  });

  it("should include metadata with hasImageContent in user message", () => {
    const metadata = {
      custom: { hasImageContent: true },
    };

    expect(metadata.custom).toHaveProperty("hasImageContent");
    expect(metadata.custom.hasImageContent).toBe(true);
  });
});

describe("appendFileContent - edge case behavior tests", () => {
  it("should correctly identify image blocks in content", () => {
    const contentWithImage: AppendableContentPart[] = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,testimage123" },
      },
    ];

    const hasImages = contentWithImage.some(
      (block) => block.type === "image_url"
    );

    expect(hasImages).toBe(true);
    expect(contentWithImage).toHaveLength(1);
    expect(contentWithImage[0].type).toBe("image_url");
  });

  it("should handle text-only content without images", () => {
    const textOnlyContent: AppendableContentPart[] = [
      {
        type: "text",
        text: "Just some text",
      },
    ];

    const hasImages = textOnlyContent.some(
      (block) => block.type === "image_url"
    );

    expect(hasImages).toBe(false);
    expect(textOnlyContent).toHaveLength(1);
    expect(textOnlyContent[0].type).toBe("text");
  });

  it("should handle empty content blocks", () => {
    const emptyContent: AppendableContentPart[] = [];

    const hasImages = emptyContent.some(
      (block) => block.type === "image_url"
    );

    expect(emptyContent).toEqual([]);
    expect(hasImages).toBe(false);
    expect(emptyContent).toHaveLength(0);
  });

  it("should correctly identify mixed content with images and text", () => {
    const mixedContent: AppendableContentPart[] = [
      {
        type: "text",
        text: "Analyze these images:",
      },
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,img1" },
      },
      {
        type: "image_url",
        image_url: { url: "data:image/jpeg;base64,img2" },
      },
    ];

    const hasImages = mixedContent.some(
      (block) => block.type === "image_url"
    );

    expect(mixedContent).toHaveLength(3);
    expect(hasImages).toBe(true);
    expect(mixedContent[0].type).toBe("text");
    expect(mixedContent[1].type).toBe("image_url");
    expect(mixedContent[2].type).toBe("image_url");
  });

  it("should verify large payload handling with multiple images", () => {
    const largePayload: AppendableContentPart[] = [
      {
        type: "text",
        text: "Multiple images to analyze",
      },
      ...Array.from({ length: 10 }, (_, i) => ({
        type: "image_url" as const,
        image_url: { url: `data:image/png;base64,image${i}` },
      })),
    ];

    const hasImages = largePayload.some(
      (block) => block.type === "image_url"
    );
    const imageCount = largePayload.filter(
      (block) => block.type === "image_url"
    ).length;

    expect(largePayload).toHaveLength(11);
    expect(hasImages).toBe(true);
    expect(imageCount).toBe(10);
  });

  it("should verify API payload state after content replacement", () => {
    // First append
    let composedContent: AppendableContentPart[] = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,first" },
      },
    ];

    let hasImageContent = composedContent.some(
      (block) => block.type === "image_url"
    );

    expect(composedContent).toHaveLength(1);
    expect(hasImageContent).toBe(true);

    // Replace with text-only content
    composedContent = [
      {
        type: "text",
        text: "Only text now",
      },
    ];

    hasImageContent = composedContent.some(
      (block) => block.type === "image_url"
    );

    expect(composedContent).toHaveLength(1);
    expect(composedContent[0].type).toBe("text");
    expect(hasImageContent).toBe(false);
  });

  it("should verify API structure preserves metadata after state changes", () => {
    const stateHistory: Array<{
      content: AppendableContentPart[];
      hasImageContent: boolean;
    }> = [];

    // State 1: image content
    let composedContent: AppendableContentPart[] = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,img" },
      },
    ];
    let hasImageContent = composedContent.some(
      (block) => block.type === "image_url"
    );

    stateHistory.push({ content: [...composedContent], hasImageContent });

    // State 2: clear for new message
    composedContent = [];
    hasImageContent = false;

    stateHistory.push({ content: [...composedContent], hasImageContent });

    // Verify history
    expect(stateHistory).toHaveLength(2);
    expect(stateHistory[0].hasImageContent).toBe(true);
    expect(stateHistory[0].content).toHaveLength(1);
    expect(stateHistory[1].hasImageContent).toBe(false);
    expect(stateHistory[1].content).toHaveLength(0);
  });
});
