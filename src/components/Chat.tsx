import { useRef, useEffect } from 'react'
import type { Message } from '../App'
import MessageBubble from './Message'
import Input from './Input'
import MagisterAvatar from './MagisterAvatar'

interface ChatProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  isLoading: boolean
}

function Chat({ messages, onSendMessage, isLoading }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4 text-center">
            <MagisterAvatar size="large" isThinking={false} />
            <h2 className="mt-6 text-2xl font-semibold text-dark-100">
              Hej! Jag är Magister T
            </h2>
            <p className="mt-3 text-dark-400 max-w-md">
              Jag hjälper dig att förstå programmering och AI genom att guida dig
              till svaren – inte ge dem direkt. Ställ en fråga så resonerar vi tillsammans!
            </p>
            <div className="mt-8 grid gap-3 w-full max-w-md">
              <SuggestionButton
                text="Hur fungerar en for-loop?"
                onClick={() => onSendMessage('Hur fungerar en for-loop?')}
              />
              <SuggestionButton
                text="Vad är skillnaden mellan let och const?"
                onClick={() => onSendMessage('Vad är skillnaden mellan let och const?')}
              />
              <SuggestionButton
                text="Förklara vad en API är"
                onClick={() => onSendMessage('Förklara vad en API är')}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 py-4 animate-fade-in">
                <MagisterAvatar size="small" isThinking={true} />
                <div className="flex items-center gap-1 text-dark-400 text-sm pt-2">
                  <span>Magister T funderar</span>
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <Input onSend={onSendMessage} disabled={isLoading} />
    </div>
  )
}

function SuggestionButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3 text-left text-sm text-dark-300 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg transition-colors"
    >
      {text}
    </button>
  )
}

export default Chat
