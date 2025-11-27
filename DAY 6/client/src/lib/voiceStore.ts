import { create } from 'zustand';
import { useDBStore, type FraudCase } from './dbStore';

type CallState = 'idle' | 'connecting' | 'intro' | 'verifying_name' | 'verifying_security' | 'reading_details' | 'awaiting_confirmation' | 'processing_decision' | 'completed' | 'error';

interface VoiceState {
  callState: CallState;
  currentCaseUserName: string | null;
  transcript: string;
  agentMessage: string;
  isListening: boolean;
  isSpeaking: boolean;
  
  useMurf: boolean;
  setUseMurf: (use: boolean) => void;

  startCall: () => void;
  endCall: () => void;
  processUserSpeech: (text: string) => void;
  setAgentMessage: (text: string) => void;
  setIsSpeaking: (v: boolean) => void;
  setIsListening: (v: boolean) => void;
  speak: (text: string, onEnd?: () => void) => Promise<void>;
}

const playAudioFromBackend = async (text: string): Promise<void> => {
  try {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId: 'en-US-falcon' })
    });

    if (!response.ok) throw new Error('TTS API Error');
    
    const data = await response.json();
    const audioUrl = data.audioUrl;

    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play();
    });
  } catch (error) {
    console.error("Backend TTS failed, falling back to browser voice:", error);
    return speakBrowser(text);
  }
};

const speakBrowser = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Microsoft Guy Online'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
};

export const useVoiceStore = create<VoiceState>((set, get) => ({
  callState: 'idle',
  currentCaseUserName: null,
  transcript: '',
  agentMessage: 'Ready to connect...',
  isListening: false,
  isSpeaking: false,
  useMurf: false,

  setUseMurf: (use) => set({ useMurf: use }),
  setIsSpeaking: (v) => set({ isSpeaking: v }),
  setIsListening: (v) => set({ isListening: v }),
  setAgentMessage: (text) => set({ agentMessage: text }),

  startCall: () => {
    set({ callState: 'connecting', transcript: '', currentCaseUserName: null });
    
    setTimeout(() => {
      set({ callState: 'intro' });
      const script = "Hello. This is the Fraud Security Department calling from Sentinel Bank. I am an automated assistant. To proceed, please state your first name.";
      get().speak(script, () => {
        set({ callState: 'verifying_name', isListening: true });
      });
    }, 1500);
  },

  endCall: () => {
    window.speechSynthesis.cancel();
    set({ callState: 'idle', isListening: false, isSpeaking: false, agentMessage: "Call Ended." });
  },

  speak: async (text: string, onEnd?: () => void) => {
    const { useMurf } = get();
    set({ isSpeaking: true, agentMessage: text });

    if (useMurf) {
      await playAudioFromBackend(text);
    } else {
      await speakBrowser(text);
    }

    set({ isSpeaking: false });
    if (onEnd) onEnd();
  },

  processUserSpeech: (text) => {
    const state = get();
    const db = useDBStore.getState();
    
    set({ transcript: text, isListening: false });
    console.log(`[Agent Logic] State: ${state.callState}, User said: "${text}"`);

    const speak = state.speak; 

    switch (state.callState) {
      case 'verifying_name': {
        const name = text.trim();
        const matchedUser = Object.keys(db.cases).find(u => name.toLowerCase().includes(u.toLowerCase()));

        if (matchedUser) {
          const userCase = db.cases[matchedUser];
          set({ currentCaseUserName: matchedUser, callState: 'verifying_security' });
          speak(`Thank you, ${userCase.userName}. For security, ${userCase.securityQuestion}`, () => {
             set({ isListening: true });
          });
        } else {
          speak("I'm sorry, I couldn't find an account with that name. Please say your name again.", () => {
            set({ isListening: true });
          });
        }
        break;
      }

      case 'verifying_security': {
        if (!state.currentCaseUserName) return;
        const currentCase = db.cases[state.currentCaseUserName];
        
        const answer = text.toLowerCase();
        const expected = currentCase.securityAnswer.toLowerCase();

        if (answer.includes(expected)) {
          set({ callState: 'reading_details' });
          const c = currentCase;
          const script = `Identity verified. We detected a suspicious transaction on your card ending in ${c.cardEnding}. 
                          It was at ${c.transactionName} for ${c.transactionAmount}. 
                          Did you authorize this transaction? Say yes or no.`;
          speak(script, () => {
             set({ callState: 'awaiting_confirmation', isListening: true });
          });
        } else {
           speak("That answer does not match our records. For your security, I cannot proceed. Please contact customer support.", () => {
             set({ callState: 'error' });
           });
        }
        break;
      }

      case 'awaiting_confirmation': {
        if (!state.currentCaseUserName) return;
        const currentCase = db.cases[state.currentCaseUserName];
        const response = text.toLowerCase();

        if (response.includes('yes') || response.includes('yeah') || response.includes('confirm')) {
          db.updateCaseStatus(currentCase.id, 'confirmed_safe');
          set({ callState: 'completed' });
          speak("Thank you. I have marked this transaction as authorized. Your card remains active. Have a secure day.", () => {
             // Log call session
             logCallSession(currentCase.id, state.currentCaseUserName!, 'confirmed_safe');
          });
        } else if (response.includes('no') || response.includes('not') || response.includes('deny')) {
          db.updateCaseStatus(currentCase.id, 'confirmed_fraud');
          set({ callState: 'completed' });
          speak("Understood. I have flagged this transaction as fraudulent. Your card has been temporarily blocked. A dispute case has been opened.", () => {
             logCallSession(currentCase.id, state.currentCaseUserName!, 'confirmed_fraud');
          });
        } else {
          speak("I didn't quite get that. Did you make this transaction? Please say Yes or No.", () => {
             set({ isListening: true });
          });
        }
        break;
      }
      
      default:
        break;
    }
  }
}));

async function logCallSession(fraudCaseId: string, userName: string, outcome: string) {
  try {
    await fetch('/api/call-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fraudCaseId,
        userName,
        outcome,
        transcript: 'Voice session completed'
      })
    });
    console.log('[Session] Logged call session');
  } catch (error) {
    console.error('Failed to log call session:', error);
  }
}
