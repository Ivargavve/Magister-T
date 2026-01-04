import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  name: string
  email: string
  profile_image: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (googleToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'magister_t_token'
const USER_KEY = 'magister_t_user'
const API_URL = import.meta.env.VITE_API_URL || ''

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (googleToken: string) => {
    try {
      // Use Render backend if available, otherwise local Netlify function
      const authEndpoint = API_URL ? `${API_URL}/api/auth/google` : '/api/auth-google'
      const response = await fetch(authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken }),
      })

      if (!response.ok) {
        throw new Error('Inloggningen misslyckades')
      }

      const data = await response.json()

      // Normalize user data (backend sends profileImage, we use profile_image)
      const normalizedUser: User = {
        name: data.user.name,
        email: data.user.email,
        profile_image: data.user.profileImage || data.user.profile_image || '',
      }

      // Store JWT token and user info
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))

      setToken(data.token)
      setUser(normalizedUser)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
