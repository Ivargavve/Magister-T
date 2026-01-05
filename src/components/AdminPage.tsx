import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import classroomBackground from '../assets/classlighter.jpg'

interface ChatItem {
  id: number
  title: string
  user_id: number
  message_count: number
  created_at: string
  updated_at: string
  first_message: string | null
}

// Anonymous animal names for users (100+ animals)
const ANIMALS = [
  // Skandinaviska däggdjur
  'Bäver', 'Räv', 'Björn', 'Varg', 'Älg', 'Hare', 'Grävling', 'Utter',
  'Lo', 'Ekorre', 'Igelkott', 'Rådjur', 'Vildsvin', 'Mård', 'Hermelin',
  'Järv', 'Lemmel', 'Ren', 'Mullvad', 'Näbbmus', 'Fladdermöss', 'Bison',
  // Fåglar
  'Uggla', 'Örn', 'Svan', 'Korp', 'Falk', 'Hök', 'Trast', 'Sparv',
  'Kråka', 'Skata', 'Duva', 'Mås', 'Lunnefågel', 'Papegoja', 'Kolibri',
  'Pelikan', 'Flamingo', 'Påfågel', 'Struts', 'Pingvin', 'Tukan', 'Kondor',
  // Marina djur
  'Säl', 'Fisk', 'Val', 'Delfin', 'Haj', 'Bläckfisk', 'Krabba', 'Hummer',
  'Sjöhäst', 'Manet', 'Sjöstjärna', 'Sköldpadda', 'Ål', 'Lax', 'Torsk',
  // Exotiska däggdjur
  'Lejon', 'Tiger', 'Elefant', 'Giraff', 'Zebra', 'Flodhäst', 'Noshörning',
  'Gepard', 'Leopard', 'Panda', 'Koala', 'Känguru', 'Gorilla', 'Schimpans',
  'Orangutang', 'Lemur', 'Sengångare', 'Myrslok', 'Bältdjur', 'Tapir',
  'Okapi', 'Surikat', 'Hyena', 'Schakal', 'Mungo', 'Vombat', 'Tasmansk',
  // Reptiler och groddjur
  'Krokodil', 'Alligator', 'Kameleont', 'Gecko', 'Leguan', 'Kobra',
  'Pytonorm', 'Groda', 'Padda', 'Salamander', 'Ödla', 'Sköldpadda',
  // Insekter och spindeldjur
  'Fjäril', 'Bi', 'Humla', 'Skalbagge', 'Trollslända', 'Gräshoppa',
  'Myra', 'Spindel', 'Skorpion', 'Bönsyrsa',
  // Husdjur och bondgård
  'Häst', 'Åsna', 'Kamel', 'Lama', 'Alpacka', 'Get', 'Får', 'Gris',
  'Ko', 'Tjur', 'Höna', 'Tupp', 'Anka', 'Gås', 'Kalkon',
  // Fler vilda djur
  'Varg', 'Coyote', 'Dingo', 'Lodjur', 'Puma', 'Jaguar', 'Ozelot',
  'Tvättbjörn', 'Skunk', 'Vessla', 'Iller', 'Chinchilla', 'Hamster'
]

const getAnimalName = (userId: number): string => {
  const index = userId % ANIMALS.length
  return `Anonym ${ANIMALS[index]}`
}

interface Message {
  id: number
  role: string
  content: string
  created_at: string
}

interface Stats {
  totalUsers: number
  totalChats: number
  totalMessages: number
  recentActivity: { date: string; chats: string; messages: string }[]
}

interface AdminPageProps {
  onBack: () => void
}

const API_URL = import.meta.env.VITE_API_URL || ''

function AdminPage({ onBack }: AdminPageProps) {
  const { token } = useAuth()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [token])

  const loadData = async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const [chatsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!chatsRes.ok || !statsRes.ok) {
        throw new Error('Failed to load admin data')
      }

      const chatsData = await chatsRes.json()
      const statsData = await statsRes.json()

      setChats(chatsData.chats || [])
      setStats(statsData.stats || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (chat: ChatItem) => {
    if (!token) return

    setSelectedChat(chat)
    setIsLoadingMessages(true)

    try {
      const res = await fetch(`${API_URL}/api/admin/chats/${chat.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to load messages')

      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Blurred background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur"
        style={{ backgroundImage: `url(${classroomBackground})` }}
      />

      {/* Content */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Header with stats */}
        <div className="bg-black/70 backdrop-blur-sm border-b border-white/10 px-6 py-3 flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Admin</h1>

          {/* Stats in header */}
          {stats && (
            <div className="flex items-center gap-6 ml-auto text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white/50">Användare</span>
                <span className="font-semibold text-white">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/50">Chattar</span>
                <span className="font-semibold text-white">{stats.totalChats}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/50">Meddelanden</span>
                <span className="font-semibold text-white">{stats.totalMessages}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white/70 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-200">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chats list */}
              <div className="bg-black/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h2 className="font-semibold text-white">Senaste chattar</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {chats.length === 0 ? (
                    <p className="px-4 py-8 text-center text-white/50">Inga chattar än</p>
                  ) : (
                    chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => loadMessages(chat)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{chat.title}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 whitespace-nowrap">
                                {getAnimalName(chat.user_id)}
                              </span>
                            </div>
                            {chat.first_message && (
                              <p className="text-sm text-white/50 truncate mt-1">
                                "{chat.first_message}"
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm text-white/60">{formatRelativeTime(chat.updated_at)}</p>
                            <p className="text-xs text-white/40">{chat.message_count} meddelanden</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat detail modal */}
        {selectedChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col">
              {/* Modal header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{selectedChat.title}</h3>
                  <p className="text-sm text-white/50">
                    {formatDate(selectedChat.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedChat(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-white/50 py-8">Inga meddelanden</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-500/20 border border-blue-500/30 ml-8'
                          : 'bg-white/10 border border-white/10 mr-8'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${
                          msg.role === 'user' ? 'text-blue-400' : 'text-white/60'
                        }`}>
                          {msg.role === 'user' ? 'Användare' : 'Magister T'}
                        </span>
                        <span className="text-xs text-white/40">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-white/90 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
