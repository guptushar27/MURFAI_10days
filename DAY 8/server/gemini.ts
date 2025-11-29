import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const SYSTEM_INSTRUCTION = `You are a story guide who creates fun, easy-to-follow adventures.

THE STORY WORLD:
- A fantasy world with simple locations (forest, town, dungeon, castle)
- Magic and creatures exist but nothing too scary
- People and creatures you meet have clear goals
- The story makes sense and follows simple rules

YOUR JOB:
- Tell the player what happens in simple words
- Guide them through the adventure
- Remember what they've done
- Keep the story moving forward based on their choices

HOW TO WRITE:
- Use easy, everyday words
- Describe things clearly but not too long
- Keep it fun and interesting
- Write 2-3 sentences most of the time
- Always ask "What do you do?" at the end

RULES:
- The player tells you what they do
- You say what happens next
- Remember people, places, and things they find
- Make the adventure get more interesting as it goes
- Give them real choices that matter`;

const FALLBACK_RESPONSES = [
  "You see a path that splits in two directions. One way looks safe and easy. The other way looks scary but might have treasure. What do you do?",
  "You hear a noise in the distance. It could be an animal, a person, or something else. What do you do?",
  "You find an old chest on the ground. It's locked and might have something useful inside. What do you do?",
  "Someone walks up to you. They look friendly but you're not sure what they want. What do you do?",
  "You find something shiny on the ground. You don't know what it is but it might be important. What do you do?",
];

export async function generateGameMasterResponse(
  conversationHistory: ChatMessage[]
): Promise<string> {
  try {
    const contents = conversationHistory.map(msg => ({
      role: msg.role,
      parts: msg.parts
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return response.text || "The void remains silent. What do you do?";
  } catch (error: any) {
    console.error("Gemini API error:", error);
    
    if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      console.log("Using fallback response due to quota limits");
      return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    }
    
    throw new Error(`Failed to generate response: ${error}`);
  }
}

const INITIAL_SCENES: Record<string, string> = {
  "Dark Fantasy": "You're standing in front of a big stone gate. It looks really old and has strange symbols on it. Beyond the gate, you can see shadows moving. This looks like an adventure is about to start. What do you do?",
  "Cyberpunk": "You're in a busy city at night with lots of bright lights and screens. Flying cars zoom past you. Your computer sends you a message: someone needs your help. What do you do?",
  "High Fantasy": "You wake up in a pretty forest with tall trees and flowers. The air smells fresh and magic feels real here. Far away, you can see a castle on a hill. What do you do?",
  "Sci-Fi": "A door opens and you wake up inside a spaceship. Red lights are flashing and the ship is shaking a little. An alarm says there's a problem. You need to figure out what's happening. What do you do?",
};

export async function generateInitialScene(universe: string): Promise<string> {
  try {
    const prompt = `Create a simple opening scene for an adventure in the ${universe} setting. The scene should:
- Be 2-3 sentences
- Use easy, everyday words
- Put the player in an interesting situation
- End with "What do you do?"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return response.text || "You awaken in darkness. What do you do?";
  } catch (error: any) {
    console.error("Gemini API error:", error);
    
    if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      console.log("Using fallback initial scene due to quota limits");
      return INITIAL_SCENES[universe] || INITIAL_SCENES["Dark Fantasy"];
    }
    
    throw new Error(`Failed to generate initial scene: ${error}`);
  }
}
