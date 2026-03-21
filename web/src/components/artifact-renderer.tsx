"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ToolCallMessagePart } from "@assistant-ui/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Code2, Eye, Copy, Check, ChevronLeft } from "lucide-react";
import { codeToHtml, type BundledLanguage } from "shiki";

function ArtifactHeader({
  mode,
  title,
  description,
  copied,
  onCopy,
  onClose,
}: {
  mode: "panel" | "inline";
  title: string;
  description: string;
  copied: boolean;
  onCopy: () => void;
  onClose?: () => void;
}) {
  if (mode === "panel") {
    return (
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3 relative z-[60] pointer-events-auto">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 shrink-0 p-0 md:hidden cursor-pointer pointer-events-auto"
              title="Back to chat"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-base font-medium text-foreground">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 truncate font-serif text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="ml-3 flex items-center gap-2 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-8 w-8 p-0 cursor-pointer hover:bg-muted pointer-events-auto"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hidden h-8 w-8 p-0 md:flex cursor-pointer hover:bg-muted pointer-events-auto"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-serif text-sm font-medium text-foreground sm:text-base">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 truncate font-serif text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        )}
      </div>
      <div className="ml-3 flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-7 w-7 p-0 hover:bg-muted sm:h-8 sm:w-8"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600 sm:h-4 sm:w-4" />
          ) : (
            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface ArtifactRendererProps {
  toolCall: ToolCallMessagePart;
  mode?: "panel" | "inline";
  onClose?: () => void;
}

export function ArtifactRenderer({
  toolCall,
  mode = "inline",
  onClose,
}: ArtifactRendererProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { title, code, description } = toolCall.args as {
    title: string;
    code: string;
    description: string;
  };

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, [code]);

  useEffect(() => {
    const highlightCode = async () => {
      if (!code) {
        setHighlightedCode("<pre><code></code></pre>");
        return;
      }

      try {
        const html = await codeToHtml(code.trim(), {
          lang: "html" as BundledLanguage,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error("Error highlighting code:", error);
        setHighlightedCode(`<pre><code>${code}</code></pre>`);
      }
    };

    highlightCode();
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  if (mode === "panel") {
    return (
      <div className="flex h-full flex-col border-l border-border bg-background">
        <ArtifactHeader
          mode="panel"
          title={title}
          description={description}
          copied={copied}
          onCopy={handleCopy}
          onClose={onClose ? handleClose : undefined}
        />

        <Tabs
          defaultValue="preview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="border-b border-border px-4 py-2">
            <TabsList>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code2 className="h-4 w-4" />
                Code
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="preview"
            className="m-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
            forceMount
          >
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
              className="h-full w-full"
              title={title}
            />
          </TabsContent>

          <TabsContent
            value="code"
            className="m-0 flex-1 overflow-auto data-[state=inactive]:hidden"
            forceMount
          >
            {highlightedCode ? (
              <div
                className="h-full w-full [&>pre]:h-full [&>pre]:p-4 [&>pre]:text-sm [&>pre]:overflow-auto"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            ) : (
              <pre className="h-full p-4 font-mono text-sm">
                <code className="text-foreground">{code}</code>
              </pre>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <ArtifactHeader
        mode="inline"
        title={title}
        description={description}
        copied={copied}
        onCopy={handleCopy}
      />

      <div className="h-[400px] bg-background sm:h-[500px]">
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
          className="h-full w-full"
          title={title}
        />
      </div>
    </div>
  );
}
