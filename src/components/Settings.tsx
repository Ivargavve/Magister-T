import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

const API_URL = import.meta.env.VITE_API_URL || ''

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  onClearAllChats: () => void
}

function Settings({ isOpen, onClose, onClearAllChats }: SettingsProps) {
  const { isAuthenticated, token, logout } = useAuth()
  const { t } = useLanguage()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmDeleteAccount, setShowConfirmDeleteAccount] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  if (!isOpen) return null

  const handleDeleteAllChats = () => {
    onClearAllChats()
    setShowConfirmDelete(false)
    onClose()
  }

  const handleDeleteAccount = async () => {
    if (!token) return

    setIsDeletingAccount(true)
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        logout()
        onClose()
      } else {
        console.error('Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      setIsDeletingAccount(false)
      setShowConfirmDeleteAccount(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 paper-card rounded-2xl shadow-card-hover animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-300/30">
          <h2 className="text-lg font-semibold text-gray-900">{t('settingsTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Data Management Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              {t('dataManagement')}
            </h3>
            <div className="space-y-3">
              {!isAuthenticated ? (
                <div className="px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-sm">
                  <p>{t('mustBeLoggedIn')}</p>
                </div>
              ) : (
                <>
                  {/* Delete all chats */}
                  {!showConfirmDelete ? (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
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
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                        <span className="text-sm font-medium">{t('deleteAllChats')}</span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
                      <p className="text-sm text-red-600">
                        {t('deleteConfirm')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAllChats}
                          className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                        >
                          {t('yesDeleteAll')}
                        </button>
                        <button
                          onClick={() => setShowConfirmDelete(false)}
                          className="flex-1 px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium transition-colors"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete account */}
                  {!showConfirmDeleteAccount ? (
                    <button
                      onClick={() => setShowConfirmDeleteAccount(true)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
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
                            d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                          />
                        </svg>
                        <span className="text-sm font-medium">{t('deleteAccount')}</span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-600/10 border border-red-600/20 space-y-3">
                      <p className="text-sm text-red-700 font-medium">
                        {t('areYouSure')}
                      </p>
                      <p className="text-xs text-red-600">
                        {t('deleteAccountWarning')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount}
                          className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium transition-colors"
                        >
                          {isDeletingAccount ? t('deleting') : t('yesDeleteAll')}
                        </button>
                        <button
                          onClick={() => setShowConfirmDeleteAccount(false)}
                          disabled={isDeletingAccount}
                          className="flex-1 px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium transition-colors"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
              {t('aboutMagisterT')}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {t('aboutDescription')}
            </p>
            <p className="text-xs text-gray-600">
              {t('version')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
