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

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const text = transcription.text
        let index = 0

        const streamChunks = async () => {
          while (index < text.length) {
            // Send word-sized chunks (~50 chars or until next space)
            let chunkEnd = Math.min(index + 50, text.length)

            // Extend to next space if not at end
            if (chunkEnd < text.length) {
              const nextSpace = text.indexOf(" ", chunkEnd)
              if (nextSpace !== -1 && nextSpace < index + 80) {
                chunkEnd = nextSpace
              }
            }

            const chunk = text.slice(index, chunkEnd)
            index = chunkEnd

            const data = JSON.stringify({
              type: "transcript-chunk",
              content: chunk,
            })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))

            // Short delay for smooth streaming
            await new Promise((resolve) => setTimeout(resolve, 3))
          }

          // Signal completion
          const completeData = JSON.stringify({
            type: "transcript-complete",
            content: text,
          })
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`))
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        }

        streamChunks().catch((error) => controller.error(error))
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
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
