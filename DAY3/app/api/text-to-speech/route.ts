export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { text, voiceId = "en-US-terrell" } = await request.json()

    if (!text) {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    const apiKey = process.env.MURF_API_KEY

    if (!apiKey) {
      console.error("[v0] MURF_API_KEY environment variable is not set")
      return Response.json(
        {
          error: "Murf API key not configured. Please add MURF_API_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Generating speech with Murf GEN2 (FALCON) model")
    console.log("[v0] Using voice ID:", voiceId)
    console.log("[v0] Text length:", text.length, "characters")

    const response = await fetch("https://api.murf.ai/v1/speech/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        voiceId,
        text,
        modelVersion: "GEN2",
        rate: 0,
        pitch: 0,
        sampleRate: 24000,
        format: "MP3",
        channelType: "STEREO",
        encodeAsBase64: false,
      }),
    })

    console.log("[v0] Murf API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Murf API error response:", errorText)
      return Response.json(
        {
          error: "Murf API request failed",
          details: errorText,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("[v0] Murf API success")

    const audioUrl = data?.audioFile

    if (!audioUrl) {
      console.error("[v0] No audioFile in Murf response:", data)
      return Response.json(
        {
          error: "No audio file returned from Murf",
          details: data,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Audio URL generated successfully")

    return Response.json({ audioUrl })
  } catch (error: any) {
    console.error("[v0] Murf API error:", error?.message || error)
    return Response.json(
      {
        error: "Failed to generate speech with Murf",
        details: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}
