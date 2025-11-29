export interface MurfTTSRequest {
  text: string;
  voiceId?: string;
}

export interface MurfTTSResponse {
  audioUrl?: string;
  audioBase64?: string;
  error?: string;
}

export async function generateSpeech(request: MurfTTSRequest): Promise<MurfTTSResponse> {
  const apiKey = process.env.MURF_API_KEY;
  
  if (!apiKey) {
    console.warn("MURF_API_KEY not set - TTS unavailable");
    return { error: "TTS service not configured" };
  }

  try {
    const response = await fetch("https://api.murf.ai/v1/speech/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        voiceId: request.voiceId || "en-US-ken",
        style: "Conversational",
        text: request.text,
        rate: 0,
        pitch: -2,
        sampleRate: 24000,
        format: "MP3",
        channelType: "STEREO",
        encodeAsBase64: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Murf API error:", errorText);
      return { error: `Murf API error: ${response.status}` };
    }

    const data = await response.json();
    
    return {
      audioUrl: data.audioFile,
      audioBase64: data.audioContent,
    };
  } catch (error) {
    console.error("Murf TTS error:", error);
    return { error: `TTS generation failed: ${error}` };
  }
}
