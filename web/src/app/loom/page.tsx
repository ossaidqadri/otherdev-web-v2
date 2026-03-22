"use client";

import type { ToolCallMessagePart } from "@assistant-ui/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { createContext, useContext, useState } from "react";
import { ArtifactRenderer } from "@/components/artifact-renderer";
import { Navigation } from "@/components/navigation";
import { OtherDevLoomThread } from "@/components/otherdev-loom-thread";
import { useOtherDevRuntime } from "@/lib/use-otherdev-runtime";

interface ArtifactContextType {
  activeArtifact: ToolCallMessagePart | null;
  setActiveArtifact: (artifact: ToolCallMessagePart | null) => void;
}

const ArtifactContext = createContext<ArtifactContextType | null>(null);

export function useArtifact() {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error("useArtifact must be used within ArtifactProvider");
  }
  return context;
}

interface RuntimeContextType {
  suggestion: string;
  setSuggestion: (suggestion: string) => void;
  appendFileContent: (contentBlocks: any[]) => void;
  composedContent: any[];
}

const RuntimeContext = createContext<RuntimeContextType | null>(null);

export function useRuntimeContext() {
  const context = useContext(RuntimeContext);
  if (!context) {
    throw new Error(
      "useRuntimeContext must be used within RuntimeContextProvider",
    );
  }
  return context;
}

export default function AIPage() {
  const runtime = useOtherDevRuntime();
  const [activeArtifact, setActiveArtifact] =
    useState<ToolCallMessagePart | null>(null);

  return (
    <>
      <Navigation
        isLoomPage={true}
        onClear={runtime.clear}
        hasActiveArtifact={!!activeArtifact}
      />
      <main className="h-screen">
        <AssistantRuntimeProvider runtime={runtime}>
          <RuntimeContext.Provider
            value={{
              suggestion: runtime.suggestion,
              setSuggestion: runtime.setSuggestion,
              appendFileContent: runtime.appendFileContent,
              composedContent: runtime.composedContent,
            }}
          >
            <ArtifactContext.Provider
              value={{ activeArtifact, setActiveArtifact }}
            >
              <div className="flex h-full overflow-hidden">
                <div
                  className={`h-full ${activeArtifact ? "hidden md:block md:w-1/2" : "w-full"}`}
                >
                  <OtherDevLoomThread />
                </div>
                {activeArtifact && (
                  <div className="h-full w-full md:w-1/2">
                    <ArtifactRenderer
                      toolCall={activeArtifact}
                      mode="panel"
                      onClose={() => setActiveArtifact(null)}
                    />
                  </div>
                )}
              </div>
            </ArtifactContext.Provider>
          </RuntimeContext.Provider>
        </AssistantRuntimeProvider>
      </main>
    </>
  );
}
