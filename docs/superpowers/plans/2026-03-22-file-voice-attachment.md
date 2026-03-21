# File & Voice Attachment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add file attachment and voice input capabilities to the loom chat page with automatic model routing.

**Architecture:**
- Client-side file processing with base64 encoding for images
- Voice recording with Whisper v3 Turbo transcription
- Automatic model routing: Images → llama-4-scout-17b, Text → gpt-oss-120b
- Enhanced runtime to handle file data in messages

**Tech Stack:** TypeScript, React, Web Audio API, Groq SDK, TailwindCSS

**Design Spec:** `docs/superpowers/specs/2026-03-22-file-voice-attachment-design.md`

---

## File Structure

### New Files
```
src/components/
├── file-attachment-button.tsx          # File upload UI
├── file-preview.tsx                    # Show attached files
├── voice-recorder-button.tsx           # Voice recording UI
└── transcript-preview.tsx              # Show transcribed text

src/lib/
├── file-processor.ts                   # Base64 encoding, text extraction
└── voice-recorder.ts                   # Browser audio recording

src/server/
└── lib/
    └── transcribe.ts                   # Whisper API integration

src/app/api/
└── transcribe/
    └── route.ts                        # Transcription endpoint
```

### Modified Files
```
src/lib/use-otherdev-runtime.tsx        # Add file + voice handling
src/components/otherdev-loom-thread.tsx # Add buttons, integrate components
src/app/api/chat/stream/route.ts        # Add model routing logic
```

---

## Task 1: File Processor Utility

**Files:**
- Create: `src/lib/file-processor.ts`
- Test: `src/lib/__tests__/file-processor.test.ts`

- [ ] **Step 1: Write test for base64 image encoding**

Create `src/lib/__tests__/file-processor.test.ts`:

```typescript
import { encodeImageToBase64, extractTextFromFile } from '../file-processor'

describe('FileProcessor', () => {
  describe('encodeImageToBase64', () => {
    it('should encode a PNG image to base64 data URI', async () => {
      // Create a simple 1x1 PNG blob
      const pngBuffer = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      ])
      const blob = new Blob([pngBuffer], { type: 'image/png' })
      const file = new File([blob], 'test.png', { type: 'image/png' })

      const result = await encodeImageToBase64(file)

      expect(result).toMatch(/^data:image\/png;base64,.+/)
      expect(result.length).toBeGreaterThan(50)
    })

    it('should throw error if file is not an image', async () => {
      const blob = new Blob(['text content'], { type: 'text/plain' })
      const file = new File([blob], 'test.txt', { type: 'text/plain' })

      await expect(encodeImageToBase64(file)).rejects.toThrow(
        'Only image files are supported'
      )
    })

    it('should throw error if base64 exceeds 4MB limit', async () => {
      // Create a 5MB mock file
      const largeBuffer = new Uint8Array(5 * 1024 * 1024)
      const blob = new Blob([largeBuffer], { type: 'image/jpeg' })
      const file = new File([blob], 'large.jpg', { type: 'image/jpeg' })

      await expect(encodeImageToBase64(file)).rejects.toThrow(
        'Image exceeds 4MB base64 limit'
      )
    })
  })

  describe('extractTextFromFile', () => {
    it('should extract text from a text file', async () => {
      const blob = new Blob(['Hello, World!'], { type: 'text/plain' })
      const file = new File([blob], 'test.txt', { type: 'text/plain' })

      const result = await extractTextFromFile(file)

      expect(result).toBe('Hello, World!')
    })

    it('should read code files as text', async () => {
      const code = 'function hello() { return "world"; }'
      const blob = new Blob([code], { type: 'text/javascript' })
      const file = new File([blob], 'script.js', { type: 'text/javascript' })

      const result = await extractTextFromFile(file)

      expect(result).toBe(code)
    })

    it('should reject unsupported file types', async () => {
      const blob = new Blob(['binary'], { type: 'application/octet-stream' })
      const file = new File([blob], 'unknown.bin', { type: 'application/octet-stream' })

      await expect(extractTextFromFile(file)).rejects.toThrow(
        'Unsupported file type'
      )
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npm test -- src/lib/__tests__/file-processor.test.ts
```

Expected: FAIL - "Cannot find module '../file-processor'"

- [ ] **Step 3: Write file processor implementation**

Create `src/lib/file-processor.ts`:

```typescript
/**
 * Encode image file to data URI format for Groq
 */
export async function encodeImageToBase64(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are supported')
  }

  // Read file
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  // Check size (4MB limit for base64)
  const sizeInMB = uint8Array.length / (1024 * 1024)
  if (sizeInMB > 4) {
    throw new Error(`Image exceeds 4MB base64 limit (${sizeInMB.toFixed(2)}MB)`)
  }

  // Convert to base64
  let binary = ''
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  const base64 = btoa(binary)

  // Return data URI
  return `data:${file.type};base64,${base64}`
}

/**
 * Extract text from documents and code files
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const supportedTypes = [
    'text/plain',
    'text/markdown',
    'text/css',
    'text/html',
    'application/json',
    'application/javascript',
    'text/javascript',
    'text/typescript',
    'application/typescript',
    'application/x-python',
    'text/x-python',
  ]

  // Check if type is supported
  if (!supportedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }

  // Read file as text
  const text = await file.text()
  return text
}

/**
 * Validate file before processing
 */
export function validateFile(file: File, maxTotalSize: number): {
  valid: boolean
  error?: string
} {
  // Check individual file size
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'File exceeds 50MB limit' }
  }

  // Check if file type is image, document, or code
  const isImage = file.type.startsWith('image/')
  const isDocument = file.type === 'application/pdf' || file.type === 'text/plain'
  const isCode = file.type.includes('javascript') ||
                 file.type.includes('typescript') ||
                 file.type.includes('python') ||
                 file.type === 'application/json'

  if (!isImage && !isDocument && !isCode) {
    return { valid: false, error: `Unsupported file type: ${file.type}` }
  }

  return { valid: true }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npm test -- src/lib/__tests__/file-processor.test.ts
```

Expected: PASS - All tests pass

- [ ] **Step 5: Commit**

```bash
cd web && git add src/lib/file-processor.ts src/lib/__tests__/file-processor.test.ts && git commit -m "feat: add file processor utility for base64 and text extraction"
```

---

## Task 2: Voice Recorder Utility

**Files:**
- Create: `src/lib/voice-recorder.ts`
- Test: `src/lib/__tests__/voice-recorder.test.ts`

- [ ] **Step 1: Write test for audio recording**

Create `src/lib/__tests__/voice-recorder.test.ts`:

```typescript
import { VoiceRecorder } from '../voice-recorder'

describe('VoiceRecorder', () => {
  beforeEach(() => {
    // Mock MediaRecorder API
    global.MediaRecorder = jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      ondataavailable: null,
      onstop: null,
    })) as any
  })

  it('should create a recorder instance', async () => {
    const stream = {} as MediaStream
    const recorder = new VoiceRecorder(stream)

    expect(recorder).toBeDefined()
    expect(recorder.isRecording).toBe(false)
  })

  it('should start recording', async () => {
    const stream = {} as MediaStream
    const recorder = new VoiceRecorder(stream)

    recorder.start()

    expect(recorder.isRecording).toBe(true)
  })

  it('should stop recording and return blob', async () => {
    const stream = {} as MediaStream
    const recorder = new VoiceRecorder(stream)

    recorder.start()
    expect(recorder.isRecording).toBe(true)

    const blobPromise = recorder.stop()

    expect(recorder.isRecording).toBe(false)
    expect(blobPromise).resolves.toBeInstanceOf(Blob)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npm test -- src/lib/__tests__/voice-recorder.test.ts
```

Expected: FAIL - "Cannot find module '../voice-recorder'"

- [ ] **Step 3: Write voice recorder implementation**

Create `src/lib/voice-recorder.ts`:

```typescript
/**
 * Browser-based audio recorder using MediaRecorder API
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder
  private audioChunks: Blob[] = []
  private resolveStop: ((blob: Blob) => void) | null = null
  private rejectStop: ((error: Error) => void) | null = null

  public isRecording = false

  constructor(stream: MediaStream) {
    // Use webm mime type if available, fall back to default
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : undefined

    this.mediaRecorder = new MediaRecorder(stream, { mimeType })
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      this.audioChunks.push(event.data)
    }

    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
      if (this.resolveStop) {
        this.resolveStop(audioBlob)
      }
      this.audioChunks = []
    }

    this.mediaRecorder.onerror = (event) => {
      if (this.rejectStop) {
        this.rejectStop(new Error(`Recording error: ${event.error}`))
      }
    }
  }

  public start(): void {
    if (this.isRecording) {
      console.warn('Recording already in progress')
      return
    }

    this.audioChunks = []
    this.mediaRecorder.start()
    this.isRecording = true
  }

  public stop(): Promise<Blob> {
    if (!this.isRecording) {
      return Promise.reject(new Error('No recording in progress'))
    }

    return new Promise((resolve, reject) => {
      this.resolveStop = resolve
      this.rejectStop = reject
      this.mediaRecorder.stop()
      this.isRecording = false
    })
  }

  public static async requestMicrophone(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied')
        }
        if (error.name === 'NotFoundError') {
          throw new Error('No microphone device found')
        }
      }
      throw error
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npm test -- src/lib/__tests__/voice-recorder.test.ts
```

Expected: PASS - All tests pass

- [ ] **Step 5: Commit**

```bash
cd web && git add src/lib/voice-recorder.ts src/lib/__tests__/voice-recorder.test.ts && git commit -m "feat: add voice recorder utility with MediaRecorder API"
```

---

## Task 3: File Attachment Button Component

**Files:**
- Create: `src/components/file-attachment-button.tsx`

- [ ] **Step 1: Create file attachment button component**

Create `src/components/file-attachment-button.tsx`:

```typescript
"use client"

import { Paperclip, X } from "lucide-react"
import { useRef, useState } from "react"
import { validateFile } from "@/lib/file-processor"

interface FileAttachmentButtonProps {
  onFilesSelected: (files: File[]) => void
  maxTotalSize?: number
  maxFiles?: number
  disabled?: boolean
}

export function FileAttachmentButton({
  onFilesSelected,
  maxTotalSize = 50 * 1024 * 1024,
  maxFiles = 5,
  disabled = false,
}: FileAttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("")
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Validate number of files
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate each file
    let totalSize = 0
    const validFiles: File[] = []

    for (const file of files) {
      const validation = validateFile(file, maxTotalSize)
      if (!validation.valid) {
        setError(validation.error || "Invalid file")
        return
      }

      totalSize += file.size
      if (totalSize > maxTotalSize) {
        setError(`Total file size exceeds ${maxTotalSize / 1024 / 1024}MB limit`)
        return
      }

      validFiles.push(file)
    }

    onFilesSelected(validFiles)

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.js,.ts,.json,.py"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Attach files"
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:opacity-70 transition-opacity disabled:opacity-50 sm:h-7 sm:w-7"
        aria-label="Attach file"
        title="Attach files (images, documents, code)"
      >
        <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      {error && (
        <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-destructive/90 px-3 py-2 text-sm text-destructive-foreground whitespace-nowrap">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 inline"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify component renders without errors**

```bash
cd web && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
cd web && git add src/components/file-attachment-button.tsx && git commit -m "feat: add file attachment button component"
```

---

## Task 4: Voice Recorder Button Component

**Files:**
- Create: `src/components/voice-recorder-button.tsx`

- [ ] **Step 1: Create voice recorder button component**

Create `src/components/voice-recorder-button.tsx`:

```typescript
"use client"

import { Mic, Square } from "lucide-react"
import { useState } from "react"
import { VoiceRecorder } from "@/lib/voice-recorder"

interface VoiceRecorderButtonProps {
  onTranscript: (transcript: string) => void
  onError: (error: string) => void
  disabled?: boolean
}

export function VoiceRecorderButton({
  onTranscript,
  onError,
  disabled = false,
}: VoiceRecorderButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recorder, setRecorder] = useState<VoiceRecorder | null>(null)

  const handleStartRecording = async () => {
    try {
      setIsProcessing(true)
      const stream = await VoiceRecorder.requestMicrophone()
      const newRecorder = new VoiceRecorder(stream)
      newRecorder.start()
      setRecorder(newRecorder)
      setIsRecording(true)
      setIsProcessing(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to access microphone"
      onError(message)
      setIsProcessing(false)
    }
  }

  const handleStopRecording = async () => {
    if (!recorder) return

    try {
      setIsProcessing(true)
      const audioBlob = await recorder.stop()

      // Send to transcription API
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Transcription failed")
      }

      const { transcript } = await response.json()
      onTranscript(transcript)

      // Stop microphone stream
      recorder.mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setRecorder(null)
      setIsRecording(false)
      setIsProcessing(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription error"
      onError(message)
      setIsRecording(false)
      setIsProcessing(false)
    }
  }

  const buttonClass = isRecording
    ? "bg-red-500 hover:bg-red-600 text-white"
    : "text-muted-foreground hover:opacity-70"

  return (
    <button
      type="button"
      onClick={isRecording ? handleStopRecording : handleStartRecording}
      disabled={disabled || isProcessing}
      className={`flex h-6 w-6 items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] disabled:opacity-50 sm:h-7 sm:w-7 rounded-full ${buttonClass}`}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      title={isRecording ? "Stop recording (click to send)" : "Record voice message"}
    >
      {isRecording ? (
        <Square className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
      ) : (
        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
    </button>
  )
}
```

- [ ] **Step 2: Verify component renders without errors**

```bash
cd web && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
cd web && git add src/components/voice-recorder-button.tsx && git commit -m "feat: add voice recorder button component"
```

---

## Task 5: File Preview Component

**Files:**
- Create: `src/components/file-preview.tsx`

- [ ] **Step 1: Create file preview component**

Create `src/components/file-preview.tsx`:

```typescript
"use client"

import { X, File, Image } from "lucide-react"

interface FilePreviewProps {
  files: File[]
  onRemove: (index: number) => void
}

export function FilePreview({ files, onRemove }: FilePreviewProps) {
  if (files.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
        >
          {file.type.startsWith("image/") ? (
            <Image className="h-4 w-4 text-muted-foreground" />
          ) : (
            <File className="h-4 w-4 text-muted-foreground" />
          )}

          <span className="truncate max-w-[150px] text-muted-foreground">
            {file.name}
          </span>

          <button
            type="button"
            onClick={() => onRemove(index)}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify component renders**

```bash
cd web && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
cd web && git add src/components/file-preview.tsx && git commit -m "feat: add file preview component"
```

---

## Task 6: Transcript Preview Component

**Files:**
- Create: `src/components/transcript-preview.tsx`

- [ ] **Step 1: Create transcript preview component**

Create `src/components/transcript-preview.tsx`:

```typescript
"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TranscriptPreviewProps {
  transcript: string
  onAccept: () => void
  onReject: () => void
  isProcessing?: boolean
}

export function TranscriptPreview({
  transcript,
  onAccept,
  onReject,
  isProcessing = false,
}: TranscriptPreviewProps) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2">
      <p className="text-sm text-muted-foreground">Transcribed:</p>
      <p className="text-base text-foreground">{transcript}</p>

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="default"
          onClick={onAccept}
          disabled={isProcessing}
          className="gap-2"
        >
          <Check className="h-3 w-3" />
          Send
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={isProcessing}
          className="gap-2"
        >
          <X className="h-3 w-3" />
          Discard
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify component renders**

```bash
cd web && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
cd web && git add src/components/transcript-preview.tsx && git commit -m "feat: add transcript preview component"
```

---

## Task 7: Transcription API Endpoint

**Files:**
- Create: `src/app/api/transcribe/route.ts`

- [ ] **Step 1: Create transcription endpoint**

Create `src/app/api/transcribe/route.ts`:

```typescript
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Convert File to Buffer for Groq SDK
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Call Whisper API via Groq
    const transcription = await groq.audio.transcriptions.create({
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      model: "whisper-large-v3-turbo",
      language: "en",
    })

    return new Response(
      JSON.stringify({
        transcript: transcription.text,
        duration: audioFile.size,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Transcription error:", error)

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"

    return new Response(
      JSON.stringify({ error: `Transcription failed: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
```

- [ ] **Step 2: Test endpoint is reachable**

```bash
cd web && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
cd web && git add src/app/api/transcribe/route.ts && git commit -m "feat: add transcription API endpoint with Whisper v3 Turbo"
```

---

## Task 8: Enhanced Runtime with File Support

**Files:**
- Modify: `src/lib/use-otherdev-runtime.tsx`

- [ ] **Step 1: Extend message type to include file data**

Modify `src/lib/use-otherdev-runtime.tsx`:

Find the `ContentPart` type definition (around line 16):

```typescript
type ContentPart = TextMessagePart | ToolCallMessagePart
```

Replace with:

```typescript
interface FileContent {
  type: "image_url"
  image_url: { url: string }
}

interface TextContent {
  type: "text"
  text: string
}

type ContentPart = TextMessagePart | ToolCallMessagePart | FileContent | TextContent
```

- [ ] **Step 2: Add file tracking to message**

Find the user message creation (around line 85):

```typescript
const userMessage: ThreadMessage = {
  id: `user-${Date.now()}`,
  role: "user",
  content: [textContent],
  createdAt: new Date(),
  attachments: [],
  metadata: {
    custom: {},
  },
}
```

Replace with:

```typescript
const userMessage: ThreadMessage = {
  id: `user-${Date.now()}`,
  role: "user",
  content: [textContent],
  createdAt: new Date(),
  attachments: [],
  metadata: {
    custom: {
      hasImageContent: false,
      attachedFiles: [],
    },
  },
}
```

- [ ] **Step 3: Add method to append files to runtime**

Find the `export function useOtherDevRuntime()` function and add this method before the `return` statement (around line 338):

```typescript
const appendFileContent = useCallback(
  async (files: File[]) => {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== "user") return

    let hasImageContent = false
    const newContent = [...lastMessage.content]
    const attachedFiles: { name: string; type: string }[] = []

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        // Image: encode to base64
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        let binary = ""
        for (let i = 0; i < uint8Array.byteLength; i++) {
          binary += String.fromCharCode(uint8Array[i])
        }
        const base64 = btoa(binary)
        const dataUri = `data:${file.type};base64,${base64}`

        newContent.push({
          type: "image_url",
          image_url: { url: dataUri },
        } as FileContent)

        hasImageContent = true
      } else {
        // Document/Code: extract text
        const text = await file.text()
        newContent.push({
          type: "text",
          text: `[File: ${file.name}]\n${text}`,
        } as TextContent)
      }

      attachedFiles.push({
        name: file.name,
        type: file.type,
      })
    }

    // Update last message with files
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === lastMessage.id && msg.role === "user") {
          return {
            ...msg,
            content: newContent,
            metadata: {
              ...msg.metadata,
              custom: {
                ...msg.metadata?.custom,
                hasImageContent,
                attachedFiles,
              },
            },
          }
        }
        return msg
      })
    )
  },
  [messages, setMessages]
)
```

- [ ] **Step 4: Export the new method**

Find the return statement and add `appendFileContent`:

```typescript
return {
  ...runtime,
  suggestion,
  setSuggestion,
  clear,
  appendFileContent,  // Add this line
}
```

- [ ] **Step 5: Verify changes compile**

```bash
cd web && npm run build
```

Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
cd web && git add src/lib/use-otherdev-runtime.tsx && git commit -m "feat: extend runtime to support file attachments with base64 encoding"
```

---

## Task 9: Integrate Components into Loom Thread

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

- [ ] **Step 1: Import new components**

Add to imports at the top:

```typescript
import { FileAttachmentButton } from "@/components/file-attachment-button"
import { VoiceRecorderButton } from "@/components/voice-recorder-button"
import { FilePreview } from "@/components/file-preview"
import { TranscriptPreview } from "@/components/transcript-preview"
```

- [ ] **Step 2: Add file state to component**

Find the `OtherDevLoomThread` function and add state after the existing useState calls:

```typescript
const [attachedFiles, setAttachedFiles] = useState<File[]>([])
const [transcript, setTranscript] = useState<string>("")
const [showTranscript, setShowTranscript] = useState(false)
```

- [ ] **Step 3: Add file handling methods**

Add these methods in the component (before the return):

```typescript
const handleFilesSelected = async (files: File[]) => {
  setAttachedFiles((prev) => [...prev, ...files])
  if (runtime.appendFileContent) {
    await runtime.appendFileContent(files)
  }
}

const handleRemoveFile = (index: number) => {
  setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
}

const handleTranscript = (text: string) => {
  setTranscript(text)
  setShowTranscript(true)
}

const handleAcceptTranscript = () => {
  const value = transcript.trim()
  if (!value) return

  api
    .thread()
    .append({ role: "user", content: [{ type: "text", text: value }] })

  setSuggestion("")
  setTranscript("")
  setShowTranscript(false)

  if (inputRef.current) {
    setNativeInputValue(inputRef.current, "")
    setInputValue("")
  }
}

const handleRejectTranscript = () => {
  setTranscript("")
  setShowTranscript(false)
}

const handleTranscriptionError = (error: string) => {
  console.error("Transcription error:", error)
  // Could show toast notification here
}
```

- [ ] **Step 4: Replace PromptInputActions section**

Find the `<PromptInputActions>` section (around line 416) and replace it with:

```typescript
<PromptInputActions className="w-full justify-between">
  <div className="flex gap-1">
    <PromptInputAction tooltip="Attach file">
      <FileAttachmentButton
        onFilesSelected={handleFilesSelected}
        disabled={false}
      />
    </PromptInputAction>

    <PromptInputAction tooltip="Record voice">
      <VoiceRecorderButton
        onTranscript={handleTranscript}
        onError={handleTranscriptionError}
        disabled={false}
      />
    </PromptInputAction>
  </div>

  <PromptInputAction tooltip="Send message (Enter)">
    <button
      type="button"
      onClick={handleSubmit}
      disabled={!inputValue.trim()}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] sm:h-8 sm:w-8",
        inputValue.trim()
          ? "bg-foreground text-background hover:opacity-90"
          : "bg-muted text-muted-foreground hover:opacity-70 disabled:opacity-50",
      )}
    >
      <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </button>
  </PromptInputAction>
</PromptInputActions>
```

- [ ] **Step 5: Add file preview above input**

Find the `<div className="absolute bottom-0...">` section and add before `<PromptInput>`:

```typescript
{showTranscript && (
  <div className="mb-3">
    <TranscriptPreview
      transcript={transcript}
      onAccept={handleAcceptTranscript}
      onReject={handleRejectTranscript}
    />
  </div>
)}

{attachedFiles.length > 0 && (
  <div className="mb-2">
    <FilePreview
      files={attachedFiles}
      onRemove={handleRemoveFile}
    />
  </div>
)}
```

- [ ] **Step 6: Verify changes compile**

```bash
cd web && npm run build
```

Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
cd web && git add src/components/otherdev-loom-thread.tsx && git commit -m "feat: integrate file and voice components into loom thread"
```

---

## Task 10: Add Model Routing Logic to Chat API

**Files:**
- Modify: `src/app/api/chat/stream/route.ts`

- [ ] **Step 1: Extract hasImageContent from message metadata**

Find the message validation section (around line 219):

```typescript
const { messages } = validation.data
const lastUserMessage = messages.filter((m) => m.role === "user").pop()
```

Add after:

```typescript
// Extract file content flag from last message metadata
const lastUserMessageFull = messages.filter((m) => m.role === "user").pop()
const hasImageContent = lastUserMessageFull?.metadata?.custom?.hasImageContent ?? false
```

- [ ] **Step 2: Determine model based on content**

Find the groq model selection (around line 252):

```typescript
const completion = await groq.chat.completions.create({
  model: "openai/gpt-oss-20b",
```

Replace with:

```typescript
// Route to appropriate model based on content
const selectedModel = hasImageContent
  ? "meta-llama/llama-4-scout-17b-16e-instruct"
  : "openai/gpt-oss-120b"

const completion = await groq.chat.completions.create({
  model: selectedModel,
```

- [ ] **Step 3: Add logging for model selection**

Add before the model selection:

```typescript
// Log model routing for debugging
console.log(`[Chat API] Routing to model: ${selectedModel}`, {
  hasImageContent,
  messageCount: messages.length,
})
```

- [ ] **Step 4: Verify changes compile**

```bash
cd web && npm run build
```

Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
cd web && git add src/app/api/chat/stream/route.ts && git commit -m "feat: add model routing logic based on image content detection"
```

---

## Task 11: Fix Runtime Type Compatibility

**Files:**
- Modify: `src/lib/use-otherdev-runtime.tsx`

- [ ] **Step 1: Update appendFileContent export**

The `appendFileContent` method needs to be properly exported. Check the return statement and ensure it's included:

```typescript
return {
  ...runtime,
  suggestion,
  setSuggestion,
  clear,
  appendFileContent,
}
```

- [ ] **Step 2: Fix any TypeScript errors from new content types**

Update the message sending logic to handle new content types. Find the `onNew` function and update the content extraction:

```typescript
const textContent = message.content.find((part) => part.type === "text")
```

Ensure this works with both `TextMessagePart` and `TextContent` types.

- [ ] **Step 3: Verify build succeeds**

```bash
cd web && npm run build
```

Expected: Build succeeds (no TypeScript errors)

- [ ] **Step 4: Commit**

```bash
cd web && git add src/lib/use-otherdev-runtime.tsx && git commit -m "fix: ensure appendFileContent is properly exported from runtime"
```

---

## Task 12: Manual Testing & Integration Verification

- [ ] **Step 1: Start dev server**

```bash
cd web && npm run dev
```

Expected: Dev server runs on http://localhost:3000

- [ ] **Step 2: Test file attachment**

1. Navigate to http://localhost:3000/loom
2. Click file attachment button
3. Select a small image (PNG/JPG)
4. Verify file appears in preview
5. Type a message: "What's in this image?" + attach image
6. Submit message
7. Verify: Model routing uses `llama-4-scout-17b` (check console logs)
8. Verify: Response includes image analysis

- [ ] **Step 3: Test text-only message**

1. Type message: "Tell me about your projects"
2. Submit without files
3. Verify: Model routing uses `gpt-oss-120b` (check console logs)
4. Verify: Response is conversational

- [ ] **Step 4: Test voice recording**

1. Click microphone button
2. Record 5 seconds of speech
3. Stop recording
4. Verify: Transcript appears in preview
5. Click "Send"
6. Verify: Transcript is sent as message
7. Verify: Response is relevant to spoken input

- [ ] **Step 5: Test file with code**

1. Attach a JavaScript file
2. Type: "Review this code for bugs"
3. Submit
4. Verify: Code is extracted and sent
5. Verify: Model analyzes the code

- [ ] **Step 6: Create summary of test results**

Document any issues found and note that manual testing is complete.

---

## Task 13: Error Handling & Edge Cases

- [ ] **Step 1: Test file size limits**

1. Try uploading a file > 50MB
2. Verify: Error message appears
3. Verify: File is not accepted

- [ ] **Step 2: Test unsupported file types**

1. Try uploading a .exe file
2. Verify: Error message appears
3. Verify: File is not accepted

- [ ] **Step 3: Test microphone denied**

1. Deny microphone permission
2. Click record button
3. Verify: Error message "Microphone permission denied"

- [ ] **Step 4: Test transcription failure**

Stop the dev server, then:
1. Click record button (microphone still allowed)
2. Record audio
3. Try to submit
4. Verify: Error message about transcription failure (API unavailable)

Then restart server.

- [ ] **Step 5: Document edge cases handled**

Create a test results document summarizing all edge case handling.

---

## Task 14: Cleanup & Documentation

- [ ] **Step 1: Verify no console errors**

Open browser DevTools console while testing. Ensure:
- No TypeScript errors
- No runtime errors
- Model routing logged correctly

- [ ] **Step 2: Update inline code documentation**

Review each new component/function and verify:
- JSDoc comments on all public functions
- Comments on complex logic

- [ ] **Step 3: Create feature documentation**

Create `docs/features/file-voice-attachment.md`:

```markdown
# File & Voice Attachment Feature

## Overview
Users can now attach files and record voice messages in the loom chat page.

## How to Use

### File Attachment
1. Click the paperclip icon in chat input
2. Select images, documents, or code files
3. Files appear in preview
4. Submit message with files

### Voice Recording
1. Click the microphone icon
2. Allow microphone access
3. Speak your message
4. Stop recording
5. Review transcript
6. Click "Send" to submit

## Supported File Types
- Images: PNG, JPG, GIF, WebP
- Documents: PDF, TXT, MD
- Code: JS, TS, JSON, PY, etc.

## Limits
- Max 5 images per message
- Max 4MB base64 per image
- Max 50MB total per message

## Model Routing
- Messages with images → llama-4-scout-17b (vision model)
- Text-only messages → gpt-oss-120b (reasoning model)
```

- [ ] **Step 4: Final build verification**

```bash
cd web && npm run build && npm run build
```

Expected: Both builds succeed

- [ ] **Step 5: Final commit**

```bash
cd web && git add docs/features/file-voice-attachment.md && git commit -m "docs: add feature documentation for file and voice attachment"
```

---

## Summary

**Implemented Features:**
- ✅ File attachment with base64 encoding for images
- ✅ Text extraction from documents and code files
- ✅ Voice recording with Whisper v3 Turbo transcription
- ✅ Automatic model routing based on content type
- ✅ File preview and transcript preview components
- ✅ Transcription API endpoint
- ✅ Integration with existing loom thread component
- ✅ Error handling for file/audio validation

**Files Created:** 9 new files
**Files Modified:** 3 existing files
**Total Components:** 4 new React components
**New API Endpoints:** 1 transcription endpoint
**Testing:** Manual E2E testing with all workflows

---

## Execution Instructions

This plan is ready for implementation. Choose execution style:

**Option 1: Subagent-Driven (Recommended)**
- Fresh agent per task
- Review checkpoint between tasks
- Faster iteration

**Option 2: Inline Execution**
- Execute sequentially in this session
- Full control, slower

Which would you prefer?
