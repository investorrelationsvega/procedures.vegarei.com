import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const mono = { fontFamily: "'Space Mono', monospace" }

export default function Nav() {
  const { user, login, logout, isAuthed } = useAuth()

  return (
    <nav style={{ background: '#1a2e35', borderBottom: '1px solid #2a4a52' }} className="sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-8 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          {/* VEGA wordmark */}
          <svg viewBox="0 0 520 160" style={{ height: 18, fill: '#ffffff' }}>
            <path d="M0,10 L50,10 L100,150 L150,10 L200,10 L115,160 L85,160 Z" />
            <path d="M210,10 L340,10 L340,40 L250,40 L250,70 L330,70 L330,100 L250,100 L250,130 L340,130 L340,160 L210,160 Z" />
            <path d="M420,90 L420,130 L490,130 L490,100 L460,100 L460,90 Z M360,10 L490,10 L490,40 L400,40 L400,70 L490,70 L490,90 L530,90 L530,130 L530,160 L420,160 L350,160 L350,130 L400,130 L400,100 L360,100 Z" />
          </svg>
        </Link>

        <div className="flex items-center gap-5">
          {isAuthed ? (
            <>
              <span className="flex items-center gap-1.5">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6A8F78', display: 'inline-block' }} />
                <span style={{ ...mono, fontSize: 10, color: '#8aa8a0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Online</span>
              </span>
              <span style={{ ...mono, fontSize: 10, color: '#6b8a82' }}>{user?.email}</span>
              <button
                onClick={logout}
                style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0d0cc', border: '1px solid #3a5a60', padding: '4px 12px', background: 'transparent', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2a4a52' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => login()}
              style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0d0cc', border: '1px solid #3a5a60', padding: '4px 12px', background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2a4a52' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
