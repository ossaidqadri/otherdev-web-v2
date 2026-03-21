import { z } from "zod";

export const ADD_REASONING_STEP_TOOL_NAME = "add_reasoning_step";

export const reasoningStepSchema = z.object({
  phase: z
    .enum([
      "Analyzing the request",
      "Considering options",
      "Selecting the approach",
    ])
    .describe(
      "The phase of reasoning: Analyzing the request (understanding), Considering options (exploring), or Selecting the approach (deciding)",
    ),
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Content must be 2000 characters or less")
    .describe("Detailed content for this reasoning phase"),
});

export type ReasoningStepArgs = z.infer<typeof reasoningStepSchema>;

export const reasoningStepTool = {
  type: "function" as const,
  function: {
    name: ADD_REASONING_STEP_TOOL_NAME,
    description:
      "Add a structured reasoning step to help explain your thinking process. Use this to break down your response into three phases: first Analyzing the request (understanding what's being asked), then Considering options (exploring different approaches), and finally Selecting the approach (deciding on the best solution).",
    parameters: {
      type: "object",
      properties: {
        phase: {
          type: "string",
          enum: [
            "Analyzing the request",
            "Considering options",
            "Selecting the approach",
          ],
          description: "The phase of reasoning",
        },
        content: {
          type: "string",
          description:
            "Detailed content for this reasoning phase (max 2000 chars)",
        },
      },
      required: ["phase", "content"],
    },
  },
};
