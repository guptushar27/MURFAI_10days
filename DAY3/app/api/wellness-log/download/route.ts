import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "wellness_log.json")

    if (!fs.existsSync(filePath)) {
      return new NextResponse(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=wellness_log_${new Date().toISOString().split("T")[0]}.json`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    const fileContent = fs.readFileSync(filePath, "utf-8")

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=wellness_log_${new Date().toISOString().split("T")[0]}.json`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("[v0] Error downloading wellness log:", error)
    return NextResponse.json({ error: "Failed to download wellness log" }, { status: 500 })
  }
}
