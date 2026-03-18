import { createContext, useContext, useState, useCallback } from 'react'
import { googleLogout } from '@react-oauth/google'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(null)
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (credentialResponse) => {
    setLoading(true)
    try {
      // credentialResponse.access_token comes from useGoogleLogin (implicit flow)
      const accessToken = credentialResponse.access_token

      // Fetch basic profile
      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const profile = await profileRes.json()

      // Only allow @vegarei.com accounts
      if (!profile.email?.endsWith('@vegarei.com')) {
        alert('Access restricted to @vegarei.com accounts.')
        googleLogout()
        return
      }

      setToken(accessToken)
      setUser(profile)
    } catch (err) {
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    googleLogout()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
