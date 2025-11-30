// Murf AI Falcon API for ultra-low latency text-to-speech
// https://murf.ai/api/docs/text-to-speech-models/falcon

const MURF_API_KEY = process.env.MURF_API_KEY || "";
const MURF_API_URL = "https://global.api.murf.ai/v1/speech/stream";

export interface TTSOptions {
  text: string;
  voiceId?: string;
}

export async function synthesizeSpeech(options: TTSOptions): Promise<Buffer> {
  const { text, voiceId = "en-US-natalie" } = options;
  
  if (!MURF_API_KEY) {
    throw new Error("MURF_API_KEY not configured");
  }
  
  try {
    const response = await fetch(MURF_API_URL, {
      method: "POST",
      headers: {
        "api-key": MURF_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        voiceId: voiceId,
        model: "falcon",
        format: "MP3",
        sampleRate: 44100,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Murf API error:", response.status, errorText);
      throw new Error(`Murf API error: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("TTS synthesis error:", error);
    throw error;
  }
}

// Available Murf Falcon voices
export const AVAILABLE_VOICES = [
  { id: "en-US-natalie", name: "Natalie", language: "English (US)", gender: "Female" },
  { id: "en-US-james", name: "James", language: "English (US)", gender: "Male" },
  { id: "en-GB-elizabeth", name: "Elizabeth", language: "English (UK)", gender: "Female" },
  { id: "en-IN-priya", name: "Priya", language: "English (India)", gender: "Female" },
];
