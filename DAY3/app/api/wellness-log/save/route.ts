import type { NextRequest } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const entry = await request.json()
    const filePath = path.join(process.cwd(), "wellness_log.json")

    // Read existing log or create new array
    let log = []
    try {
      const fileContent = await fs.readFile(filePath, "utf-8")
      log = JSON.parse(fileContent)
    } catch (readError) {
      // File doesn't exist yet, start with empty array
      log = []
    }

    // Add new entry
    log.push(entry)

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(log, null, 2), "utf-8")

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving wellness log:", error)
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
}
