import { useEffect, useRef, useState, useCallback } from "react";
import { useAgentStore, parseIntent } from "@/lib/agent-logic";
import { useStore, CATALOG } from "@/lib/mock-db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Phone, 
  PhoneOff,
  Send, 
  ShoppingBag, 
  X, 
  ChefHat, 
  Search, 
  Settings,
  History,
  Loader2,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// --- Components ---

const MessageBubble = ({ role, text, timestamp }: { role: 'user' | 'assistant', text: string, timestamp: number }) => {
  const isUser = role === 'user';
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
      data-testid={`message-${role}`}
    >
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
        isUser 
          ? "bg-primary text-primary-foreground rounded-br-sm" 
          : "bg-white dark:bg-card border border-border text-foreground rounded-bl-sm"
      )}>
        <p>{text}</p>
        <span className="text-[10px] opacity-50 mt-1 block text-right">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

const CartItemRow = ({ item, onRemove }: { item: any, onRemove: (name: string) => void }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="flex items-center justify-between py-3 border-b last:border-0 group"
    data-testid={`cart-item-${item.id}`}
  >
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center text-lg">
        {item.category === 'groceries' ? '🥬' : 
         item.category === 'snacks' ? '🍿' : 
         item.category === 'prepared' ? '🍕' : '🥤'}
      </div>
      <div>
        <p className="font-medium text-sm leading-none">{item.name}</p>
        <p className="text-xs text-muted-foreground mt-1">
          ₹{item.price.toFixed(2)} / {item.unit}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-sm font-mono font-medium">x{item.quantity}</span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onRemove(item.name)}
        data-testid={`remove-item-${item.id}`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  </motion.div>
);

const ProductCard = ({ product, onAdd }: { product: any, onAdd: (name: string) => void }) => (
  <Card className="overflow-hidden hover:shadow-md transition-all border-border/50 bg-card/50 backdrop-blur-sm group">
    <div className="aspect-square bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-500">
      {product.category === 'groceries' ? '🥬' : 
       product.category === 'snacks' ? '🍿' : 
       product.category === 'prepared' ? '🍕' : '🥤'}
    </div>
    <CardHeader className="p-3 pb-0">
      <CardTitle className="text-sm font-medium truncate" title={product.name}>{product.name}</CardTitle>
      <CardDescription className="text-xs">₹{product.price.toFixed(2)} / {product.unit}</CardDescription>
    </CardHeader>
    <CardFooter className="p-3 pt-2">
      <Button 
        variant="secondary" 
        size="sm" 
        className="w-full h-7 text-xs bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-colors"
        onClick={() => onAdd(product.name)}
        data-testid={`add-product-${product.id}`}
      >
        Add
      </Button>
    </CardFooter>
  </Card>
);

export default function Home() {
  const { 
    messages, 
    addMessage, 
    clearMessages,
    isListening, 
    setListening, 
    isSpeaking,
    setSpeaking,
    isCallActive,
    setCallActive,
    customerName,
    customerAddress,
    setCustomerName,
    setCustomerAddress,
    murfApiKey,
    murfVoiceId,
    setMurfConfig
  } = useAgentStore();
  
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    clearCart
  } = useStore();

  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const recognitionRef = useRef<any>(null);
  const shouldRestartListening = useRef(false);
  const processIntentRef = useRef<any>(null);
  const checkoutStateRef = useRef<string>('idle');

  // Settings State
  const [tempApiKey, setTempApiKey] = useState(murfApiKey);
  const [tempVoiceId, setTempVoiceId] = useState(murfVoiceId);
  const [showSettings, setShowSettings] = useState(false);
  
  // Checkout collection state
  const [checkoutState, setCheckoutState] = useState<'idle' | 'collecting_name' | 'collecting_address' | 'processing'>('idle');
  const checkoutDataRef = useRef({ name: '', address: '', cart: [] as any });
  const checkoutCartRef = useRef<any>(null);

  // Fetch orders from backend
  const { data: ordersData = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) throw new Error('Failed to create order');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      clearCart();
    }
  });

  // Sync settings when opening modal
  useEffect(() => {
    if (showSettings) {
      setTempApiKey(murfApiKey);
      setTempVoiceId(murfVoiceId);
    }
  }, [showSettings, murfApiKey, murfVoiceId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Speech Recognition (once)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
        
        if (event.error === 'no-speech' && isCallActive) {
          setTimeout(() => startListening(), 500);
        } else if (event.error !== 'aborted') {
          toast({
            title: "Voice Input Error",
            description: "Please try speaking again.",
            variant: "destructive"
          });
        }
      };

      recognitionRef.current.onend = () => {
        setListening(false);
        if (shouldRestartListening.current && isCallActive) {
          setTimeout(() => startListening(), 300);
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        addMessage('user', transcript);
        setListening(false);
        
        // Handle checkout data collection - use ref to get current state
        if (checkoutStateRef.current === 'collecting_name') {
          const extractedName = extractName(transcript);
          checkoutDataRef.current.name = extractedName;
          checkoutStateRef.current = 'collecting_address';
          setCheckoutState('collecting_address');
          const msg = "Thank you! And what's your delivery address?";
          addMessage('assistant', msg);
          speakText(msg);
          shouldRestartListening.current = true;
          return;
        } else if (checkoutStateRef.current === 'collecting_address') {
          const extractedAddress = extractAddress(transcript);
          checkoutDataRef.current.address = extractedAddress;
          checkoutStateRef.current = 'processing';
          setCheckoutState('processing');
          finalizeOrder(checkoutDataRef.current.name, extractedAddress, checkoutDataRef.current.cart);
          return;
        }
        
        // Use ref to always call current processIntent
        if (processIntentRef.current) {
          processIntentRef.current(transcript);
        }
      };
    }
  }, [isCallActive]);


  // Start listening function
  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        setListening(true);
        recognitionRef.current.start();
      } catch (e) {
        console.log('Speech recognition already started');
      }
    }
  }, [setListening]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      setListening(false);
    }
  }, [setListening]);

  // --- Speech Logic ---

  const speakText = useCallback(async (text: string) => {
    setSpeaking(true);
    stopListening();

    const onSpeechEnd = () => {
      setSpeaking(false);
      setIsGeneratingAudio(false);
      // Always restart listening if we're in a call and flag is set
      if (shouldRestartListening.current) {
        setTimeout(() => startListening(), 300);
      }
    };

    if (murfApiKey) {
      setIsGeneratingAudio(true);
      try {
        const response = await fetch('https://api.murf.ai/v1/speech/generate', {
          method: 'POST',
          headers: {
            'api-key': murfApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            voiceId: murfVoiceId,
            format: 'MP3',
            sampleRate: 44100
          })
        });

        if (!response.ok) throw new Error('Failed to generate speech');

        const data = await response.json();
        
        if (data.audioFile) {
          const audio = new Audio(data.audioFile);
          audio.onended = onSpeechEnd;
          audio.onerror = () => {
            fallbackSpeak(text, onSpeechEnd);
          };
          await audio.play();
        } else {
          throw new Error("No audio file in response");
        }

      } catch (error) {
        console.error("Murf API Error:", error);
        fallbackSpeak(text, onSpeechEnd);
        setIsGeneratingAudio(false);
      }
    } else {
      fallbackSpeak(text, onSpeechEnd);
    }
  }, [murfApiKey, murfVoiceId, startListening, stopListening, setSpeaking]);

  const fallbackSpeak = (text: string, onEnd: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  };

  // --- Chat Logic ---

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue("");
    addMessage('user', userText);

    setTimeout(() => {
      processIntent(userText);
    }, 300);
  };

  const processIntent = useCallback((text: string) => {
    const { intent, entities } = parseIntent(text);
    let responseText = "";

    switch (intent) {
      case 'greeting':
        responseText = "Hello! I'm here to help you with your grocery shopping. What would you like to order?";
        break;

      case 'add_to_cart':
        if (entities.length > 0) {
          const result = addToCart(entities[0]);
          responseText = result.message;
        } else {
          responseText = "What would you like me to add?";
        }
        break;
        
      case 'remove_from_cart':
        if (entities.length > 0) {
          const result = removeFromCart(entities[0]);
          responseText = result.message;
        } else {
          responseText = "What should I remove from your cart?";
        }
        break;

      case 'recipe_lookup':
        if (entities[0]) {
          const recipeMap: Record<string, string[]> = {
            'chai': ['Amul Taaza Milk', 'Red Label Tea', 'Parle-G Biscuits'],
            'tea': ['Amul Taaza Milk', 'Red Label Tea', 'Parle-G Biscuits'],
            'peanut butter sandwich': ['Britannia Brown Bread', 'Peanut Butter', 'Kissan Mixed Fruit Jam'],
            'peanut butter': ['Britannia Brown Bread', 'Peanut Butter'],
            'sandwich': ['Britannia Brown Bread', 'Amul Butter', 'Kissan Mixed Fruit Jam'],
            'butter naan': ['Aashirvaad Atta', 'Amul Butter', 'Amul Taaza Milk', 'Tata Salt'],
            'naan': ['Aashirvaad Atta', 'Amul Butter', 'Amul Taaza Milk', 'Tata Salt'],
            'dal chawal': ['Tata Sampann Toor Dal', 'India Gate Basmati Rice', 'Fortune Mustard Oil', 'Jeera'],
            'dal rice': ['Tata Sampann Toor Dal', 'India Gate Basmati Rice', 'Fortune Mustard Oil', 'Jeera'],
            'paneer butter masala': ['Amul Malai Paneer', 'Amul Butter', 'Tomato', 'Onion', 'Ginger Garlic Paste'],
            'paneer': ['Amul Malai Paneer', 'Onion', 'Tomato'],
            'rice': ['India Gate Basmati Rice'],
            'maggi': ['Maggi 2-Minute Noodles'],
            'breakfast': ['Britannia Brown Bread', 'Amul Butter', 'Farm Fresh Eggs', 'Amul Taaza Milk'],
            'dinner': ['Aashirvaad Atta', 'Amul Malai Paneer', 'Tata Salt', 'Onion', 'Tomato'],
            'party': ['Thums Up', 'Lays Magic Masala', 'Haldiram Aloo Bhujia'],
          };
          
          const foundKey = Object.keys(recipeMap).find(k => entities[0].includes(k));
          
          if (foundKey) {
            const items = recipeMap[foundKey];
            items.forEach(item => addToCart(item));
            responseText = `Perfect! I've added all the ingredients for ${foundKey}: ${items.join(', ')}. Anything else you'd like?`;
          } else {
            responseText = `I'm not sure what goes in ${entities[0]}. Try asking for chai, peanut butter sandwich, butter naan, dal chawal, paneer butter masala, or party snacks!`;
            setShowCatalog(true);
          }
        } else {
          responseText = "What would you like to make? I know recipes for chai, peanut butter sandwich, butter naan, dal chawal, paneer butter masala, and much more!";
        }
        break;

      case 'checkout':
        handleCheckout(cart);
        return;

      case 'track_order':
        if (ordersData.length === 0) {
          responseText = "You haven't placed any orders yet. Would you like to start shopping?";
        } else {
          const latestOrder = ordersData[0];
          responseText = `Your latest order number ${latestOrder.orderNumber} is ${latestOrder.status}. Total was rupees ${(latestOrder.total / 100).toFixed(0)}.`;
        }
        break;

      case 'list_cart':
        if (cart.length === 0) {
          responseText = "Your cart is empty. Say 'add milk' or 'ingredients for chai' to get started!";
        } else {
          const itemsList = cart.map(i => `${i.quantity} ${i.name}`).join(', ');
          const cartTotal = cart.reduce((a, b) => a + b.price * b.quantity, 0);
          responseText = `You have ${cart.length} items: ${itemsList}. Total is rupees ${Math.round(cartTotal)}. Say 'place order' when ready!`;
        }
        break;

      case 'clear_cart':
        clearCart();
        responseText = "Done! I've cleared your cart. Let's start fresh.";
        break;

      case 'help':
        responseText = "I can help you order groceries! Say: 'Add milk', 'Buy Maggi', 'Ingredients for chai', 'What is in my cart', or 'Place order' when ready to checkout.";
        break;

      case 'goodbye':
        responseText = "Thank you for shopping with FreshMarket! Have a great day. Goodbye!";
        setTimeout(() => endCall(), 2000);
        break;

      default:
        responseText = "I didn't catch that. Try saying 'add milk', 'ingredients for chai', or 'place order'.";
    }

    addMessage('assistant', responseText);
    speakText(responseText);
    shouldRestartListening.current = true;
  }, [cart, ordersData, addToCart, removeFromCart, clearCart, addMessage, speakText, checkoutState]);

  // Helper function to extract name from phrases like "my name is John"
  const extractName = (text: string): string => {
    const namePhrases = ['my name is', 'name is', "i'm", "i am"];
    for (const phrase of namePhrases) {
      if (text.toLowerCase().includes(phrase)) {
        const index = text.toLowerCase().indexOf(phrase) + phrase.length;
        const extracted = text.substring(index).trim().split(/[.,!?]/)[0].trim();
        if (extracted.length > 0) {
          return extracted;
        }
      }
    }
    return text.trim();
  };

  // Helper function to extract address (simple version - just clean the transcript)
  const extractAddress = (text: string): string => {
    return text.trim();
  };

  // Update refs so speech handler always uses current values
  useEffect(() => {
    processIntentRef.current = processIntent;
  }, [processIntent]);

  useEffect(() => {
    checkoutStateRef.current = checkoutState;
  }, [checkoutState]);

  const handleCheckout = (currentCart: any) => {
    if (currentCart.length === 0) {
      const msg = "Your cart is empty. Add some items first!";
      addMessage('assistant', msg);
      speakText(msg);
      shouldRestartListening.current = true;
      return;
    }

    // Start checkout flow - ask for name first
    checkoutDataRef.current = { name: '', address: '', cart: currentCart };
    checkoutStateRef.current = 'collecting_name';
    setCheckoutState('collecting_name');
    const msg = "Great! Before I place your order, I need a few details. What's your name?";
    addMessage('assistant', msg);
    speakText(msg);
    shouldRestartListening.current = true;
  };

  const finalizeOrder = (name: string, address: string, currentCart: any) => {
    const total = currentCart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const orderNumber = Math.random().toString(36).substring(2, 8).toUpperCase();
    const estimatedDelivery = new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    createOrderMutation.mutate({
      orderNumber,
      customerName: name,
      customerAddress: address,
      items: currentCart,
      total: Math.round(total),
      status: 'placed'
    }, {
      onSuccess: () => {
        setCustomerName(name);
        setCustomerAddress(address);
        const totalRupees = Math.round(total);
        const itemsList = currentCart.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
        const msg = `Perfect! Order #${orderNumber} confirmed. Items: ${itemsList}. Total: ₹${totalRupees}. Delivery to ${address}. Estimated delivery: ${estimatedDelivery}. Thank you!`;
        addMessage('assistant', msg);
        shouldRestartListening.current = false;
        speakText(msg);
        setCheckoutState('idle');
      },
      onError: () => {
        const msg = "Sorry, there was an error placing your order. Please try again.";
        addMessage('assistant', msg);
        shouldRestartListening.current = true;
        setCheckoutState('idle');
        speakText(msg);
      }
    });
  };

  // Start Call Function
  const startCall = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support voice input. Please use Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    setCallActive(true);
    const greeting = "Hello! Welcome to FreshMarket. I'm your grocery assistant. How can I help you today?";
    addMessage('assistant', greeting);
    shouldRestartListening.current = true; // Flag to restart listening after greeting
    speakText(greeting);
  };

  // End Call Function
  const endCall = () => {
    setCallActive(false);
    stopListening();
    window.speechSynthesis.cancel();
    setSpeaking(false);
    shouldRestartListening.current = false;
    clearMessages();
    checkoutStateRef.current = 'idle';
    setCheckoutState('idle');
    checkoutDataRef.current = { name: '', address: '', cart: [] };
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex h-screen w-full bg-background font-sans overflow-hidden">
      
      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <ChefHat className="h-5 w-5" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground">FreshMarket</span>
            {isCallActive && (
              <Badge variant="default" className="ml-2 animate-pulse bg-green-500">
                Call Active
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Voice Settings</DialogTitle>
                  <DialogDescription>
                    Configure Murf AI for high-quality voice (optional).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Murf API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter your Murf API Key" 
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      data-testid="input-api-key"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use browser's default voice (free).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Voice ID</Label>
                    <Input 
                      placeholder="en-IN-isha" 
                      value={tempVoiceId}
                      onChange={(e) => setTempVoiceId(e.target.value)}
                      data-testid="input-voice-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      Indian voices: en-IN-isha, en-IN-neil
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => {
                    setMurfConfig(tempApiKey, tempVoiceId);
                    setShowSettings(false);
                    toast({ description: "Settings saved!" });
                  }} data-testid="button-save-settings">Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

             <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowCatalog(!showCatalog)}
              className={cn("hidden md:flex", showCatalog && "bg-accent text-accent-foreground")}
              data-testid="button-catalog"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative rounded-full px-4 border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all" data-testid="button-cart">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  <span className="font-medium" data-testid="text-cart-total">₹{cartTotal.toFixed(0)}</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full animate-in zoom-in" data-testid="badge-cart-count">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[400px] flex flex-col">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" /> Your Cart
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 -mx-6 px-6 my-4">
                  {cart.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-center">
                      <ShoppingBag className="h-12 w-12 mb-3 opacity-20" />
                      <p>Your cart is empty</p>
                      <p className="text-sm mt-1">Say "add milk" to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {cart.map((item) => (
                        <CartItemRow key={item.id} item={item} onRemove={removeFromCart} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="mt-auto pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{cartTotal.toFixed(0)}</span>
                  </div>
                  <Button 
                    className="w-full text-base py-6 shadow-lg shadow-primary/20" 
                    onClick={handleCheckout} 
                    disabled={cart.length === 0}
                    data-testid="button-place-order"
                  >
                    Place Order
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4 md:p-6 bg-slate-50/50 dark:bg-neutral-950/50">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} {...msg} />
            ))}
            {isListening && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-primary text-sm ml-4 mb-4 font-medium"
                data-testid="status-listening"
              >
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                </span>
                Listening... Speak now!
              </motion.div>
            )}
            {isSpeaking && (
               <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground text-sm ml-4 mb-4"
                data-testid="status-speaking"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Speaking...
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Catalog Overlay */}
        <AnimatePresence>
          {showCatalog && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-card/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="p-4 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Quick Add from Catalog</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowCatalog(false)} className="h-6 w-6 p-0"><X className="h-4 w-4" /></Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-4">
                  {CATALOG.slice(0, 6).map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAdd={(name) => {
                        addToCart(name);
                        const msg = `Added ${name} to your cart.`;
                        addMessage('assistant', msg);
                        if (isCallActive) speakText(msg);
                      }} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call Controls - Voice Only */}
        <div className="p-6 bg-background border-t border-border">
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
            
            {/* Main Call Button */}
            {!isCallActive ? (
              <div className="flex flex-col items-center gap-4">
                <Button 
                  size="lg"
                  onClick={startCall}
                  className="h-16 px-12 rounded-full text-lg font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all"
                  data-testid="button-start-call"
                >
                  <Phone className="h-6 w-6 mr-3" />
                  Start Call
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Click to begin a voice conversation with your FreshMarket assistant
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 w-full">
                <Button 
                  size="lg"
                  variant="destructive"
                  onClick={endCall}
                  className="h-16 px-12 rounded-full text-lg font-semibold shadow-xl animate-pulse"
                  data-testid="button-end-call"
                >
                  <PhoneOff className="h-6 w-6 mr-3" />
                  End Call
                </Button>

                {/* Status Indicator */}
                <div className="flex flex-col items-center gap-2">
                  {isListening ? (
                    <div className="flex items-center gap-3 text-primary font-medium">
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                      </span>
                      Listening... Speak now!
                    </div>
                  ) : isSpeaking ? (
                    <div className="flex items-center gap-2 text-blue-500 font-medium">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Speaking...
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Ready to listen</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
      
      {/* Right Sidebar - Order History */}
      <div className="hidden xl:flex w-80 border-l border-border bg-background flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Order History
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Orders are saved to database</p>
        </div>
        <ScrollArea className="flex-1 p-6">
          {ordersData.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-10">
              No orders yet. Start a call to order!
            </div>
          ) : (
            <div className="space-y-4">
              {ordersData.map((order: any) => (
                <Card key={order.id} className="border-border/50" data-testid={`order-${order.id}`}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-medium">#{order.orderNumber}</CardTitle>
                      <Badge variant={order.status === 'placed' ? 'default' : 'secondary'} className="text-[10px] h-5">
                        {order.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 pb-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      {order.items.length} items • ₹{Math.round(order.total / 100)}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-7 text-xs"
                      onClick={() => window.open(`/api/orders/${order.id}/download`, '_blank')}
                      data-testid={`download-order-${order.id}`}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download JSON
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

    </div>
  );
}
