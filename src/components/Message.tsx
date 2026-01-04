import type { Message } from '../hooks/useChat'
import { useAuth } from '../contexts/AuthContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
          className={`text-sm leading-relaxed ${
            isAssistant ? 'text-dark-200 markdown-content' : 'text-white whitespace-pre-wrap'
          }`}
        >
          {isAssistant ? (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Headings
                  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-dark-100">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2 text-dark-100">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1 text-dark-100">{children}</h3>,
                  // Paragraphs
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  // Lists
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="ml-2">{children}</li>,
                  // Code
                  code: ({ className, children }) => {
                    const isInline = !className
                    if (isInline) {
                      return (
                        <code className="bg-dark-700 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono">
                          {children}
                        </code>
                      )
                    }
                    return (
                      <code className="block bg-dark-800 p-3 rounded-lg my-2 overflow-x-auto text-xs font-mono text-dark-200">
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }) => <pre className="bg-dark-800 rounded-lg my-2 overflow-x-auto">{children}</pre>,
                  // Strong and emphasis
                  strong: ({ children }) => <strong className="font-semibold text-dark-100">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  // Links
                  a: ({ href, children }) => (
                    <a href={href} className="text-emerald-400 hover:text-emerald-300 underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-emerald-500 pl-3 my-2 italic text-dark-300">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && message.content && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-emerald-400 animate-cursor-blink align-middle" />
              )}
              {isStreaming && !message.content && (
                <span className="text-dark-400 flex items-center gap-1">
                  <span>Magister T skriver</span>
                  <span className="animate-pulse">...</span>
                </span>
              )}
            </>
          ) : (
            message.content
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
