import { useState, useCallback, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export interface ChatSummary {
  id: number
  title: string
  groupId: number | null
  createdAt: string
  updatedAt: string
}

export interface ChatGroup {
  id: number
  name: string
  isExpanded: boolean
  createdAt: string
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
  groups: ChatGroup[]
  currentChatId: number | null
  isLoadingChats: boolean
  loadChats: () => Promise<void>
  createChat: (title?: string, groupId?: number | null) => Promise<number | null>
  selectChat: (chatId: number) => void
  renameChat: (chatId: number, newTitle: string) => Promise<boolean>
  moveChat: (chatId: number, groupId: number | null) => Promise<boolean>
  deleteChat: (chatId: number) => Promise<boolean>
  deleteAllChats: () => Promise<void>
  clearCurrentChat: () => void
  loadChatMessages: (chatId: number) => Promise<ChatMessage[]>
  sendMessageToChat: (chatId: number, content: string) => Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage } | null>
  // Group functions
  createGroup: (name: string) => Promise<number | null>
  renameGroup: (groupId: number, newName: string) => Promise<boolean>
  deleteGroup: (groupId: number) => Promise<boolean>
  toggleGroupExpanded: (groupId: number) => Promise<boolean>
}

export function useChats({ token }: UseChatsOptions): UseChatsReturn {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [currentChatId, setCurrentChatId] = useState<number | null>(null)
  const [isLoadingChats, setIsLoadingChats] = useState(false)

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!token) return {}
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  }, [token])

  // Load all chats and groups for the user
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
      setGroups(data.groups || [])
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setIsLoadingChats(false)
    }
  }, [token, getAuthHeaders])

  // Create a new chat
  const createChat = useCallback(async (title: string = 'Ny konversation', groupId?: number | null): Promise<number | null> => {
    if (!token || !API_URL) return null

    try {
      const response = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, groupId: groupId || null }),
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

  // Rename a chat
  const renameChat = useCallback(async (chatId: number, newTitle: string): Promise<boolean> => {
    if (!token || !API_URL) return false

    try {
      const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: newTitle }),
      })

      if (!response.ok) {
        throw new Error('Failed to rename chat')
      }

      const updatedChat = await response.json()
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: updatedChat.title } : c))
      return true
    } catch (error) {
      console.error('Failed to rename chat:', error)
      return false
    }
  }, [token, getAuthHeaders])

  // Move a chat to a group
  const moveChat = useCallback(async (chatId: number, groupId: number | null): Promise<boolean> => {
    if (!token || !API_URL) return false

    try {
      const response = await fetch(`${API_URL}/api/chats/${chatId}/move`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ groupId }),
      })

      if (!response.ok) {
        throw new Error('Failed to move chat')
      }

      const updatedChat = await response.json()
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, groupId: updatedChat.groupId } : c))
      return true
    } catch (error) {
      console.error('Failed to move chat:', error)
      return false
    }
  }, [token, getAuthHeaders])

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

  // ========== GROUP FUNCTIONS ==========

  // Create a new group
  const createGroup = useCallback(async (name: string): Promise<number | null> => {
    if (!token || !API_URL) return null

    try {
      const response = await fetch(`${API_URL}/api/chats/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error('Failed to create group')
      }

      const group = await response.json()
      setGroups(prev => [...prev, group])
      return group.id
    } catch (error) {
      console.error('Failed to create group:', error)
      return null
    }
  }, [token, getAuthHeaders])

  // Rename a group
  const renameGroup = useCallback(async (groupId: number, newName: string): Promise<boolean> => {
    if (!token || !API_URL) return false

    try {
      const response = await fetch(`${API_URL}/api/chats/groups/${groupId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newName }),
      })

      if (!response.ok) {
        throw new Error('Failed to rename group')
      }

      const updatedGroup = await response.json()
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: updatedGroup.name } : g))
      return true
    } catch (error) {
      console.error('Failed to rename group:', error)
      return false
    }
  }, [token, getAuthHeaders])

  // Delete a group (chats in the group become ungrouped)
  const deleteGroup = useCallback(async (groupId: number): Promise<boolean> => {
    if (!token || !API_URL) return false

    try {
      const response = await fetch(`${API_URL}/api/chats/groups/${groupId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to delete group')
      }

      // Remove group from state and update chats that were in this group
      setGroups(prev => prev.filter(g => g.id !== groupId))
      setChats(prev => prev.map(c => c.groupId === groupId ? { ...c, groupId: null } : c))
      return true
    } catch (error) {
      console.error('Failed to delete group:', error)
      return false
    }
  }, [token, getAuthHeaders])

  // Toggle group expanded/collapsed
  const toggleGroupExpanded = useCallback(async (groupId: number): Promise<boolean> => {
    if (!token || !API_URL) return false

    const group = groups.find(g => g.id === groupId)
    if (!group) return false

    try {
      const response = await fetch(`${API_URL}/api/chats/groups/${groupId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isExpanded: !group.isExpanded }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle group')
      }

      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g))
      return true
    } catch (error) {
      console.error('Failed to toggle group:', error)
      return false
    }
  }, [token, getAuthHeaders, groups])

  // Load chats on mount when authenticated
  useEffect(() => {
    if (token) {
      loadChats()
    } else {
      setChats([])
      setGroups([])
      setCurrentChatId(null)
    }
  }, [token, loadChats])

  return {
    chats,
    groups,
    currentChatId,
    isLoadingChats,
    loadChats,
    createChat,
    selectChat,
    renameChat,
    moveChat,
    deleteChat,
    deleteAllChats,
    clearCurrentChat,
    loadChatMessages,
    sendMessageToChat,
    // Group functions
    createGroup,
    renameGroup,
    deleteGroup,
    toggleGroupExpanded,
  }
}

export default useChats
