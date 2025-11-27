import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Shield } from 'lucide-react';
import { useVoiceStore } from '@/lib/voiceStore';
import { useDBStore } from '@/lib/dbStore';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import TransactionCard from '@/components/TransactionCard';
import SettingsModal from '@/components/SettingsModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FraudAgent() {
  const { 
    callState, 
    startCall, 
    endCall, 
    processUserSpeech, 
    isListening, 
    isSpeaking, 
    agentMessage, 
    currentCaseUserName 
  } = useVoiceStore();

  const { cases, fetchCases } = useDBStore();
  const currentCase = currentCaseUserName && cases[currentCaseUserName] ? cases[currentCaseUserName] : null;

  const recognitionRef = useRef<any>(null);

  // Fetch fraud cases on mount
  useEffect(() => {
    fetchCases().catch(console.error);
  }, [fetchCases]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        processUserSpeech(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };
    }
  }, [processUserSpeech]);

  // Effect to handle listening state
  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else if (!isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  }, [isListening]);

  const isActive = callState !== 'idle' && callState !== 'completed' && callState !== 'error';
  const showTransaction = ['reading_details', 'awaiting_confirmation', 'completed'].includes(callState);

  return (
    <div className="h-screen w-screen bg-background flex overflow-hidden relative">
      
      {/* Background ambient elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full z-10 relative">
        
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl leading-none">Sentinel Bank</h1>
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Fraud Protection Unit</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <SettingsModal />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
            {/* Agent Interface Panel */}
            <div className="w-full max-w-2xl flex flex-col items-center gap-8">
              
              {/* Status Badge */}
              <Badge variant="outline" className={`
                px-4 py-1.5 rounded-full font-mono uppercase tracking-widest text-[10px] border-white/10 backdrop-blur-md
                ${callState === 'idle' ? 'text-muted-foreground bg-white/5' : 
                  callState === 'completed' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 
                  callState === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                  'text-primary bg-primary/10 border-primary/20 animate-pulse'}
              `} data-testid={`status-${callState}`}>
                {callState === 'idle' ? 'System Ready' : 
                 callState === 'connecting' ? 'Secure Connection...' :
                 callState === 'completed' ? 'Case Resolved' :
                 'Live Session Active'}
              </Badge>

              {/* Visualizer */}
              <div className="w-full glass-panel p-1 rounded-[2rem]">
                <VoiceVisualizer isActive={isActive} isSpeaking={isSpeaking} isListening={isListening} />
              </div>

              {/* Dynamic Content */}
              <div className="min-h-[180px] flex flex-col items-center justify-center w-full text-center space-y-6">
                <div className="space-y-2 max-w-lg mx-auto min-h-[80px]">
                   {agentMessage && (
                     <p className="text-lg md:text-2xl font-medium text-white leading-relaxed animate-in fade-in slide-in-from-bottom-4" data-testid="text-agent-message">
                       "{agentMessage}"
                     </p>
                   )}
                   {isListening && (
                     <p className="text-sm text-primary animate-pulse font-mono uppercase tracking-wide" data-testid="text-listening">Listening...</p>
                   )}
                </div>

                <div className="w-full flex justify-center">
                  <TransactionCard data={currentCase} isVisible={showTransaction} />
                </div>
              </div>

              {/* Main Action Button */}
              <div className="mt-4">
                {callState === 'idle' ? (
                  <Button 
                    size="lg" 
                    onClick={startCall}
                    className="h-16 px-8 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_40px_-10px_var(--color-primary)] hover:shadow-[0_0_60px_-10px_var(--color-primary)] transition-all duration-300 scale-100 hover:scale-105 text-lg font-medium"
                    data-testid="button-start-call"
                  >
                    <Phone className="mr-2 w-5 h-5" /> Start Secure Call
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    size="lg"
                    onClick={endCall} 
                    className="h-16 w-16 rounded-full p-0 hover:bg-red-600 transition-colors"
                    data-testid="button-end-call"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
