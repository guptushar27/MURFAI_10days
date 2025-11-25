import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { MODE_CONFIGS, type LearningMode } from "@/lib/tutor-content"

export async function POST(req: Request) {
  const { mode } = await req.json()

  const modeConfig = MODE_CONFIGS[mode as LearningMode]

  if (!modeConfig) {
    return Response.json({ error: "Invalid mode" }, { status: 400 })
  }

  const greetingPrompts: Record<LearningMode, string> = {
    learn:
      "Generate a warm, friendly greeting (2-3 sentences) as Matthew, a programming tutor. Welcome the user and briefly mention you're excited to explain programming concepts to them.",
    quiz: "Generate an encouraging greeting (2-3 sentences) as Alicia, a quiz master. Welcome the user and let them know you'll be testing their programming knowledge in a fun, supportive way.",
    teach_back:
      "Generate a curious, eager greeting (2-3 sentences) as Ken, a student wanting to learn. Welcome the user and express excitement about having them teach you programming concepts.",
  }

  try {
    console.log("[v0] Generating greeting for mode:", mode)

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: greetingPrompts[mode as LearningMode],
      maxTokens: 150,
      temperature: 0.8,
    })

    console.log("[v0] Generated greeting text:", text)

    return Response.json({
      greeting: text,
      voice: modeConfig.voice,
      voiceId: modeConfig.voiceId,
      description: modeConfig.description,
    })
  } catch (error) {
    console.error("[v0] Greeting generation error:", error instanceof Error ? error.message : error)

    // Return fallback greeting instead of error to keep app functional
    const fallbackGreetings: Record<LearningMode, string> = {
      learn:
        "Hello! I'm Matthew, your programming tutor. I'm excited to help you learn new concepts today. What would you like to explore?",
      quiz: "Hi there! I'm Alicia, your quiz master. Ready to test your programming knowledge? Let's make learning fun!",
      teach_back: "Hey! I'm Ken, and I'm eager to learn from you. Can you teach me something about programming today?",
    }

    return Response.json({
      greeting: fallbackGreetings[mode as LearningMode],
      voice: modeConfig.voice,
      voiceId: modeConfig.voiceId,
      description: modeConfig.description,
      fallback: true,
    })
  }
}
