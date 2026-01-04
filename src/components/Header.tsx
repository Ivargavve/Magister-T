import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  onSettingsClick: () => void
  onLoginClick: () => void
}

function Header({ onSettingsClick, onLoginClick }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setShowUserMenu(false)
    logout()
  }

  // Get user initials for fallback
  const getUserInitials = () => {
    if (!user?.name) return '?'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0]
    }
    return names[0][0] || '?'
  }

  return (
    <header className="flex items-center justify-end px-6 py-4 border-b border-white/5">
      {/* Right side: Settings and User menu */}
      <div className="flex items-center gap-2">
        {/* Settings button */}
        <button
          onClick={onSettingsClick}
          className="p-2.5 rounded-xl text-dark-400 hover:text-dark-200 hover:bg-white/5 transition-all duration-200"
          title="Inställningar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* User menu or Login button */}
        {isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all duration-200"
              title={user?.name || 'Användarmeny'}
            >
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name || 'Användare'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-magister-500/50 transition-colors"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-dark-200 text-sm font-medium border-2 border-transparent hover:border-magister-500/50 transition-colors">
                  {getUserInitials()}
                </div>
              )}
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-dark-800 border border-dark-700 shadow-xl z-50 overflow-hidden animate-scale-in">
                {/* User info */}
                <div className="px-4 py-3 border-b border-dark-700">
                  <div className="flex items-center gap-3">
                    {user?.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.name || 'Användare'}
                        className="w-10 h-10 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center text-dark-200 font-medium">
                        {getUserInitials()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-100 truncate">
                        {user?.name || 'Användare'}
                      </p>
                      <p className="text-xs text-dark-400 truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700/50 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                      />
                    </svg>
                    Logga ut
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-magister-500 to-magister-600 hover:from-magister-400 hover:to-magister-500 text-white text-sm font-medium transition-all duration-200 hover-lift shadow-glow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            Logga in
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
