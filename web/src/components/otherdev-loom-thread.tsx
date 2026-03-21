"use client";

import {
  ThreadPrimitive,
  MessagePrimitive,
  useAssistantApi,
  AssistantIf,
  useMessage,
} from "@assistant-ui/react";
import type { ToolCallMessagePart } from "@assistant-ui/react";
import { ArrowUp, FileCode2, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { useArtifact, useRuntimeContext } from "@/app/loom/page";
import { CREATE_ARTIFACT_TOOL_NAME } from "@/server/lib/artifact-tool";
import { SUGGESTED_PROMPTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FileAttachmentButton } from "@/components/file-attachment-button";
import { VoiceRecorderButton } from "@/components/voice-recorder-button";
import { FilePreview } from "@/components/file-preview";
import { TranscriptPreview } from "@/components/transcript-preview";
import {
  encodeImageToBase64,
  extractTextFromFile,
} from "@/lib/file-processor";

type ContentBlock =
  | { type: "image_url"; image_url: { url: string } }
  | { type: "text"; text: string };

function cleanSuggestionMarkers(content: string): string {
  return content.replace(/\s*SUGGESTION:[\s\S]*$/i, "").trim();
}

function ReasoningCollapsible({ reasoning }: { reasoning: string }) {
  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center gap-1 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground group">
        <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
        <span>View thinking process</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="prose prose-sm max-w-full break-words rounded-xl border border-border bg-muted/50 p-3 font-sans text-xs leading-relaxed text-muted-foreground dark:prose-invert sm:p-4 sm:text-sm">
          <MarkdownRenderer>{reasoning}</MarkdownRenderer>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SuggestionButton({
  display,
  prompt,
}: {
  display: string;
  prompt: string;
}) {
  const api = useAssistantApi();

  const handleClick = () => {
    api
      .thread()
      .append({ role: "user", content: [{ type: "text", text: prompt }] });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className="h-auto justify-start rounded-xl bg-card p-3 text-left font-sans text-xs font-normal text-foreground shadow-sm transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:shadow-md active:scale-[0.98] sm:p-4 sm:text-sm whitespace-normal break-words"
    >
      {display}
    </Button>
  );
}

function UserMessage() {
  return (
    <div className="flex justify-end">
      <Message className="max-w-[95%] gap-2 sm:max-w-[85%] sm:gap-3 md:max-w-[80%]">
        <MessageContent className="rounded-2xl bg-accent px-3 py-2 text-sm text-accent-foreground sm:px-4 sm:py-3 sm:text-base">
          <MessagePrimitive.Content />
        </MessageContent>
        <MessageAvatar
          src="/loom-avatar.svg"
          alt="User"
          fallback="U"
          className="h-12 w-12"
        />
      </Message>
    </div>
  );
}

function AssistantMessage() {
  const message = useMessage();
  const { setActiveArtifact } = useArtifact();
  const contentRef = useRef<HTMLDivElement>(null);

  const textPart = message.content.find((part) => part.type === "text");
  const toolCallPart = message.content.find(
    (part) => part.type === "tool-call",
  ) as ToolCallMessagePart | undefined;
  const reasoning = message.metadata?.custom?.reasoning as string | undefined;
  const hasToolCall = Boolean(toolCallPart);

  const cleanedText =
    textPart?.type === "text" ? cleanSuggestionMarkers(textPart.text) : "";

  const getHtmlContent = () => {
    if (contentRef.current) {
      return contentRef.current.innerHTML;
    }
    return undefined;
  };

  if (hasToolCall && toolCallPart) {
    const artifactArgs = toolCallPart.args as
      | { title: string; description: string }
      | undefined;

    return (
      <div className="flex justify-start">
        <Message className="w-full max-w-full gap-2 sm:gap-3 lg:max-w-5xl">
          <MessageAvatar
            src="/otherdev-chat-logo.svg"
            alt="OtherDev Loom"
            className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
          />
          <div className="flex-1 space-y-3 min-w-0">
            {reasoning && <ReasoningCollapsible reasoning={reasoning} />}
            {cleanedText && (
              <div ref={contentRef}>
                <MessageContent
                  markdown
                  className="max-w-none rounded-lg bg-transparent p-0"
                >
                  {cleanedText}
                </MessageContent>
              </div>
            )}
            {toolCallPart.toolName === CREATE_ARTIFACT_TOOL_NAME && (
              <Card
                onClick={() => setActiveArtifact(toolCallPart)}
                className="w-full max-w-md cursor-pointer border-border/60 bg-card/50 transition-all duration-200 hover:border-foreground/20 hover:bg-card/80 hover:shadow-sm active:scale-[0.99]"
              >
                <CardHeader className="flex-row items-center justify-between gap-4 p-3.5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted/50">
                      <FileCode2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm font-medium leading-tight">
                        {artifactArgs?.title || "View Artifact"}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        Artifact · HTML
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
                </CardHeader>
              </Card>
            )}
          </div>
        </Message>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <Message className="w-full max-w-full gap-2 sm:gap-3 lg:max-w-5xl">
        <AssistantIf
          condition={({ message }) => message.status?.type !== "running"}
        >
          <MessageAvatar
            src="/otherdev-chat-logo.svg"
            alt="OtherDev Loom"
            className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
          />
        </AssistantIf>
        <AssistantIf
          condition={({ message }) => message.status?.type === "running"}
        >
          <div className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
        </AssistantIf>
        <div className="flex-1 space-y-2 min-w-0">
          {reasoning && <ReasoningCollapsible reasoning={reasoning} />}
          {cleanedText && (
            <div ref={contentRef}>
              <MessageContent
                markdown
                className="max-w-none rounded-lg bg-transparent p-0"
              >
                {cleanedText}
              </MessageContent>
            </div>
          )}
          <AssistantIf condition={({ thread }) => !thread.isRunning}>
            {cleanedText && (
              <CopyButton
                content={cleanedText}
                htmlContent={getHtmlContent()}
                copyMessage="Copied response to clipboard"
              />
            )}
          </AssistantIf>
        </div>
      </Message>
    </div>
  );
}

function setNativeInputValue(input: HTMLTextAreaElement, value: string): void {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

export function OtherDevLoomThread() {
  const { suggestion, setSuggestion, appendFileContent } = useRuntimeContext();
  const api = useAssistantApi();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [fileError, setFileError] = useState("");

  const handleFilesSelected = async (files: File[]) => {
    try {
      setFileError("");
      setIsProcessingFiles(true);
      setAttachedFiles(files);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process files";
      setFileError(message);
      setAttachedFiles([]);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFilesSubmit = async () => {
    if (attachedFiles.length === 0) return;

    try {
      setIsProcessingFiles(true);
      const contentBlocks: ContentBlock[] = [];

      for (const file of attachedFiles) {
        if (file.type.startsWith("image/")) {
          const dataUri = await encodeImageToBase64(file);
          contentBlocks.push({
            type: "image_url",
            image_url: { url: dataUri },
          });
        } else {
          const text = await extractTextFromFile(file);
          contentBlocks.push({
            type: "text",
            text: `[File: ${file.name}]\n${text}`,
          });
        }
      }

      appendFileContent(contentBlocks);
      setAttachedFiles([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process files";
      setFileError(message);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleTranscriptReceived = (text: string) => {
    setTranscript(text);
  };

  const handleTranscriptAccept = async () => {
    if (!transcript) return;

    try {
      const contentBlocks: ContentBlock[] = [
        {
          type: "text",
          text: `[Voice Message] ${transcript}`,
        },
      ];

      appendFileContent(contentBlocks);
      setTranscript("");
      setFileError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send voice message";
      setFileError(message);
    }
  };

  const handleTranscriptReject = () => {
    setTranscript("");
  };

  const handleRecorderError = (error: string) => {
    setFileError(error);
  };

  const handleSubmit = () => {
    const value = inputRef.current?.value?.trim();
    if (!value) return;

    api
      .thread()
      .append({ role: "user", content: [{ type: "text", text: value }] });

    setSuggestion("");

    if (inputRef.current) {
      setNativeInputValue(inputRef.current, "");
      setInputValue("");
    }
  };

  const applySuggestion = () => {
    if (!inputRef.current || !suggestion) return;

    setNativeInputValue(inputRef.current, suggestion);
    setSuggestion("");
    inputRef.current.focus();
  };

  useEffect(() => {
    const inputElement = inputRef.current;
    if (!inputElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const shouldApplySuggestion =
        (e.key === "Tab" || e.key === "ArrowRight") &&
        suggestion &&
        !inputElement.value;

      if (shouldApplySuggestion) {
        e.preventDefault();
        setNativeInputValue(inputElement, suggestion);
        setSuggestion("");
      }
    };

    const handleInput = () => {
      const value = inputElement.value || "";
      setInputValue(value);
      if (value && suggestion) {
        setSuggestion("");
      }
    };

    inputElement.addEventListener("keydown", handleKeyDown);
    inputElement.addEventListener("input", handleInput);

    return () => {
      inputElement.removeEventListener("keydown", handleKeyDown);
      inputElement.removeEventListener("input", handleInput);
    };
  }, [suggestion, setSuggestion]);

  const placeholder = suggestion || "Type your message...";

  return (
    <div className="relative h-full flex flex-col bg-background">
      <ChatContainerRoot className="flex-1 w-full">
        <ChatContainerContent
          className="flex-1 scroll-smooth pb-32 sm:pb-40"
          suppressHydrationWarning
        >
          <ThreadPrimitive.Empty>
            <div className="flex h-full items-center justify-center p-4 sm:p-6 md:p-8">
              <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
                <div className="space-y-3 text-center sm:space-y-4">
                  <div className="flex justify-center">
                    <Image
                      src="/otherdev-chat-logo.svg"
                      alt="OtherDev Loom"
                      width={32}
                      height={32}
                      className="h-7 w-7 sm:h-8 sm:w-8"
                    />
                  </div>
                  <h2 className="font-sans text-2xl font-normal text-foreground sm:text-3xl md:text-4xl">
                    How can I help you today?
                  </h2>
                  <p className="font-sans text-sm text-muted-foreground sm:text-base">
                    Ask me anything about OtherDev
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {SUGGESTED_PROMPTS.map((suggestion) => (
                    <SuggestionButton
                      key={suggestion.label}
                      display={suggestion.label}
                      prompt={suggestion.prompt}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ThreadPrimitive.Empty>

          <div className="space-y-4 px-3 py-6 sm:space-y-6 sm:px-4 sm:py-8 md:px-8">
            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />

            <ThreadPrimitive.If running>
              <div className="flex items-start gap-2 sm:gap-3">
                <Image
                  src="/otherdev-chat-logo.svg"
                  alt="OtherDev Loom"
                  width={32}
                  height={32}
                  className="h-7 w-7 flex-shrink-0 animate-spin sm:h-8 sm:w-8"
                />
                <div className="flex items-center gap-2 font-sans text-xs text-muted-foreground sm:text-sm">
                  <div className="flex gap-1">
                    <div
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span>Thinking...</span>
                </div>
              </div>
            </ThreadPrimitive.If>
          </div>
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
      </ChatContainerRoot>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 w-full max-w-3xl mx-auto pointer-events-none">
        <div className="space-y-3 pointer-events-auto">
          {fileError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center justify-between">
              <span>{fileError}</span>
              <button
                onClick={() => setFileError("")}
                className="text-destructive hover:opacity-70 transition-opacity"
              >
                ×
              </button>
            </div>
          )}

          {attachedFiles.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border bg-card/50 p-3">
              <FilePreview
                files={attachedFiles}
                onRemove={handleRemoveFile}
              />
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleFilesSubmit}
                  disabled={isProcessingFiles}
                  className="gap-2"
                >
                  Send Files
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAttachedFiles([])}
                  disabled={isProcessingFiles}
                  className="gap-2"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {transcript && (
            <TranscriptPreview
              transcript={transcript}
              onAccept={handleTranscriptAccept}
              onReject={handleTranscriptReject}
              isProcessing={isProcessingFiles}
            />
          )}
        </div>

        <PromptInput
          className="rounded-2xl border-border shadow-sm pointer-events-auto"
          disabled={false}
          maxHeight={96}
          onSubmit={handleSubmit}
        >
          <PromptInputTextarea
            ref={inputRef}
            placeholder={placeholder}
            className="font-sans text-sm sm:text-base"
            autoFocus
          />
          {suggestion && !inputValue && (
            <button
              type="button"
              onClick={applySuggestion}
              className="absolute left-3 top-2.5 font-sans text-sm text-muted-foreground hover:opacity-80 transition-opacity sm:left-4 sm:top-3 sm:text-base md:hidden"
            >
              {suggestion}
            </button>
          )}
          <PromptInputActions className="w-full justify-between">
            <div className="flex gap-2">
              <PromptInputAction tooltip="Attach file">
                <FileAttachmentButton
                  onFilesSelected={handleFilesSelected}
                  disabled={isProcessingFiles}
                />
              </PromptInputAction>
              <PromptInputAction tooltip="Record voice message">
                <VoiceRecorderButton
                  onTranscript={handleTranscriptReceived}
                  onError={handleRecorderError}
                  disabled={isProcessingFiles}
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
        </PromptInput>
      </div>
    </div>
  );
}
