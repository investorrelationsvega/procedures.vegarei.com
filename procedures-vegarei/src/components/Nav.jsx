import { Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../lib/auth'

export default function Nav() {
  const { user, login, logout, isAuthed } = useAuth()

  const googleLogin = useGoogleLogin({
    onSuccess: login,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly openid email profile',
  })

  return (
    <nav className="border-b border-black bg-white sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <span className="text-xs font-bold tracking-widest uppercase text-black"
                style={{ fontFamily: "'Space Mono', monospace" }}>
            Vega REI
          </span>
          <span className="text-gray-300 text-sm">|</span>
          <span className="text-xs font-medium tracking-wider text-gray-500 uppercase">
            Procedures
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {isAuthed ? (
            <>
              <span className="text-xs text-gray-500">{user?.email}</span>
              <button
                onClick={logout}
                className="text-xs font-medium text-black border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => googleLogin()}
              className="text-xs font-medium text-black border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
            >
              Sign in to edit
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
