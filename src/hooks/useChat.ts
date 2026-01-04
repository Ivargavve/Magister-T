import { useState, useCallback, useRef, useEffect } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface UseChatOptions {
  apiEndpoint?: string
  token?: string | null
}

interface UseChatReturn {
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
  stopStreaming: () => void
}

/**
 * Custom hook for handling streaming chat with the Gemini AI backend.
 * Supports Server-Sent Events (SSE) for real-time text streaming.
 * For guests (no token), messages are persisted in localStorage.
 */
const API_URL = import.meta.env.VITE_API_URL || ''
const GUEST_MESSAGES_KEY = 'magister_t_guest_messages'

// Load guest messages from localStorage
const loadGuestMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem(GUEST_MESSAGES_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load guest messages:', e)
  }
  return []
}

// Save guest messages to localStorage
const saveGuestMessages = (messages: Message[]) => {
  try {
    // Only save non-streaming messages
    const toSave = messages.filter(m => !m.isStreaming)
    localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save guest messages:', e)
  }
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  // Use Render backend if VITE_API_URL is set, otherwise use local Netlify function
  const defaultEndpoint = API_URL ? `${API_URL}/api/chat` : '/api/chat-stream'
  const { apiEndpoint = defaultEndpoint, token } = options

  // For guests, load messages from localStorage on mount
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!token) {
      return loadGuestMessages()
    }
    return []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Save messages to localStorage for guests whenever messages change
  useEffect(() => {
    if (!token) {
      saveGuestMessages(messages)
    }
  }, [messages, token])

  /**
   * Stops the current streaming response
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setIsLoading(false)

    // Mark the current streaming message as complete
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    )
  }, [])

  /**
   * Parses Server-Sent Events from a text chunk
   */
  const parseSSE = (text: string): string[] => {
    const events: string[] = []
    const lines = text.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6) // Remove 'data: ' prefix
        if (data === '[DONE]') {
          continue
        }
        try {
          const parsed = JSON.parse(data)
          if (parsed.text) {
            events.push(parsed.text)
          }
        } catch {
          // Ignore parsing errors for incomplete chunks
        }
      }
    }

    return events
  }

  /**
   * Sends a message and handles the streaming response
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
      }

      // Create placeholder for assistant message
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsLoading(true)
      setIsStreaming(true)

      try {
        // Prepare messages for API (exclude the streaming placeholder)
        const apiMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Något gick fel med anropet')
        }

        // Read the response as text (SSE format)
        const text = await response.text()
        const chunks = parseSSE(text)

        // Accumulate and update message progressively
        let accumulatedText = ''

        for (const chunk of chunks) {
          accumulatedText += chunk

          // Update the assistant message with accumulated text
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedText }
                : msg
            )
          )

          // Small delay for smooth animation effect
          await new Promise((resolve) => setTimeout(resolve, 10))
        }

        // Mark streaming as complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        )
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // User cancelled the request
          console.log('Request was cancelled')
          return
        }

        console.error('Error:', error)

        // Update assistant message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: 'Oj, något gick fel! Försök igen om en stund.',
                  isStreaming: false,
                }
              : msg
          )
        )
      } finally {
        setIsLoading(false)
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [apiEndpoint, isLoading, messages, token]
  )

  /**
   * Clears all messages (and localStorage for guests)
   */
  const clearChat = useCallback(() => {
    stopStreaming()
    setMessages([])
    if (!token) {
      localStorage.removeItem(GUEST_MESSAGES_KEY)
    }
  }, [stopStreaming, token])

  return {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    clearChat,
    stopStreaming,
  }
}

export default useChat
