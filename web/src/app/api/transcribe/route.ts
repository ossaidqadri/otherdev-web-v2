import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Convert File to Buffer for Groq SDK
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Call Whisper API via Groq
    const transcription = await groq.audio.transcriptions.create({
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      model: "whisper-large-v3-turbo",
      language: "en",
    })

    return new Response(
      JSON.stringify({
        transcript: transcription.text,
        duration: audioFile.size,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Transcription error:", error)

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"

    return new Response(
      JSON.stringify({ error: `Transcription failed: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
