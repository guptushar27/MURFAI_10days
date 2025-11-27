import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFraudCaseSchema, updateFraudCaseSchema, insertCallSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all fraud cases
  app.get("/api/fraud-cases", async (req, res) => {
    try {
      const cases = await storage.getAllFraudCases();
      res.json(cases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fraud cases" });
    }
  });

  // Get fraud case by username
  app.get("/api/fraud-cases/:userName", async (req, res) => {
    try {
      const fraudCase = await storage.getFraudCaseByUserName(req.params.userName);
      if (!fraudCase) {
        return res.status(404).json({ error: "Fraud case not found" });
      }
      res.json(fraudCase);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fraud case" });
    }
  });

  // Create fraud case
  app.post("/api/fraud-cases", async (req, res) => {
    try {
      const data = insertFraudCaseSchema.parse(req.body);
      const fraudCase = await storage.createFraudCase(data);
      res.status(201).json(fraudCase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create fraud case" });
    }
  });

  // Update fraud case status
  app.patch("/api/fraud-cases/:id/status", async (req, res) => {
    try {
      const data = updateFraudCaseSchema.parse(req.body);
      const fraudCase = await storage.updateFraudCaseStatus(req.params.id, data);
      res.json(fraudCase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update fraud case" });
    }
  });

  // Create call session (log completed calls)
  app.post("/api/call-sessions", async (req, res) => {
    try {
      const data = insertCallSessionSchema.parse(req.body);
      const session = await storage.createCallSession(data);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create call session" });
    }
  });

  // Text-to-speech with Murf AI (proxying to keep API key secure)
  app.post("/api/tts/generate", async (req, res) => {
    try {
      const { text, voiceId = "en-US-falcon" } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const murfApiKey = process.env.MURF_API_KEY;
      if (!murfApiKey) {
        return res.status(503).json({ error: "TTS service not configured" });
      }

      const response = await fetch('https://api.murf.ai/v1/speech/generate', {
        method: 'POST',
        headers: {
          'api-key': murfApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voiceId,
          format: 'mp3',
          channelType: 'MONO'
        })
      });

      if (!response.ok) {
        throw new Error('Murf API Error');
      }

      const data = await response.json();
      res.json({ audioUrl: data.audioFile });
    } catch (error) {
      console.error("TTS Generation failed:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  return httpServer;
}
