"use client"

import { Heart, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export const WellnessHeader = () => {
  const handleDownloadLog = async () => {
    try {
      const response = await fetch("/api/wellness-log/download")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `wellness_log_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Failed to download wellness log:", error)
      alert("Failed to download wellness log. Please try again.")
    }
  }

  return (
    <header className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border-b border-white/10 px-6 py-6 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-full">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Daily Wellness Check-In</h1>
            <p className="text-white/70 text-sm mt-1">Your personal health & wellness companion</p>
          </div>
        </div>

        <Button
          onClick={handleDownloadLog}
          variant="outline"
          size="sm"
          className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2"
        >
          <Download className="w-4 h-4" />
          Download Log
        </Button>
      </div>
    </header>
  )
}
