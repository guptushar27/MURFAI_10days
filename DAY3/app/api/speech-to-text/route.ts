export async function POST(request: Request) {
  // Kept as a placeholder for future use if needed
  return Response.json({ error: "Speech-to-text is now handled client-side using Web Speech API" }, { status: 200 })

  // Original code commented out for reference
  /*
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY
    if (!apiKey) {
      console.error("[v0] GOOGLE_GENERATIVE_AI_KEY not set")
      return Response.json({ error: "API key not configured" }, { status: 500 })
    }

    console.log("[v0] Calling Gemini API for speech recognition")

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" })

    const audioBuffer = await audioFile.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString("base64")

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Audio,
          mimeType: audioFile.type || "audio/wav",
        },
      },
      "Please transcribe this audio into text. Return only the transcribed text without any additional explanation or formatting.",
    ])

    const result = response.response
    const transcribedText = result.text()

    if (!transcribedText || transcribedText.trim() === "") {
      console.error("[v0] No transcription received from Gemini")
      return Response.json({ error: "Failed to transcribe audio" }, { status: 500 })
    }

    console.log("[v0] Transcription received:", transcribedText.substring(0, 50))
    return Response.json({ text: transcribedText })
  } catch (error: any) {
    console.error("[v0] Speech-to-text error:", error?.message || error)
    return Response.json(
      { error: "Failed to transcribe audio: " + (error?.message || "Unknown error") },
      { status: 500 },
    )
  }
  */
}
