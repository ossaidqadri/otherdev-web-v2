import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const MODEL = "BAAI/bge-large-en-v1.5";

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await hf.featureExtraction({
      model: MODEL,
      inputs: text,
    });

    if (Array.isArray(response) && response.length > 0) {
      if (Array.isArray(response[0])) {
        return response[0] as number[];
      }
      return response as number[];
    }

    throw new Error("Invalid embedding response format");
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

