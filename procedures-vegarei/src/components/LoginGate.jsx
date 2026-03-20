import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../lib/auth'

export default function LoginGate({ children }) {
  const { isAuthed, loading, login } = useAuth()

  const googleLogin = useGoogleLogin({
    onSuccess: login,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly openid email profile',
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-gray-400 tracking-wider uppercase"
           style={{ fontFamily: "'Space Mono', monospace" }}>
          Authenticating…
        </p>
      </div>
    )
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-4 font-medium"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            Vega Companies
          </p>
          <h1 className="text-2xl font-bold text-black mb-2">
            Standard Operating Procedures
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Sign in with your @vegarei.com account to continue.
          </p>
          <button
            onClick={() => googleLogin()}
            className="text-sm font-medium text-black border-2 border-black px-6 py-2.5 hover:bg-black hover:text-white transition-colors"
          >
            Sign in with Google
          </button>
          <p className="text-[10px] text-gray-400 mt-6 tracking-wider"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            Access restricted to @vegarei.com accounts
          </p>
        </div>
      </div>
    )
  }

  return children
}
