import { useRef, useEffect, useState } from 'react'
import type { Message } from '../hooks/useChat'
import MessageBubble from './Message'
import Input from './Input'
import MagisterPortrait from './MagisterAvatar'

interface ChatProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  isLoading: boolean
  isStreaming?: boolean
  onStopStreaming?: () => void
}

// Words that trigger wink when user says them
const GRATITUDE_WORDS = ['tack', 'tackar', 'thanks', 'thank you', 'thx', 'ty', 'nice', 'perfekt', 'toppen', 'grymt', 'awesome', 'great', 'bra', 'kanon']

function Chat({ messages, onSendMessage, isLoading, isStreaming, onStopStreaming }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showWink, setShowWink] = useState(false)
  const prevMessagesLengthRef = useRef(messages.length)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check if any message is currently streaming
  const hasStreamingMessage = messages.some((m) => m.isStreaming)

  // Detect gratitude message immediately when user sends it
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // Find the newest user message
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')

      if (lastUserMessage) {
        const content = lastUserMessage.content.toLowerCase()
        const isGrateful = GRATITUDE_WORDS.some(word => content.includes(word))

        if (isGrateful) {
          // Show wink immediately - this takes priority over reading/idea
          setShowWink(true)
          // Keep wink until response is done, then a bit longer
        }
      }
    }
    prevMessagesLengthRef.current = messages.length
  }, [messages.length])

  // Reset wink after response is complete
  useEffect(() => {
    if (showWink && !isStreaming && !isLoading) {
      // Response is done, keep wink for 2 more seconds then reset
      const timeout = setTimeout(() => setShowWink(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [showWink, isStreaming, isLoading])

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 text-center">
              {/* Welcome message */}
              <div className="animate-fade-in">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full scale-150" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-3xl shadow-glow mx-auto">
                    T
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-dark-100 mb-3">
                  Hej! Jag är Magister T
                </h2>
                <p className="text-dark-400 max-w-md leading-relaxed">
                  Jag hjälper dig att förstå programmering och AI genom att guida dig
                  till svaren - inte ge dem direkt. Ställ en fråga så resonerar vi tillsammans!
                </p>
              </div>

              {/* Suggestion buttons */}
              <div className="mt-10 grid gap-3 w-full max-w-md animate-slide-in-left">
                <SuggestionButton
                  text="Hur fungerar en for-loop?"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  }
                  onClick={() => onSendMessage('Hur fungerar en for-loop?')}
                />
                <SuggestionButton
                  text="Vad är skillnaden mellan let och const?"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  }
                  onClick={() => onSendMessage('Vad är skillnaden mellan let och const?')}
                />
                <SuggestionButton
                  text="Förklara vad en API är"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  }
                  onClick={() => onSendMessage('Förklara vad en API är')}
                />
              </div>
            </div>
          ) : (
            <div className="px-6 py-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && !hasStreamingMessage && (
                <div className="flex justify-start animate-fade-in mb-4">
                  <div className="glass-card rounded-2xl rounded-bl-md px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-emerald-400">T</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-dark-400">Magister T funderar</span>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <Input
          onSend={onSendMessage}
          disabled={isLoading}
          isStreaming={isStreaming}
          onStopStreaming={onStopStreaming}
        />
      </div>

      {/* Right side: Magister T Portrait (only visible when there are messages) */}
      {messages.length > 0 && (
        <div className="hidden lg:flex w-72 xl:w-80 flex-shrink-0 border-l border-white/5">
          <MagisterPortrait
            isThinking={isLoading && !hasStreamingMessage}
            isResponding={isStreaming || hasStreamingMessage}
            showWink={showWink}
          />
        </div>
      )}
    </div>
  )
}

function SuggestionButton({
  text,
  icon,
  onClick,
}: {
  text: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 px-5 py-4 text-left text-sm text-dark-300 glass-card hover:bg-white/5 rounded-xl transition-all duration-200 hover-lift"
    >
      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
        {icon}
      </div>
      <span className="flex-1">{text}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4 text-dark-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  )
}

export default Chat
