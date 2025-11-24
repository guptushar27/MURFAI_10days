import { join } from "path"

export async function GET() {
  try {
    const filePath = join(process.cwd(), "wellness_log.json")

    try {
      const fs = await import("fs/promises")
      const fileContent = await fs.readFile(filePath, "utf-8")
      const data = JSON.parse(fileContent)
      return Response.json(data)
    } catch {
      return Response.json([])
    }
  } catch (error) {
    console.error("[v0] Error reading check-in history:", error)
    return Response.json([])
  }
}
