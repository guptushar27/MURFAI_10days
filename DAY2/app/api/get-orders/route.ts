import { readdir, readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function GET() {
  try {
    const ordersDir = join(process.cwd(), "public", "orders")

    if (!existsSync(ordersDir)) {
      return Response.json({ orders: [] })
    }

    const files = await readdir(ordersDir)
    const jsonFiles = files.filter((file) => file.endsWith(".json"))

    const orders = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await readFile(join(ordersDir, file), "utf-8")
        return JSON.parse(content)
      }),
    )

    // Sort by timestamp, newest first
    orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return Response.json({ orders })
  } catch (error) {
    console.error("Error reading orders:", error)
    return Response.json({ orders: [], error: "Failed to read orders" }, { status: 500 })
  }
}
