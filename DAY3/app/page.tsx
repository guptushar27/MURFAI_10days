"use client"

import { useState, useRef, useEffect } from "react"
import { PromptInputBox } from "@/components/ui/ai-prompt-box"
import { VoiceAgentChat } from "@/components/voice-agent-chat"
import { VoiceInput } from "@/components/voice-input"
import { WellnessHeader } from "@/components/wellness-header"
import { DottedSurface } from "@/components/ui/dotted-surface"
import { readWellnessLog } from "@/lib/wellness-storage"

export default function Home() {
  const [messages, setMessages] = useState<any[]>([])
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [previousCheckIns, setPreviousCheckIns] = useState<any[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await readWellnessLog()
        setPreviousCheckIns(history)
      } catch (error) {
        console.error("[v0] Failed to load check-in history:", error)
      }
    }
    loadHistory()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    setMessages((prev) => [...prev, { role: "user", content: message }])
    setIsLoading(true)

    try {
      const response = await fetch("/api/wellness-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: message,
          conversationHistory: conversationHistory,
          previousCheckIns: previousCheckIns,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[v0] Non-JSON response received:", await response.text())
        throw new Error("Invalid response format from server")
      }

      const data = await response.json()

      if (response.ok && data.response) {
        const assistantMessage = {
          role: "assistant",
          parts: [{ text: data.response }],
        }

        setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
        setConversationHistory((prev) => [...prev, { role: "user", parts: [{ text: message }] }, assistantMessage])
      } else {
        const errorMsg = "Sorry, I had trouble processing that. Please try again."
        setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }])
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      const errorMsg = "Connection error. Please try again."
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }])
    }

    setIsLoading(false)
  }

  const handleVoiceTranscribe = (text: string) => {
    handleSendMessage(text)
  }

  return (
    <>
      <DottedSurface />
      <main className="min-h-screen flex flex-col relative z-0">
        <div className="flex flex-col h-screen relative">
          <WellnessHeader />

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">💚</div>
                  <h2 className="text-3xl font-bold text-white">Welcome to Your Wellness Companion</h2>
                  <p className="text-white/80 max-w-md text-lg">
                    Start a conversation about your mood, energy, and daily goals. I'm here to listen and support you.
                  </p>
                </div>
              </div>
            ) : (
              <VoiceAgentChat messages={messages} />
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-4 md:px-8 py-6 bg-black/20 backdrop-blur-sm border-t border-white/10">
            <div className="max-w-2xl mx-auto flex gap-3">
              <div className="flex-1">
                <PromptInputBox
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  placeholder="Tell me how you're feeling today..."
                  disableVoiceRecording={true}
                  maxHeight={120}
                />
              </div>
              <VoiceInput onTranscribed={handleVoiceTranscribe} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
