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
