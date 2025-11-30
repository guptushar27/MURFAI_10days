import { useState, useRef, useCallback, useEffect } from "react";
import { BeamsBackground } from "@/components/ui/beams-background";
import { VoiceAgent } from "@/components/voice-agent";
import { useToast } from "@/hooks/use-toast";
import type { Message, VoiceSessionState, Product, Order } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface ChatResponse {
  message: string;
  action?: {
    type: string;
    data?: Product[] | Order;
  };
}

export default function VoiceAgentPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [sessionState, setSessionState] = useState<VoiceSessionState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);
  const shouldListenRef = useRef(false);
  const lastShownProductsRef = useRef<Product[]>([]);

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
    setConversationHistory(prev => [...prev, { role, content }]);
  }, []);

  const startListeningInternal = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionCtor) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Please use Chrome or Edge browser for voice features.",
        variant: "destructive",
      });
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setSessionState("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        handleUserSpeech(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted" && event.error !== "no-speech" && shouldListenRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current && !isProcessingRef.current) {
            startListeningInternal();
          }
        }, 500);
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current && !isProcessingRef.current) {
            startListeningInternal();
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [toast]);

  const speakText = useCallback(async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        setSessionState("speaking");
        
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId: "en-US-natalie" }),
        });

        if (!response.ok) {
          console.error("TTS request failed:", response.status);
          setSessionState("idle");
          resolve();
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setSessionState("idle");
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setSessionState("idle");
          resolve();
        };

        await audio.play();
      } catch (error) {
        console.error("TTS error:", error);
        setSessionState("idle");
        resolve();
      }
    });
  }, []);

  const handleUserSpeech = useCallback(async (transcript: string) => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    addMessage("user", transcript);
    setSessionState("processing");

    let responseMessage = "I'm sorry, I encountered an error. Please try again.";
    
    try {
      const res = await apiRequest("POST", "/api/chat", {
        message: transcript,
        conversationHistory: conversationHistory.slice(-10),
        lastShownProducts: lastShownProductsRef.current,
      });
      
      const data: ChatResponse = await res.json();
      responseMessage = data.message;

      addMessage("assistant", data.message);
      
      if (data.action) {
        if (data.action.type === "show_products" && data.action.data) {
          const prods = data.action.data as Product[];
          setProducts(prods);
          lastShownProductsRef.current = prods;
        } else if (data.action.type === "create_order" && data.action.data) {
          setLastOrder(data.action.data as Order);
        } else if (data.action.type === "show_order" && data.action.data) {
          setLastOrder(data.action.data as Order);
        } else if (data.action.type === "request_name") {
          // Nova will ask for name in the message
        } else if (data.action.type === "request_address") {
          // Nova will ask for address in the message
        } else if (data.action.type === "show_summary") {
          // Nova will show summary in the message before creating order
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage("assistant", responseMessage);
    }
    
    try {
      await speakText(responseMessage);
    } catch (ttsError) {
      console.error("TTS error in handleUserSpeech:", ttsError);
    }
    
    isProcessingRef.current = false;
    setSessionState("listening");
    
    if (shouldListenRef.current) {
      startListeningInternal();
    }
  }, [conversationHistory, addMessage, speakText, startListeningInternal]);

  const startCall = useCallback(async () => {
    setIsCallActive(true);
    setMessages([]);
    setProducts([]);
    setLastOrder(null);
    setConversationHistory([]);
    shouldListenRef.current = true;
    isProcessingRef.current = true;

    const greeting = "Hey! Welcome to Nova. Browse products, shop, or place orders. What do you need?";
    
    addMessage("assistant", greeting);
    
    try {
      await speakText(greeting);
    } catch (error) {
      console.error("Greeting TTS error:", error);
    }
    
    isProcessingRef.current = false;
    setSessionState("listening");
    
    if (shouldListenRef.current) {
      startListeningInternal();
    }
  }, [addMessage, speakText, startListeningInternal]);

  const endCall = useCallback(() => {
    shouldListenRef.current = false;
    isProcessingRef.current = false;
    setIsCallActive(false);
    setSessionState("idle");
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
      recognitionRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <BeamsBackground intensity="strong">
      <VoiceAgent
        onStartCall={startCall}
        onEndCall={endCall}
        isCallActive={isCallActive}
        sessionState={sessionState}
        messages={messages}
        products={products}
        lastOrder={lastOrder}
      />
    </BeamsBackground>
  );
}
