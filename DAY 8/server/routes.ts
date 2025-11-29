import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateGameMasterResponse, generateInitialScene } from "./gemini";
import { generateSpeech } from "./murf";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/chat", async (req, res) => {
    try {
      const { conversationHistory, isInitial, universe } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          error: "Gemini API key not configured. Please set GEMINI_API_KEY in secrets." 
        });
      }

      let responseText: string;

      if (isInitial) {
        responseText = await generateInitialScene(universe || "Dark Fantasy");
      } else {
        if (!conversationHistory || !Array.isArray(conversationHistory)) {
          return res.status(400).json({ error: "Invalid conversation history" });
        }
        responseText = await generateGameMasterResponse(conversationHistory);
      }

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceId } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const result = await generateSpeech({ text, voiceId });

      if (result.error) {
        return res.status(503).json({ error: result.error });
      }

      res.json(result);
    } catch (error: any) {
      console.error("TTS API error:", error);
      res.status(500).json({ error: error.message || "TTS generation failed" });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok",
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      murfConfigured: !!process.env.MURF_API_KEY,
    });
  });

  return httpServer;
}
