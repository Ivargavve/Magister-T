import { useState, useCallback, useEffect } from 'react'
import type { Message } from './useChat'

const GUEST_CHATS_KEY = 'magister_t_guest_chats'
const GUEST_GROUPS_KEY = 'magister_t_guest_groups'
const GUEST_CURRENT_CHAT_KEY = 'magister_t_guest_current_chat'

export interface GuestChat {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  groupId?: string | null
}

export interface GuestGroup {
  id: string
  name: string
  createdAt: string
  isExpanded: boolean
}

interface UseGuestChatsReturn {
  chats: GuestChat[]
  groups: GuestGroup[]
  currentChatId: string | null
  currentChat: GuestChat | null
  createChat: (groupId?: string | null) => string
  selectChat: (chatId: string) => void
  updateChatMessages: (chatId: string, messages: Message[]) => void
  renameChat: (chatId: string, newTitle: string) => void
  moveChat: (chatId: string, groupId: string | null) => void
  deleteChat: (chatId: string) => void
  deleteAllChats: () => void
  clearCurrentChat: () => void
  // Group functions
  createGroup: (name: string) => string
  renameGroup: (groupId: string, newName: string) => void
  deleteGroup: (groupId: string) => void
  toggleGroupExpanded: (groupId: string) => void
}

// Generate a unique ID
const generateId = () => `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Load chats from sessionStorage (cleared when browser closes)
const loadChatsFromStorage = (): GuestChat[] => {
  try {
    const stored = sessionStorage.getItem(GUEST_CHATS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load guest chats:', e)
  }
  return []
}

// Save chats to sessionStorage
const saveChatsToStorage = (chats: GuestChat[]) => {
  try {
    sessionStorage.setItem(GUEST_CHATS_KEY, JSON.stringify(chats))
  } catch (e) {
    console.error('Failed to save guest chats:', e)
  }
}

// Load groups from sessionStorage
const loadGroupsFromStorage = (): GuestGroup[] => {
  try {
    const stored = sessionStorage.getItem(GUEST_GROUPS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load guest groups:', e)
  }
  return []
}

// Save groups to sessionStorage
const saveGroupsToStorage = (groups: GuestGroup[]) => {
  try {
    sessionStorage.setItem(GUEST_GROUPS_KEY, JSON.stringify(groups))
  } catch (e) {
    console.error('Failed to save guest groups:', e)
  }
}

// Load current chat ID from sessionStorage
const loadCurrentChatId = (): string | null => {
  try {
    return sessionStorage.getItem(GUEST_CURRENT_CHAT_KEY)
  } catch {
    return null
  }
}

// Save current chat ID to sessionStorage
const saveCurrentChatId = (chatId: string | null) => {
  try {
    if (chatId) {
      sessionStorage.setItem(GUEST_CURRENT_CHAT_KEY, chatId)
    } else {
      sessionStorage.removeItem(GUEST_CURRENT_CHAT_KEY)
    }
  } catch (e) {
    console.error('Failed to save current chat ID:', e)
  }
}

export function useGuestChats(): UseGuestChatsReturn {
  const [chats, setChats] = useState<GuestChat[]>(() => loadChatsFromStorage())
  const [groups, setGroups] = useState<GuestGroup[]>(() => loadGroupsFromStorage())
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => loadCurrentChatId())

  // Save chats to localStorage whenever they change
  useEffect(() => {
    saveChatsToStorage(chats)
  }, [chats])

  // Save groups to localStorage whenever they change
  useEffect(() => {
    saveGroupsToStorage(groups)
  }, [groups])

  // Save current chat ID whenever it changes
  useEffect(() => {
    saveCurrentChatId(currentChatId)
  }, [currentChatId])

  // Get current chat
  const currentChat = chats.find(c => c.id === currentChatId) || null

  // Create a new chat
  const createChat = useCallback((groupId?: string | null): string => {
    const now = new Date().toISOString()
    const newChat: GuestChat = {
      id: generateId(),
      title: 'Ny konversation',
      messages: [],
      createdAt: now,
      updatedAt: now,
      groupId: groupId || null,
    }

    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    return newChat.id
  }, [])

  // Select a chat
  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId)
  }, [])

  // Update messages for a chat
  const updateChatMessages = useCallback((chatId: string, messages: Message[]) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        // Auto-generate title from first user message if still default
        let newTitle = chat.title
        if (chat.title === 'Ny konversation' && messages.length > 0) {
          const firstUserMessage = messages.find(m => m.role === 'user')
          if (firstUserMessage) {
            newTitle = firstUserMessage.content.slice(0, 50)
            if (firstUserMessage.content.length > 50) {
              newTitle += '...'
            }
          }
        }

        return {
          ...chat,
          messages: messages.filter(m => !m.isStreaming),
          title: newTitle,
          updatedAt: new Date().toISOString(),
        }
      }
      return chat
    }))
  }, [])

  // Rename a chat
  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          title: newTitle.trim() || chat.title,
          updatedAt: new Date().toISOString(),
        }
      }
      return chat
    }))
  }, [])

  // Move a chat to a group
  const moveChat = useCallback((chatId: string, groupId: string | null) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          groupId,
          updatedAt: new Date().toISOString(),
        }
      }
      return chat
    }))
  }, [])

  // Delete a chat
  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }
  }, [currentChatId])

  // Delete all chats
  const deleteAllChats = useCallback(() => {
    setChats([])
    setGroups([])
    setCurrentChatId(null)
    sessionStorage.removeItem(GUEST_CHATS_KEY)
    sessionStorage.removeItem(GUEST_GROUPS_KEY)
    sessionStorage.removeItem(GUEST_CURRENT_CHAT_KEY)
  }, [])

  // Clear current chat selection
  const clearCurrentChat = useCallback(() => {
    setCurrentChatId(null)
  }, [])

  // Create a new group
  const createGroup = useCallback((name: string): string => {
    const newGroup: GuestGroup = {
      id: generateId(),
      name: name.trim() || 'Ny grupp',
      createdAt: new Date().toISOString(),
      isExpanded: true,
    }

    setGroups(prev => [...prev, newGroup])
    return newGroup.id
  }, [])

  // Rename a group
  const renameGroup = useCallback((groupId: string, newName: string) => {
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          name: newName.trim() || group.name,
        }
      }
      return group
    }))
  }, [])

  // Delete a group (moves chats out of the group)
  const deleteGroup = useCallback((groupId: string) => {
    // Move all chats in this group to ungrouped
    setChats(prev => prev.map(chat => {
      if (chat.groupId === groupId) {
        return { ...chat, groupId: null }
      }
      return chat
    }))
    // Delete the group
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }, [])

  // Toggle group expanded/collapsed
  const toggleGroupExpanded = useCallback((groupId: string) => {
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return { ...group, isExpanded: !group.isExpanded }
      }
      return group
    }))
  }, [])

  return {
    chats,
    groups,
    currentChatId,
    currentChat,
    createChat,
    selectChat,
    updateChatMessages,
    renameChat,
    moveChat,
    deleteChat,
    deleteAllChats,
    clearCurrentChat,
    createGroup,
    renameGroup,
    deleteGroup,
    toggleGroupExpanded,
  }
}

export default useGuestChats
