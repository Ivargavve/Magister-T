import { useGoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import avatar from '../assets/magister-t/avatar.png'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Separate component that uses the hook - only rendered when Google is configured
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
      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3.5 px-4 rounded-xl transition-all duration-200 hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
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

  // Check if Google Client ID is configured
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
      <div className="max-w-md w-full animate-scale-in">
        {/* Logo and branding */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150" />

            {/* Portrait */}
            <div className="relative w-28 h-28 rounded-3xl overflow-hidden portrait-glow glow-subtle animate-float">
              <img
                src={avatar}
                alt="Magister T"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-dark-100 mb-2">
            Välkommen till <span className="gradient-text">Magister T</span>
          </h1>
          <p className="text-dark-400 text-lg">
            Din guide till att tänka själv
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card rounded-2xl p-8 glow-subtle">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-dark-100 mb-2">
              Kom igång
            </h2>
            <p className="text-dark-400 text-sm">
              Logga in för att börja utforska och lära dig nya saker
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
              <p className="text-red-400 text-sm text-center">{error}</p>
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
              <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-400 text-sm mb-2 font-medium">Google OAuth ej konfigurerat</p>
                <p className="text-dark-400 text-xs">
                  Lagg till <code className="bg-dark-700 px-1.5 py-0.5 rounded text-emerald-400">VITE_GOOGLE_CLIENT_ID</code> i <code className="bg-dark-700 px-1.5 py-0.5 rounded text-emerald-400">.env.local</code>
                </p>
              </div>
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 bg-dark-700 text-dark-400 font-medium py-3.5 px-4 rounded-xl cursor-not-allowed opacity-50"
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

          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-dark-500 text-xs text-center leading-relaxed">
              Genom att logga in godkänner du våra{' '}
              <span className="text-dark-400 hover:text-emerald-400 cursor-pointer transition-colors">
                användarvillkor
              </span>{' '}
              och{' '}
              <span className="text-dark-400 hover:text-emerald-400 cursor-pointer transition-colors">
                integritetspolicy
              </span>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            }
            title="Lär dig"
            description="Programmering"
          />
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            }
            title="AI-driven"
            description="Assistans"
          />
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            }
            title="Tänk"
            description="Själv"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-dark-500 text-sm">
            Har du frågor?{' '}
            <span className="text-emerald-500 hover:text-emerald-400 cursor-pointer transition-colors">
              Kontakta oss
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="glass-light rounded-xl p-4 text-center">
      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-2">
        {icon}
      </div>
      <p className="text-xs font-medium text-dark-200">{title}</p>
      <p className="text-xs text-dark-500">{description}</p>
    </div>
  )
}

export default LoginScreen
