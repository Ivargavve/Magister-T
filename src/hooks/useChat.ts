import { useState, useCallback, useRef, useEffect } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface UseChatOptions {
  token?: string | null
  chatId?: number | string | null
  onChatCreated?: (chatId: number | string) => void
  onMessagesUpdated?: (messages: Message[]) => void
  initialMessages?: Message[]
}

interface UseChatReturn {
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
  stopStreaming: () => void
  loadMessages: (messages: Message[]) => void
}

const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * Custom hook for handling chat with the AI backend.
 * Supports both authenticated (database) and guest (localStorage) modes.
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { token, chatId, onChatCreated, onMessagesUpdated, initialMessages = [] } = options

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentChatIdRef = useRef<number | string | null>(chatId || null)
  const prevChatIdRef = useRef<number | string | null>(chatId || null)

  // Update ref when chatId changes
  useEffect(() => {
    currentChatIdRef.current = chatId || null
  }, [chatId])

  // Only update messages when switching to a DIFFERENT existing chat
  // Don't reset when creating a new chat (chatId goes from null to something)
  useEffect(() => {
    const prevId = prevChatIdRef.current
    const newId = chatId

    // Only load initial messages if:
    // 1. We're switching FROM an existing chat TO another existing chat
    // 2. OR we're selecting an existing chat from no chat
    if (newId !== null && prevId !== newId && initialMessages.length > 0) {
      setMessages(initialMessages)
    }

    prevChatIdRef.current = newId ?? null
  }, [chatId, initialMessages])

  // Notify parent when messages change
  useEffect(() => {
    if (onMessagesUpdated && messages.length > 0) {
      onMessagesUpdated(messages)
    }
  }, [messages, onMessagesUpdated])

  // Load messages from external source (used when selecting a chat)
  const loadMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages)
  }, [])

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

    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    )
  }, [])

  /**
   * Creates a new chat for authenticated users
   */
  const createNewChat = async (): Promise<number | null> => {
    if (!token || !API_URL) return null

    try {
      const response = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'Ny konversation' }),
      })

      if (!response.ok) {
        throw new Error('Failed to create chat')
      }

      const chat = await response.json()
      return chat.id
    } catch (error) {
      console.error('Failed to create chat:', error)
      return null
    }
  }

  /**
   * Sends a message and handles the response
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      abortControllerRef.current = new AbortController()

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
      }

      // Create placeholder for assistant message (NOT streaming yet - that comes when response starts)
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isStreaming: false,  // Will be set to true when response actually starts
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsLoading(true)
      // Don't set isStreaming yet - wait until response actually starts

      try {
        // For authenticated users with no current chat, create one first
        let activeChatId = currentChatIdRef.current

        if (token && !activeChatId) {
          const newChatId = await createNewChat()
          if (newChatId) {
            activeChatId = newChatId
            currentChatIdRef.current = newChatId
            onChatCreated?.(newChatId)
          }
        } else if (!token && !activeChatId) {
          // For guests, notify that we need a new chat
          onChatCreated?.('new')
        }

        // If authenticated and we have a chat, use the authenticated endpoint
        if (token && activeChatId && API_URL) {
          const response = await fetch(`${API_URL}/api/chats/${activeChatId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: content.trim() }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            throw new Error('Något gick fel med anropet')
          }

          const data = await response.json()
          const responseText = data.assistantMessage?.content || ''

          // Set streaming to true briefly to trigger idea state, then immediately complete
          setIsStreaming(true)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: responseText, isStreaming: true }
                : msg
            )
          )
          // Immediately mark as done since this is a non-streaming response
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            )
          }, 100)
        } else {
          // Guest mode - use the anonymous endpoint with real-time streaming
          const currentMessages = messages
          const apiMessages = [...currentMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          }))

          const endpoint = API_URL ? `${API_URL}/api/chat` : '/api/chat-stream'

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: apiMessages }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            throw new Error('Något gick fel med anropet')
          }

          const contentType = response.headers.get('content-type') || ''

          // Handle JSON response (fallback for non-streaming)
          if (contentType.includes('application/json')) {
            const data = await response.json()
            const responseText = data.response || ''

            // Set streaming to true briefly to trigger idea state
            setIsStreaming(true)
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: responseText, isStreaming: true }
                  : msg
              )
            )
            // Immediately mark as done since this is a non-streaming response
            setTimeout(() => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              )
            }, 100)
          } else {
            // Handle SSE streaming in real-time
            const reader = response.body?.getReader()
            if (!reader) {
              throw new Error('No response body')
            }

            // Now we're actually starting to stream - set streaming state
            setIsStreaming(true)
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: true }
                  : msg
              )
            )

            const decoder = new TextDecoder()
            let accumulatedText = ''
            let buffer = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              // Decode the chunk and add to buffer
              buffer += decoder.decode(value, { stream: true })

              // Process complete SSE events from buffer
              const lines = buffer.split('\n')
              buffer = lines.pop() || '' // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') {
                    continue
                  }
                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.text) {
                      accumulatedText += parsed.text

                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: accumulatedText }
                            : msg
                        )
                      )
                    }
                    if (parsed.error) {
                      throw new Error(parsed.error)
                    }
                  } catch (e) {
                    // Ignore JSON parse errors for incomplete chunks
                    if (e instanceof SyntaxError) continue
                    throw e
                  }
                }
              }
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            )
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          console.log('Request was cancelled')
          return
        }

        console.error('Error:', error)

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
    [isLoading, messages, token, onChatCreated]
  )

  /**
   * Clears all messages
   */
  const clearChat = useCallback(() => {
    stopStreaming()
    setMessages([])
    currentChatIdRef.current = null
  }, [stopStreaming])

  return {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    clearChat,
    stopStreaming,
    loadMessages,
  }
}

export default useChat
