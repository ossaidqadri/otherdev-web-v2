/**
 * Shared content block types for file attachments and voice messages.
 * Used by both the runtime and API to ensure type consistency.
 */

export type TextContentBlock = {
  type: "text";
  text: string;
};

export type ImageUrlContentBlock = {
  type: "image_url";
  image_url: {
    url: string;
  };
};

/**
 * Content block type for messages containing text and/or image attachments.
 * Can be used in message content arrays to support mixed media.
 */
export type ContentBlock = TextContentBlock | ImageUrlContentBlock;

/**
 * Message content can be either a simple string (backward compatible)
 * or an array of content blocks (with file/voice attachments).
 */
export type MessageContent = string | ContentBlock[];
