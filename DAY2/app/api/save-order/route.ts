import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(req: Request) {
  try {
    const order = await req.json()

    // Create orders directory if it doesn't exist
    const ordersDir = join(process.cwd(), "public", "orders")
    if (!existsSync(ordersDir)) {
      await mkdir(ordersDir, { recursive: true })
    }

    // Generate timestamp for unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `order_${timestamp}.json`
    const filepath = join(ordersDir, filename)

    // Prepare order summary
    const orderSummary = {
      id: filename.replace(".json", ""),
      timestamp: new Date().toISOString(),
      customerName: order.name,
      drink: {
        type: order.drinkType,
        size: order.size,
        milk: order.milk,
      },
      extras: order.extras || [],
      status: "completed",
    }

    // Save to file
    await writeFile(filepath, JSON.stringify(orderSummary, null, 2))

    return Response.json({
      success: true,
      message: "Order saved successfully",
      orderFile: filename,
    })
  } catch (error) {
    console.error("Error saving order:", error)
    return Response.json({ success: false, error: "Failed to save order" }, { status: 500 })
  }
}
