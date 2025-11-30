import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { processChat } from "./gemini";
import { synthesizeSpeech, AVAILABLE_VOICES } from "./murf";
import { chatRequestSchema, ttsRequestSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Chat endpoint - processes user messages through Gemini AI
  app.post("/api/chat", async (req, res) => {
    try {
      const parsed = chatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      const { message, conversationHistory, lastShownProducts } = req.body;
      const result = await processChat(message, conversationHistory, lastShownProducts);
      
      res.json(result);
    } catch (error) {
      console.error("Chat endpoint error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });
  
  // TTS endpoint - converts text to speech using Murf AI Falcon
  app.post("/api/tts", async (req, res) => {
    try {
      const parsed = ttsRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      const { text, voiceId } = parsed.data;
      const audioBuffer = await synthesizeSpeech({ text, voiceId });
      
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      });
      res.send(audioBuffer);
    } catch (error) {
      console.error("TTS endpoint error:", error);
      res.status(500).json({ error: "Failed to synthesize speech" });
    }
  });
  
  // Get available TTS voices
  app.get("/api/voices", (req, res) => {
    res.json(AVAILABLE_VOICES);
  });
  
  // Products API - list products with optional filters
  app.get("/api/products", async (req, res) => {
    try {
      const { category, maxPrice, color, search } = req.query;
      
      const filters: {
        category?: string;
        maxPrice?: number;
        color?: string;
        search?: string;
      } = {};
      
      if (category && typeof category === "string") {
        filters.category = category;
      }
      if (maxPrice && typeof maxPrice === "string") {
        filters.maxPrice = parseInt(maxPrice);
      }
      if (color && typeof color === "string") {
        filters.color = color;
      }
      if (search && typeof search === "string") {
        filters.search = search;
      }
      
      const products = await storage.listProducts(
        Object.keys(filters).length > 0 ? filters : undefined
      );
      res.json(products);
    } catch (error) {
      console.error("Products endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  // Get single product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Product endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });
  
  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid order items" });
      }
      
      const order = await storage.createOrder(items);
      res.json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  
  // Get orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.listOrders();
      res.json(orders);
    } catch (error) {
      console.error("Orders endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  
  // Get last order
  app.get("/api/orders/last", async (req, res) => {
    try {
      const order = await storage.getLastOrder();
      if (!order) {
        return res.status(404).json({ error: "No orders found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Last order endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch last order" });
    }
  });
  
  // Get single order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Order endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  return httpServer;
}
