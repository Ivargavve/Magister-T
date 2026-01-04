import type { Message } from '../hooks/useChat'
import { useAuth } from '../contexts/AuthContext'

interface MessageBubbleProps {
  message: Message
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth()
  const isAssistant = message.role === 'assistant'
  const isStreaming = message.isStreaming

  // Get user initials for fallback
  const getUserInitials = () => {
    if (!user?.name) return 'Du'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0]
    }
    return names[0][0] || 'Du'
  }

  return (
    <div
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-in mb-4`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 transition-all duration-200 ${
          isAssistant
            ? 'glass-card rounded-bl-md hover:shadow-card'
            : 'bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-br-md shadow-glow'
        }`}
      >
        {/* Role indicator */}
        <div className="flex items-center gap-2 mb-2">
          {isAssistant ? (
            <>
              <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-400">T</span>
              </div>
              <span className="text-xs font-medium text-emerald-400">Magister T</span>
              {isStreaming && (
                <div className="flex items-center gap-1 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot" />
                </div>
              )}
            </>
          ) : (
            <>
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name || 'Anvandare'}
                  className="w-5 h-5 rounded-md object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-white/80">{getUserInitials()}</span>
                </div>
              )}
              <span className="text-xs font-medium text-white/80">Du</span>
            </>
          )}
        </div>

        {/* Message content */}
        <div
          className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isAssistant ? 'text-dark-200' : 'text-white'
          }`}
        >
          {message.content}
          {isStreaming && message.content && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-emerald-400 animate-cursor-blink align-middle" />
          )}
          {isStreaming && !message.content && (
            <span className="text-dark-400 flex items-center gap-1">
              <span>Magister T skriver</span>
              <span className="animate-pulse">...</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
