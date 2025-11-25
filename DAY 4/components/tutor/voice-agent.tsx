"use client"

import type React from "react"
import type { SpeechRecognition, SpeechRecognitionEvent } from "web-speech-api"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, Loader2, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { LearningMode, Concept } from "@/lib/tutor-content"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface VoiceAgentProps {
  mode: LearningMode
  onBack: () => void
}

const modeInfo = {
  learn: { name: "Matthew", color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/20" },
  quiz: { name: "Alicia", color: "from-purple-500 to-pink-500", bgColor: "bg-purple-500/20" },
  teach_back: { name: "Ken", color: "from-emerald-500 to-teal-500", bgColor: "bg-emerald-500/20" },
}

const modeGreetings = {
  learn:
    "Hello! I'm Matthew, your programming tutor. I'm here to explain concepts clearly. What would you like to learn about? We can cover variables, loops, functions, conditionals, or arrays!",
  quiz: "Hi there! I'm Alicia, your quiz master. I'll test your programming knowledge with questions. Ready to challenge yourself? Pick a topic: variables, loops, functions, conditionals, or arrays!",
  teach_back:
    "Hey! I'm Ken, and I'm here to learn from you. Teaching is the best way to master concepts. Can you teach me about one of these: variables, loops, functions, conditionals, or arrays?",
}

export function VoiceAgent({ mode, onBack }: VoiceAgentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentConcept, setCurrentConcept] = useState<Concept | null>(null)
  const [waitingForAnswer, setWaitingForAnswer] = useState(false)
  const [currentTopic, setCurrentTopic] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [currentAnswer, setCurrentAnswer] = useState("")

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentModeRef = useRef<LearningMode>(mode)

  const info = modeInfo[mode]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speechSynthesis.cancel()
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    setIsListening(false)
    setIsSpeaking(false)
    setIsLoading(false)
    setCurrentConcept(null)
    setWaitingForAnswer(false)
    setCurrentTopic("")
    setCurrentQuestion("")
    setCurrentAnswer("")
    currentModeRef.current = mode

    const greeting = modeGreetings[mode]
    setMessages([{ role: "assistant", content: greeting }])

    if (!isMuted) {
      setTimeout(() => {
        if (currentModeRef.current === mode) {
          speakWithBrowserTTS(greeting)
        }
      }, 100)
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        speechSynthesis.cancel()
      }
    }
  }, [mode])

  const speakWithBrowserTTS = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return

    speechSynthesis.cancel()

    setIsSpeaking(true)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    speechSynthesis.speak(utterance)
  }, [])

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speechSynthesis.cancel()
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsSpeaking(false)
    setIsListening(false)
    onBack()
  }, [onBack])

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return

      const lowerMessage = userMessage.toLowerCase()
      if (
        lowerMessage.includes("switch to learn") ||
        lowerMessage.includes("switch to quiz") ||
        lowerMessage.includes("switch to teach")
      ) {
        handleBack()
        return
      }

      const newMessages: Message[] = [...messages, { role: "user", content: userMessage }]
      setMessages(newMessages)
      setInputText("")
      setIsLoading(true)

      try {
        const response = await fetch("/api/tutor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            mode,
            conceptId: currentConcept?.id,
            conversationHistory: newMessages.slice(-6),
            waitingForAnswer,
            currentTopic,
            currentQuestion,
            currentAnswer,
          }),
        })

        const data = await response.json()

        if (data.response) {
          setMessages([...newMessages, { role: "assistant", content: data.response }])

          if (data.concept) {
            setCurrentConcept(data.concept)
          }
          if (data.waitingForAnswer !== undefined) {
            setWaitingForAnswer(data.waitingForAnswer)
          }
          if (data.currentTopic !== undefined) {
            setCurrentTopic(data.currentTopic)
          }
          if (data.currentQuestion !== undefined) {
            setCurrentQuestion(data.currentQuestion)
          }
          if (data.currentAnswer !== undefined) {
            setCurrentAnswer(data.currentAnswer)
          }

          if (!isMuted) {
            speakWithBrowserTTS(data.response)
          }
        } else {
          throw new Error(data.error || "No response received")
        }
      } catch (error) {
        console.error("[v0] Error sending message:", error)
        const errorMessage = "I'm having trouble connecting. Please try again."
        setMessages([...newMessages, { role: "assistant", content: errorMessage }])
      } finally {
        setIsLoading(false)
      }
    },
    [
      messages,
      mode,
      currentConcept,
      isLoading,
      isMuted,
      handleBack,
      speakWithBrowserTTS,
      waitingForAnswer,
      currentTopic,
      currentQuestion,
      currentAnswer,
    ],
  )

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser.")
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        sendMessage(transcript)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
    }
  }

  const toggleMute = useCallback(() => {
    if (!isMuted) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        speechSynthesis.cancel()
      }
      setIsSpeaking(false)
    }
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputText)
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <div className={`p-4 rounded-t-xl bg-gradient-to-r ${info.color}`}>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{info.name}</h2>
            <p className="text-sm text-white/80 capitalize">{mode.replace("_", " ")} Mode</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
        {currentConcept && (
          <div className="mt-2 px-3 py-1.5 bg-white/20 rounded-lg text-center">
            <span className="text-sm text-white">
              Current Topic: <span className="font-semibold">{currentConcept.title}</span>
            </span>
          </div>
        )}
        {mode === "quiz" && waitingForAnswer && (
          <div className="mt-2 px-3 py-1.5 bg-yellow-500/30 rounded-lg text-center">
            <span className="text-sm text-white font-medium">Waiting for your answer...</span>
          </div>
        )}
        {isSpeaking && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-white/80">Speaking...</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : `${info.bgColor} rounded-bl-md`
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`p-3 rounded-2xl ${info.bgColor} rounded-bl-md`}>
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              waitingForAnswer ? "Type your answer..." : "Type your message or ask about loops, variables, functions..."
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !inputText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "secondary"}
            onClick={toggleListening}
            disabled={isLoading}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Say "switch to learn/quiz/teach back mode" to change modes
        </p>
      </div>
    </div>
  )
}
