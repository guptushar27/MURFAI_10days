"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ModeSelector } from "./mode-selector"
import { VoiceAgent } from "./voice-agent"
import type { LearningMode } from "@/lib/tutor-content"
import { Sparkles, Bot } from "lucide-react"
import { BeamsBackground } from "@/components/ui/beams-background"

export function TutorApp() {
  const [selectedMode, setSelectedMode] = useState<LearningMode | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)

  const handleSelectMode = useCallback((mode: LearningMode) => {
    setIsLoading(true)
    setSelectedMode(mode)
    setShowWelcome(false)
    // Small delay for smooth transition
    setTimeout(() => setIsLoading(false), 500)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedMode(null)
  }, [])

  // Listen for mode switch commands in the voice agent
  useEffect(() => {
    const handleModeSwitch = (event: CustomEvent<{ mode: LearningMode }>) => {
      handleSelectMode(event.detail.mode)
    }

    window.addEventListener("switchMode" as any, handleModeSwitch)
    return () => window.removeEventListener("switchMode" as any, handleModeSwitch)
  }, [handleSelectMode])

  return (
    <BeamsBackground intensity="medium" className="min-h-screen">
      <div className="absolute inset-0 z-10 overflow-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-cyan-300 mb-4 border border-white/10">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Day 4 – Active Recall Coach</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">Teach-the-Tutor</h1>
            <p className="text-white/60 max-w-md mx-auto">
              The best way to learn is to teach. Choose a mode and start your learning journey!
            </p>
          </div>

          {/* Main Content */}
          <Card className="shadow-2xl border border-white/10 overflow-hidden bg-neutral-900/80 backdrop-blur-xl">
            {selectedMode ? (
              <VoiceAgent mode={selectedMode} onBack={handleBack} />
            ) : (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">Choose Your Learning Mode</CardTitle>
                  <CardDescription className="text-white/60">
                    Each mode uses a different AI tutor to help you master programming concepts
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ModeSelector onSelectMode={handleSelectMode} isLoading={isLoading} />

                  {/* Mode descriptions */}
                  <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="font-semibold mb-3 text-center text-white">How It Works</h3>
                    <div className="grid gap-3 text-sm text-white/70">
                      <div className="flex gap-3">
                        <span className="font-mono text-cyan-400">01</span>
                        <span>
                          <strong className="text-white">Learn:</strong> Matthew explains concepts clearly with examples
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-mono text-purple-400">02</span>
                        <span>
                          <strong className="text-white">Quiz:</strong> Alicia tests your knowledge with questions
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-mono text-emerald-400">03</span>
                        <span>
                          <strong className="text-white">Teach Back:</strong> Teach Ken to reinforce your learning
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>

          {/* Tips */}
          {!selectedMode && (
            <div className="mt-6 text-center text-sm text-white/50">
              <p>Tip: You can switch modes anytime by saying "switch to [mode] mode"</p>
            </div>
          )}
        </div>
      </div>
    </BeamsBackground>
  )
}
