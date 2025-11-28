import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface AgentState {
  messages: Message[];
  isListening: boolean;
  isSpeaking: boolean;
  isCallActive: boolean;
  customerName: string;
  customerAddress: string;
  addMessage: (role: 'user' | 'assistant', text: string) => void;
  clearMessages: () => void;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setCallActive: (active: boolean) => void;
  setCustomerName: (name: string) => void;
  setCustomerAddress: (address: string) => void;
  murfApiKey: string;
  murfVoiceId: string;
  setMurfConfig: (key: string, voiceId: string) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  messages: [],
  isListening: false,
  isSpeaking: false,
  isCallActive: false,
  customerName: '',
  customerAddress: '',
  murfApiKey: '',
  murfVoiceId: 'en-IN-isha',
  addMessage: (role, text) => set((state) => ({
    messages: [...state.messages, { id: Math.random().toString(36).substring(7), role, text, timestamp: Date.now() }]
  })),
  clearMessages: () => set({ messages: [] }),
  setListening: (isListening) => set({ isListening }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  setCallActive: (isCallActive) => set({ isCallActive }),
  setCustomerName: (customerName) => set({ customerName }),
  setCustomerAddress: (customerAddress) => set({ customerAddress }),
  setMurfConfig: (murfApiKey, murfVoiceId) => set({ murfApiKey, murfVoiceId }),
}));

// Enhanced Intent Parser for Indian grocery context
export function parseIntent(text: string): { intent: string; entities: string[] } {
  const lower = text.toLowerCase().trim();
  
  // Greetings
  if (/^(hi|hello|namaste|hey|haan|start|begin)/i.test(lower)) {
    return { intent: 'greeting', entities: [] };
  }

  // Recipe/Ingredients lookup - CHECK FIRST before add/buy
  if (lower.includes('ingredients for') || lower.includes('i want to make') || lower.includes('recipe for') || lower.includes('what do i need for')) {
    const clean = lower.replace(/ingredients for|i want to make|recipe for|what do i need for|add|buy/g, '').trim();
    return { intent: 'recipe_lookup', entities: [clean] };
  }

  // Special Indian recipe shortcuts - CHECK BEFORE add/buy
  if (lower.includes('chai') && !lower.includes('add chai')) {
    return { intent: 'recipe_lookup', entities: ['chai'] };
  }
  if ((lower.includes('tea') || lower.includes('chai')) && lower.includes('ingredients')) {
    return { intent: 'recipe_lookup', entities: ['chai'] };
  }
  if (lower.includes('butter naan')) {
    return { intent: 'recipe_lookup', entities: ['butter naan'] };
  }
  if (lower.includes('naan') && !lower.includes('add')) {
    return { intent: 'recipe_lookup', entities: ['naan'] };
  }
  if (lower.includes('peanut butter sandwich')) {
    return { intent: 'recipe_lookup', entities: ['peanut butter sandwich'] };
  }
  if (lower.includes('dal') && lower.includes('chawal')) {
    return { intent: 'recipe_lookup', entities: ['dal chawal'] };
  }
  if (lower.includes('paneer butter masala')) {
    return { intent: 'recipe_lookup', entities: ['paneer butter masala'] };
  }
  if (lower.includes('paneer') && lower.includes('masala')) {
    return { intent: 'recipe_lookup', entities: ['paneer butter masala'] };
  }
  if (lower.includes('breakfast') && !lower.includes('add')) {
    return { intent: 'recipe_lookup', entities: ['breakfast'] };
  }
  if (lower.includes('party') || lower.includes('snacks for party')) {
    return { intent: 'recipe_lookup', entities: ['party'] };
  }

  // Add to cart
  if (lower.includes('add') || lower.includes('buy') || lower.includes('get me') || lower.includes('i want') || lower.includes('i need')) {
    const clean = lower.replace(/add|buy|get me|i want|i need|some|please|a |an |to cart|to my cart|ingredients for|recipe for/g, '').trim();
    return { intent: 'add_to_cart', entities: [clean] };
  }
  
  // Remove from cart
  if (lower.includes('remove') || lower.includes('delete') || lower.includes('take out') || lower.includes('cancel')) {
    const clean = lower.replace(/remove|delete|take out|cancel|from cart|from my cart/g, '').trim();
    return { intent: 'remove_from_cart', entities: [clean] };
  }
  
  // Cart operations
  if (lower.includes('cart') && (lower.includes('what') || lower.includes('show') || lower.includes('list') || lower.includes('check'))) {
    return { intent: 'list_cart', entities: [] };
  }

  // Checkout / Place order - MUST be explicit
  if (lower.includes('place order') || lower.includes('checkout') || lower.includes('order now')) {
    return { intent: 'checkout', entities: [] };
  }
  
  // Track order
  if (lower.includes('where is') || lower.includes('status') || lower.includes('track') || lower.includes('order status') || lower.includes('my order')) {
    return { intent: 'track_order', entities: [] };
  }

  // Clear cart
  if (lower.includes('clear cart') || lower.includes('empty cart') || lower.includes('remove everything')) {
    return { intent: 'clear_cart', entities: [] };
  }

  // Help
  if (lower.includes('help') || lower.includes('what can you do') || lower.includes('options')) {
    return { intent: 'help', entities: [] };
  }

  // Thank you / goodbye
  if (lower.includes('thank') || lower.includes('bye') || lower.includes('goodbye') || lower.includes('end call')) {
    return { intent: 'goodbye', entities: [] };
  }

  return { intent: 'unknown', entities: [] };
}
