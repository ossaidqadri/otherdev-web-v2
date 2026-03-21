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
