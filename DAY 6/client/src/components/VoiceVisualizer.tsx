import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface VoiceVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
}

export default function VoiceVisualizer({ isActive, isSpeaking, isListening }: VoiceVisualizerProps) {
  
  // Generate bars
  const bars = Array.from({ length: 20 });

  return (
    <div className="relative w-full h-64 flex items-center justify-center overflow-hidden bg-black/20 rounded-3xl backdrop-blur-sm border border-white/5 shadow-inner">
      
      {/* Central Orb */}
      <div className={`absolute w-32 h-32 rounded-full blur-2xl transition-all duration-1000 ${
        isListening ? 'bg-primary/40 scale-125' : 
        isSpeaking ? 'bg-blue-500/30 scale-110 animate-pulse' : 
        isActive ? 'bg-slate-500/20' : 'bg-transparent'
      }`} />

      <div className="flex items-end gap-1.5 z-10 h-32">
        {bars.map((_, i) => (
          <Bar key={i} index={i} isActive={isActive} isSpeaking={isSpeaking} isListening={isListening} />
        ))}
      </div>

      {/* Status Text Overlay */}
      <div className="absolute bottom-6 text-xs font-mono uppercase tracking-widest opacity-60">
        {isListening ? 'Listening...' : isSpeaking ? 'Agent Speaking...' : isActive ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
}

function Bar({ index, isActive, isSpeaking, isListening }: { index: number } & VoiceVisualizerProps) {
  return (
    <motion.div
      className={`w-2 rounded-full ${isListening ? 'bg-primary shadow-[0_0_10px_var(--color-primary)]' : 'bg-white/20'}`}
      animate={{
        height: isActive 
          ? isSpeaking 
            ? [20, Math.random() * 80 + 20, 20] 
            : isListening 
              ? [20, Math.random() * 40 + 20, 20]
              : 24
          : 4,
        opacity: isActive ? 1 : 0.3
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
        delay: index * 0.05,
        ease: "easeInOut"
      }}
    />
  );
}
