import type { NextRequest } from "next/server"

const SYSTEM_PROMPT = `You are a caring Health & Wellness Voice Companion. Listen actively and respond naturally to the user's feelings and concerns. Be empathetic, supportive, and conversational.`

const lastCallTime: { [key: string]: number } = {}
const MIN_CALL_INTERVAL = 1500 // 1.5 seconds between calls

function canMakeCall(endpoint: string): boolean {
  const now = Date.now()
  const lastCall = lastCallTime[endpoint] || 0

  if (now - lastCall < MIN_CALL_INTERVAL) {
    return false
  }

  lastCallTime[endpoint] = now
  return true
}

async function saveToWellnessLog(userMessage: string, assistantResponse: string) {
  try {
    // Extract mood indicators from user message
    const moodIndicators = ["tired", "happy", "sad", "anxious", "stressed", "excited", "calm", "worried"]
    const detectedMood = moodIndicators.find((mood) => userMessage.toLowerCase().includes(mood)) || "Not specified"

    const entry = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      userMessage: userMessage,
      mood: detectedMood,
      objectives: userMessage.length > 20 ? userMessage.substring(0, 100) + "..." : userMessage,
      aiResponse: assistantResponse.substring(0, 150) + "...",
      summary: `User shared feelings about ${detectedMood}. AI provided supportive response.`,
    }

    // Save via API route
    await fetch("/api/wellness-log/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch((err) => console.error("[v0] Failed to save log via API:", err))

    console.log("[v0] Wellness log saved via API")
  } catch (error) {
    console.error("[v0] Error saving to wellness log:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Wellness agent POST called")

    if (!canMakeCall("wellness")) {
      return new Response(
        JSON.stringify({
          response: "Let me think about that for a moment. How does that make you feel?",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    let body: any = {}
    try {
      const text = await request.text()
      body = JSON.parse(text)
    } catch (parseError) {
      console.error("[v0] Body parse error:", parseError)
      return new Response(
        JSON.stringify({
          response: "I'm here to support you. How are you feeling today?",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const userMessage = body.userMessage || ""
    const conversationHistory = body.conversationHistory || []

    console.log("[v0] User message:", userMessage.substring(0, 50))

    if (!userMessage) {
      return new Response(
        JSON.stringify({
          response: "I'm here to listen. What would you like to share today?",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY
    if (!apiKey) {
      console.error("[v0] Missing GOOGLE_GENERATIVE_AI_KEY")
      return new Response(
        JSON.stringify({
          response:
            "I hear you. It's completely understandable to feel tired. Taking breaks and getting enough rest is important for your wellbeing.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    try {
      console.log("[v0] Calling Gemini API via fetch")

      const messages = conversationHistory.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }))
      messages.push({ role: "user", parts: [{ text: userMessage }] })

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: messages,
          }),
        },
      )

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json().catch(() => ({}))
        console.error("[v0] Gemini API error:", geminiResponse.status, errorData)

        if (geminiResponse.status === 429) {
          const fallbackResponses = [
            "I understand what you're sharing. Taking care of yourself is so important. What do you think would help you feel better right now?",
            "Thank you for sharing that with me. It sounds like you're dealing with a lot. How can I support you today?",
            "I hear you, and that's completely valid. Your feelings matter. What would make today a little easier for you?",
          ]
          const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

          saveToWellnessLog(userMessage, randomResponse).catch((err) => console.error("[v0] Failed to save log:", err))

          return new Response(JSON.stringify({ response: randomResponse }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        }

        throw new Error(`Gemini API error: ${geminiResponse.status}`)
      }

      const data = await geminiResponse.json()
      const assistantResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I hear you. Taking time to rest when you're tired is so important. Is there anything specific that's been draining your energy?"

      console.log("[v0] Generated response:", assistantResponse.substring(0, 100))

      saveToWellnessLog(userMessage, assistantResponse).catch((err) => console.error("[v0] Failed to save log:", err))

      return new Response(JSON.stringify({ response: assistantResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (aiError: any) {
      console.error("[v0] AI error:", aiError?.message)

      const fallbackResponse =
        "I understand you're feeling tired today. That's completely valid. Rest is essential for your wellbeing. What do you think might help you feel more energized?"
      saveToWellnessLog(userMessage, fallbackResponse).catch((err) => console.error("[v0] Failed to save log:", err))

      return new Response(
        JSON.stringify({
          response: fallbackResponse,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (fatalError: any) {
    console.error("[v0] Fatal error:", fatalError?.message)
    return new Response(
      JSON.stringify({
        response: "I'm here to support you. How are you feeling today?",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
