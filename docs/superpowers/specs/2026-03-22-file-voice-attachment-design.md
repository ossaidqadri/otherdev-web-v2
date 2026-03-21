# File & Voice Attachment Feature Design

**Date:** 2026-03-22
**Project:** OtherDev Loom Page Enhancement
**Status:** Approved for Implementation

---

## Overview

Add file attachment and voice input capabilities to the loom chat page, enabling users to upload documents/images and record voice messages. Files are processed client-side with base64 encoding. Voice is transcribed using Whisper v3 Turbo. Responses are routed to the appropriate Groq model based on content type.

## Requirements

### Functional Requirements

1. **File Attachment**
   - Users can attach files via button in chat input
   - Support: Images (PNG, JPG, GIF, WebP), PDFs, code files, text documents
   - Max 5 images per message, 50MB total per message
   - Automatic base64 encoding for images
   - Text extraction for documents/code files
   - Files automatically included as context in next message

2. **Voice Input**
   - Record button in chat input area
   - Browser-based audio capture (MediaRecorder API)
   - Transcription via Whisper v3 Turbo API
   - Show transcript to user for confirmation before sending
   - Transcribed text treated as normal message

3. **Model Routing**
   - Images detected → Use `llama-4-scout-17b` (vision model)
   - Text-only queries → Use `gpt-oss-120b` (reasoning model)
   - Automatically determined based on message content

### Non-Functional Requirements

- File processing happens on client (no server storage)
- Voice transcription latency < 5 seconds
- Support for at least 50MB file attachment per session
- Graceful handling of Groq API limits (5 images, 4MB base64, 128K tokens)

---

## Architecture

### Frontend Components

#### New UI Components
- **FileAttachmentButton** - Button to trigger file upload dialog
- **VoiceRecorderButton** - Record/stop voice input control
- **FilePreview** - Show attached files before sending
- **TranscriptPreview** - Show transcribed text for confirmation
- **FileErrorBoundary** - Handle file processing errors

#### Enhanced Runtime
- **FileProcessor** - Handle base64 encoding, text extraction
- **VoiceRecorder** - Manage browser audio recording
- **MessageBuilder** - Combine text + files into Groq message format

### Backend Endpoints

#### Enhanced: `/api/chat/stream`
- Accept file data in message content
- Route to correct model based on `hasImageContent` flag
- Format content blocks for Groq API

#### New: `/api/transcribe`
- Accept audio blob (Opus/WAV)
- Call Whisper v3 Turbo
- Return transcript text

### Data Flow

```
User Action
  ↓
1. File Upload → FileProcessor → Base64 encode
   OR Voice Record → VoiceRecorder → /api/transcribe → Get transcript
  ↓
2. Combine: text + files → MessageBuilder
  ↓
3. Detect content type:
   - Has image? → flag: hasImageContent = true
   - Otherwise → flag: hasImageContent = false
  ↓
4. POST to /api/chat/stream with:
   {
     messages: [...],
     hasImageContent: boolean
   }
  ↓
5. Backend:
   - Router: If hasImageContent → use llama-4-scout-17b
   - Otherwise → use gpt-oss-120b
   - Format message for Groq
  ↓
6. Stream response back
```

---

## Implementation Details

### File Attachment

**Supported File Types:**
- Images: PNG, JPG, GIF, WebP (base64 encoded)
- Documents: PDF (text extracted)
- Code: JS, TS, Python, JSON, etc. (read as text)
- Text: TXT, MD, etc. (read as text)

**Processing:**
```typescript
// Images
if (file.type.startsWith('image/')) {
  const base64 = await toBase64(file)
  // Check 4MB limit
  // Create: { type: 'image_url', image_url: { url: `data:${type};base64,${base64}` } }
}

// Documents/Code
else {
  const text = await file.text()
  // Create: { type: 'text', text: text }
}
```

**Limits:**
- Max 5 images per request (Groq limit)
- Max 4MB base64 per image (warn user)
- Max 50MB total per message
- Validate MIME types

### Voice Transcription

**Flow:**
1. User clicks record button
2. `MediaRecorder` captures audio stream
3. On stop: Send blob to `/api/transcribe`
4. Whisper v3 Turbo processes
5. Show transcript for confirmation
6. User submits → goes to chat as text message

**Implementation:**
```typescript
const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
const chunks = []
mediaRecorder.ondataavailable = e => chunks.push(e.data)
mediaRecorder.onstop = async () => {
  const blob = new Blob(chunks, { type: 'audio/webm' })
  const formData = new FormData()
  formData.append('audio', blob)
  const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
  const { transcript } = await response.json()
  // Show transcript for confirmation
}
```

### Model Routing

**In Runtime (client-side):**
```typescript
const hasImageContent = message.content.some(c => c.type === 'image_url')
api.thread().append({
  role: 'user',
  content: messageContent,
  metadata: { hasImageContent }
})
```

**In Backend (/api/chat/stream):**
```typescript
const { messages, metadata } = body
const hasImageContent = metadata?.hasImageContent ?? false

const model = hasImageContent
  ? 'meta-llama/llama-4-scout-17b-16e-instruct'
  : 'openai/gpt-oss-120b'

const completion = await groq.chat.completions.create({
  model,
  messages: formatForGroq(messages),
  // ... rest of config
})
```

---

## Groq API Format

### Image in Message
```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "What's in this image?"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      }
    }
  ]
}
```

### Document as Text
```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "Analyze this code:\n\n" + fileContent
    }
  ]
}
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| File > 4MB (base64) | Warn user, offer text extraction |
| File > 50MB total | Reject with message |
| > 5 images | Show warning, remove oldest |
| Transcription timeout | Retry up to 2x, then error |
| Groq API error | Show "Connection failed" message |
| Unsupported file type | Reject gracefully |

---

## Testing Strategy

### Unit Tests
- File processor: base64 encoding, text extraction
- Model router: correctly identifies image content
- Voice recorder: captures and encodes audio

### Integration Tests
- Upload image + text → llama-4-scout response
- Upload code file → gpt-oss-120b response
- Record voice → transcription → correct response

### E2E Tests
- Full workflow: File + voice + text → correct model → proper response

---

## Constraints & Limits

- **Groq Image Limit:** 5 images per request
- **Base64 Size:** 4MB per image (33MP resolution max)
- **Total Payload:** 50MB per message (user-imposed)
- **Whisper Processing:** ~1-5 seconds per audio
- **Token Limits:** gpt-oss-120b (128K), scout (131K)
- **Browser Audio:** MediaRecorder API compatibility

---

## Future Enhancements (Out of Scope)

- Text-to-speech response playback
- Streaming voice input (real-time transcription)
- File library/persistence
- Video file support
- Drag-and-drop file upload
- Multiple language transcription

---

## Success Criteria

✅ Users can attach files (images, documents, code)
✅ Files automatically included as context
✅ Users can record voice messages
✅ Voice transcribed and sent as text
✅ Model automatically routed based on content
✅ All Groq API limits enforced gracefully
✅ Error messages are clear and actionable
✅ Feature works on desktop browsers (Chrome, Firefox, Safari)
