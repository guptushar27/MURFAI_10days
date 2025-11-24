import { writeFile } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  try {
    const entry = await request.json()

    const filePath = join(process.cwd(), "wellness_log.json")

    let existingData = []
    try {
      const fs = await import("fs/promises")
      const fileContent = await fs.readFile(filePath, "utf-8")
      existingData = JSON.parse(fileContent)
    } catch {
      existingData = []
    }

    existingData.push(entry)

    await writeFile(filePath, JSON.stringify(existingData, null, 2))

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving check-in:", error)
    return Response.json({ error: "Failed to save check-in" }, { status: 500 })
  }
}
