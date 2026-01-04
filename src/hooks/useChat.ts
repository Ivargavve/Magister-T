import { useState, useCallback, useRef } from 'react'

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
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { apiEndpoint = '/api/chat-stream', token } = options

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

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
   * Clears all messages
   */
  const clearChat = useCallback(() => {
    stopStreaming()
    setMessages([])
  }, [stopStreaming])

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
