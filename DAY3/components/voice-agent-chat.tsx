import { VoiceMessage } from "./voice-message"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface VoiceAgentChatProps {
  messages: Message[]
}

export const VoiceAgentChat = ({ messages }: VoiceAgentChatProps) => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-md px-4 py-3 rounded-2xl backdrop-blur-sm flex items-start gap-3 ${
              msg.role === "user"
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/10 text-white border border-white/20"
            }`}
          >
            {msg.role === "assistant" && <VoiceMessage text={msg.content} />}
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
