interface PromptSuggestionsProps {
  label: string;
  append: (message: { role: "user"; content: string }) => void;
  suggestions: string[] | { label: string; prompt: string }[];
}

export function PromptSuggestions({
  label,
  append,
  suggestions,
}: PromptSuggestionsProps) {
  return (
    <div className="space-y-6">
      {label && <h2 className="text-center text-2xl font-bold">{label}</h2>}
      <div className="flex flex-col gap-3 text-sm">
        {suggestions.map((suggestion, index) => {
          const isObject = typeof suggestion === "object";
          const display = isObject ? suggestion.label : suggestion;
          const content = isObject ? suggestion.prompt : suggestion;

          return (
            <button
              key={`${display}-${index}`}
              onClick={() => append({ role: "user", content })}
              className="w-full rounded-xl border bg-background p-4 text-left transition-colors hover:bg-muted"
            >
              <p>{display}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
