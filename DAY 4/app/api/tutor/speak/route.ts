export async function POST(req: Request) {
  const { text, voice } = await req.json()

  // Map voice names to Murf Falcon voice IDs
  const voiceMap: Record<string, string> = {
    Matthew: "en-US-marcus", // Using Marcus as a Matthew-like male voice
    Alicia: "en-US-alicia",
    Ken: "en-US-ken",
  }

  const voiceId = voiceMap[voice] || "en-US-marcus"

  try {
    const response = await fetch("https://api.murf.ai/v2/speech/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.MURF_API_KEY || "",
      },
      body: JSON.stringify({
        voiceId: voiceId,
        text: text,
        format: "MP3",
        speed: 1.0,
        pitch: 0,
        sampleRate: 24000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Murf API error:", errorText)
      return Response.json({ error: "Failed to generate speech" }, { status: 500 })
    }

    const data = await response.json()

    return Response.json({
      audioUrl: data.audioFile,
      duration: data.audioDuration,
    })
  } catch (error) {
    console.error("Speech generation error:", error)
    return Response.json({ error: "Failed to generate speech" }, { status: 500 })
  }
}
