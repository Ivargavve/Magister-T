import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Chat from './components/Chat'
import Sidebar from './components/Sidebar'
import Settings from './components/Settings'
import LoginScreen from './components/LoginScreen'
import AdminPage from './components/AdminPage'
import LanguageToggle from './components/LanguageToggle'
import { useChat, Message } from './hooks/useChat'
import { useChats } from './hooks/useChats'
import { useGuestChats } from './hooks/useGuestChats'
import { useAuth } from './contexts/AuthContext'
import { useLanguage } from './contexts/LanguageContext'
import libraryBackground from './assets/classlighter.jpg'

// Re-export Message type for backward compatibility
export type { Message } from './hooks/useChat'

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const { isAuthenticated, isLoading: authLoading, token } = useAuth()
  const { language } = useLanguage()
  const [showSettings, setShowSettings] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  // Authenticated chat list management
  const {
    chats: authChats,
    isLoadingChats: isLoadingAuthChats,
    loadChats: loadAuthChats,
    deleteAllChats: deleteAllAuthChats,
  } = useChats({ token })

  // Guest chat management
  const {
    chats: guestChats,
    currentChatId: guestCurrentChatId,
    currentChat: guestCurrentChat,
    createChat: createGuestChat,
    selectChat: selectGuestChat,
    updateChatMessages: updateGuestChatMessages,
    renameChat: renameGuestChat,
    deleteChat: deleteGuestChat,
    deleteAllChats: deleteAllGuestChats,
    clearCurrentChat: clearGuestCurrentChat,
  } = useGuestChats()

  // Current chat ID state for authenticated users
  const [authCurrentChatId, setAuthCurrentChatId] = useState<number | null>(null)

  // Track the current guest chat ID in a ref for callbacks
  const guestChatIdRef = useRef<string | null>(guestCurrentChatId)
  useEffect(() => {
    guestChatIdRef.current = guestCurrentChatId
  }, [guestCurrentChatId])

  // Unified current chat ID
  const currentChatId = isAuthenticated ? authCurrentChatId : guestCurrentChatId

  // Handle when a new chat is created (for authenticated users)
  const handleChatCreated = useCallback((chatId: number | string) => {
    if (isAuthenticated && typeof chatId === 'number') {
      setAuthCurrentChatId(chatId)
      loadAuthChats()
    }
  }, [isAuthenticated, loadAuthChats])

  // Handle messages updated (for guest chats)
  const handleMessagesUpdated = useCallback((messages: Message[]) => {
    if (!isAuthenticated) {
      const chatId = guestChatIdRef.current
      if (chatId) {
        updateGuestChatMessages(chatId, messages)
      }
    }
  }, [isAuthenticated, updateGuestChatMessages])

  // Initial messages for the chat
  const initialMessages = useMemo(() => {
    if (!isAuthenticated && guestCurrentChat) {
      return guestCurrentChat.messages
    }
    return []
  }, [isAuthenticated, guestCurrentChat])

  // Chat messaging
  const {
    messages,
    isLoading,
    isStreaming,
    sendMessage: sendChatMessage,
    clearChat,
    stopStreaming,
    loadMessages,
  } = useChat({
    token,
    chatId: currentChatId,
    onChatCreated: handleChatCreated,
    onMessagesUpdated: handleMessagesUpdated,
    initialMessages,
    language,
  })

  // Wrap sendMessage to create guest chat first if needed
  const sendMessage = useCallback(async (content: string) => {
    // For guests without a current chat, create one first
    if (!isAuthenticated && !guestCurrentChatId) {
      const newChatId = createGuestChat()
      guestChatIdRef.current = newChatId
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    await sendChatMessage(content)
  }, [isAuthenticated, guestCurrentChatId, createGuestChat, sendChatMessage])

  // Load messages when selecting an authenticated chat
  const handleSelectAuthChat = useCallback(async (chatId: number) => {
    if (!token || !API_URL) return

    setAuthCurrentChatId(chatId)

    try {
      const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load chat')
      }

      const data = await response.json()
      const chatMessages = (data.messages || []).map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
      }))

      loadMessages(chatMessages)
    } catch (error) {
      console.error('Failed to load chat:', error)
    }
  }, [token, loadMessages])

  // Handle selecting a guest chat
  const handleSelectGuestChat = useCallback((chatId: string) => {
    selectGuestChat(chatId)
    const chat = guestChats.find(c => c.id === chatId)
    if (chat) {
      loadMessages(chat.messages)
    }
  }, [selectGuestChat, guestChats, loadMessages])

  // Handle selecting a chat (unified for both auth and guest)
  const handleSelectChat = useCallback((chatId: number | string) => {
    if (isAuthenticated && typeof chatId === 'number') {
      handleSelectAuthChat(chatId)
    } else if (!isAuthenticated && typeof chatId === 'string') {
      handleSelectGuestChat(chatId)
    }
  }, [isAuthenticated, handleSelectAuthChat, handleSelectGuestChat])

  // Handle deleting a chat
  const handleDeleteChat = useCallback(async (chatId: number | string) => {
    if (!isAuthenticated && typeof chatId === 'string') {
      deleteGuestChat(chatId)
      if (guestCurrentChatId === chatId) {
        clearChat()
      }
    }
    // TODO: Add authenticated chat deletion
  }, [isAuthenticated, deleteGuestChat, guestCurrentChatId, clearChat])

  // Handle renaming a chat
  const handleRenameChat = useCallback((chatId: number | string, newTitle: string) => {
    if (!isAuthenticated && typeof chatId === 'string') {
      renameGuestChat(chatId, newTitle)
    }
    // TODO: Add authenticated chat renaming
  }, [isAuthenticated, renameGuestChat])

  // Handle new chat button
  const handleNewChat = useCallback(() => {
    if (isAuthenticated) {
      setAuthCurrentChatId(null)
    } else {
      clearGuestCurrentChat()
    }
    clearChat()
  }, [isAuthenticated, clearChat, clearGuestCurrentChat])

  // Handle clear all chats from settings
  const handleClearAllChats = useCallback(async () => {
    if (isAuthenticated) {
      await deleteAllAuthChats()
    } else {
      deleteAllGuestChats()
    }
    handleNewChat()
  }, [isAuthenticated, deleteAllAuthChats, deleteAllGuestChats, handleNewChat])

  // Unified chat list for sidebar
  const sidebarChats = useMemo(() => {
    if (isAuthenticated) {
      return authChats.map(chat => ({
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt,
      }))
    } else {
      return guestChats.map(chat => ({
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt,
      }))
    }
  }, [isAuthenticated, authChats, guestChats])

  // Reload auth chats when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadAuthChats()
      setAuthCurrentChatId(null)
    }
  }, [isAuthenticated, loadAuthChats])

  // Show loading spinner while checking auth status
  if (authLoading) {
    return (
      <div
        className="flex h-full items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${libraryBackground})` }}
      >
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-warm-500/20 blur-xl rounded-full" />
            <div className="relative w-16 h-16 border-4 border-warm-800 border-t-warm-400 rounded-full animate-spin" />
          </div>
          <p className="text-parchment-200 text-sm">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-[#2a1f1a]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Chat History */}
      {/* Hidden on mobile, shown as overlay when sidebarOpen is true */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          onNewChat={() => {
            handleNewChat()
            setShowAdmin(false)
            setSidebarOpen(false)
          }}
          onSelectChat={(chatId) => {
            handleSelectChat(chatId)
            setShowAdmin(false)
            setSidebarOpen(false)
          }}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          chats={sidebarChats}
          currentChatId={currentChatId}
          isLoadingChats={isAuthenticated ? isLoadingAuthChats : false}
          onSettingsClick={() => {
            setShowSettings(true)
            setSidebarOpen(false)
          }}
          onLoginClick={() => {
            setShowLogin(true)
            setSidebarOpen(false)
          }}
          onAdminClick={() => {
            setShowAdmin(true)
            setSidebarOpen(false)
          }}
          onClose={() => setSidebarOpen(false)}
          isMobileOpen={sidebarOpen}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Language toggle in top right */}
        {!showAdmin && (
          <div className="absolute top-4 right-4 z-30">
            <LanguageToggle />
          </div>
        )}

        {/* Mobile menu button */}
        {!showAdmin && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-warm-800/80 text-parchment-200 hover:bg-warm-700 transition-colors shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}

        {/* Admin page or Chat area */}
        {showAdmin ? (
          <AdminPage onBack={() => setShowAdmin(false)} />
        ) : (
          <Chat
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onStopStreaming={stopStreaming}
          />
        )}
      </div>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onClearAllChats={handleClearAllChats}
      />

      {/* Login Modal */}
      {showLogin && !isAuthenticated && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-overlay animate-fade-in"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-warm-900/80 text-parchment-200 hover:text-parchment-100 hover:bg-warm-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <LoginScreen onSuccess={() => setShowLogin(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
