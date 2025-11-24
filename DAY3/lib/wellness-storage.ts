export interface WellnessEntry {
  timestamp: string // ISO date-time
  mood: string // Self-reported mood (text or scale)
  objectives: string[] // One or more stated objectives/intentions
  summary?: string // Optional agent-generated summary
  fullExchange: {
    user: string
    agent: string
  }
}

export async function readWellnessLog(): Promise<WellnessEntry[]> {
  try {
    const response = await fetch("/api/checkin/history")
    if (response.ok) {
      return await response.json()
    }
    return []
  } catch (error) {
    console.error("Error reading wellness log:", error)
    return []
  }
}

export async function writeWellnessLog(entry: WellnessEntry): Promise<void> {
  try {
    const response = await fetch("/api/checkin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    })
    if (!response.ok) {
      console.error("Failed to save wellness log")
    }
  } catch (error) {
    console.error("Error writing wellness log:", error)
  }
}
