import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
  onNewChat: () => void
  onSelectChat?: (id: string) => void
}

function Sidebar({ onNewChat, onSelectChat }: SidebarProps) {
  const { isAuthenticated } = useAuth()
  return (
    <aside className="w-64 h-full flex flex-col glass border-r border-white/5">
      {/* New chat button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all duration-200 hover-lift glow-emerald"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span>Ny chatt</span>
        </button>
      </div>

      {/* Chat history section */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {isAuthenticated ? (
          <>
            <div className="mb-3">
              <h3 className="px-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                Chatthistorik
              </h3>
            </div>
            <nav className="space-y-1">
              {/* Placeholder - kommer fyllas med data fran databas */}
              <p className="px-3 py-4 text-sm text-dark-500 text-center">
                Inga sparade chattar an
              </p>
            </nav>
          </>
        ) : (
          <div className="px-3 py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-dark-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-sm text-dark-400 mb-2">Gastlage</p>
            <p className="text-xs text-dark-500 leading-relaxed">
              Dina chattar sparas bara i denna session. Logga in for att spara din historik permanent.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-dark-500 text-center">
          {isAuthenticated ? 'Synkroniseras med ditt konto' : 'Lokal session'}
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
