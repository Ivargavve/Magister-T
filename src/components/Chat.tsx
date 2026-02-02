import { useRef, useEffect, useState } from 'react'
import type { Message } from '../hooks/useChat'
import MessageBubble from './Message'
import Input from './Input'
import MagisterPortrait from './MagisterAvatar'
import chatBackgroundPaper from '../assets/chatbackgroundpaper.webp'
import topOfChatPlank from '../assets/topofchatplank.webp'
import classroomBackground from '../assets/classlighter.webp'
import chalkboard from '../assets/chalkboard.webp'
import { useLanguage } from '../contexts/LanguageContext'

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
  const { t } = useLanguage()

  // Simple scroll behavior: always scroll to bottom when messages change
  // This handles: loading chats, sending messages, receiving responses
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
    <div className="flex-1 flex overflow-hidden relative">
      {/* Blurred background - extended beyond container to prevent blur edge artifacts */}
      <div
        className="absolute -inset-4 bg-cover bg-center bg-no-repeat blur"
        style={{ backgroundImage: `url(${classroomBackground})` }}
      />
      {/* Content container */}
      <div className="relative flex-1 flex overflow-hidden">
      {/* Main chat area wrapper - handles portrait spacing and centering */}
      <div className="flex-1 flex justify-center min-w-0 lg:pr-[250px] xl:pr-[300px] 2xl:pr-[350px]">
      {/* Centered chat content */}
      <div className="w-full max-w-5xl flex flex-col overflow-hidden">
        {/* Wood plank header - only show when there are messages */}
        {messages.length > 0 && (
          <div
            className="h-16 bg-cover bg-center flex items-center justify-center flex-shrink-0 mt-6 mx-0 md:mx-4 rounded-none md:rounded-lg"
            style={{ backgroundImage: `url(${topOfChatPlank})` }}
          >
            <h1 className="text-xl font-semibold text-warm-200 drop-shadow-lg font-serif flex items-center gap-1">
              Magister <img src="/tlogo.png" alt="T" className="h-6 w-6 inline-block" />
            </h1>
          </div>
        )}

        {/* Chat content area with parchment background */}
        <div
          className={`flex-1 ${messages.length > 0 ? 'overflow-y-auto overflow-x-hidden bg-no-repeat mx-0 md:mx-4 -mb-10 relative z-0' : 'overflow-hidden'}`}
          style={messages.length > 0 ? {
            backgroundImage: `url(${chatBackgroundPaper})`,
            backgroundSize: '100% calc(100% + 40px)',
            backgroundPosition: 'top center'
          } : {}}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-2 md:px-4 text-center">
              {/* Chalkboard with welcome message - responsive sizing */}
              <div
                className="relative w-[95vw] max-w-[700px] aspect-[700/530] bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${chalkboard})`, transform: 'rotate(2deg)' }}
              >
                {/* Text content on the chalkboard - original positioning preserved for desktop */}
                <div className="absolute inset-0 flex flex-col items-center justify-start px-[12%] md:px-24 pt-[30%] md:pt-48 pb-[8%] md:pb-20" style={{ transform: 'rotate(-2deg)' }}>
                  <h2 className="text-[4.5vw] md:text-3xl font-bold text-white mb-1 md:mb-3 font-chalk drop-shadow-sm">
                    {t('welcomeMessage')}
                  </h2>
                  <p className="text-white/90 text-center leading-relaxed font-chalk text-[3vw] md:text-lg mb-2 md:mb-8">
                    {t('suggestionText')}
                  </p>

                  {/* Chalk-style suggestion buttons */}
                  <div className="grid gap-1.5 md:gap-3 w-full max-w-[85%] md:max-w-sm">
                    <ChalkButton
                      text={t('suggestion1')}
                      onClick={() => onSendMessage(t('suggestion1'))}
                    />
                    <ChalkButton
                      text={t('suggestion2')}
                      onClick={() => onSendMessage(t('suggestion2Alt'))}
                    />
                    <ChalkButton
                      text={t('suggestion3')}
                      onClick={() => onSendMessage(t('suggestion3'))}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-12 md:px-14 pt-6 md:pt-10 pb-6">
              {messages
                .filter(message => message.role === 'user' || message.content || message.isStreaming)
                .map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              {isLoading && !hasStreamingMessage && (
                <div className="flex justify-start animate-fade-in mb-4">
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-magister-600">{t('magisterTThinking')}</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-magister-500 typing-dot" />
                        <span className="w-1.5 h-1.5 rounded-full bg-magister-500 typing-dot" />
                        <span className="w-1.5 h-1.5 rounded-full bg-magister-500 typing-dot" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <Input
          onSend={onSendMessage}
          disabled={isLoading}
          isStreaming={isStreaming}
          onStopStreaming={onStopStreaming}
        />
      </div>
      </div>

      {/* Right side: Magister T Portrait - absolutely positioned with responsive scaling */}
      <div className="hidden lg:block absolute right-0 bottom-0 w-[400px] xl:w-[500px] 2xl:w-[550px] h-full pointer-events-none">
          <MagisterPortrait
            isThinking={isLoading && !hasStreamingMessage}
            isResponding={isStreaming || hasStreamingMessage}
            showWink={showWink}
          />
      </div>
      </div>
    </div>
  )
}

function ChalkButton({
  text,
  onClick,
}: {
  text: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1 md:py-2 text-left text-[2.8vw] md:text-sm text-white/80 hover:text-white border border-white/30 hover:border-white/60 rounded-lg transition-all duration-200 hover:bg-white/10 font-chalk"
    >
      <span className="text-white/60 group-hover:text-white transition-colors">→</span>
      <span className="flex-1">{text}</span>
    </button>
  )
}

export default Chat
