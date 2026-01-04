import { useState } from 'react'
import Chat from './components/Chat'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Settings from './components/Settings'
import LoginScreen from './components/LoginScreen'
import { useChat } from './hooks/useChat'
import { useAuth } from './contexts/AuthContext'

// Re-export Message type for backward compatibility
export type { Message } from './hooks/useChat'

function App() {
  const { isAuthenticated, isLoading: authLoading, token } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    clearChat,
    stopStreaming,
  } = useChat({ token })

  // Show loading spinner while checking auth status
  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
            <div className="relative w-16 h-16 border-4 border-dark-700 border-t-emerald-500 rounded-full animate-spin" />
          </div>
          <p className="text-dark-400 text-sm">Laddar...</p>
        </div>
      </div>
    )
  }

  // Allow both authenticated and unauthenticated users to use the chat
  return (
    <div className="flex h-full">
      {/* Left Sidebar - Chat History */}
      <Sidebar onNewChat={clearChat} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onSettingsClick={() => setShowSettings(true)}
          onLoginClick={() => setShowLogin(true)}
        />

        {/* Chat area */}
        <Chat
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onStopStreaming={stopStreaming}
        />
      </div>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onClearAllChats={clearChat}
      />

      {/* Login Modal */}
      {showLogin && !isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay animate-fade-in">
          <div className="relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-dark-800/80 text-dark-400 hover:text-dark-100 hover:bg-dark-700 transition-colors"
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
