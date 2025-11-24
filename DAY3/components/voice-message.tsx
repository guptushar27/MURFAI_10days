"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2, Square } from "lucide-react"

interface VoiceMessageProps {
  text: string
  voiceId?: string
}

export const VoiceMessage = ({ text, voiceId = "en-US-terrell" }: VoiceMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    generateAndPlayAudio()
  }, [])

  const generateAndPlayAudio = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Generating speech for text length:", text.length)

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] TTS API error:", errorData)
        setIsLoading(false)
        return
      }

      const data = await response.json()

      console.log("[v0] TTS API response:", data)

      if (data.error) {
        console.error("[v0] TTS error:", data.error, data.details)
        setIsLoading(false)
        return
      }

      if (data.audioUrl) {
        console.log("[v0] Setting audio URL:", data.audioUrl)
        setAudioUrl(data.audioUrl)

        if (audioRef.current) {
          audioRef.current.src = data.audioUrl

          audioRef.current.onloadeddata = async () => {
            console.log("[v0] Audio loaded, attempting to play")
            try {
              await audioRef.current?.play()
              setIsPlaying(true)
              console.log("[v0] Audio playing successfully")
            } catch (err) {
              console.error("[v0] Audio play error:", err)
            } finally {
              setIsLoading(false)
            }
          }

          audioRef.current.load()
        }
      } else {
        console.error("[v0] No audioUrl in response")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("[v0] Audio generation error:", error)
      setIsLoading(false)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const playAudio = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (err) {
        console.error("[v0] Audio play error:", err)
      }
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {isLoading ? (
        <div className="p-2 rounded-full bg-white/10">
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
      ) : isPlaying ? (
        <button
          onClick={stopAudio}
          className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-all border border-red-400/50"
          title="Stop audio"
        >
          <Square className="w-4 h-4 text-red-300 fill-red-300" />
        </button>
      ) : (
        <button
          onClick={playAudio}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/30"
          title="Play audio"
        >
          <Volume2 className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  )
}
