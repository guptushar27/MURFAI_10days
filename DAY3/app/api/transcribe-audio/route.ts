import { GoogleGenerativeAI } from "@google/generative-ai"

const lastCallTime: { [key: string]: number } = {}
const MIN_CALL_INTERVAL = 2000 // 2 seconds between calls

function canMakeCall(endpoint: string): boolean {
  const now = Date.now()
  const lastCall = lastCallTime[endpoint] || 0

  if (now - lastCall < MIN_CALL_INTERVAL) {
    return false
  }

  lastCallTime[endpoint] = now
  return true
}

export async function POST(request: Request) {
  try {
    if (!canMakeCall("transcribe")) {
      return Response.json(
        {
          error: "Please wait a moment before recording again.",
        },
        { status: 429 },
      )
    }

    const { audioData, mimeType } = await request.json()

    if (!audioData) {
      return Response.json({ error: "No audio data provided" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY

    if (!apiKey) {
      console.error("[v0] GOOGLE_GENERATIVE_AI_KEY is not set")
      return Response.json(
        { error: "Google API key not configured. Please add GOOGLE_GENERATIVE_AI_KEY to your environment variables." },
        { status: 500 },
      )
    }

    console.log("[v0] Received audio data, processing with Gemini...")

    const base64Audio = audioData.split(",")[1] || audioData
    const binaryString = atob(base64Audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" })

    let lastError: any = null
    const maxRetries = 2

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await model.generateContent([
          {
            inlineData: {
              data: Buffer.from(bytes).toString("base64"),
              mimeType: mimeType || "audio/wav",
            },
          },
          { text: "Transcribe this audio in English. Only respond with the transcribed English text, nothing else." },
        ])

        const transcript = response.response.text()

        if (!transcript || transcript.trim().length === 0) {
          return Response.json({ error: "No transcription received from Gemini" }, { status: 400 })
        }

        console.log("[v0] Transcription successful:", transcript)
        return Response.json({ transcript: transcript.trim() })
      } catch (error: any) {
        lastError = error

        // If quota exceeded, don't retry
        if (
          error.message?.includes("429") ||
          error.message?.includes("quota") ||
          error.message?.includes("RESOURCE_EXHAUSTED")
        ) {
          break
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }

    // Handle the error after retries
    console.error("[v0] Transcription error:", lastError?.message)

    if (
      lastError?.message?.includes("429") ||
      lastError?.message?.includes("quota") ||
      lastError?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return Response.json(
        {
          error:
            "API quota exceeded. Please wait 30 seconds and try again, or check your Gemini API quota at https://ai.dev/usage",
        },
        { status: 429 },
      )
    }

    if (lastError?.message?.includes("API key not valid") || lastError?.message?.includes("API_KEY_INVALID")) {
      return Response.json(
        { error: "Invalid Google API key. Please check your GOOGLE_GENERATIVE_AI_KEY in environment variables." },
        { status: 500 },
      )
    }

    return Response.json({ error: lastError?.message || "Transcription failed" }, { status: 500 })
  } catch (error: any) {
    console.error("[v0] Transcription error:", error.message)
    return Response.json({ error: error.message || "Transcription failed" }, { status: 500 })
  }
}
