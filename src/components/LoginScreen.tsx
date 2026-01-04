import { useGoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function GoogleLoginButton({
  onSuccess,
  onError,
  isLoading
}: {
  onSuccess: (accessToken: string) => void
  onError: () => void
  isLoading: boolean
}) {
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
    onError: () => onError(),
  })

  return (
    <button
      onClick={() => googleLogin()}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      <span>{isLoading ? 'Loggar in...' : 'Logga in med Google'}</span>
    </button>
  )
}

interface LoginScreenProps {
  onSuccess?: () => void
}

function LoginScreen({ onSuccess }: LoginScreenProps) {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isGoogleConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'din-google-client-id-har')

  const handleGoogleSuccess = async (accessToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await login(accessToken)
      onSuccess?.()
    } catch (err) {
      setError('Inloggningen misslyckades. Försök igen.')
      console.error('Login failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Något gick fel med Google-inloggningen.')
  }

  return (
    <div className="flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full">
        {/* Simple login card */}
        <div className="paper-card rounded-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-serif">
              Magister T
            </h1>
            <p className="text-gray-600 text-sm">
              Logga in för att fortsätta
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {isGoogleConfigured ? (
            <GoogleLoginButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              isLoading={isLoading}
            />
          ) : (
            <div className="text-center">
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-700 text-sm">Google OAuth ej konfigurerat</p>
              </div>
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 bg-gray-300 text-gray-600 font-medium py-3.5 px-4 rounded-xl cursor-not-allowed opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#888" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#888" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#888" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#888" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Logga in med Google</span>
              </button>
            </div>
          )}

          <p className="text-gray-500 text-xs text-center mt-6">
            Genom att logga in godkänner du våra användarvillkor
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
