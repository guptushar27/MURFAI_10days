"use client"

import { useState, useRef } from "react"
import { Mic, Square } from "lucide-react"

interface VoiceInputProps {
  onTranscribed: (text: string) => void
  isLoading?: boolean
}

export const VoiceInput = ({ onTranscribed, isLoading }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = async () => {
    try {
      console.log("[v0] Starting recording...")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          console.log("[v0] Audio chunk received")
        }
      }

      mediaRecorder.onstop = async () => {
        console.log("[v0] Recording stopped, processing audio...")
        setIsRecording(false)
        setIsProcessing(true)

        stream.getTracks().forEach((track) => track.stop())

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        audioChunksRef.current = []

        const reader = new FileReader()
        reader.onload = async () => {
          const audioData = reader.result as string

          try {
            console.log("[v0] Sending audio to transcribe API...")
            const response = await fetch("/api/transcribe-audio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audioData: audioData,
                mimeType: "audio/wav",
              }),
            })

            const result = await response.json()

            if (response.ok && result.transcript) {
              console.log("[v0] Transcription received:", result.transcript)
              onTranscribed(result.transcript)
            } else {
              console.error("[v0] Transcription error:", result.error)
              if (result.error?.includes("API key")) {
                alert(
                  "⚠️ Google API Key Error\n\n" +
                    "Please add your GOOGLE_GENERATIVE_AI_KEY to the environment variables:\n\n" +
                    "1. Go to the 'Vars' section in the v0 sidebar\n" +
                    "2. Add GOOGLE_GENERATIVE_AI_KEY with your API key from https://aistudio.google.com/apikey",
                )
              } else {
                alert(`Transcription failed: ${result.error}`)
              }
            }
          } catch (error) {
            console.error("[v0] API call failed:", error)
            alert("Failed to transcribe audio. Please try again.")
          } finally {
            setIsProcessing(false)
          }
        }
        reader.readAsDataURL(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error: any) {
      console.error("[v0] Microphone access error:", error)
      alert(`Microphone error: ${error.message}. Please check permissions.`)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      console.log("[v0] Stop recording called")
    }
  }

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isLoading || isProcessing}
      className={`p-3 rounded-full transition-all ${
        isRecording
          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
          : isProcessing
            ? "bg-yellow-500 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400"
      }`}
      title={
        isRecording ? "Click to stop recording" : isProcessing ? "Processing audio..." : "Click to start recording"
      }
    >
      {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  )
}
