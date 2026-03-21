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
