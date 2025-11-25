"use client"

import { BookOpen, HelpCircle, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LearningMode } from "@/lib/tutor-content"

interface ModeSelectorProps {
  onSelectMode: (mode: LearningMode) => void
  isLoading?: boolean
}

const modes = [
  {
    id: "learn" as LearningMode,
    title: "Learn Mode",
    description: "Matthew explains concepts to you",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/5",
    borderColor: "border-blue-500/20 hover:border-blue-500/50",
  },
  {
    id: "quiz" as LearningMode,
    title: "Quiz Mode",
    description: "Alicia tests your knowledge",
    icon: HelpCircle,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/5",
    borderColor: "border-purple-500/20 hover:border-purple-500/50",
  },
  {
    id: "teach_back" as LearningMode,
    title: "Teach Back Mode",
    description: "Teach Ken what you know",
    icon: GraduationCap,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/50",
  },
]

export function ModeSelector({ onSelectMode, isLoading }: ModeSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {modes.map((mode) => {
        const Icon = mode.icon
        return (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10 ${mode.bgColor} ${mode.borderColor} border bg-neutral-900/50 backdrop-blur-sm`}
            onClick={() => !isLoading && onSelectMode(mode.id)}
          >
            <CardHeader className="pb-2">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-3 shadow-lg`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg text-white">{mode.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-white/60">{mode.description}</CardDescription>
              <Button
                variant="ghost"
                className="mt-3 w-full text-white/80 hover:text-white hover:bg-white/10"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Select"}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
