# File & Voice Attachment Feature

## Overview

The File & Voice Attachment feature enables users to enhance their chat messages with file attachments and voice input on the OtherDev Loom chat page. Files (images, documents, code) are processed client-side and sent as base64-encoded content blocks, while voice messages are transcribed using Whisper v3 Turbo. The system automatically routes requests to the appropriate Groq model based on content type.

## Features

### 1. File Attachment
- **Supported Types:**
  - Images: PNG, JPG, GIF, WebP (base64 encoded)
  - Documents: PDF (text extracted)
  - Code: JS, TS, Python, JSON, etc. (text extracted)
  - Text: TXT, MD, etc. (text extracted)

- **Limits:**
  - Max 5 images per message
  - Max 4MB base64 per image
  - Max 50MB total per message
  - Automatic validation with user-friendly error messages

- **Flow:**
  1. User clicks file attachment button
  2. Selects file(s) from system
  3. FilePreview component displays selected files
  4. User reviews and can remove files before sending
  5. Files converted to content blocks (images → base64 data URIs, documents → text)
  6. Content appended to message via `appendFileContent()` method
  7. Message sent with file content included

### 2. Voice Input
- **Capabilities:**
  - Browser-based audio recording via MediaRecorder API
  - Transcription via Whisper v3 Turbo
  - < 5 seconds transcription latency
  - User confirms transcript before sending

- **Flow:**
  1. User clicks record button
  2. Microphone access requested (browser permission)
  3. User speaks their message
  4. Click record button again to stop
  5. TranscriptPreview displays transcribed text
  6. User can send or discard
  7. If sent, appended as text content block with `[Voice Message]` prefix

### 3. Model Routing
The system automatically selects the optimal Groq model based on message content:

| Content Type | Model | Use Case |
|---|---|---|
| Text-only | `openai/gpt-oss-120b` | Fast, optimized for text reasoning |
| Images present | `meta-llama/llama-4-scout-17b-16e-instruct` | Multimodal, can analyze images |

**Detection:** Content type detected by examining message content blocks for `image_url` type entries.

## Architecture

### Client Components

#### FileAttachmentButton (`src/components/file-attachment-button.tsx`)
- Hidden file input with accept filters
- Validates file size and type
- Triggers file selection dialog
- Calls `onFilesSelected` handler

#### VoiceRecorderButton (`src/components/voice-recorder-button.tsx`)
- Toggle record/stop button
- Uses MediaRecorder API for audio capture
- Sends audio blob to `/api/transcribe` endpoint
- Calls `onTranscript` handler with transcribed text
- Handles errors with `onError` callback

#### FilePreview (`src/components/file-preview.tsx`)
- Displays list of attached files
- Shows file icon and name
- Remove button for each file
- Send Files and Clear buttons
- Shows total file count

#### TranscriptPreview (`src/components/transcript-preview.tsx`)
- Displays transcribed voice text
- Accept (Send) and Reject (Discard) buttons
- Processing state indicator
- Read-only display

### Runtime Integration

#### useOtherDevRuntime (`src/lib/use-otherdev-runtime.tsx`)
- Manages chat state and message history
- **New method: `appendFileContent(contentBlocks)`**
  - Accepts array of ContentBlock items
  - Detects if message contains images
  - Sets `hasImageContent` flag in message metadata
  - Integrates with message sending pipeline

- **State:**
  - `composedContent`: Array of file/voice content blocks awaiting send
  - `hasImageContent`: Boolean flag for model routing

### API Endpoint

#### POST `/api/chat/stream`

**Request Schema:**
```typescript
{
  messages: Array<{
    role: "user" | "assistant",
    content: string | ContentBlock[]
  }>,
  hasImageContent?: boolean
}
```

**Content Block Types:**
```typescript
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
```

**Processing:**
1. Validates `hasImageContent` flag matches actual content
2. Selects model via `selectModel(hasImageContent)`
3. Formats messages for Groq API
4. Sends to appropriate model
5. Streams response back

#### POST `/api/transcribe`

**Request:**
- FormData with audio blob (Opus/WAV format)

**Response:**
```json
{
  "transcript": "transcribed text here"
}
```

## File Processing

### Image Processing
```typescript
// Images are base64 encoded
const base64 = await encodeImageToBase64(file)
// Result: data:image/png;base64,iVBORw0KGgo...

// Formatted as content block
{
  type: "image_url",
  image_url: { url: "data:image/png;base64,..." }
}
```

### Document Processing
```typescript
// Non-image files have text extracted
const text = await file.text()
// Result: plain text content

// Formatted as content block
{
  type: "text",
  text: "[File: document.pdf]\n\n{extracted content}"
}
```

## Type System

All content block types are centralized in `src/lib/content-types.ts`:

```typescript
export type TextContentBlock = {
  type: "text";
  text: string;
};

export type ImageUrlContentBlock = {
  type: "image_url";
  image_url: { url: string };
};

export type ContentBlock = TextContentBlock | ImageUrlContentBlock;
```

This ensures type consistency across:
- Runtime (useOtherDevRuntime)
- Components (FilePreview, TranscriptPreview)
- API validation (route.ts Zod schemas)
- Helpers (formatting, routing logic)

## Error Handling

### File Upload Errors
| Error | Display | Action |
|---|---|---|
| File too large | "File exceeds 50MB limit" | Reject file |
| > 5 images | "Max 5 images per message" | Remove oldest |
| > 4MB base64 | "Image too large. Try compressing." | Offer text extract |
| Unsupported type | "File type not supported" | Reject file |
| Network error | "Failed to process file" | Retry or discard |

### Voice Recording Errors
| Error | Display | Action |
|---|---|---|
| Permission denied | "Microphone access denied. Check permissions." | User enable mic |
| Recording timeout | "Recording took too long. Try again." | Reset and retry |
| Empty recording | "Recording is empty. Please try again." | User re-record |
| Transcription failed | "Failed to transcribe. Retrying..." | Retry up to 2x |
| Network error | "Transcription service unavailable" | Discard and try later |

### API Errors
| Error | Handling |
|---|---|
| Image limit exceeded | Groq rejects; return "Too many images" error |
| Base64 size exceeded | Groq rejects; warn user and suggest text extraction |
| Invalid base64 URL | Groq rejects; return format error |
| Rate limited | 429 response; queue and retry |
| Model unavailable | 503 response; suggest trying again later |

## Configuration

### Environment Variables
```env
# RAG Configuration (optional - has defaults)
RAG_SIMILARITY_THRESHOLD=0.1       # Vector search threshold (0-1)
RAG_MATCH_COUNT=5                  # Number of documents to retrieve
RAG_MAX_MESSAGE_LENGTH=500         # Max chars per message

# Groq API (required)
GROQ_API_KEY=your-api-key
```

### API Models
```typescript
// Update model IDs if Groq releases new versions
TEXT_ONLY_MODEL = "openai/gpt-oss-120b"
IMAGE_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
```

## Testing

### Test Coverage

**Unit Tests:**
- File processor: base64 encoding, size/type validation
- Voice recorder: audio capture, blob handling
- Model router: image detection, correct model selection
- Type safety: ContentBlock schema validation

**Integration Tests:**
- File upload → preview → send flow
- Voice record → transcribe → send flow
- Mixed content (images + text + voice)
- Model routing for different content types

**Error Handling Tests:**
- File size/type validation
- Voice transcription errors
- Network failures and retries
- State management edge cases
- Concurrent operations prevention

### Running Tests
```bash
bun test src/lib/__tests__/file-processor.test.ts
bun test src/lib/__tests__/voice-recorder.test.ts
bun test src/lib/__tests__/use-otherdev-runtime.test.ts
bun test src/components/__tests__/otherdev-loom-thread.test.tsx
bun test src/app/api/chat/stream/__tests__/model-routing.test.ts
bun test src/components/__tests__/file-voice-integration.test.tsx
bun test src/lib/__tests__/file-voice-error-handling.test.ts
```

## Future Enhancements

Currently out of scope but candidates for future work:

- [ ] Text-to-speech response playback
- [ ] Streaming voice input (real-time transcription)
- [ ] File library/persistence (save past attachments)
- [ ] Video file support
- [ ] Drag-and-drop file upload
- [ ] Multiple language transcription
- [ ] File compression before sending
- [ ] Preview thumbnails for documents
- [ ] Voice message replay/download

## Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Note:** MediaRecorder API and Blob API required. Older browsers will show graceful fallback.

## Performance Considerations

- **Client-side Processing:** Files processed locally; no server storage required
- **Base64 Encoding:** ~33% size increase; acceptable for images
- **Transcription Latency:** Whisper v3 Turbo typically < 5 seconds
- **Message Size:** Total 50MB limit prevents oversized requests
- **API Limits:** Groq enforces 5 images, 4MB per image, 128K tokens

## Security Considerations

- ✅ Input sanitization on all file content
- ✅ MIME type validation prevents executable uploads
- ✅ Base64 validation prevents injection attacks
- ✅ Message length capped to prevent token limit abuse
- ✅ Rate limiting prevents transcription API abuse
- ✅ No persistent server-side file storage

## Troubleshooting

**Issue: File upload fails silently**
- Check browser console for error messages
- Verify file size < 50MB
- Ensure file type is supported
- Check network connectivity

**Issue: Voice transcription times out**
- Ensure audio quality is good
- Avoid loud background noise
- Check network latency
- Verify GROQ_API_KEY is valid

**Issue: Wrong model selected**
- Check `hasImageContent` flag in browser DevTools
- Verify images are actually included in message
- Check API request payload includes correct flag

**Issue: File not included in message**
- Verify FilePreview shows the file
- Click "Send Files" button before sending message
- Check message content includes image blocks

## Maintenance

### Updating Groq Models
If Groq releases new/better models:
1. Update model IDs in `src/app/api/chat/stream/helpers.ts`
2. Update capability documentation
3. Run integration tests to verify behavior
4. Test with both text-only and image content

### Monitoring

Key metrics to track:
- File upload success rate
- Average transcription latency
- Model routing accuracy (images vs text)
- Error rates by type
- User adoption of file/voice features

## References

- [Groq API Documentation](https://groq.com/docs)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Whisper API](https://platform.openai.com/docs/api-reference/audio)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
