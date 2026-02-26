"use client";

import * as React from "react";
import { ChevronDown, Send, ArrowDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type Message } from "@/components/ui/chat-message";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { CopyButton } from "@/components/ui/copy-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useAutosizeTextArea } from "@/hooks/use-autosize-textarea";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useLocalStorageMessages } from "@/hooks/use-local-storage-messages";
import { PromptSuggestions } from "@/components/ui/prompt-suggestions";
import { Z_INDEX, SUGGESTED_PROMPTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MAX_INPUT_LENGTH = 500;
const CHAT_WIDGET_STORAGE_KEY = "otherdev-chat-widget-messages";

function cleanSuggestionMarkers(content: string): string {
  return content
    .replace(/\s*SUGGESTION:[\s\S]*$/i, "")
    .replace(/\n+SUGGESTION:[\s\S]*$/i, "")
    .trim();
}

function serializeMessages(messages: Message[]): string {
  return JSON.stringify(
    messages.map((msg) => ({
      ...msg,
      createdAt: msg.createdAt?.toISOString(),
    })),
  );
}

function deserializeMessages(data: string): Message[] {
  const parsed = JSON.parse(data);
  return parsed.map((msg: Message & { createdAt?: string }) => ({
    ...msg,
    createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
  }));
}

export function ChatWidget() {
  const pathname = usePathname();

  if (pathname?.startsWith("/loom")) {
    return null;
  }

  const [isOpen, setIsOpen] = React.useState(false);
  const { messages, setMessages } = useLocalStorageMessages<Message>({
    key: CHAT_WIDGET_STORAGE_KEY,
    serialize: serializeMessages,
    deserialize: deserializeMessages,
  });
  const [input, setInput] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState("");
  const [threadId, setThreadId] = React.useState<string | undefined>();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const applySuggestion = React.useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textarea, suggestion);
        const inputEvent = new Event("input", { bubbles: true });
        textarea.dispatchEvent(inputEvent);
      }

      setInput(suggestion);
      setSuggestion("");
      textarea.focus();
    }
  }, [suggestion]);

  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages]);

  useAutosizeTextArea({
    ref: textareaRef,
    maxHeight: 96,
    dependencies: [input],
  });

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  useScrollLock(isOpen);

  React.useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Tab" || e.key === "ArrowRight") &&
        suggestion &&
        textareaRef.current &&
        !textareaRef.current.value
      ) {
        e.preventDefault();

        const textarea = textareaRef.current;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value",
        )?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(textarea, suggestion);
          const inputEvent = new Event("input", { bubbles: true });
          textarea.dispatchEvent(inputEvent);
        }

        setInput(suggestion);
        setSuggestion("");
      }
    };

    const handleInput = () => {
      if (textareaRef.current && textareaRef.current.value && suggestion) {
        setSuggestion("");
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("keydown", handleKeyDown);
      textarea.addEventListener("input", handleInput);
      return () => {
        textarea.removeEventListener("keydown", handleKeyDown);
        textarea.removeEventListener("input", handleInput);
      };
    }
  }, [suggestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSuggestion("");

    if (textareaRef.current) {
      textareaRef.current.value = "";
    }

    setIsGenerating(true);

    const assistantMessageId = `assistant-${Date.now()}`;
    let messageAdded = false;

    try {
      const apiMessages = messages.concat(userMessage).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, threadId }),
      });

      const newThreadId = response.headers.get("X-Thread-Id");
      if (newThreadId && !threadId) {
        setThreadId(newThreadId);
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let accumulatedContent = "";
      let accumulatedReasoning = "";
      let currentSuggestion = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "suggestion" && parsed.content) {
                currentSuggestion = parsed.content;
                setSuggestion(currentSuggestion);
              }

              if (parsed.type === "reasoning" && parsed.content) {
                accumulatedReasoning += parsed.content;

                if (!messageAdded) {
                  const assistantMessage: Message = {
                    id: assistantMessageId,
                    role: "assistant",
                    content: accumulatedContent,
                    reasoning: accumulatedReasoning,
                    createdAt: new Date(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  messageAdded = true;
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, reasoning: accumulatedReasoning }
                        : msg,
                    ),
                  );
                }
              }

              if (parsed.type === "content" && parsed.content) {
                accumulatedContent += parsed.content;

                if (!messageAdded) {
                  const assistantMessage: Message = {
                    id: assistantMessageId,
                    role: "assistant",
                    content: accumulatedContent,
                    reasoning: accumulatedReasoning,
                    createdAt: new Date(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  messageAdded = true;
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg,
                    ),
                  );
                }
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);

      if (!messageAdded) {
        const errorMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "Failed to get response. Please try again.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: "Failed to get response. Please try again." }
              : msg,
          ),
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const append = (message: { role: "user"; content: string }) => {
    if (isGenerating) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: message.role,
      content: message.content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setSuggestion("");
    setIsGenerating(true);

    const assistantMessageId = `assistant-${Date.now()}`;
    let messageAdded = false;

    (async () => {
      try {
        const apiMessages = messages.concat(userMessage).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, threadId }),
        });

        const newThreadId = response.headers.get("X-Thread-Id");
        if (newThreadId && !threadId) {
          setThreadId(newThreadId);
        }

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Response body is not readable");
        }

        let accumulatedContent = "";
        let accumulatedReasoning = "";
        let currentSuggestion = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                break;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === "suggestion" && parsed.content) {
                  currentSuggestion = parsed.content;
                  setSuggestion(currentSuggestion);
                }

                if (parsed.type === "reasoning" && parsed.content) {
                  accumulatedReasoning += parsed.content;

                  if (!messageAdded) {
                    const assistantMessage: Message = {
                      id: assistantMessageId,
                      role: "assistant",
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning,
                      createdAt: new Date(),
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    messageAdded = true;
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, reasoning: accumulatedReasoning }
                          : msg,
                      ),
                    );
                  }
                }

                if (parsed.type === "content" && parsed.content) {
                  accumulatedContent += parsed.content;

                  if (!messageAdded) {
                    const assistantMessage: Message = {
                      id: assistantMessageId,
                      role: "assistant",
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning,
                      createdAt: new Date(),
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    messageAdded = true;
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg,
                      ),
                    );
                  }
                }
              } catch (parseError) {
                console.error("Error parsing SSE data:", parseError);
              }
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);

        if (!messageAdded) {
          const errorMessage: Message = {
            id: assistantMessageId,
            role: "assistant",
            content: "Failed to get response. Please try again.",
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: "Failed to get response. Please try again.",
                  }
                : msg,
            ),
          );
        }
      } finally {
        setIsGenerating(false);
      }
    })();
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed",
            "bottom-4 right-4",
            "sm:bottom-6 sm:right-6",
            "md:bottom-8 md:right-8",
            "h-14 w-14",
            "md:h-12 md:w-12",
            "flex items-center justify-center",
            "rounded-full shadow-lg",
            "bg-card",
            "hover:opacity-80 hover:scale-110",
            "transition-all focus:outline-none",
          )}
          style={{ zIndex: Z_INDEX.chatButton }}
          aria-label="Open chat"
        >
          <Image
            src="/otherdev-chat-logo.svg"
            alt="OtherDev AI"
            width={32}
            height={32}
            className="h-8 w-8"
          />
        </button>
      )}

      {isOpen && (
        <Card
          ref={cardRef}
          className={cn(
            "fixed flex flex-col",
            "shadow-2xl border overflow-hidden",
            "p-0 gap-0 bg-card",
            "animate-[slideInFromBottom_0.5s_ease-out_forwards]",
            "inset-0 rounded-none",
            "sm:inset-4 sm:rounded-2xl sm:max-w-[90vw] sm:max-h-[calc(100vh-2rem)]",
            "md:[inset:unset] md:w-[32rem] md:h-[600px] md:max-h-[calc(100vh-4rem)]",
            "lg:h-[650px] lg:max-h-[calc(100vh-5rem)]",
            "xl:h-[700px] xl:max-h-[calc(100vh-6rem)]",
          )}
          style={{
            zIndex: Z_INDEX.chatWidget,
            ...(typeof window !== "undefined" && window.innerWidth >= 768
              ? {
                  top: "auto",
                  left: "auto",
                  bottom: window.innerWidth >= 1024 ? "2.5rem" : "2rem",
                  right: window.innerWidth >= 1024 ? "2.5rem" : "2rem",
                }
              : {}),
          }}
          onWheel={handleWheel}
        >
          <div
            className={cn(
              "flex-shrink-0 flex items-center justify-between border-b p-4",
            )}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-normal text-base md:text-lg text-card-foreground">
                OtherDev AI
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-transparent border-none hover:opacity-80 transition-all cursor-pointer p-0"
              aria-label="Close chat"
            >
              <ChevronDown className="h-5 w-5 text-primary" strokeWidth={2} />
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {isEmpty ? (
              <div className="flex-1 flex items-center justify-center overflow-y-auto p-4">
                <div className="w-full max-w-2xl space-y-6">
                  <div className="text-center space-y-3">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-card-foreground">
                      How can I help you?
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Ask me anything about OtherDev
                    </p>
                  </div>
                  <PromptSuggestions
                    label=""
                    append={append}
                    suggestions={SUGGESTED_PROMPTS}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 relative min-h-0 overflow-hidden">
                <ScrollArea
                  className="h-full w-full overflow-x-hidden"
                  viewportRef={containerRef}
                  onScroll={handleScroll}
                  onTouchStart={handleTouchStart}
                >
                  <div className="px-4 py-6 space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-2">
                        {message.role === "user" ? (
                          <div className="flex flex-col items-end">
                            <div
                              className={cn(
                                "bg-accent text-foreground rounded-lg p-3 text-sm",
                                "max-w-xs",
                                "sm:max-w-sm",
                                "md:max-w-md",
                                "break-words",
                              )}
                            >
                              {message.content}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Image
                                src="/otherdev-chat-logo.svg"
                                alt="OtherDev AI"
                                width={16}
                                height={16}
                                className="h-4 w-4 mt-1 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0 overflow-x-auto space-y-2">
                                {message.reasoning && (
                                  <Collapsible defaultOpen={false}>
                                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                                      <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                                      <span>View thinking process</span>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2">
                                      <div className="text-muted-foreground text-xs leading-relaxed bg-muted/50 rounded-lg p-3 border border-border prose dark:prose-invert prose-sm max-w-none">
                                        <MarkdownRenderer>
                                          {message.reasoning}
                                        </MarkdownRenderer>
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                                <div className="text-card-foreground text-sm leading-relaxed prose dark:prose-invert prose-sm max-w-none">
                                  <MarkdownRenderer>
                                    {cleanSuggestionMarkers(message.content)}
                                  </MarkdownRenderer>
                                </div>
                                {!isGenerating && (
                                  <div className="flex justify-start mt-2">
                                    <CopyButton
                                      content={cleanSuggestionMarkers(
                                        message.content,
                                      )}
                                      copyMessage="Copied response to clipboard"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {isGenerating &&
                      messages[messages.length - 1]?.role === "user" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Image
                              src="/otherdev-chat-logo.svg"
                              alt="OtherDev AI"
                              width={16}
                              height={16}
                              className="h-4 w-4 animate-spin"
                            />
                            <div className="flex gap-1">
                              <div
                                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                            <span>Thinking...</span>
                          </div>
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {!isEmpty && !shouldAutoScroll && (
              <div className="absolute bottom-20 right-4 pointer-events-none">
                <Button
                  onClick={scrollToBottom}
                  size="icon"
                  variant="secondary"
                  className="pointer-events-auto rounded-full shadow-lg animate-in fade-in-0 slide-in-from-bottom-2"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className={cn("flex-shrink-0 p-4 border-t")}>
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex flex-col gap-2">
                  <div className="relative flex items-end gap-2 bg-muted border rounded-xl p-3 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                    <ScrollArea className="flex-1 min-w-0 max-h-24">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={suggestion || "Ask anything..."}
                        disabled={isGenerating}
                        rows={1}
                        maxLength={MAX_INPUT_LENGTH}
                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none resize-none min-h-[24px] break-words"
                      />
                    </ScrollArea>
                    {suggestion && !input && (
                      <button
                        type="button"
                        onClick={applySuggestion}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          applySuggestion();
                        }}
                        className="absolute left-3 top-3 cursor-pointer text-base text-muted-foreground md:hidden"
                        style={{ pointerEvents: "auto" }}
                      >
                        {suggestion}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isGenerating || !input.trim()}
                      className="flex-shrink-0 bg-accent hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground rounded-full p-2 transition-opacity self-end"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  {input.length > MAX_INPUT_LENGTH * 0.9 && (
                    <div className="text-xs text-muted-foreground text-right">
                      {input.length}/{MAX_INPUT_LENGTH}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
