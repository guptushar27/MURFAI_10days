import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, Volume2, Loader2, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Message, VoiceSessionState, Product, Order } from "@shared/schema";

interface VoiceAgentProps {
  onStartCall: () => void;
  onEndCall: () => void;
  isCallActive: boolean;
  sessionState: VoiceSessionState;
  messages: Message[];
  products: Product[];
  lastOrder: Order | null;
}

function AudioWaveform({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-8" data-testid="audio-waveform">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-cyan-400 rounded-full"
          animate={isActive ? {
            height: [8, 24, 16, 28, 12],
          } : { height: 8 }}
          transition={{
            duration: 0.5,
            repeat: isActive ? Infinity : 0,
            repeatType: "reverse",
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function AgentAvatar({ sessionState, isCallActive }: { sessionState: VoiceSessionState; isCallActive: boolean }) {
  return (
    <div className="relative" data-testid="agent-avatar">
      <motion.div
        className={cn(
          "w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm",
          "border-2",
          isCallActive ? "border-cyan-400/50" : "border-white/10"
        )}
        animate={sessionState === "speaking" ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {sessionState === "speaking" ? (
          <Volume2 className="w-10 h-10 md:w-12 md:h-12 text-cyan-400" data-testid="icon-speaking" />
        ) : sessionState === "listening" ? (
          <Mic className="w-10 h-10 md:w-12 md:h-12 text-cyan-400" data-testid="icon-listening" />
        ) : sessionState === "processing" ? (
          <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-cyan-400 animate-spin" data-testid="icon-processing" />
        ) : (
          <ShoppingBag className="w-10 h-10 md:w-12 md:h-12 text-white/60" data-testid="icon-idle" />
        )}
      </motion.div>
      
      {isCallActive && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
          animate={{
            scale: [1, 1.3, 1.5],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}
      
      {sessionState === "listening" && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-neutral-950" data-testid="listening-indicator">
          <Mic className="w-3 h-3 md:w-4 md:h-4 text-white" />
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
      data-testid={`message-${message.role}-${message.id}`}
    >
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 rounded-2xl",
          isUser
            ? "bg-cyan-500/20 text-white border border-cyan-400/20"
            : "bg-white/10 text-white/90 border border-white/10"
        )}
      >
        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap" data-testid="text-message-content">{message.content}</p>
        <p className="text-xs text-white/40 mt-1" data-testid="text-message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

interface ProductCardProps {
  product: Product;
  allProducts?: Product[];
}

function ProductCard({ product, allProducts }: ProductCardProps) {
  const getImageUrl = (imageName: string | undefined) => {
    if (!imageName) return null;
    return `/generated_images/${imageName}`;
  };
  
  // Get all size variants for this product (same name and color)
  const sizeVariants = allProducts
    ? allProducts.filter(p => p.name === product.name && p.color === product.color && p.size)
    : product.size ? [product] : [];
  
  return (
    <Card className="bg-white/5 border-white/10 p-4 backdrop-blur-sm overflow-hidden" data-testid={`card-product-${product.id}`}>
      <div className="aspect-square rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center mb-3 overflow-hidden">
        {product.image ? (
          <img 
            src={getImageUrl(product.image) || ""} 
            alt={product.name}
            className="w-full h-full object-cover"
            data-testid={`image-product-${product.id}`}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
        ) : (
          <Package className="w-12 h-12 text-white/40" />
        )}
      </div>
      <h3 className="text-white font-medium text-lg truncate font-display" data-testid="text-product-name">{product.name}</h3>
      <p className="text-white/60 text-sm mt-1 line-clamp-2" data-testid="text-product-description">{product.description}</p>
      <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
        <span className="text-2xl font-semibold text-white tabular-nums" data-testid="text-product-price">
          {product.currency === "INR" ? "₹" : "$"}{product.price}
        </span>
        <div className="flex gap-1 flex-wrap">
          {product.color && (
            <Badge variant="secondary" className="bg-white/10 text-white/70 text-xs" data-testid={`badge-color-${product.color}`}>
              {product.color}
            </Badge>
          )}
          {sizeVariants.length > 0 ? (
            sizeVariants.map(variant => (
              <Badge key={variant.id} variant="secondary" className="bg-cyan-500/20 text-cyan-200 text-xs" data-testid={`badge-size-${variant.size}`}>
                {variant.size}
              </Badge>
            ))
          ) : product.size ? (
            <Badge variant="secondary" className="bg-white/10 text-white/70 text-xs" data-testid={`badge-size-${product.size}`}>
              {product.size}
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function OrderConfirmation({ order }: { order: Order }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 md:p-6"
      data-testid={`order-confirmation-${order.id}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <ShoppingBag className="w-4 h-4 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-white font-display">Order Confirmed</h3>
      </div>
      
      {order.customerName && (
        <div className="mb-3 text-sm text-white/70" data-testid="text-customer-name">
          <span className="text-white/50">Customer: </span>{order.customerName}
        </div>
      )}
      
      {order.customerAddress && (
        <div className="mb-3 text-sm text-white/70 line-clamp-2" data-testid="text-customer-address">
          <span className="text-white/50">Delivery: </span>{order.customerAddress}
        </div>
      )}
      
      <div className="space-y-2 mb-4">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-white/80 gap-2 flex-wrap" data-testid={`order-item-${i}`}>
            <span data-testid="text-item-name">{item.productName} x{item.quantity}</span>
            <span className="tabular-nums" data-testid="text-item-price">{order.currency === "INR" ? "₹" : "$"}{item.price * item.quantity}</span>
          </div>
        ))}
      </div>
      
      <div className="border-t border-white/10 pt-3 flex justify-between items-center gap-2 flex-wrap mb-3">
        <span className="text-white/60 text-sm">Total</span>
        <span className="text-3xl font-semibold text-white tabular-nums" data-testid="text-order-total">
          {order.currency === "INR" ? "₹" : "$"}{order.total}
        </span>
      </div>
      
      {order.estimatedDelivery && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 mb-3 text-sm text-cyan-200" data-testid="text-estimated-delivery">
          📦 Estimated Delivery: {order.estimatedDelivery}
        </div>
      )}
      
      <div className="mt-3 text-xs text-white/40 font-mono" data-testid="text-order-id">
        Order ID: {order.id}
      </div>
      <div className="text-xs text-white/40" data-testid="text-order-timestamp">
        Ordered: {new Date(order.createdAt).toLocaleString('en-IN')}
      </div>
    </motion.div>
  );
}

export function VoiceAgent({
  onStartCall,
  onEndCall,
  isCallActive,
  sessionState,
  messages,
  products,
  lastOrder,
}: VoiceAgentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const getStateLabel = () => {
    switch (sessionState) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Thinking...";
      case "speaking":
        return "Speaking...";
      default:
        return isCallActive ? "Connected" : "Start a call";
    }
  };
  
  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto px-4 py-6 md:py-8" data-testid="voice-agent-container">
      {isCallActive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-1 w-full bg-cyan-500/20 rounded-full mb-6 overflow-hidden"
          data-testid="session-status-bar"
        >
          <motion.div
            className="h-full bg-cyan-400"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: "50%" }}
          />
        </motion.div>
      )}
      
      <div className="flex flex-col items-center mb-6 md:mb-8">
        <AgentAvatar sessionState={sessionState} isCallActive={isCallActive} />
        
        <motion.h1
          className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mt-6 text-center font-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="text-agent-title"
        >
          Nova
        </motion.h1>
        
        <motion.p
          className="text-lg md:text-xl text-white/60 mt-2 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          data-testid="text-session-state"
        >
          {getStateLabel()}
        </motion.p>
        
        {(sessionState === "speaking" || sessionState === "listening") && (
          <div className="mt-4">
            <AudioWaveform isActive={sessionState === "speaking"} />
          </div>
        )}
      </div>
      
      {isCallActive && messages.length > 0 && (
        <Card className="flex-1 bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden mb-6" data-testid="conversation-panel">
          <ScrollArea className="h-[300px] md:h-[400px] p-4 md:p-6" ref={scrollRef}>
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </Card>
      )}
      
      {products.length > 0 && (
        <div className="mb-6" data-testid="products-section">
          <h3 className="text-white/80 text-sm font-medium mb-3">Products mentioned:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(() => {
              // Group products by name+color to show one card per product (with all sizes)
              const seen = new Set<string>();
              const uniqueProducts = products.filter(p => {
                const key = `${p.name}-${p.color}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              
              return uniqueProducts.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} allProducts={products} />
              ));
            })()}
          </div>
        </div>
      )}
      
      {lastOrder && (
        <div className="mb-6" data-testid="order-section">
          <OrderConfirmation order={lastOrder} />
        </div>
      )}
      
      <div className="mt-auto fixed bottom-0 left-0 right-0 pb-6 pt-4 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent" data-testid="bottom-action-bar">
        <div className="max-w-2xl mx-auto px-4">
          
          <div className="flex justify-center">
            <Button
              data-testid={isCallActive ? "button-end-call" : "button-start-call"}
              size="lg"
              onClick={isCallActive ? onEndCall : onStartCall}
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-full transition-all duration-300",
                isCallActive
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-cyan-500 hover:bg-cyan-600 text-white"
              )}
            >
              {isCallActive ? (
                <PhoneOff className="w-6 h-6 md:w-8 md:h-8" />
              ) : (
                <Phone className="w-6 h-6 md:w-8 md:h-8" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="h-28" />
    </div>
  );
}
