// This makes the barista work reliably without depending on external services

const drinks = {
  espresso: "Espresso",
  latte: "Latte",
  cappuccino: "Cappuccino",
  americano: "Americano",
  macchiato: "Macchiato",
  mocha: "Mocha",
  "flat white": "Flat White",
  cortado: "Cortado",
  affogato: "Affogato",
  ristretto: "Ristretto",
}

const sizes = {
  small: "Small",
  medium: "Medium",
  large: "Large",
}

const milks = {
  whole: "Whole",
  skim: "Skim",
  "2%": "2%",
  oat: "Oat",
  almond: "Almond",
  soy: "Soy",
  coconut: "Coconut",
}

function generateBaristaResponse(
  currentOrder: {
    drinkType: string
    size: string
    milk: string
    extras: string[]
    name: string
  },
  userMessage: string,
) {
  const missing = []
  if (!currentOrder.drinkType) missing.push("drink type")
  if (!currentOrder.size) missing.push("size")
  if (!currentOrder.milk) missing.push("milk type")
  if (!currentOrder.name) missing.push("your name")

  if (missing.length === 0) {
    const extras = currentOrder.extras.length > 0 ? `, with ${currentOrder.extras.join(", ")}` : ""
    return `Perfect! So I have a ${currentOrder.size} ${currentOrder.drinkType} with ${currentOrder.milk} milk${extras} for ${currentOrder.name}. ORDER CONFIRMED`
  }

  if (missing.length === 4) {
    return "Welcome to Brewed Haven! I'd be happy to help. What drink would you like today? (We have Espresso, Latte, Cappuccino, Americano, Macchiato, Mocha, Flat White, and more!)"
  }

  const response = "Great! "

  if (!currentOrder.drinkType) {
    return `${response}So you want a ${currentOrder.size || ""} ${currentOrder.milk || ""} milk drink. What type of drink would you like? (Latte, Cappuccino, Americano, etc.)`
  }

  if (!currentOrder.size) {
    return `${response}A ${currentOrder.drinkType} with ${currentOrder.milk || "which"} milk. What size would you like? (Small, Medium, or Large)`
  }

  if (!currentOrder.milk) {
    return `${response}A ${currentOrder.size} ${currentOrder.drinkType}. What type of milk would you prefer? (Whole, Skim, Oat, Almond, Soy, or Coconut)`
  }

  if (!currentOrder.name) {
    return `${response}A ${currentOrder.size} ${currentOrder.drinkType} with ${currentOrder.milk} milk. What's your name?`
  }

  return `Almost there! What else can I add? Any extra shots, syrups, or toppings?`
}

function extractOrderDetails(
  userMessage: string,
  currentOrder: { drinkType: string; size: string; milk: string; extras: string[]; name: string },
) {
  const updatedOrder = { ...currentOrder }
  const messageLower = userMessage.toLowerCase()

  // Extract drink type
  for (const [key, value] of Object.entries(drinks)) {
    if (messageLower.includes(key)) {
      updatedOrder.drinkType = value
      break
    }
  }

  // Extract size
  for (const [key, value] of Object.entries(sizes)) {
    if (messageLower.includes(key)) {
      updatedOrder.size = value
      break
    }
  }

  // Extract milk
  for (const [key, value] of Object.entries(milks)) {
    if (messageLower.includes(key)) {
      updatedOrder.milk = value
      break
    }
  }

  if (!updatedOrder.name) {
    const namePatterns = [
      /(?:my name is|i'm|i am|call me|it's|it is)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /^([a-z]+(?:\s+[a-z]+)?)$/i, // Just the name if it's the only thing said
    ]

    for (const pattern of namePatterns) {
      const nameMatch = messageLower.match(pattern)
      if (nameMatch && nameMatch[1]) {
        const rawName = nameMatch[1].trim()
        updatedOrder.name = rawName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
        break
      }
    }
  }

  // Extract extras (shots, syrups, etc.)
  const extraKeywords = ["shot", "syrup", "caramel", "vanilla", "hazelnut", "chocolate", "whipped cream", "cinnamon"]
  for (const extra of extraKeywords) {
    if (messageLower.includes(extra) && !updatedOrder.extras.includes(extra)) {
      updatedOrder.extras.push(extra.charAt(0).toUpperCase() + extra.slice(1))
    }
  }

  return updatedOrder
}

export async function POST(req: Request) {
  try {
    const { messages, currentOrder } = await req.json()

    const userMessage = messages[messages.length - 1]?.text || ""

    // Extract order details from user message
    const updatedOrder = extractOrderDetails(userMessage, currentOrder)

    // Generate barista response
    const response = generateBaristaResponse(updatedOrder, userMessage)

    // Check if order is complete
    const orderComplete =
      updatedOrder.drinkType &&
      updatedOrder.size &&
      updatedOrder.milk &&
      updatedOrder.name &&
      response.includes("ORDER CONFIRMED")

    return Response.json({
      response,
      updatedOrder,
      orderComplete,
    })
  } catch (error) {
    console.error("[v0] Barista API Error:", error instanceof Error ? error.message : String(error))
    const currentOrder = {} // Declare currentOrder here
    return Response.json(
      {
        response: "I apologize, there was an error processing your order. Please try again.",
        updatedOrder: currentOrder || {},
        orderComplete: false,
      },
      { status: 500 },
    )
  }
}
