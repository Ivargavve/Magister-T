import type { Message } from '../App'
import MagisterAvatar from './MagisterAvatar'

interface MessageBubbleProps {
  message: Message
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex items-start gap-3 py-4 animate-fade-in ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {isAssistant ? (
        <MagisterAvatar size="small" isThinking={false} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-dark-200 text-sm font-medium flex-shrink-0">
          Du
        </div>
      )}
      <div
        className={`flex-1 text-sm leading-relaxed whitespace-pre-wrap ${
          isAssistant ? 'text-dark-100' : 'text-dark-200'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

export default MessageBubble
