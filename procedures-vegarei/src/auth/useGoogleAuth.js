import { useState, useCallback, useEffect, useRef } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.file'

export default function useGoogleAuth() {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const clientRef = useRef(null)
  const scriptLoadedRef = useRef(false)

  const isAuthenticated = !!accessToken

  // Load Google Identity Services script
  useEffect(() => {
    if (scriptLoadedRef.current) return

    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existing) {
      scriptLoadedRef.current = true
      initClient()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      scriptLoadedRef.current = true
      initClient()
    }
    document.head.appendChild(script)
  }, [])

  function initClient() {
    if (!window.google || !CLIENT_ID) return

    clientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: handleTokenResponse,
    })
  }

  async function handleTokenResponse(response) {
    if (response.error) {
      console.error('OAuth error:', response.error)
      return
    }

    const token = response.access_token
    setAccessToken(token)

    // Fetch user profile from the ID token
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`)
      const profile = await res.json()
      setUser({
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      })
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }
  }

  const signIn = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.requestAccessToken()
    }
  }, [])

  const signOut = useCallback(() => {
    if (accessToken) {
      window.google?.accounts.oauth2.revoke(accessToken, () => {
        setAccessToken(null)
        setUser(null)
      })
    } else {
      setAccessToken(null)
      setUser(null)
    }
  }, [accessToken])

  return { user, accessToken, signIn, signOut, isAuthenticated }
}
