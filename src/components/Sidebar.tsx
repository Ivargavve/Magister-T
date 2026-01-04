import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface ChatItem {
  id: number | string
  title: string
  updatedAt: string
  groupId?: string | null
}

interface GroupItem {
  id: string
  name: string
  isExpanded: boolean
}

interface SidebarProps {
  onNewChat: () => void
  onSelectChat?: (chatId: number | string) => void
  onDeleteChat?: (chatId: number | string) => void
  onRenameChat?: (chatId: number | string, newTitle: string) => void
  onMoveChat?: (chatId: number | string, groupId: string | null) => void
  chats?: ChatItem[]
  currentChatId?: number | string | null
  isLoadingChats?: boolean
  // Group props
  groups?: GroupItem[]
  onCreateGroup?: (name: string) => void
  onRenameGroup?: (groupId: string, newName: string) => void
  onDeleteGroup?: (groupId: string) => void
  onToggleGroup?: (groupId: string) => void
}

function Sidebar({
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onMoveChat,
  chats = [],
  currentChatId,
  isLoadingChats,
  groups = [],
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onToggleGroup,
}: SidebarProps) {
  const { isAuthenticated } = useAuth()
  const [menuOpenId, setMenuOpenId] = useState<number | string | null>(null)
  const [groupMenuOpenId, setGroupMenuOpenId] = useState<string | null>(null)
  const [editingChatId, setEditingChatId] = useState<number | string | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showNewGroupInput, setShowNewGroupInput] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const newGroupInputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing
  useEffect(() => {
    if (editingChatId || editingGroupId) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingChatId, editingGroupId])

  useEffect(() => {
    if (showNewGroupInput) {
      newGroupInputRef.current?.focus()
    }
  }, [showNewGroupInput])

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
    setMenuOpenId(menuOpenId === chatId ? null : chatId)
    setGroupMenuOpenId(null)
  }

  const handleGroupMenuClick = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation()
    setGroupMenuOpenId(groupMenuOpenId === groupId ? null : groupId)
    setMenuOpenId(null)
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

  const handleStartRenameGroup = (e: React.MouseEvent, groupId: string, currentName: string) => {
    e.stopPropagation()
    setEditingGroupId(groupId)
    setEditValue(currentName)
    setGroupMenuOpenId(null)
  }

  const handleRenameSubmit = (chatId: number | string) => {
    if (editValue.trim()) {
      onRenameChat?.(chatId, editValue.trim())
    }
    setEditingChatId(null)
    setEditValue('')
  }

  const handleRenameGroupSubmit = (groupId: string) => {
    if (editValue.trim()) {
      onRenameGroup?.(groupId, editValue.trim())
    }
    setEditingGroupId(null)
    setEditValue('')
  }

  const handleDeleteGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation()
    onDeleteGroup?.(groupId)
    setGroupMenuOpenId(null)
  }

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onCreateGroup?.(newGroupName.trim())
      setNewGroupName('')
      setShowNewGroupInput(false)
    }
  }

  const handleBackdropClick = () => {
    setMenuOpenId(null)
    setGroupMenuOpenId(null)
  }

  // Get ungrouped chats
  const ungroupedChats = chats.filter(chat => !chat.groupId)

  // Render a chat item
  const renderChatItem = (chat: ChatItem) => (
    <div key={chat.id} className="relative group">
      {editingChatId === chat.id ? (
        <div className="px-3 py-2">
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
            className="w-full px-2 py-1 text-sm bg-dark-700 border border-emerald-500 rounded text-dark-100 focus:outline-none"
          />
        </div>
      ) : (
        <button
          onClick={() => onSelectChat?.(chat.id)}
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 ${
            currentChatId === chat.id
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'hover:bg-dark-700/50'
          }`}
        >
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                currentChatId === chat.id ? 'text-emerald-400' : 'text-dark-500'
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
            <div className="flex-1 min-w-0 pr-6">
              <p
                className={`text-sm truncate ${
                  currentChatId === chat.id ? 'text-emerald-400 font-medium' : 'text-dark-300'
                }`}
              >
                {chat.title}
              </p>
              <p className="text-xs text-dark-500 mt-0.5">
                {formatRelativeTime(chat.updatedAt)}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* 3-dot menu button */}
      {editingChatId !== chat.id && (
        <button
          onClick={(e) => handleMenuClick(e, chat.id)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 ${
            menuOpenId === chat.id
              ? 'bg-dark-600 text-dark-200'
              : 'opacity-0 group-hover:opacity-100 hover:bg-dark-600 text-dark-400 hover:text-dark-200'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </button>
      )}

      {/* Dropdown menu */}
      {menuOpenId === chat.id && (
        <>
          <div className="fixed inset-0 z-10" onClick={handleBackdropClick} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-dark-700 border border-dark-600 rounded-lg shadow-lg py-1 min-w-[160px]">
            <button
              onClick={(e) => handleStartRename(e, chat.id, chat.title)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:bg-dark-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Byt namn
            </button>
            {groups.length > 0 && (
              <div className="border-t border-dark-600 my-1">
                <p className="px-3 py-1 text-xs text-dark-500">Flytta till grupp</p>
                {chat.groupId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveChat?.(chat.id, null); setMenuOpenId(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:bg-dark-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ingen grupp
                  </button>
                )}
                {groups.filter(g => g.id !== chat.groupId).map(group => (
                  <button
                    key={group.id}
                    onClick={(e) => { e.stopPropagation(); onMoveChat?.(chat.id, group.id); setMenuOpenId(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:bg-dark-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    {group.name}
                  </button>
                ))}
              </div>
            )}
            <div className="border-t border-dark-600 mt-1 pt-1">
              <button
                onClick={(e) => handleDelete(e, chat.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-600 transition-colors"
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

  return (
    <aside className="w-64 h-full flex flex-col glass border-r border-white/5">
      {/* New chat button */}
      <div className="p-4 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all duration-200 hover-lift glow-emerald"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Ny chatt</span>
        </button>

        {/* New group button */}
        {showNewGroupInput ? (
          <div className="flex gap-2">
            <input
              ref={newGroupInputRef}
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup()
                if (e.key === 'Escape') {
                  setShowNewGroupInput(false)
                  setNewGroupName('')
                }
              }}
              placeholder="Gruppnamn..."
              className="flex-1 px-3 py-2 text-sm bg-dark-700 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleCreateGroup}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewGroupInput(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dark-600 text-dark-400 hover:text-dark-200 hover:border-dark-500 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <span className="text-sm">Ny grupp</span>
          </button>
        )}
      </div>

      {/* Chat history section */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="mb-3">
          <h3 className="px-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
            Chatthistorik
          </h3>
        </div>

        {isLoadingChats ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-dark-600 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <nav className="space-y-1">
            {/* Groups */}
            {groups.map((group) => {
              const groupChats = chats.filter(chat => chat.groupId === group.id)
              return (
                <div key={group.id} className="mb-2">
                  {/* Group header */}
                  <div className="relative group/header">
                    {editingGroupId === group.id ? (
                      <div className="px-2 py-1">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleRenameGroupSubmit(group.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameGroupSubmit(group.id)
                            if (e.key === 'Escape') {
                              setEditingGroupId(null)
                              setEditValue('')
                            }
                          }}
                          className="w-full px-2 py-1 text-sm bg-dark-700 border border-emerald-500 rounded text-dark-100 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => onToggleGroup?.(group.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className={`w-4 h-4 text-dark-400 transition-transform ${group.isExpanded ? 'rotate-90' : ''}`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-amber-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                        <span className="text-sm font-medium text-dark-300 flex-1 text-left truncate">{group.name}</span>
                        <span className="text-xs text-dark-500">{groupChats.length}</span>
                      </button>
                    )}

                    {/* Group menu button */}
                    {editingGroupId !== group.id && (
                      <button
                        onClick={(e) => handleGroupMenuClick(e, group.id)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all duration-200 ${
                          groupMenuOpenId === group.id
                            ? 'bg-dark-600 text-dark-200'
                            : 'opacity-0 group-hover/header:opacity-100 hover:bg-dark-600 text-dark-400 hover:text-dark-200'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      </button>
                    )}

                    {/* Group dropdown menu */}
                    {groupMenuOpenId === group.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={handleBackdropClick} />
                        <div className="absolute right-0 top-full mt-1 z-20 bg-dark-700 border border-dark-600 rounded-lg shadow-lg py-1 min-w-[140px]">
                          <button
                            onClick={(e) => handleStartRenameGroup(e, group.id, group.name)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:bg-dark-600 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Byt namn
                          </button>
                          <button
                            onClick={(e) => handleDeleteGroup(e, group.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-600 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Ta bort
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Group chats */}
                  {group.isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-dark-700 pl-2">
                      {groupChats.length > 0 ? (
                        groupChats.map(renderChatItem)
                      ) : (
                        <p className="px-3 py-2 text-xs text-dark-500 italic">Inga chattar i gruppen</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Ungrouped chats */}
            {ungroupedChats.length > 0 ? (
              ungroupedChats.map(renderChatItem)
            ) : groups.length === 0 ? (
              <p className="px-3 py-4 text-sm text-dark-500 text-center">
                Inga sparade chattar än
              </p>
            ) : null}
          </nav>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-dark-500 text-center">
          {isAuthenticated ? 'Synkroniseras med ditt konto' : 'Sparas lokalt i webbläsaren'}
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
