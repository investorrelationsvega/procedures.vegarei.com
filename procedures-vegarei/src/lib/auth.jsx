import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { googleLogout } from '@react-oauth/google'

const AuthContext = createContext(null)

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents openid email profile'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(null)
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true) // start true to check for redirect token

  // On mount, check if we're returning from a Google OAuth redirect
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      if (accessToken) {
        // Clean the URL hash
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        // Process the token
        processToken(accessToken)
        return
      }
    }
    setLoading(false)
  }, [])

  async function processToken(accessToken) {
    setLoading(true)
    try {
      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!profileRes.ok) {
        throw new Error(`Profile fetch failed: ${profileRes.status}`)
      }
      const profile = await profileRes.json()

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
  }

  const initiateLogin = useCallback(() => {
    const redirectUri = window.location.origin + '/'
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: SCOPES,
      include_granted_scopes: 'true',
      prompt: 'consent',
    }).toString()
    window.location.href = authUrl
  }, [])

  const logout = useCallback(() => {
    googleLogout()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login: initiateLogin, logout, loading, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
