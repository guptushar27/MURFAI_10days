import { z } from "zod";

// Product schema for the shopping catalog
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  currency: z.string(),
  category: z.string(),
  color: z.string().optional(),
  size: z.string().optional(),
  inStock: z.boolean().default(true),
  image: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;

// Order line item
export const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number(),
  price: z.number(),
  currency: z.string(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.string(),
  items: z.array(orderItemSchema),
  total: z.number(),
  currency: z.string(),
  createdAt: z.string(),
  customerName: z.string().optional(),
  customerAddress: z.string().optional(),
  estimatedDelivery: z.string().optional(),
});

export type Order = z.infer<typeof orderSchema>;

// Insert order schema (without id and createdAt)
export const insertOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
  })),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Chat message schema
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
});

export type Message = z.infer<typeof messageSchema>;

// Voice session state
export type VoiceSessionState = "idle" | "listening" | "processing" | "speaking";

// Chat request/response
export const chatRequestSchema = z.object({
  message: z.string(),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  message: z.string(),
  action: z.object({
    type: z.enum(["none", "show_products", "create_order", "show_order"]),
    data: z.any().optional(),
  }).optional(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

// TTS request
export const ttsRequestSchema = z.object({
  text: z.string(),
  voiceId: z.string().optional(),
});

export type TTSRequest = z.infer<typeof ttsRequestSchema>;
