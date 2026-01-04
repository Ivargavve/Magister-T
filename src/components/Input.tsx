import { useState, useRef, useEffect } from 'react'

interface InputProps {
  onSend: (message: string) => void
  disabled: boolean
  isStreaming?: boolean
  onStopStreaming?: () => void
}

function Input({ onSend, disabled, isStreaming, onStopStreaming }: InputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  // Keep focus on textarea after response is complete
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim())
      setValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-black/40 backdrop-blur-sm px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Skriv din fråga här..."
              disabled={disabled}
              autoFocus
              rows={1}
              className="flex-1 bg-transparent text-parchment-100 placeholder-parchment-400 resize-none text-sm leading-relaxed disabled:opacity-50 focus:outline-none"
            />

            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  onClick={onStopStreaming}
                  className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-500 transition-colors"
                  title="Stoppa generering"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={disabled || !value.trim()}
                  className="p-2.5 rounded-xl bg-magister-500 hover:bg-magister-400 disabled:opacity-40 disabled:hover:bg-magister-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-white"
                  >
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Input
