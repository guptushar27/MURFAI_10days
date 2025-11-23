"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Mic, MicOff, Send, Volume2 } from "lucide-react"

interface OrderState {
  drinkType: string
  size: string
  milk: string
  extras: string[]
  name: string
}

export function BaristaAgent() {
  const [conversation, setConversation] = useState<{ role: "barista" | "customer"; text: string }[]>([
    {
      role: "barista",
      text: "☕ Welcome to Brewed Haven! I'm your barista. What can I get started for you today?",
    },
  ])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [orderState, setOrderState] = useState<OrderState>({
    drinkType: "",
    size: "",
    milk: "",
    extras: [],
    name: "",
  })
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderSummary, setOrderSummary] = useState<OrderState | null>(null)
  const [showVoiceGuide, setShowVoiceGuide] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onstart = () => {
        setRecordingTime(0)
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1)
        }, 100)
      }

      recognitionRef.current.onresult = (event: any) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setInput(transcript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        alert(`Microphone error: ${event.error}. Please try again or use text input.`)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation])

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (error) {
        console.error("[v0] Error starting recording:", error)
      }
    } else {
      alert("Speech Recognition not supported in this browser. Please use text input instead.")
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const saveOrderLocally = (order: OrderState) => {
    const existingOrders = JSON.parse(localStorage.getItem("baristaOrders") || "[]")
    const newOrder = {
      id: `order_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...order,
    }
    existingOrders.push(newOrder)
    localStorage.setItem("baristaOrders", JSON.stringify(existingOrders))
    return newOrder
  }

  const downloadOrderAsJSON = (order: OrderState) => {
    const orderData = {
      id: `order_${Date.now()}`,
      timestamp: new Date().toISOString(),
      customer: order.name,
      drink: {
        type: order.drinkType,
        size: order.size,
        milk: order.milk,
        extras: order.extras,
      },
    }

    const jsonString = JSON.stringify(orderData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `order_${order.name || "unnamed"}_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleSendMessage = async (userMessage: string = input) => {
    if (!userMessage.trim()) return

    setInput("")
    setIsLoading(true)

    const newConversation = [...conversation, { role: "customer" as const, text: userMessage }]
    setConversation(newConversation)

    try {
      const response = await fetch("/api/barista-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newConversation,
          currentOrder: orderState,
        }),
      })

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      const data = await response.json()

      setConversation((prev) => [...prev, { role: "barista", text: data.response }])

      // Update order state based on AI response
      if (data.updatedOrder) {
        setOrderState(data.updatedOrder)
      }

      // Check if order is complete
      if (data.orderComplete) {
        setOrderComplete(true)
        setOrderSummary(data.updatedOrder)
        saveOrderLocally(data.updatedOrder)
        setTimeout(() => {
          downloadOrderAsJSON(data.updatedOrder)
        }, 500)
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setConversation((prev) => [
        ...prev,
        {
          role: "barista",
          text: "I apologize, there was an error processing your order. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage()
    }
  }

  return (
    <div className="dark min-h-screen flex items-center justify-center p-4 py-8 bg-background">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">☕ Brewed Haven</h1>
          <p className="text-muted-foreground">AI-Powered Coffee Shop</p>
          <a href="/orders" className="text-sm text-primary hover:underline mt-1 inline-block">
            View saved orders
          </a>
        </div>

        {/* Chat Container */}
        <Card className="flex flex-col h-[600px] bg-card backdrop-blur border border-border/50">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {conversation.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg ${
                    msg.role === "customer" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground px-4 py-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Preparing your order...</span>
                </div>
              </div>
            )}
            <div ref={conversationEndRef} />
          </div>

          {/* Order Status */}
          {orderState.drinkType && !orderComplete && (
            <div className="px-6 py-3 border-t border-border/50 bg-accent/10">
              <p className="text-xs text-muted-foreground mb-2">Current Order:</p>
              <div className="flex gap-2 flex-wrap">
                {orderState.drinkType && (
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">{orderState.drinkType}</span>
                )}
                {orderState.size && (
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">{orderState.size}</span>
                )}
                {orderState.milk && (
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">{orderState.milk}</span>
                )}
                {orderState.extras.map((extra) => (
                  <span key={extra} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                    +{extra}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Order Complete Summary */}
          {orderComplete && orderSummary && (
            <div className="px-6 py-4 border-t border-border/50 bg-green-900/30">
              <h3 className="font-semibold text-green-400 mb-3">✓ Order Confirmed!</h3>
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  <span className="font-medium">Name:</span> {orderSummary.name}
                </p>
                <p>
                  <span className="font-medium">Drink:</span> {orderSummary.drinkType}
                </p>
                <p>
                  <span className="font-medium">Size:</span> {orderSummary.size}
                </p>
                <p>
                  <span className="font-medium">Milk:</span> {orderSummary.milk}
                </p>
                {orderSummary.extras.length > 0 && (
                  <p>
                    <span className="font-medium">Extras:</span> {orderSummary.extras.join(", ")}
                  </p>
                )}
              </div>
              <Button
                onClick={() => {
                  setConversation([
                    {
                      role: "barista",
                      text: "☕ Welcome to Brewed Haven! I'm your barista. What can I get started for you today?",
                    },
                  ])
                  setOrderState({
                    drinkType: "",
                    size: "",
                    milk: "",
                    extras: [],
                    name: "",
                  })
                  setOrderComplete(false)
                  setOrderSummary(null)
                }}
                className="mt-4 w-full"
                variant="outline"
              >
                New Order
              </Button>
            </div>
          )}

          {/* Input Area */}
          {!orderComplete && (
            <div className="p-4 border-t border-border/50 space-y-3">
              {showVoiceGuide && (
                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                  <div className="flex items-start gap-2 mb-2">
                    <Volume2 className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-2">What to say:</p>
                      <ul className="space-y-1">
                        <li>"I'd like a cappuccino, medium, with oat milk"</li>
                        <li>"Can I get an espresso shot, extra hot"</li>
                        <li>"Latte, large, with two shots of espresso and vanilla syrup"</li>
                        <li>"My name is John and I want a flat white"</li>
                      </ul>
                    </div>
                  </div>
                  <Button onClick={() => setShowVoiceGuide(false)} variant="ghost" size="sm" className="text-xs h-6">
                    Hide tips
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={isRecording ? "Listening... speak now" : "Type your order or use voice..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || isRecording}
                  className="flex-1"
                />
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  className="w-10"
                  title={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                {!showVoiceGuide && (
                  <Button
                    onClick={() => setShowVoiceGuide(true)}
                    variant="outline"
                    size="icon"
                    className="w-10"
                    title="Show voice tips"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Powered by AI • Voice ordering with Web Speech API • Orders saved locally
        </p>
      </div>
    </div>
  )
}
