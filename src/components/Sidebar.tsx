import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import chatHistoryPaper from '../assets/chathistorypaper.png'
import sidebarBackground from '../assets/sidebarbackground.png'

interface ChatItem {
  id: number | string
  title: string
  updatedAt: string
}

interface SidebarProps {
  onNewChat: () => void
  onSelectChat?: (chatId: number | string) => void
  onDeleteChat?: (chatId: number | string) => void
  onRenameChat?: (chatId: number | string, newTitle: string) => void
  chats?: ChatItem[]
  currentChatId?: number | string | null
  isLoadingChats?: boolean
  onSettingsClick?: () => void
  onLoginClick?: () => void
  onClose?: () => void
  isMobileOpen?: boolean
  onAdminClick?: () => void
}

// Admin email whitelist
const ADMIN_EMAILS = [
  'ivargavelin@gmail.com',
  'markus.tangring@gmail.com'
]

function Sidebar({
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  chats = [],
  currentChatId,
  isLoadingChats,
  onSettingsClick,
  onLoginClick,
  onClose,
  isMobileOpen,
  onAdminClick,
}: SidebarProps) {
  const { isAuthenticated, user, logout } = useAuth()
  const [menuOpenId, setMenuOpenId] = useState<number | string | null>(null)
  const [menuPosition, setMenuPosition] = useState<'below' | 'above'>('below')
  const [editingChatId, setEditingChatId] = useState<number | string | null>(null)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const menuButtonRefs = useRef<Map<number | string, HTMLDivElement>>(new Map())

  // Focus input when editing
  useEffect(() => {
    if (editingChatId) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingChatId])

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just nu'
    if (diffMins < 60) return `${diffMins} min sedan`
    if (diffHours < 24) return `${diffHours} tim sedan`
    if (diffDays < 7) return `${diffDays} dagar sedan`
    return date.toLocaleDateString('sv-SE')
  }

  const handleMenuClick = (e: React.MouseEvent, chatId: number | string) => {
    e.stopPropagation()
    if (menuOpenId === chatId) {
      setMenuOpenId(null)
    } else {
      // Check if menu should appear above or below
      const buttonEl = menuButtonRefs.current.get(chatId)
      if (buttonEl) {
        const rect = buttonEl.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        // If less than 370px below, show menu above
        setMenuPosition(spaceBelow < 370 ? 'above' : 'below')
      }
      setMenuOpenId(chatId)
    }
  }

  const handleDelete = (e: React.MouseEvent, chatId: number | string) => {
    e.stopPropagation()
    onDeleteChat?.(chatId)
    setMenuOpenId(null)
  }

  const handleStartRename = (e: React.MouseEvent, chatId: number | string, currentTitle: string) => {
    e.stopPropagation()
    setEditingChatId(chatId)
    setEditValue(currentTitle)
    setMenuOpenId(null)
  }

  const handleRenameSubmit = (chatId: number | string) => {
    if (editValue.trim()) {
      onRenameChat?.(chatId, editValue.trim())
    }
    setEditingChatId(null)
    setEditValue('')
  }

  const handleBackdropClick = () => {
    setMenuOpenId(null)
  }

  // Get index for alternating rotation
  const getChatIndex = (chatId: number | string) => {
    return chats.findIndex(c => c.id === chatId)
  }

  // Render a chat item
  const renderChatItem = (chat: ChatItem) => {
    const index = getChatIndex(chat.id)
    const rotation = index % 2 === 0 ? 'rotate-3' : '-rotate-3'

    return (
    <div key={chat.id} className="relative group">
      {editingChatId === chat.id ? (
        <div className="px-2 py-1">
          <input
            ref={editInputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleRenameSubmit(chat.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit(chat.id)
              if (e.key === 'Escape') {
                setEditingChatId(null)
                setEditValue('')
              }
            }}
            className="w-full px-2 py-1 text-sm bg-parchment-100 rounded text-warm-900 focus:outline-none"
          />
        </div>
      ) : (
        <button
          onClick={() => onSelectChat?.(chat.id)}
          style={{ backgroundImage: `url(${chatHistoryPaper})`, backgroundSize: '100% 100%' }}
          className={`w-full text-left rounded-md transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] min-h-[110px] text-warm-950 ${rotation} ${
            currentChatId === chat.id ? 'scale-[1.03] shadow-lg' : ''
          }`}
        >
          <div className="px-6 py-5 flex items-center justify-between h-full">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-bold truncate" style={{ color: '#6d4f36' }}>
                {chat.title}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6d4f36' }}>
                {formatRelativeTime(chat.updatedAt)}
              </p>
            </div>
            {/* Clip/link icon - click for menu */}
            <div
              ref={(el) => { if (el) menuButtonRefs.current.set(chat.id, el) }}
              onClick={(e) => handleMenuClick(e, chat.id)}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-warm-800/10 hover:bg-warm-800/25 flex items-center justify-center cursor-pointer transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#6d4f36" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Dropdown menu */}
      {menuOpenId === chat.id && (
        <>
          <div className="fixed inset-0 z-10" onClick={handleBackdropClick} />
          <div className={`absolute right-0 z-20 bg-white rounded-lg shadow-xl py-1 min-w-[140px] border border-warm-200 ${
            menuPosition === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
            <button
              onClick={(e) => handleStartRename(e, chat.id, chat.title)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Byt namn
            </button>
            <div className="border-t border-warm-100 mt-1 pt-1">
              <button
                onClick={(e) => handleDelete(e, chat.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Ta bort
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
  }

  return (
    <aside
      className="w-64 h-full flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${sidebarBackground})` }}
    >
      {/* Mobile close button */}
      {isMobileOpen && (
        <button
          onClick={onClose}
          className="md:hidden absolute top-3 right-3 z-10 p-2 rounded-lg bg-warm-800/80 text-parchment-200 hover:bg-warm-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* New chat button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-warm-500/50 text-warm-300 hover:text-warm-100 hover:border-warm-400 hover:bg-warm-800/30 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-sm">Ny chatt</span>
        </button>
      </div>

      {/* Chat history section */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <h3 className="text-center text-sm font-medium text-warm-300 mb-3 font-serif">
          Tidigare Chattar
        </h3>

        {isLoadingChats ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-warm-700 border-t-warm-400 rounded-full animate-spin" />
          </div>
        ) : (
          <nav className="space-y-2">
            {chats.length > 0 ? (
              chats.map(renderChatItem)
            ) : (
              <p className="px-3 py-4 text-sm text-warm-400 text-center">
                Inga sparade chattar än
              </p>
            )}
          </nav>
        )}
      </div>

      {/* Footer - Settings and Profile */}
      <div className="p-3 space-y-2">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-2 space-y-1">
          {/* Admin button - only for admin users */}
          {isAuthenticated && user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()) && (
            <button
              onClick={onAdminClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-warm-800/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="text-sm">Admin</span>
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-warm-300 hover:text-warm-100 hover:bg-warm-800/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">Inställningar</span>
          </button>

          {/* User profile or login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 px-3 py-2.5">
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name || 'Användare'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-warm-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-warm-600 flex items-center justify-center text-warm-200 text-sm font-medium">
                  {user?.name?.[0] || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-warm-200 truncate">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-warm-400 hover:text-warm-200 hover:bg-warm-800/50 transition-colors"
                title="Logga ut"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-warm-300 hover:text-warm-100 hover:bg-warm-800/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="text-sm">Logga in</span>
            </button>
          )}
        </div>

        {/* Version info */}
        <div className="text-center pt-1">
          <p className="text-[10px] text-warm-500">v1.0 • Jan 2026</p>
          <p className="text-[9px] text-warm-600">Personifiering av Markus Tångring</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
