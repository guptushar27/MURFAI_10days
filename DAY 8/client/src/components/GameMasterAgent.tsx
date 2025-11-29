import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Settings, Play, Square, Volume2, Send, RotateCcw } from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import bgImage from "@assets/generated_images/dark_fantasy_tech_background.png";

interface Message {
  id: string;
  role: "agent" | "user";
  text: string;
  timestamp: number;
}

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export default function GameMasterAgent() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<GeminiMessage[]>([]);
  const [universe, setUniverse] = useState("Dark Fantasy");
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [autoListen, setAutoListen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    if (!isSpeaking && isConnected && autoListen && !isLoading) {
      const timer = setTimeout(() => {
        startListening();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isSpeaking, isConnected, autoListen, isLoading]);

  const startSession = async () => {
    setIsConnected(true);
    setError(null);
    setConversationHistory([]);
    setTranscript([]);
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isInitial: true, universe }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start session");
      }

      const data = await response.json();
      const initialMessage: GeminiMessage = {
        role: "model",
        parts: [{ text: data.text }],
      };
      setConversationHistory([initialMessage]);
      addMessageAndSpeak("agent", data.text);
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      setError(errorMsg);
      if (errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        addMessageOnly("agent", "The ethereal connection is overwhelmed. Please wait a moment and try again.");
      } else if (errorMsg.includes("API key")) {
        addMessageOnly("agent", "The neural link requires configuration. Please ensure API keys are set up.");
      } else {
        addMessageOnly("agent", "Failed to initialize session. Please try again in a moment.");
      }
      setIsLoading(false);
    }
  };

  const endSession = () => {
    setIsConnected(false);
    setIsListening(false);
    setTranscript([]);
    setConversationHistory([]);
    setError(null);
    setIsLoading(false);
    stopListening();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const restartSession = () => {
    endSession();
    setTimeout(() => startSession(), 100);
  };

  const addMessageOnly = (role: "agent" | "user", text: string) => {
    const msg: Message = {
      id: Math.random().toString(36).substring(7),
      role,
      text,
      timestamp: Date.now(),
    };
    setTranscript((prev) => [...prev, msg]);
  };

  const addMessageAndSpeak = (role: "agent" | "user", text: string) => {
    addMessageOnly(role, text);
    if (role === "agent") {
      speakText(text);
    }
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    setIsLoading(false);
    
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audio.onended = () => {
            setIsSpeaking(false);
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            fallbackToWebSpeech(text);
          };
          await audio.play();
          return;
        }
      }
    } catch (err) {
      console.log("Murf TTS unavailable, falling back to browser TTS");
    }
    
    fallbackToWebSpeech(text);
  };

  const fallbackToWebSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const deepVoice = voices.find(v => 
        v.name.includes("Google UK English Male") || 
        v.name.includes("Daniel") ||
        v.name.includes("Male")
      );
      if (deepVoice) utterance.voice = deepVoice;
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      const duration = Math.min(text.length * 50, 5000);
      setTimeout(() => setIsSpeaking(false), duration);
    }
  };

  const handleUserAction = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    stopListening();
    addMessageOnly("user", text);
    setInputText("");
    setIsLoading(true);

    const userMessage: GeminiMessage = {
      role: "user",
      parts: [{ text }],
    };

    const newHistory = [...conversationHistory, userMessage];
    setConversationHistory(newHistory);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: newHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      
      const agentMessage: GeminiMessage = {
        role: "model",
        parts: [{ text: data.text }],
      };
      setConversationHistory([...newHistory, agentMessage]);
      addMessageAndSpeak("agent", data.text);
    } catch (err: any) {
      setError(err.message);
      addMessageOnly("agent", "I'm having trouble connecting to the ethereal plane. Please try again.");
      setIsLoading(false);
    }
  }, [conversationHistory, isLoading]);

  const startListening = useCallback(() => {
    if (isSpeaking || isLoading) return;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setIsListening(false);
        handleUserAction(text);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.log("Speech recognition error:", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log("Recognition already started");
      }
    } else {
      setIsListening(true);
      setTimeout(() => setIsListening(false), 5000);
    }
  }, [isSpeaking, isLoading, handleUserAction]);

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      >
         <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background/90" />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-5xl mx-auto p-4 md:p-6">
        
        <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                   <Volume2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-heading font-bold tracking-wider text-white">VOID<span className="text-primary">WEAVER</span></h1>
                    <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">Chronicle of Ethereal Realms</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {!isConnected && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10" data-testid="button-settings">
                          <Settings className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 text-white">
                      <DialogHeader>
                        <DialogTitle className="font-heading">Universe Configuration</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                         <div className="space-y-2">
                          <Label>Universe Setting</Label>
                          <Input 
                              placeholder="e.g. Cyberpunk Mars, High Fantasy..." 
                              value={universe} 
                              onChange={(e) => setUniverse(e.target.value)}
                              className="bg-black/50 border-white/10"
                              data-testid="input-universe" 
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          API keys are configured server-side for security.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {isConnected && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={restartSession}
                    data-testid="button-restart"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                )}
            </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center relative">
             <AnimatePresence mode="wait">
                {!isConnected ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center space-y-6"
                    >
                        <div className="w-48 h-48 rounded-full bg-gradient-to-b from-primary/20 to-transparent border border-primary/20 flex items-center justify-center mx-auto relative overflow-hidden group">
                             <div className="absolute inset-0 bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
                             <Play className="w-16 h-16 text-primary/80 fill-primary/20 ml-2" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-heading font-bold text-white mb-2">Ready to Begin?</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Initialize the neural link to start your voice-guided adventure in the <span className="text-primary">{universe}</span>.
                            </p>
                            {error && (
                              <p className="text-red-400 text-sm mt-2 max-w-md mx-auto">{error}</p>
                            )}
                        </div>
                        <Button 
                            size="lg" 
                            onClick={startSession}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 text-lg shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                            data-testid="button-initialize"
                        >
                            Initialize Session
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         className="w-full h-full flex flex-col gap-3 px-4"
                    >
                         {/* Chat Box with Scrollbar */}
                         <div className="w-full h-96 rounded-lg bg-gradient-to-b from-black/40 to-black/20 overflow-hidden flex flex-col">
                           <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollRef}>
                             <div className="space-y-3 p-6">
                                {transcript.map((msg) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg.id} 
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div 
                                            className={`
                                                max-w-[70%] rounded-2xl px-5 py-3 text-sm leading-relaxed backdrop-blur-md
                                                ${msg.role === "user" 
                                                    ? "bg-primary/25 border border-primary/40 text-white rounded-br-none" 
                                                    : "bg-white/10 border border-white/15 text-gray-100 rounded-bl-none"
                                                }
                                            `}
                                            data-testid={`message-${msg.role}-${msg.id}`}
                                        >
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                         <div className="bg-white/10 border border-white/15 rounded-2xl rounded-bl-none px-5 py-3">
                                            <div className="flex space-x-2">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                         </div>
                                    </div>
                                )}
                             </div>
                           </div>
                         </div>

                         {/* Mic & Voice Animation Section */}
                         <div className="w-full bg-black/40 backdrop-blur-xl border border-primary/20 rounded-lg p-3 flex items-center gap-3 shadow-2xl">
                             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                  isSpeaking ? "bg-purple-500 shadow-[0_0_8px_#a855f7]" :
                                  isListening ? "bg-green-500 shadow-[0_0_8px_#22c55e]" :
                                  isLoading ? "bg-yellow-500 shadow-[0_0_8px_#eab308]" :
                                  "bg-green-500 shadow-[0_0_8px_#22c55e]"
                                }`} />
                             </div>
                             
                             <div className="flex-1 h-12 flex items-center justify-center px-3 border-x border-white/10">
                                 {isSpeaking ? (
                                     <AudioVisualizer isActive={true} color="rgb(168, 85, 247)" />
                                 ) : isListening ? (
                                     <AudioVisualizer isActive={true} color="rgb(34, 197, 94)" />
                                 ) : isLoading ? (
                                     <div className="text-yellow-500 text-xs font-mono tracking-widest animate-pulse">PROCESSING...</div>
                                 ) : (
                                     <div className="text-muted-foreground text-xs font-mono tracking-widest">TAP MIC OR SPEAK</div>
                                 )}
                             </div>

                             <div className="flex items-center gap-2">
                                <Button 
                                    size="icon"
                                    variant={isListening ? "destructive" : "default"}
                                    className={`rounded-full w-10 h-10 transition-all ${
                                      isListening 
                                        ? "bg-green-500 hover:bg-green-600 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
                                        : "bg-white/10 hover:bg-white/20"
                                    }`}
                                    onClick={toggleListening}
                                    disabled={isSpeaking || isLoading}
                                    data-testid="button-mic"
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </Button>
                                <Button 
                                    size="icon"
                                    variant="ghost"
                                    className="rounded-full w-10 h-10 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                    onClick={endSession}
                                    data-testid="button-end"
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                </Button>
                             </div>
                         </div>

                         {/* Input Section */}
                         <form 
                            onSubmit={(e) => { e.preventDefault(); handleUserAction(inputText); }}
                            className="w-full flex gap-2 pb-2"
                         >
                             <Input 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type your action..."
                                className="bg-black/50 border-white/15 focus:border-primary/50 text-white text-sm"
                                disabled={isLoading}
                                data-testid="input-action"
                             />
                             <Button 
                                type="submit" 
                                size="icon" 
                                className="bg-primary/30 hover:bg-primary/50 text-primary border border-primary/40"
                                disabled={isLoading || !inputText.trim()}
                                data-testid="button-send"
                             >
                                 <Send className="w-4 h-4" />
                             </Button>
                         </form>
                    </motion.div>
                )}
             </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
