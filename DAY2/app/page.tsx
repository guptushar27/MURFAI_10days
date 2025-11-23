"use client"
import { BaristaAgent } from "@/components/barista-agent"
import { BackgroundBeams } from "@/components/ui/background-beams"

export default function Home() {
  return (
    <div className="relative w-full min-h-screen bg-background overflow-hidden">
      <BackgroundBeams className="opacity-30" />
      <div className="relative z-10">
        <BaristaAgent />
      </div>
    </div>
  )
}
