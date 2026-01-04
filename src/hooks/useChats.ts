import { useState, useCallback, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export interface ChatSummary {
  id: number
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface ChatWithMessages extends ChatSummary {
  messages: ChatMessage[]
}

interface UseChatsOptions {
  token: string | null
}

interface UseChatsReturn {
  chats: ChatSummary[]
  currentChatId: number | null
  isLoadingChats: boolean
  loadChats: () => Promise<void>
  createChat: (title?: string) => Promise<number | null>
  selectChat: (chatId: number) => void
  deleteChat: (chatId: number) => Promise<boolean>
  deleteAllChats: () => Promise<void>
  clearCurrentChat: () => void
  loadChatMessages: (chatId: number) => Promise<ChatMessage[]>
  sendMessageToChat: (chatId: number, content: string) => Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage } | null>
}

export function useChats({ token }: UseChatsOptions): UseChatsReturn {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [currentChatId, setCurrentChatId] = useState<number | null>(null)
  const [isLoadingChats, setIsLoadingChats] = useState(false)

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!token) return {}
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  }, [token])

  // Load all chats for the user
  const loadChats = useCallback(async () => {
    if (!token || !API_URL) return

    setIsLoadingChats(true)
    try {
      const response = await fetch(`${API_URL}/api/chats`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to load chats')
      }

      const data = await response.json()
      setChats(data.chats || [])
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setIsLoadingChats(false)
    }
  }, [token, getAuthHeaders])

  // Create a new chat
  const createChat = useCallback(async (title: string = 'Ny konversation'): Promise<number | null> => {
    if (!token || !API_URL) return null

    try {
      const response = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error('Failed to create chat')
      }

      const chat = await response.json()
      // Add the new chat to the list
      setChats(prev => [chat, ...prev])
      setCurrentChatId(chat.id)
      return chat.id
    } catch (error) {
      console.error('Failed to create chat:', error)
      return null
    }
  }, [token, getAuthHeaders])

  // Select a chat
  const selectChat = useCallback((chatId: number) => {
    setCurrentChatId(chatId)
  }, [])

  // Clear current chat selection
  const clearCurrentChat = useCallback(() => {
    setCurrentChatId(null)
  }, [])

  // Delete a chat
  const deleteChat = useCallback(async (chatId: number): Promise<boolean> => {
    if (!token || !API_URL) return false

    try {
      const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to delete chat')
      }

      // Remove from local state
      setChats(prev => prev.filter(c => c.id !== chatId))

      // Clear current if it was the deleted one
      if (currentChatId === chatId) {
        setCurrentChatId(null)
      }

      return true
    } catch (error) {
      console.error('Failed to delete chat:', error)
      return false
    }
  }, [token, getAuthHeaders, currentChatId])

  // Delete all chats
  const deleteAllChats = useCallback(async () => {
    if (!token || !API_URL) return

    // Delete each chat
    for (const chat of chats) {
      await deleteChat(chat.id)
    }
  }, [token, chats, deleteChat])

  // Load messages for a specific chat
  const loadChatMessages = useCallback(async (chatId: number): Promise<ChatMessage[]> => {
    if (!token || !API_URL) return []

    try {
      const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to load chat')
      }

      const data = await response.json()
      return data.messages || []
    } catch (error) {
      console.error('Failed to load chat messages:', error)
      return []
    }
  }, [token, getAuthHeaders])

  // Send message to a chat and get AI response
  const sendMessageToChat = useCallback(async (
    chatId: number,
    content: string
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage } | null> => {
    if (!token || !API_URL) return null

    try {
      const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      // Reload chats to get updated title
      loadChats()

      return {
        userMessage: data.userMessage,
        assistantMessage: data.assistantMessage,
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      return null
    }
  }, [token, getAuthHeaders, loadChats])

  // Load chats on mount when authenticated
  useEffect(() => {
    if (token) {
      loadChats()
    } else {
      setChats([])
      setCurrentChatId(null)
    }
  }, [token, loadChats])

  return {
    chats,
    currentChatId,
    isLoadingChats,
    loadChats,
    createChat,
    selectChat,
    deleteChat,
    deleteAllChats,
    clearCurrentChat,
    loadChatMessages,
    sendMessageToChat,
  }
}

export default useChats
