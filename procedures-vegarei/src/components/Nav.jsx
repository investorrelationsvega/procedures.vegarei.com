import { Link, useLocation } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../lib/auth'

export default function Nav() {
  const { user, login, logout, isAuthed } = useAuth()
  const location = useLocation()

  const googleLogin = useGoogleLogin({
    onSuccess: login,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly openid email profile',
  })

  return (
    <nav className="border-b border-black bg-white sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-8 h-14 flex items-center justify-between">

        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-black">
            Vega REI
          </span>
          <span className="text-gray-300 text-sm">|</span>
          <span className="font-mono text-xs tracking-wider text-[#27474D] uppercase">
            Procedures
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-6">
          {isAuthed ? (
            <>
              <span className="text-xs text-[#566F69] font-mono">{user?.email}</span>
              <button
                onClick={logout}
                className="text-xs font-mono text-black border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => googleLogin()}
              className="text-xs font-mono text-black border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
            >
              Sign in to edit
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
