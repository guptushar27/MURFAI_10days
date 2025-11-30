// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import type { Product, Order } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `You are Nova, a friendly and helpful voice shopping assistant. You help users browse products, find items they're looking for, and place orders.

Available product categories: mugs, hoodies, t-shirts, bottles, bags
All prices are in Indian Rupees (₹)
Sizes available: S (Small), M (Medium), L (Large) for hoodies and t-shirts

When responding:
1. Be concise and conversational - this is a voice interface
2. Speak naturally as if talking to a friend
3. When showing products, mention 2-3 key details (name, price, color, size if available)
4. Confirm orders clearly with product name, size (if applicable), quantity, and price in rupees
5. Keep responses under 60 words for faster voice experience

Checkout Flow:
- When user says "place order" or "that's all": Ask for their full name
- When user provides name: Ask for their delivery address
- When user provides address: Show order summary with estimated delivery (3-5 business days) and confirm

You can help users:
- Browse the catalog ("show me all mugs", "what t-shirts do you have")
- Search by criteria ("find black hoodies under 3000 rupees", "small t-shirts")
- Place orders ("I'll buy the first one", "place order", "that's all")
- Check their last order ("what did I just buy", "what was my order")

Always be helpful and guide users if they seem unsure what to do.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ActionResult {
  type: "none" | "show_products" | "create_order" | "show_order" | "request_name" | "request_address" | "show_summary";
  data?: Product[] | Order;
}

// In-memory cart storage for current session
let sessionCart: Array<{ productId: string; quantity: number }> = [];
let sessionCustomerName: string | undefined;
let sessionCustomerAddress: string | undefined;
let waitingForName: boolean = false;
let waitingForAddress: boolean = false;

async function determineIntent(message: string, history: ChatMessage[], lastShownProducts?: Product[]): Promise<{
  intent: "browse" | "search" | "order" | "checkout" | "collect_name" | "collect_address" | "check_order" | "general";
  filters?: { category?: string; maxPrice?: number; color?: string; search?: string };
  orderDetails?: { productIndex?: number; productId?: string; quantity?: number; size?: string };
  customerInfo?: { name?: string; address?: string };
}> {
  const lowerMessage = message.toLowerCase();
  
  // Check for checkout trigger
  if (lowerMessage.includes("place order") || 
      lowerMessage.includes("that's all") ||
      lowerMessage.includes("thats all") ||
      lowerMessage.includes("checkout") ||
      lowerMessage.includes("confirm") && lowerMessage.includes("order")) {
    return { intent: "checkout" };
  }
  
  // State-based name collection (higher priority than pattern matching)
  if (waitingForName) {
    // Any non-command response while waiting for name is treated as the name
    if (!lowerMessage.match(/^(show|find|browse|search|order|buy|place|that)/)) {
      return { intent: "collect_name", customerInfo: { name: message } };
    }
  }
  
  // State-based address collection (higher priority than pattern matching)
  if (waitingForAddress) {
    // Any non-command response while waiting for address is treated as the address
    if (!lowerMessage.match(/^(show|find|browse|search|order|buy|place|yes|no)/)) {
      return { intent: "collect_address", customerInfo: { address: message } };
    }
  }
  
  // Fallback: Check if providing name (context-based - after asking for name)
  const lastMessage = history[history.length - 1];
  if (lastMessage?.content.toLowerCase().includes("your full name") || 
      lastMessage?.content.toLowerCase().includes("what's your name")) {
    // Extract name from message - typically not a command word
    if (!lowerMessage.match(/^(show|find|browse|search|order|buy)/)) {
      return { intent: "collect_name", customerInfo: { name: message } };
    }
  }
  
  // Fallback: Check if providing address (context-based)
  if (lastMessage?.content.toLowerCase().includes("delivery address") || 
      lastMessage?.content.toLowerCase().includes("shipping address")) {
    // If doesn't match command patterns, treat as address
    if (!lowerMessage.match(/^(show|find|browse|search|order|buy|yes|no)/)) {
      return { intent: "collect_address", customerInfo: { address: message } };
    }
  }
  
  // Check for order status queries
  if (lowerMessage.includes("what did i") || 
      lowerMessage.includes("my order") || 
      lowerMessage.includes("last order") ||
      lowerMessage.includes("just buy") ||
      lowerMessage.includes("just bought") ||
      lowerMessage.includes("recent order")) {
    return { intent: "check_order" };
  }
  
  // Check for order intent (adding single product to cart)
  if (lowerMessage.includes("buy") || 
      (lowerMessage.includes("order") && !lowerMessage.includes("order status")) || 
      lowerMessage.includes("purchase") ||
      lowerMessage.includes("i'll take") ||
      lowerMessage.includes("i want")) {
    
    // Try to extract product reference with expanded ordinal support
    const firstMatch = lowerMessage.match(/\b(?:first|1st|one)\b/);
    const secondMatch = lowerMessage.match(/\b(?:second|2nd|two)\b/);
    const thirdMatch = lowerMessage.match(/\b(?:third|3rd|three)\b/);
    const fourthMatch = lowerMessage.match(/\b(?:fourth|4th|four)\b/);
    const fifthMatch = lowerMessage.match(/\b(?:fifth|5th|five)\b/);
    const sixthMatch = lowerMessage.match(/\b(?:sixth|6th|six)\b/);
    const seventhMatch = lowerMessage.match(/\b(?:seventh|7th|seven)\b/);
    const eighthMatch = lowerMessage.match(/\b(?:eighth|8th|eight)\b/);
    const ninthMatch = lowerMessage.match(/\b(?:ninth|9th|nine)\b/);
    const tenthMatch = lowerMessage.match(/\b(?:tenth|10th|ten)\b/);
    
    let productIndex: number | undefined;
    if (firstMatch) productIndex = 0;
    else if (secondMatch) productIndex = 1;
    else if (thirdMatch) productIndex = 2;
    else if (fourthMatch) productIndex = 3;
    else if (fifthMatch) productIndex = 4;
    else if (sixthMatch) productIndex = 5;
    else if (seventhMatch) productIndex = 6;
    else if (eighthMatch) productIndex = 7;
    else if (ninthMatch) productIndex = 8;
    else if (tenthMatch) productIndex = 9;
    
    // Extract size preference
    let size: string | undefined;
    if (lowerMessage.match(/\b(?:small|s)\b/)) size = "S";
    else if (lowerMessage.match(/\b(?:medium|m)\b/)) size = "M";
    else if (lowerMessage.match(/\b(?:large|l)\b/)) size = "L";
    
    return {
      intent: "order",
      orderDetails: { productIndex, quantity: 1, size }
    };
  }
  
  // Check for browse/search intent
  if (lowerMessage.includes("show") || 
      lowerMessage.includes("find") || 
      lowerMessage.includes("looking for") ||
      lowerMessage.includes("do you have") ||
      lowerMessage.includes("browse") ||
      lowerMessage.includes("what") ||
      lowerMessage.includes("any")) {
    
    const filters: { category?: string; maxPrice?: number; color?: string; search?: string } = {};
    
    // Detect category
    if (lowerMessage.includes("mug") || lowerMessage.includes("cup")) {
      filters.category = "mug";
    } else if (lowerMessage.includes("hoodie") || lowerMessage.includes("hoodies")) {
      filters.category = "hoodie";
    } else if (lowerMessage.includes("t-shirt") || lowerMessage.includes("tshirt") || lowerMessage.includes("shirt")) {
      filters.category = "tshirt";
    } else if (lowerMessage.includes("bottle")) {
      filters.category = "bottle";
    } else if (lowerMessage.includes("bag") || lowerMessage.includes("tote")) {
      filters.category = "bag";
    }
    
    // Detect color
    const colors = ["black", "white", "gray", "grey", "blue", "navy", "charcoal", "silver", "natural"];
    for (const color of colors) {
      if (lowerMessage.includes(color)) {
        filters.color = color === "grey" ? "gray" : color;
        break;
      }
    }
    
    // Detect price limit
    const priceMatch = lowerMessage.match(/under\s*(\d+)|less than\s*(\d+)|below\s*(\d+)|(\d+)\s*or less/);
    if (priceMatch) {
      const price = priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4];
      filters.maxPrice = parseInt(price);
    }
    
    return { intent: filters.category ? "search" : "browse", filters };
  }
  
  return { intent: "general" };
}

export async function processChat(
  message: string,
  conversationHistory: ChatMessage[],
  lastShownProducts?: Product[]
): Promise<{ message: string; action?: ActionResult }> {
  try {
    const intent = await determineIntent(message, conversationHistory, lastShownProducts);
    let contextInfo = "";
    let action: ActionResult = { type: "none" };
    
    // Handle different intents
    if (intent.intent === "checkout") {
      // User is ready to checkout - ask for name
      waitingForName = true;
      waitingForAddress = false;
      action = { type: "request_name" };
      contextInfo = "\n\nUser is ready to checkout. Now collecting their name.";
    } else if (intent.intent === "collect_name") {
      // Store name and ask for address
      waitingForName = false;
      waitingForAddress = true;
      sessionCustomerName = intent.customerInfo?.name;
      action = { type: "request_address" };
      contextInfo = `\n\nCustomer name collected: ${sessionCustomerName}. Now collecting address.`;
    } else if (intent.intent === "collect_address") {
      // Store address and show summary then create order
      waitingForName = false;
      waitingForAddress = false;
      sessionCustomerAddress = intent.customerInfo?.address;
      
      // Get last displayed products or use all products
      const lastProducts = await storage.listProducts();
      if (lastProducts.length > 0 && sessionCart.length === 0) {
        // If no items in cart yet, add the first product
        sessionCart.push({ productId: lastProducts[0].id, quantity: 1 });
      }
      
      if (sessionCart.length > 0) {
        action = { type: "show_summary" };
        contextInfo = `\n\nCustomer address: ${sessionCustomerAddress}. Ready to show summary.`;
      } else {
        contextInfo = "\n\nNo items in cart. User needs to select products first.";
      }
    } else if (intent.intent === "check_order") {
      const lastOrder = await storage.getLastOrder();
      if (lastOrder) {
        action = { type: "show_order", data: lastOrder };
        contextInfo = `\n\nUser's last order:\n${JSON.stringify(lastOrder, null, 2)}`;
      } else {
        contextInfo = "\n\nThe user hasn't placed any orders yet.";
      }
    } else if (intent.intent === "browse" || intent.intent === "search") {
      const products = await storage.listProducts(intent.filters);
      if (products.length > 0) {
        action = { type: "show_products", data: products };
        // Limit context to first 4 products for faster processing
        const productsList = products.slice(0, 4).map((p, i) => 
          `${i + 1}. ${p.name}${p.size ? ` (${p.size})` : ''} - ${p.color || ''} - ₹${p.price}`
        ).join('\n');
        contextInfo = `\n\nProducts found (${products.length} items):\n${productsList}`;
      } else {
        contextInfo = "\n\nNo products match the search criteria.";
      }
    } else if (intent.intent === "order") {
      // Add product to session cart - use lastShownProducts to reference what user saw
      const productsToUse = lastShownProducts && lastShownProducts.length > 0 ? lastShownProducts : await storage.listProducts();
      const productIndex = intent.orderDetails?.productIndex ?? 0;
      const requestedSize = intent.orderDetails?.size;
      
      if (productsToUse.length > productIndex) {
        let productToOrder = productsToUse[productIndex];
        
        // If size is specified and product supports sizes, find the correct size variant
        if (requestedSize && (productToOrder.size || productsToUse.some(p => p.name === productToOrder.name && p.size))) {
          const variant = productsToUse.find(p => 
            p.name === productToOrder.name && 
            p.color === productToOrder.color && 
            p.size === requestedSize
          );
          if (variant) {
            productToOrder = variant;
          }
        }
        
        // Check if already in cart
        const existingItem = sessionCart.find(item => item.productId === productToOrder.id);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          sessionCart.push({
            productId: productToOrder.id,
            quantity: 1
          });
        }
        const sizeStr = productToOrder.size ? ` (${productToOrder.size})` : '';
        contextInfo = `\n\nAdded to cart: ${productToOrder.name}${sizeStr}. Items in cart: ${sessionCart.length}`;
      } else {
        contextInfo = "\n\nCouldn't determine which product to order. Ask user to specify.";
      }
    }
    
    // Build conversation for Gemini
    const contents = [
      { role: "user" as const, parts: [{ text: SYSTEM_PROMPT + contextInfo }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: msg.content }]
      })),
      { role: "user" as const, parts: [{ text: message }] }
    ];
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });
    
    const responseText = response.text || "I'm sorry, I didn't understand that. Could you try again?";
    
    // Handle show_summary action - create the order
    if (action.type === "show_summary" && sessionCart.length > 0) {
      try {
        const estimatedDeliveryDate = new Date();
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 4); // 4 business days
        
        const order = await storage.createOrder(sessionCart, {
          customerName: sessionCustomerName,
          customerAddress: sessionCustomerAddress,
          estimatedDelivery: estimatedDeliveryDate.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        });
        
        // Reset session cart and customer info
        sessionCart = [];
        sessionCustomerName = undefined;
        sessionCustomerAddress = undefined;
        
        action = { type: "create_order", data: order };
      } catch (error) {
        console.error("Error creating order:", error);
      }
    }
    
    return {
      message: responseText,
      action: action.type !== "none" ? action : undefined
    };
  } catch (error) {
    console.error("Gemini chat error:", error);
    return {
      message: "I'm having trouble processing that right now. Could you try again?",
    };
  }
}
