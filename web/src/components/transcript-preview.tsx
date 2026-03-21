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
